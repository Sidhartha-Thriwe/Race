/**
 * Step 4 — the persona attribute table.
 *
 * One Claude call. The prompt is the specification and lives in
 * personaPrompt.ts; this file makes the call, validates what comes back, and
 * enforces the identity exclusion in code rather than trusting the instruction.
 *
 * Why a plain Messages call rather than the uploaded skill: this step needs no
 * sandbox and no file execution, only judgement over data we already hold. The
 * skill's step 4 rules are reproduced in the prompt, which keeps this host
 * independent of the skill upload and makes the specification readable without
 * running anything.
 */

import Anthropic from "@anthropic-ai/sdk";
import { PERSONA_SYSTEM_PROMPT, buildPersonaInput } from "./personaPrompt.js";
import type { RunStep } from "./store.js";

const MODEL = process.env.RACE_PERSONA_MODEL ?? "claude-sonnet-5";
const MAX_TOKENS = Number(process.env.RACE_PERSONA_MAX_TOKENS ?? 16000);

export const BANDS = ["High", "Medium", "Low", "Estimated", "Insufficient"] as const;
export type Band = (typeof BANDS)[number];

export interface PersonaAttribute {
  label: string; value: string; confidence: Band; basis: string;
}
export interface PersonaResult {
  subjectId: string;
  model: string;
  createdAt: string;
  attributeGroups: { group: string; attributes: PersonaAttribute[] }[];
  computedTraits?: Record<string, any>;
  identityLocation?: string;
  personaSummary?: string;
  insights?: string[];
  exclusions?: string[];
  evidenceNote?: string;
  /** Counts the operator can check the run against without reading every row. */
  audit: {
    attributes: number;
    byBand: Record<string, number>;
    weakBasisLines: number;
    identityScrubbed: number;
  };
  usage?: unknown;
  steps: RunStep[];
}

export function personaConfigured(): { ok: boolean; reason?: string } {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, reason: "ANTHROPIC_API_KEY is not set" };
  }
  return { ok: true };
}

/* ------------------------------------------------------------ output guards */

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]{2,}/g;
const URL = /https?:\/\/\S+/g;
const LONG_ID = /\b\d{12,}\b/g;              // contributor ids, numeric user ids
const PHONE = /\+?\d[\d\s-]{8,}\d/g;

/**
 * Strip identity from the model's output.
 *
 * The prompt forbids it, and an instruction is not a guarantee — the input is
 * full of emails, avatar URLs and contributor ids, and a model quoting its
 * evidence faithfully is exactly how one ends up in a basis line. Enforcing it
 * here means the stored persona is clean regardless of what came back.
 */
function scrubIdentity(text: string): { text: string; hits: number } {
  let hits = 0;
  const count = (_m: string) => { hits += 1; return "[redacted]"; };
  const out = text
    .replace(EMAIL, count)
    .replace(URL, count)
    .replace(LONG_ID, count)
    .replace(PHONE, count);
  return { text: out, hits };
}

function scrubDeep(value: unknown, tally: { hits: number }): unknown {
  if (typeof value === "string") {
    const { text, hits } = scrubIdentity(value);
    tally.hits += hits;
    return text;
  }
  if (Array.isArray(value)) return value.map((v) => scrubDeep(v, tally));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = scrubDeep(v, tally);
    }
    return out;
  }
  return value;
}

/**
 * A basis line with no specifics is a failed basis line. Counting them gives the
 * operator a number to judge the run by, rather than having to read 39 rows to
 * notice the model got vague.
 */
function isWeakBasis(basis: string): boolean {
  if (!basis || basis.trim().length < 25) return true;
  const hasSpecific =
    /\d/.test(basis) ||                                   // a date, count or year
    /\b(module|platform|profile|review|breach|account|actor)\b/i.test(basis);
  return !hasSpecific;
}

function parseJson(text: string): any {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = (fenced ? fenced[1] : text).trim();
  try { return JSON.parse(body); } catch { /* fall through */ }
  // A model that adds a sentence before the object is still recoverable.
  const first = body.indexOf("{");
  const last = body.lastIndexOf("}");
  if (first >= 0 && last > first) {
    try { return JSON.parse(body.slice(first, last + 1)); } catch { /* give up */ }
  }
  return null;
}

/* -------------------------------------------------------------------- build */

export async function buildPersona(opts: {
  subjectId: string;
  useCase?: string; sector?: string; ticketBand?: string;
  views: any; plan?: any; scrape?: any;
}): Promise<PersonaResult> {
  const steps: RunStep[] = [];
  const note = (level: RunStep["level"], msg: string, detail?: unknown) =>
    steps.push({ t: new Date().toISOString(), level, msg, detail });

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    ...(process.env.ANTHROPIC_WORKSPACE_ID
      ? { defaultHeaders: { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID } }
      : {}),
  });

  const input = buildPersonaInput(opts);
  note("info", `Synthesising persona with ${MODEL}`, {
    inputChars: input.length,
    richCapture: opts.views?.counts?.rich ?? 0,
    registered: opts.views?.counts?.registered ?? 0,
    breached: opts.views?.counts?.breached ?? 0,
    reviews: opts.views?.counts?.reviews ?? 0,
    scrapedPlatforms: Object.keys(opts.scrape?.data ?? {}).length,
  });

  const resp: any = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: 0,
    system: PERSONA_SYSTEM_PROMPT,
    messages: [{ role: "user", content: input }],
  });

  const text = (resp.content ?? [])
    .filter((b: any) => b.type === "text").map((b: any) => b.text).join("");

  const parsed = parseJson(text);
  if (!parsed?.attributeGroups) {
    note("error", "Model did not return a usable persona object", {
      head: text.slice(0, 300),
    });
    return {
      subjectId: opts.subjectId, model: MODEL, createdAt: new Date().toISOString(),
      attributeGroups: [],
      audit: { attributes: 0, byBand: {}, weakBasisLines: 0, identityScrubbed: 0 },
      usage: resp.usage, steps,
    };
  }

  const tally = { hits: 0 };
  const clean: any = scrubDeep(parsed, tally);
  if (tally.hits) {
    note("warn", `${tally.hits} identity-shaped value(s) removed from the output`, {
      note: "the prompt forbids these; the code enforces it",
    });
  }

  // Audit counts, so the run can be judged without reading every row.
  const attributes: PersonaAttribute[] =
    (clean.attributeGroups ?? []).flatMap((g: any) => g.attributes ?? []);
  const byBand: Record<string, number> = {};
  let weak = 0;
  for (const a of attributes) {
    const band = BANDS.includes(a.confidence) ? a.confidence : "Low";
    byBand[band] = (byBand[band] ?? 0) + 1;
    if (isWeakBasis(a.basis)) weak += 1;
  }

  note("info",
       `${attributes.length} attributes · ${byBand.Insufficient ?? 0} Insufficient · ` +
       `${weak} basis line(s) without specifics`);

  if (attributes.length && !(byBand.Insufficient ?? 0)) {
    // Straight from the framework: a persona with no Insufficient rows has been
    // filled in rather than derived. Worth flagging rather than assuming.
    note("warn", "No Insufficient rows at all — check whether thin evidence was " +
                 "written up as findings");
  }

  return {
    subjectId: opts.subjectId,
    model: MODEL,
    createdAt: new Date().toISOString(),
    attributeGroups: clean.attributeGroups ?? [],
    computedTraits: clean.computedTraits,
    identityLocation: clean.identityLocation,
    personaSummary: clean.personaSummary,
    insights: clean.insights,
    exclusions: clean.exclusions,
    evidenceNote: clean.evidenceNote,
    audit: {
      attributes: attributes.length,
      byBand,
      weakBasisLines: weak,
      identityScrubbed: tally.hits,
    },
    usage: resp.usage,
    steps,
  };
}
