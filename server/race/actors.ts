/**
 * The Apify actor registry, and the honest record of what has no route.
 *
 * Three rules this file exists to enforce:
 *
 *   1. buildInput() returns null rather than a guess. An actor called with an
 *      empty or wrongly shaped input accepts the call, runs, and returns zero
 *      items with no error — which is how a whole workflow once "succeeded"
 *      while scraping nothing, and the personas built on top concluded the
 *      subjects had shallow footprints. They did not. Shape is validated here,
 *      before anything is planned, let alone spent.
 *
 *   2. Status is recorded, not assumed. An actor nobody has run against a real
 *      target is `unverified`, and one our own scraping notes say should not
 *      work is `unproven-contested`. Zero items from either reads as "the actor
 *      may not work", never as "the subject has no footprint".
 *
 *   3. No-routes are documented with a reason. "No actor for Dropbox" is not a
 *      gap to re-search every quarter — Dropbox has no public profile surface
 *      at all. Recording *why* is what stops the same search being run forever.
 */

export type ActorStatus = "verified" | "unverified" | "unproven-contested";
export type IdentifierKind =
  | "username" | "userId" | "profileUrl" | "contributorId" | "handle" | "website";

export interface Identifier {
  platform: string;        // canonical key
  module: string;          // the vendor module it came from
  kind: IdentifierKind;
  value: string;
  provenance: "vendor-returned";
}

export interface ActorSpec {
  actor: string;
  platform: string;
  label: string;
  status: ActorStatus;
  /** What a human should expect it to need, for the UI. */
  needs: string;
  /** Null means "do not call" — never a guess, never {}. */
  buildInput: (ids: Identifier[]) => Record<string, unknown> | null;
  /** Why it might not work, shown beside the status badge. */
  note?: string;
}

const pick = (ids: Identifier[], kind: IdentifierKind) =>
  ids.find((i) => i.kind === kind)?.value;

/** LinkedIn public identifier: the last path segment of the profile URL. */
function linkedinIdentifier(ids: Identifier[]): string | null {
  const url = pick(ids, "profileUrl");
  if (url) {
    const m = url.match(/linkedin\.com\/in\/([^/?#]+)/i);
    if (m) return m[1];
  }
  const handle = pick(ids, "handle") ?? pick(ids, "username");
  // A display name is not an identifier. Reject anything with whitespace.
  return handle && !/\s/.test(handle) ? handle : null;
}

export const ACTORS: ActorSpec[] = [
  {
    actor: "harvestapi/linkedin-profile-scraper",
    platform: "linkedin", label: "LinkedIn", status: "unverified",
    needs: "profile URL or public identifier",
    note: "chosen over dev_fusion: better rated, actively maintained, and email " +
          "extraction is opt-in rather than forced — we do not want contact PII",
    buildInput: (ids) => {
      const id = linkedinIdentifier(ids);
      // Default mode: no email search. Cheaper, and it does not collect
      // contact details the guards would only have to strip again.
      return id ? { publicIdentifiers: [id],
                    profileScraperMode: "Profile details no email ($4 per 1k)" } : null;
    },
  },
  {
    actor: "johnvc/google-maps-contributor-reviews-api",
    platform: "google_maps", label: "Google Maps", status: "unverified",
    needs: "numeric contributor ID (15+ digits)",
    note: "the highest-value surface in the method — the review corpus",
    buildInput: (ids) => {
      // A profile URL is NOT a contributor id. This exact confusion is why the
      // rule is written down.
      const raw = pick(ids, "contributorId") ?? pick(ids, "userId");
      return raw && /^\d{15,}$/.test(raw) ? { contributorId: raw } : null;
    },
  },
  {
    actor: "devilscrapes/github-user-scraper",
    platform: "github", label: "GitHub", status: "unproven-contested",
    needs: "username",
    note: "scraping.md states no actor scrapes a user's own GitHub activity — " +
          "treat zero items as the actor failing, not an empty footprint",
    buildInput: (ids) => {
      const u = pick(ids, "username");
      return u ? { usernames: [u] } : null;
    },
  },
  {
    actor: "abotapi/duolingo-learner-scraper",
    platform: "duolingo", label: "Duolingo", status: "unverified",
    needs: "username or profile URL",
    note: "returns hasPlus beside streak — a dormant paid affinity rendered directly",
    buildInput: (ids) => {
      // Input shape read from the actor's own schema, not from the store
      // listing. The listing truncates inputFields, and filling the gap from
      // memory produced `mode: "profiles"` — which is a value of searchType,
      // not of mode, and cost a 400 on the first live run. A truncated schema
      // is worse than none, because it looks complete.
      //
      // mode enum: search | url | courses | vocabulary
      const url = pick(ids, "profileUrl");
      if (url && /duolingo\.com\/profile\//i.test(url)) {
        // Prefer the URL the vendor gave us over a username we would have to
        // parse back out of it.
        return { mode: "url", urls: [url], fetchAchievements: true, maxItems: 20 };
      }
      const u = pick(ids, "username");
      return u
        ? { mode: "search", searchType: "profiles", usernames: [u],
            fetchAchievements: true, maxItems: 20 }
        : null;
    },
  },
  {
    actor: "apify/instagram-scraper",
    platform: "instagram", label: "Instagram", status: "unverified",
    needs: "username",
    buildInput: (ids) => {
      const u = pick(ids, "username") ?? pick(ids, "handle");
      return u ? { directUrls: [`https://www.instagram.com/${u}/`], resultsType: "details" } : null;
    },
  },
  {
    actor: "apidojo/twitter-user-scraper",
    platform: "twitter", label: "Twitter/X (user)", status: "unverified",
    needs: "handle",
    note: "a Twitter BREACH is not a Twitter account — breach modules never " +
          "produce a handle, and must not be treated as one",
    buildInput: (ids) => {
      const u = pick(ids, "handle") ?? pick(ids, "username");
      return u ? { twitterHandles: [u] } : null;
    },
  },
  {
    actor: "igview-owner/twitter-x-media-scraper",
    platform: "twitter_media", label: "Twitter/X (media)", status: "unverified",
    needs: "handle",
    buildInput: (ids) => {
      const u = pick(ids, "handle") ?? pick(ids, "username");
      return u ? { usernames: [u] } : null;
    },
  },
  {
    actor: "fatihtahta/pinterest-scraper-search",
    platform: "pinterest", label: "Pinterest", status: "unverified",
    needs: "username",
    buildInput: (ids) => {
      const u = pick(ids, "username");
      return u ? { usernames: [u] } : null;
    },
  },
  {
    actor: "scrapesmith/reddit-user-profile-scraper",
    platform: "reddit", label: "Reddit", status: "unverified",
    needs: "username",
    buildInput: (ids) => {
      const u = pick(ids, "username");
      return u ? { usernames: [u] } : null;
    },
  },
  {
    actor: "easyapi/tumblr-posts-scraper",
    platform: "tumblr", label: "Tumblr", status: "unverified",
    needs: "blog name",
    buildInput: (ids) => {
      const u = pick(ids, "username");
      return u ? { blogNames: [u] } : null;
    },
  },
  {
    actor: "automation-lab/substack-scraper",
    platform: "substack", label: "Substack", status: "unverified",
    needs: "publication URL or handle",
    buildInput: (ids) => {
      const u = pick(ids, "profileUrl") ?? pick(ids, "username");
      return u ? { startUrls: [u.startsWith("http") ? u : `https://${u}.substack.com`] } : null;
    },
  },
  {
    actor: "automation-lab/fiverr-scraper",
    platform: "fiverr", label: "Fiverr", status: "unverified",
    needs: "username",
    buildInput: (ids) => {
      const u = pick(ids, "username");
      return u ? { usernames: [u] } : null;
    },
  },
  {
    actor: "parseforge/upwork-freelancers-scraper",
    platform: "upwork", label: "Upwork", status: "unverified",
    needs: "profile URL",
    buildInput: (ids) => {
      const u = pick(ids, "profileUrl");
      return u ? { startUrls: [u] } : null;
    },
  },
  {
    actor: "fatihtahta/quora-scraper",
    platform: "quora", label: "Quora", status: "unverified",
    needs: "username or profile URL",
    buildInput: (ids) => {
      const u = pick(ids, "profileUrl") ?? pick(ids, "username");
      return u ? { urls: [u] } : null;
    },
  },
  {
    actor: "scrapearchitect/spotify-profile-details-scraper",
    platform: "spotify", label: "Spotify", status: "unverified",
    needs: "profile ID or URL",
    buildInput: (ids) => {
      const u = pick(ids, "profileUrl") ?? pick(ids, "userId");
      return u ? { profiles: [u] } : null;
    },
  },
  {
    actor: "unseenuser/fb-photos",
    platform: "facebook", label: "Facebook", status: "unproven-contested",
    needs: "profile URL",
    note: "scraping.md calls Facebook timelines unreliable — a null result here " +
          "must not be read as absence",
    buildInput: (ids) => {
      const u = pick(ids, "profileUrl");
      return u ? { startUrls: [{ url: u }] } : null;
    },
  },
];

export type NoRouteReason = "no_public_surface" | "no_actor_exists" | "discovery_only";

/**
 * Platforms we have looked for and will not find. Recorded so the search is not
 * repeated, and so a reader can tell "we checked and there is nothing" apart
 * from "nobody has looked".
 */
export const NO_ROUTE: Record<string, { reason: NoRouteReason; detail: string }> = {
  dropbox:      { reason: "no_public_surface", detail: "no public profile page exists to scrape" },
  zoho:         { reason: "no_public_surface", detail: "no public profile page exists to scrape" },
  jefit:        { reason: "no_actor_exists",   detail: "public profile, no scraper built (checked 2026-09)" },
  play_games:   { reason: "no_actor_exists",   detail: "only Play Store app scrapers exist, not gamer profiles" },
  myspace:      { reason: "no_actor_exists",   detail: "public profile, no scraper built (checked 2026-09)" },
  eventbrite:   { reason: "discovery_only",    detail: "actors search events by city; none take a person" },
  microsoft:    { reason: "no_public_surface", detail: "account data only, no public profile" },
  google:       { reason: "no_actor_exists",   detail: "account identity only; reviews route via Google Maps" },
  adobe:        { reason: "no_public_surface", detail: "no public profile page exists to scrape" },
  picsart:      { reason: "no_actor_exists",   detail: "public profile, no scraper checked" },
  grammarly:    { reason: "no_public_surface", detail: "no public profile page exists to scrape" },
  otterai:      { reason: "no_public_surface", detail: "no public profile page exists to scrape" },
  expensify:    { reason: "no_public_surface", detail: "no public profile page exists to scrape" },
  wix:          { reason: "no_actor_exists",   detail: "site scrapers exist; no user-profile actor" },
};

/** Vendor module names -> canonical platform keys. */
const PLATFORM_ALIASES: Record<string, string> = {
  "google maps": "google_maps", maps: "google_maps",
  "google play games": "play_games", playgames: "play_games",
  "twitter (200m)": "twitter", "twitter": "twitter", x: "twitter",
  github: "github", linkedin: "linkedin", duolingo: "duolingo",
  instagram: "instagram", pinterest: "pinterest", reddit: "reddit",
  tumblr: "tumblr", substack: "substack", fiverr: "fiverr",
  upwork: "upwork", quora: "quora", spotify: "spotify",
  facebook: "facebook", myspace: "myspace", dropbox: "dropbox",
  zoho: "zoho", jefit: "jefit", eventbrite: "eventbrite",
  microsoft: "microsoft", google: "google", adobe: "adobe",
  picsart: "picsart", grammarly: "grammarly", otterai: "otterai",
  expensify: "expensify", wix: "wix",
};

export function canonicalPlatform(moduleName: string): string {
  const key = moduleName.trim().toLowerCase();
  return PLATFORM_ALIASES[key] ?? key.replace(/[^a-z0-9]+/g, "_");
}

export const actorFor = (platform: string) => ACTORS.find((a) => a.platform === platform);
