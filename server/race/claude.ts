/**
 * Stage 2 of the pipeline: normalise the payloads into an intake record.
 *
 * The backend has already fetched (see pipeline.ts). This hands the raw vendor
 * payloads to Claude running skill 1, which writes them into its sandbox as
 * raw.json and runs the skill's own resolve.py over them — guards, vendor
 * normalisers, merge, dormancy detection, all of it.
 *
 * Why a model is in this loop at all, when resolve.py is deterministic: it is
 * the only way to run that one authored copy of the method without a Python
 * runtime in this container. The scripts stay in the skill, tested once, usable
 * from claude.ai and Desktop and here. The alternative — porting ~1,200 lines
 * of guards and normalisers to TypeScript — puts the method in two places and
 * only one of them has the 82 tests.
 *
 * Two costs of this choice, both real and both worth stating out loud:
 *
 *   The raw payloads pass through the model's context. That includes
 *   dataBreach.results[], which carries cleartext credentials, BEFORE the
 *   guards have removed anything. Skills are not covered by Zero Data
 *   Retention. This belongs in the Legal conversation alongside the vendor
 *   contracts, not in a footnote.
 *
 *   It costs tokens to move bytes a script could have read off disk.
 *
 * Both disappear if this container ever gets a Python runtime: run resolve.py
 * here, and only the cleaned intake record ever leaves Thriwe's infrastructure.
 * The scripts do not change either way — that is the point of keeping the
 * logic in the skill rather than in any one host.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { RunStep } from "./store.js";

const MODEL = process.env.RACE_MODEL ?? "claude-opus-5";

/**
 * Pinned, deliberately. `latest` would mean a skill edit silently changes
 * production behaviour — including the guards that keep credentials and
 * special-category data out of the record. Get the value from
 * `python upload_skill.py --list`.
 */
const SKILL_ID = process.env.RACE_SKILL_ID ?? "";
const SKILL_VERSION = process.env.RACE_SKILL_VERSION ?? "";
const MAX_TURNS = Number(process.env.RACE_MAX_TURNS ?? 16);

export interface NormaliseInput {
  subjectId: string;
  email: string;
  useCase: string;
  sector?: string;
  ticketBand?: string;
  raw: Record<string, unknown>;
  vendorsAttempted: { vendor: string; ok: boolean; error?: string | null }[];
}

export interface NormaliseResult {
  intake: unknown | null;
  transcriptTail: string;
  usage: unknown;
  steps: RunStep[];
}

export function skillConfigured(): { ok: boolean; reason?: string } {
  if (!process.env.ANTHROPIC_API_KEY) return { ok: false, reason: "ANTHROPIC_API_KEY not set" };
  if (!SKILL_ID) return { ok: false, reason: "RACE_SKILL_ID not set" };
  if (!SKILL_VERSION) {
    return {
      ok: false,
      reason:
        "RACE_SKILL_VERSION not set. Pin it — running against `latest` means a skill " +
        "edit changes production behaviour silently, including the guards.",
    };
  }
  return { ok: true };
}

function buildPrompt(input: NormaliseInput): string {
  const gaps = input.vendorsAttempted.filter((v) => !v.ok);
  return [
    `Normalise the attached vendor payloads into an intake record for ${input.subjectId} (${input.email}).`,
    `Use case: ${input.useCase}.`,
    input.sector ? `Sector: ${input.sector}.` : "",
    input.ticketBand ? `Ticket band: ${input.ticketBand}.` : "",
    "",
    "The host has already fetched — do NOT attempt any network call, and do not",
    "ask for more vendors. The payloads below are everything there is.",
    gaps.length
      ? `Vendors that did not answer, to be recorded as gaps: ${gaps
          .map((g) => `${g.vendor} (${g.error})`)
          .join("; ")}.`
      : "Every selected vendor answered.",
    "",
    "Write the JSON below to raw.json in the sandbox, then run the skill's",
    "resolve.py over it. Use the subject id exactly as given; do not mint a new one.",
    "",
    "```json",
    JSON.stringify(input.raw),
    "```",
    "",
    "Finish with the complete intake record in a single ```json fenced block and",
    "nothing after it.",
  ]
    .filter(Boolean)
    .join("\n");
}

function extractIntake(text: string): unknown | null {
  const blocks = [...text.matchAll(/```json\s*([\s\S]*?)```/g)];
  for (let i = blocks.length - 1; i >= 0; i--) {
    try {
      return JSON.parse(blocks[i][1]);
    } catch {
      /* try the block before it */
    }
  }
  return null;
}

export async function normaliseWithSkill(input: NormaliseInput): Promise<NormaliseResult> {
  const steps: RunStep[] = [];
  const note = (level: RunStep["level"], msg: string, detail?: unknown) =>
    steps.push({ t: new Date().toISOString(), level, msg, detail });

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    ...(process.env.ANTHROPIC_WORKSPACE_ID
      ? { defaultHeaders: { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID } }
      : {}),
  });

  const tools: any[] = [{ type: "code_execution_20250825", name: "code_execution" }];
  let container: any = {
    skills: [{ type: "custom", skill_id: SKILL_ID, version: SKILL_VERSION }],
  };

  const messages: any[] = [{ role: "user", content: buildPrompt(input) }];
  let usage: unknown = null;
  let finalText = "";

  note("info", "Normalising with skill 1", {
    skillId: SKILL_ID, skillVersion: SKILL_VERSION, model: MODEL,
    payloadBytes: JSON.stringify(input.raw).length,
  });

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const resp: any = await client.messages.create({
      model: MODEL, max_tokens: 8192, tools, messages, container,
    } as any);

    usage = resp.usage ?? usage;

    // Reuse the container so the sandbox keeps its state — raw.json written on
    // one turn has to still be there on the next.
    if (resp.container?.id) {
      container = {
        id: resp.container.id,
        skills: [{ type: "custom", skill_id: SKILL_ID, version: SKILL_VERSION }],
      };
    }

    let turnText = "";
    for (const block of resp.content ?? []) {
      if (block.type === "text") turnText += block.text;
      else if (typeof block.type === "string" && block.type.includes("code_execution")) {
        note("info", `sandbox: ${block.type}`);
      }
    }
    if (turnText.trim()) finalText = turnText;

    messages.push({ role: "assistant", content: resp.content });

    // Only server-side tools are in play now, so there is never a tool_result
    // for us to return — just go round again until it stops.
    if (resp.stop_reason === "tool_use") continue;
    break;
  }

  const intake = extractIntake(finalText);
  note(intake ? "info" : "error",
       intake ? "Intake record parsed"
              : "No intake record in the final reply (hit RACE_MAX_TURNS, or the skill errored)");

  return { intake, transcriptTail: finalText.slice(-4000), usage, steps };
}
