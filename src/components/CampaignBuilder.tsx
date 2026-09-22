import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  HelpCircle, 
  Search, 
  X, 
  AlertTriangle, 
  Calendar, 
  Sparkles, 
  DollarSign, 
  Check, 
  Info,
  ChevronRight
} from 'lucide-react';

export interface Campaign {
  id: string;
  name: string;
  industry: string;
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
  notes: string;
  status: 'Active' | 'Scheduled' | 'Draft' | 'Paused' | 'Completed';
  createdAt: string;
  metrics: {
    estLeadsPerDay: number;
    estTotalLeads: number;
    estTotalSpend: number;
  };
  currentSpend?: number;
  leadsAcquired?: number;
  owner?: string;
  targetCAC?: number;
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

const ALL_PRODUCT_SECTORS = [
  "Credit Cards", 
  "Wealth Advisory", 
  "Retail Banking", 
  "Personal Loans", 
  "Business Loans",
  "Luxury Concierge",
  "Custom Portfolio"
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

export const CampaignBuilder: React.FC<CampaignBuilderProps> = ({ onCancel, onSave }) => {
  // 1. Campaign state
  const [name, setName] = useState('Zenith Premium Wealth Q4');
  const [targetCAC, setTargetCAC] = useState<number>(2500);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["Golf", "Leisure travel"]);
  const [productSector, setProductSector] = useState<string>('Wealth Advisory');
  const [confidence, setConfidence] = useState<'High' | 'Medium' | 'Both'>('Both');
  const [ticketSizeMin, setTicketSizeMin] = useState<number>(500000);
  const [ticketSizeMax, setTicketSizeMax] = useState<number>(2500000);
  const [purchaseCycle, setPurchaseCycle] = useState<'One-time' | 'Recurring subscription'>('Recurring subscription');
  const [avgSaleCycle, setAvgSaleCycle] = useState<'1 Day' | '1 Week' | '1 Month'>('1 Week');
  const [selectedGeographies, setSelectedGeographies] = useState<string[]>(["Mumbai", "Delhi NCR", "Bengaluru"]);
  const [geoSearchQuery, setGeoSearchQuery] = useState('');
  const [geoDropdownOpen, setGeoDropdownOpen] = useState(false);
  const [excludeDelivered, setExcludeDelivered] = useState(true);
  const [excludeExisting, setExcludeExisting] = useState(true);
  const [budgetPerDay, setBudgetPerDay] = useState<number>(10000);
  const [totalBudgetCap, setTotalBudgetCap] = useState<number | ''>(300000);
  const [startDate, setStartDate] = useState('2026-09-21');
  const [endDate, setEndDate] = useState('2026-10-21'); // Default 30-day window
  const [notes, setNotes] = useState('Targeting premium HNIs for high-yield wealth advisory onboarding.');

  // Form errors
  const [nameError, setNameError] = useState('');

  // Derived personas list to keep compatibility with CampaignManagement.tsx
  const derivedPersonas = useMemo(() => {
    const list: string[] = [];
    if (ticketSizeMin >= 1000000) {
      list.push("UHNI");
    }
    if (ticketSizeMin >= 100000 || ticketSizeMax >= 1000000) {
      list.push("HNI");
    }
    if (ticketSizeMin < 500000) {
      list.push("Mass affluent");
    }
    return list.length > 0 ? list : ["HNI"];
  }, [ticketSizeMin, ticketSizeMax]);

  // 2. Filter available geographies based on search
  const filteredGeographies = useMemo(() => {
    return ALL_GEOGRAPHIES.filter(city => 
      city.toLowerCase().includes(geoSearchQuery.toLowerCase()) && 
      !selectedGeographies.includes(city)
    );
  }, [geoSearchQuery, selectedGeographies]);

  // 3. Compute duration in days
  const durationInDays = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
    return diffDays > 0 ? diffDays : 1;
  }, [startDate, endDate]);

  // 4. Live Forecast Engine
  const forecast = useMemo(() => {
    // Average Cost Per Lead (CPL) estimates based on Product Sector, ticket size, and categories
    let baseCPL = 1500;
    
    if (productSector === "Credit Cards") baseCPL = 800;
    else if (productSector === "Wealth Advisory") baseCPL = 3000;
    else if (productSector === "Retail Banking") baseCPL = 500;
    else if (productSector === "Personal Loans") baseCPL = 1200;
    else if (productSector === "Business Loans") baseCPL = 1800;
    else if (productSector === "Luxury Concierge") baseCPL = 2500;
    else if (productSector === "Custom Portfolio") baseCPL = 3500;

    // Categories multiplier
    let categoryMultiplier = 1.0;
    if (selectedCategories.length > 0) {
      // High end categories slightly increase CPL but provide extremely rich lead quality
      let sum = 0;
      selectedCategories.forEach(cat => {
        if (cat === "Golf" || cat === "Private Yachting" || cat === "High-End Horology") sum += 1.3;
        else if (cat === "Luxury Automobiles" || cat === "Leisure travel") sum += 1.1;
        else sum += 0.9;
      });
      categoryMultiplier = sum / selectedCategories.length;
    }

    // Scale by ticket size (replaces persona-based multiplier)
    let ticketMultiplier = 1.0;
    if (ticketSizeMin >= 5000000) {
      ticketMultiplier = 2.2; // UHNI segment costs more to acquire
    } else if (ticketSizeMin >= 1000000) {
      ticketMultiplier = 1.6; // HNI segment
    } else if (ticketSizeMin >= 100000) {
      ticketMultiplier = 1.1; // Mass Affluent High end
    } else if (ticketSizeMin < 10000) {
      ticketMultiplier = 0.6; // Mass retail segment
    }

    // Adjust for Confidence tiers
    let confidenceMultiplier = 1.0;
    if (confidence === 'High') {
      confidenceMultiplier = 1.4;
    } else if (confidence === 'Medium') {
      confidenceMultiplier = 0.95;
    } else {
      confidenceMultiplier = 1.15;
    }

    // Purchase & Sale Cycle multipliers
    let cycleMultiplier = 1.0;
    if (purchaseCycle === 'One-time') {
      if (avgSaleCycle === '1 Day') cycleMultiplier = 0.85;
      else if (avgSaleCycle === '1 Month') cycleMultiplier = 1.25; // long cycle high-value
    } else {
      if (avgSaleCycle === '1 Month') cycleMultiplier = 1.1;
    }

    // Geographies density
    let geoMultiplier = 0;
    if (selectedGeographies.length > 0) {
      selectedGeographies.forEach(city => {
        if (city === "Mumbai" || city === "Delhi NCR") geoMultiplier += 0.35;
        else if (city === "Bengaluru" || city === "Pune") geoMultiplier += 0.25;
        else geoMultiplier += 0.18;
      });
      geoMultiplier = Math.min(geoMultiplier, 1.4);
    }

    const exclusionMultiplier = (excludeDelivered ? 0.92 : 1.0) * (excludeExisting ? 0.95 : 1.0);

    const calculatedCPL = baseCPL * categoryMultiplier * ticketMultiplier * confidenceMultiplier * cycleMultiplier * geoMultiplier * exclusionMultiplier;

    // Check for Zero Match conditions:
    let isZeroMatch = false;
    let zeroMatchReason = "";

    if (selectedCategories.length === 0) {
      isZeroMatch = true;
      zeroMatchReason = "At least one category vertical (e.g. Golf) must be selected.";
    } else if (selectedGeographies.length === 0) {
      isZeroMatch = true;
      zeroMatchReason = "At least one geography metro must be target-listed.";
    } else if (budgetPerDay <= 0) {
      isZeroMatch = true;
      zeroMatchReason = "Daily budget must be greater than ₹0.";
    } else if (ticketSizeMin > ticketSizeMax) {
      isZeroMatch = true;
      zeroMatchReason = "Minimum product ticket size cannot exceed maximum ticket size.";
    } else if (targetCAC < 300) {
      isZeroMatch = true;
      zeroMatchReason = `Target CAC of ₹${targetCAC} is below bidding threshold for modern client acquisition. Minimum allowed is ₹300.`;
    } else if (targetCAC < calculatedCPL * 0.4) {
      isZeroMatch = true;
      zeroMatchReason = `The requested target CAC of ₹${targetCAC} is too restrictive for ${productSector} with product ticket size of ₹${ticketSizeMin.toLocaleString('en-IN')}. Estimated min viable CAC is ₹${Math.round(calculatedCPL * 0.6)}.`;
    }

    if (isZeroMatch) {
      return {
        leadsPerDay: 0,
        totalLeads: 0,
        totalSpend: 0,
        isZeroMatch: true,
        zeroMatchReason
      };
    }

    // Estimate leads/day. Since Target CAC is provided, we can estimate leads based on budget and Target CAC, adjusted by how "realistic" it is
    const efficiency = Math.min(1.0, targetCAC / calculatedCPL);
    let estLeadsPerDay = (budgetPerDay / targetCAC) * efficiency;

    // Clamp
    if (estLeadsPerDay < 0.1) estLeadsPerDay = 0.1;

    let estTotalSpend = budgetPerDay * durationInDays;
    if (totalBudgetCap !== '' && totalBudgetCap > 0 && totalBudgetCap < estTotalSpend) {
      estTotalSpend = totalBudgetCap;
    }

    const estTotalLeads = Math.max(1, Math.round(estTotalSpend / targetCAC * efficiency));

    return {
      leadsPerDay: Math.round(estLeadsPerDay * 10) / 10,
      totalLeads: estTotalLeads,
      totalSpend: estTotalSpend,
      isZeroMatch: false,
      zeroMatchReason: ""
    };
  }, [
    selectedCategories,
    productSector,
    confidence,
    ticketSizeMin,
    ticketSizeMax,
    purchaseCycle,
    avgSaleCycle,
    selectedGeographies,
    excludeDelivered,
    excludeExisting,
    budgetPerDay,
    totalBudgetCap,
    durationInDays,
    targetCAC
  ]);

  // Handle Category select/deselect
  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter(c => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  // Helper to apply budget templates and default to a 30-day window
  const applyBudgetTemplate = (amount: number) => {
    setBudgetPerDay(amount);
    const today = new Date('2026-09-21'); // Aligned with metadata
    const end = new Date('2026-09-21');
    end.setDate(end.getDate() + 29); // 30 days inclusive
    
    setStartDate(today.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  // Handle Geography adding
  const addGeography = (city: string) => {
    if (!selectedGeographies.includes(city)) {
      setSelectedGeographies([...selectedGeographies, city]);
    }
    setGeoSearchQuery('');
    setGeoDropdownOpen(false);
  };

  // Handle Geography removal
  const removeGeography = (city: string) => {
    setSelectedGeographies(selectedGeographies.filter(c => c !== city));
  };

  // Handle Save
  const handleAction = (status: 'Active' | 'Draft') => {
    if (!name.trim()) {
      setNameError('Campaign name is required.');
      return;
    }
    
    onSave({
      id: 'CAMP-' + Math.floor(Math.random() * 90000 + 10000),
      name: name.trim(),
      industry: "Wealth Management",
      categories: selectedCategories,
      confidence,
      personas: derivedPersonas, // Mapped automatically
      geographies: selectedGeographies,
      excludeDelivered,
      excludeExisting,
      budgetPerDay,
      totalBudgetCap: totalBudgetCap,
      startDate,
      endDate,
      notes: notes.trim(),
      status: status === 'Active' ? (new Date(startDate) > new Date('2026-09-21') ? 'Scheduled' : 'Active') : 'Draft',
      createdAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      metrics: {
        estLeadsPerDay: forecast.leadsPerDay,
        estTotalLeads: forecast.totalLeads,
        estTotalSpend: forecast.totalSpend
      },
      currentSpend: 0,
      leadsAcquired: 0,
      owner: "Sidhartha R.",
      // Pass the new fields for detail popups / completeness
      targetCAC,
      productSector,
      ticketSizeMin,
      ticketSizeMax,
      purchaseCycle,
      avgSaleCycle
    });
  };

  return (
    <div className="space-y-6 pb-12 select-none font-sans w-full">
      {/* Visual Navigation Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-neutral-400 font-semibold mb-2">
        <span className="hover:text-neutral-700 cursor-pointer transition-colors" onClick={onCancel}>Lead Gen</span>
        <ChevronRight size={12} />
        <span className="text-neutral-900">Campaign builder</span>
      </div>

      {/* Hero Header */}
      <div className="border-b border-neutral-200/50 pb-5">
        <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Create target campaign</h2>
      </div>

      {/* Dual column workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Targeting configuration */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section A: Name & Context */}
          <div className="bg-white border border-neutral-200/60 rounded-xl p-6 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="inline-flex items-center text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">
                  <span>Campaign name</span> <span className="text-red-500 ml-1">*</span>
                  <InfoTooltip content="Provide a unique, descriptive name to identify and track this campaign inside reports and campaign list views." />
                </label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (e.target.value.trim()) setNameError('');
                  }}
                  placeholder="e.g. Zenith HNI Festives"
                  className={`w-full px-3.5 py-2 text-xs bg-neutral-50/50 border ${
                    nameError ? 'border-red-400 focus:ring-red-400/25' : 'border-neutral-200 focus:ring-[#3b82f6]/25'
                  } rounded-lg text-neutral-800 placeholder-neutral-400 font-medium focus:outline-none focus:ring-2 focus:bg-white transition-all`}
                />
                {nameError && (
                  <p className="text-[10px] text-red-500 font-bold mt-1.5 flex items-center gap-1">
                    <AlertTriangle size={11} /> {nameError}
                  </p>
                )}
              </div>

              <div>
                <label className="inline-flex items-center text-xs font-bold text-neutral-400 uppercase tracking-wide mb-1.5">
                  <span>Client industry</span>
                  <InfoTooltip content="The pre-filled client industry sector derived from onboarding private banking profiles." />
                </label>
                <div className="flex h-9 items-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#1e3a8a] bg-[#1e3a8a]/5 border border-[#1e3a8a]/10 rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1e3a8a]" />
                    Wealth Management
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section B: Filters (Targeting) */}
          <div className="bg-white border border-neutral-200/60 rounded-xl p-6 shadow-sm space-y-6">
            <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wide border-b border-neutral-100 pb-2">
              Targeting Parameters
            </h3>

            {/* Target CAC & Product Sector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="inline-flex items-center text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">
                  <span>Target CAC (₹)</span> <span className="text-red-500 ml-1">*</span>
                  <InfoTooltip content="The cost-per-acquisition target limit the client commits to upfront. Sits alongside confidence." />
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">₹</span>
                  <input 
                    type="number" 
                    value={targetCAC}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                      setTargetCAC(val);
                    }}
                    placeholder="e.g. 2500"
                    className="w-full pl-7 pr-3.5 py-2 text-xs bg-neutral-50/50 focus:bg-white border border-neutral-200 rounded-lg text-neutral-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/25 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="inline-flex items-center text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">
                  <span>Product sector</span>
                  <InfoTooltip content="Specific financial product line to target. Keeps parameters product-centric." />
                </label>
                <select
                  value={productSector}
                  onChange={(e) => setProductSector(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50/50 focus:bg-white border border-neutral-200 rounded-lg text-neutral-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/25 transition-all"
                >
                  {ALL_PRODUCT_SECTORS.map(sec => (
                    <option key={sec} value={sec}>{sec}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Confidence Segmented Control */}
            <div>
              <label className="inline-flex items-center text-xs font-bold text-neutral-700 uppercase tracking-wide mb-2.5">
                <span>Confidence tier</span>
                <InfoTooltip content="Adjust match quality precision threshold vs lead volume density. Selecting Both returns optimal balance." />
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-neutral-100/80 p-1 rounded-lg">
                {(['High', 'Medium', 'Both'] as const).map((tier) => {
                  const isSelected = confidence === tier;
                  return (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setConfidence(tier)}
                      className={`py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer select-none ${
                        isSelected 
                          ? 'bg-white text-neutral-900 shadow-sm'
                          : 'text-neutral-500 hover:text-neutral-800'
                      }`}
                    >
                      {tier}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Categories Multi-Select Chips */}
            <div>
              <label className="inline-flex items-center text-xs font-bold text-neutral-700 uppercase tracking-wide mb-2.5">
                <span>Vertical Categories Scope</span>
                <InfoTooltip content="Tag and associate matched leads showing verified affinity with these luxury/premium vertical tags." />
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer select-none active:scale-95 ${
                        isSelected 
                          ? 'bg-[#1e3a8a] text-white border-transparent shadow-sm'
                          : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ticket-size range */}
            <div>
              <label className="inline-flex items-center text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">
                <span>Product Ticket-Size Range (₹)</span>
                <InfoTooltip content="Defines boundary values of targeted products to restrict lead scopes based on cost parameters." />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">Min</span>
                  <input 
                    type="number" 
                    value={ticketSizeMin}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                      setTicketSizeMin(val);
                    }}
                    placeholder="Min Value"
                    className="w-full pl-11 pr-3.5 py-2 text-xs bg-neutral-50/50 focus:bg-white border border-neutral-200 rounded-lg text-neutral-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/25 transition-all"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">Max</span>
                  <input 
                    type="number" 
                    value={ticketSizeMax}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                      setTicketSizeMax(val);
                    }}
                    placeholder="Max Value"
                    className="w-full pl-11 pr-3.5 py-2 text-xs bg-neutral-50/50 focus:bg-white border border-neutral-200 rounded-lg text-neutral-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/25 transition-all"
                  />
                </div>
              </div>
              <p className="text-[10px] text-neutral-400 mt-1.5">
                Targeting leads interested in products priced between <strong className="text-neutral-700">₹{(ticketSizeMin / 100000).toFixed(1)} Lakhs</strong> and <strong className="text-neutral-700">₹{(ticketSizeMax / 100000).toFixed(1)} Lakhs</strong>.
              </p>
            </div>

            {/* Purchase & Avg. Sale Cycle checks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="inline-flex items-center text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">
                  <span>Purchase Cycle</span>
                  <InfoTooltip content="Sanity check parameter indicating if this is a one-time transaction or a recurring service model." />
                </label>
                <select
                  value={purchaseCycle}
                  onChange={(e) => setPurchaseCycle(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50/50 focus:bg-white border border-neutral-200 rounded-lg text-neutral-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/25 transition-all"
                >
                  <option value="One-time">One-time purchase</option>
                  <option value="Recurring subscription">Recurring subscription</option>
                </select>
              </div>

              <div>
                <label className="inline-flex items-center text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">
                  <span>Avg. Sale Cycle</span>
                  <InfoTooltip content="The average timeframe taken from initial touchpoint to final client conversion." />
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-neutral-100/80 p-1 rounded-lg">
                  {(['1 Day', '1 Week', '1 Month'] as const).map((cycle) => {
                    const isSelected = avgSaleCycle === cycle;
                    return (
                      <button
                        key={cycle}
                        type="button"
                        onClick={() => setAvgSaleCycle(cycle)}
                        className={`py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer select-none ${
                          isSelected 
                            ? 'bg-white text-neutral-900 shadow-sm'
                            : 'text-neutral-500 hover:text-neutral-800'
                        }`}
                      >
                        {cycle}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Geography Searchable multi-select */}
            <div className="relative pt-2">
              <label className="inline-flex items-center text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">
                <span>Geography Metros</span>
                <InfoTooltip content="Filter matched leads that show primary residential or transactional footprints in these major metropolitan hubs." />
              </label>
              
              {/* Selected cities tags block */}
              {selectedGeographies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {selectedGeographies.map(city => (
                    <span key={city} className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 text-xs font-bold bg-neutral-100 text-neutral-700 rounded-md border border-neutral-200/50">
                      {city}
                      <button 
                        type="button" 
                        onClick={() => removeGeography(city)}
                        className="p-0.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 rounded transition-colors"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Search Box */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input 
                  type="text"
                  placeholder="Search and add metro cities..."
                  value={geoSearchQuery}
                  onFocus={() => setGeoDropdownOpen(true)}
                  onChange={(e) => {
                    setGeoSearchQuery(e.target.value);
                    setGeoDropdownOpen(true);
                  }}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-neutral-50/50 focus:bg-white border border-neutral-200 rounded-lg text-neutral-800 placeholder-neutral-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/25 transition-all"
                />
              </div>

              {/* Search dropdown results */}
              {geoDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg z-50 py-1 max-h-48 overflow-y-auto">
                  {filteredGeographies.length > 0 ? (
                    filteredGeographies.map(city => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => addGeography(city)}
                        className="w-full text-left px-3.5 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
                      >
                        {city}
                      </button>
                    ))
                  ) : (
                    <div className="px-3.5 py-2 text-xs text-neutral-400">
                      No matching metro cities found
                    </div>
                  )}
                  {selectedGeographies.length > 0 && (
                    <div className="border-t border-neutral-100 mt-1.5 pt-1">
                      <button 
                        type="button"
                        onClick={() => setGeoDropdownOpen(false)}
                        className="w-full text-center py-1 text-[10px] font-bold text-neutral-400 hover:text-neutral-600 uppercase tracking-wider"
                      >
                        Close selector
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Exclusions Block */}
            <div className="border-t border-neutral-100 pt-5 space-y-4">
              {/* Toggle 1: Exclude Delivered */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="inline-flex items-center text-xs font-bold text-neutral-800">
                    <span>Exclude previously delivered leads</span>
                    <InfoTooltip content="Ensure 100% unique lead acquisitions by suppressing records already matched in your other active campaigns." />
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setExcludeDelivered(!excludeDelivered)}
                  className={`relative w-8 h-4.5 rounded-full transition-colors cursor-pointer focus:outline-none ${
                    excludeDelivered ? 'bg-neutral-900' : 'bg-neutral-200'
                  }`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    excludeDelivered ? 'translate-x-3.5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Toggle 2: Exclude Existing */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="inline-flex items-center text-xs font-bold text-neutral-800">
                    <span>Exclude existing customers</span>
                    <InfoTooltip content="Avoid marketing budget wastage or target collisions with established accounts already onboarded in Zenith Bank's systems." />
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setExcludeExisting(!excludeExisting)}
                  className={`relative w-8 h-4.5 rounded-full transition-colors cursor-pointer focus:outline-none ${
                    excludeExisting ? 'bg-neutral-900' : 'bg-neutral-200'
                  }`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    excludeExisting ? 'translate-x-3.5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

          </div>

          {/* Section C: Budget & Duration */}
          <div className="bg-white border border-neutral-200/60 rounded-xl p-6 shadow-sm space-y-5">
            <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wide border-b border-neutral-100 pb-2">
              Financials & Timeline
            </h3>

            {/* Budget Templates */}
            <div>
              <label className="inline-flex items-center text-xs font-bold text-neutral-700 uppercase tracking-wide mb-2.5">
                <span>Budget Templates</span>
                <InfoTooltip content="Quick shortcut templates that instantly apply a standard daily budget and default duration to a 30-day window." />
              </label>
              <div className="flex flex-wrap gap-2">
                {[5000, 10000, 25000].map((amt) => {
                  const isSelected = budgetPerDay === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => applyBudgetTemplate(amt)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer select-none active:scale-95 ${
                        isSelected
                          ? 'bg-[#10b981] text-white border-transparent shadow-sm'
                          : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900'
                      }`}
                    >
                      ₹{amt.toLocaleString('en-IN')} / day
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 1: Daily budget and Total Budget Cap */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="inline-flex items-center text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">
                  <span>Budget per day (₹)</span> <span className="text-red-500 ml-1">*</span>
                  <InfoTooltip content="Pacing budget dedicated daily to lead matches. Higher daily pacing matches larger audience sizes." />
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">₹</span>
                  <input 
                    type="number" 
                    value={budgetPerDay}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                      setBudgetPerDay(val);
                    }}
                    placeholder="Enter daily amount"
                    className="w-full pl-7 pr-3.5 py-2 text-xs bg-neutral-50/50 focus:bg-white border border-neutral-200 rounded-lg text-neutral-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/25 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="inline-flex items-center text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">
                  <span>Total budget cap (₹)</span> <span className="text-neutral-400 font-normal ml-1">(Optional)</span>
                  <InfoTooltip content="Set a maximum absolute marketing stop threshold that hard-halts lead delivery regardless of date duration limits." />
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">₹</span>
                  <input 
                    type="number" 
                    value={totalBudgetCap}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                      setTotalBudgetCap(val);
                    }}
                    placeholder="None (run dynamically)"
                    className="w-full pl-7 pr-3.5 py-2 text-xs bg-neutral-50/50 focus:bg-white border border-neutral-200 rounded-lg text-neutral-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/25 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Date range selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="inline-flex items-center text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">
                  <span>Start Date</span>
                  <InfoTooltip content="The scheduled calendar date to start campaign pacing and lead delivery." />
                </label>
                <div className="relative">
                  <Calendar size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-xs bg-neutral-50/50 focus:bg-white border border-neutral-200 rounded-lg text-neutral-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/25 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="inline-flex items-center text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">
                  <span>End Date</span>
                  <InfoTooltip content="The calendar date to conclude campaign lead acquisitions." />
                </label>
                <div className="relative">
                  <Calendar size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full pl-9 pr-3.5 py-2 text-xs bg-neutral-50/50 focus:bg-white border border-neutral-200 rounded-lg text-neutral-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/25 transition-all"
                  />
                </div>
              </div>
            </div>

            <p className="text-[10px] text-neutral-400 pt-1">
              Campaign will run for <strong className="text-neutral-700 font-bold">{durationInDays} days</strong> based on dates selected.
            </p>
          </div>

          {/* Section D: Notes */}
          <div className="bg-white border border-neutral-200/60 rounded-xl p-6 shadow-sm">
            <label className="inline-flex items-center text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">
              <span>Internal notes / objective</span>
              <InfoTooltip content="Document internal milestones, customized qualifiers, or special targeting instructions." />
            </label>
            <textarea 
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record campaign goals or target instructions here for reporting references."
              className="w-full px-3.5 py-2 text-xs bg-neutral-50/50 focus:bg-white border border-neutral-200 rounded-lg text-neutral-800 font-medium placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/25 transition-all"
            />
          </div>

        </div>

        {/* Right Column: Dynamic forecast panel (Sticky) */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-6">
          
          {/* Live Forecast Box */}
          <div className="bg-white border border-neutral-200/60 rounded-xl p-6 shadow-sm space-y-5">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#3b82f6] uppercase tracking-wider mb-1">
                <Sparkles size={13} />
                <span>Live targeting estimate</span>
              </div>
              <h3 className="text-sm font-bold text-neutral-900">Core Forecast Summary</h3>
            </div>

            {/* Zero match warning check */}
            {forecast.isZeroMatch ? (
              <div className="bg-amber-50 border border-amber-200/65 rounded-xl p-4 text-amber-900 space-y-1.5 animate-pulse">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                  <AlertTriangle size={15} />
                  <span>Zero-match targeting alert</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-700 font-medium">
                  {forecast.zeroMatchReason} Please adjust targeting criteria or increase budget per day to generate active lead matches.
                </p>
              </div>
            ) : null}

            {/* Forecaster Stats Display */}
            <div className="space-y-3 pt-1">
              {/* Stat 1 */}
              <div className="bg-neutral-50/60 border border-neutral-200/30 rounded-xl p-4 flex justify-between items-center">
                <div className="min-w-0">
                  <span className="text-[10px] text-neutral-400 block font-bold uppercase tracking-wider">
                    Est. leads / day
                  </span>
                  <span className="text-2xl font-extrabold text-neutral-800 block mt-1 tracking-tight">
                    {forecast.leadsPerDay}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center text-[#3b82f6]">
                  <Check size={18} className="stroke-[2.5]" />
                </div>
              </div>

              {/* Stat 2 */}
              <div className="bg-neutral-50/60 border border-neutral-200/30 rounded-xl p-4 flex justify-between items-center">
                <div className="min-w-0">
                  <span className="text-[10px] text-neutral-400 block font-bold uppercase tracking-wider">
                    Est. total leads
                  </span>
                  <span className="text-2xl font-extrabold text-neutral-800 block mt-1 tracking-tight">
                    {forecast.totalLeads.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#1e3a8a]/10 flex items-center justify-center text-[#1e3a8a]">
                  <Info size={18} className="stroke-[2.5]" />
                </div>
              </div>

              {/* Stat 3 */}
              <div className="bg-neutral-50/60 border border-neutral-200/30 rounded-xl p-4 flex justify-between items-center">
                <div className="min-w-0">
                  <span className="text-[10px] text-neutral-400 block font-bold uppercase tracking-wider">
                    Est. total spend
                  </span>
                  <span className="text-2xl font-extrabold text-neutral-800 block mt-1 tracking-tight">
                    ₹{forecast.totalSpend.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#10b981]/10 flex items-center justify-center text-[#10b981]">
                  <span className="font-bold text-sm">₹</span>
                </div>
              </div>
            </div>

            {/* Note info tag */}
            <div className="bg-blue-50/40 border border-blue-200/30 rounded-lg p-3 text-neutral-600 text-[10.5px] leading-relaxed">
              These estimates are computed in real-time utilizing historical engagement profiles matching Zenith's HNI target personas. Actual leads might vary slightly based on seasonal market spikes.
            </div>

            {/* CTA control actions */}
            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                disabled={forecast.isZeroMatch}
                onClick={() => handleAction('Active')}
                className={`w-full py-2.5 text-xs font-bold text-white rounded-lg shadow-sm transition-all focus:outline-none flex items-center justify-center gap-2 ${
                  forecast.isZeroMatch
                    ? 'bg-neutral-300 cursor-not-allowed text-neutral-500'
                    : 'bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-95 cursor-pointer'
                }`}
              >
                <span>Launch campaign</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction('Draft')}
                className="w-full py-2.5 text-xs font-bold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg shadow-sm transition-all focus:outline-none active:scale-95 cursor-pointer"
              >
                Save as draft
              </button>

              <button
                type="button"
                onClick={onCancel}
                className="w-full py-2 text-xs font-semibold text-neutral-400 hover:text-neutral-600 transition-colors text-center cursor-pointer"
              >
                Cancel & return
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
