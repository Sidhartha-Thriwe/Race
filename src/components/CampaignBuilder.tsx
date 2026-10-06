import React, { useState, useMemo } from 'react';
import { 
  Check, 
  AlertTriangle, 
  Calendar, 
  Sparkles, 
  Search, 
  X, 
  ChevronDown, 
  ChevronUp, 
  ChevronRight, 
  Lock, 
  TrendingDown, 
  Info, 
  HelpCircle,
  ShieldCheck,
  Building2,
  SlidersHorizontal,
  ArrowRight
} from 'lucide-react';

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
}

interface CampaignBuilderProps {
  onCancel: () => void;
  onSave: (campaign: Campaign) => void;
}

const InfoTooltip: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="group relative inline-flex items-center ml-1.5 text-neutral-400 hover:text-neutral-600 transition-colors cursor-help align-middle">
      <Info size={13} className="inline-block" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover:block w-64 p-2.5 bg-neutral-900 text-white text-[11px] leading-relaxed rounded-lg shadow-xl font-medium border border-neutral-800 z-[999] text-center pointer-events-none transition-all duration-150">
        <div className="relative">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-neutral-900 border-r border-b border-neutral-800 rotate-45 mt-[3.5px]" />
        </div>
      </div>
    </div>
  );
};

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
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["Golf", "Leisure travel"]);
  const [confidence, setConfidence] = useState<'High' | 'Medium' | 'Both'>('High'); // Defaults to High
  const [excludeDelivered, setExcludeDelivered] = useState<boolean>(true); // Defaults to true
  const [excludeExisting, setExcludeExisting] = useState<boolean>(true); // Defaults to true
  const [totalBudgetCap, setTotalBudgetCap] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  // Touched / validation tracking
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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

    onSave(campaignToSave);
  };

  // Format currency display
  const formatTicketSize = (amt: number) => {
    if (amt >= 10000000) {
      return `₹${(amt / 10000000).toFixed(amt % 10000000 === 0 ? 0 : 1)} Cr`;
    }
    if (amt >= 100000) {
      return `₹${(amt / 100000).toFixed(amt % 100000 === 0 ? 0 : 1)}L`;
    }
    return `₹${amt.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-6 pb-16 select-none font-sans max-w-5xl mx-auto w-full">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-neutral-400 font-semibold mb-2">
        <span className="hover:text-neutral-700 cursor-pointer transition-colors" onClick={onCancel}>Lead Gen</span>
        <ChevronRight size={12} />
        <span className="text-neutral-900 font-bold">Campaign builder</span>
      </div>

      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-200/70 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">Create Target Campaign</h2>
          <p className="text-xs text-neutral-500 mt-0.5">Target-first campaign setup powered by your verified client profile.</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 transition-colors self-start sm:self-auto cursor-pointer"
        >
          Cancel & Exit
        </button>
      </div>

      {/* 1. Client Profile Strip (Read-only) */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-white rounded-xl p-4 shadow-sm border border-neutral-700/60 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
            <Building2 size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wide text-neutral-200 truncate">{clientProfile.name}</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-neutral-400 bg-white/10 px-2 py-0.5 rounded">
                <Lock size={10} className="text-neutral-400" /> Read-only
              </span>
            </div>
            <div className="text-xs text-neutral-300 font-medium flex items-center gap-2 mt-0.5 flex-wrap">
              <span><strong className="text-white font-bold">{clientProfile.industry}</strong></span>
              <span className="text-neutral-500">•</span>
              <span>Ticket size: <strong className="text-white font-bold">{formatTicketSize(clientProfile.ticketSize)}</strong></span>
              <span className="text-neutral-500">•</span>
              <span>Channel: <strong className="text-white font-bold">{clientProfile.purchaseChannel}</strong></span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1 md:pt-0 border-t md:border-t-0 border-neutral-700/60 shrink-0">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-400 bg-blue-500/10 border border-blue-400/25 px-2.5 py-1 rounded-md">
            <span>Managed in Client Onboarding</span>
          </span>
        </div>
      </div>

      {/* Main Campaign Configuration Card */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 sm:p-7 shadow-sm space-y-7">
        
        {/* 2. Campaign Name */}
        <div>
          <label className="inline-flex items-center text-xs font-bold text-neutral-800 uppercase tracking-wide mb-1.5">
            <span>Campaign name</span> <span className="text-red-500 ml-1">*</span>
            <InfoTooltip content="A descriptive identifier for this campaign in reporting tables and lead acquisition logs." />
          </label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setTouched(prev => ({ ...prev, name: true }));
            }}
            placeholder="e.g. Zenith Festive Luxury Drive 2026"
            className={`w-full px-4 py-2.5 text-xs bg-neutral-50/70 border ${
              touched.name && !name.trim() 
                ? 'border-red-400 focus:ring-red-400/25' 
                : 'border-neutral-200 focus:border-blue-500 focus:ring-blue-500/20'
            } rounded-xl text-neutral-900 placeholder-neutral-400 font-semibold focus:outline-none focus:ring-2 focus:bg-white transition-all`}
          />
          {touched.name && !name.trim() && (
            <p className="text-[11px] text-red-500 font-bold mt-1.5 flex items-center gap-1">
              <AlertTriangle size={12} /> Campaign name is required.
            </p>
          )}
        </div>

        {/* 3. Target CAC (Large Currency Input placed first) */}
        <div className="bg-blue-50/40 border border-blue-200/60 rounded-xl p-5 space-y-2">
          <label className="inline-flex items-center text-xs font-bold text-neutral-800 uppercase tracking-wide">
            <span>Target CAC</span> <span className="text-red-500 ml-1">*</span>
            <InfoTooltip content="The maximum acquisition cost per prospect you are willing to spend. Used as the benchmark for pacing and match quality." />
          </label>
          
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-extrabold text-lg">₹</span>
            <input 
              type="number" 
              value={targetCAC || ''}
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                setTargetCAC(val);
                setTouched(prev => ({ ...prev, targetCAC: true }));
              }}
              placeholder="e.g. 2500"
              className={`w-full pl-9 pr-4 py-3 text-lg font-bold bg-white border ${
                touched.targetCAC && (!targetCAC || targetCAC <= 0)
                  ? 'border-red-400 focus:ring-red-400/25'
                  : 'border-blue-300/80 focus:border-blue-600 focus:ring-blue-500/20'
              } rounded-xl text-neutral-900 focus:outline-none focus:ring-3 transition-all`}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[11px] pt-1">
            <p className="text-neutral-500 font-medium">
              What you're willing to pay per prospect.
            </p>
            <p className="text-neutral-600 font-semibold flex items-center gap-1">
              <span>Your last 30 days avg:</span>
              <span className="inline-flex items-center text-neutral-900 font-bold bg-white px-2 py-0.5 rounded border border-neutral-200 shadow-2xs">
                ₹2,450
              </span>
            </p>
          </div>

          {touched.targetCAC && (!targetCAC || targetCAC <= 0) && (
            <p className="text-[11px] text-red-500 font-bold flex items-center gap-1">
              <AlertTriangle size={12} /> Target CAC must be greater than ₹0.
            </p>
          )}
        </div>

        {/* 4. Business Line (Single-select scoped to client profile) */}
        <div>
          <label className="inline-flex items-center text-xs font-bold text-neutral-800 uppercase tracking-wide mb-1.5">
            <span>Business line</span> <span className="text-red-500 ml-1">*</span>
            <InfoTooltip content="Scoped to your onboarded business lines. Replaces general product sectors to match your actual operational scope." />
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {clientProfile.businessLines.map((line) => {
              const isSelected = businessLine === line;
              return (
                <button
                  key={line}
                  type="button"
                  onClick={() => {
                    setBusinessLine(line);
                    setTouched(prev => ({ ...prev, businessLine: true }));
                  }}
                  className={`px-3.5 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                      : 'bg-neutral-50/70 text-neutral-700 border-neutral-200 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                >
                  {isSelected && <Check size={13} className="shrink-0 stroke-[3]" />}
                  <span>{line}</span>
                </button>
              );
            })}
          </div>
          {touched.businessLine && !businessLine && (
            <p className="text-[11px] text-red-500 font-bold mt-1.5 flex items-center gap-1">
              <AlertTriangle size={12} /> Please select a business line.
            </p>
          )}
        </div>

        {/* 5. Geography (Searchable multi-select) */}
        <div className="space-y-2">
          <label className="inline-flex items-center text-xs font-bold text-neutral-800 uppercase tracking-wide">
            <span>Geography Metros</span> <span className="text-red-500 ml-1">*</span>
            <InfoTooltip content="Filter leads residing or conducting transactions in these designated target metro markets." />
          </label>

          {/* Selected city tags */}
          {selectedGeographies.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {selectedGeographies.map(city => (
                <span key={city} className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 text-xs font-bold bg-neutral-100 text-neutral-800 rounded-lg border border-neutral-200 shadow-2xs">
                  {city}
                  <button 
                    type="button" 
                    onClick={() => removeGeography(city)}
                    className="p-0.5 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-200 rounded transition-colors cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search box & Dropdown */}
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input 
              type="text"
              placeholder="Search and add metro cities (e.g. Mumbai, Bengaluru)..."
              value={geoSearchQuery}
              onFocus={() => setGeoDropdownOpen(true)}
              onChange={(e) => {
                setGeoSearchQuery(e.target.value);
                setGeoDropdownOpen(true);
              }}
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-neutral-50/70 focus:bg-white border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />

            {geoDropdownOpen && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 py-1.5 max-h-48 overflow-y-auto">
                {filteredGeographies.length > 0 ? (
                  filteredGeographies.map(city => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => addGeography(city)}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <span>{city}</span>
                      <span className="text-[10px] text-blue-600 font-bold">+ Add</span>
                    </button>
                  ))
                ) : (
                  <div className="px-3.5 py-2 text-xs text-neutral-400 text-center">
                    No matching metro cities available
                  </div>
                )}
                <div className="border-t border-neutral-100 mt-1 pt-1 px-2">
                  <button 
                    type="button"
                    onClick={() => setGeoDropdownOpen(false)}
                    className="w-full text-center py-1 text-[10px] font-bold text-neutral-400 hover:text-neutral-700 uppercase tracking-wider cursor-pointer"
                  >
                    Close dropdown
                  </button>
                </div>
              </div>
            )}
          </div>

          {selectedGeographies.length === 0 && touched.geographies && (
            <p className="text-[11px] text-red-500 font-bold mt-1 flex items-center gap-1">
              <AlertTriangle size={12} /> Please select at least one geography.
            </p>
          )}
        </div>

        {/* 6. Budget Templates, Budget per Day & Duration */}
        <div className="space-y-4 pt-1">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="inline-flex items-center text-xs font-bold text-neutral-800 uppercase tracking-wide">
                <span>Budget templates</span>
                <InfoTooltip content="One-click presets that configure standard daily pacing and a 30-day campaign schedule." />
              </label>
              <span className="text-[11px] text-neutral-400 font-medium">Quick presets</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[5000, 10000, 25000].map((amt) => {
                const isSelected = budgetPerDay === amt;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => applyBudgetTemplate(amt)}
                    className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900'
                    }`}
                  >
                    ₹{amt.toLocaleString('en-IN')} / day
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="inline-flex items-center text-xs font-bold text-neutral-800 uppercase tracking-wide mb-1.5">
                <span>Budget per day (₹)</span> <span className="text-red-500 ml-1">*</span>
                <InfoTooltip content="Daily marketing capital dedicated to lead matches. Higher pacing secures greater target volume." />
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">₹</span>
                <input 
                  type="number" 
                  value={budgetPerDay || ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                    setBudgetPerDay(val);
                    setTouched(prev => ({ ...prev, budgetPerDay: true }));
                  }}
                  placeholder="e.g. 10000"
                  className={`w-full pl-7 pr-3.5 py-2.5 text-xs bg-neutral-50/70 focus:bg-white border ${
                    touched.budgetPerDay && budgetPerDay <= 0 ? 'border-red-400' : 'border-neutral-200 focus:border-blue-500'
                  } rounded-xl text-neutral-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all`}
                />
              </div>
            </div>

            <div>
              <label className="inline-flex items-center text-xs font-bold text-neutral-800 uppercase tracking-wide mb-1.5">
                <span>Duration (Days)</span> <span className="text-red-500 ml-1">*</span>
                <InfoTooltip content="Total planned campaign duration window in calendar days. Defaults to 30 days." />
              </label>
              <div className="relative">
                <Calendar size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input 
                  type="number" 
                  min={1}
                  value={durationDays || ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 1 : parseInt(e.target.value, 10);
                    setDurationDays(val);
                    setTouched(prev => ({ ...prev, durationDays: true }));
                  }}
                  placeholder="30"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-neutral-50/70 focus:bg-white border border-neutral-200 rounded-xl text-neutral-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <p className="text-[10px] text-neutral-400 mt-1">
                Runs from <strong className="text-neutral-700">{startDate}</strong> to <strong className="text-neutral-700">{endDate}</strong> ({durationDays} days).
              </p>
            </div>
          </div>
        </div>

        {/* 7. Forecast Tiles (4 Tiles including Est. CAC vs Target) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider">
              <Sparkles size={14} />
              <span>Live Targeting Forecast</span>
            </div>
            <span className="text-[11px] text-neutral-400 font-medium">Real-time projection</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            
            {/* Tile 1: Est. leads / day */}
            <div className="bg-neutral-50/80 border border-neutral-200/80 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                Est. leads / day
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-neutral-900 tracking-tight">
                  {forecast.leadsPerDay}
                </span>
                <span className="text-[10px] font-semibold text-neutral-500 bg-neutral-200/60 px-1.5 py-0.5 rounded">
                  Daily pacing
                </span>
              </div>
            </div>

            {/* Tile 2: Est. total leads */}
            <div className="bg-neutral-50/80 border border-neutral-200/80 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                Est. total leads
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-neutral-900 tracking-tight">
                  {forecast.totalLeads.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] font-semibold text-neutral-500 bg-neutral-200/60 px-1.5 py-0.5 rounded">
                  {durationDays}d total
                </span>
              </div>
            </div>

            {/* Tile 3: Est. total spend */}
            <div className="bg-neutral-50/80 border border-neutral-200/80 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                Est. total spend
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-neutral-900 tracking-tight">
                  ₹{forecast.totalSpend.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] font-semibold text-neutral-500 bg-neutral-200/60 px-1.5 py-0.5 rounded">
                  Max spend
                </span>
              </div>
            </div>

            {/* Tile 4: Est. CAC vs Target (NEW 4th tile) */}
            <div className={`border rounded-xl p-4 flex flex-col justify-between transition-all ${
              forecast.isWithinTarget
                ? 'bg-emerald-50/70 border-emerald-300/80 text-emerald-950'
                : 'bg-amber-50/70 border-amber-300/80 text-amber-950'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  forecast.isWithinTarget ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  Est. CAC vs Target
                </span>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  forecast.isWithinTarget 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-amber-600 text-white'
                }`}>
                  {forecast.isWithinTarget ? (
                    <Check size={12} className="stroke-[3]" />
                  ) : (
                    <AlertTriangle size={12} className="stroke-[3]" />
                  )}
                </div>
              </div>

              <div className="mt-2">
                <div className="flex items-baseline gap-2">
                  <span className={`text-xl font-black tracking-tight ${
                    forecast.isWithinTarget ? 'text-emerald-900' : 'text-amber-900'
                  }`}>
                    ₹{forecast.expectedCAC.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-neutral-500 font-medium">
                    (Target: ₹{targetCAC.toLocaleString('en-IN')})
                  </span>
                </div>
                <p className={`text-[10.5px] font-semibold mt-1 leading-snug ${
                  forecast.isWithinTarget ? 'text-emerald-700' : 'text-amber-800'
                }`}>
                  At this targeting, expected CAC is ₹{forecast.expectedCAC.toLocaleString('en-IN')}.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* 8. Zero-Match Warning (only when relevant) */}
        {forecast.isZeroMatch && (
          <div className="bg-amber-50 border border-amber-300/90 rounded-xl p-4 text-amber-900 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
              <AlertTriangle size={16} />
              <span>Zero-Match Targeting Warning</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-700 font-medium">
              {forecast.zeroMatchReason} Adjust your targeting criteria, target CAC, or budget parameters to enable campaign launch.
            </p>
          </div>
        )}

        {/* 9. Advanced Settings (Collapsible section, closed by default) */}
        <div className="border border-neutral-200/80 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full px-5 py-3.5 bg-neutral-50 hover:bg-neutral-100/70 transition-colors flex items-center justify-between text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <SlidersHorizontal size={14} className="text-neutral-500" />
              <span className="text-xs font-bold text-neutral-800 uppercase tracking-wide">
                Advanced settings
              </span>
              <span className="text-[10px] font-semibold text-neutral-500 bg-white border border-neutral-200 px-2 py-0.5 rounded-full">
                Secondary controls · Optional
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-neutral-500 font-medium">
              <span>{showAdvanced ? 'Hide controls' : 'Show controls'}</span>
              {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
          </button>

          {showAdvanced && (
            <div className="p-5 sm:p-6 bg-white space-y-6 border-t border-neutral-200/80">
              
              {/* Category (Multi-select chips) */}
              <div>
                <label className="inline-flex items-center text-xs font-bold text-neutral-800 uppercase tracking-wide mb-2">
                  <span>Category Affinity Scope</span>
                  <InfoTooltip content="Associate prospect match criteria with these high-affinity lifestyle and luxury verticals." />
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_CATEGORIES.map((cat) => {
                    const isSelected = selectedCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                            : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Confidence (Segmented control, defaults to High) */}
              <div>
                <label className="inline-flex items-center text-xs font-bold text-neutral-800 uppercase tracking-wide mb-2">
                  <span>Confidence Level</span>
                  <InfoTooltip content="Match score strictness threshold. Defaults to High for maximum qualified prospect intent." />
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-neutral-100 p-1 rounded-xl max-w-md">
                  {(['High', 'Medium', 'Both'] as const).map((tier) => {
                    const isSelected = confidence === tier;
                    return (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => setConfidence(tier)}
                        className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-white text-neutral-900 shadow-xs'
                            : 'text-neutral-500 hover:text-neutral-800'
                        }`}
                      >
                        {tier}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Toggles: Exclude Delivered & Exclude Existing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="flex items-center justify-between p-3.5 bg-neutral-50/70 border border-neutral-200/70 rounded-xl">
                  <div className="pr-3">
                    <span className="text-xs font-bold text-neutral-800 block">
                      Exclude previously-delivered leads
                    </span>
                    <span className="text-[10.5px] text-neutral-500">
                      Suppress duplicate records across campaigns.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExcludeDelivered(!excludeDelivered)}
                    className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer shrink-0 focus:outline-none ${
                      excludeDelivered ? 'bg-neutral-900' : 'bg-neutral-300'
                    }`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                      excludeDelivered ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-neutral-50/70 border border-neutral-200/70 rounded-xl">
                  <div className="pr-3">
                    <span className="text-xs font-bold text-neutral-800 block">
                      Exclude existing customers
                    </span>
                    <span className="text-[10.5px] text-neutral-500">
                      Avoid marketing collision with active client accounts.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExcludeExisting(!excludeExisting)}
                    className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer shrink-0 focus:outline-none ${
                      excludeExisting ? 'bg-neutral-900' : 'bg-neutral-300'
                    }`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                      excludeExisting ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Total budget cap */}
              <div>
                <label className="inline-flex items-center text-xs font-bold text-neutral-800 uppercase tracking-wide mb-1.5">
                  <span>Total budget cap (₹)</span> <span className="text-neutral-400 font-normal ml-1">(Optional)</span>
                  <InfoTooltip content="An absolute monetary limit that automatically pauses the campaign once reached." />
                </label>
                <div className="relative max-w-sm">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">₹</span>
                  <input 
                    type="number" 
                    value={totalBudgetCap}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                      setTotalBudgetCap(val);
                    }}
                    placeholder="None (run dynamically)"
                    className="w-full pl-7 pr-3.5 py-2 text-xs bg-neutral-50/70 focus:bg-white border border-neutral-200 rounded-xl text-neutral-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                {totalBudgetCap !== '' && totalBudgetCap < budgetPerDay && (
                  <p className="text-[11px] text-red-500 font-bold mt-1 flex items-center gap-1">
                    <AlertTriangle size={12} /> Total budget cap must be at least the daily budget (₹{budgetPerDay.toLocaleString('en-IN')}).
                  </p>
                )}
              </div>

              {/* Internal notes / objective */}
              <div>
                <label className="inline-flex items-center text-xs font-bold text-neutral-800 uppercase tracking-wide mb-1.5">
                  <span>Internal notes / objective</span>
                  <InfoTooltip content="Record campaign goals, qualifier notes, or team instructions for internal reporting." />
                </label>
                <textarea 
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record internal campaign objectives, targeting rationale, or special qualifiers..."
                  className="w-full px-3.5 py-2 text-xs bg-neutral-50/70 focus:bg-white border border-neutral-200 rounded-xl text-neutral-900 font-medium placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

            </div>
          )}
        </div>

        {/* 10. Actions Footer: Save as draft / Launch */}
        <div className="pt-4 border-t border-neutral-200/80 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-neutral-600 hover:text-neutral-900 bg-transparent hover:bg-neutral-100 rounded-xl transition-all cursor-pointer text-center"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => handleSubmit('Draft')}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-xl shadow-2xs transition-all focus:outline-none active:scale-98 cursor-pointer"
          >
            Save as draft
          </button>

          <button
            type="button"
            disabled={!isFormValid}
            onClick={() => handleSubmit('Active')}
            className={`w-full sm:w-auto px-7 py-2.5 text-xs font-bold text-white rounded-xl shadow-sm transition-all focus:outline-none flex items-center justify-center gap-2 ${
              !isFormValid
                ? 'bg-neutral-300 cursor-not-allowed text-neutral-500'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-98 cursor-pointer shadow-blue-500/20 shadow-md'
            }`}
          >
            <span>Launch campaign</span>
            <ArrowRight size={13} className="stroke-[2.5]" />
          </button>
        </div>

      </div>
    </div>
  );
};
