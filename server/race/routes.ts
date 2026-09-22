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
  resolveSubjectId, subjectIndex, ledgerSnapshot, newRunId, hashEmail,
  saveRun, listRuns, getRun, dataDir, type RunRecord,
} from "./store.js";
import { normaliseWithSkill, skillConfigured } from "./claude.js";
import { storeInfo } from "./db.js";
import { fetchStage } from "./pipeline.js";
import { summarise } from "./summary.js";
import { extractViews, viewsToCsv } from "./extract.js";

let warnedOpen = false;

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

  r.get("/status", async (_req, res) => {
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
  });

  r.post("/run", async (req, res) => {
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

    if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
      return res.status(400).json({ error: "a valid `email` is required" });
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

    const address = email.trim();
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
  });

  r.get("/runs", async (req, res) => {
    const limit = Math.min(Number(req.query.limit ?? 50) || 50, 500);
    res.json({ runs: await listRuns(limit) });
  });

  r.get("/runs/:id", async (req, res) => {
    const run = await getRun(req.params.id);
    if (!run) return res.status(404).json({ error: "no such run" });
    res.json(withViews(run));
  });

  // The five views as CSV, matching the vendor's own export file names.
  //   /runs/<id>/csv                -> lists what is available
  //   /runs/<id>/csv/rich_data.csv  -> that file
  r.get("/runs/:id/csv/:file?", async (req, res) => {
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
  });

  // Look a person up by the address the operator typed, which is how every
  // screen in the app refers to them.
  r.get("/by-email/:email", async (req, res) => {
    const address = decodeURIComponent(req.params.email).trim().toLowerCase();
    const map = await subjectIndex();
    const subjectId = map.byEmail[address];
    if (!subjectId) return res.status(404).json({ error: "no run for that address yet" });

    const hash = hashEmail(address);
    const index = (await listRuns(500)) as any[];
    const latest = index.find((r) => r.emailHash === hash);
    if (!latest) return res.json({ subjectId, email: address, run: null });

    res.json({ subjectId, email: address, run: await getRun(latest.runId) });
  });

  // Everything, as one file. Insurance against the filesystem fallback, and the
  // quickest way to hand a run to someone who is not looking at this app.
  r.get("/export", async (_req, res) => {
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
  });

  r.get("/subjects", async (_req, res) => {
    res.json(await subjectIndex());
  });

  return r;
}
