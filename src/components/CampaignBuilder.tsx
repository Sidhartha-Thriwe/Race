import React, { useState, useMemo, useEffect } from 'react';
import {
  WizardHeader,
  WizardCard,
  CollapsibleCard,
  WizardFooter,
  TopEmailsStep,
  ReviewConsentStep,
  buildConsent,
  emailsComplete,
  cleanEmails,
  hasInvalidEmails,
  FieldLabel,
  inputCls,
  Chip,
} from './campaign-builder/wizard';
import type { CampaignConsent, SummarySection } from './campaign-builder/wizard';

export interface Campaign {
  id: string;
  name: string;
  industry: string;
  businessLine?: string;
  categories: string[];
  confidence: 'High' | 'Medium' | 'Both';
  personas: string[];
  geographies: string[];
  excludeDelivered: boolean;
  excludeExisting: boolean;
  budgetPerDay: number;
  totalBudgetCap: number | '';
  startDate: string;
  endDate: string;
  duration?: number;
  notes: string;
  status: 'Active' | 'Scheduled' | 'Draft' | 'Paused' | 'Completed';
  createdAt: string;
  metrics: {
    estLeadsPerDay: number;
    estTotalLeads: number;
    estTotalSpend: number;
    estCAC?: number;
  };
  currentSpend?: number;
  leadsAcquired?: number;
  owner?: string;
  targetCAC?: number;
  // Legacy backward-compatibility fields
  productSector?: string;
  ticketSizeMin?: number;
  ticketSizeMax?: number;
  purchaseCycle?: 'One-time' | 'Recurring subscription';
  avgSaleCycle?: '1 Day' | '1 Week' | '1 Month';
  topEmails?: string[];
  consent?: CampaignConsent;
}

interface CampaignBuilderProps {
  onCancel: () => void;
  onSave: (campaign: Campaign) => void;
}

const STEP_LABELS = ['Basics', 'Targeting & budget', 'Top 5 emails', 'Review & consent'];

const ALL_CATEGORIES = [
  "Golf", 
  "Leisure travel", 
  "Fine Dining", 
  "Wellness & Spas", 
  "Luxury Automobiles", 
  "Private Yachting", 
  "High-End Horology"
];

const ALL_GEOGRAPHIES = [
  "Mumbai", 
  "Delhi NCR", 
  "Bengaluru", 
  "Pune", 
  "Hyderabad", 
  "Chennai", 
  "Kolkata", 
  "Ahmedabad"
];

const INDUSTRY_BUSINESS_LINES_MAP: Record<string, string[]> = {
  'Automobile': ['New Sale', 'Resale', 'Services', 'Parts'],
  'Real Estate': ['New Launch', 'Resale', 'Rentals / Leasing', 'Commercial'],
  'Luxury Watches': ['New Watches', 'Pre-owned', 'Servicing & Repairs', 'Accessories'],
  'Wealth Management': ['Wealth Advisory', 'Portfolio Management', 'Private Banking', 'Structured Products']
};

export const CampaignBuilder: React.FC<CampaignBuilderProps> = ({ onCancel, onSave }) => {
  // 1. Pull Onboarded Client Profile
  const clientProfile = useMemo(() => {
    try {
      const stored = localStorage.getItem('race_active_client') || localStorage.getItem('zenith_client_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          name: parsed.clientName || 'Zenith Luxury Motors',
          industry: parsed.industry || 'Automobile',
          ticketSize: parsed.avgTicketSize || 2500000,
          purchaseChannel: parsed.purchaseChannel || 'Both',
          businessLines: parsed.businessLines && parsed.businessLines.length > 0 
            ? parsed.businessLines 
            : (INDUSTRY_BUSINESS_LINES_MAP[parsed.industry || 'Automobile'] || ['New Sale', 'Resale', 'Services', 'Parts'])
        };
      }
    } catch {
      // Fallback
    }
    // Default onboarded client profile
    return {
      name: 'Zenith Luxury Motors',
      industry: 'Automobile',
      ticketSize: 2500000,
      purchaseChannel: 'Both',
      businessLines: ['New Sale', 'Resale', 'Services', 'Parts']
    };
  }, []);

  // 2. Core Form State (Target-first simplified flow)
  const [name, setName] = useState('Zenith Festive Luxury Drive 2026');
  const [targetCAC, setTargetCAC] = useState<number>(2500);
  const [businessLine, setBusinessLine] = useState<string>(clientProfile.businessLines[0] || 'New Sale');
  const [selectedGeographies, setSelectedGeographies] = useState<string[]>(["Mumbai", "Delhi NCR", "Bengaluru"]);
  const [geoSearchQuery, setGeoSearchQuery] = useState('');
  const [geoDropdownOpen, setGeoDropdownOpen] = useState(false);

  // Budget and duration
  const [budgetPerDay, setBudgetPerDay] = useState<number>(10000);
  const [durationDays, setDurationDays] = useState<number>(30);
  const [startDate, setStartDate] = useState('2026-09-22');

  // Advanced settings state (collapsed by default)
  const [moreOptionsOpen, setMoreOptionsOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["Golf", "Leisure travel"]);
  const [confidence, setConfidence] = useState<'High' | 'Medium' | 'Both'>('High'); // Defaults to High
  const [excludeDelivered, setExcludeDelivered] = useState<boolean>(true); // Defaults to true
  const [excludeExisting, setExcludeExisting] = useState<boolean>(true); // Defaults to true
  const [totalBudgetCap, setTotalBudgetCap] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  // Touched / validation tracking
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attempted, setAttempted] = useState<Record<number, boolean>>({});
  const [step, setStep] = useState(1);
  const [emails, setEmails] = useState<string[]>(['', '', '', '', '']);
  const [acks, setAcks] = useState<boolean[]>([false, false, false, false]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // 3. Computed End Date based on duration
  const endDate = useMemo(() => {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return startDate;
    const end = new Date(start);
    end.setDate(end.getDate() + Math.max(1, durationDays) - 1);
    return end.toISOString().split('T')[0];
  }, [startDate, durationDays]);

  // 4. Geographies search filter
  const filteredGeographies = useMemo(() => {
    return ALL_GEOGRAPHIES.filter(city => 
      city.toLowerCase().includes(geoSearchQuery.toLowerCase()) && 
      !selectedGeographies.includes(city)
    );
  }, [geoSearchQuery, selectedGeographies]);

  // 5. Live Forecast Engine
  const forecast = useMemo(() => {
    // Base CAC calculation based on Business Line
    let baseCAC = 2200;
    if (businessLine === 'New Sale' || businessLine === 'New Launch' || businessLine === 'New Watches') {
      baseCAC = 2400;
    } else if (businessLine === 'Resale' || businessLine === 'Pre-owned') {
      baseCAC = 1800;
    } else if (businessLine === 'Services' || businessLine === 'Servicing & Repairs') {
      baseCAC = 1200;
    } else if (businessLine === 'Parts' || businessLine === 'Accessories') {
      baseCAC = 950;
    } else if (businessLine === 'Rentals / Leasing') {
      baseCAC = 1600;
    } else if (businessLine === 'Commercial') {
      baseCAC = 2800;
    }

    // Category affinity multiplier
    let categoryMultiplier = 1.0;
    if (selectedCategories.length > 0) {
      let sum = 0;
      selectedCategories.forEach(cat => {
        if (cat === "Golf" || cat === "Private Yachting" || cat === "High-End Horology") sum += 1.15;
        else if (cat === "Luxury Automobiles" || cat === "Leisure travel") sum += 1.05;
        else sum += 0.95;
      });
      categoryMultiplier = sum / selectedCategories.length;
    }

    // Confidence multiplier (High match quality is slightly tighter CPL)
    let confidenceMultiplier = 1.0;
    if (confidence === 'High') confidenceMultiplier = 1.1;
    else if (confidence === 'Medium') confidenceMultiplier = 0.92;
    else confidenceMultiplier = 1.0;

    // Geo density multiplier (More metros slightly improve scale)
    let geoMultiplier = 1.0;
    if (selectedGeographies.length > 0) {
      const geoCount = selectedGeographies.length;
      if (geoCount >= 4) geoMultiplier = 0.92;
      else if (geoCount === 1) geoMultiplier = 1.08;
    }

    // Exclusions factor
    const exclusionMultiplier = (excludeDelivered ? 1.02 : 0.98) * (excludeExisting ? 1.02 : 0.98);

    // Expected Forecast CAC (rounded to nearest 10)
    const expectedCAC = Math.round((baseCAC * categoryMultiplier * confidenceMultiplier * geoMultiplier * exclusionMultiplier) / 10) * 10;

    // Check Zero-match conditions
    let isZeroMatch = false;
    let zeroMatchReason = "";

    if (!name.trim()) {
      isZeroMatch = true;
      zeroMatchReason = "Please enter a valid campaign name.";
    } else if (!targetCAC || targetCAC <= 0) {
      isZeroMatch = true;
      zeroMatchReason = "Target CAC must be greater than ₹0.";
    } else if (targetCAC < 300) {
      isZeroMatch = true;
      zeroMatchReason = "Target CAC is below the minimum network bidding floor of ₹300 per prospect.";
    } else if (!businessLine) {
      isZeroMatch = true;
      zeroMatchReason = "Please select a target business line.";
    } else if (selectedGeographies.length === 0) {
      isZeroMatch = true;
      zeroMatchReason = "At least one target geography metro must be selected.";
    } else if (budgetPerDay <= 0) {
      isZeroMatch = true;
      zeroMatchReason = "Budget per day must be greater than ₹0.";
    } else if (durationDays < 1) {
      isZeroMatch = true;
      zeroMatchReason = "Duration must be at least 1 day.";
    } else if (totalBudgetCap !== '' && totalBudgetCap < budgetPerDay) {
      isZeroMatch = true;
      zeroMatchReason = "Total budget cap cannot be less than daily budget.";
    }

    if (isZeroMatch) {
      return {
        leadsPerDay: 0,
        totalLeads: 0,
        totalSpend: 0,
        expectedCAC,
        isWithinTarget: false,
        isZeroMatch: true,
        zeroMatchReason
      };
    }

    // Lead calculations based on budget and target CAC / expected CAC
    const effectiveCACForPacing = Math.max(targetCAC, Math.round(expectedCAC * 0.92));
    const leadsPerDay = Math.max(0.1, Math.round((budgetPerDay / effectiveCACForPacing) * 10) / 10);
    
    let totalSpend = budgetPerDay * durationDays;
    if (totalBudgetCap !== '' && totalBudgetCap > 0 && totalBudgetCap < totalSpend) {
      totalSpend = totalBudgetCap;
    }

    const totalLeads = Math.max(1, Math.round(totalSpend / effectiveCACForPacing));
    const isWithinTarget = expectedCAC <= targetCAC;

    return {
      leadsPerDay,
      totalLeads,
      totalSpend,
      expectedCAC,
      isWithinTarget,
      isZeroMatch: false,
      zeroMatchReason: ""
    };
  }, [
    name,
    targetCAC,
    businessLine,
    selectedGeographies,
    budgetPerDay,
    durationDays,
    totalBudgetCap,
    selectedCategories,
    confidence,
    excludeDelivered,
    excludeExisting
  ]);

  // Validation status
  const isFormValid = useMemo(() => {
    if (!name.trim()) return false;
    if (!targetCAC || targetCAC <= 0) return false;
    if (!businessLine) return false;
    if (selectedGeographies.length === 0) return false;
    if (budgetPerDay <= 0) return false;
    if (durationDays < 1) return false;
    if (totalBudgetCap !== '' && totalBudgetCap < budgetPerDay) return false;
    return true;
  }, [name, targetCAC, businessLine, selectedGeographies, budgetPerDay, durationDays, totalBudgetCap]);

  // Helpers
  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const addGeography = (city: string) => {
    if (!selectedGeographies.includes(city)) {
      setSelectedGeographies(prev => [...prev, city]);
    }
    setGeoSearchQuery('');
    setGeoDropdownOpen(false);
  };

  const removeGeography = (city: string) => {
    setSelectedGeographies(prev => prev.filter(c => c !== city));
  };

  const applyBudgetTemplate = (amt: number) => {
    setBudgetPerDay(amt);
    setDurationDays(30);
  };

  // Submit / Launch
  const handleSubmit = (status: 'Active' | 'Draft') => {
    setTouched({
      name: true,
      targetCAC: true,
      businessLine: true,
      geographies: true,
      budgetPerDay: true,
      durationDays: true,
      totalBudgetCap: true
    });

    if (!isFormValid && status === 'Active') {
      return;
    }

    const campaignToSave: Campaign = {
      id: 'CAMP-' + Math.floor(Math.random() * 90000 + 10000),
      name: name.trim() || 'Untitled Campaign',
      industry: clientProfile.industry,
      businessLine: businessLine,
      categories: selectedCategories.length > 0 ? selectedCategories : ["Golf", "Luxury Automobiles"],
      confidence: confidence,
      personas: clientProfile.ticketSize >= 1000000 ? ["UHNI", "HNI"] : ["HNI", "Mass affluent"],
      geographies: selectedGeographies.length > 0 ? selectedGeographies : ["Mumbai"],
      excludeDelivered: excludeDelivered,
      excludeExisting: excludeExisting,
      budgetPerDay: budgetPerDay || 5000,
      totalBudgetCap: totalBudgetCap,
      startDate: startDate,
      endDate: endDate,
      duration: durationDays,
      notes: notes.trim(),
      status: status === 'Active' ? (new Date(startDate) > new Date('2026-09-22') ? 'Scheduled' : 'Active') : 'Draft',
      createdAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      metrics: {
        estLeadsPerDay: forecast.leadsPerDay,
        estTotalLeads: forecast.totalLeads,
        estTotalSpend: forecast.totalSpend,
        estCAC: forecast.expectedCAC
      },
      currentSpend: 0,
      leadsAcquired: 0,
      owner: "Sidhartha R.",
      targetCAC: targetCAC || 2500,
      productSector: businessLine,
      ticketSizeMin: Math.round(clientProfile.ticketSize * 0.7),
      ticketSizeMax: Math.round(clientProfile.ticketSize * 1.5),
      purchaseCycle: clientProfile.purchaseChannel === 'Both' ? 'Recurring subscription' : 'One-time',
      avgSaleCycle: '1 Week'
    };

    const cleaned = cleanEmails(emails);
    if (cleaned.length > 0) campaignToSave.topEmails = cleaned;
    if (status === 'Active') campaignToSave.consent = buildConsent('leadgen');

    onSave(campaignToSave);
  };

  const fmtINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  const step1Valid = !!name.trim() && !!targetCAC && targetCAC > 0 && !!businessLine;
  const step2Valid =
    selectedGeographies.length > 0 &&
    budgetPerDay > 0 &&
    durationDays >= 1 &&
    !(totalBudgetCap !== '' && totalBudgetCap < budgetPerDay);

  const goNext = () => {
    if (step === 1) {
      setAttempted(a => ({ ...a, 1: true }));
      if (!step1Valid) return;
    } else if (step === 2) {
      setAttempted(a => ({ ...a, 2: true }));
      if (!step2Valid) return;
    } else if (step === 3) {
      if (hasInvalidEmails(emails)) return;
    }
    setStep(s => Math.min(4, s + 1));
  };
  const goBack = () => {
    if (step === 1) onCancel();
    else setStep(s => Math.max(1, s - 1));
  };

  const show = (key: string, step_: number) => !!touched[key] || !!attempted[step_];
  const nameBad = show('name', 1) && !name.trim();
  const cacBad = show('targetCAC', 1) && (!targetCAC || targetCAC <= 0);
  const geoBad = show('geographies', 2) && selectedGeographies.length === 0;
  const budgetBad = show('budgetPerDay', 2) && budgetPerDay <= 0;
  const durationBad = show('durationDays', 2) && durationDays < 1;
  const capBad = totalBudgetCap !== '' && totalBudgetCap < budgetPerDay;

  const Err: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p className="mt-1.5 text-[13px] text-[#d70015]">{children}</p>
  );
  const Hint: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p className="mt-1.5 text-[13px] text-[#6e6e73]">{children}</p>
  );

  const Toggle: React.FC<{ label: string; hint: string; on: boolean; onClick: () => void }> = ({ label, hint, on, onClick }) => (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-neutral-200/80 bg-white p-3.5">
      <div>
        <div className="text-xs font-semibold text-neutral-800">{label}</div>
        <div className="text-[11px] text-neutral-400 mt-0.5">{hint}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={onClick}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${on ? 'bg-neutral-900' : 'bg-neutral-200'}`}
      >
        <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out ${on ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
    </div>
  );

  const tile = 'rounded-lg bg-neutral-50 border border-neutral-200/70 p-4';
  const tileLabel = 'text-[11px] font-medium text-neutral-500';
  const tileVal = 'mt-1 text-2xl font-bold tracking-tight text-neutral-900';

  const reviewSections: SummarySection[] = [
    {
      heading: 'Basics',
      rows: [
        ['Campaign name', name.trim() || '—'],
        ['Target CAC', targetCAC ? fmtINR(targetCAC) : '—'],
        ['Business line', businessLine || '—'],
      ],
    },
    {
      heading: 'Targeting & budget',
      rows: [
        ['Geography', selectedGeographies.length ? selectedGeographies.join(', ') : '—'],
        ['Budget', `${fmtINR(budgetPerDay)} / day · ${durationDays} days`],
        ['Category affinity', selectedCategories.length ? selectedCategories.join(', ') : 'None'],
        ['Confidence', confidence],
        ['Exclusions', [excludeDelivered && 'Previously-delivered leads', excludeExisting && 'Existing customers'].filter(Boolean).join(', ') || 'None'],
        ['Total budget cap', totalBudgetCap === '' ? 'None' : fmtINR(totalBudgetCap)],
        ['Forecast', `~${forecast.totalLeads.toLocaleString('en-IN')} leads · ${fmtINR(forecast.totalSpend)}`],
      ],
    },
    {
      heading: 'Top 5 emails',
      rows: [['Emails', `${Math.min(5, cleanEmails(emails).length)} of 5 added`]],
    },
  ];

  const allAcked = acks.every(Boolean);

  return (
    <div className="space-y-6 pb-16 font-sans w-full">
      <WizardHeader
        section="Lead Gen"
        title="Create Target Campaign"
        subtitle="Target-first campaign setup powered by your verified client profile."
        client={clientProfile}
        steps={STEP_LABELS}
        step={step}
        onCancel={onCancel}
        onJump={(n) => setStep(n)}
      />

      {step === 1 && (
        <WizardCard title="Basics" lead="Name your campaign and set what you are willing to pay per prospect.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="cb-name" required>Campaign name</FieldLabel>
              <input
                id="cb-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setTouched(prev => ({ ...prev, name: true }));
                }}
                placeholder="e.g. Zenith Festive Luxury Drive 2026"
                className={inputCls(nameBad)}
              />
              {nameBad && <Err>Campaign name is required.</Err>}
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Business line</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {clientProfile.businessLines.map((line: string) => (
                  <Chip
                    key={line}
                    on={businessLine === line}
                    onClick={() => {
                      setBusinessLine(line);
                      setTouched(prev => ({ ...prev, businessLine: true }));
                    }}
                  >
                    {line}
                  </Chip>
                ))}
              </div>
              {show('businessLine', 1) && !businessLine && <Err>Please select a business line.</Err>}
            </div>

            <div className="flex flex-col gap-1.5 max-w-md">
              <FieldLabel htmlFor="cb-cac" required>Target CAC</FieldLabel>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 font-medium">₹</span>
                <input
                  id="cb-cac"
                  type="number"
                  value={targetCAC || ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                    setTargetCAC(val);
                    setTouched(prev => ({ ...prev, targetCAC: true }));
                  }}
                  placeholder="e.g. 2500"
                  className={`${inputCls(cacBad)} pl-8`}
                />
              </div>
              <Hint>What you are willing to pay per prospect. Last 30d avg: ₹2,450.</Hint>
              {cacBad && <Err>Target CAC must be greater than ₹0.</Err>}
            </div>
          </div>
        </WizardCard>
      )}

      {step === 2 && (
        <>
          <WizardCard title="Targeting & Budget" lead="Choose where to reach people and how much to spend.">
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Geography</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {ALL_GEOGRAPHIES.map((city) => (
                  <Chip
                    key={city}
                    on={selectedGeographies.includes(city)}
                    onClick={() => {
                      setTouched(prev => ({ ...prev, geographies: true }));
                      if (selectedGeographies.includes(city)) removeGeography(city);
                      else addGeography(city);
                    }}
                  >
                    {city}
                  </Chip>
                ))}
              </div>
              {geoBad && <Err>Please select at least one geography.</Err>}
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel hint="Quick presets">Budget presets</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {[5000, 10000, 25000].map((amt) => (
                  <Chip key={amt} on={budgetPerDay === amt} onClick={() => applyBudgetTemplate(amt)}>
                    {fmtINR(amt)} / day
                  </Chip>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="cb-budget" required>Budget per day</FieldLabel>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 font-medium">₹</span>
                  <input
                    id="cb-budget"
                    type="number"
                    value={budgetPerDay || ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                      setBudgetPerDay(val);
                      setTouched(prev => ({ ...prev, budgetPerDay: true }));
                    }}
                    placeholder="e.g. 10000"
                    className={`${inputCls(budgetBad)} pl-8`}
                  />
                </div>
                {budgetBad && <Err>Budget per day must be greater than ₹0.</Err>}
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="cb-duration" required>Duration (days)</FieldLabel>
                <input
                  id="cb-duration"
                  type="number"
                  min={1}
                  value={durationDays || ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 1 : parseInt(e.target.value, 10);
                    setDurationDays(val);
                    setTouched(prev => ({ ...prev, durationDays: true }));
                  }}
                  placeholder="30"
                  className={inputCls(durationBad)}
                />
                <Hint>Runs {startDate} to {endDate} ({durationDays} days).</Hint>
                {durationBad && <Err>Duration must be at least 1 day.</Err>}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-mono font-semibold uppercase tracking-wider text-neutral-400">Live Targeting Forecast</h4>
                <span className="text-[11px] text-neutral-400">Real-time projection</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className={tile}>
                  <div className={tileLabel}>Est. leads / day</div>
                  <div className={tileVal}>{forecast.leadsPerDay}</div>
                </div>
                <div className={tile}>
                  <div className={tileLabel}>Est. total leads</div>
                  <div className={tileVal}>{forecast.totalLeads.toLocaleString('en-IN')}</div>
                  <div className="mt-0.5 text-[11px] text-neutral-400">{durationDays}d total</div>
                </div>
                <div className={tile}>
                  <div className={tileLabel}>Est. total spend</div>
                  <div className={tileVal}>{fmtINR(forecast.totalSpend)}</div>
                </div>
                <div className={tile}>
                  <div className={tileLabel}>Est. CAC vs target</div>
                  <div className={tileVal}>{fmtINR(forecast.expectedCAC)}</div>
                  <div className={`mt-0.5 text-xs font-semibold ${forecast.isWithinTarget ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {forecast.isWithinTarget ? 'Within' : 'Above'} target of {fmtINR(targetCAC)}
                  </div>
                </div>
              </div>
              {forecast.isZeroMatch && (
                <div className="rounded-lg bg-amber-50 border border-amber-200/80 px-4 py-3 text-xs leading-relaxed text-amber-900">
                  <b className="font-semibold">Zero-match targeting warning.</b> {forecast.zeroMatchReason} Adjust your targeting criteria, target CAC, or budget parameters.
                </div>
              )}
            </div>
          </WizardCard>

          <CollapsibleCard title="More Options" badge="Optional" isOpen={moreOptionsOpen} onToggle={() => setMoreOptionsOpen(!moreOptionsOpen)}>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Category affinity scope</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {ALL_CATEGORIES.map((cat) => (
                  <Chip key={cat} on={selectedCategories.includes(cat)} onClick={() => toggleCategory(cat)}>{cat}</Chip>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5 max-w-md">
              <FieldLabel hint="Match strictness">Confidence level</FieldLabel>
              <div className="grid grid-cols-3 gap-1 rounded-lg bg-neutral-100 p-1">
                {(['High', 'Medium', 'Both'] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    aria-pressed={confidence === tier}
                    onClick={() => setConfidence(tier)}
                    className={`h-8 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      confidence === tier ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Toggle label="Exclude previously-delivered leads" hint="Suppress duplicate records across campaigns." on={excludeDelivered} onClick={() => setExcludeDelivered(!excludeDelivered)} />
              <Toggle label="Exclude existing customers" hint="Avoid marketing collision with active client accounts." on={excludeExisting} onClick={() => setExcludeExisting(!excludeExisting)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="cb-cap" hint="Optional">Total budget cap</FieldLabel>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 font-medium">₹</span>
                  <input
                    id="cb-cap"
                    type="number"
                    value={totalBudgetCap}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                      setTotalBudgetCap(val);
                    }}
                    placeholder="None (run dynamically)"
                    className={`${inputCls(capBad)} pl-8`}
                  />
                </div>
                {capBad && <Err>Total budget cap must be at least the daily budget (₹{budgetPerDay.toLocaleString('en-IN')}).</Err>}
              </div>

              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="cb-notes">Internal notes / objective</FieldLabel>
                <textarea
                  id="cb-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record internal campaign objectives, targeting rationale..."
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-xs text-neutral-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-neutral-400"
                />
              </div>
            </div>
          </CollapsibleCard>
        </>
      )}

      {step === 3 && (
        <TopEmailsStep
          emails={emails}
          onChange={setEmails}
          lead="Pick five of your best customers. They help our model learn what a great match looks like, so your results are more accurate."
          noteTail="not added to your audience"
        />
      )}

      {step === 4 && (
        <ReviewConsentStep
          kind="leadgen"
          actionWord="launch"
          sections={reviewSections}
          acks={acks}
          onToggle={(i) => setAcks(prev => prev.map((v, idx) => (idx === i ? !v : v)))}
          walletCost={{
            currentBalance: 1250000,
            campaignCost: forecast.totalSpend,
            costLabel: 'Target Campaign Spend',
            costSubtext: `${durationDays} days @ ₹${budgetPerDay.toLocaleString('en-IN')}/day (${forecast.totalLeads.toLocaleString('en-IN')} target prospects)`,
            unitRateLabel: 'Target CAC',
            unitRateValue: `Target CAC: ₹${targetCAC.toLocaleString('en-IN')}`,
            pacingNote: `Daily pacing: ₹${budgetPerDay.toLocaleString('en-IN')}/day · ${durationDays} days duration`
          }}
        />
      )}

      {step < 4 ? (
        <WizardFooter
          step={step}
          onBack={goBack}
          onNext={goNext}
          nextLabel="Continue"
          nextDisabled={step === 3 && hasInvalidEmails(emails)}
        />
      ) : (
        <WizardFooter
          step={step}
          onBack={goBack}
          onDraft={() => handleSubmit('Draft')}
          onNext={() => handleSubmit('Active')}
          nextLabel="Launch campaign"
          nextDisabled={!(allAcked && isFormValid && !hasInvalidEmails(emails))}
        />
      )}
    </div>
  );
};
