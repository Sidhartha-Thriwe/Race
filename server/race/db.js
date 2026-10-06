import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs
} from "firebase/firestore";
const DATA_DIR = process.env.RACE_DATA_DIR ? path.resolve(process.env.RACE_DATA_DIR) : path.join(process.cwd(), ".race-data");
const RUNS_DIR = path.join(DATA_DIR, "runs");
let firestore = null;
let backend = "filesystem";
let initError = null;
let initialised = false;
const RUNS_COLLECTION = "race_runs";
const TARGETS_COLLECTION = "race_targets";
const SCRAPES_COLLECTION = "race_scrapes";
const PERSONAS_COLLECTION = "race_personas";
const CATEGORIES_COLLECTION = "race_categories";
function appletConfig() {
  for (const p of [
    "firebase-applet-config.json",
    path.join(process.cwd(), "firebase-applet-config.json")
  ]) {
    try {
      return JSON.parse(fs.readFileSync(p, "utf8"));
    } catch {
    }
  }
  return {};
}
async function initStore() {
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
    const app = getApps().find((a) => a.name === "raceServer") ?? initializeApp(cfg, "raceServer");
    const client = getFirestore(app, databaseId);
    const probe = getDocs(query(collection(client, RUNS_COLLECTION), limit(1))).then(() => ({ ok: true })).catch((err) => ({ ok: false, err }));
    const outcome = await Promise.race([
      probe,
      new Promise(
        (resolve) => setTimeout(
          () => resolve({ ok: false, err: new Error("Firestore probe timed out after 8s") }),
          8e3
        )
      )
    ]);
    if (!outcome.ok) throw outcome.err;
    firestore = client;
    backend = "firestore";
    initError = null;
    console.log(`[race] storage: firestore (${projectId} / ${databaseId ?? "default"})`);
    await loadWorkspaceId();
  } catch (e) {
    initError = `${e?.name ?? "Error"}: ${e?.message ?? String(e)}`;
    backend = "filesystem";
    console.warn(`[race] storage: filesystem \u2014 Firestore unavailable (${initError})`);
  }
  return { backend, error: initError };
}
function storeInfo() {
  return { backend, error: initError };
}
function ensureDirs() {
  fs.mkdirSync(RUNS_DIR, { recursive: true });
  fs.mkdirSync(path.join(DATA_DIR, "targets"), { recursive: true });
  fs.mkdirSync(path.join(DATA_DIR, "scrapes"), { recursive: true });
  fs.mkdirSync(path.join(DATA_DIR, "personas"), { recursive: true });
  fs.mkdirSync(path.join(DATA_DIR, "categories"), { recursive: true });
}
async function writeAtomic(file, data) {
  ensureDirs();
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fsp.writeFile(tmp, data, "utf8");
  await fsp.rename(tmp, file);
}
async function readJsonFile(file, fallback) {
  try {
    return JSON.parse(await fsp.readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}
async function loadSubjects(seed) {
  if (backend === "firestore" && firestore) {
    try {
      const snap = await getDoc(doc(firestore, "race_meta", "subjects"));
      return snap.exists() ? snap.data() : seed;
    } catch (err) {
      console.warn(`[race] Firestore loadSubjects error: ${err?.message}; using filesystem`);
    }
  }
  return readJsonFile(path.join(DATA_DIR, "subjects.json"), seed);
}
async function saveSubjects(map) {
  if (backend === "firestore" && firestore) {
    try {
      await setDoc(doc(firestore, "race_meta", "subjects"), map);
      return;
    } catch (err) {
      console.warn(`[race] Firestore saveSubjects error: ${err?.message}; falling back to filesystem`);
    }
  }
  await writeAtomic(path.join(DATA_DIR, "subjects.json"), JSON.stringify(map, null, 2));
}
async function loadLedger(seed) {
  if (backend === "firestore" && firestore) {
    try {
      const snap = await getDoc(doc(firestore, "race_meta", "ledger"));
      return snap.exists() ? snap.data() : seed;
    } catch (err) {
      console.warn(`[race] Firestore loadLedger error: ${err?.message}; using filesystem`);
    }
  }
  return readJsonFile(path.join(DATA_DIR, "ledger.json"), seed);
}
async function saveLedger(ledger) {
  if (backend === "firestore" && firestore) {
    try {
      await setDoc(doc(firestore, "race_meta", "ledger"), ledger);
      return;
    } catch (err) {
      console.warn(`[race] Firestore saveLedger error: ${err?.message}; falling back to filesystem`);
    }
  }
  await writeAtomic(path.join(DATA_DIR, "ledger.json"), JSON.stringify(ledger, null, 2));
}
async function putRun(runId, record) {
  if (backend === "firestore" && firestore) {
    try {
      await setDoc(
        doc(firestore, RUNS_COLLECTION, runId),
        JSON.parse(JSON.stringify(record))
      );
      return;
    } catch (err) {
      console.warn(`[race] Firestore putRun error: ${err?.message}; falling back to filesystem`);
    }
  }
  await writeAtomic(path.join(RUNS_DIR, `${runId}.json`), JSON.stringify(record, null, 2));
}
async function fetchRun(runId) {
  if (backend === "firestore" && firestore) {
    try {
      const snap = await getDoc(doc(firestore, RUNS_COLLECTION, runId));
      return snap.exists() ? snap.data() : null;
    } catch (err) {
      console.warn(`[race] Firestore fetchRun error: ${err?.message}; falling back to filesystem`);
    }
  }
  return readJsonFile(path.join(RUNS_DIR, `${runId}.json`), null);
}
async function appendIndex(entry) {
  if (backend === "firestore") return;
  ensureDirs();
  await fsp.appendFile(path.join(DATA_DIR, "runs.jsonl"), JSON.stringify(entry) + "\n", "utf8");
}
async function queryRuns(limitCount) {
  if (backend === "firestore" && firestore) {
    try {
      const q = query(
        collection(firestore, RUNS_COLLECTION),
        orderBy("startedAt", "desc"),
        limit(limitCount)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data());
    } catch (err) {
      console.warn(`[race] Firestore queryRuns error: ${err?.message}; falling back to filesystem`);
    }
  }
  try {
    const lines = (await fsp.readFile(path.join(DATA_DIR, "runs.jsonl"), "utf8")).trim().split("\n").filter(Boolean);
    return lines.slice(-limitCount).reverse().map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return { malformed: l };
      }
    });
  } catch {
    return [];
  }
}
async function putTargets(subjectId, plan) {
  if (backend === "firestore" && firestore) {
    try {
      await setDoc(
        doc(firestore, TARGETS_COLLECTION, subjectId),
        JSON.parse(JSON.stringify(plan))
      );
      return "firestore";
    } catch (err) {
      console.warn(`[race] Firestore putTargets error: ${err?.message}; falling back to filesystem`);
    }
  }
  await writeAtomic(
    path.join(DATA_DIR, "targets", `${subjectId}.json`),
    JSON.stringify(plan, null, 2)
  );
  return "filesystem";
}
async function fetchTargets(subjectId) {
  if (backend === "firestore" && firestore) {
    try {
      const snap = await getDoc(doc(firestore, TARGETS_COLLECTION, subjectId));
      return snap.exists() ? snap.data() : null;
    } catch (err) {
      console.warn(`[race] Firestore fetchTargets error: ${err?.message}; falling back to filesystem`);
    }
  }
  return readJsonFile(path.join(DATA_DIR, "targets", `${subjectId}.json`), null);
}
async function putScrape(subjectId, result) {
  const { data, ...summary } = result;
  const platforms = Object.keys(data ?? {});
  if (backend === "firestore" && firestore) {
    try {
      await setDoc(
        doc(firestore, SCRAPES_COLLECTION, subjectId),
        JSON.parse(JSON.stringify({ ...summary, platforms }))
      );
      for (const platform of platforms) {
        await setDoc(
          doc(firestore, SCRAPES_COLLECTION, `${subjectId}__${platform}`),
          JSON.parse(JSON.stringify({ subjectId, platform, items: data[platform] }))
        );
      }
      return "firestore";
    } catch (err) {
      console.warn(`[race] Firestore putScrape error: ${err?.message}; falling back to filesystem`);
    }
  }
  await writeAtomic(
    path.join(DATA_DIR, "scrapes", `${subjectId}.json`),
    JSON.stringify(result, null, 2)
  );
  return "filesystem";
}
async function fetchScrape(subjectId) {
  if (backend === "firestore" && firestore) {
    try {
      const snap = await getDoc(doc(firestore, SCRAPES_COLLECTION, subjectId));
      if (!snap.exists()) return null;
      const summary = snap.data();
      const data = {};
      for (const platform of summary.platforms ?? []) {
        const part = await getDoc(
          doc(firestore, SCRAPES_COLLECTION, `${subjectId}__${platform}`)
        );
        data[platform] = part.exists() ? part.data().items ?? [] : [];
      }
      return { ...summary, data };
    } catch (err) {
      console.warn(`[race] Firestore fetchScrape error: ${err?.message}; falling back to filesystem`);
    }
  }
  return readJsonFile(path.join(DATA_DIR, "scrapes", `${subjectId}.json`), null);
}
async function putPersona(subjectId, persona) {
  if (backend === "firestore" && firestore) {
    try {
      await setDoc(
        doc(firestore, PERSONAS_COLLECTION, subjectId),
        JSON.parse(JSON.stringify(persona))
      );
      return "firestore";
    } catch (err) {
      console.warn(`[race] Firestore putPersona error: ${err?.message}; falling back to filesystem`);
    }
  }
  await writeAtomic(
    path.join(DATA_DIR, "personas", `${subjectId}.json`),
    JSON.stringify(persona, null, 2)
  );
  return "filesystem";
}
async function fetchPersona(subjectId) {
  if (backend === "firestore" && firestore) {
    try {
      const snap = await getDoc(doc(firestore, PERSONAS_COLLECTION, subjectId));
      return snap.exists() ? snap.data() : null;
    } catch (err) {
      console.warn(`[race] Firestore fetchPersona error: ${err?.message}; falling back to filesystem`);
    }
  }
  return readJsonFile(path.join(DATA_DIR, "personas", `${subjectId}.json`), null);
}
async function putCategories(subjectId, categories) {
  if (backend === "firestore" && firestore) {
    try {
      await setDoc(
        doc(firestore, CATEGORIES_COLLECTION, subjectId),
        JSON.parse(JSON.stringify(categories))
      );
      return "firestore";
    } catch (err) {
      console.warn(`[race] Firestore putCategories error: ${err?.message}; falling back to filesystem`);
    }
  }
  await writeAtomic(
    path.join(DATA_DIR, "categories", `${subjectId}.json`),
    JSON.stringify(categories, null, 2)
  );
  return "filesystem";
}
async function fetchCategories(subjectId) {
  if (backend === "firestore" && firestore) {
    try {
      const snap = await getDoc(doc(firestore, CATEGORIES_COLLECTION, subjectId));
      return snap.exists() ? snap.data() : null;
    } catch (err) {
      console.warn(`[race] Firestore fetchCategories error: ${err?.message}; falling back to filesystem`);
    }
  }
  return readJsonFile(path.join(DATA_DIR, "categories", `${subjectId}.json`), null);
}
async function loadWorkspaceId() {
  if (process.env.ANTHROPIC_WORKSPACE_ID?.trim()) {
    return process.env.ANTHROPIC_WORKSPACE_ID.trim();
  }
  if (backend === "firestore" && firestore) {
    try {
      const snap = await getDoc(doc(firestore, "race_meta", "config"));
      if (snap.exists()) {
        const data = snap.data();
        if (data?.workspaceId) {
          process.env.ANTHROPIC_WORKSPACE_ID = data.workspaceId;
          return data.workspaceId;
        }
      }
    } catch (err) {
      console.warn(`[race] Firestore loadWorkspaceId error: ${err?.message}`);
    }
  }
  const local = await readJsonFile(path.join(DATA_DIR, "config.json"), {});
  if (local?.workspaceId) {
    process.env.ANTHROPIC_WORKSPACE_ID = local.workspaceId;
    return local.workspaceId;
  }
  return null;
}
async function saveWorkspaceId(workspaceId) {
  const trimmed = workspaceId.trim();
  if (!trimmed) return;
  process.env.ANTHROPIC_WORKSPACE_ID = trimmed;
  if (backend === "firestore" && firestore) {
    try {
      await setDoc(doc(firestore, "race_meta", "config"), { workspaceId: trimmed, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }, { merge: true });
      return;
    } catch (err) {
      console.warn(`[race] Firestore saveWorkspaceId error: ${err?.message}; falling back to filesystem`);
    }
  }
  await writeAtomic(path.join(DATA_DIR, "config.json"), JSON.stringify({ workspaceId: trimmed }, null, 2));
}
function dataDir() {
  return DATA_DIR;
}
export {
  appendIndex,
  dataDir,
  fetchCategories,
  fetchPersona,
  fetchRun,
  fetchScrape,
  fetchTargets,
  initStore,
  loadLedger,
  loadSubjects,
  loadWorkspaceId,
  putCategories,
  putPersona,
  putRun,
  putScrape,
  putTargets,
  queryRuns,
  saveLedger,
  saveSubjects,
  saveWorkspaceId,
  storeInfo
};
