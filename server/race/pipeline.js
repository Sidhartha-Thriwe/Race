import { raceFetchVendor, configuredVendors } from "./vendors.js";
import { selectVendors } from "./routing.js";
import { capReached, recordSpend } from "./store.js";
const note = (steps, level, msg, detail) => steps.push({ t: (/* @__PURE__ */ new Date()).toISOString(), level, msg, detail });
async function fetchStage(opts) {
  const steps = [];
  const available = configuredVendors();
  const { vendors, basis } = selectVendors({
    useCase: opts.useCase,
    ticketBand: opts.ticketBand,
    explicit: opts.explicitVendors,
    available
  });
  note(steps, "info", `Vendor set: ${vendors.join(", ") || "none"}`, { basis });
  if (!vendors.length) {
    note(steps, "error", "No vendor is both selected and configured", {
      available,
      hint: "add at least one vendor API key in Settings \u2192 Secrets"
    });
    return { vendors, basis, raw: {}, vendorsCalled: [], costINR: 0, steps, empty: true };
  }
  const raw = {};
  const vendorsCalled = [];
  let costINR = 0;
  for (const vendor of vendors) {
    const result = await raceFetchVendor(
      { vendor, query: opts.email, query_type: "email" },
      { capReached, recordSpend }
    );
    vendorsCalled.push({
      vendor,
      ok: result.ok,
      itemCount: result.itemCount,
      costINR: result.costINR,
      error: result.error
    });
    if (!result.ok) {
      note(steps, "warn", `${vendor} did not answer: ${result.error}`);
      continue;
    }
    raw[vendor] = result.payload;
    costINR += result.costINR ?? 0;
    note(steps, "info", `${vendor}: ${result.itemCount} item(s)`, {
      status: result.status,
      creditBalanceAfter: result.creditBalanceAfter
    });
    if (result.itemCount === 0) {
      note(steps, "warn", `${vendor} returned 200 with zero items`, {
        note: "an empty result, a person with no accounts and a mistyped address are indistinguishable here \u2014 check the address before spending more"
      });
    }
  }
  const anyItems = vendorsCalled.some((v) => v.ok && (v.itemCount ?? 0) > 0);
  if (!anyItems) {
    note(steps, "error", "Every vendor returned nothing", {
      hint: "most often a mistyped or unused address, not a person with no footprint"
    });
  }
  return {
    vendors,
    basis,
    raw,
    vendorsCalled,
    costINR: Math.round(costINR * 100) / 100,
    steps,
    empty: !anyItems
  };
}
export {
  fetchStage
};
