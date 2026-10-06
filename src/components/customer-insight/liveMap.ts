import type { CustomerInsightRunData } from './types';
import type { Run } from '../RaceLiveRun';
import type { Plan } from '../RaceTargets';
import type { Scrape } from '../RaceScrape';
import type { Persona } from '../RacePersona';
import type { Categories } from '../RaceCategories';

/**
 * Adapters from what the server actually stored to what the step screens draw.
 *
 * Every number on screen comes from a payload field, never from a count the
 * server reported about itself and never from a status flag. Where the payload
 * has nothing to say, the field is left empty or zero — an empty cell is a true
 * statement, a sample value is not.
 */

type Patch = Partial<CustomerInsightRunData>;

/** Vendors are shown as Source 1 / Source 2 on screen. */
const SOURCE_NAME: Record<string, string> = {
  osint: 'Source 1', osint_industries: 'Source 1',
  bte: 'Source 2', behind_the_email: 'Source 2', behindtheemail: 'Source 2',
};
const vendorLabel = (v: string) => SOURCE_NAME[v.toLowerCase().replace(/[\s-]+/g, '_')] ?? v;
const scrubVendorNames = (t: string) =>
  t.replace(/\bosint_industries\b|\bosint\b/gi, 'Source 1')
   .replace(/\bbehind_the_email\b|\bbte\b/gi, 'Source 2');

const initials = (s: string) =>
  s.replace(/[^A-Za-z0-9 ]/g, '').split(/\s+/).filter(Boolean).slice(0, 2)
    .map((w) => w[0]!.toUpperCase()).join('') || '··';

const ACRONYMS: Record<string, string> = { hibp: 'HIBP', linkedin: 'LinkedIn', github: 'GitHub' };
const cap = (s: string) =>
  ACRONYMS[s.toLowerCase()] ?? (s ? s[0]!.toUpperCase() + s.slice(1) : s);

const sourceLabel = (r: any): string => {
  const src: string[] = Array.isArray(r.sources) ? r.sources : r.source ? [r.source] : [];
  if (src.length > 1) return 'Both';
  return src.length === 1 ? vendorLabel(src[0]!) : '—';
};

/** Step 1 → step 2 screen. */
export function mapRun(run: Run, email: string): Patch {
  const v = run.views;
  const both = new Set((v?.corroborated ?? []).map((x) => x.toLowerCase()));
  const verified = (m: string) => both.has(m.toLowerCase());
  const by = v?.bySource ?? {};
  const pick = (label: 'Source 1' | 'Source 2') => {
    const e: any = Object.entries(by).find(([n]) => vendorLabel(n) === label)?.[1];
    return { detailed: e?.rich ?? 0, registered: e?.registered ?? 0, breach: e?.breached ?? 0 };
  };

  const rows: CustomerInsightRunData['identityRows'] = [];
  for (const r of v?.rich ?? []) {
    const signals = Object.entries(r.fields ?? {})
      .filter(([, val]) => val !== null && val !== '' && typeof val !== 'object')
      .map(([k]) => k.replace(/_/g, ' ')).slice(0, 4);
    rows.push({ platform: cap(r.module), keySignals: signals, verified: verified(r.module),
                source: sourceLabel(r), category: 'detailed' });
  }
  for (const r of v?.registered ?? []) {
    rows.push({ platform: cap(r.module), keySignals: r.category ? [r.category] : [],
                verified: verified(r.module), source: sourceLabel(r), category: 'registered' });
  }
  for (const r of v?.breached ?? []) {
    const sig = [r.breachDate ? `Breached ${r.breachDate.slice(0, 10)}` : '',
                 r.breachCount ? `${r.breachCount.toLocaleString()} records` : ''].filter(Boolean);
    rows.push({ platform: r.title || cap(r.module), keySignals: sig, verified: false,
                source: sourceLabel(r), category: 'breach' });
  }
  // A timeline event has no source of its own; it takes the source of the
  // account or breach row for the same module, and says so when there is none.
  const moduleSource = new Map(rows.map((r) => [r.platform.toLowerCase(), r.source]));
  for (const r of v?.timeline ?? []) {
    rows.push({ platform: cap(r.module), keySignals: [r.start?.slice(0, 10), r.content].filter(Boolean).map(String).slice(0, 2),
                verified: verified(r.module),
                source: sourceLabel(r) !== '—' ? sourceLabel(r) : (moduleSource.get(cap(r.module).toLowerCase()) ?? '—'),
                category: 'timeline' });
  }

  return {
    email,
    subjectId: run.subjectId,
    vendorSpendINR: run.costINR ?? 0,
    identityStats: {
      modulesFound: v?.counts.modules ?? 0,
      detailedProfiles: v?.counts.rich ?? 0,
      registeredOnly: v?.counts.registered ?? 0,
      breachRecords: v?.counts.breached ?? 0,
      timelineEvents: v?.counts.timelineEvents ?? 0,
    },
    vendorBreakdown: {
      osint: pick('Source 1'), bte: pick('Source 2'),
      foundByBoth: (v?.corroborated ?? []).map(cap),
    },
    identityRows: rows,
    runLog: (run.steps ?? []).map((s) => ({ time: s.t?.slice(11, 19) ?? '', message: scrubVendorNames(s.msg) })),
  };
}

/** Step 2 plan → step 3 screen. */
export function mapPlan(plan: Plan): Patch {
  const why = new Map<string, number>();
  for (const b of plan.blocked) why.set(b.why, (why.get(b.why) ?? 0) + 1);
  return {
    sourcePlan: {
      identifiersFound: plan.counts.identifiers,
      modulesRouted: plan.counts.ready + plan.counts.blocked + plan.counts.noRoute,
      readyCount: plan.counts.ready,
      blockedCount: plan.counts.blocked,
      noRouteCount: plan.counts.noRoute,
      sources: plan.ready.map((r) => ({
        id: r.platform,
        platform: r.label,
        icon: initials(r.label),
        reader: r.actor,
        status: r.status === 'unproven-contested' ? 'contested' : r.status,
        builtFrom: Array.from(new Set(r.from.map((f) => f.kind))),
        flag: r.note,
        hasViewInput: false,
      })),
      blockedReasons: Array.from(why, ([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count),
    },
  };
}

const fmtMs = (ms: number) => (ms < 1000 ? `${ms}ms` : ms < 60000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms / 60000)}m`);

/** Step 3 scrape → step 4 screen. Status comes from the outcome the server judged from the payload. */
export function mapScrape(s: Scrape): Patch {
  const rep = s.report;
  const dataRows = (platform: string) => {
    const items = (s.data as Record<string, unknown[]>)[platform] ?? [];
    const first = items[0] && typeof items[0] === 'object' ? (items[0] as Record<string, unknown>) : {};
    const keys = Object.keys(first);
    const filled = keys.filter((k) => first[k] !== null && first[k] !== '' && first[k] !== undefined).length;
    return { filled, total: keys.length };
  };

  const profiles = s.attempts.map((a) => {
    const f = dataRows(a.platform);
    const status: 'good' | 'stub' | 'failed' =
      a.outcome === 'succeeded' ? 'good'
      : a.outcome === 'failed' || a.outcome === 'skipped' ? 'failed' : 'stub';
    return {
      platform: a.label, icon: initials(a.label),
      duration: a.durationMs != null ? fmtMs(a.durationMs) : '—',
      costUSD: a.costUSD ?? 0, status,
      fieldsFilled: f.filled, totalFields: f.total,
      note: a.error ? `${a.narrative} ${a.error}`.trim() : a.narrative,
    };
  });

  return {
    fetchSpendUSD: rep.totalCostUSD ?? 0,
    profileFetch: {
      duration: fmtMs(s.attempts.reduce((n, a) => n + (a.durationMs ?? 0), 0)),
      totalSpendUSD: rep.totalCostUSD ?? 0,
      usable: rep.succeeded,
      stubOnly: rep.thin + rep.zeroItem,
      failed: rep.failed + rep.skipped,
      fieldsFilled: profiles.reduce((n, p) => n + p.fieldsFilled, 0),
      totalFields: profiles.reduce((n, p) => n + p.totalFields, 0),
      profiles,
    },
  };
}

const band = (c: string): 'high' | 'medium' | 'low' | 'estimated' | 'insufficient' => {
  const k = c.toLowerCase();
  return k === 'high' || k === 'medium' || k === 'low' || k === 'estimated' ? k : 'insufficient';
};

const TRAIT_NAME: Record<string, string> = {
  achievement: 'Achievement', status: 'Status', security: 'Security', autonomy: 'Autonomy',
  affiliation: 'Affiliation', noveltySeeking: 'Novelty seeking',
  openness: 'Openness', conscientiousness: 'Conscientiousness', extraversion: 'Extraversion',
  agreeableness: 'Agreeableness', emotionalStability: 'Emotional stability',
  digitalEngagement: 'Digital engagement', categoryExploration: 'Category exploration',
  onlineVisibilityComfort: 'Online visibility comfort', experienceOrientation: 'Experience orientation',
  spendTier: 'Spend tier', convenienceOrientation: 'Convenience orientation',
  riskNoveltySeeking: 'Risk / novelty seeking',
};

/** Step 4 persona → step 5 screen. */
export function mapPersona(p: Persona): Patch {
  const t: any = p.computedTraits ?? {};
  const traits: CustomerInsightRunData['persona']['traits'] = [];
  const push = (obj: any, group: string) => {
    for (const [k, v] of Object.entries(obj ?? {})) {
      if (typeof v === 'number') {
        traits.push({ name: TRAIT_NAME[k] ?? k, score: v, narrative: group });
      }
    }
  };
  const motives = Object.fromEntries(Object.entries(t).filter(([, v]) => typeof v === 'number'));
  push(motives, 'Motive');
  push(t.bigFive, 'Big Five');
  push(t.behavioral, 'Behavioural');

  const groups = p.attributeGroups ?? [];
  const all = groups.flatMap((g) => g.attributes);
  const byBand: Record<string, number> = { high: 0, medium: 0, low: 0, estimated: 0, insufficient: 0 };
  for (const a of all) byBand[band(a.confidence)]++;

  return {
    model: p.model,
    persona: {
      attributesCount: all.length,
      traitsCount: traits.length,
      profilesUsed: 0,
      confidence: { high: byBand.high!, medium: byBand.medium!, low: byBand.low!,
                    estimated: byBand.estimated!, insufficient: byBand.insufficient! },
      traits,
      attributeAreas: groups.map((g) => ({
        title: g.group,
        density: `${g.attributes.length} attributes`,
        attributes: g.attributes.map((a) => ({
          label: a.label, value: a.value, confidence: band(a.confidence), basis: a.basis,
        })),
        sources: [],
      })),
      summary: p.personaSummary,
      identityLocation: p.identityLocation,
    },
  };
}

const RULE_LABEL: Record<string, string> = {
  ubiquitous_not_identity: 'Ubiquitous, not identity',
  no_monetisable_headroom: 'No monetisable headroom',
  hygiene_only: 'Hygiene only',
  stale: 'Stale',
  out_of_scope: 'Out of scope',
};

/** Step 5 categories → step 6 screen. */
export function mapCategories(c: Categories): Patch {
  const rows = c.scoringTable ?? [];
  const byId = new Map(rows.map((r) => [r.category.toLowerCase(), r]));
  const rejected = rows.filter((r) => r.outcome === 'deprioritised' || r.rejected);
  const rules = Object.entries(c.audit?.byRejectionRule ?? {}).sort((a, b) => b[1] - a[1]);
  const firstSentence = (c.scoringNote ?? '').split(/(?<=[.!?])\s+/)[0] ?? '';

  return {
    categories: {
      whyRanking: [
        { icon: 'briefcase', title: `${c.audit?.ranked ?? c.topCategories.length} ranked from ${c.audit?.candidates ?? rows.length} candidates`,
          subtitle: firstSentence },
        { icon: 'slash', title: `${rejected.length} set aside`,
          subtitle: rules.map(([r, n]) => `${RULE_LABEL[r] ?? r} ${n}`).join(' · ') || 'None rejected' },
        { icon: 'eye-off', title: c.audit?.dormantFound ? 'Dormant paid affinity found' : 'No dormant paid affinity',
          subtitle: c.audit?.dormantFound ? 'A paid tier opened and left unused was found.'
                                          : 'No paid tier shown anywhere in the evidence.' },
      ],
      scoredCount: rows.length || c.audit?.candidates || 0,
      rankedCount: c.topCategories.length,
      setAsideCount: rejected.length,
      ranked: c.topCategories.map((t) => {
        const row = byId.get(t.category.toLowerCase());
        return {
          rank: t.rank, title: t.category, description: t.rationale,
          tags: [row?.confidence ? `${row.confidence} confidence` : '', row?.motivator ?? '']
            .filter(Boolean),
          evidence: t.evidenceStrength, psychFit: t.psychFit,
        };
      }),
      setAside: rejected.map((r) => ({
        title: r.category,
        reason: [r.rejectionRule ? (RULE_LABEL[r.rejectionRule] ?? r.rejectionRule) : '', r.dispositionNote]
          .filter(Boolean).join(' — '),
      })),
    },
  };
}

/** A blank run: nothing from any earlier subject, nothing invented. */
export const EMPTY_RUN: CustomerInsightRunData = {
  step: 1, sector: 'Automobile', ticketPrice: '₹10–20L', subjectId: '', email: '',
  isStored: false, isLawfulConsent: true,
  vendorSpendINR: 0, monthToDateINR: 0, fetchSpendUSD: 0, model: '',
  identityStats: { modulesFound: 0, detailedProfiles: 0, registeredOnly: 0, breachRecords: 0, timelineEvents: 0 },
  vendorBreakdown: {
    osint: { detailed: 0, registered: 0, breach: 0 },
    bte: { detailed: 0, registered: 0, breach: 0 },
    foundByBoth: [],
  },
  identityRows: [], runLog: [],
  sourcePlan: { identifiersFound: 0, modulesRouted: 0, readyCount: 0, blockedCount: 0, noRouteCount: 0,
                sources: [], blockedReasons: [] },
  profileFetch: { duration: '—', totalSpendUSD: 0, usable: 0, stubOnly: 0, failed: 0,
                  fieldsFilled: 0, totalFields: 0, profiles: [] },
  persona: { attributesCount: 0, traitsCount: 0, profilesUsed: 0,
             confidence: { high: 0, medium: 0, low: 0 }, traits: [], attributeAreas: [] },
  categories: { whyRanking: [], scoredCount: 0, rankedCount: 0, setAsideCount: 0, ranked: [], setAside: [] },
};
