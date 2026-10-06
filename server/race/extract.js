const SPECIAL_CATEGORY = /* @__PURE__ */ new Set([
  "gender",
  "age",
  "birthday",
  "date_of_birth",
  "dob",
  "ethnicity",
  "sexual_orientation",
  "relationship_status",
  "religion",
  "children",
  "location_of_birth",
  "marital_status",
  "health"
]);
import { fromBehindTheEmail } from "./bte.js";
const DROP_SPECIAL = () => process.env.RACE_DROP_SPECIAL_CATEGORY === "true";
const BREACH_FIELDS = /* @__PURE__ */ new Set([
  "breach",
  "breach_date",
  "breach_count",
  "data_classes",
  "logo",
  "added_date",
  "modified_date",
  "title",
  "description",
  "website",
  "bio",
  "picture_url",
  "name",
  "creation_date",
  "timeline_data"
]);
const isEmpty = (v) => v === null || v === void 0 || v === "" || Array.isArray(v) && v.length === 0;
function flattenSpec(spec) {
  const out = {};
  if (!spec || typeof spec !== "object") return out;
  for (const [key, field] of Object.entries(spec)) {
    if (key === "platform_variables") continue;
    if (field && typeof field === "object" && "value" in field) {
      if (!isEmpty(field.value)) out[key] = field.value;
    } else if (!isEmpty(field)) {
      out[key] = field;
    }
  }
  for (const pv of spec.platform_variables ?? []) {
    const key = pv?.key ?? pv?.proper_key;
    if (key && !isEmpty(pv?.value)) out[String(key)] = pv.value;
  }
  return out;
}
function timelineFor(moduleName, flat, spec) {
  const rows = [];
  const td = spec?.timeline_data ?? flat.timeline_data;
  const parsed = typeof td === "string" ? safeJson(td) : td;
  for (const [group, items] of Object.entries(parsed?.group_items ?? {})) {
    for (const item of items ?? []) {
      if (!item?.start) continue;
      rows.push({
        module: moduleName,
        group: String(item.group_name ?? group),
        start: String(item.start),
        content: String(item.content ?? "")
      });
    }
  }
  if (flat.last_seen_date || flat.last_seen && typeof flat.last_seen === "string") {
    rows.push({
      module: moduleName,
      group: "last_seen",
      start: String(flat.last_seen_date ?? flat.last_seen),
      content: "Last seen"
    });
  }
  if (flat.creation_date && !flat.breach) {
    rows.push({
      module: moduleName,
      group: "created",
      start: String(flat.creation_date),
      content: "Registered"
    });
  }
  return rows;
}
function safeJson(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
function geoFor(moduleName, flat) {
  const rows = [];
  const lat = flat.latitude ?? flat.lat;
  const lng = flat.longitude ?? flat.lng ?? flat.lon;
  if (typeof lat === "number" && typeof lng === "number") {
    rows.push({
      module: moduleName,
      latitude: lat,
      longitude: lng,
      label: flat.location ? String(flat.location) : void 0
    });
  }
  return rows;
}
function fromModuleData(moduleName, mod) {
  const data = mod?.data;
  if (!data || typeof data !== "object") return { reviews: [], stats: {} };
  const reviews = [];
  for (const r of data.reviews ?? []) {
    if (!r || typeof r !== "object") continue;
    reviews.push({
      module: moduleName,
      place: r.name ?? r.place ?? r.title,
      address: r.address,
      rating: typeof r.rating === "number" ? r.rating : void 0,
      date: r.approximative_date ?? r.date ?? r.published_at,
      body: r.review ?? r.text ?? r.comment ?? r.body,
      tags: Array.isArray(r.tags) ? r.tags.map(String) : void 0,
      types: Array.isArray(r.types) ? r.types.map(String) : void 0
    });
  }
  const stats = {};
  for (const [k, v] of Object.entries(data.stats ?? {})) {
    if (v !== null && typeof v !== "object") stats[k] = v;
  }
  return { reviews, stats };
}
function extractViews(raw) {
  const registered = [];
  const rich = [];
  const breached = [];
  const timeline = [];
  const geo = [];
  const reviews = [];
  const modules = Array.isArray(raw?.osint_industries) ? raw.osint_industries : [];
  for (const mod of modules) {
    const name = String(mod?.module ?? mod?.name ?? "").trim();
    if (!name) continue;
    const specs = Array.isArray(mod?.spec_format) && mod.spec_format.length ? mod.spec_format : [mod?.spec_format ?? {}];
    for (const spec of specs) {
      handleSpec(name, mod, spec);
    }
    const extra = fromModuleData(name, mod);
    reviews.push(...extra.reviews);
    if (Object.keys(extra.stats).length) {
      const row = rich.find((r) => r.module === name);
      if (row) Object.assign(row.fields, extra.stats);
      else rich.push({ module: name, fields: extra.stats, specialCategoryFields: [] });
    }
  }
  function handleSpec(name, mod, spec) {
    const flat = flattenSpec(spec);
    if (flat.breach === true) {
      breached.push({
        module: name,
        title: str(flat.title ?? flat.name),
        website: str(flat.website),
        breachDate: str(flat.breach_date ?? flat.creation_date),
        breachCount: typeof flat.breach_count === "number" ? flat.breach_count : void 0,
        dataClasses: splitClasses(flat.data_classes),
        logo: str(flat.logo ?? flat.picture_url),
        description: str(flat.description ?? flat.bio),
        addedDate: str(flat.added_date),
        modifiedDate: str(flat.modified_date)
      });
      timeline.push(...timelineFor(name, flat, spec));
      return;
    }
    const fields = {};
    const special = [];
    for (const [key2, value] of Object.entries(flat)) {
      if (BREACH_FIELDS.has(key2) && key2 !== "creation_date" && key2 !== "picture_url" && key2 !== "name" && key2 !== "website") continue;
      if (key2 === "timeline_data" || key2 === "registered") continue;
      if (SPECIAL_CATEGORY.has(key2.toLowerCase())) {
        special.push(key2);
        if (DROP_SPECIAL()) continue;
      }
      if (typeof value === "object") continue;
      fields[key2] = value;
    }
    const category = mod?.category ?? {};
    const hasDetail = Object.keys(fields).length > 0;
    if (hasDetail) {
      rich.push({ module: name, fields, specialCategoryFields: special });
    } else {
      registered.push({
        module: name,
        source: "osint_industries",
        category: str(category.name ?? mod?.category_name),
        categoryDescription: str(category.description ?? mod?.category_description)
      });
    }
    timeline.push(...timelineFor(name, flat, spec));
    geo.push(...geoFor(name, flat));
  }
  const seenRegistered = /* @__PURE__ */ new Set();
  const dedupedRegistered = registered.filter((r) => {
    const k = r.module.toLowerCase();
    if (seenRegistered.has(k)) return false;
    seenRegistered.add(k);
    return true;
  });
  registered.length = 0;
  registered.push(...dedupedRegistered);
  const bte = fromBehindTheEmail(raw?.behind_the_email);
  const key = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const corroborated = [];
  for (const r of rich) r.sources = r.sources ?? ["osint_industries"];
  for (const row of bte.rich) {
    const existing = rich.find((r) => key(r.module) === key(row.module));
    if (existing) {
      corroborated.push(existing.module);
      existing.sources = Array.from(/* @__PURE__ */ new Set([...existing.sources ?? [], "behind_the_email"]));
      for (const [k, v] of Object.entries(row.fields)) {
        if (!(k in existing.fields)) existing.fields[k] = v;
      }
    } else {
      rich.push(row);
    }
  }
  const richKeys = new Set(rich.map((r) => key(r.module)));
  for (const row of bte.registered) {
    if (richKeys.has(key(row.module))) continue;
    if (registered.some((r) => key(r.module) === key(row.module))) continue;
    registered.push(row);
  }
  const breachKey = (t) => key(String(t ?? "").replace(/\.(com|in|net|org|io)$/i, ""));
  for (const row of bte.breached) {
    if (breached.some((b) => breachKey(b.title) === breachKey(row.title))) continue;
    breached.push(row);
  }
  timeline.push(...bte.timeline);
  reviews.push(...bte.reviews);
  timeline.sort((a, b) => a.start < b.start ? 1 : -1);
  for (const b of breached) b.source = b.source ?? "osint_industries";
  const count = (v) => ({
    rich: rich.filter((r) => (r.sources ?? []).includes(v)).length,
    registered: registered.filter((r) => (r.source ?? "osint_industries") === v).length,
    breached: breached.filter((b) => (b.source ?? "osint_industries") === v).length
  });
  return {
    registered,
    rich,
    breached,
    timeline,
    geo,
    reviews,
    counts: {
      modules: modules.length + bte.providers.length,
      registered: registered.length,
      rich: rich.length,
      breached: breached.length,
      timelineEvents: timeline.length,
      geo: geo.length,
      reviews: reviews.length
    },
    ...bte.providers.length ? {
      bySource: {
        osint_industries: count("osint_industries"),
        behind_the_email: count("behind_the_email")
      },
      corroborated: Array.from(new Set(corroborated))
    } : {}
  };
}
const str = (v) => isEmpty(v) ? void 0 : String(v);
function splitClasses(v) {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string") return v.split("|").map((s) => s.trim()).filter(Boolean);
  return [];
}
function viewsToCsv(views) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const table = (rows, cols) => [
    cols.map(esc).join(","),
    ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))
  ].join("\n");
  const richCols = ["module", ...[...new Set(views.rich.flatMap((r) => Object.keys(r.fields)))]];
  const richRows = views.rich.map((r) => ({ module: r.module, ...r.fields }));
  return {
    "checker_registered_data.csv": table(
      views.registered,
      ["module", "category", "categoryDescription"]
    ),
    "rich_data.csv": table(richRows, richCols),
    "breached_data.csv": table(
      views.breached.map((b) => ({ ...b, dataClasses: b.dataClasses.join(" | ") })),
      [
        "module",
        "title",
        "website",
        "breachDate",
        "breachCount",
        "dataClasses",
        "description",
        "logo",
        "addedDate",
        "modifiedDate"
      ]
    ),
    "timeline_events.csv": table(
      views.timeline,
      ["module", "group", "start", "content"]
    ),
    "geo_data.csv": table(views.geo, ["module", "latitude", "longitude", "label"]),
    "reviews_data.csv": table(
      views.reviews.map((r) => ({ ...r, tags: r.tags?.join(" | "), types: r.types?.join(" | ") })),
      ["module", "place", "address", "rating", "date", "body", "tags", "types"]
    )
  };
}
export {
  extractViews,
  viewsToCsv
};
