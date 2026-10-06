import { extractViews } from "./extract.js";
import {
  ACTORS,
  NO_ROUTE,
  canonicalPlatform,
  actorFor
} from "./actors.js";
const FIELD_KINDS = [
  [/^(username|user_name|handle|screen_name|nickname)$/i, "username"],
  [/^(profile_url|profileurl|url|link|profile)$/i, "profileUrl"],
  [/^(id|user_id|userid|account_id|person_id)$/i, "userId"],
  [/^(contributor_id|contributorid)$/i, "contributorId"],
  [/^(website|site)$/i, "website"]
];
function kindFor(field) {
  for (const [rx, kind] of FIELD_KINDS) if (rx.test(field)) return kind;
  return null;
}
function extractIdentifiers(raw) {
  const views = extractViews(raw);
  const out = [];
  for (const row of views.rich) {
    const platform = canonicalPlatform(row.module);
    for (const [field, value] of Object.entries(row.fields)) {
      const kind = kindFor(field);
      if (!kind) continue;
      const str = String(value).trim();
      if (!str || str.length < 2) continue;
      const finalKind = platform === "google_maps" && kind === "userId" ? "contributorId" : kind;
      out.push({
        platform,
        module: row.module,
        kind: finalKind,
        value: str,
        provenance: "vendor-returned"
      });
    }
  }
  const seen = /* @__PURE__ */ new Set();
  return out.filter((i) => {
    const k = `${i.platform}|${i.kind}|${i.value}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
function planTargets(opts) {
  const identifiers = extractIdentifiers(opts.raw);
  const byPlatform = /* @__PURE__ */ new Map();
  for (const id of identifiers) {
    byPlatform.set(id.platform, [...byPlatform.get(id.platform) ?? [], id]);
  }
  const views = extractViews(opts.raw);
  const seenPlatforms = /* @__PURE__ */ new Set([
    ...byPlatform.keys(),
    ...views.registered.map((r) => canonicalPlatform(r.module))
  ]);
  const ready = [];
  const blocked = [];
  const noRoute = [];
  for (const platform of [...seenPlatforms].sort()) {
    const ids = byPlatform.get(platform) ?? [];
    const spec = actorFor(platform);
    if (!spec) {
      const known = NO_ROUTE[platform];
      noRoute.push({
        platform,
        reason: known?.reason ?? "unmapped",
        detail: known?.detail ?? "no actor checked for this platform yet",
        identifiersHeld: ids.length
      });
      continue;
    }
    const input = spec.buildInput(ids);
    if (input) {
      ready.push({
        platform,
        label: spec.label,
        actor: spec.actor,
        status: spec.status,
        note: spec.note,
        input,
        from: ids.map((i) => ({ kind: i.kind, value: i.value, module: i.module }))
      });
    } else {
      blocked.push({
        platform,
        label: spec.label,
        actor: spec.actor,
        needs: spec.needs,
        why: ids.length ? `held ${ids.map((i) => i.kind).join(", ")} \u2014 none is a ${spec.needs}` : "registered tier only \u2014 no identifier returned"
      });
    }
  }
  for (const spec of ACTORS) {
    if (seenPlatforms.has(spec.platform)) continue;
    blocked.push({
      platform: spec.platform,
      label: spec.label,
      actor: spec.actor,
      needs: spec.needs,
      why: "platform not returned by any configured vendor"
    });
  }
  return {
    subjectId: opts.subjectId,
    emailHash: opts.emailHash,
    email: opts.email,
    sourceRunId: opts.sourceRunId,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    identifiers,
    ready,
    blocked,
    noRoute,
    counts: {
      identifiers: identifiers.length,
      ready: ready.length,
      blocked: blocked.length,
      noRoute: noRoute.length
    }
  };
}
export {
  extractIdentifiers,
  planTargets
};
