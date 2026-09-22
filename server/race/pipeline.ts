/**
 * Stage 1 of the pipeline: get the data.
 *
 * The CTA starts this. No model is involved — the backend picks the vendor set
 * from the campaign's use case and ticket band, calls each vendor, and keeps
 * the raw payloads. Deterministic, and the same inputs always produce the same
 * calls, which is what makes a spend ledger mean anything.
 *
 * Stage 2 (normalisation — guards, vendor normalisers, merge) is separate on
 * purpose and lives in the skill, where the 82 tests are.
 */

import { raceFetchVendor, configuredVendors, type VendorName } from "./vendors.js";
import { selectVendors } from "./routing.js";
import { capReached, recordSpend, type RunRecord, type RunStep } from "./store.js";

export interface FetchStageResult {
  vendors: VendorName[];
  basis: string;
  raw: Record<string, unknown>;
  vendorsCalled: RunRecord["vendorsCalled"];
  costINR: number;
  steps: RunStep[];
  /** True when nothing usable came back — the caller should stop, not synthesise. */
  empty: boolean;
}

const note = (steps: RunStep[], level: RunStep["level"], msg: string, detail?: unknown) =>
  steps.push({ t: new Date().toISOString(), level, msg, detail });

export async function fetchStage(opts: {
  email: string;
  useCase?: string;
  ticketBand?: string;
  explicitVendors?: VendorName[];
}): Promise<FetchStageResult> {
  const steps: RunStep[] = [];
  const available = configuredVendors();

  const { vendors, basis } = selectVendors({
    useCase: opts.useCase,
    ticketBand: opts.ticketBand,
    explicit: opts.explicitVendors,
    available,
  });
  note(steps, "info", `Vendor set: ${vendors.join(", ") || "none"}`, { basis });

  if (!vendors.length) {
    note(steps, "error", "No vendor is both selected and configured", {
      available,
      hint: "add at least one vendor API key in Settings → Secrets",
    });
    return { vendors, basis, raw: {}, vendorsCalled: [], costINR: 0, steps, empty: true };
  }

  const raw: Record<string, unknown> = {};
  const vendorsCalled: RunRecord["vendorsCalled"] = [];
  let costINR = 0;

  // Sequential rather than parallel: the caps are per-vendor and small, and a
  // burst that trips a 429 costs more than the few seconds saved.
  for (const vendor of vendors) {
    const result = await raceFetchVendor(
      { vendor, query: opts.email, query_type: "email" },
      { capReached, recordSpend },
    );

    vendorsCalled.push({
      vendor,
      ok: result.ok,
      itemCount: result.itemCount,
      costINR: result.costINR,
      error: result.error,
    });

    if (!result.ok) {
      // A refusal is a legitimate answer — a cap reached, a key missing, a 429.
      // Carry on with the vendors that did respond and record the gap.
      note(steps, "warn", `${vendor} did not answer: ${result.error}`);
      continue;
    }

    raw[vendor] = result.payload;
    costINR += result.costINR ?? 0;
    note(steps, "info", `${vendor}: ${result.itemCount} item(s)`, {
      status: result.status,
      creditBalanceAfter: result.creditBalanceAfter,
    });

    if (result.itemCount === 0) {
      note(steps, "warn", `${vendor} returned 200 with zero items`, {
        note: "an empty result, a person with no accounts and a mistyped address " +
              "are indistinguishable here — check the address before spending more",
      });
    }
  }

  const anyItems = vendorsCalled.some((v) => v.ok && (v.itemCount ?? 0) > 0);
  if (!anyItems) {
    note(steps, "error", "Every vendor returned nothing", {
      hint: "most often a mistyped or unused address, not a person with no footprint",
    });
  }

  return {
    vendors,
    basis,
    raw,
    vendorsCalled,
    costINR: Math.round(costINR * 100) / 100,
    steps,
    empty: !anyItems,
  };
}
