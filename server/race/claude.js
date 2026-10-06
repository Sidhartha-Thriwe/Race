import Anthropic from "@anthropic-ai/sdk";
const MODEL = process.env.RACE_MODEL ?? "claude-opus-5";
const SKILL_ID = process.env.RACE_SKILL_ID ?? "";
const SKILL_VERSION = process.env.RACE_SKILL_VERSION ?? "";
const MAX_TURNS = Number(process.env.RACE_MAX_TURNS ?? 16);
function skillConfigured() {
  if (!process.env.ANTHROPIC_API_KEY) return { ok: false, reason: "ANTHROPIC_API_KEY not set" };
  if (!SKILL_ID) return { ok: false, reason: "RACE_SKILL_ID not set" };
  if (!SKILL_VERSION) {
    return {
      ok: false,
      reason: "RACE_SKILL_VERSION not set. Pin it \u2014 running against `latest` means a skill edit changes production behaviour silently, including the guards."
    };
  }
  return { ok: true };
}
function buildPrompt(input) {
  const gaps = input.vendorsAttempted.filter((v) => !v.ok);
  return [
    `Normalise the attached vendor payloads into an intake record for ${input.subjectId} (${input.email}).`,
    `Use case: ${input.useCase}.`,
    input.sector ? `Sector: ${input.sector}.` : "",
    input.ticketBand ? `Ticket band: ${input.ticketBand}.` : "",
    "",
    "The host has already fetched \u2014 do NOT attempt any network call, and do not",
    "ask for more vendors. The payloads below are everything there is.",
    gaps.length ? `Vendors that did not answer, to be recorded as gaps: ${gaps.map((g) => `${g.vendor} (${g.error})`).join("; ")}.` : "Every selected vendor answered.",
    "",
    "Write the JSON below to raw.json in the sandbox, then run the skill's",
    "resolve.py over it. Use the subject id exactly as given; do not mint a new one.",
    "",
    "```json",
    JSON.stringify(input.raw),
    "```",
    "",
    "Finish with the complete intake record in a single ```json fenced block and",
    "nothing after it."
  ].filter(Boolean).join("\n");
}
function extractIntake(text) {
  const blocks = [...text.matchAll(/```json\s*([\s\S]*?)```/g)];
  for (let i = blocks.length - 1; i >= 0; i--) {
    try {
      return JSON.parse(blocks[i][1]);
    } catch {
    }
  }
  return null;
}
async function normaliseWithSkill(input) {
  const steps = [];
  const note = (level, msg, detail) => steps.push({ t: (/* @__PURE__ */ new Date()).toISOString(), level, msg, detail });
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    ...process.env.ANTHROPIC_WORKSPACE_ID ? { defaultHeaders: { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID } } : {}
  });
  const tools = [{ type: "code_execution_20250825", name: "code_execution" }];
  let container = {
    skills: [{ type: "custom", skill_id: SKILL_ID, version: SKILL_VERSION }]
  };
  const messages = [{ role: "user", content: buildPrompt(input) }];
  let usage = null;
  let finalText = "";
  note("info", "Normalising with skill 1", {
    skillId: SKILL_ID,
    skillVersion: SKILL_VERSION,
    model: MODEL,
    payloadBytes: JSON.stringify(input.raw).length
  });
  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 8192,
      tools,
      messages,
      container
    });
    usage = resp.usage ?? usage;
    if (resp.container?.id) {
      container = {
        id: resp.container.id,
        skills: [{ type: "custom", skill_id: SKILL_ID, version: SKILL_VERSION }]
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
    if (resp.stop_reason === "tool_use") continue;
    break;
  }
  const intake = extractIntake(finalText);
  note(
    intake ? "info" : "error",
    intake ? "Intake record parsed" : "No intake record in the final reply (hit RACE_MAX_TURNS, or the skill errored)"
  );
  return { intake, transcriptTail: finalText.slice(-4e3), usage, steps };
}
export {
  normaliseWithSkill,
  skillConfigured
};
