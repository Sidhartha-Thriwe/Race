/**
 * Storage, with two backends behind one interface.
 *
 * Firestore when it is reachable, the filesystem when it is not. The fallback
 * is not defensive padding — it is the difference between a demo that works and
 * a demo that doesn't. Server-side Firestore on Cloud Run authenticates through
 * the service account with no key file (Application Default Credentials), which
 * normally just works in the same project, but "normally" is not something to
 * discover live. /api/race/status always reports which backend is active.
 *
 * Writes go through the Admin SDK deliberately, not the client SDK in
 * src/firebase.ts. Admin bypasses firestore.rules, so run records — which hold
 * personal data — are reachable only from the server. Nothing has to be opened
 * up in the rules for this to work, and the browser never sees a vendor payload.
 *
 * Note the database id: this project uses a NAMED Firestore database, not
 * (default). Omitting it connects to a database that does not exist and fails
 * in a way that reads like a permissions error.
 */

import fs from "fs";
import fsp from "fs/promises";
import path from "path";

const DATA_DIR = process.env.RACE_DATA_DIR
  ? path.resolve(process.env.RACE_DATA_DIR)
  : path.join(process.cwd(), ".race-data");

const RUNS_DIR = path.join(DATA_DIR, "runs");

export type Backend = "firestore" | "filesystem";

let firestore: any = null;
let backend: Backend = "filesystem";
let initError: string | null = null;
let initialised = false;

const SUBJECTS_DOC = "race_meta/subjects";
const RUNS_COLLECTION = "race_runs";

function appletConfig(): { projectId?: string; firestoreDatabaseId?: string } {
  // Written by AI Studio's Firebase integration. Read rather than hardcoded so
  // a reprovision does not silently point us at the old database.
  for (const p of ["firebase-applet-config.json",
                   path.join(process.cwd(), "firebase-applet-config.json")]) {
    try {
      return JSON.parse(fs.readFileSync(p, "utf8"));
    } catch { /* try the next */ }
  }
  return {};
}

/**
 * The Firestore/gRPC stack surfaces credential failures as unhandled rejections
 * on background ticks, from retry timers we never hold a handle to. Node's
 * default for an unhandled rejection is to kill the process — so on any machine
 * without Application Default Credentials, the server dies at boot instead of
 * falling back to disk. Verified by watching exactly that happen.
 *
 * The guard stays installed for the process lifetime, because the late
 * rejections keep arriving after init has long since given up. It is
 * deliberately narrow: only auth- and Firestore-shaped reasons are swallowed,
 * and everything else is re-thrown so real bugs still crash loudly.
 */
let guardInstalled = false;
function installAuthRejectionGuard() {
  if (guardInstalled) return;
  guardInstalled = true;
  process.on("unhandledRejection", (reason: any) => {
    const msg = String(reason?.message ?? reason);
    if (/credential|ADC|authenticat|metadata server|UNAUTHENTICATED|PERMISSION_DENIED|GoogleAuth|grpc/i.test(msg)) {
      console.warn(`[race] ignored late Firestore auth rejection: ${msg.split("\n")[0]}`);
      return;
    }
    throw reason;
  });
}

export async function initStore(): Promise<{ backend: Backend; error: string | null }> {
  if (initialised) return { backend, error: initError };
  initialised = true;

  if (process.env.RACE_FORCE_FILESYSTEM === "true") {
    initError = "forced to filesystem by RACE_FORCE_FILESYSTEM";
    return { backend, error: initError };
  }

  installAuthRejectionGuard();

  try {
    const cfg = appletConfig();
    const projectId = process.env.GOOGLE_CLOUD_PROJECT ?? cfg.projectId;
    const databaseId = process.env.RACE_FIRESTORE_DB ?? cfg.firestoreDatabaseId;
    if (!projectId) throw new Error("no projectId (firebase-applet-config.json missing?)");

    const { Firestore } = await import("@google-cloud/firestore");
    const client = new Firestore({
      projectId,
      ...(databaseId && databaseId !== "(default)" ? { databaseId } : {}),
    });

    // A real round trip. Constructing the client never fails, so without this
    // the first failure would be the first run of the demo. Bounded, because an
    // unreachable metadata server hangs rather than erroring, and a server that
    // never finishes booting is worse than one on the fallback store.
    // Attach a catch to the probe itself and keep that handled promise, so a
    // rejection arriving AFTER the timeout still counts as handled. Racing
    // alone is not enough: the loser of the race keeps running, and its
    // rejection lands on a later tick with nobody listening.
    const probe = client.collection(RUNS_COLLECTION).limit(1).get()
      .then(() => ({ ok: true as const }))
      .catch((err: any) => ({ ok: false as const, err }));

    const outcome: any = await Promise.race([
      probe,
      new Promise((resolve) =>
        setTimeout(() => resolve({ ok: false, err: new Error("Firestore probe timed out after 8s") }), 8000)),
    ]);
    if (!outcome.ok) throw outcome.err;

    firestore = client;
    backend = "firestore";
    initError = null;
    console.log(`[race] storage: firestore (${projectId} / ${databaseId ?? "default"})`);
  } catch (e: any) {
    initError = `${e?.name ?? "Error"}: ${e?.message ?? String(e)}`;
    backend = "filesystem";
    console.warn(`[race] storage: filesystem — Firestore unavailable (${initError})`);
  }

  return { backend, error: initError };
}

export function storeInfo(): { backend: Backend; error: string | null } {
  return { backend, error: initError };
}

/* ------------------------------------------------------------- filesystem */

function ensureDirs() {
  fs.mkdirSync(RUNS_DIR, { recursive: true });
}

async function writeAtomic(file: string, data: string) {
  ensureDirs();
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fsp.writeFile(tmp, data, "utf8");
  await fsp.rename(tmp, file);
}

async function readJsonFile<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fsp.readFile(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

/* ------------------------------------------------------------ the interface */

export type SubjectMap = { byEmail: Record<string, string>; nextOrdinal: number };

export async function loadSubjects(seed: SubjectMap): Promise<SubjectMap> {
  if (backend === "firestore") {
    const snap = await firestore.doc(SUBJECTS_DOC).get();
    return snap.exists ? (snap.data() as SubjectMap) : seed;
  }
  return readJsonFile(path.join(DATA_DIR, "subjects.json"), seed);
}

export async function saveSubjects(map: SubjectMap): Promise<void> {
  if (backend === "firestore") {
    await firestore.doc(SUBJECTS_DOC).set(map);
    return;
  }
  await writeAtomic(path.join(DATA_DIR, "subjects.json"), JSON.stringify(map, null, 2));
}

export async function loadLedger<T>(seed: T): Promise<T> {
  if (backend === "firestore") {
    const snap = await firestore.doc("race_meta/ledger").get();
    return snap.exists ? (snap.data() as T) : seed;
  }
  return readJsonFile(path.join(DATA_DIR, "ledger.json"), seed);
}

export async function saveLedger(ledger: unknown): Promise<void> {
  if (backend === "firestore") {
    await firestore.doc("race_meta/ledger").set(ledger as any);
    return;
  }
  await writeAtomic(path.join(DATA_DIR, "ledger.json"), JSON.stringify(ledger, null, 2));
}

export async function putRun(runId: string, record: any): Promise<void> {
  if (backend === "firestore") {
    // Firestore rejects undefined; strip it rather than letting one absent
    // optional field fail the whole write.
    await firestore.collection(RUNS_COLLECTION).doc(runId)
      .set(JSON.parse(JSON.stringify(record)));
    return;
  }
  await writeAtomic(path.join(RUNS_DIR, `${runId}.json`), JSON.stringify(record, null, 2));
}

export async function fetchRun(runId: string): Promise<any | null> {
  if (backend === "firestore") {
    const snap = await firestore.collection(RUNS_COLLECTION).doc(runId).get();
    return snap.exists ? snap.data() : null;
  }
  return readJsonFile(path.join(RUNS_DIR, `${runId}.json`), null);
}

export async function appendIndex(entry: any): Promise<void> {
  // Firestore needs no separate index — the collection IS the index.
  if (backend === "firestore") return;
  ensureDirs();
  await fsp.appendFile(path.join(DATA_DIR, "runs.jsonl"), JSON.stringify(entry) + "\n", "utf8");
}

export async function queryRuns(limit: number): Promise<any[]> {
  if (backend === "firestore") {
    const snap = await firestore.collection(RUNS_COLLECTION)
      .orderBy("startedAt", "desc").limit(limit).get();
    return snap.docs.map((d: any) => d.data());
  }
  try {
    const lines = (await fsp.readFile(path.join(DATA_DIR, "runs.jsonl"), "utf8"))
      .trim().split("\n").filter(Boolean);
    return lines.slice(-limit).reverse().map((l) => {
      try { return JSON.parse(l); } catch { return { malformed: l }; }
    });
  } catch {
    return [];
  }
}

export function dataDir(): string {
  return DATA_DIR;
}
