const IDENTITY_FIELDS = /* @__PURE__ */ new Set([
  "photourl",
  "avatarurl",
  "profilepictures",
  "recoveryphones",
  "phonenumbers",
  "phonenumber",
  "displayname",
  "firstname",
  "lastname",
  "personname",
  "initials",
  "cid",
  "schoollogourl",
  "companylogourl",
  "fullname"
]);
const drop = (k) => IDENTITY_FIELDS.has(k.toLowerCase());
function put(fields, key, value) {
  if (value === null || value === void 0 || value === "") return;
  if (drop(key)) return;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    fields[key] = value;
  }
}
function ym(d) {
  const y = Number(d?.year);
  if (!Number.isFinite(y)) return null;
  const m = Number(d?.month);
  return Number.isFinite(m) ? `${y}-${String(m).padStart(2, "0")}` : String(y);
}
function fromBehindTheEmail(payload) {
  const registered = [];
  const rich = [];
  const breached = [];
  const timeline = [];
  const reviews = [];
  const profile = payload?.data?.profile;
  if (!profile || typeof profile !== "object") {
    return { registered, rich, breached, timeline, reviews, providers: [] };
  }
  const providers = Object.keys(profile).filter(
    (k) => k !== "summary" && k !== "dataBreach" && k !== "registeredAccounts"
  );
  const addRich = (module, fields) => {
    if (!Object.keys(fields).length) return;
    rich.push({ module, fields, specialCategoryFields: [], sources: ["behind_the_email"] });
  };
  for (const name of providers) {
    const p = profile[name];
    if (!p || typeof p !== "object") continue;
    const f = {};
    if (name === "linkedIn") {
      put(f, "headline", p.basic?.headline);
      put(f, "location", p.basic?.location);
      put(f, "profileUrl", p.metadata?.linkedInUrl);
      put(f, "connectionCount", p.socialGraph?.connectionCount);
      put(f, "connectionCountExceedsMax", p.socialGraph?.connectionCountExceedsMax);
      put(f, "skillCount", p.skills?.totalCount ?? p.skills?.skills?.length);
      const skills = Array.isArray(p.skills?.skills) ? p.skills.skills : [];
      if (skills.length) put(f, "skills", skills.slice(0, 40).join(", "));
      const positions = Array.isArray(p.employment?.positions) ? p.employment.positions : [];
      put(f, "positionCount", positions.length);
      put(f, "currentTitle", p.employment?.latestPosition?.title);
      put(f, "currentCompany", p.employment?.latestPosition?.companyName);
      for (const pos of positions) {
        const start = ym(pos?.dateRange?.start);
        if (!start) continue;
        const end = pos?.dateRange?.end?.kind === "current" ? "present" : ym(pos?.dateRange?.end?.value) ?? "?";
        timeline.push({
          module: "linkedIn",
          group: "employment",
          start,
          content: `${pos?.title ?? "role"} at ${pos?.companyName ?? "company"} (${start} \u2014 ${end})`
        });
      }
      const educations = Array.isArray(p.education?.educations) ? p.education.educations : [];
      put(f, "educationCount", educations.length);
      for (const e of educations) {
        const start = ym(e?.dateRange?.start);
        const label = [e?.degreeName, e?.fieldOfStudy, e?.schoolName].filter(Boolean).join(" \xB7 ");
        if (start) {
          timeline.push({ module: "linkedIn", group: "education", start, content: label });
        } else if (label) {
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
      const apps = Array.isArray(p.apps?.apps) ? p.apps.apps : [];
      if (apps.length) {
        put(f, "googleAppCount", p.apps?.count ?? apps.length);
        put(f, "googleApps", apps.map((a) => a?.formattedName ?? a?.name).filter(Boolean).join(", "));
        for (const a of apps) {
          const label = a?.formattedName ?? a?.name;
          if (label) registered.push({ module: String(label), category: "Google service", source: "behind_the_email" });
        }
      }
      for (const r of Array.isArray(p.reviews?.reviews) ? p.reviews.reviews : []) {
        reviews.push({
          module: "google",
          place: r?.location ?? r?.place,
          rating: r?.rating,
          date: r?.date ?? r?.timestamp,
          body: r?.comment ?? r?.text
        });
      }
      addRich("google", f);
      continue;
    }
    if (name === "duolingo") {
      for (const k of [
        "hasPlus",
        "totalXp",
        "currentStreak",
        "longestStreak",
        "hasRecentActivity",
        "facebookLinked",
        "googleLinked",
        "createdAt",
        "username",
        "profileUrl"
      ]) {
        put(f, k, p[k]);
      }
      addRich("duolingo", f);
      continue;
    }
    for (const [k, v] of Object.entries(p)) {
      if (Array.isArray(v)) {
        const flat = v.filter((x) => typeof x === "string" || typeof x === "number");
        if (flat.length) put(f, k, flat.join(", "));
        else put(f, `${k}Count`, v.length);
      } else if (v && typeof v === "object") {
        for (const [k2, v2] of Object.entries(v)) {
          put(f, `${k}_${k2}`, v2);
        }
      } else {
        put(f, k, v);
      }
    }
    addRich(name, f);
  }
  for (const a of Array.isArray(profile.registeredAccounts?.accounts) ? profile.registeredAccounts.accounts : []) {
    if (a?.isRegistered === false) continue;
    const label = a?.formattedName ?? a?.name;
    if (label) registered.push({ module: String(label), source: "behind_the_email" });
  }
  const db = profile.dataBreach;
  const results = Array.isArray(db?.results) ? db.results : [];
  for (const r of results) {
    const src = r?.source;
    const title = typeof src === "string" ? src : src?.name;
    if (!title) continue;
    breached.push({
      source: "behind_the_email",
      module: "data-breach",
      title: String(title),
      breachDate: src?.date ?? void 0,
      dataClasses: Object.keys(r).filter((k) => k !== "source")
    });
  }
  if (db?.firstAppeared) {
    timeline.push({
      module: "data-breach",
      group: "breach",
      start: db.firstAppeared,
      content: "First appearance in a breach corpus"
    });
  }
  if (db?.lastAppeared) {
    timeline.push({
      module: "data-breach",
      group: "breach",
      start: db.lastAppeared,
      content: "Most recent appearance in a breach corpus"
    });
  }
  for (const d of Array.isArray(profile.summary?.dates) ? profile.summary.dates : []) {
    if (!d?.value) continue;
    timeline.push({
      module: String(d.source ?? "summary"),
      group: "account",
      start: String(d.value),
      content: String(d.label ?? "dated event")
    });
  }
  return {
    registered,
    rich,
    breached,
    timeline,
    reviews,
    status: payload?.data?.status,
    providers
  };
}
export {
  fromBehindTheEmail
};
