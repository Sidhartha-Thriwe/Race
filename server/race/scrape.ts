/**
 * Step 3 — run the plan step 2 wrote down.
 *
 * The inputs are taken from the stored plan verbatim. They are NOT re-derived
 * here, so what runs is exactly what was reviewed on screen. That is the whole
 * value of having split planning from execution: if the plan was wrong, it was
 * wrong somewhere you could see it before paying.
 *
 * The one judgement this file makes is about zero items, and it makes it by
 * refusing to judge: a zero-item run is recorded as SUSPECT, never as empty.
 * An actor called with a wrongly shaped input returns zero items and no error,
 * which once let a whole workflow "succeed" while scraping nothing. Step 2's
 * validation removed half that risk. The other half — a valid input against a
 * broken actor — cannot be told apart from a genuinely empty account by any
 * amount of cleverness here, so the record says so and moves on.
 */

import { runActor, apifyConfigured } from "./apify.js";
import type { RunStep } from "./store.js";

export interface ScrapeAttempt {
  platform: string;
  label: string;
  actor: string;
  /** Carried through from the plan so a zero result can be read in context. */
  planStatus: "verified" | "unverified" | "unproven-contested";
  outcome: "succeeded" | "zero_item_suspect" | "thin_payload" | "failed" | "skipped";
  itemCount: number;
  costUSD?: number;
  durationMs?: number;
  runId?: string;
  /** Why this outcome, in a sentence a human can act on. */
  narrative: string;
  error?: string;
}

export interface ScrapeReport {
  attempted: number;
  succeeded: number;
  zeroItem: number;
  thin: number;
  failed: number;
  skipped: number;
  totalItems: number;
  totalCostUSD: number;
}

export interface ScrapeResult {
  subjectId: string;
  emailHash: string;
  email?: string;
  sourcePlanAt?: string;
  startedAt: string;
  finishedAt?: string;
  status: "running" | "completed" | "failed";
  attempts: ScrapeAttempt[];
  report: ScrapeReport;
  steps: RunStep[];
  /** Items per platform. Stored in their own documents — see db.putScrape. */
  data: Record<string, unknown[]>;
}

const MAX_ITEMS = Number(process.env.RACE_SCRAPE_MAX_ITEMS ?? 1000);
const CONCURRENCY = Number(process.env.RACE_SCRAPE_CONCURRENCY ?? 3);

/**
 * Third-party identifiers in scraped content — other people's names, ids and
 * links, which arrive inside reviews and posts and are not the subject's to
 * keep. Off by default per the standing "keep everything until Legal reviews"
 * decision; RACE_SCRUB_SCRAPED=true turns it on without a code change.
 */
const SCRUB_KEYS = new Set([
  "name", "contributor_name", "contributor_id", "user_id", "author", "owner",
  "thumbnail", "photo", "avatar", "image", "review_id", "data_id", "guid",
  "uuid", "email", "phone",
]);

function scrub(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(scrub);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SCRUB_KEYS.has(k.toLowerCase())) { out[k] = "[redacted]"; continue; }
      out[k] = typeof v === "string" && v.startsWith("http") ? "[redacted:url]" : scrub(v);
    }
    return out;
  }
  return value;
}

/**
 * An item can be an error wearing a result's shape.
 *
 * Google Maps returned exactly one item on the first live run — and that item
 * was {result_type: "error", error_message: "The data service could not return
 * reviews…"}. itemCount was 1, so it was recorded as a success. That is the
 * same failure this whole step exists to catch, reproduced in the code meant to
 * catch it: I guarded against zero items and never considered that a non-zero
 * item might be a failure report.
 *
 * Item counts and HTTP status are not evidence. The payload is.
 */
function errorMessage(item: any): string | null {
  if (!item || typeof item !== "object") return null;
  const flagged =
    item.result_type === "error" || item.status === "error" ||
    item.error_type != null || item.error_message != null ||
    (typeof item.error === "string" && item.error.length > 0);
  if (!flagged) return null;
  return String(item.error_message ?? item.error ?? item.error_type ?? "error item");
}

/**
 * How much of a single-item payload is actually populated.
 *
 * "Every field empty" was too blunt: GitHub came back with public_repos 0,
 * followers 0, repos null — but also a bio and a blog URL, so an all-empty test
 * never fired and a profile stub read as a clean success.
 *
 * Reporting the ratio is more honest than any threshold, because sparse and
 * empty are genuinely different and only a human can weigh which matters here.
 * The threshold exists only to decide whether to draw attention to it.
 *
 * Identity and metadata fields are excluded from the count: a login and a
 * created_at are always present and say nothing about whether the scrape found
 * anything.
 */
const IDENTITY_FIELD = new Set([
  "login", "username", "handle", "id", "type", "url", "html_url", "avatar_url",
  "scraped_at", "fetched_at", "created_at", "updated_at", "name",
]);

function density(items: any[]): { populated: number; total: number; ratio: number } | null {
  if (items.length !== 1 || !items[0] || typeof items[0] !== "object") return null;
  const entries = Object.entries(items[0]).filter(
    ([k]) => !IDENTITY_FIELD.has(k.toLowerCase()));
  if (!entries.length) return null;
  const populated = entries.filter(([, v]) =>
    !(v === null || v === undefined || v === 0 || v === "" || v === false ||
      (Array.isArray(v) && v.length === 0))).length;
  return { populated, total: entries.length, ratio: populated / entries.length };
}

const note = (steps: RunStep[], level: RunStep["level"], msg: string, detail?: unknown) =>
  steps.push({ t: new Date().toISOString(), level, msg, detail });

/** Explain an outcome in terms of what the operator should do about it. */
function narrate(a: {
  label: string; planStatus: ScrapeAttempt["planStatus"];
  items: any[]; ok: boolean; error?: string;
}): { outcome: ScrapeAttempt["outcome"]; narrative: string; usableCount: number } {
  if (!a.ok) {
    return { outcome: "failed", usableCount: 0,
             narrative: `${a.label} actor did not complete: ${a.error}` };
  }

  // Strip error-shaped items before counting anything.
  const errors = a.items.map(errorMessage).filter(Boolean) as string[];
  const usable = a.items.filter((i) => !errorMessage(i));

  if (errors.length && !usable.length) {
    return {
      outcome: "failed", usableCount: 0,
      narrative: `${a.label} returned ${errors.length} item(s), all of them error ` +
                 `reports rather than data — the actor's own message was: ${errors[0]}`,
    };
  }

  if (usable.length > 0) {
    const partial = errors.length
      ? ` (${errors.length} further item(s) were error reports: ${errors[0]})`
      : "";
    const d = density(usable);
    const detail = d ? ` ${d.populated} of ${d.total} substantive field(s) populated.` : "";

    if (d && d.ratio < 0.25) {
      return {
        outcome: "thin_payload", usableCount: usable.length,
        narrative: `One item returned, but only${detail.replace(".", "")} — a profile ` +
                   `stub rather than enrichment.` +
                   (a.planStatus === "unproven-contested"
                     ? ` This actor is flagged unproven-contested, which is the likely reason.`
                     : ``) + partial,
      };
    }
    return { outcome: "succeeded", usableCount: usable.length,
             narrative: `${usable.length} item(s) returned.${detail}${partial}` };
  }

  // Zero usable items, valid input. The plan status is the only thing that
  // shifts the reading, so it is what the sentence turns on.
  if (a.planStatus === "unproven-contested") {
    return { outcome: "zero_item_suspect", usableCount: 0,
      narrative: `No items. This actor is flagged unproven-contested — our own ` +
                 `scraping notes say it should not work, so treat this as the ` +
                 `actor failing rather than an empty account.` };
  }
  if (a.planStatus === "unverified") {
    return { outcome: "zero_item_suspect", usableCount: 0,
      narrative: `No items. This actor has never been proven against a real ` +
                 `target, so an empty account and a broken actor look identical ` +
                 `here. Verify the actor before reading this as absence.` };
  }
  return { outcome: "zero_item_suspect", usableCount: 0,
    narrative: `No items from a verified actor — most likely a genuinely empty ` +
               `account, but still worth one manual check.` };
}

export async function runScrape(opts: {
  subjectId: string; emailHash: string; email?: string;
  plan: any;
  /** Platform keys the operator ticked. Empty means every ready actor. */
  only?: string[];
}): Promise<ScrapeResult> {
  const steps: RunStep[] = [];
  const attempts: ScrapeAttempt[] = [];
  const data: Record<string, unknown[]> = {};

  const ready: any[] = (opts.plan?.ready ?? []).filter(
    (r: any) => !opts.only?.length || opts.only.includes(r.platform),
  );

  note(steps, "info", `Step 3 starting — ${ready.length} actor(s) selected`, {
    maxItems: MAX_ITEMS, concurrency: CONCURRENCY,
  });

  if (!apifyConfigured()) {
    note(steps, "error", "APIFY_TOKEN is not set — nothing can run");
  }

  // A small worker pool. Actors are independent, so serialising them would add
  // minutes of wall clock for no benefit.
  let cursor = 0;
  const worker = async () => {
    while (cursor < ready.length) {
      const item = ready[cursor++];
      note(steps, "info", `${item.label}: starting ${item.actor}`);

      const res = await runActor({
        actor: item.actor,
        input: item.input,           // verbatim from the reviewed plan
        maxItems: MAX_ITEMS,
      });

      const { outcome, narrative, usableCount } = narrate({
        label: item.label, planStatus: item.status,
        items: res.items as any[], ok: res.ok, error: res.error,
      });

      attempts.push({
        platform: item.platform, label: item.label, actor: item.actor,
        planStatus: item.status, outcome, itemCount: usableCount,
        costUSD: res.costUSD, durationMs: res.durationMs, runId: res.runId,
        narrative, error: res.error,
      });

      data[item.platform] =
        process.env.RACE_SCRUB_SCRAPED === "true"
          ? (scrub(res.items) as unknown[])
          : res.items;

      note(steps, outcome === "succeeded" ? "info" : "warn",
           `${item.label}: ${outcome} — ${narrative}`,
           { costUSD: res.costUSD, seconds: Math.round((res.durationMs ?? 0) / 1000) });
    }
  };

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, ready.length) }, worker));

  const report: ScrapeReport = {
    attempted: attempts.length,
    succeeded: attempts.filter((a) => a.outcome === "succeeded").length,
    zeroItem: attempts.filter((a) => a.outcome === "zero_item_suspect").length,
    thin: attempts.filter((a) => a.outcome === "thin_payload").length,
    failed: attempts.filter((a) => a.outcome === "failed").length,
    skipped: (opts.plan?.ready?.length ?? 0) - ready.length,
    totalItems: attempts.reduce((n, a) => n + a.itemCount, 0),
    totalCostUSD: Math.round(attempts.reduce((n, a) => n + (a.costUSD ?? 0), 0) * 10000) / 10000,
  };

  note(steps, report.succeeded ? "info" : "warn",
       `Step 3 done — ${report.succeeded}/${report.attempted} returned items, ` +
       `${report.totalItems} total, $${report.totalCostUSD.toFixed(4)}`);

  return {
    subjectId: opts.subjectId, emailHash: opts.emailHash, email: opts.email,
    sourcePlanAt: opts.plan?.createdAt,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    status: report.attempted ? "completed" : "failed",
    attempts, report, steps, data,
  };
}
