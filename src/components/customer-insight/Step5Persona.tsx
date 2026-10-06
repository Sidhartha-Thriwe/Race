import React, { useState } from 'react';
import { CustomerInsightRunData } from './types';
import { Download, AlertCircle } from 'lucide-react';

interface Step5PersonaProps {
  data: CustomerInsightRunData;
  onBack: () => void;
  onNext: () => void;
  busy?: boolean;
}

export const Step5Persona: React.FC<Step5PersonaProps> = ({
  data,
  onBack,
  onNext,
  busy = false,
}) => {
  const [viewTab, setViewTab] = useState<'overview' | 'attributes' | 'traits'>('overview');
  const { persona } = data;

  const handleDownloadJson = () => {
    const payload = JSON.stringify(persona, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `race_persona_${data.subjectId.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for Radar/Spider Chart SVG coordinates
  // 6 axes: 0: Achievement (top), 1: Self-direction, 2: Learning, 3: Affiliation, 4: Status, 5: Thrift
  const radarAxes = [
    { name: 'Achievement', score: 9 },
    { name: 'Self-direction', score: 8 },
    { name: 'Learning', score: 8 },
    { name: 'Affiliation', score: 5 },
    { name: 'Status', score: 3 },
    { name: 'Thrift', score: 7 },
  ];

  const size = 260;
  const center = size / 2;
  const radius = 90;

  const getCoordinates = (index: number, value: number, total: number = 6) => {
    // Angle in radians, starting at top (-Math.PI / 2)
    const angle = (Math.PI * 2 / total) * index - Math.PI / 2;
    const r = (value / 10) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  const polygonPoints = radarAxes
    .map((axis, i) => {
      const { x, y } = getCoordinates(i, axis.score);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 font-semibold mb-1">
            STEP 5 OF 6
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
            Persona
          </h2>
          <p className="text-xs text-neutral-500 font-medium mt-1">
            Attributes found in the data, and the traits computed from them.
          </p>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100/90 rounded-xl border border-neutral-200/60 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setViewTab('overview')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewTab === 'overview'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setViewTab('attributes')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewTab === 'attributes'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Attributes {persona.attributesCount}
          </button>
          <button
            type="button"
            onClick={() => setViewTab('traits')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewTab === 'traits'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Traits {persona.traitsCount}
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
          <div className="text-3xl font-bold tracking-tight text-neutral-900 tabular-nums">
            {persona.attributesCount}
          </div>
          <div className="text-xs font-medium text-neutral-500 mt-1">
            Attributes
          </div>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
          <div className="text-3xl font-bold tracking-tight text-neutral-900 tabular-nums">
            {persona.traitsCount}
          </div>
          <div className="text-xs font-medium text-neutral-500 mt-1">
            Computed traits
          </div>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
          <div className="text-3xl font-bold tracking-tight text-neutral-900 tabular-nums">
            {persona.profilesUsed}
          </div>
          <div className="text-xs font-medium text-neutral-500 mt-1">
            Profiles used
          </div>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="text-xs font-semibold text-neutral-700">
            Confidence mix
          </div>
          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${(persona.confidence.high / 38) * 100}%` }}
              className="bg-[#1e293b]"
            />
            <div
              style={{ width: `${(persona.confidence.medium / 38) * 100}%` }}
              className="bg-[#64748b]"
            />
            <div
              style={{ width: `${(persona.confidence.low / 38) * 100}%` }}
              className="bg-[#d97706]"
            />
          </div>
          <div className="flex items-center justify-between text-[10.5px] text-neutral-500 font-medium">
            <span>High {persona.confidence.high}</span>
            <span>Medium {persona.confidence.medium}</span>
            <span>Low {persona.confidence.low}</span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Spider Chart + Computed Traits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Radar / Spider Chart */}
        <div className="lg:col-span-5 bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-neutral-900">Trait profile</span>
            <span className="text-neutral-400 font-mono text-[11px]">0 to 10</span>
          </div>

          {/* SVG Spider Chart */}
          <div className="py-4 flex items-center justify-center">
            <svg width={size} height={size} className="overflow-visible">
              {/* Concentric Polygons */}
              {[2, 4, 6, 8, 10].map((step) => {
                const ringPoints = radarAxes
                  .map((_, i) => {
                    const { x, y } = getCoordinates(i, step);
                    return `${x},${y}`;
                  })
                  .join(' ');
                return (
                  <polygon
                    key={step}
                    points={ringPoints}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Axis lines */}
              {radarAxes.map((_, i) => {
                const { x, y } = getCoordinates(i, 10);
                return (
                  <line
                    key={i}
                    x1={center}
                    y1={center}
                    x2={x}
                    y2={y}
                    stroke="#cbd5e1"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                );
              })}

              {/* Filled Polygon for Scores */}
              <polygon
                points={polygonPoints}
                fill="rgba(30, 41, 59, 0.12)"
                stroke="#1e293b"
                strokeWidth="2"
              />

              {/* Data points */}
              {radarAxes.map((axis, i) => {
                const { x, y } = getCoordinates(i, axis.score);
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="3.5"
                    fill="#1e293b"
                    className="transition-all"
                  />
                );
              })}

              {/* Axis Labels */}
              {radarAxes.map((axis, i) => {
                // Extend slightly past the outer ring for clean label positioning
                const labelCoord = getCoordinates(i, 12.2);
                let textAnchor = 'middle';
                if (i === 1 || i === 2) textAnchor = 'start';
                if (i === 4 || i === 5) textAnchor = 'end';

                return (
                  <text
                    key={i}
                    x={labelCoord.x}
                    y={labelCoord.y}
                    textAnchor={textAnchor}
                    alignmentBaseline="middle"
                    className="text-[11px] font-semibold fill-neutral-700 font-sans"
                  >
                    {axis.name}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right: Computed Traits Breakdown */}
        <div className="lg:col-span-7 bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-3">
            Computed traits
          </h3>

          <div className="space-y-4">
            {persona.traits.map((trait, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-neutral-900">{trait.name}</span>
                  <span className="font-mono font-bold text-neutral-900 tabular-nums">
                    {trait.score}
                  </span>
                </div>

                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${(trait.score / 10) * 100}%` }}
                    className={`h-full rounded-full ${
                      trait.warning ? 'bg-[#d97706]' : 'bg-[#1e293b]'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-500 font-medium">{trait.narrative}</span>
                  {trait.warning && (
                    <span className="flex items-center gap-1 text-amber-700 font-semibold">
                      <AlertCircle size={11} />
                      <span>Low evidence, not low trait</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Attributes by Area */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <h3 className="text-sm font-bold text-neutral-900">
            Attributes by area
          </h3>
          <div className="flex items-center gap-4 text-xs font-medium text-neutral-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1e293b]" />
              <span>High confidence</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#64748b]" />
              <span>Medium</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#d97706]" />
              <span>Low</span>
            </span>
          </div>
        </div>

        {/* 5 Area Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {persona.attributeAreas.slice(0, 3).map((area, idx) => (
            <div
              key={idx}
              className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-neutral-900">{area.title}</span>
                  <span className="px-2 py-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200/60">
                    {area.density}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {area.attributes.map((attr, aIdx) => (
                    <div key={aIdx} className="flex items-center justify-between">
                      <span className="text-neutral-500 font-medium">{attr.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-900">{attr.value}</span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            attr.confidence === 'high'
                              ? 'bg-[#1e293b]'
                              : attr.confidence === 'medium'
                              ? 'bg-[#64748b]'
                              : 'bg-[#d97706]'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex flex-wrap gap-1.5">
                {area.sources.map((src, sIdx) => (
                  <span
                    key={sIdx}
                    className="px-2 py-0.5 bg-neutral-100 border border-neutral-200/70 rounded-md text-[10.5px] text-neutral-700 font-medium"
                  >
                    {src}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Row 2: 2 Area Cards (Leisure and Spend Signal) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {persona.attributeAreas.slice(3, 5).map((area, idx) => (
            <div
              key={idx}
              className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-neutral-900">{area.title}</span>
                  <span
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${
                      idx === 0
                        ? 'text-amber-700 bg-amber-50 border-amber-200/60'
                        : 'text-neutral-700 bg-neutral-100 border-neutral-200/60'
                    }`}
                  >
                    {area.density}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {area.attributes.map((attr, aIdx) => (
                    <div key={aIdx} className="flex items-center justify-between">
                      <span className="text-neutral-500 font-medium">{attr.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-900">{attr.value}</span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            attr.confidence === 'high'
                              ? 'bg-[#1e293b]'
                              : attr.confidence === 'medium'
                              ? 'bg-[#64748b]'
                              : 'bg-[#d97706]'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex flex-wrap gap-1.5">
                {area.sources.map((src, sIdx) => (
                  <span
                    key={sIdx}
                    className="px-2 py-0.5 bg-neutral-100 border border-neutral-200/70 rounded-md text-[10.5px] text-neutral-700 font-medium"
                  >
                    {src}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-neutral-500 font-medium px-1">
          Showing 16 of {persona.attributesCount} attributes. Sparse means unobserved, not absent.
        </p>
      </div>

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
            Find relevant categories
          </button>
        </div>
      </div>
    </div>
  );
};
