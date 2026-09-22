/**
 * The RACE API surface. Five endpoints, all under /api/race.
 *
 *   GET  /status          what is configured, live credits, this month's spend
 *   POST /run             start a resolution run; returns a runId immediately
 *   GET  /runs            the run index, newest first
 *   GET  /runs/:id        one run in full: steps, vendors, intake record
 *   GET  /subjects        email -> subject id
 *
 * A run takes tens of seconds (three vendor calls plus sandbox work), which is
 * longer than any sensible HTTP timeout, so /run starts the work and hands back
 * an id to poll. The record on disk is the source of truth throughout.
 */

import { Router, type Request, type Response, type NextFunction } from "express";
import {
  configuredVendors, osintCredits, VENDORS, type VendorName,
} from "./vendors.js";
import {
  resolveSubjectId, subjectIndex, subjectSummaries, ledgerSnapshot, newRunId,
  hashEmail, saveRun, listRuns, getRun, dataDir, type RunRecord,
} from "./store.js";
import { normaliseWithSkill, skillConfigured } from "./claude.js";
import { storeInfo, putTargets, fetchTargets, putScrape, fetchScrape,
         putPersona, fetchPersona, loadWorkspaceId, saveWorkspaceId } from "./db.js";
import { buildPersona, personaConfigured } from "./persona.js";
import { runScrape } from "./scrape.js";
import { apifyConfigured } from "./apify.js";
import { planTargets } from "./targets.js";
import { fetchStage } from "./pipeline.js";
import { summarise } from "./summary.js";
import { extractViews, viewsToCsv } from "./extract.js";

let warnedOpen = false;

/**
 * Wrap an async handler so a thrown error becomes a JSON response.
 *
 * Express 4 does not catch rejections from async handlers. Without this, a
 * throw leaves the request unanswered, the SPA catch-all serves index.html, and
 * the browser reports `Unexpected token '<'` — which says nothing about the
 * actual failure. That is precisely what happened when race_targets was missing
 * from firestore.rules: a one-line rules gap surfaced in the UI as a JSON parse
 * error, which is about as unhelpful as an error can be.
 *
 * Every /api/race route goes through this. An API route must fail as JSON.
 */
type Handler = (req: Request, res: Response) => Promise<unknown> | unknown;
const json = (fn: Handler) => async (req: Request, res: Response) => {
  try {
    await fn(req, res);
  } catch (e: any) {
    const message = `${e?.name ?? "Error"}: ${e?.message ?? String(e)}`;
    console.error("[race] route failed:", message);
    const isWorkspaceError = Boolean(
      e?.needsWorkspaceId || /anthropic-workspace-id|workspace/i.test(message)
    );
    if (!res.headersSent) {
      res.status(isWorkspaceError ? 400 : (e?.status || 500)).json({
        error: isWorkspaceError
          ? "Anthropic Workspace ID required: This API key is an organization-level key. Please provide your Workspace ID (e.g. wrkspc_...)."
          : message,
        hint: isWorkspaceError
          ? "Log in to platform.claude.com → Settings → Workspaces to copy your Workspace ID, then provide it in the input below."
          : /permission|denied/i.test(message)
          ? "Firestore refused the operation — a collection used here is probably missing from firestore.rules."
          : undefined,
        needsWorkspaceId: isWorkspaceError,
      });
    }
  }
};



/**
 * Derive the five views on read when a stored run predates extract.ts.
 *
 * The raw payload was always kept, so nothing needs re-fetching or migrating —
 * an old run gains the views the moment it is read. Cheap enough to do inline,
 * and it means there is no window where some runs answer differently from
 * others.
 */
function withViews(run: any): any {
  if (run?.views) return run;
  if (!run?.raw) return run;
  return { ...run, views: extractViews(run.raw), viewsDerivedOnRead: true };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Normalise and vet an address before spending money on it.
 *
 * A stray invisible character once turned gmail.com into the punycode domain
 * gmail.xn--com-360a. It looked identical in the input box, passed a loose
 * regex, cost a full vendor call, and returned a slightly different answer
 * against what was effectively a different address. Catching it here costs
 * nothing; catching it afterwards costs a vendor call and a phantom subject.
 */
function vetEmail(raw: unknown): { ok: boolean; email?: string; error?: string } {
  if (typeof raw !== "string") return { ok: false, error: "email is required" };
  const email = raw.normalize("NFKC").trim();

  if (!email) return { ok: false, error: "email is required" };
  if (/\s/.test(email)) return { ok: false, error: "email contains whitespace" };
  if (/[^\x20-\x7E]/.test(email)) {
    return { ok: false, error:
      "email contains a non-ASCII or invisible character — retype it rather than pasting" };
  }
  if (/xn--/i.test(email)) {
    return { ok: false, error:
      "email domain is punycode (xn--), which usually means a stray character slipped in" };
  }
  if (!EMAIL_RE.test(email)) return { ok: false, error: "that is not a valid email address" };
  return { ok: true, email: email.toLowerCase() };
}

/**
 * These endpoints return other people's personal data, and the app is deployed
 * on a public URL. So: a shared token, required in production. In development
 * it is optional, because nothing is exposed and a token you have to set before
 * you can see anything is a token people disable.
 */
function requireToken(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.RACE_ADMIN_TOKEN;
  if (!expected) {
    // Open by explicit choice. Worth being clear about what that means: these
    // routes spend vendor credits per call and return identity data on whoever
    // is asked for, and a published URL is reachable by anyone who finds it —
    // a login screen in front of the React app does not protect a route that
    // curl can hit directly.
    //
    // Setting RACE_ADMIN_TOKEN in Settings → Secrets closes it again with no
    // code change: the check below starts enforcing the moment the value
    // exists. Worth doing before this URL is shared or left up.
    if (!warnedOpen) {
      warnedOpen = true;
      console.warn("[race] /api/race/* is OPEN — RACE_ADMIN_TOKEN is not set. " +
                   "Anyone with the URL can spend vendor credits and read stored records.");
    }
    return next();
  }
  const given = req.get("x-race-token") ?? "";
  // Compare lengths first so the timing-safe compare never throws on a mismatch.
  if (given.length !== expected.length || given !== expected) {
    return res.status(401).json({ error: "bad or missing x-race-token" });
  }
  next();
}

export function raceRouter(): Router {
  const r = Router();
  r.use(requireToken);

  r.get("/status", json(async (_req, res) => {
    const skill = skillConfigured();
    res.json({
      skill: {
        ok: skill.ok,
        reason: skill.reason,
        skillId: process.env.RACE_SKILL_ID ? "set" : "missing",
        skillVersion: process.env.RACE_SKILL_VERSION || null,
        model: process.env.RACE_MODEL ?? "claude-opus-5",
      },
      vendors: (Object.keys(VENDORS) as VendorName[]).map((v) => ({
        vendor: v,
        configured: configuredVendors().includes(v),
        costINR: VENDORS[v].costINR,
        monthlyCap: VENDORS[v].monthlyCap,
      })),
      apify: { configured: apifyConfigured() },
      persona: { ...personaConfigured(), model: process.env.RACE_PERSONA_MODEL ?? "claude-sonnet-5" },
      osintCredits: await osintCredits(),
      ledger: await ledgerSnapshot(),
      storage: storeInfo(),
      dataDir: dataDir(),
      keepRaw: process.env.RACE_KEEP_RAW !== "false",
      accessControl: process.env.RACE_ADMIN_TOKEN ? "token required" : "OPEN — no token set",
      note: storeInfo().backend === "firestore"
        ? "Run records are in Firestore and survive redeploys."
        : "Firestore is not reachable, so records are on the container filesystem — " +
          "which on Cloud Run is wiped by a redeploy or scale-to-zero. Export before it matters.",
    });
  }));

  r.post("/run", json(async (req, res) => {
    const {
      email, useCase = "customer_insight", sector, ticketBand,
      vendors, consentBasis, normalise = false,
    } = (req.body ?? {}) as Record<string, any>;

    // Stage 2 (the skill) is opt-in. Fetch-only needs no Anthropic key at all,
    // which is what makes the fast path fast.
    if (normalise) {
      const skill = skillConfigured();
      if (!skill.ok) return res.status(503).json({ error: skill.reason });
    }

    const vetted = vetEmail(email);
    if (!vetted.ok || !vetted.email) {
      return res.status(400).json({ error: vetted.error ?? "invalid email" });
    }
    // Recorded, not enforced — but a run with no stated basis is one nobody can
    // answer for later, and this is the cheapest possible place to capture it.
    if (typeof consentBasis !== "string" || consentBasis.trim().length < 3) {
      return res.status(400).json({
        error: "`consentBasis` is required — a short string naming the lawful basis " +
               "for resolving this person (e.g. 'opt-in: internal employee demo, " +
               "consent collected 2026-09-12'). It is stored with the run.",
      });
    }
    if (vendors !== undefined) {
      if (!Array.isArray(vendors) || vendors.some((v) => !(v in VENDORS))) {
        return res.status(400).json({
          error: `vendors must be a subset of ${Object.keys(VENDORS).join(", ")}`,
        });
      }
    }

    const address = vetted.email;
    const subjectId = await resolveSubjectId(address);
    const runId = newRunId();

    const record: RunRecord = {
      runId,
      subjectId,
      emailHash: hashEmail(address),
      ...(process.env.RACE_LOG_EMAIL === "true" ? { email: address } : {}),
      useCase, sector, ticketBand,
      startedAt: new Date().toISOString(),
      status: "running",
      vendorsCalled: [],
      costINR: 0,
      skillId: process.env.RACE_SKILL_ID,
      skillVersion: process.env.RACE_SKILL_VERSION,
      model: process.env.RACE_MODEL ?? "claude-opus-5",
      steps: [{
        t: new Date().toISOString(), level: "info",
        msg: "Run accepted", detail: { consentBasis: consentBasis.trim() },
      }],
    };
    await saveRun(record);

    // Answer now, work after. The client polls /runs/:id.
    res.status(202).json({ runId, subjectId, status: "running" });

    try {
      // Stage 1 — the backend fetches. No model involved in deciding or doing it.
      const fetched = await fetchStage({
        email: address, useCase, ticketBand,
        explicitVendors: vendors as VendorName[] | undefined,
      });

      const afterFetch = {
        ...record,
        vendorsCalled: fetched.vendorsCalled,
        costINR: fetched.costINR,
        steps: [...record.steps, ...fetched.steps],
        raw: fetched.raw,
      };

      const summary = summarise(fetched.raw as Record<string, any>);
      // The five views the vendor's own export produces, derived from the same
      // payload. Stored so a reader never has to walk the raw blob.
      const views = extractViews(fetched.raw as Record<string, any>);

      if (!normalise) {
        // Fast path: the fetch IS the deliverable. No model, no normalisation.
        await saveRun({
          ...afterFetch,
          summary, views,
          status: fetched.empty ? "failed" : "completed",
          finishedAt: new Date().toISOString(),
          ...(fetched.empty ? { error: "no vendor returned any items" } : {}),
        });
        return;
      }

      if (fetched.empty) {
        // Nothing usable came back. Stop here rather than paying a model to
        // synthesise a persona out of an empty object — an intake record built
        // on no evidence is worse than no record, because it looks like one.
        await saveRun({
          ...afterFetch,
          status: "failed",
          finishedAt: new Date().toISOString(),
          error: "no vendor returned any items",
        });
        return;
      }

      // Stage 2 — normalise through the skill, where the guards and the tests are.
      const out = await normaliseWithSkill({
        subjectId, email: address, useCase, sector, ticketBand,
        raw: fetched.raw,
        vendorsAttempted: fetched.vendorsCalled,
      });

      await saveRun({
        ...afterFetch,
        summary, views,
        status: out.intake ? "completed" : "failed",
        finishedAt: new Date().toISOString(),
        usage: out.usage,
        steps: [...afterFetch.steps, ...out.steps],
        intake: out.intake,
        ...(out.intake ? {} : { error: "no intake record in the final reply" }),
      });
    } catch (e: any) {
      await saveRun({
        ...record,
        status: "failed",
        finishedAt: new Date().toISOString(),
        error: `${e?.name ?? "Error"}: ${e?.message ?? String(e)}`,
        steps: [...record.steps, {
          t: new Date().toISOString(), level: "error",
          msg: "Run threw", detail: String(e?.message ?? e),
        }],
      });
    }
  }));

  r.get("/runs", json(async (req, res) => {
    const limit = Math.min(Number(req.query.limit ?? 50) || 50, 500);
    res.json({ runs: await listRuns(limit) });
  }));

  r.get("/runs/:id", json(async (req, res) => {
    const run = await getRun(req.params.id);
    if (!run) return res.status(404).json({ error: "no such run" });
    res.json(withViews(run));
  }));

  // The five views as CSV, matching the vendor's own export file names.
  //   /runs/<id>/csv                -> lists what is available
  //   /runs/<id>/csv/rich_data.csv  -> that file
  r.get("/runs/:id/csv/:file?", json(async (req, res) => {
    const run = await getRun(req.params.id);
    if (!run) return res.status(404).json({ error: "no such run" });
    const files = viewsToCsv(withViews(run).views as any);

    if (!req.params.file) return res.json({ files: Object.keys(files) });
    const body = files[req.params.file];
    if (body === undefined) {
      return res.status(404).json({ error: "no such view", available: Object.keys(files) });
    }
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${req.params.file}"`);
    res.send(body);
  }));

  // Look a person up by the address the operator typed, which is how every
  // screen in the app refers to them.
  r.get("/by-email/:email", json(async (req, res) => {
    const address = decodeURIComponent(req.params.email).trim().toLowerCase();
    const map = await subjectIndex();
    const subjectId = map.byEmail[address];
    if (!subjectId) return res.status(404).json({ error: "no run for that address yet" });

    const hash = hashEmail(address);
    const index = (await listRuns(500)) as any[];
    const latest = index.find((r) => r.emailHash === hash);
    if (!latest) return res.json({ subjectId, email: address, run: null });

    res.json({ subjectId, email: address, run: await getRun(latest.runId) });
  }));

  // Everything, as one file. Insurance against the filesystem fallback, and the
  // quickest way to hand a run to someone who is not looking at this app.
  r.get("/export", json(async (_req, res) => {
    const index = await listRuns(500);
    const runs = [];
    for (const row of index) {
      const full = await getRun(row.runId);
      if (full) runs.push(withViews(full));
    }
    res.setHeader("Content-Disposition",
      `attachment; filename="race-export-${new Date().toISOString().slice(0, 10)}.json"`);
    res.json({
      exportedAt: new Date().toISOString(),
      storage: storeInfo(),
      subjects: await subjectIndex(),
      runs,
    });
  }));

  // ------------------------------------------------------------- step 2
  // Plan only. Reads what step 1 stored, decides what COULD be scraped, and
  // writes it down. No Apify call, no vendor call, nothing spent — so it is
  // safe to re-run, and the plan can be argued with before it costs anything.
  r.post("/subjects/:subjectId/targets", json(async (req, res) => {
    const subjectId = String(req.params.subjectId).trim();
    if (!/^P-\d{2,}$/.test(subjectId)) {
      return res.status(400).json({ error: "subjectId must look like P-20" });
    }

    // The most recent completed run for this subject is the source. A failed
    // run has no payload worth planning against.
    const index = (await listRuns(500)) as any[];
    const row = index.find((r) => r.subjectId === subjectId && r.status === "completed");
    if (!row) {
      return res.status(409).json({
        error: `no completed step 1 run for ${subjectId} — run step 1 first`,
      });
    }

    const run = await getRun(row.runId);
    if (!run?.raw) {
      return res.status(409).json({
        error: "that run has no stored payload, so there is nothing to plan against",
      });
    }

    const plan = planTargets({
      subjectId,
      emailHash: run.emailHash,
      email: run.email,
      sourceRunId: run.runId,
      raw: run.raw as Record<string, any>,
    });

    const storedIn = await putTargets(subjectId, plan);
    res.json({ ...plan, storedIn });
  }));

  // ------------------------------------------------------------- step 3
  // Runs the reviewed plan. This one spends: Apify bills per result row, so the
  // cost is only known afterwards and is read back from the run, never guessed.
  r.post("/subjects/:subjectId/scrape", json(async (req, res) => {
    const subjectId = String(req.params.subjectId).trim();
    if (!/^P-\d{2,}$/.test(subjectId)) {
      return res.status(400).json({ error: "subjectId must look like P-20" });
    }
    if (!apifyConfigured()) {
      return res.status(503).json({ error: "APIFY_TOKEN is not set" });
    }

    const plan = await fetchTargets(subjectId);
    if (!plan) return res.status(409).json({ error: "no step 2 plan — run step 2 first" });
    if (!plan.ready?.length) {
      return res.status(409).json({ error: "the plan has no ready actors to run" });
    }

    const only: string[] = Array.isArray(req.body?.only) ? req.body.only : [];
    const result = await runScrape({
      subjectId, emailHash: plan.emailHash, email: plan.email, plan, only,
    });
    const storedIn = await putScrape(subjectId, result);
    res.json({ ...result, storedIn });
  }));

  r.get("/subjects/:subjectId/scrape", json(async (req, res) => {
    const scrape = await fetchScrape(String(req.params.subjectId).trim());
    if (!scrape) return res.status(404).json({ error: "no scrape yet — run step 3" });
    res.json(scrape);
  }));

  // ------------------------------------------------------------- step 4
  // Attributes and the computed layer. Stops before categories — step 5 is
  // frozen in the skill and has its own rules.
  r.post("/subjects/:subjectId/persona", json(async (req, res) => {
    const subjectId = String(req.params.subjectId).trim();
    if (!/^P-\d{2,}$/.test(subjectId)) {
      return res.status(400).json({ error: "subjectId must look like P-20" });
    }
    const cfg = personaConfigured();
    if (!cfg.ok) return res.status(503).json({ error: cfg.reason });

    const index = (await listRuns(500)) as any[];
    const row = index.find((r) => r.subjectId === subjectId && r.status === "completed");
    if (!row) return res.status(409).json({ error: "no completed step 1 run for this subject" });

    const run = withViews(await getRun(row.runId));
    if (!run?.views) return res.status(409).json({ error: "that run has no views to reason from" });

    const incomingWorkspace =
      (req.headers["x-anthropic-workspace-id"] as string)?.trim() ||
      (req.body?.workspaceId as string)?.trim();
    if (incomingWorkspace) {
      await saveWorkspaceId(incomingWorkspace);
    }

    // Answer now, work after.
    //
    // Opus takes around 160 seconds on a subject this size, and holding the
    // connection open for that long put the response through whatever proxy
    // sits in front of Cloud Run — which cut it and returned an HTML 502 while
    // the work carried on server-side and completed fine. The client had no way
    // to know it had succeeded, and re-running would have paid for it twice.
    //
    // Same shape as step 1: mark it running, return, poll the record.
    const startedAt = new Date().toISOString();
    await putPersona(subjectId, {
      subjectId, model: process.env.RACE_PERSONA_MODEL ?? "claude-sonnet-5",
      status: "running", startedAt, attributeGroups: [],
      audit: { attributes: 0, byBand: {}, weakBasisLines: 0, identityScrubbed: 0 },
      steps: [{ t: startedAt, level: "info", msg: "Persona synthesis started" }],
    });
    res.status(202).json({ subjectId, status: "running", startedAt });

    try {
      const persona = await buildPersona({
        subjectId,
        useCase: run.useCase, sector: run.sector, ticketBand: run.ticketBand,
        views: run.views,
        plan: await fetchTargets(subjectId),
        scrape: await fetchScrape(subjectId),
        workspaceId: incomingWorkspace,
      });
      await putPersona(subjectId, { ...persona, status: "completed", startedAt });
    } catch (e: any) {
      const message = `${e?.name ?? "Error"}: ${e?.message ?? String(e)}`;
      console.error("[race] persona failed:", message);
      await putPersona(subjectId, {
        subjectId, model: process.env.RACE_PERSONA_MODEL ?? "claude-sonnet-5",
        status: "failed", startedAt, finishedAt: new Date().toISOString(),
        error: message, attributeGroups: [],
        audit: { attributes: 0, byBand: {}, weakBasisLines: 0, identityScrubbed: 0 },
        steps: [{ t: new Date().toISOString(), level: "error", msg: message }],
      });
    }
  }));

  r.post("/config/workspace", json(async (req, res) => {
    const workspaceId = String(req.body?.workspaceId ?? "").trim();
    if (!workspaceId) {
      return res.status(400).json({ error: "workspaceId is required" });
    }
    await saveWorkspaceId(workspaceId);
    res.json({ ok: true, workspaceId });
  }));

  r.get("/config/workspace", json(async (_req, res) => {
    const workspaceId = (await loadWorkspaceId()) ?? null;
    res.json({ workspaceId });
  }));

  r.get("/subjects/:subjectId/persona", json(async (req, res) => {
    const persona = await fetchPersona(String(req.params.subjectId).trim());
    if (!persona) return res.status(404).json({ error: "no persona yet — run step 4" });
    res.json(persona);
  }));

  r.get("/subjects/:subjectId/targets", json(async (req, res) => {
    const plan = await fetchTargets(String(req.params.subjectId).trim());
    if (!plan) return res.status(404).json({ error: "no plan yet — run step 2" });
    res.json(plan);
  }));

  r.get("/subjects", json(async (_req, res) => {
    res.json({ ...(await subjectIndex()), subjects: await subjectSummaries() });
  }));

  /**
   * Everything stored for one subject, in one call: the latest completed run
   * and the step 2 plan if there is one. This is the free path — loading a
   * subject costs nothing, so testing and demoing never has to re-bill.
   */
  r.get("/subjects/:subjectId/bundle", json(async (req, res) => {
    const subjectId = String(req.params.subjectId).trim();
    const index = (await listRuns(500)) as any[];
    const row = index.find((r) => r.subjectId === subjectId && r.status === "completed");
    if (!row) return res.status(404).json({ error: `no completed run for ${subjectId}` });

    const map = await subjectIndex();
    const email = Object.entries(map.byEmail).find(([, id]) => id === subjectId)?.[0];

    res.json({
      subjectId, email,
      run: withViews(await getRun(row.runId)),
      plan: await fetchTargets(subjectId),
      scrape: await fetchScrape(subjectId),
      persona: await fetchPersona(subjectId),
    });
  }));

  return r;
}
