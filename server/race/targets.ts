/**
 * Step 2 — work out what could be scraped, and write it down. Spends nothing.
 *
 * Reads the payload step 1 already stored, pulls the identifiers the vendor
 * returned, and sorts every platform into one of three buckets: an actor with a
 * valid input, an actor with nothing to point it at, or no route at all.
 *
 * The separation from actually running the actors is the point. A plan can be
 * read, argued with and corrected before a rupee is spent — and the failure
 * this method is most prone to (an actor called with the wrong input shape,
 * returning zero items, recorded as an empty footprint) becomes visible here
 * rather than three steps downstream in a persona.
 */

import { extractViews } from "./extract.js";
import {
  ACTORS, NO_ROUTE, canonicalPlatform, actorFor,
  type Identifier, type IdentifierKind, type ActorStatus, type NoRouteReason,
} from "./actors.js";

export interface PlannedActor {
  platform: string;
  label: string;
  actor: string;
  status: ActorStatus;
  note?: string;
  input: Record<string, unknown>;
  from: { kind: IdentifierKind; value: string; module: string }[];
}

export interface BlockedActor {
  platform: string;
  label: string;
  actor: string;
  needs: string;
  why: string;
}

export interface NoRouteEntry {
  platform: string;
  reason: NoRouteReason | "unmapped";
  detail: string;
  identifiersHeld: number;
}

export interface TargetPlan {
  subjectId: string;
  emailHash: string;
  email?: string;
  sourceRunId: string;
  createdAt: string;
  identifiers: Identifier[];
  ready: PlannedActor[];
  blocked: BlockedActor[];
  noRoute: NoRouteEntry[];
  counts: { identifiers: number; ready: number; blocked: number; noRoute: number };
}

/**
 * Which raw field names count as which kind of identifier.
 *
 * Deliberately narrow. `name` is not an identifier — a display name is not
 * something an actor can be pointed at, and treating it as one is how you end
 * up scraping a stranger who happens to share a name.
 */
const FIELD_KINDS: [RegExp, IdentifierKind][] = [
  [/^(username|user_name|handle|screen_name|nickname)$/i, "username"],
  [/^(profile_url|profileurl|url|link|profile)$/i, "profileUrl"],
  [/^(id|user_id|userid|account_id|person_id)$/i, "userId"],
  [/^(contributor_id|contributorid)$/i, "contributorId"],
  [/^(website|site)$/i, "website"],
];

function kindFor(field: string): IdentifierKind | null {
  for (const [rx, kind] of FIELD_KINDS) if (rx.test(field)) return kind;
  return null;
}

/**
 * Pull identifiers out of the stored payload.
 *
 * Only what the vendor returned FOR THIS EMAIL. Nothing is inferred across
 * platforms: a username on one platform is not evidence of the same username
 * belonging to the same person on another, and once a guessed handle is in the
 * record nothing downstream can tell it from a real one.
 */
export function extractIdentifiers(raw: Record<string, any>): Identifier[] {
  const views = extractViews(raw);
  const out: Identifier[] = [];

  for (const row of views.rich) {
    const platform = canonicalPlatform(row.module);

    // A breach is not an account. The breached view is excluded entirely —
    // "Twitter (200M)" is an incident this address appeared in, not a handle.
    for (const [field, value] of Object.entries(row.fields)) {
      const kind = kindFor(field);
      if (!kind) continue;
      const str = String(value).trim();
      if (!str || str.length < 2) continue;

      // Google Maps reports the contributor id in a plain `id` field; it is the
      // one input its actor accepts, so promote it rather than losing it.
      const finalKind: IdentifierKind =
        platform === "google_maps" && kind === "userId" ? "contributorId" : kind;

      out.push({ platform, module: row.module, kind: finalKind,
                 value: str, provenance: "vendor-returned" });
    }
  }

  // Same platform, same kind, same value, reported twice — one identifier.
  const seen = new Set<string>();
  return out.filter((i) => {
    const k = `${i.platform}|${i.kind}|${i.value}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function planTargets(opts: {
  subjectId: string; emailHash: string; email?: string;
  sourceRunId: string; raw: Record<string, any>;
}): TargetPlan {
  const identifiers = extractIdentifiers(opts.raw);

  const byPlatform = new Map<string, Identifier[]>();
  for (const id of identifiers) {
    byPlatform.set(id.platform, [...(byPlatform.get(id.platform) ?? []), id]);
  }

  // Every platform we saw, plus every platform that only appeared in the
  // registered tier (existence, no handle) — those are the honest "blocked"
  // cases and must not silently vanish.
  const views = extractViews(opts.raw);
  const seenPlatforms = new Set<string>([
    ...byPlatform.keys(),
    ...views.registered.map((r) => canonicalPlatform(r.module)),
  ]);

  const ready: PlannedActor[] = [];
  const blocked: BlockedActor[] = [];
  const noRoute: NoRouteEntry[] = [];

  for (const platform of [...seenPlatforms].sort()) {
    const ids = byPlatform.get(platform) ?? [];
    const spec = actorFor(platform);

    if (!spec) {
      const known = NO_ROUTE[platform];
      noRoute.push({
        platform,
        reason: known?.reason ?? "unmapped",
        detail: known?.detail ?? "no actor checked for this platform yet",
        identifiersHeld: ids.length,
      });
      continue;
    }

    const input = spec.buildInput(ids);
    if (input) {
      ready.push({
        platform, label: spec.label, actor: spec.actor, status: spec.status,
        note: spec.note, input,
        from: ids.map((i) => ({ kind: i.kind, value: i.value, module: i.module })),
      });
    } else {
      blocked.push({
        platform, label: spec.label, actor: spec.actor, needs: spec.needs,
        why: ids.length
          ? `held ${ids.map((i) => i.kind).join(", ")} — none is a ${spec.needs}`
          : "registered tier only — no identifier returned",
      });
    }
  }

  // Actors whose platform never appeared at all. Worth listing: "LinkedIn was
  // never seen" is a different statement from "LinkedIn had no handle", and the
  // reason is usually a vendor that is not configured rather than an absent
  // account.
  for (const spec of ACTORS) {
    if (seenPlatforms.has(spec.platform)) continue;
    blocked.push({
      platform: spec.platform, label: spec.label, actor: spec.actor,
      needs: spec.needs,
      why: "platform not returned by any configured vendor",
    });
  }

  return {
    subjectId: opts.subjectId, emailHash: opts.emailHash, email: opts.email,
    sourceRunId: opts.sourceRunId, createdAt: new Date().toISOString(),
    identifiers, ready, blocked, noRoute,
    counts: {
      identifiers: identifiers.length,
      ready: ready.length,
      blocked: blocked.length,
      noRoute: noRoute.length,
    },
  };
}
