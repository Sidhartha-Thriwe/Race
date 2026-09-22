/**
 * Turn a raw vendor payload into the five views the OSINT Industries dashboard
 * export produces: registered, rich, breached, timeline, geo.
 *
 * This replaces the old summarise(), which pulled three fields per module —
 * name, vendor, registered — and discarded everything else. The payload was
 * always stored in full; nothing surfaced it, so the app looked like it had
 * captured a list of platform names when it had captured creation dates, last
 * seen dates, usernames, follower counts, paid-tier flags, twelve breaches and
 * a chronology.
 *
 * Still not the RACE intake record. No tiering, no confidence bands, no
 * dormancy detection, no guards — those live in the skill. This is faithful
 * re-shaping of what the vendor returned, nothing more. Keeping it faithful is
 * the point: the moment this starts inferring, the method is in two places.
 *
 * SPECIAL-CATEGORY DATA: some modules return gender, age, date of birth and
 * similar. Those are stored as the vendor sent them, per the standing decision
 * to keep everything until Legal reviews — but every such field is listed in
 * SPECIAL_CATEGORY below and tagged in the output, so dropping them later is
 * one filter rather than an archaeology exercise.
 */

export interface RegisteredRow {
  module: string; category?: string; categoryDescription?: string;
}
export interface RichRow {
  module: string;
  fields: Record<string, string | number | boolean>;
  specialCategoryFields: string[];
}
export interface BreachRow {
  module: string; title?: string; website?: string; breachDate?: string;
  breachCount?: number; dataClasses: string[]; logo?: string; description?: string;
  addedDate?: string; modifiedDate?: string;
}
export interface TimelineRow {
  module: string; group: string; start: string; content: string;
}
export interface GeoRow { module: string; latitude: number; longitude: number; label?: string }

export interface ExtractedViews {
  registered: RegisteredRow[];
  rich: RichRow[];
  breached: BreachRow[];
  timeline: TimelineRow[];
  geo: GeoRow[];
  counts: {
    modules: number; registered: number; rich: number;
    breached: number; timelineEvents: number; geo: number;
  };
}

/**
 * Fields that carry special-category data under GDPR/DPDP. Tagged, not dropped.
 * Flip RACE_DROP_SPECIAL_CATEGORY=true to omit them from the extracted views —
 * the raw payload is a separate decision.
 */
const SPECIAL_CATEGORY = new Set([
  "gender", "age", "birthday", "date_of_birth", "dob", "ethnicity",
  "sexual_orientation", "relationship_status", "religion", "children",
  "location_of_birth", "marital_status", "health",
]);

const DROP_SPECIAL = () => process.env.RACE_DROP_SPECIAL_CATEGORY === "true";

/** Fields that describe the breach record rather than the person's account. */
const BREACH_FIELDS = new Set([
  "breach", "breach_date", "breach_count", "data_classes", "logo",
  "added_date", "modified_date", "title", "description", "website", "bio",
  "picture_url", "name", "creation_date", "timeline_data",
]);

const isEmpty = (v: unknown) =>
  v === null || v === undefined || v === "" ||
  (Array.isArray(v) && v.length === 0);

/**
 * Flatten one module's normalised layer into a plain key/value map.
 *
 * OSINT Industries wraps every field as {proper_key, type, value} and puts
 * module-specific extras in platform_variables[] as {key, proper_key, value}.
 * Both collapse to the same flat shape, which is what the CSV export shows and
 * what anything downstream wants.
 */
function flattenSpec(spec: any): Record<string, any> {
  const out: Record<string, any> = {};
  if (!spec || typeof spec !== "object") return out;

  for (const [key, field] of Object.entries<any>(spec)) {
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

/** Pull chronological events out of a module's timeline_data. */
function timelineFor(moduleName: string, flat: Record<string, any>, spec: any): TimelineRow[] {
  const rows: TimelineRow[] = [];
  const td = spec?.timeline_data ?? flat.timeline_data;
  const parsed = typeof td === "string" ? safeJson(td) : td;

  for (const [group, items] of Object.entries<any>(parsed?.group_items ?? {})) {
    for (const item of items ?? []) {
      if (!item?.start) continue;
      rows.push({
        module: moduleName,
        group: String(item.group_name ?? group),
        start: String(item.start),
        content: String(item.content ?? ""),
      });
    }
  }

  // last_seen and creation_date are events too, and are often the only ones a
  // module gives. The export lists them alongside the grouped items.
  if (flat.last_seen_date || (flat.last_seen && typeof flat.last_seen === "string")) {
    rows.push({ module: moduleName, group: "last_seen",
                start: String(flat.last_seen_date ?? flat.last_seen), content: "Last seen" });
  }
  if (flat.creation_date && !flat.breach) {
    rows.push({ module: moduleName, group: "created",
                start: String(flat.creation_date), content: "Registered" });
  }
  return rows;
}

function safeJson(s: string): any {
  try { return JSON.parse(s); } catch { return null; }
}

function geoFor(moduleName: string, flat: Record<string, any>): GeoRow[] {
  const rows: GeoRow[] = [];
  const lat = flat.latitude ?? flat.lat;
  const lng = flat.longitude ?? flat.lng ?? flat.lon;
  if (typeof lat === "number" && typeof lng === "number") {
    rows.push({ module: moduleName, latitude: lat, longitude: lng,
                label: flat.location ? String(flat.location) : undefined });
  }
  return rows;
}

export function extractViews(raw: Record<string, any>): ExtractedViews {
  const registered: RegisteredRow[] = [];
  const rich: RichRow[] = [];
  const breached: BreachRow[] = [];
  const timeline: TimelineRow[] = [];
  const geo: GeoRow[] = [];

  const modules: any[] = Array.isArray(raw?.osint_industries) ? raw.osint_industries : [];

  for (const mod of modules) {
    const name = String(mod?.module ?? mod?.name ?? "").trim();
    if (!name) continue;

    // EVERY spec_format entry, not just the first.
    //
    // Reading only spec_format[0] is the mistake that made twelve breaches look
    // like one. OSINT Industries returns all HIBP hits as a SINGLE module whose
    // spec_format is an array with one entry per breach — MySpace, Canva,
    // Zynga and the rest are indexes 0..11 of one module, not twelve modules.
    // The same shape can appear for any module that has more than one record to
    // report, so this is a general fix, not a breach-specific one.
    const specs: any[] = Array.isArray(mod?.spec_format) && mod.spec_format.length
      ? mod.spec_format
      : [mod?.spec_format ?? {}];

    for (const spec of specs) {
      handleSpec(name, mod, spec);
    }
  }

  function handleSpec(name: string, mod: any, spec: any) {
    const flat = flattenSpec(spec);

    // ---- breach records -------------------------------------------------
    // A breached entry is the HIBP layer wearing a module name. It describes an
    // incident, not an account the person holds, so it must not land in `rich`
    // or it reads as "they have a MySpace account" when they have a MySpace
    // breach. The old code looked for data.breach_name, which this shape does
    // not have — so twelve breaches showed as none.
    if (flat.breach === true) {
      breached.push({
        module: name,
        title: str(flat.title ?? flat.name),
        website: str(flat.website),
        breachDate: str(flat.breach_date ?? flat.creation_date),
        breachCount: typeof flat.breach_count === "number" ? flat.breach_count : undefined,
        dataClasses: splitClasses(flat.data_classes),
        logo: str(flat.logo ?? flat.picture_url),
        description: str(flat.description ?? flat.bio),
        addedDate: str(flat.added_date),
        modifiedDate: str(flat.modified_date),
      });
      timeline.push(...timelineFor(name, flat, spec));
      return;
    }

    // ---- everything else ------------------------------------------------
    const fields: Record<string, string | number | boolean> = {};
    const special: string[] = [];

    for (const [key, value] of Object.entries(flat)) {
      if (BREACH_FIELDS.has(key) && key !== "creation_date" && key !== "picture_url"
          && key !== "name" && key !== "website") continue;
      if (key === "timeline_data" || key === "registered") continue;

      if (SPECIAL_CATEGORY.has(key.toLowerCase())) {
        special.push(key);
        if (DROP_SPECIAL()) continue;
      }
      if (typeof value === "object") continue; // keep rows flat and printable
      fields[key] = value as any;
    }

    const category = mod?.category ?? {};
    const hasDetail = Object.keys(fields).length > 0;

    if (hasDetail) {
      rich.push({ module: name, fields, specialCategoryFields: special });
    } else {
      // Registered-but-bare: the account-existence tier. Real information —
      // it says the address is in use there — just not rich capture.
      registered.push({
        module: name,
        category: str(category.name ?? mod?.category_name),
        categoryDescription: str(category.description ?? mod?.category_description),
      });
    }

    timeline.push(...timelineFor(name, flat, spec));
    geo.push(...geoFor(name, flat));
  }

  // A module can emit several bare spec entries; it is still one account.
  const seenRegistered = new Set<string>();
  const dedupedRegistered = registered.filter((r) => {
    const k = r.module.toLowerCase();
    if (seenRegistered.has(k)) return false;
    seenRegistered.add(k);
    return true;
  });
  registered.length = 0;
  registered.push(...dedupedRegistered);

  timeline.sort((a, b) => (a.start < b.start ? 1 : -1)); // newest first

  return {
    registered, rich, breached, timeline, geo,
    counts: {
      modules: modules.length,
      registered: registered.length,
      rich: rich.length,
      breached: breached.length,
      timelineEvents: timeline.length,
      geo: geo.length,
    },
  };
}

const str = (v: unknown) => (isEmpty(v) ? undefined : String(v));

function splitClasses(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string") return v.split("|").map((s) => s.trim()).filter(Boolean);
  return [];
}

/** CSV, one file per view — the same five the vendor's own export produces. */
export function viewsToCsv(views: ExtractedViews): Record<string, string> {
  const esc = (v: unknown) =>
    `"${String(v ?? "").replace(/"/g, '""')}"`;
  const table = (rows: Record<string, any>[], cols: string[]) =>
    [cols.map(esc).join(","),
     ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");

  // The rich view is ragged — every module returns a different field set — so
  // the header is the union of every key seen, which is how the vendor's own
  // export handles it.
  const richCols = ["module", ...[...new Set(views.rich.flatMap((r) => Object.keys(r.fields)))]];
  const richRows = views.rich.map((r) => ({ module: r.module, ...r.fields }));

  return {
    "checker_registered_data.csv": table(views.registered as any,
      ["module", "category", "categoryDescription"]),
    "rich_data.csv": table(richRows, richCols),
    "breached_data.csv": table(views.breached.map((b) => ({ ...b, dataClasses: b.dataClasses.join(" | ") })) as any,
      ["module", "title", "website", "breachDate", "breachCount", "dataClasses",
       "description", "logo", "addedDate", "modifiedDate"]),
    "timeline_events.csv": table(views.timeline as any,
      ["module", "group", "start", "content"]),
    "geo_data.csv": table(views.geo as any, ["module", "latitude", "longitude", "label"]),
  };
}
