const VENDORS = {
  predicta: {
    url: "https://dev.predictasearch.com/api/search",
    env: "PREDICTA_API_KEY",
    costINR: 87.73,
    monthlyCap: 30,
    headers: (k) => ({ "x-api-key": k }),
    body: (q, t, o) => ({
      query: q,
      query_type: t,
      networks: o.networks ?? ["all"]
    }),
    count: (p) => Array.isArray(p) ? p.length : 0
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
      // The vendor allows 25-80s, and this is a real filter rather than a
      // safety margin: a module that misses the window is skipped, and its
      // absence is indistinguishable from a module with no result.
      //
      // Set to the maximum deliberately. Two runs on the same address five
      // minutes apart returned 36 and then 35 modules — same vendor, same
      // query, different answer, because slow modules fell outside the 60s
      // window. Latency is not the constraint here; a quietly incomplete
      // record is, so buy every module the vendor will give.
      timeout: o.timeout ?? 80,
      exact_match: o.exact_match ?? true,
      premium: o.premium ?? false,
      premium_modules_only: false
    }),
    count: (p) => Array.isArray(p) ? p.length : 0
  },
  behind_the_email: {
    url: "https://api.behindtheemail.com/v1/search",
    env: "BTE_API_KEY",
    costINR: 0.34,
    monthlyCap: 6e3,
    headers: (k) => ({ Authorization: `Bearer ${k}` }),
    body: (q, _t, o) => ({
      email: q,
      ...o.selectedProviders ? { selectedProviders: o.selectedProviders } : {},
      ...o.excludedProviders ? { excludedProviders: o.excludedProviders } : {}
    }),
    count: (p) => Object.keys(p?.data?.profile ?? {}).length
  }
};
function vendorConfigured(vendor) {
  return Boolean(process.env[VENDORS[vendor].env]);
}
function configuredVendors() {
  return Object.keys(VENDORS).filter(vendorConfigured);
}
async function raceFetchVendor(input, hooks) {
  const spec = VENDORS[input.vendor];
  if (!spec) return { ok: false, error: `unknown vendor: ${input.vendor}` };
  const key = process.env[spec.env];
  if (!key) return { ok: false, error: `${spec.env} not configured` };
  if (await hooks.capReached(input.vendor, spec.monthlyCap)) {
    return {
      ok: false,
      error: `monthly cap reached for ${input.vendor} (${spec.monthlyCap}/${spec.monthlyCap})`
    };
  }
  try {
    const res = await fetch(spec.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...spec.headers(key) },
      body: JSON.stringify(
        spec.body(input.query, input.query_type ?? "email", input.options ?? {})
      ),
      // Must comfortably exceed the vendor's own 80s timeout, or we abort a
      // call that was about to succeed and record it as a failure.
      signal: AbortSignal.timeout(12e4)
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      return { ok: false, status: res.status, error: `HTTP ${res.status}`, payload: void 0 };
    }
    await hooks.recordSpend(input.vendor, spec.costINR);
    return {
      ok: true,
      status: res.status,
      itemCount: spec.count(payload),
      payload,
      // unmodified — this is the part that matters
      creditBalanceAfter: res.headers.get("x-credit-balance") ?? void 0,
      costINR: spec.costINR,
      error: null
    };
  } catch (e) {
    return { ok: false, error: `${e?.name ?? "Error"}: ${e?.message ?? String(e)}` };
  }
}
async function osintCredits() {
  const key = process.env.OSINT_INDUSTRIES_API_KEY;
  if (!key) return { ok: false, error: "OSINT_INDUSTRIES_API_KEY not configured" };
  try {
    const res = await fetch("https://api.osint.industries/misc/credits", {
      headers: { "api-key": key },
      signal: AbortSignal.timeout(2e4)
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true, credits: body?.credits };
  } catch (e) {
    return { ok: false, error: `${e?.name}: ${e?.message}` };
  }
}
async function bteVersion() {
  const key = process.env.BTE_API_KEY;
  if (!key) return { ok: false, error: "BTE_API_KEY not configured" };
  try {
    const res = await fetch("https://api.behindtheemail.com/v1", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(2e4)
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}${res.status === 401 ? " \u2014 key rejected" : ""}` };
    }
    return { ok: true, version: body?.version ?? body?.data?.version ?? JSON.stringify(body)?.slice(0, 80) };
  } catch (e) {
    return { ok: false, error: `${e?.name}: ${e?.message}` };
  }
}
const RACE_FETCH_VENDOR_TOOL = {
  name: "race_fetch_vendor",
  description: "Call one identity-resolution vendor and return its raw, unmodified response. The host holds the API credentials and enforces monthly caps; the caller never sees a key. Returns the vendor payload exactly as received \u2014 do not normalise, filter or reshape it, because the skill's own guards must see the original.",
  input_schema: {
    type: "object",
    properties: {
      vendor: {
        type: "string",
        enum: ["predicta", "osint_industries", "behind_the_email"],
        description: "Which vendor to call."
      },
      query: { type: "string", description: "The email address to resolve." },
      query_type: {
        type: "string",
        enum: ["email", "phone", "username", "name"],
        default: "email"
      },
      options: {
        type: "object",
        description: "Vendor-specific narrowing. predicta: {networks:[...]} (default ['all']). osint_industries: {timeout:80, premium:false}. behind_the_email: {selectedProviders:[...]} or {excludedProviders:[...]}.",
        additionalProperties: true
      }
    },
    required: ["vendor", "query"]
  }
};
export {
  RACE_FETCH_VENDOR_TOOL,
  VENDORS,
  bteVersion,
  configuredVendors,
  osintCredits,
  raceFetchVendor,
  vendorConfigured
};
