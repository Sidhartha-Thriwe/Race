/**
 * Vendor selection — POLICY, not method.
 *
 * This is the one piece of the skill deliberately duplicated in the backend,
 * and it is worth being clear about why. Which vendors a subject is worth is a
 * budget decision: a ₹50L retention subject justifies all three, a lead-gen
 * sweep justifies the ₹0.34 screening call and nothing else. The backend
 * already owns the budget — it holds the API keys, the monthly caps and the
 * spend ledger — so it is the only place that can answer the question honestly.
 *
 * It is also small and stable: four sets, three routes, four regexes. Contrast
 * guards.py and the normalisers, which are ~1,200 lines carrying five subjects'
 * worth of bug fixes and 82 tests. Those stay in the skill, in one copy.
 *
 * Kept in step with scripts/resolve.py — select_vendors(), VENDOR_SETS, ROUTING
 * and TICKET_BANDS. If you change one, change the other.
 */

import type { VendorName } from "./vendors.js";

export const VENDOR_SETS: Record<string, VendorName[]> = {
  // Everything available. Highest cost, highest coverage.
  full: ["predicta", "osint_industries", "behind_the_email"],
  // Depth without the broad sweep — the two carrying paid-tier and engagement
  // fields, which is what dormancy detection actually needs.
  depth: ["osint_industries", "behind_the_email"],
  // Broad coverage plus the cheap structured layer. Skips the deepest vendor.
  breadth: ["predicta", "behind_the_email"],
  // Screening pass. One call, negligible cost — use it to decide whether a
  // subject is worth the expensive vendors at all.
  screen: ["behind_the_email"],
};

const ROUTING: Record<string, Record<string, string>> = {
  customer_insight: { high: "full", mid: "depth", low: "screen", default: "depth" },
  lead_qualification: { high: "depth", mid: "breadth", low: "screen", default: "breadth" },
  lead_gen: { default: "screen" },
};

// Ticket-price strings from the Internal Insight module config, bucketed.
// Anything unmatched falls to the use case's default rather than guessing high —
// guessing high is how a screening sweep quietly spends ₹150 a head.
const TICKET_BANDS: [RegExp, string][] = [
  [/₹?\s*(5\d|[6-9]\d|\d{3,})\s*L|crore|1\s*Cr/i, "high"],
  [/₹?\s*(2\d|3\d|4\d)\s*[-–]?\s*\d*\s*L/i, "mid"],
  [/₹?\s*\d{1,2}\s*[-–]\s*\d{1,2}\s*L/i, "mid"],
  [/₹?\s*\d{1,2}\s*L|lakh/i, "low"],
];

export function ticketBand(ticketPrice?: string): string | null {
  for (const [rx, band] of TICKET_BANDS) {
    if (rx.test(String(ticketPrice ?? ""))) return band;
  }
  return null;
}

export interface Selection {
  vendors: VendorName[];
  basis: string;
}

export function selectVendors(opts: {
  useCase?: string;
  ticketBand?: string;
  explicit?: VendorName[];
  available: VendorName[]; // configured keys — an unconfigured vendor is not a choice
}): Selection {
  if (opts.explicit?.length) {
    return {
      vendors: opts.explicit.filter((v) => opts.available.includes(v)),
      basis: `explicit selection (${opts.explicit.join(", ")})`,
    };
  }

  const table = ROUTING[opts.useCase ?? ""] ?? {};
  const band = ticketBand(opts.ticketBand);
  const setName = table[band ?? ""] ?? table.default ?? "depth";
  const chosen = VENDOR_SETS[setName].filter((v) => opts.available.includes(v));

  const skipped = VENDOR_SETS[setName].filter((v) => !opts.available.includes(v));
  const basis =
    `use case '${opts.useCase ?? "unspecified"}'` +
    (band ? `, ticket band '${band}'` : "") +
    ` → set '${setName}'` +
    (skipped.length ? ` (not configured, skipped: ${skipped.join(", ")})` : "");

  return { vendors: chosen, basis };
}
