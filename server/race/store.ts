/**
 * The record. Every RACE run leaves three things behind, on purpose:
 *
 *   runs.jsonl          one line per run — who, when, which vendors, what it cost
 *   runs/<id>.json      the full artifact: the intake record and the step log
 *   subjects.json       email -> subject id, so a person keeps one id across runs
 *   ledger.json         monthly vendor spend, which is what enforces the caps
 *
 * All of it is plain JSON you can open in any editor, because a record nobody
 * can read is not a record. The HTTP endpoints in routes.ts read these files.
 *
 * ONE THING TO KNOW BEFORE PRODUCTION: on Cloud Run the container filesystem is
 * ephemeral and every instance has its own. These files survive a page reload
 * and a short session; they do NOT survive a redeploy, a scale-to-zero, or a
 * second instance. That is fine for the demo and wrong for the real thing —
 * point RACE_DATA_DIR at a mounted volume, or move this module to Firestore,
 * before any of this counts as an audit trail.
 */

import crypto from "crypto";
import {
  loadSubjects, saveSubjects, loadLedger, saveLedger,
  putRun, fetchRun, appendIndex, queryRuns, dataDir as storeDataDir,
  type SubjectMap,
} from "./db.js";

/** Subject ids P-01..P-19 belong to the existing personas. New subjects start at P-20. */
const RESERVED_THROUGH = 19;

/* ------------------------------------------------------------------ subjects */

/**
 * One stable id per person. Case-insensitive, because Sid@x.com and sid@x.com
 * are the same human and two ids for one human is the bug that makes every
 * downstream count wrong.
 */
export async function resolveSubjectId(email: string): Promise<string> {
  const key = email.trim().toLowerCase();
  const map = await loadSubjects({ byEmail: {}, nextOrdinal: RESERVED_THROUGH + 1 });
  if (map.byEmail[key]) return map.byEmail[key];

  const code = `P-${String(map.nextOrdinal).padStart(2, "0")}`;
  map.byEmail[key] = code;
  map.nextOrdinal += 1;
  await saveSubjects(map);
  return code;
}

export async function subjectIndex(): Promise<SubjectMap> {
  return loadSubjects({ byEmail: {}, nextOrdinal: RESERVED_THROUGH + 1 });
}

/* -------------------------------------------------------------------- ledger */

type Ledger = Record<string, { calls: number; spendINR: number }>; // key: "YYYY-MM:vendor"

const monthKey = (vendor: string) =>
  `${new Date().toISOString().slice(0, 7)}:${vendor}`;

export async function capReached(vendor: string, cap: number): Promise<boolean> {
  const ledger = await loadLedger<Ledger>({});
  return (ledger[monthKey(vendor)]?.calls ?? 0) >= cap;
}

export async function recordSpend(vendor: string, costINR: number): Promise<void> {
  const ledger = await loadLedger<Ledger>({});
  const k = monthKey(vendor);
  const cur = ledger[k] ?? { calls: 0, spendINR: 0 };
  ledger[k] = {
    calls: cur.calls + 1,
    spendINR: Math.round((cur.spendINR + costINR) * 100) / 100,
  };
  await saveLedger(ledger);
}

export async function ledgerSnapshot(): Promise<Ledger> {
  return loadLedger<Ledger>({});
}

/* ---------------------------------------------------------------------- runs */

export interface RunStep {
  t: string;               // ISO timestamp
  level: "info" | "warn" | "error";
  msg: string;
  detail?: unknown;
}

export interface RunRecord {
  runId: string;
  subjectId: string;
  emailHash: string;       // see note below
  email?: string;          // present only when RACE_LOG_EMAIL=true
  useCase: string;
  sector?: string;
  ticketBand?: string;
  startedAt: string;
  finishedAt?: string;
  status: "running" | "completed" | "failed";
  vendorsCalled: { vendor: string; ok: boolean; itemCount?: number; costINR?: number; error?: string | null }[];
  costINR: number;
  skillId?: string;
  skillVersion?: string;
  model?: string;
  usage?: unknown;
  steps: RunStep[];
  intake?: unknown;        // the guarded record the skill produced
  raw?: unknown;           // credentials scrubbed before disk, always
  summary?: unknown;       // display-only view of the fetch (see summary.ts)
  views?: unknown;         // the five export-shaped views (see extract.ts)
  error?: string;
}

/**
 * The run index carries a hash rather than the address by default. It makes the
 * operational log — how many runs, what they cost, which vendor is failing —
 * readable without it being a list of everyone the engine has ever looked up.
 * The address itself lives in the subject map, which is the one place it needs
 * to be, and set RACE_LOG_EMAIL=true if the demo needs it inline.
 */
export const hashEmail = (email: string) =>
  crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 16);

export function newRunId(): string {
  return `run_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;
}

/**
 * Credentials never reach the disk, whatever RACE_KEEP_RAW says.
 *
 * `dataBreach.results[]` comes back from Behind the Email with cleartext
 * passwords and IP addresses in it. The skill's guards drop those before the
 * intake record is built, but the RAW payload still has them, so if we are
 * keeping raw for debugging we scrub these fields on the way to the file. What
 * survives is the shape — the field was there, and what class of data it held —
 * which is what a debugging session actually needs.
 */
const CREDENTIAL_FIELDS = new Set([
  "password", "passwords", "passwordhash", "password_hash", "hash",
  "ipaddress", "ip_address", "ip", "salt", "token", "cookie",
]);

export function scrubCredentials(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(scrubCredentials);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (CREDENTIAL_FIELDS.has(k.toLowerCase().replace(/[^a-z_]/g, ""))) {
        out[k] = v == null || v === "" ? v : "[redacted:credential]";
      } else {
        out[k] = scrubCredentials(v);
      }
    }
    return out;
  }
  return value;
}

export async function saveRun(run: RunRecord): Promise<void> {
  // Raw payloads are kept by default now that the fetch IS the deliverable, but
  // credentials never reach disk either way. dataBreach.results[] arrives with
  // cleartext passwords and IP addresses in it; what survives is the shape —
  // the field was there, and what class of data it held — which is what anyone
  // debugging this actually needs.
  const toWrite: RunRecord = {
    ...run,
    raw: process.env.RACE_KEEP_RAW === "false" ? undefined : scrubCredentials(run.raw),
  };
  await putRun(run.runId, toWrite);

  if (run.status !== "running") {
    const { runId, subjectId, emailHash, email, useCase, startedAt, finishedAt,
            status, costINR, vendorsCalled, skillVersion, error } = toWrite;
    await appendIndex({
        runId, subjectId, emailHash, email, useCase, startedAt, finishedAt, status,
        costINR, skillVersion, error,
        vendors: vendorsCalled.map((v) => `${v.vendor}:${v.ok ? v.itemCount ?? 0 : "fail"}`),
    });
  }
}

export async function listRuns(limit = 50): Promise<any[]> {
  return queryRuns(limit);
}

export async function getRun(runId: string): Promise<RunRecord | null> {
  // The id comes off a URL, so refuse anything that is not the shape we mint.
  if (!/^run_[a-z0-9]+_[0-9a-f]{8}$/.test(runId)) return null;
  return fetchRun(runId);
}

export function dataDir(): string {
  return storeDataDir();
}
