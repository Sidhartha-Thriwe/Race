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
import { fetchStage } from "./pipeline.js";

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
    if (process.env.NODE_ENV === "production") {
      return res.status(503).json({
        error: "RACE_ADMIN_TOKEN is not set. Refusing to serve personal data from a " +
               "public URL without it. Add it in Settings → Secrets.",
      });
    }
    return next(); // local dev
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
      dataDir: dataDir(),
      keepRaw: process.env.RACE_KEEP_RAW === "true",
      note: "Run records live on the container filesystem. On Cloud Run that is " +
            "ephemeral — set RACE_DATA_DIR to a mounted volume before treating " +
            "this as an audit trail.",
    });
  });

  r.post("/run", async (req, res) => {
    const skill = skillConfigured();
    if (!skill.ok) return res.status(503).json({ error: skill.reason });

    const {
      email, useCase = "customer_insight", sector, ticketBand,
      vendors, consentBasis,
    } = (req.body ?? {}) as Record<string, any>;

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
    res.json(run);
  });

  r.get("/subjects", async (_req, res) => {
    res.json(await subjectIndex());
  });

  return r;
}
