/**
 * Step 5 — derive and rank categories.
 *
 * One Claude call. The prompt in categoriesPrompt.ts is the specification; this
 * file makes the call, validates what comes back and enforces in code the one
 * rule the whole step exists to protect: the engine stops at the category.
 *
 * The decomposition spec is explicit that new runs must not put `brand`,
 * `brandMechanism`, `whyClears` or `partnerStatus` on `topCategories` — those
 * moved to step 6 when offer construction became its own step, and step 6 is out
 * of scope. The P-17 and P-19 persona JSONs on disk still carry them inline;
 * that is the superseded schema, not the target. So the guard below deletes them
 * rather than trusting the prompt, on the same principle the identity scrub
 * works on: a comment saying "never rendered" is not a control.
 */

import Anthropic from "@anthropic-ai/sdk";
import { CATEGORIES_SYSTEM_PROMPT, buildCategoriesInput } from "./categoriesPrompt.js";
import { scrubDeep, parseJson } from "./persona.js";
import type { RunStep } from "./store.js";
import { loadWorkspaceId } from "./db.js";

const MODEL = process.env.RACE_CATEGORIES_MODEL
  ?? process.env.RACE_PERSONA_MODEL
  ?? "claude-sonnet-5";
const MAX_TOKENS = Number(process.env.RACE_CATEGORIES_MAX_TOKENS ?? 16000);

export const CONFIDENCE = ["High", "Medium", "Low"] as const;

export const REJECTION_RULES = [
  "ubiquitous_not_identity",
  "no_monetisable_headroom",
  "hygiene_only",
  "stale",
  "out_of_scope",
] as const;

export interface ScoringRow {
  category: string;
  revealed: string;
  psychFit: string;
  timing: string;
  motivator: string;
  confidence: string;
  outcome: "ranked" | "deprioritised";
  rejected?: boolean;
  rejectionRule?: string;
  dispositionNote?: string;
}

export interface TopCategory {
  rank: number;
  category: string;
  evidenceStrength: number;
  psychFit: number;
  rationale: string;
  frameworkArgument?: string;
  monetisableHeadroom?: string;
  limitation?: string;
}

export interface CategoriesResult {
  subjectId: string;
  model: string;
  createdAt: string;
  status?: "running" | "completed" | "failed";
  scoringNote?: string;
  scoringTable: ScoringRow[];
  topCategories: TopCategory[];
  dormantPaidAffinity?: string;
  openWindow?: string;
  deprioritized: string[];
  evidenceNote?: string;
  audit: {
    candidates: number;
    ranked: number;
    deprioritised: number;
    byRejectionRule: Record<string, number>;
    dormantFound: boolean;
    identityScrubbed: number;
    /** Offer-shaped keys the model emitted despite the prompt, and we removed. */
    offerFieldsRemoved: number;
    /** Price-shaped strings left in the prose, for the operator to eyeball. */
    priceMentions: number;
    thinJustifications: number;
  };
  usage?: unknown;
  steps: RunStep[];
}

export function categoriesConfigured(): { ok: boolean; reason?: string } {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, reason: "ANTHROPIC_API_KEY is not set" };
  }
  return { ok: true };
}

/* ------------------------------------------------------------ output guards */

/**
 * Keys that belong to step 6 and must not appear on a step 5 record.
 *
 * Deleting them is deliberate rather than tolerant. If the model writes a brand
 * beside a category, keeping it "just for reference" is exactly how a category
 * score came to stand in for an offer specification — the failure the split into
 * two steps exists to prevent.
 */
const OFFER_KEYS = new Set([
  "brand", "brands", "brandMechanism", "mechanism", "partnerStatus", "partner",
  "whyClears", "whyLabel", "offer", "offers", "offerMode", "product", "tier",
  "programme", "program", "price", "pricing", "verification", "q1Category",
]);

function stripOfferFields(value: unknown, tally: { removed: number }): unknown {
  if (Array.isArray(value)) return value.map((v) => stripOfferFields(v, tally));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (OFFER_KEYS.has(k)) { tally.removed += 1; continue; }
      out[k] = stripOfferFields(v, tally);
    }
    return out;
  }
  return value;
}

/**
 * Prices are not identity, so the scrub leaves them alone — but the skill is
 * explicit that inventing a number is the kind of error that surfaces in front
 * of a partner, and a step that is not allowed to name an offer has very little
 * business quoting a price. Count them and show the operator the count rather
 * than silently deleting evidence that might be legitimate (a subject's own
 * reviewed spend, for instance, is a real and useful figure).
 */
const PRICE = /(?:₹|Rs\.?\s|INR\s|\$|£|€)\s?\d/g;

function countPrices(value: unknown): number {
  if (typeof value === "string") return (value.match(PRICE) ?? []).length;
  if (Array.isArray(value)) return value.reduce((n, v) => n + countPrices(v), 0);
  if (value && typeof value === "object") {
    return Object.values(value).reduce((n: number, v) => n + countPrices(v), 0);
  }
  return 0;
}

/**
 * A justification with no specifics is a failed justification, for the same
 * reason a basis line without a date or a count is. "Serves identity directly"
 * is unfalsifiable; "5 routes including a paid subscription and two aggregators"
 * can be checked and can be wrong.
 */
function isThin(text: string | undefined): boolean {
  if (!text || text.trim().length < 20) return true;
  return !(/\d/.test(text) ||
           /\b(platform|profile|review|breach|account|actor|registration|subscription|streak|XP|years?|months?)\b/i.test(text));
}

/* -------------------------------------------------------------------- build */

export async function deriveCategories(opts: {
  subjectId: string;
  useCase?: string; sector?: string; ticketBand?: string;
  views: any; plan?: any; scrape?: any; persona: any;
  workspaceId?: string;
}): Promise<CategoriesResult> {
  const steps: RunStep[] = [];
  const note = (level: RunStep["level"], msg: string, detail?: unknown) =>
    steps.push({ t: new Date().toISOString(), level, msg, detail });

  const empty: CategoriesResult["audit"] = {
    candidates: 0, ranked: 0, deprioritised: 0, byRejectionRule: {},
    dormantFound: false, identityScrubbed: 0, offerFieldsRemoved: 0,
    priceMentions: 0, thinJustifications: 0,
  };

  const effectiveWorkspace =
    opts.workspaceId?.trim() ||
    process.env.ANTHROPIC_WORKSPACE_ID?.trim() ||
    (await loadWorkspaceId()) ||
    undefined;

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    ...(effectiveWorkspace
      ? { defaultHeaders: { "anthropic-workspace-id": effectiveWorkspace } }
      : {}),
  });

  const input = buildCategoriesInput(opts);
  note("info", `Deriving categories with ${MODEL}`, {
    inputChars: input.length,
    personaAttributes: opts.persona?.audit?.attributes ?? 0,
    rich: opts.views?.counts?.rich ?? 0,
    registered: opts.views?.counts?.registered ?? 0,
    breached: opts.views?.counts?.breached ?? 0,
    scrapedPlatforms: Object.keys(opts.scrape?.data ?? {}).length,
  });

  let resp: any;
  try {
    resp = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: CATEGORIES_SYSTEM_PROMPT,
      messages: [{ role: "user", content: input }],
    });
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    if (/anthropic-workspace-id|workspace/i.test(msg)) {
      note("error", "Anthropic API requires a Workspace ID for this API key");
      const e = new Error(
        "This API key is not scoped to a workspace, so this request must include the anthropic-workspace-id header with the ID of the workspace to use. Add the header, or use an API key that is scoped to a workspace."
      );
      (e as any).needsWorkspaceId = true;
      (e as any).status = 400;
      throw e;
    }
    note("error", `Anthropic API error: ${msg}`);
    throw err;
  }

  const text = (resp.content ?? [])
    .filter((b: any) => b.type === "text").map((b: any) => b.text).join("");

  const parsed = parseJson(text);
  if (!parsed?.topCategories && !parsed?.scoringTable) {
    note("error", "Model did not return a usable category object", {
      head: text.slice(0, 300),
    });
    return {
      subjectId: opts.subjectId, model: MODEL, createdAt: new Date().toISOString(),
      scoringTable: [], topCategories: [], deprioritized: [],
      audit: empty, usage: resp.usage, steps,
    };
  }

  // Offer fields first, then identity. Order matters only in that stripping a
  // whole `brandMechanism` value is cheaper than scrubbing its contents and
  // then throwing it away.
  const offerTally = { removed: 0 };
  const noOffers: any = stripOfferFields(parsed, offerTally);
  if (offerTally.removed) {
    note("warn", `${offerTally.removed} offer-shaped field(s) removed from the output`, {
      note: "step 5 stops at the category; brands and mechanisms belong to step 6",
    });
  }

  const idTally = { hits: 0 };
  const clean: any = scrubDeep(noOffers, idTally);
  if (idTally.hits) {
    note("warn", `${idTally.hits} identity-shaped value(s) removed from the output`);
  }

  const scoringTable: ScoringRow[] = Array.isArray(clean.scoringTable) ? clean.scoringTable : [];
  const topCategories: TopCategory[] = Array.isArray(clean.topCategories) ? clean.topCategories : [];
  const deprioritized: string[] = Array.isArray(clean.deprioritized) ? clean.deprioritized : [];

  const byRejectionRule: Record<string, number> = {};
  let deprioritised = 0;
  for (const row of scoringTable) {
    if (row.outcome === "deprioritised" || row.rejected) {
      deprioritised += 1;
      const rule = row.rejectionRule && (REJECTION_RULES as readonly string[]).includes(row.rejectionRule)
        ? row.rejectionRule : "unstated";
      byRejectionRule[rule] = (byRejectionRule[rule] ?? 0) + 1;
    }
  }

  const thin = topCategories.filter((c) => isThin(c.rationale)).length;
  const dormantText = String(clean.dormantPaidAffinity ?? "");
  const dormantFound = Boolean(dormantText) && !/^none\b|no dormant|not found|none found/i.test(dormantText.trim());

  note("info",
       `${scoringTable.length} candidates · ${topCategories.length} ranked · ` +
       `${deprioritised} deprioritised · dormant paid affinity ${dormantFound ? "found" : "not found"}`);

  if (topCategories.length && !deprioritised) {
    // Straight from the framework: score every candidate including the ones you
    // will reject. A table with only winners has been curated, not run.
    note("warn", "No deprioritised rows at all — the scoring table should show " +
                 "what was considered and lost, not only what won");
  }
  if (byRejectionRule.unstated) {
    note("warn", `${byRejectionRule.unstated} rejected row(s) name no rejection rule`);
  }

  return {
    subjectId: opts.subjectId,
    model: MODEL,
    createdAt: new Date().toISOString(),
    scoringNote: clean.scoringNote,
    scoringTable,
    topCategories,
    dormantPaidAffinity: clean.dormantPaidAffinity,
    openWindow: clean.openWindow,
    deprioritized,
    evidenceNote: clean.evidenceNote,
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
    },
    usage: resp.usage,
    steps,
  };
}
