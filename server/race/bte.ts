/**
 * Behind the Email → the same views everything downstream already reads.
 *
 * Written against a live payload, not the reference doc, and the two differ in
 * ways that matter:
 *
 *   - The provider key is `linkedIn`, with a capital I. `linkedin` finds nothing.
 *   - `duolingo` came back as {facebookLinked, googleLinked, hasRecentActivity}
 *     with NO hasPlus, totalXp or currentStreak — the three fields the doc
 *     describes as "a dormant paid affinity rendered directly". They are read
 *     here when present and never assumed, because on this subject they are not
 *     there and a normaliser that expects them would report a paid tier as
 *     absent rather than as unknown.
 *   - There is a `summary` block the doc does not mention, carrying dates,
 *     links, locations, names, usernames and phone numbers each tagged with the
 *     provider they came from. The dated entries are the cleanest timeline any
 *     vendor has produced.
 *
 * That gap is the reason this file was written after the first live call rather
 * than before it. The Duolingo 400 came from filling a schema gap from a
 * document; this is the same mistake refused.
 */

import type {
  RegisteredRow, RichRow, BreachRow, TimelineRow, ReviewRow,
} from "./extract.js";

/**
 * Identity that must not enter the views.
 *
 * The views feed the step 4 and step 5 prompts. The prompts forbid identity in
 * their OUTPUT and persona.ts scrubs it there, but the cheapest place to not
 * leak a face or a phone number is to never put it in the input.
 *
 * `username`, `profileUrl` and `id` are deliberately NOT here: step 2 reads
 * exactly those field names off the rich rows to build scrape targets, so
 * dropping them would silently cost the pipeline its routes.
 */
const IDENTITY_FIELDS = new Set([
  "photourl", "avatarurl", "profilepictures", "recoveryphones", "phonenumbers",
  "phonenumber", "displayname", "firstname", "lastname", "personname",
  "initials", "cid", "schoollogourl", "companylogourl", "fullname",
]);

const drop = (k: string) => IDENTITY_FIELDS.has(k.toLowerCase());

function put(
  fields: Record<string, string | number | boolean>,
  key: string,
  value: unknown,
) {
  if (value === null || value === undefined || value === "") return;
  if (drop(key)) return;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    fields[key] = value;
  }
}

/** {month: 7, year: 2024} → "2024-07". A partial date is still a date. */
function ym(d: any): string | null {
  const y = Number(d?.year);
  if (!Number.isFinite(y)) return null;
  const m = Number(d?.month);
  return Number.isFinite(m) ? `${y}-${String(m).padStart(2, "0")}` : String(y);
}

export interface BteViews {
  registered: RegisteredRow[];
  rich: RichRow[];
  breached: BreachRow[];
  timeline: TimelineRow[];
  reviews: ReviewRow[];
  /** What the vendor said about the address itself: "found" or "not_found". */
  status?: string;
  providers: string[];
}

export function fromBehindTheEmail(payload: any): BteViews {
  const registered: RegisteredRow[] = [];
  const rich: RichRow[] = [];
  const breached: BreachRow[] = [];
  const timeline: TimelineRow[] = [];
  const reviews: ReviewRow[] = [];

  const profile = payload?.data?.profile;
  if (!profile || typeof profile !== "object") {
    return { registered, rich, breached, timeline, reviews, providers: [] };
  }

  const providers = Object.keys(profile).filter(
    (k) => k !== "summary" && k !== "dataBreach" && k !== "registeredAccounts",
  );

  const addRich = (module: string, fields: Record<string, string | number | boolean>) => {
    if (!Object.keys(fields).length) return;
    rich.push({ module, fields, specialCategoryFields: [], sources: ["behind_the_email"] });
  };

  /* ------------------------------------------------------------- providers */

  for (const name of providers) {
    const p = (profile as any)[name];
    if (!p || typeof p !== "object") continue;
    const f: Record<string, string | number | boolean> = {};

    if (name === "linkedIn") {
      put(f, "headline", p.basic?.headline);
      put(f, "location", p.basic?.location);
      put(f, "profileUrl", p.metadata?.linkedInUrl);
      put(f, "connectionCount", p.socialGraph?.connectionCount);
      put(f, "connectionCountExceedsMax", p.socialGraph?.connectionCountExceedsMax);
      put(f, "skillCount", p.skills?.totalCount ?? p.skills?.skills?.length);
      const skills: string[] = Array.isArray(p.skills?.skills) ? p.skills.skills : [];
      if (skills.length) put(f, "skills", skills.slice(0, 40).join(", "));

      const positions: any[] = Array.isArray(p.employment?.positions) ? p.employment.positions : [];
      put(f, "positionCount", positions.length);
      put(f, "currentTitle", p.employment?.latestPosition?.title);
      put(f, "currentCompany", p.employment?.latestPosition?.companyName);

      // The ordered career history — the one thing the export only ever gave as
      // undated stacked rows. Each position becomes a timeline event.
      for (const pos of positions) {
        const start = ym(pos?.dateRange?.start);
        if (!start) continue;
        const end = pos?.dateRange?.end?.kind === "current"
          ? "present"
          : ym(pos?.dateRange?.end?.value) ?? "?";
        timeline.push({
          module: "linkedIn", group: "employment", start,
          content: `${pos?.title ?? "role"} at ${pos?.companyName ?? "company"} (${start} — ${end})`,
        });
      }

      const educations: any[] = Array.isArray(p.education?.educations) ? p.education.educations : [];
      put(f, "educationCount", educations.length);
      for (const e of educations) {
        const start = ym(e?.dateRange?.start);
        const label = [e?.degreeName, e?.fieldOfStudy, e?.schoolName].filter(Boolean).join(" · ");
        if (start) {
          timeline.push({ module: "linkedIn", group: "education", start, content: label });
        } else if (label) {
          // Undated on this subject. Recorded as a field rather than invented
          // onto the timeline, because a made-up date is worse than no date.
          put(f, `education_${educations.indexOf(e) + 1}`, label);
        }
      }
      addRich("linkedIn", f);
      continue;
    }

    if (name === "google") {
      put(f, "personId", p.person?.personId);
      put(f, "profileUrl", p.person?.mapsProfileUrl);
      put(f, "userType", p.person?.userType);
      put(f, "isEnterpriseUser", p.person?.isEnterpriseUser);
      put(f, "lastUpdated", p.person?.lastUpdated);
      put(f, "reviewCount", p.reviews?.count);
      const apps: any[] = Array.isArray(p.apps?.apps) ? p.apps.apps : [];
      if (apps.length) {
        put(f, "googleAppCount", p.apps?.count ?? apps.length);
        put(f, "googleApps", apps.map((a) => a?.formattedName ?? a?.name).filter(Boolean).join(", "));
        for (const a of apps) {
          const label = a?.formattedName ?? a?.name;
          if (label) registered.push({ module: String(label), category: "Google service", source: "behind_the_email" });
        }
      }
      for (const r of (Array.isArray(p.reviews?.reviews) ? p.reviews.reviews : [])) {
        reviews.push({
          module: "google", place: r?.location ?? r?.place, rating: r?.rating,
          date: r?.date ?? r?.timestamp, body: r?.comment ?? r?.text,
        });
      }
      addRich("google", f);
      continue;
    }

    if (name === "duolingo") {
      // Every field read defensively. See the file header: the paid-tier fields
      // the doc promises were absent on the first live subject.
      for (const k of ["hasPlus", "totalXp", "currentStreak", "longestStreak",
                       "hasRecentActivity", "facebookLinked", "googleLinked",
                       "createdAt", "username", "profileUrl"]) {
        put(f, k, p[k]);
      }
      addRich("duolingo", f);
      continue;
    }

    // Everything else: flatten one level and let the identity filter decide.
    for (const [k, v] of Object.entries(p)) {
      if (Array.isArray(v)) {
        const flat = v.filter((x) => typeof x === "string" || typeof x === "number");
        if (flat.length) put(f, k, flat.join(", "));
        else put(f, `${k}Count`, v.length);
      } else if (v && typeof v === "object") {
        for (const [k2, v2] of Object.entries(v as Record<string, unknown>)) {
          put(f, `${k}_${k2}`, v2);
        }
      } else {
        put(f, k, v);
      }
    }
    addRich(name, f);
  }

  /* -------------------------------------------------------- registered set */

  for (const a of (Array.isArray(profile.registeredAccounts?.accounts)
    ? profile.registeredAccounts.accounts : [])) {
    if (a?.isRegistered === false) continue;
    const label = a?.formattedName ?? a?.name;
    if (label) registered.push({ module: String(label), source: "behind_the_email" });
  }

  /* -------------------------------------------------------------- breaches */

  /*
   * Source and dates only.
   *
   * dataBreach.results[] arrives carrying cleartext `password`, plus
   * `fullName`, `phoneNumber` and `username`. scrubCredentials() in store.ts
   * catches the password on the way to disk and does NOT catch the other three
   * — the live payload has all of them stored. Nothing beyond the source name
   * and the date window is read here, and the drop is recorded as a count so a
   * reviewer can see the guard fired rather than taking it on trust.
   */
  const db = profile.dataBreach;
  const results: any[] = Array.isArray(db?.results) ? db.results : [];
  for (const r of results) {
    const src = r?.source;
    const title = typeof src === "string" ? src : src?.name;
    if (!title) continue;
    breached.push({
      source: "behind_the_email",
      module: "data-breach",
      title: String(title),
      breachDate: src?.date ?? undefined,
      dataClasses: Object.keys(r).filter((k) => k !== "source"),
    });
  }
  if (db?.firstAppeared) {
    timeline.push({ module: "data-breach", group: "breach", start: db.firstAppeared,
                    content: "First appearance in a breach corpus" });
  }
  if (db?.lastAppeared) {
    timeline.push({ module: "data-breach", group: "breach", start: db.lastAppeared,
                    content: "Most recent appearance in a breach corpus" });
  }

  /* --------------------------------------------------------- summary dates */

  // The cleanest timeline any vendor has returned: each entry already carries
  // its own source and label. Only the dated rows are taken — names, usernames,
  // phone numbers and profile pictures in the same block are identity and are
  // deliberately left where they are.
  for (const d of (Array.isArray(profile.summary?.dates) ? profile.summary.dates : [])) {
    if (!d?.value) continue;
    timeline.push({
      module: String(d.source ?? "summary"),
      group: "account",
      start: String(d.value),
      content: String(d.label ?? "dated event"),
    });
  }

  return {
    registered, rich, breached, timeline, reviews,
    status: payload?.data?.status,
    providers,
  };
}
