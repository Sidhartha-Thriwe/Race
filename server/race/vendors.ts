/**
 * The host half of the `race_fetch_vendor` contract.
 *
 * This file holds the API keys, makes one HTTPS call, and returns the vendor's
 * response UNMODIFIED. That last word is the whole design: every guard, every
 * normalisation and every piece of RACE judgement lives in the skill, which is
 * tested. The moment this file starts trimming payloads, the guards run in two
 * places and only one of them has tests.
 *
 * See RACE-Engine-Skills/race-identity-resolution/references/host-integration.md
 */

export type VendorName = "predicta" | "osint_industries" | "behind_the_email";

export interface FetchVendorInput {
  vendor: VendorName;
  query: string;
  query_type?: "email" | "phone" | "username" | "name";
  options?: Record<string, any>;
}

export interface FetchVendorResult {
  ok: boolean;
  status?: number;
  itemCount?: number;
  payload?: unknown;
  creditBalanceAfter?: string;
  costINR?: number;
  error: string | null;
}

interface VendorSpec {
  url: string;
  env: string;
  costINR: number;
  /** Monthly plan cap. Enforced here because the skill cannot see the ledger. */
  monthlyCap: number;
  headers: (key: string) => Record<string, string>;
  body: (q: string, t: string, o: Record<string, any>) => unknown;
  /**
   * Item count on the raw shape, while it is still known. A 200 with an empty
   * body is the failure mode that looks like success — indistinguishable from a
   * person with no accounts and from a mistyped address. The skill reads this
   * count rather than inferring emptiness after the fact.
   */
  count: (payload: any) => number;
}

export const VENDORS: Record<VendorName, VendorSpec> = {
  predicta: {
    url: "https://dev.predictasearch.com/api/search",
    env: "PREDICTA_API_KEY",
    costINR: 87.73,
    monthlyCap: 30,
    headers: (k) => ({ "x-api-key": k }),
    body: (q, t, o) => ({
      query: q,
      query_type: t,
      networks: o.networks ?? ["all"],
    }),
    count: (p) => (Array.isArray(p) ? p.length : 0),
  },
  osint_industries: {
    url: "https://api.osint.industries/v2/request",
    env: "OSINT_INDUSTRIES_API_KEY",
    costINR: 62.54,
    monthlyCap: 100,
    headers: (k) => ({ "api-key": k }),
    body: (q, t, o) => ({
      type: t,
      query: q,
      // 25-80s, and a real filter: a module that misses the window is skipped
      // and its absence is indistinguishable from a module with no result.
      timeout: o.timeout ?? 60,
      exact_match: o.exact_match ?? true,
      premium: o.premium ?? false,
      premium_modules_only: false,
    }),
    count: (p) => (Array.isArray(p) ? p.length : 0),
  },
  behind_the_email: {
    url: "https://api.behindtheemail.com/v1/search",
    env: "BTE_API_KEY",
    costINR: 0.34,
    monthlyCap: 6000,
    headers: (k) => ({ Authorization: `Bearer ${k}` }),
    body: (q, _t, o) => ({
      email: q,
      ...(o.selectedProviders ? { selectedProviders: o.selectedProviders } : {}),
      ...(o.excludedProviders ? { excludedProviders: o.excludedProviders } : {}),
    }),
    count: (p) => Object.keys(p?.data?.profile ?? {}).length,
  },
};

export function vendorConfigured(vendor: VendorName): boolean {
  return Boolean(process.env[VENDORS[vendor].env]);
}

export function configuredVendors(): VendorName[] {
  return (Object.keys(VENDORS) as VendorName[]).filter(vendorConfigured);
}

/**
 * Make the call. Caps and spend are the caller's to supply, so that the ledger
 * stays in one place rather than being re-implemented per vendor.
 */
export async function raceFetchVendor(
  input: FetchVendorInput,
  hooks: {
    capReached: (v: VendorName, cap: number) => Promise<boolean>;
    recordSpend: (v: VendorName, costINR: number) => Promise<void>;
  },
): Promise<FetchVendorResult> {
  const spec = VENDORS[input.vendor];
  if (!spec) return { ok: false, error: `unknown vendor: ${input.vendor}` };

  const key = process.env[spec.env];
  if (!key) return { ok: false, error: `${spec.env} not configured` };

  if (await hooks.capReached(input.vendor, spec.monthlyCap)) {
    // Refusal is a legitimate answer, not an exception. The skill continues
    // with the vendors that did respond and records the gap.
    return {
      ok: false,
      error: `monthly cap reached for ${input.vendor} (${spec.monthlyCap}/${spec.monthlyCap})`,
    };
  }

  try {
    const res = await fetch(spec.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...spec.headers(key) },
      body: JSON.stringify(
        spec.body(input.query, input.query_type ?? "email", input.options ?? {}),
      ),
      signal: AbortSignal.timeout(90_000),
    });

    const payload = await res.json().catch(() => null);

    if (!res.ok) {
      // Vendor error bodies can echo the query back; keep the status, drop the body.
      return { ok: false, status: res.status, error: `HTTP ${res.status}`, payload: undefined };
    }

    await hooks.recordSpend(input.vendor, spec.costINR);

    return {
      ok: true,
      status: res.status,
      itemCount: spec.count(payload),
      payload, // unmodified — this is the part that matters
      creditBalanceAfter: res.headers.get("x-credit-balance") ?? undefined,
      costINR: spec.costINR,
      error: null,
    };
  } catch (e: any) {
    return { ok: false, error: `${e?.name ?? "Error"}: ${e?.message ?? String(e)}` };
  }
}

/** Free, and a genuine credential check as well as a live balance. */
export async function osintCredits(): Promise<{ ok: boolean; credits?: number; error?: string }> {
  const key = process.env.OSINT_INDUSTRIES_API_KEY;
  if (!key) return { ok: false, error: "OSINT_INDUSTRIES_API_KEY not configured" };
  try {
    const res = await fetch("https://api.osint.industries/misc/credits", {
      headers: { "api-key": key },
      signal: AbortSignal.timeout(20_000),
    });
    const body: any = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true, credits: body?.credits };
  } catch (e: any) {
    return { ok: false, error: `${e?.name}: ${e?.message}` };
  }
}

export const RACE_FETCH_VENDOR_TOOL = {
  name: "race_fetch_vendor",
  description:
    "Call one identity-resolution vendor and return its raw, unmodified response. " +
    "The host holds the API credentials and enforces monthly caps; the caller never sees a key. " +
    "Returns the vendor payload exactly as received — do not normalise, filter or reshape it, " +
    "because the skill's own guards must see the original.",
  input_schema: {
    type: "object" as const,
    properties: {
      vendor: {
        type: "string",
        enum: ["predicta", "osint_industries", "behind_the_email"],
        description: "Which vendor to call.",
      },
      query: { type: "string", description: "The email address to resolve." },
      query_type: {
        type: "string",
        enum: ["email", "phone", "username", "name"],
        default: "email",
      },
      options: {
        type: "object",
        description:
          "Vendor-specific narrowing. predicta: {networks:[...]} (default ['all']). " +
          "osint_industries: {timeout:60, premium:false}. " +
          "behind_the_email: {selectedProviders:[...]} or {excludedProviders:[...]}.",
        additionalProperties: true,
      },
    },
    required: ["vendor", "query"],
  },
};
