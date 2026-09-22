/**
 * The agent loop that runs skill 1.
 *
 * One Messages API request carries both `container.skills` (which requires the
 * code execution tool) and our own `race_fetch_vendor` client tool. Claude
 * interleaves them: call our tool for the network the sandbox does not have,
 * then run resolve.py in the sandbox on what came back.
 *
 * That interleaving is undocumented by Anthropic, so it was verified directly
 * before anything was built on it — see
 * RACE-Engine-Skills/integration/verify_api_architecture.py, which passed on
 * 2026-09-22. If a future SDK breaks it, that script is the canary.
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  RACE_FETCH_VENDOR_TOOL,
  raceFetchVendor,
  type FetchVendorInput,
  type VendorName,
} from "./vendors.js";
import { capReached, recordSpend, type RunRecord, type RunStep } from "./store.js";

const MODEL = process.env.RACE_MODEL ?? "claude-opus-5";

/**
 * Pinned, deliberately. `latest` would mean a skill edit silently changes
 * production behaviour — including the guards that keep credentials and
 * special-category data out of the record. Get the value from
 * `python upload_skill.py --list`.
 */
const SKILL_ID = process.env.RACE_SKILL_ID ?? "";
const SKILL_VERSION = process.env.RACE_SKILL_VERSION ?? "";

const MAX_TURNS = Number(process.env.RACE_MAX_TURNS ?? 24);

export interface RunRequest {
  email: string;
  subjectId: string;
  useCase: string;
  sector?: string;
  ticketBand?: string;
  vendors?: VendorName[]; // optional override; otherwise the skill chooses
}

export interface RunOutcome {
  intake: unknown | null;
  transcriptTail: string;
  vendorsCalled: RunRecord["vendorsCalled"];
  costINR: number;
  raw: Record<string, unknown>;
  usage: unknown;
  steps: RunStep[];
}

function step(steps: RunStep[], level: RunStep["level"], msg: string, detail?: unknown) {
  steps.push({ t: new Date().toISOString(), level, msg, detail });
}

function buildPrompt(req: RunRequest): string {
  const lines = [
    `Run identity resolution for ${req.email}.`,
    `Subject id: ${req.subjectId} — use this exact id in the intake record; do not mint a new one.`,
    `Use case: ${req.useCase}.`,
  ];
  if (req.sector) lines.push(`Sector: ${req.sector}.`);
  if (req.ticketBand) lines.push(`Ticket band: ${req.ticketBand}.`);
  if (req.vendors?.length) {
    lines.push(
      `Vendor set is fixed by the operator for this run: ${req.vendors.join(", ")}. ` +
      `Call exactly these and no others, even if the routing table would choose differently.`,
    );
  }
  lines.push(
    "",
    "Use the race_fetch_vendor tool for every vendor call — you have no network in the sandbox.",
    "Then run the skill's resolve.py on the payloads to produce the intake record.",
    "",
    "Finish your reply with the complete intake record in a single ```json fenced block,",
    "and nothing after it. If a vendor refused or returned nothing, say so above the block",
    "and still emit the record with the gap recorded rather than omitting the block.",
  );
  return lines.join("\n");
}

/** Pull the last fenced json block out of the final text. */
function extractIntake(text: string): unknown | null {
  const blocks = [...text.matchAll(/```json\s*([\s\S]*?)```/g)];
  for (let i = blocks.length - 1; i >= 0; i--) {
    try {
      return JSON.parse(blocks[i][1]);
    } catch {
      /* try the one before it */
    }
  }
  return null;
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

export async function runSkillOne(req: RunRequest): Promise<RunOutcome> {
  const steps: RunStep[] = [];
  const vendorsCalled: RunOutcome["vendorsCalled"] = [];
  const raw: Record<string, unknown> = {};
  let costINR = 0;

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    ...(process.env.ANTHROPIC_WORKSPACE_ID
      ? { defaultHeaders: { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID } }
      : {}),
  });

  const tools: any[] = [
    { type: "code_execution_20250825", name: "code_execution" },
    RACE_FETCH_VENDOR_TOOL,
  ];

  let container: any = {
    skills: [{ type: "custom", skill_id: SKILL_ID, version: SKILL_VERSION }],
  };

  const messages: any[] = [{ role: "user", content: buildPrompt(req) }];
  let usage: unknown = null;
  let finalText = "";

  step(steps, "info", `Starting run for ${req.subjectId}`, {
    model: MODEL, skillId: SKILL_ID, skillVersion: SKILL_VERSION, useCase: req.useCase,
  });

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const resp: any = await client.messages.create({
      model: MODEL,
      max_tokens: 8192,
      tools,
      messages,
      container,
    } as any);

    usage = resp.usage ?? usage;

    // Keep the same container across turns so the sandbox keeps its state —
    // raw.json written on one turn has to still be there on the next.
    if (resp.container?.id) {
      container = {
        id: resp.container.id,
        skills: [{ type: "custom", skill_id: SKILL_ID, version: SKILL_VERSION }],
      };
    }

    const toolResults: any[] = [];
    let turnText = "";

    for (const block of resp.content ?? []) {
      if (block.type === "text") {
        turnText += block.text;
      } else if (block.type === "tool_use" && block.name === RACE_FETCH_VENDOR_TOOL.name) {
        const input = block.input as FetchVendorInput;
        step(steps, "info", `race_fetch_vendor → ${input.vendor}`, { query_type: input.query_type ?? "email" });

        const result = await raceFetchVendor(input, { capReached, recordSpend });

        vendorsCalled.push({
          vendor: input.vendor,
          ok: result.ok,
          itemCount: result.itemCount,
          costINR: result.costINR,
          error: result.error,
        });
        if (result.ok) {
          costINR += result.costINR ?? 0;
          raw[input.vendor] = result.payload;
          step(steps, "info", `${input.vendor} returned ${result.itemCount} item(s)`, {
            status: result.status, creditBalanceAfter: result.creditBalanceAfter,
          });
          if (result.itemCount === 0) {
            // A 200 with nothing in it is the failure that looks like success.
            step(steps, "warn", `${input.vendor} returned 200 with zero items`, {
              note: "empty result, no accounts, and a mistyped address all look identical here",
            });
          }
        } else {
          step(steps, "warn", `${input.vendor} did not answer: ${result.error}`);
        }

        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      } else if (typeof block.type === "string" && block.type.includes("code_execution")) {
        step(steps, "info", `sandbox: ${block.type}`);
      }
    }

    if (turnText.trim()) finalText = turnText;
    messages.push({ role: "assistant", content: resp.content });

    if (resp.stop_reason === "tool_use") {
      if (toolResults.length) {
        messages.push({ role: "user", content: toolResults });
        continue;
      }
      // Code execution is a server-side tool Anthropic runs itself; there is
      // nothing for us to return, so just go round again.
      continue;
    }
    break;
  }

  const intake = extractIntake(finalText);
  if (!intake) {
    step(steps, "error", "No intake record found in the final reply", {
      hint: "the run may have hit RACE_MAX_TURNS, or every vendor refused",
    });
  } else {
    step(steps, "info", "Intake record parsed");
  }

  return {
    intake,
    transcriptTail: finalText.slice(-4000),
    vendorsCalled,
    costINR: Math.round(costINR * 100) / 100,
    raw,
    usage,
    steps,
  };
}
