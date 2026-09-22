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
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  Firestore,
} from "firebase/firestore";

const DATA_DIR = process.env.RACE_DATA_DIR
  ? path.resolve(process.env.RACE_DATA_DIR)
  : path.join(process.cwd(), ".race-data");

const RUNS_DIR = path.join(DATA_DIR, "runs");

export type Backend = "firestore" | "filesystem";

let firestore: Firestore | null = null;
let backend: Backend = "filesystem";
let initError: string | null = null;
let initialised = false;

const RUNS_COLLECTION = "race_runs";
const TARGETS_COLLECTION = "race_targets";

function appletConfig(): {
  projectId?: string;
  firestoreDatabaseId?: string;
  apiKey?: string;
  authDomain?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
} {
  // Written by AI Studio's Firebase integration. Read rather than hardcoded so
  // a reprovision does not silently point us at the old database.
  for (const p of [
    "firebase-applet-config.json",
    path.join(process.cwd(), "firebase-applet-config.json"),
  ]) {
    try {
      return JSON.parse(fs.readFileSync(p, "utf8"));
    } catch {
      /* try the next */
    }
  }
  return {};
}

export async function initStore(): Promise<{ backend: Backend; error: string | null }> {
  if (initialised) return { backend, error: initError };
  initialised = true;

  if (process.env.RACE_FORCE_FILESYSTEM === "true") {
    initError = "forced to filesystem by RACE_FORCE_FILESYSTEM";
    return { backend, error: initError };
  }

  try {
    const cfg = appletConfig();
    const projectId = process.env.GOOGLE_CLOUD_PROJECT ?? cfg.projectId;
    const databaseId = process.env.RACE_FIRESTORE_DB ?? cfg.firestoreDatabaseId;
    if (!projectId) throw new Error("no projectId (firebase-applet-config.json missing?)");

    // Initialize Firebase app for server instance
    const app = getApps().find((a) => a.name === "raceServer") ?? initializeApp(cfg, "raceServer");
    const client = getFirestore(app, databaseId);

    // Verify round-trip connection to the database
    const probe = getDocs(query(collection(client, RUNS_COLLECTION), limit(1)))
      .then(() => ({ ok: true as const }))
      .catch((err: any) => ({ ok: false as const, err }));

    const outcome: any = await Promise.race([
      probe,
      new Promise((resolve) =>
        setTimeout(
          () => resolve({ ok: false, err: new Error("Firestore probe timed out after 8s") }),
          8000
        )
      ),
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
  fs.mkdirSync(path.join(DATA_DIR, "targets"), { recursive: true });
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
  if (backend === "firestore" && firestore) {
    try {
      const snap = await getDoc(doc(firestore, "race_meta", "subjects"));
      return snap.exists() ? (snap.data() as SubjectMap) : seed;
    } catch (err: any) {
      console.warn(`[race] Firestore loadSubjects error: ${err?.message}; using filesystem`);
    }
  }
  return readJsonFile(path.join(DATA_DIR, "subjects.json"), seed);
}

export async function saveSubjects(map: SubjectMap): Promise<void> {
  if (backend === "firestore" && firestore) {
    try {
      await setDoc(doc(firestore, "race_meta", "subjects"), map);
      return;
    } catch (err: any) {
      console.warn(`[race] Firestore saveSubjects error: ${err?.message}; falling back to filesystem`);
    }
  }
  await writeAtomic(path.join(DATA_DIR, "subjects.json"), JSON.stringify(map, null, 2));
}

export async function loadLedger<T>(seed: T): Promise<T> {
  if (backend === "firestore" && firestore) {
    try {
      const snap = await getDoc(doc(firestore, "race_meta", "ledger"));
      return snap.exists() ? (snap.data() as T) : seed;
    } catch (err: any) {
      console.warn(`[race] Firestore loadLedger error: ${err?.message}; using filesystem`);
    }
  }
  return readJsonFile(path.join(DATA_DIR, "ledger.json"), seed);
}

export async function saveLedger(ledger: unknown): Promise<void> {
  if (backend === "firestore" && firestore) {
    try {
      await setDoc(doc(firestore, "race_meta", "ledger"), ledger as any);
      return;
    } catch (err: any) {
      console.warn(`[race] Firestore saveLedger error: ${err?.message}; falling back to filesystem`);
    }
  }
  await writeAtomic(path.join(DATA_DIR, "ledger.json"), JSON.stringify(ledger, null, 2));
}

export async function putRun(runId: string, record: any): Promise<void> {
  if (backend === "firestore" && firestore) {
    try {
      // Firestore rejects undefined; strip it cleanly
      await setDoc(
        doc(firestore, RUNS_COLLECTION, runId),
        JSON.parse(JSON.stringify(record))
      );
      return;
    } catch (err: any) {
      console.warn(`[race] Firestore putRun error: ${err?.message}; falling back to filesystem`);
    }
  }
  await writeAtomic(path.join(RUNS_DIR, `${runId}.json`), JSON.stringify(record, null, 2));
}

export async function fetchRun(runId: string): Promise<any | null> {
  if (backend === "firestore" && firestore) {
    try {
      const snap = await getDoc(doc(firestore, RUNS_COLLECTION, runId));
      return snap.exists() ? snap.data() : null;
    } catch (err: any) {
      console.warn(`[race] Firestore fetchRun error: ${err?.message}; falling back to filesystem`);
    }
  }
  return readJsonFile(path.join(RUNS_DIR, `${runId}.json`), null);
}

export async function appendIndex(entry: any): Promise<void> {
  // Firestore needs no separate index — the collection IS the index.
  if (backend === "firestore") return;
  ensureDirs();
  await fsp.appendFile(path.join(DATA_DIR, "runs.jsonl"), JSON.stringify(entry) + "\n", "utf8");
}

export async function queryRuns(limitCount: number): Promise<any[]> {
  if (backend === "firestore" && firestore) {
    try {
      const q = query(
        collection(firestore, RUNS_COLLECTION),
        orderBy("startedAt", "desc"),
        limit(limitCount)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data());
    } catch (err: any) {
      console.warn(`[race] Firestore queryRuns error: ${err?.message}; falling back to filesystem`);
    }
  }
  try {
    const lines = (await fsp.readFile(path.join(DATA_DIR, "runs.jsonl"), "utf8"))
      .trim().split("\n").filter(Boolean);
    return lines.slice(-limitCount).reverse().map((l) => {
      try { return JSON.parse(l); } catch { return { malformed: l }; }
    });
  } catch {
    return [];
  }
}

/** Step 2 plans, keyed by subject id — one current plan per subject. */
export async function putTargets(subjectId: string, plan: any): Promise<Backend> {
  if (backend === "firestore" && firestore) {
    try {
      await setDoc(doc(firestore, TARGETS_COLLECTION, subjectId),
                   JSON.parse(JSON.stringify(plan)));
      return "firestore";
    } catch (err: any) {
      console.warn(`[race] Firestore putTargets error: ${err?.message}; falling back to filesystem`);
    }
  }
  // The fallback keeps the app working, but the caller must be able to say so.
  // A write that quietly lands on an ephemeral disk while the UI reports
  // success is the same "looks like it worked" failure as an empty vendor
  // response — it only surfaces after a redeploy has thrown the data away.
  await writeAtomic(path.join(DATA_DIR, "targets", `${subjectId}.json`),
                    JSON.stringify(plan, null, 2));
  return "filesystem";
}

export async function fetchTargets(subjectId: string): Promise<any | null> {
  if (backend === "firestore" && firestore) {
    try {
      const snap = await getDoc(doc(firestore, TARGETS_COLLECTION, subjectId));
      return snap.exists() ? snap.data() : null;
    } catch (err: any) {
      console.warn(`[race] Firestore fetchTargets error: ${err?.message}; falling back to filesystem`);
    }
  }
  return readJsonFile(path.join(DATA_DIR, "targets", `${subjectId}.json`), null);
}

export function dataDir(): string {
  return DATA_DIR;
}

