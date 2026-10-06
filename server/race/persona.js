import Anthropic from "@anthropic-ai/sdk";
import { PERSONA_SYSTEM_PROMPT, buildPersonaInput } from "./personaPrompt.js";
import { loadWorkspaceId } from "./db.js";
const MODEL = process.env.RACE_PERSONA_MODEL ?? "claude-sonnet-5";
const MAX_TOKENS = Number(process.env.RACE_PERSONA_MAX_TOKENS ?? 16e3);
const BANDS = ["High", "Medium", "Low", "Estimated", "Insufficient"];
function personaConfigured() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, reason: "ANTHROPIC_API_KEY is not set" };
  }
  return { ok: true, workspaceId: process.env.ANTHROPIC_WORKSPACE_ID || null };
}
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]{2,}/g;
const URL = /https?:\/\/\S+/g;
const LONG_ID = /\b\d{12,}\b/g;
const ISO_DATE = /\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?Z?)?/;
const PHONE_CANDIDATE = /\+?\d[\d\s().-]{7,}\d/g;
function looksLikePhone(candidate) {
  if (ISO_DATE.test(candidate)) return false;
  const digits = candidate.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}
function scrubIdentity(text) {
  let hits = 0;
  const count = (_m) => {
    hits += 1;
    return "[redacted]";
  };
  const out = text.replace(EMAIL, count).replace(URL, count).replace(LONG_ID, count).replace(PHONE_CANDIDATE, (m) => looksLikePhone(m) ? count(m) : m);
  return { text: out, hits };
}
function scrubDeep(value, tally) {
  if (typeof value === "string") {
    const { text, hits } = scrubIdentity(value);
    tally.hits += hits;
    return text;
  }
  if (Array.isArray(value)) return value.map((v) => scrubDeep(v, tally));
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = scrubDeep(v, tally);
    }
    return out;
  }
  return value;
}
function isWeakBasis(basis) {
  if (!basis || basis.trim().length < 25) return true;
  const hasSpecific = /\d/.test(basis) || // a date, count or year
  /\b(module|platform|profile|review|breach|account|actor)\b/i.test(basis);
  return !hasSpecific;
}
function parseJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = (fenced ? fenced[1] : text).trim();
  try {
    return JSON.parse(body);
  } catch {
  }
  const first = body.indexOf("{");
  const last = body.lastIndexOf("}");
  if (first >= 0 && last > first) {
    try {
      return JSON.parse(body.slice(first, last + 1));
    } catch {
    }
  }
  return null;
}
async function buildPersona(opts) {
  const steps = [];
  const note = (level, msg, detail) => steps.push({ t: (/* @__PURE__ */ new Date()).toISOString(), level, msg, detail });
  const effectiveWorkspace = opts.workspaceId?.trim() || process.env.ANTHROPIC_WORKSPACE_ID?.trim() || await loadWorkspaceId() || void 0;
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    ...effectiveWorkspace ? { defaultHeaders: { "anthropic-workspace-id": effectiveWorkspace } } : {}
  });
  const input = buildPersonaInput(opts);
  note("info", `Synthesising persona with ${MODEL}`, {
    inputChars: input.length,
    richCapture: opts.views?.counts?.rich ?? 0,
    registered: opts.views?.counts?.registered ?? 0,
    breached: opts.views?.counts?.breached ?? 0,
    reviews: opts.views?.counts?.reviews ?? 0,
    scrapedPlatforms: Object.keys(opts.scrape?.data ?? {}).length,
    workspaceConfigured: Boolean(effectiveWorkspace)
  });
  let resp;
  try {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: PERSONA_SYSTEM_PROMPT,
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
  const parsed = parseJson(text);
  if (!parsed?.attributeGroups) {
    note("error", "Model did not return a usable persona object", {
      head: text.slice(0, 300)
    });
    return {
      subjectId: opts.subjectId,
      model: MODEL,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      attributeGroups: [],
      audit: { attributes: 0, byBand: {}, weakBasisLines: 0, identityScrubbed: 0 },
      usage: resp.usage,
      steps
    };
  }
  const tally = { hits: 0 };
  const clean = scrubDeep(parsed, tally);
  if (tally.hits) {
    note("warn", `${tally.hits} identity-shaped value(s) removed from the output`, {
      note: "the prompt forbids these; the code enforces it"
    });
  }
  const attributes = (clean.attributeGroups ?? []).flatMap((g) => g.attributes ?? []);
  const byBand = {};
  let weak = 0;
  for (const a of attributes) {
    const band = BANDS.includes(a.confidence) ? a.confidence : "Low";
    byBand[band] = (byBand[band] ?? 0) + 1;
    if (isWeakBasis(a.basis)) weak += 1;
  }
  note(
    "info",
    `${attributes.length} attributes \xB7 ${byBand.Insufficient ?? 0} Insufficient \xB7 ${weak} basis line(s) without specifics`
  );
  if (attributes.length && !(byBand.Insufficient ?? 0)) {
    note("warn", "No Insufficient rows at all \u2014 check whether thin evidence was written up as findings");
  }
  return {
    subjectId: opts.subjectId,
    model: MODEL,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
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
      identityScrubbed: tally.hits
    },
    usage: resp.usage,
    steps
  };
}
export {
  BANDS,
  buildPersona,
  parseJson,
  personaConfigured,
  scrubDeep,
  scrubIdentity
};
