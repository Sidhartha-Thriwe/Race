const VENDOR_SETS = {
  // Everything available. Highest cost, highest coverage.
  full: ["predicta", "osint_industries", "behind_the_email"],
  // Depth without the broad sweep — the two carrying paid-tier and engagement
  // fields, which is what dormancy detection actually needs.
  depth: ["osint_industries", "behind_the_email"],
  // Broad coverage plus the cheap structured layer. Skips the deepest vendor.
  breadth: ["predicta", "behind_the_email"],
  // Screening pass. One call, negligible cost — use it to decide whether a
  // subject is worth the expensive vendors at all.
  screen: ["behind_the_email"]
};
const ROUTING = {
  customer_insight: { high: "full", mid: "depth", low: "screen", default: "depth" },
  lead_qualification: { high: "depth", mid: "breadth", low: "screen", default: "breadth" },
  lead_gen: { default: "screen" }
};
const TICKET_BANDS = [
  [/₹?\s*(5\d|[6-9]\d|\d{3,})\s*L|crore|1\s*Cr/i, "high"],
  [/₹?\s*(2\d|3\d|4\d)\s*[-–]?\s*\d*\s*L/i, "mid"],
  [/₹?\s*\d{1,2}\s*[-–]\s*\d{1,2}\s*L/i, "mid"],
  [/₹?\s*\d{1,2}\s*L|lakh/i, "low"]
];
function ticketBand(ticketPrice) {
  for (const [rx, band] of TICKET_BANDS) {
    if (rx.test(String(ticketPrice ?? ""))) return band;
  }
  return null;
}
function selectVendors(opts) {
  if (opts.explicit?.length) {
    return {
      vendors: opts.explicit.filter((v) => opts.available.includes(v)),
      basis: `explicit selection (${opts.explicit.join(", ")})`
    };
  }
  const table = ROUTING[opts.useCase ?? ""] ?? {};
  const band = ticketBand(opts.ticketBand);
  const setName = table[band ?? ""] ?? table.default ?? "depth";
  const chosen = VENDOR_SETS[setName].filter((v) => opts.available.includes(v));
  const skipped = VENDOR_SETS[setName].filter((v) => !opts.available.includes(v));
  const basis = `use case '${opts.useCase ?? "unspecified"}'` + (band ? `, ticket band '${band}'` : "") + ` \u2192 set '${setName}'` + (skipped.length ? ` (not configured, skipped: ${skipped.join(", ")})` : "");
  return { vendors: chosen, basis };
}
export {
  VENDOR_SETS,
  selectVendors,
  ticketBand
};
