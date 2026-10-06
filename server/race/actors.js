const pick = (ids, kind) => ids.find((i) => i.kind === kind)?.value;
function linkedinIdentifier(ids) {
  const url = pick(ids, "profileUrl");
  if (url) {
    const m = url.match(/linkedin\.com\/in\/([^/?#]+)/i);
    if (m) return m[1];
  }
  const handle = pick(ids, "handle") ?? pick(ids, "username");
  return handle && !/\s/.test(handle) ? handle : null;
}
const ACTORS = [
  {
    actor: "harvestapi/linkedin-profile-scraper",
    platform: "linkedin",
    label: "LinkedIn",
    status: "unverified",
    needs: "profile URL or public identifier",
    note: "chosen over dev_fusion: better rated, actively maintained, and email extraction is opt-in rather than forced \u2014 we do not want contact PII",
    buildInput: (ids) => {
      const id = linkedinIdentifier(ids);
      return id ? {
        publicIdentifiers: [id],
        profileScraperMode: "Profile details no email ($4 per 1k)"
      } : null;
    }
  },
  {
    actor: "johnvc/google-maps-contributor-reviews-api",
    platform: "google_maps",
    label: "Google Maps",
    status: "unverified",
    needs: "numeric contributor ID (15+ digits)",
    note: "the highest-value surface in the method \u2014 the review corpus",
    buildInput: (ids) => {
      const raw = pick(ids, "contributorId") ?? pick(ids, "userId");
      return raw && /^\d{15,}$/.test(raw) ? { contributorId: raw } : null;
    }
  },
  {
    actor: "devilscrapes/github-user-scraper",
    platform: "github",
    label: "GitHub",
    status: "unproven-contested",
    needs: "username",
    note: "scraping.md states no actor scrapes a user's own GitHub activity \u2014 treat zero items as the actor failing, not an empty footprint",
    buildInput: (ids) => {
      const u = pick(ids, "username");
      return u ? { usernames: [u] } : null;
    }
  },
  {
    actor: "abotapi/duolingo-learner-scraper",
    platform: "duolingo",
    label: "Duolingo",
    status: "unverified",
    needs: "username or profile URL",
    note: "returns hasPlus beside streak \u2014 a dormant paid affinity rendered directly",
    buildInput: (ids) => {
      const url = pick(ids, "profileUrl");
      if (url && /duolingo\.com\/profile\//i.test(url)) {
        return { mode: "url", urls: [url], fetchAchievements: true, maxItems: 20 };
      }
      const u = pick(ids, "username");
      return u ? {
        mode: "search",
        searchType: "profiles",
        usernames: [u],
        fetchAchievements: true,
        maxItems: 20
      } : null;
    }
  },
  {
    actor: "apify/instagram-scraper",
    platform: "instagram",
    label: "Instagram",
    status: "unverified",
    needs: "username",
    buildInput: (ids) => {
      const u = pick(ids, "username") ?? pick(ids, "handle");
      return u ? { directUrls: [`https://www.instagram.com/${u}/`], resultsType: "details" } : null;
    }
  },
  {
    actor: "apidojo/twitter-user-scraper",
    platform: "twitter",
    label: "Twitter/X (user)",
    status: "unverified",
    needs: "handle",
    note: "a Twitter BREACH is not a Twitter account \u2014 breach modules never produce a handle, and must not be treated as one",
    buildInput: (ids) => {
      const u = pick(ids, "handle") ?? pick(ids, "username");
      return u ? { twitterHandles: [u] } : null;
    }
  },
  {
    actor: "igview-owner/twitter-x-media-scraper",
    platform: "twitter_media",
    label: "Twitter/X (media)",
    status: "unverified",
    needs: "handle",
    buildInput: (ids) => {
      const u = pick(ids, "handle") ?? pick(ids, "username");
      return u ? { usernames: [u] } : null;
    }
  },
  {
    actor: "fatihtahta/pinterest-scraper-search",
    platform: "pinterest",
    label: "Pinterest",
    status: "unverified",
    needs: "username",
    buildInput: (ids) => {
      const u = pick(ids, "username");
      return u ? { usernames: [u] } : null;
    }
  },
  {
    actor: "scrapesmith/reddit-user-profile-scraper",
    platform: "reddit",
    label: "Reddit",
    status: "unverified",
    needs: "username",
    buildInput: (ids) => {
      const u = pick(ids, "username");
      return u ? { usernames: [u] } : null;
    }
  },
  {
    actor: "easyapi/tumblr-posts-scraper",
    platform: "tumblr",
    label: "Tumblr",
    status: "unverified",
    needs: "blog name",
    buildInput: (ids) => {
      const u = pick(ids, "username");
      return u ? { blogNames: [u] } : null;
    }
  },
  {
    actor: "automation-lab/substack-scraper",
    platform: "substack",
    label: "Substack",
    status: "unverified",
    needs: "publication URL or handle",
    buildInput: (ids) => {
      const u = pick(ids, "profileUrl") ?? pick(ids, "username");
      return u ? { startUrls: [u.startsWith("http") ? u : `https://${u}.substack.com`] } : null;
    }
  },
  {
    actor: "automation-lab/fiverr-scraper",
    platform: "fiverr",
    label: "Fiverr",
    status: "unverified",
    needs: "username",
    buildInput: (ids) => {
      const u = pick(ids, "username");
      return u ? { usernames: [u] } : null;
    }
  },
  {
    actor: "parseforge/upwork-freelancers-scraper",
    platform: "upwork",
    label: "Upwork",
    status: "unverified",
    needs: "profile URL",
    buildInput: (ids) => {
      const u = pick(ids, "profileUrl");
      return u ? { startUrls: [u] } : null;
    }
  },
  {
    actor: "fatihtahta/quora-scraper",
    platform: "quora",
    label: "Quora",
    status: "unverified",
    needs: "username or profile URL",
    buildInput: (ids) => {
      const u = pick(ids, "profileUrl") ?? pick(ids, "username");
      return u ? { urls: [u] } : null;
    }
  },
  {
    actor: "scrapearchitect/spotify-profile-details-scraper",
    platform: "spotify",
    label: "Spotify",
    status: "unverified",
    needs: "profile ID or URL",
    buildInput: (ids) => {
      const u = pick(ids, "profileUrl") ?? pick(ids, "userId");
      return u ? { profiles: [u] } : null;
    }
  },
  {
    actor: "unseenuser/fb-photos",
    platform: "facebook",
    label: "Facebook",
    status: "unproven-contested",
    needs: "profile URL",
    note: "scraping.md calls Facebook timelines unreliable \u2014 a null result here must not be read as absence",
    buildInput: (ids) => {
      const u = pick(ids, "profileUrl");
      return u ? { startUrls: [{ url: u }] } : null;
    }
  }
];
const NO_ROUTE = {
  dropbox: { reason: "no_public_surface", detail: "no public profile page exists to scrape" },
  zoho: { reason: "no_public_surface", detail: "no public profile page exists to scrape" },
  jefit: { reason: "no_actor_exists", detail: "public profile, no scraper built (checked 2026-09)" },
  play_games: { reason: "no_actor_exists", detail: "only Play Store app scrapers exist, not gamer profiles" },
  myspace: { reason: "no_actor_exists", detail: "public profile, no scraper built (checked 2026-09)" },
  eventbrite: { reason: "discovery_only", detail: "actors search events by city; none take a person" },
  microsoft: { reason: "no_public_surface", detail: "account data only, no public profile" },
  google: { reason: "no_actor_exists", detail: "account identity only; reviews route via Google Maps" },
  adobe: { reason: "no_public_surface", detail: "no public profile page exists to scrape" },
  picsart: { reason: "no_actor_exists", detail: "public profile, no scraper checked" },
  grammarly: { reason: "no_public_surface", detail: "no public profile page exists to scrape" },
  otterai: { reason: "no_public_surface", detail: "no public profile page exists to scrape" },
  expensify: { reason: "no_public_surface", detail: "no public profile page exists to scrape" },
  wix: { reason: "no_actor_exists", detail: "site scrapers exist; no user-profile actor" }
};
const PLATFORM_ALIASES = {
  "google maps": "google_maps",
  maps: "google_maps",
  "google play games": "play_games",
  playgames: "play_games",
  "twitter (200m)": "twitter",
  "twitter": "twitter",
  x: "twitter",
  github: "github",
  linkedin: "linkedin",
  duolingo: "duolingo",
  instagram: "instagram",
  pinterest: "pinterest",
  reddit: "reddit",
  tumblr: "tumblr",
  substack: "substack",
  fiverr: "fiverr",
  upwork: "upwork",
  quora: "quora",
  spotify: "spotify",
  facebook: "facebook",
  myspace: "myspace",
  dropbox: "dropbox",
  zoho: "zoho",
  jefit: "jefit",
  eventbrite: "eventbrite",
  microsoft: "microsoft",
  google: "google",
  adobe: "adobe",
  picsart: "picsart",
  grammarly: "grammarly",
  otterai: "otterai",
  expensify: "expensify",
  wix: "wix"
};
function canonicalPlatform(moduleName) {
  const key = moduleName.trim().toLowerCase();
  return PLATFORM_ALIASES[key] ?? key.replace(/[^a-z0-9]+/g, "_");
}
const actorFor = (platform) => ACTORS.find((a) => a.platform === platform);
export {
  ACTORS,
  NO_ROUTE,
  actorFor,
  canonicalPlatform
};
