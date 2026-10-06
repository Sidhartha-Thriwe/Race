import { runActor, apifyConfigured } from "./apify.js";
const MAX_ITEMS = Number(process.env.RACE_SCRAPE_MAX_ITEMS ?? 1e3);
const CONCURRENCY = Number(process.env.RACE_SCRAPE_CONCURRENCY ?? 3);
const SCRUB_KEYS = /* @__PURE__ */ new Set([
  "name",
  "contributor_name",
  "contributor_id",
  "user_id",
  "author",
  "owner",
  "thumbnail",
  "photo",
  "avatar",
  "image",
  "review_id",
  "data_id",
  "guid",
  "uuid",
  "email",
  "phone"
]);
function scrub(value) {
  if (Array.isArray(value)) return value.map(scrub);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (SCRUB_KEYS.has(k.toLowerCase())) {
        out[k] = "[redacted]";
        continue;
      }
      out[k] = typeof v === "string" && v.startsWith("http") ? "[redacted:url]" : scrub(v);
    }
    return out;
  }
  return value;
}
function errorMessage(item) {
  if (!item || typeof item !== "object") return null;
  const flagged = item.result_type === "error" || item.status === "error" || item.error_type != null || item.error_message != null || typeof item.error === "string" && item.error.length > 0;
  if (!flagged) return null;
  return String(item.error_message ?? item.error ?? item.error_type ?? "error item");
}
const IDENTITY_FIELD = /* @__PURE__ */ new Set([
  "login",
  "username",
  "handle",
  "id",
  "type",
  "url",
  "html_url",
  "avatar_url",
  "scraped_at",
  "fetched_at",
  "created_at",
  "updated_at",
  "name"
]);
function density(items) {
  if (items.length !== 1 || !items[0] || typeof items[0] !== "object") return null;
  const entries = Object.entries(items[0]).filter(
    ([k]) => !IDENTITY_FIELD.has(k.toLowerCase())
  );
  if (!entries.length) return null;
  const populated = entries.filter(([, v]) => !(v === null || v === void 0 || v === 0 || v === "" || v === false || Array.isArray(v) && v.length === 0)).length;
  return { populated, total: entries.length, ratio: populated / entries.length };
}
const note = (steps, level, msg, detail) => steps.push({ t: (/* @__PURE__ */ new Date()).toISOString(), level, msg, detail });
function narrate(a) {
  if (!a.ok) {
    return {
      outcome: "failed",
      usableCount: 0,
      narrative: `${a.label} actor did not complete: ${a.error}`
    };
  }
  const errors = a.items.map(errorMessage).filter(Boolean);
  const usable = a.items.filter((i) => !errorMessage(i));
  if (errors.length && !usable.length) {
    return {
      outcome: "failed",
      usableCount: 0,
      narrative: `${a.label} returned ${errors.length} item(s), all of them error reports rather than data \u2014 the actor's own message was: ${errors[0]}`
    };
  }
  if (usable.length > 0) {
    const partial = errors.length ? ` (${errors.length} further item(s) were error reports: ${errors[0]})` : "";
    const d = density(usable);
    const detail = d ? ` ${d.populated} of ${d.total} substantive field(s) populated.` : "";
    if (d && d.ratio < 0.25) {
      return {
        outcome: "thin_payload",
        usableCount: usable.length,
        narrative: `One item returned, but only${detail.replace(".", "")} \u2014 a profile stub rather than enrichment.` + (a.planStatus === "unproven-contested" ? ` This actor is flagged unproven-contested, which is the likely reason.` : ``) + partial
      };
    }
    return {
      outcome: "succeeded",
      usableCount: usable.length,
      narrative: `${usable.length} item(s) returned.${detail}${partial}`
    };
  }
  if (a.planStatus === "unproven-contested") {
    return {
      outcome: "zero_item_suspect",
      usableCount: 0,
      narrative: `No items. This actor is flagged unproven-contested \u2014 our own scraping notes say it should not work, so treat this as the actor failing rather than an empty account.`
    };
  }
  if (a.planStatus === "unverified") {
    return {
      outcome: "zero_item_suspect",
      usableCount: 0,
      narrative: `No items. This actor has never been proven against a real target, so an empty account and a broken actor look identical here. Verify the actor before reading this as absence.`
    };
  }
  return {
    outcome: "zero_item_suspect",
    usableCount: 0,
    narrative: `No items from a verified actor \u2014 most likely a genuinely empty account, but still worth one manual check.`
  };
}
async function runScrape(opts) {
  const steps = [];
  const attempts = [];
  const data = {};
  const ready = (opts.plan?.ready ?? []).filter(
    (r) => !opts.only?.length || opts.only.includes(r.platform)
  );
  note(steps, "info", `Step 3 starting \u2014 ${ready.length} actor(s) selected`, {
    maxItems: MAX_ITEMS,
    concurrency: CONCURRENCY
  });
  if (!apifyConfigured()) {
    note(steps, "error", "APIFY_TOKEN is not set \u2014 nothing can run");
  }
  let cursor = 0;
  const worker = async () => {
    while (cursor < ready.length) {
      const item = ready[cursor++];
      note(steps, "info", `${item.label}: starting ${item.actor}`);
      const res = await runActor({
        actor: item.actor,
        input: item.input,
        // verbatim from the reviewed plan
        maxItems: MAX_ITEMS
      });
      const { outcome, narrative, usableCount } = narrate({
        label: item.label,
        planStatus: item.status,
        items: res.items,
        ok: res.ok,
        error: res.error
      });
      attempts.push({
        platform: item.platform,
        label: item.label,
        actor: item.actor,
        planStatus: item.status,
        outcome,
        itemCount: usableCount,
        costUSD: res.costUSD,
        durationMs: res.durationMs,
        runId: res.runId,
        narrative,
        error: res.error
      });
      data[item.platform] = process.env.RACE_SCRUB_SCRAPED === "true" ? scrub(res.items) : res.items;
      note(
        steps,
        outcome === "succeeded" ? "info" : "warn",
        `${item.label}: ${outcome} \u2014 ${narrative}`,
        { costUSD: res.costUSD, seconds: Math.round((res.durationMs ?? 0) / 1e3) }
      );
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, ready.length) }, worker));
  const report = {
    attempted: attempts.length,
    succeeded: attempts.filter((a) => a.outcome === "succeeded").length,
    zeroItem: attempts.filter((a) => a.outcome === "zero_item_suspect").length,
    thin: attempts.filter((a) => a.outcome === "thin_payload").length,
    failed: attempts.filter((a) => a.outcome === "failed").length,
    skipped: (opts.plan?.ready?.length ?? 0) - ready.length,
    totalItems: attempts.reduce((n, a) => n + a.itemCount, 0),
    totalCostUSD: Math.round(attempts.reduce((n, a) => n + (a.costUSD ?? 0), 0) * 1e4) / 1e4
  };
  note(
    steps,
    report.succeeded ? "info" : "warn",
    `Step 3 done \u2014 ${report.succeeded}/${report.attempted} returned items, ${report.totalItems} total, $${report.totalCostUSD.toFixed(4)}`
  );
  return {
    subjectId: opts.subjectId,
    emailHash: opts.emailHash,
    email: opts.email,
    sourcePlanAt: opts.plan?.createdAt,
    startedAt: (/* @__PURE__ */ new Date()).toISOString(),
    finishedAt: (/* @__PURE__ */ new Date()).toISOString(),
    status: report.attempted ? "completed" : "failed",
    attempts,
    report,
    steps,
    data
  };
}
export {
  runScrape
};
