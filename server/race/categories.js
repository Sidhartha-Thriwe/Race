import Anthropic from "@anthropic-ai/sdk";
import { CATEGORIES_SYSTEM_PROMPT, buildCategoriesInput } from "./categoriesPrompt.js";
import { scrubDeep, parseJson } from "./persona.js";
import { loadWorkspaceId } from "./db.js";
const MODEL = process.env.RACE_CATEGORIES_MODEL ?? process.env.RACE_PERSONA_MODEL ?? "claude-sonnet-5";
const MAX_TOKENS = Number(process.env.RACE_CATEGORIES_MAX_TOKENS ?? 32e3);
const CONFIDENCE = ["High", "Medium", "Low"];
const REJECTION_RULES = [
  "ubiquitous_not_identity",
  "no_monetisable_headroom",
  "hygiene_only",
  "stale",
  "out_of_scope"
];
function categoriesConfigured() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, reason: "ANTHROPIC_API_KEY is not set" };
  }
  return { ok: true };
}
const OFFER_KEYS = /* @__PURE__ */ new Set([
  "brand",
  "brands",
  "brandMechanism",
  "mechanism",
  "partnerStatus",
  "partner",
  "whyClears",
  "whyLabel",
  "offer",
  "offers",
  "offerMode",
  "product",
  "tier",
  "programme",
  "program",
  "price",
  "pricing",
  "verification",
  "q1Category"
]);
function stripOfferFields(value, tally) {
  if (Array.isArray(value)) return value.map((v) => stripOfferFields(v, tally));
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (OFFER_KEYS.has(k)) {
        tally.removed += 1;
        continue;
      }
      out[k] = stripOfferFields(v, tally);
    }
    return out;
  }
  return value;
}
const PRICE = /(?:₹|Rs\.?\s|INR\s|\$|£|€)\s?\d/g;
function countPrices(value) {
  if (typeof value === "string") return (value.match(PRICE) ?? []).length;
  if (Array.isArray(value)) return value.reduce((n, v) => n + countPrices(v), 0);
  if (value && typeof value === "object") {
    return Object.values(value).reduce((n, v) => n + countPrices(v), 0);
  }
  return 0;
}
function isThin(text) {
  if (!text || text.trim().length < 20) return true;
  return !(/\d/.test(text) || /\b(platform|profile|review|breach|account|actor|registration|subscription|streak|XP|years?|months?)\b/i.test(text));
}
async function deriveCategories(opts) {
  const steps = [];
  const note = (level, msg, detail) => steps.push({ t: (/* @__PURE__ */ new Date()).toISOString(), level, msg, detail });
  const empty = {
    candidates: 0,
    ranked: 0,
    deprioritised: 0,
    byRejectionRule: {},
    dormantFound: false,
    identityScrubbed: 0,
    offerFieldsRemoved: 0,
    priceMentions: 0,
    thinJustifications: 0
  };
  const effectiveWorkspace = opts.workspaceId?.trim() || process.env.ANTHROPIC_WORKSPACE_ID?.trim() || await loadWorkspaceId() || void 0;
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    ...effectiveWorkspace ? { defaultHeaders: { "anthropic-workspace-id": effectiveWorkspace } } : {}
  });
  const input = buildCategoriesInput(opts);
  note("info", `Deriving categories with ${MODEL}`, {
    inputChars: input.length,
    personaAttributes: opts.persona?.audit?.attributes ?? 0,
    rich: opts.views?.counts?.rich ?? 0,
    registered: opts.views?.counts?.registered ?? 0,
    breached: opts.views?.counts?.breached ?? 0,
    scrapedPlatforms: Object.keys(opts.scrape?.data ?? {}).length
  });
  let resp;
  try {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: CATEGORIES_SYSTEM_PROMPT,
      messages: [{ role: "user", content: input }]
    });
    resp = await stream.finalMessage();
  } catch (err) {
    const msg = err?.message ?? String(err);
    if (/anthropic-workspace-id|workspace/i.test(msg)) {
      note("error", "Anthropic API requires a Workspace ID for this API key");
      const e = new Error(
        "This API key is not scoped to a workspace, so this request must include the anthropic-workspace-id header with the ID of the workspace to use. Add the header, or use an API key that is scoped to a workspace."
      );
      e.needsWorkspaceId = true;
      e.status = 400;
      throw e;
    }
    note("error", `Anthropic API error: ${msg}`);
    throw err;
  }
  const text = (resp.content ?? []).filter((b) => b.type === "text").map((b) => b.text).join("");
  const stopReason = resp.stop_reason ?? "unknown";
  const outTokens = Number(resp.usage?.output_tokens ?? 0);
  const thinkTokens = Number(resp.usage?.output_tokens_details?.thinking_tokens ?? 0);
  note("info", `Model returned ${text.length} chars \xB7 stop_reason ${stopReason}`, {
    outputTokens: outTokens,
    thinkingTokens: thinkTokens,
    maxTokens: MAX_TOKENS
  });
  if (outTokens >= MAX_TOKENS * 0.85) {
    note(
      "warn",
      `Output used ${outTokens} of ${MAX_TOKENS} tokens (${thinkTokens} of them thinking) \u2014 close enough to the ceiling that a richer subject will be truncated. Raise RACE_CATEGORIES_MAX_TOKENS.`
    );
  }
  const parsed = parseJson(text);
  if (!parsed?.topCategories && !parsed?.scoringTable) {
    const why = stopReason === "max_tokens" ? `the model hit the ${MAX_TOKENS}-token output ceiling and its JSON was cut off mid-object. Raise RACE_CATEGORIES_MAX_TOKENS.` : `stop_reason was "${stopReason}" and the text could not be parsed as JSON.`;
    note("error", `No usable category object: ${why}`, { head: text.slice(0, 400) });
    const e = new Error(`Category derivation returned nothing usable \u2014 ${why}`);
    e.head = text.slice(0, 400);
    throw e;
  }
  const offerTally = { removed: 0 };
  const noOffers = stripOfferFields(parsed, offerTally);
  if (offerTally.removed) {
    note("warn", `${offerTally.removed} offer-shaped field(s) removed from the output`, {
      note: "step 5 stops at the category; brands and mechanisms belong to step 6"
    });
  }
  const idTally = { hits: 0 };
  const clean = scrubDeep(noOffers, idTally);
  if (idTally.hits) {
    note("warn", `${idTally.hits} identity-shaped value(s) removed from the output`);
  }
  const scoringTable = Array.isArray(clean.scoringTable) ? clean.scoringTable : [];
  const topCategories = Array.isArray(clean.topCategories) ? clean.topCategories : [];
  const deprioritized = Array.isArray(clean.deprioritized) ? clean.deprioritized : [];
  const byRejectionRule = {};
  let deprioritised = 0;
  for (const row of scoringTable) {
    if (row.outcome === "deprioritised" || row.rejected) {
      deprioritised += 1;
      const rule = row.rejectionRule && REJECTION_RULES.includes(row.rejectionRule) ? row.rejectionRule : "unstated";
      byRejectionRule[rule] = (byRejectionRule[rule] ?? 0) + 1;
    }
  }
  const thin = topCategories.filter((c) => isThin(c.rationale)).length;
  const dormantFound = /\bdormant\b|\blapsed\b/i.test(JSON.stringify(clean));
  note(
    "info",
    `${scoringTable.length} candidates \xB7 ${topCategories.length} ranked \xB7 ${deprioritised} deprioritised \xB7 dormancy ${dormantFound ? "engaged with" : "not mentioned"}`
  );
  if (topCategories.length && !deprioritised) {
    note("warn", "No deprioritised rows at all \u2014 the scoring table should show what was considered and lost, not only what won");
  }
  if (byRejectionRule.unstated) {
    note("warn", `${byRejectionRule.unstated} rejected row(s) name no rejection rule`);
  }
  return {
    subjectId: opts.subjectId,
    model: MODEL,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    scoringNote: clean.scoringNote,
    scoringTable,
    topCategories,
    deprioritized,
    audit: {
      candidates: scoringTable.length,
      ranked: topCategories.length,
      deprioritised,
      byRejectionRule,
      dormantFound,
      identityScrubbed: idTally.hits,
      offerFieldsRemoved: offerTally.removed,
      priceMentions: countPrices(clean),
      thinJustifications: thin,
      outputTokens: outTokens,
      thinkingTokens: thinkTokens,
      maxTokens: MAX_TOKENS
    },
    usage: resp.usage,
    steps
  };
}
export {
  CONFIDENCE,
  REJECTION_RULES,
  categoriesConfigured,
  deriveCategories
};
