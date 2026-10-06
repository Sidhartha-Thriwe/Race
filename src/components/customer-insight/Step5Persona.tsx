import React, { useMemo, useState } from 'react';
import { CustomerInsightRunData } from './types';
import { Download } from 'lucide-react';

interface Step5PersonaProps {
  data: CustomerInsightRunData;
  onBack: () => void;
  onNext: () => void;
  busy?: boolean;
}

type Trait = CustomerInsightRunData['persona']['traits'][number];
type Conf = 'high' | 'medium' | 'low' | 'estimated' | 'insufficient';

const CONF: Record<Conf, { label: string; dot: string; text: string }> = {
  high: { label: 'High', dot: 'bg-[#1e293b]', text: 'text-neutral-800' },
  medium: { label: 'Medium', dot: 'bg-[#64748b]', text: 'text-neutral-600' },
  low: { label: 'Low', dot: 'bg-[#d97706]', text: 'text-amber-700' },
  estimated: { label: 'Estimated', dot: 'bg-violet-400', text: 'text-violet-700' },
  insufficient: { label: 'Insufficient', dot: 'bg-neutral-300', text: 'text-neutral-400' },
};

const TRAIT_GROUPS: { key: string; title: string; hint: string }[] = [
  { key: 'Motive', title: 'Motives', hint: 'What drives choices' },
  { key: 'Big Five', title: 'Big Five', hint: 'Personality dimensions' },
  { key: 'Behavioural', title: 'Behavioural', hint: 'How they act online' },
];

const level = (score: number) => (score >= 7 ? 'High' : score >= 4 ? 'Moderate' : 'Low');

/** Wrap an axis label onto at most two lines. */
const wrapLabel = (s: string, max = 13): string[] => {
  if (s.length <= max) return [s];
  const words = s.split(' ');
  const lines: string[] = [''];
  for (const w of words) {
    const cur = lines[lines.length - 1]!;
    if ((cur + ' ' + w).trim().length > max && cur) lines.push(w);
    else lines[lines.length - 1] = (cur + ' ' + w).trim();
  }
  return lines.slice(0, 2);
};

const Radar: React.FC<{ axes: { name: string; score: number }[] }> = ({ axes }) => {
  const W = 340, H = 290, cx = W / 2, cy = 142, R = 80;
  const n = Math.max(axes.length, 3);
  const pt = (i: number, v: number, extra = 0) => {
    const a = (Math.PI * 2 / n) * i - Math.PI / 2;
    const r = (v / 10) * R + extra;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), cos: Math.cos(a) };
  };
  const ring = (v: number) => axes.map((_, i) => `${pt(i, v).x},${pt(i, v).y}`).join(' ');
  const shape = axes.map((a, i) => `${pt(i, a.score).x},${pt(i, a.score).y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {[2.5, 5, 7.5, 10].map((v) => (
        <polygon key={v} points={ring(v)} fill="none" stroke="#e5e7eb" strokeWidth="1" />
      ))}
      {axes.map((_, i) => {
        const p = pt(i, 10);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#eef0f3" strokeWidth="1" />;
      })}
      <polygon points={shape} fill="rgba(30,41,59,0.10)" stroke="#1e293b" strokeWidth="1.6" strokeLinejoin="round" />
      {axes.map((a, i) => {
        const p = pt(i, a.score);
        return <circle key={i} cx={p.x} cy={p.y} r="3" fill="#1e293b" />;
      })}
      {axes.map((a, i) => {
        const p = pt(i, 10, 16);
        const anchor = p.cos > 0.25 ? 'start' : p.cos < -0.25 ? 'end' : 'middle';
        const lines = wrapLabel(a.name);
        return (
          <text key={i} x={p.x} y={p.y - (lines.length - 1) * 6} textAnchor={anchor}
                className="fill-neutral-600 font-sans" style={{ fontSize: 10.5, fontWeight: 600 }}>
            {lines.map((l, j) => (
              <tspan key={j} x={p.x} dy={j === 0 ? 0 : 12}>{l}</tspan>
            ))}
            <tspan x={p.x} dy={12} className="fill-neutral-400 font-mono" style={{ fontSize: 10, fontWeight: 500 }}>
              {a.score}
            </tspan>
          </text>
        );
      })}
    </svg>
  );
};

export const Step5Persona: React.FC<Step5PersonaProps> = ({ data, onBack, onNext, busy = false }) => {
  const [viewTab, setViewTab] = useState<'overview' | 'attributes' | 'traits'>('overview');
  const { persona } = data;

  // Profiles the persona could draw on: platforms with a detailed capture or a
  // usable enrichment, each counted once.
  const profilesUsed = useMemo(() => {
    const names = new Set<string>();
    for (const r of data.identityRows) if (r.category === 'detailed') names.add(r.platform.toLowerCase());
    for (const p of data.profileFetch.profiles) if (p.status === 'good') names.add(p.platform.toLowerCase());
    return names.size;
  }, [data.identityRows, data.profileFetch.profiles]);

  const lowMerged = persona.confidence.low + (persona.confidence.insufficient ?? 0);
  const est = persona.confidence.estimated ?? 0;
  const total = Math.max(1, persona.attributesCount);
  const pct = (n: number) => `${(n / total) * 100}%`;

  const groups = TRAIT_GROUPS.map((g) => ({
    ...g, traits: persona.traits.filter((t) => t.narrative === g.key),
  })).filter((g) => g.traits.length > 0);

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(persona, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `race_persona_${data.subjectId.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabBtn = (key: typeof viewTab, label: string) => (
    <button
      type="button"
      onClick={() => setViewTab(key)}
      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
        viewTab === key ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-800'
      }`}
    >
      {label}
    </button>
  );

  const TraitRow: React.FC<{ t: Trait }> = ({ t }) => (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-semibold text-neutral-900">{t.name}</span>
        <span className="flex items-baseline gap-2 shrink-0">
          <span className="text-[11px] text-neutral-400 font-medium">{level(t.score)}</span>
          <span className="font-mono text-sm font-bold text-neutral-900 tabular-nums w-5 text-right">{t.score}</span>
        </span>
      </div>
      <div className="relative h-1.5 bg-neutral-100 rounded-full">
        <div style={{ width: `${(t.score / 10) * 100}%` }} className="absolute inset-y-0 left-0 bg-[#1e293b] rounded-full" />
        {[2.5, 5, 7.5].map((m) => (
          <span key={m} style={{ left: `${m * 10}%` }} className="absolute top-0 bottom-0 w-px bg-white/90" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 font-semibold mb-1">
            STEP 5 OF 6
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Persona Building</h2>
          <p className="text-xs text-neutral-500 font-medium mt-1">
            Attributes found in the data, and the traits computed from them.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-neutral-100/90 rounded-xl border border-neutral-200/60 self-start sm:self-center">
          {tabBtn('overview', 'Overview')}
          {tabBtn('attributes', `Attributes ${persona.attributesCount}`)}
          {tabBtn('traits', `Traits ${persona.traitsCount}`)}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
          <div className="text-3xl font-bold tracking-tight text-neutral-900 tabular-nums">{persona.attributesCount}</div>
          <div className="text-xs font-medium text-neutral-500 mt-1">Attributes</div>
        </div>
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
          <div className="text-3xl font-bold tracking-tight text-neutral-900 tabular-nums">{persona.traitsCount}</div>
          <div className="text-xs font-medium text-neutral-500 mt-1">Computed traits</div>
        </div>
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
          <div className="text-3xl font-bold tracking-tight text-neutral-900 tabular-nums">{profilesUsed}</div>
          <div className="text-xs font-medium text-neutral-500 mt-1">Profiles used</div>
        </div>
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs space-y-2.5">
          <div className="text-xs font-semibold text-neutral-700">Confidence mix</div>
          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden flex">
            <div style={{ width: pct(persona.confidence.high) }} className="bg-[#1e293b]" />
            <div style={{ width: pct(persona.confidence.medium) }} className="bg-[#64748b]" />
            <div style={{ width: pct(lowMerged) }} className="bg-[#d97706]" />
            <div style={{ width: pct(est) }} className="bg-violet-400" />
          </div>
          <div className="grid grid-cols-4 gap-1 text-[10.5px] text-neutral-500 font-medium">
            <span>High <b className="text-neutral-800 tabular-nums">{persona.confidence.high}</b></span>
            <span>Medium <b className="text-neutral-800 tabular-nums">{persona.confidence.medium}</b></span>
            <span>Low <b className="text-neutral-800 tabular-nums">{lowMerged}</b></span>
            <span>Est. <b className="text-neutral-800 tabular-nums">{est}</b></span>
          </div>
        </div>
      </div>

      {/* ───────────── Overview: three trait profiles ───────────── */}
      {viewTab === 'overview' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-neutral-900">Trait profile</h3>
            <span className="text-neutral-400 font-mono text-[11px]">0 to 10</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {groups.map((g) => (
              <div key={g.key} className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
                <div className="text-sm font-bold text-neutral-900">{g.title}</div>
                <div className="text-[11px] text-neutral-400 font-medium">{g.hint}</div>
                <div className="pt-2">
                  <Radar axes={g.traits.map((t) => ({ name: t.name, score: t.score }))} />
                </div>
              </div>
            ))}
          </div>
          {persona.summary && (
            <p className="text-xs text-neutral-500 leading-relaxed px-1 pt-1">{persona.summary}</p>
          )}
        </div>
      )}

      {/* ───────────── Traits: computed traits only ───────────── */}
      {viewTab === 'traits' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-neutral-900">Computed traits</h3>
            <span className="text-neutral-400 font-mono text-[11px]">0 to 10</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            {groups.map((g) => (
              <div key={g.key} className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
                <div className="flex items-baseline justify-between pb-3 mb-4 border-b border-neutral-100">
                  <div>
                    <div className="text-sm font-bold text-neutral-900">{g.title}</div>
                    <div className="text-[11px] text-neutral-400 font-medium">{g.hint}</div>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400">{g.traits.length}</span>
                </div>
                <div className="space-y-4">
                  {g.traits.map((t) => <TraitRow key={t.name} t={t} />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───────────── Attributes by area ───────────── */}
      {viewTab === 'attributes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <h3 className="text-sm font-bold text-neutral-900">Attributes by area</h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium text-neutral-600">
              {(Object.keys(CONF) as Conf[]).map((c) => (
                <span key={c} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${CONF[c].dot}`} />
                  <span>{CONF[c].label}</span>
                </span>
              ))}
            </div>
          </div>

          {persona.attributeAreas.map((area, idx) => (
            <div key={idx} className="bg-white border border-neutral-200/80 rounded-2xl shadow-xs overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 bg-neutral-50/70 border-b border-neutral-100">
                <span className="text-sm font-bold text-neutral-900">{area.title}</span>
                <span className="text-[11px] font-semibold text-neutral-500">{area.density}</span>
              </div>

              <div className="grid grid-cols-[minmax(130px,28%)_minmax(0,1fr)_auto] gap-x-5 px-5 py-2 text-[10.5px] font-semibold uppercase tracking-wider text-neutral-400 border-b border-neutral-100">
                <span>Attribute</span>
                <span>Value</span>
                <span className="w-24">Confidence</span>
              </div>

              <div className="divide-y divide-neutral-100">
                {area.attributes.map((attr, aIdx) => {
                  const c = CONF[attr.confidence];
                  const unobserved = attr.confidence === 'insufficient';
                  return (
                    <div
                      key={aIdx}
                      title={attr.basis}
                      className="grid grid-cols-[minmax(130px,28%)_minmax(0,1fr)_auto] gap-x-5 items-start px-5 py-2.5 text-xs hover:bg-neutral-50/60 transition-colors"
                    >
                      <span className="text-neutral-500 font-medium leading-snug">{attr.label}</span>
                      <span className={`leading-snug break-words ${unobserved ? 'text-neutral-400 font-medium' : 'text-neutral-900 font-semibold'}`}>
                        {attr.value}
                      </span>
                      <span className={`w-24 flex items-center gap-1.5 text-[11px] font-semibold ${c.text}`}>
                        <span className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
                        {c.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <p className="text-xs text-neutral-500 font-medium px-1">
            Showing {persona.attributeAreas.reduce((n, a) => n + a.attributes.length, 0)} of {persona.attributesCount} attributes. Sparse means unobserved, not absent. Hover a row for its basis.
          </p>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="pt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={handleDownloadJson}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer"
        >
          <Download size={13} />
          <span>Download JSON</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={busy}
            className="px-6 py-2.5 text-xs font-semibold text-white bg-[#1e293b] hover:bg-[#0f172a] rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Run Preferred Areas
          </button>
        </div>
      </div>
    </div>
  );
};
