import crypto from "crypto";
import {
  loadSubjects,
  saveSubjects,
  loadLedger,
  saveLedger,
  putRun,
  fetchRun,
  appendIndex,
  queryRuns,
  dataDir as storeDataDir
} from "./db.js";
const RESERVED_THROUGH = 19;
async function resolveSubjectId(email) {
  const key = email.trim().toLowerCase();
  const map = await loadSubjects({ byEmail: {}, nextOrdinal: RESERVED_THROUGH + 1 });
  if (map.byEmail[key]) return map.byEmail[key];
  const code = `P-${String(map.nextOrdinal).padStart(2, "0")}`;
  map.byEmail[key] = code;
  map.nextOrdinal += 1;
  await saveSubjects(map);
  return code;
}
async function subjectIndex() {
  return loadSubjects({ byEmail: {}, nextOrdinal: RESERVED_THROUGH + 1 });
}
const monthKey = (vendor) => `${(/* @__PURE__ */ new Date()).toISOString().slice(0, 7)}:${vendor}`;
async function capReached(vendor, cap) {
  const ledger = await loadLedger({});
  return (ledger[monthKey(vendor)]?.calls ?? 0) >= cap;
}
async function recordSpend(vendor, costINR) {
  const ledger = await loadLedger({});
  const k = monthKey(vendor);
  const cur = ledger[k] ?? { calls: 0, spendINR: 0 };
  ledger[k] = {
    calls: cur.calls + 1,
    spendINR: Math.round((cur.spendINR + costINR) * 100) / 100
  };
  await saveLedger(ledger);
}
async function ledgerSnapshot() {
  return loadLedger({});
}
const hashEmail = (email) => crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 16);
function newRunId() {
  return `run_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;
}
const CREDENTIAL_FIELDS = /* @__PURE__ */ new Set([
  "password",
  "passwords",
  "passwordhash",
  "password_hash",
  "hash",
  "ipaddress",
  "ip_address",
  "ip",
  "salt",
  "token",
  "cookie"
]);
const BREACH_PERSONAL_FIELDS = /* @__PURE__ */ new Set([
  "fullname",
  "full_name",
  "phonenumber",
  "phone_number",
  "phone",
  "username",
  "name",
  "address",
  "dob",
  "dateofbirth"
]);
function scrubBreachResults(results) {
  if (!Array.isArray(results)) return results;
  return results.map((r) => {
    if (!r || typeof r !== "object") return r;
    const out = {};
    for (const [k, v] of Object.entries(r)) {
      if (k === "source") {
        out[k] = v;
        continue;
      }
      if (BREACH_PERSONAL_FIELDS.has(k.toLowerCase().replace(/[^a-z_]/g, ""))) {
        out[k] = "[redacted:breach-personal]";
      } else {
        out[k] = v;
      }
    }
    return out;
  });
}
function scrubCredentials(value) {
  if (Array.isArray(value)) return value.map(scrubCredentials);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === "dataBreach" && v && typeof v === "object") {
        const b = v;
        out[k] = scrubCredentials({ ...b, results: scrubBreachResults(b.results) });
        continue;
      }
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
async function saveRun(run) {
  const toWrite = {
    ...run,
    raw: process.env.RACE_KEEP_RAW === "false" ? void 0 : scrubCredentials(run.raw)
  };
  await putRun(run.runId, toWrite);
  if (run.status !== "running") {
    const {
      runId,
      subjectId,
      emailHash,
      email,
      useCase,
      startedAt,
      finishedAt,
      status,
      costINR,
      vendorsCalled,
      skillVersion,
      error
    } = toWrite;
    await appendIndex({
      runId,
      subjectId,
      emailHash,
      email,
      useCase,
      startedAt,
      finishedAt,
      status,
      costINR,
      skillVersion,
      error,
      vendors: vendorsCalled.map((v) => `${v.vendor}:${v.ok ? v.itemCount ?? 0 : "fail"}`)
    });
  }
}
async function subjectSummaries() {
  const map = await subjectIndex();
  const runs = await queryRuns(500);
  const latest = /* @__PURE__ */ new Map();
  for (const r of runs) {
    if (r?.status !== "completed") continue;
    const seen = latest.get(r.subjectId);
    if (!seen || String(r.startedAt) > String(seen.startedAt)) latest.set(r.subjectId, r);
  }
  const byId = /* @__PURE__ */ new Map();
  for (const [email, id] of Object.entries(map.byEmail)) byId.set(id, email);
  return [.../* @__PURE__ */ new Set([...byId.keys(), ...latest.keys()])].sort().map((subjectId) => {
    const run = latest.get(subjectId);
    return {
      subjectId,
      email: byId.get(subjectId) ?? run?.email,
      lastRunAt: run?.finishedAt ?? run?.startedAt,
      runId: run?.runId,
      modules: run?.vendors?.length ? run.vendors.map((v) => v.split(":")[1]).filter(Boolean).join("+") : void 0,
      costINR: run?.costINR
    };
  }).filter((s) => s.runId);
}
async function listRuns(limit = 50) {
  return queryRuns(limit);
}
async function getRun(runId) {
  if (!/^run_[a-z0-9]+_[0-9a-f]{8}$/.test(runId)) return null;
  return fetchRun(runId);
}
function dataDir() {
  return storeDataDir();
}
export {
  capReached,
  dataDir,
  getRun,
  hashEmail,
  ledgerSnapshot,
  listRuns,
  newRunId,
  recordSpend,
  resolveSubjectId,
  saveRun,
  scrubCredentials,
  subjectIndex,
  subjectSummaries
};
