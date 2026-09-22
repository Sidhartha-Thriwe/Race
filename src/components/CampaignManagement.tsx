import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Tag, 
  AlertCircle, 
  Play, 
  Pause, 
  Edit3,
  TrendingUp,
  MoreVertical,
  CheckCircle,
  HelpCircle,
  Clock,
  Download,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  X,
  ChevronRight,
  User,
  Eye,
  Info,
  Bell,
  SlidersHorizontal,
  Archive,
  AlertTriangle
} from 'lucide-react';
import { Campaign } from './CampaignBuilder';

interface CampaignManagementProps {
  campaigns: Campaign[];
  onNewCampaign: () => void;
  onUpdateStatus: (id: string, newStatus: Campaign['status']) => void;
  onUpdateCampaign?: (campaign: Campaign) => void;
  onDuplicateCampaign?: (id: string) => void;
  onArchiveCampaign?: (id: string) => void;
  onPauseAllActive?: () => void;
  onViewLeads?: (campaignId: string) => void;
  initialFilter?: 'All' | 'Outside Target' | 'Within Target';
}

export const CampaignManagement: React.FC<CampaignManagementProps> = ({ 
  campaigns, 
  onNewCampaign,
  onUpdateStatus,
  onUpdateCampaign,
  onDuplicateCampaign,
  onArchiveCampaign,
  onPauseAllActive,
  onViewLeads,
  initialFilter = 'All'
}) => {
  // State variables for searching, filtering, and sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Campaign['status'] | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [personaFilter, setPersonaFilter] = useState<string>('All');
  const [productSectorFilter, setProductSectorFilter] = useState<string>('All');
  const [ticketSizeFilter, setTicketSizeFilter] = useState<string>('All');
  const [pacingFilter, setPacingFilter] = useState<'All' | 'Outside Target' | 'Within Target'>(initialFilter);
  const [dateFilter, setDateFilter] = useState<'All' | 'Active Now' | 'Future' | 'Completed'>('All');

  // Sync initialFilter when it changes from props
  useEffect(() => {
    if (initialFilter) {
      setPacingFilter(initialFilter);
    }
  }, [initialFilter]);
  
  const [sortField, setSortField] = useState<keyof Campaign | 'spend' | 'leads'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Multi-row selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Slide-out Drawer state
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [drawerTab, setDrawerTab] = useState<'overview' | 'charts' | 'history' | 'edit'>('overview');

  // Inline edit inputs
  const [editName, setEditName] = useState('');
  const [editBudgetPerDay, setEditBudgetPerDay] = useState<number>(0);
  const [editTotalBudgetCap, setEditTotalBudgetCap] = useState<number | ''>('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editTargetCAC, setEditTargetCAC] = useState<number>(2500);
  const [editSuccessToast, setEditSuccessToast] = useState(false);

  // Bulk operation notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Emergency Pause Confirmation state
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);

  // Notification Banner State (Auto-pause alert)
  const [showAutoPauseBanner, setShowAutoPauseBanner] = useState(true);

  // Clear toast after 4 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Set inline form fields when campaign is selected in drawer
  useEffect(() => {
    if (selectedCampaign) {
      setEditName(selectedCampaign.name);
      setEditBudgetPerDay(selectedCampaign.budgetPerDay);
      setEditTotalBudgetCap(selectedCampaign.totalBudgetCap);
      setEditEndDate(selectedCampaign.endDate);
      setEditTargetCAC(selectedCampaign.targetCAC || 2500);
      setEditSuccessToast(false);
    }
  }, [selectedCampaign]);

  // Auto-pause calculation logic
  const autoPausedCampaigns = useMemo(() => {
    return campaigns.filter(camp => {
      const isExhausted = camp.totalBudgetCap && camp.currentSpend && camp.currentSpend >= camp.totalBudgetCap;
      const isCompletedDate = new Date(camp.endDate) < new Date();
      return (isExhausted || isCompletedDate) && camp.status === 'Completed';
    });
  }, [campaigns]);

  // Unique categories & personas across all campaigns for filter dropdowns
  const uniqueCategories = useMemo(() => {
    const list = new Set<string>();
    campaigns.forEach(c => c.categories.forEach(cat => list.add(cat)));
    return Array.from(list);
  }, [campaigns]);

  const uniquePersonas = useMemo(() => {
    const list = new Set<string>();
    campaigns.forEach(c => c.personas.forEach(p => list.add(p)));
    return Array.from(list);
  }, [campaigns]);

  const uniqueProductSectors = useMemo(() => {
    const list = new Set<string>();
    campaigns.forEach(c => {
      if (c.productSector) {
        list.add(c.productSector);
      }
    });
    return Array.from(list);
  }, [campaigns]);

  // Sorting columns helper
  const handleSort = (field: keyof Campaign | 'spend' | 'leads') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Main Filter & Sort Pipeline
  const filteredCampaigns = useMemo(() => {
    let result = campaigns.filter(camp => {
      // 1. Search Query Match (Name, Categories, ID)
      const matchesSearch = 
        camp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        camp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        camp.categories.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));

      // 2. Status Filter Match
      const matchesStatus = statusFilter === 'All' || camp.status === statusFilter;

      // 3. Category Filter Match
      const matchesCategory = categoryFilter === 'All' || camp.categories.includes(categoryFilter);

      // 4. Persona Filter Match
      const matchesPersona = personaFilter === 'All' || camp.personas.includes(personaFilter);

      // 4.1 Product Sector Filter Match
      const matchesProductSector = productSectorFilter === 'All' || camp.productSector === productSectorFilter;

      // 4.2 Ticket Size Filter Match
      let matchesTicketSize = true;
      if (ticketSizeFilter !== 'All') {
        const minVal = camp.ticketSizeMin || 0;
        const maxVal = camp.ticketSizeMax || 999999999;
        if (ticketSizeFilter === 'Below 5L') {
          matchesTicketSize = minVal < 500000;
        } else if (ticketSizeFilter === '5L to 20L') {
          matchesTicketSize = minVal >= 500000 && minVal <= 2000000;
        } else if (ticketSizeFilter === 'Above 20L') {
          matchesTicketSize = maxVal > 2000000;
        }
      }

      // 4.3 Pacing Filter Match
      let matchesPacing = true;
      if (pacingFilter !== 'All') {
        const targetCAC = camp.targetCAC || 2500;
        const leadsAcquired = camp.leadsAcquired || 0;
        const currentSpend = camp.currentSpend || 0;
        const actualCPL = leadsAcquired > 0 ? Math.round(currentSpend / leadsAcquired) : 0;
        if (pacingFilter === 'Outside Target') {
          matchesPacing = leadsAcquired > 0 && actualCPL > targetCAC;
        } else if (pacingFilter === 'Within Target') {
          matchesPacing = leadsAcquired === 0 || actualCPL <= targetCAC;
        }
      }

      // 5. Date Filter Match
      let matchesDate = true;
      const now = new Date();
      const start = new Date(camp.startDate);
      const end = new Date(camp.endDate);
      if (dateFilter === 'Active Now') {
        matchesDate = now >= start && now <= end;
      } else if (dateFilter === 'Future') {
        matchesDate = now < start;
      } else if (dateFilter === 'Completed') {
        matchesDate = now > end;
      }

      return matchesSearch && matchesStatus && matchesCategory && matchesPersona && matchesProductSector && matchesTicketSize && matchesDate && matchesPacing;
    });

    // Sort Pipeline
    result.sort((a, b) => {
      let aVal: any = a[sortField as keyof Campaign];
      let bVal: any = b[sortField as keyof Campaign];

      if (sortField === 'spend') {
        aVal = a.currentSpend || 0;
        bVal = b.currentSpend || 0;
      } else if (sortField === 'leads') {
        aVal = a.leadsAcquired || 0;
        bVal = b.leadsAcquired || 0;
      }

      if (aVal === undefined || aVal === '') return 1;
      if (bVal === undefined || bVal === '') return -1;

      if (typeof aVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      } else {
        return sortOrder === 'asc' 
          ? (aVal as number) - (bVal as number) 
          : (bVal as number) - (aVal as number);
      }
    });

    return result;
  }, [campaigns, searchQuery, statusFilter, categoryFilter, personaFilter, productSectorFilter, ticketSizeFilter, dateFilter, sortField, sortOrder]);

  // Bulk checkbox handlers
  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const ids = filteredCampaigns.map(c => c.id);
      setSelectedIds(new Set(ids));
    } else {
      setSelectedIds(new Set());
    }
  };

  // Bulk Actions
  const handleBulkPause = () => {
    let count = 0;
    selectedIds.forEach(id => {
      const target = campaigns.find(c => c.id === id);
      if (target && (target.status === 'Active' || target.status === 'Scheduled')) {
        onUpdateStatus(id, 'Paused');
        count++;
      }
    });
    setToastMessage(`Bulk Action: Paused ${count} active campaign(s).`);
    setSelectedIds(new Set());
  };

  const handleBulkExport = () => {
    // Generate simple dynamic CSV representation
    const exportCount = selectedIds.size > 0 ? selectedIds.size : filteredCampaigns.length;
    const targets = selectedIds.size > 0 
      ? campaigns.filter(c => selectedIds.has(c.id))
      : filteredCampaigns;

    const headers = ["Campaign ID", "Name", "Status", "Daily Budget (INR)", "Total Budget Cap (INR)", "Spent To Date (INR)", "Leads Acquired", "Owner"];
    const rows = targets.map(c => [
      c.id,
      c.name,
      c.status,
      c.budgetPerDay,
      c.totalBudgetCap || 'No Cap',
      c.currentSpend || 0,
      c.leadsAcquired || 0,
      c.owner || 'Sidhartha R.'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `zenith_campaigns_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage(`Successfully exported ${exportCount} campaigns to CSV format.`);
    setSelectedIds(new Set());
  };

  // Emergency Pause Trigger
  const handleEmergencyPauseAll = () => {
    if (onPauseAllActive) {
      onPauseAllActive();
      setToastMessage("CRITICAL METRIC TRIGGER: Emergency shut-off executed. All Active campaigns paused.");
      setShowEmergencyConfirm(false);
      // If selected campaign was Active, sync its status to Paused
      if (selectedCampaign && selectedCampaign.status === 'Active') {
        setSelectedCampaign({ ...selectedCampaign, status: 'Paused' });
      }
    }
  };

  // Inline Pacing Mathematics Recalculator for the Drawer Edits
  const handleSaveInlineEdit = () => {
    if (!selectedCampaign || !onUpdateCampaign) return;

    if (!editName.trim()) return;

    // Recalculate estimated performance metrics based on modified budget/dates
    const start = new Date(selectedCampaign.startDate);
    const end = new Date(editEndDate);
    const durationInDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    
    let baseCPL = 350;
    if (selectedCampaign.categories.includes("Wealth Advisory")) baseCPL = 500;
    else if (selectedCampaign.categories.includes("Credit Cards")) baseCPL = 380;
    
    let personaMultiplier = 1.0;
    if (selectedCampaign.personas.length > 0) {
      let sumMultiplier = 0;
      if (selectedCampaign.personas.includes("Mass affluent")) sumMultiplier += 1.2;
      if (selectedCampaign.personas.includes("HNI")) sumMultiplier += 0.8;
      if (selectedCampaign.personas.includes("UHNI")) sumMultiplier += 0.4;
      personaMultiplier = sumMultiplier / selectedCampaign.personas.length;
    }
    
    let geoMultiplier = 0;
    if (selectedCampaign.geographies.length > 0) {
      selectedCampaign.geographies.forEach(city => {
        if (city === "Mumbai" || city === "Delhi NCR") geoMultiplier += 0.3;
        else if (city === "Bengaluru" || city === "Pune") geoMultiplier += 0.2;
        else geoMultiplier += 0.15;
      });
      geoMultiplier = Math.min(geoMultiplier, 1.2);
    } else {
      geoMultiplier = 1.0;
    }
    
    const exclusionMultiplier = (selectedCampaign.excludeDelivered ? 0.92 : 1.0) * (selectedCampaign.excludeExisting ? 0.95 : 1.0);
    let estLeadsPerDay = (editBudgetPerDay / baseCPL) * personaMultiplier * geoMultiplier * exclusionMultiplier;
    if (estLeadsPerDay < 0.1) estLeadsPerDay = 0.1;
    
    let estTotalSpend = editBudgetPerDay * durationInDays;
    if (editTotalBudgetCap !== '' && editTotalBudgetCap > 0 && editTotalBudgetCap < estTotalSpend) {
      estTotalSpend = editTotalBudgetCap;
    }
    const estTotalLeads = Math.round(estTotalSpend / baseCPL * personaMultiplier * geoMultiplier * exclusionMultiplier);

    const updated: Campaign = {
      ...selectedCampaign,
      name: editName.trim(),
      budgetPerDay: editBudgetPerDay,
      totalBudgetCap: editTotalBudgetCap,
      endDate: editEndDate,
      targetCAC: editTargetCAC,
      metrics: {
        estLeadsPerDay: Math.round(estLeadsPerDay * 10) / 10,
        estTotalLeads: estTotalLeads > 0 ? estTotalLeads : 1,
        estTotalSpend: estTotalSpend
      }
    };

    onUpdateCampaign(updated);
    setSelectedCampaign(updated);
    setEditSuccessToast(true);
    setTimeout(() => setEditSuccessToast(false), 3000);
  };

  // Status badge UI component
  const getStatusBadge = (status: Campaign['status']) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/50 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        );
      case 'Scheduled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-blue-800 bg-blue-50 border border-blue-200/50 rounded-full">
            <Clock size={11} className="text-blue-500" />
            Scheduled
          </span>
        );
      case 'Paused':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200/40 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Paused
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-purple-800 bg-purple-50 border border-purple-200/50 rounded-full">
            <CheckCircle size={11} className="text-purple-500" />
            Completed
          </span>
        );
      case 'Draft':
        default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-neutral-500 bg-neutral-100 border border-neutral-200/50 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
            Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-24 select-none font-sans w-full max-w-full">
      
      {/* 1. AUTO-PAUSE ADVISORY NOTIFICATION BANNER */}
      {showAutoPauseBanner && autoPausedCampaigns.length > 0 && (
        <div className="bg-amber-50/90 backdrop-blur-sm border border-amber-200 rounded-xl p-4.5 flex items-start gap-3 shadow-sm relative overflow-hidden transition-all animate-fade-in">
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-500" />
          <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-amber-900 flex items-center gap-2">
              <span>Auto-Pause Advisory Monitor</span>
              <span className="bg-amber-100 text-amber-800 font-mono text-[9px] px-1.5 py-0.2 rounded font-bold">Client Notified</span>
            </h4>
            <p className="text-amber-700 font-medium mt-1 leading-relaxed">
              System detected that <strong className="font-bold">{autoPausedCampaigns.map(c => c.name).join(', ')}</strong> reached its total budget cap or exceeded its designated end date. Systems gracefully suspended lead injections and updated status to <strong>Completed</strong> to prevent over-delivery.
            </p>
          </div>
          <button 
            onClick={() => setShowAutoPauseBanner(false)}
            className="text-amber-400 hover:text-amber-600 transition-colors p-1"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 2. TOAST ALERTS */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 z-50 animate-bounce-in max-w-md text-center">
          <CheckCircle className="text-emerald-400" size={14} />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-neutral-400 hover:text-white ml-2">
            <X size={12} />
          </button>
        </div>
      )}

      {/* 3. EMERGENCY PAUSE CONFIRMATION MODAL */}
      {showEmergencyConfirm && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle size={24} className="shrink-0" />
              <h3 className="text-lg font-bold tracking-tight text-neutral-900">Execute Emergency Campaign Pause?</h3>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed font-medium">
              This action triggers an immediate API-level pause on <strong>every active campaign</strong> currently running for Zenith Private Bank. Pacing engines, bid structures, and lead delivery channels will freeze instantly.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowEmergencyConfirm(false)}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleEmergencyPauseAll}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
              >
                <Pause size={13} />
                <span>Pause All Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. DASHBOARD HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-b border-neutral-200/50">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2.5">
            <span>Campaign management</span>
            <span className="bg-blue-50 text-blue-700 font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-blue-100">
              {campaigns.length} Total
            </span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1 font-medium">
            Configure, sort, pause, and review elite targeting formulas across Zenith.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          {/* Emergency Pause All trigger */}
          <button
            onClick={() => setShowEmergencyConfirm(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 active:scale-95 rounded-lg transition-all cursor-pointer shadow-sm"
          >
            <AlertCircle size={13} />
            <span>Pause All Campaigns</span>
          </button>

          {/* New Campaign button */}
          <button 
            onClick={onNewCampaign}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold bg-[#1e40af] hover:bg-[#1d4ed8] active:scale-95 text-white rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>New campaign</span>
          </button>
        </div>
      </div>

      {/* 5. MULTI-FILTER & SEARCH TOOLBAR (Premium spacing, beautiful grid) */}
      <div className="bg-white border border-neutral-200/60 rounded-xl p-4 shadow-sm space-y-4">
        
        {/* Row A: Status Filters & Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Status Tab Group */}
          <div className="flex flex-wrap items-center gap-1 bg-neutral-100 p-1 rounded-lg">
            {(['All', 'Active', 'Scheduled', 'Paused', 'Completed', 'Draft'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === status 
                    ? 'bg-white text-neutral-900 shadow-sm' 
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Search bar input with custom placeholder */}
          <div className="relative w-full lg:w-80">
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input 
              type="text"
              placeholder="Search campaigns by name, ID, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2 text-xs bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white border border-neutral-200 rounded-lg text-neutral-800 placeholder-neutral-400 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
            />
          </div>

        </div>

        {/* Row B: Advanced Dropdown Filters (Category, Persona, Date range filters) */}
        <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center gap-3 text-xs">
          
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={12} className="text-neutral-400" />
            <span className="font-bold text-neutral-400 text-[11px] uppercase tracking-wider">Advanced Filters:</span>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400 font-semibold">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-neutral-50 border border-neutral-200 text-neutral-700 font-semibold rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/10 transition-all"
            >
              <option value="All">All Categories</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Product Sector Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400 font-semibold">Product Sector:</span>
            <select
              value={productSectorFilter}
              onChange={(e) => setProductSectorFilter(e.target.value)}
              className="bg-neutral-50 border border-neutral-200 text-neutral-700 font-semibold rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/10 transition-all"
            >
              <option value="All">All Sectors</option>
              {uniqueProductSectors.map(sec => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
          </div>

          {/* Ticket Size Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400 font-semibold">Ticket Size:</span>
            <select
              value={ticketSizeFilter}
              onChange={(e) => setTicketSizeFilter(e.target.value)}
              className="bg-neutral-50 border border-neutral-200 text-neutral-700 font-semibold rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/10 transition-all"
            >
              <option value="All">All Sizes</option>
              <option value="Below 5L">Below 5L</option>
              <option value="5L to 20L">5L to 20L</option>
              <option value="Above 20L">Above 20L</option>
            </select>
          </div>

          {/* Persona Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400 font-semibold">Wealth Tier:</span>
            <select
              value={personaFilter}
              onChange={(e) => setPersonaFilter(e.target.value)}
              className="bg-neutral-50 border border-neutral-200 text-neutral-700 font-semibold rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/10 transition-all"
            >
              <option value="All">All Personas</option>
              {uniquePersonas.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* CPL Pacing Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400 font-semibold">CPL Pacing:</span>
            <select
              value={pacingFilter}
              onChange={(e) => setPacingFilter(e.target.value as any)}
              className="bg-neutral-50 border border-neutral-200 text-neutral-700 font-semibold rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/10 transition-all"
            >
              <option value="All">All Pacing</option>
              <option value="Within Target">Within Target</option>
              <option value="Outside Target">Outside Target</option>
            </select>
          </div>

          {/* Date Picker Range Filter preset */}
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400 font-semibold">Pacing Period:</span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="bg-neutral-50 border border-neutral-200 text-neutral-700 font-semibold rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/10 transition-all"
            >
              <option value="All">All Dates</option>
              <option value="Active Now">Active (Running Today)</option>
              <option value="Future">Scheduled (Not Started)</option>
              <option value="Completed">Lapsed (Completed)</option>
            </select>
          </div>

          {/* Reset Filters Trigger */}
          {(categoryFilter !== 'All' || personaFilter !== 'All' || productSectorFilter !== 'All' || ticketSizeFilter !== 'All' || pacingFilter !== 'All' || dateFilter !== 'All' || searchQuery !== '' || statusFilter !== 'All') && (
            <button
              onClick={() => {
                setCategoryFilter('All');
                setPersonaFilter('All');
                setProductSectorFilter('All');
                setTicketSizeFilter('All');
                setPacingFilter('All');
                setDateFilter('All');
                setSearchQuery('');
                setStatusFilter('All');
              }}
              className="text-blue-600 hover:text-blue-800 font-bold ml-auto flex items-center gap-1 text-[11px] hover:underline cursor-pointer"
            >
              <X size={12} />
              <span>Clear filters</span>
            </button>
          )}

        </div>

      </div>

      {/* 6. MAIN CAMPAIGN TABLE VIEW */}
      <div className="bg-white border border-neutral-200/60 rounded-xl shadow-sm overflow-hidden relative">
        
        {filteredCampaigns.length > 0 ? (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50/70 border-b border-neutral-100 text-neutral-400 font-bold text-[10px] uppercase tracking-wider select-none">
                  
                  {/* Bulk Select Box */}
                  <th className="pl-6 pr-2 py-4 text-center w-10">
                    <input 
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={filteredCampaigns.length > 0 && selectedIds.size === filteredCampaigns.length}
                      className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 accent-blue-600 cursor-pointer"
                    />
                  </th>

                  <th className="px-5 py-4 font-bold cursor-pointer hover:text-neutral-700 transition-colors" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">
                      <span>Campaign Profile</span>
                      {sortField === 'name' && (sortOrder === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
                    </div>
                  </th>

                  <th className="px-5 py-4 font-bold cursor-pointer hover:text-neutral-700 transition-colors" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-1">
                      <span>Status</span>
                      {sortField === 'status' && (sortOrder === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
                    </div>
                  </th>

                  <th className="px-5 py-4 font-bold text-left">
                    <span>Category & Product</span>
                  </th>

                  <th className="px-5 py-4 font-bold text-left">
                    <span>Ticket Range</span>
                  </th>

                  <th className="px-5 py-4 font-bold cursor-pointer hover:text-neutral-700 transition-colors" onClick={() => handleSort('budgetPerDay')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>Budget/Day</span>
                      {sortField === 'budgetPerDay' && (sortOrder === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
                    </div>
                  </th>

                  <th className="px-5 py-4 font-bold text-left">
                    <span>Target CAC Pacing</span>
                  </th>

                  <th className="px-5 py-4 font-bold text-left cursor-pointer hover:text-neutral-700 transition-colors" onClick={() => handleSort('spend')}>
                    <div className="flex items-center gap-1 justify-center">
                      <span>Spend Pacing (Vs. Cap)</span>
                      {sortField === 'spend' && (sortOrder === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
                    </div>
                  </th>

                  <th className="px-5 py-4 font-bold text-center cursor-pointer hover:text-neutral-700 transition-colors" onClick={() => handleSort('leads')}>
                    <div className="flex items-center gap-1 justify-center">
                      <span>Leads acquired</span>
                      {sortField === 'leads' && (sortOrder === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
                    </div>
                  </th>

                  <th className="px-5 py-4 font-bold text-right cursor-pointer hover:text-neutral-700 transition-colors" onClick={() => handleSort('endDate')}>
                    <div className="flex items-center gap-1 justify-end">
                      <span>Timeline & Owner</span>
                      {sortField === 'endDate' && (sortOrder === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
                    </div>
                  </th>

                  <th className="px-6 py-4 font-bold text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredCampaigns.map((camp) => {
                  // Percentage pacing maths
                  const totalCap = camp.totalBudgetCap || 0;
                  const currentSpend = camp.currentSpend || 0;
                  const pacingPct = totalCap > 0 ? Math.min(100, Math.round((currentSpend / totalCap) * 100)) : 0;
                  
                  // Color coding for pacing bar
                  let pacingBarColor = 'bg-blue-600';
                  if (camp.status === 'Completed') pacingBarColor = 'bg-purple-500';
                  else if (pacingPct >= 90) pacingBarColor = 'bg-red-500';
                  else if (pacingPct >= 75) pacingBarColor = 'bg-amber-500';

                  // Estimated vs actual leads acquired
                  const leadsAcquired = camp.leadsAcquired || 0;
                  const estTotalLeads = camp.metrics.estTotalLeads || 1;
                  const leadPct = Math.min(100, Math.round((leadsAcquired / estTotalLeads) * 100));

                  const isChecked = selectedIds.has(camp.id);

                  // Target CAC actual CPL pacing maths
                  const targetCAC = camp.targetCAC || 2500;
                  const actualCPL = leadsAcquired > 0 ? Math.round(currentSpend / leadsAcquired) : 0;
                  
                  let cacStatusColor = "text-neutral-500 bg-neutral-50 border-neutral-200/50";
                  let indicatorDot = "bg-neutral-400";
                  let statusLabel = "N/A (No leads)";

                  if (leadsAcquired > 0) {
                    if (actualCPL > targetCAC * 1.15) {
                      cacStatusColor = "text-red-700 bg-red-50 border-red-200";
                      indicatorDot = "bg-red-500 animate-pulse";
                      statusLabel = "Target Exceeded";
                    } else if (actualCPL > targetCAC) {
                      cacStatusColor = "text-amber-700 bg-amber-50 border-amber-200";
                      indicatorDot = "bg-amber-500";
                      statusLabel = "At Risk";
                    } else {
                      cacStatusColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
                      indicatorDot = "bg-emerald-500";
                      statusLabel = "On Target";
                    }
                  }

                  return (
                    <tr 
                      key={camp.id} 
                      className={`hover:bg-neutral-50/40 transition-all ${isChecked ? 'bg-blue-50/20' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="pl-6 pr-2 py-4.5 text-center whitespace-nowrap">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectRow(camp.id)}
                          className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 accent-blue-600 cursor-pointer"
                        />
                      </td>

                      {/* Name & Profile Details */}
                      <td className="px-5 py-4.5 min-w-[200px]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span 
                              onClick={() => { setSelectedCampaign(camp); setDrawerTab('overview'); }}
                              className="font-bold text-neutral-800 text-[13.5px] hover:text-blue-600 hover:underline cursor-pointer transition-colors"
                            >
                              {camp.name}
                            </span>
                            <span className="text-[9.5px] font-mono bg-neutral-100 text-neutral-500 px-1.5 py-0.3 rounded border border-neutral-200/50">
                              {camp.id}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-1 text-[10.5px] text-neutral-400 font-semibold">
                            <span className="text-neutral-500">{camp.industry}</span>
                            <span>&bull;</span>
                            <div className="flex gap-1">
                              {camp.personas.map(p => (
                                <span key={p} className="bg-neutral-100 text-neutral-600 text-[9px] px-1 py-0.2 rounded font-bold font-sans">
                                  {p}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="px-5 py-4.5 whitespace-nowrap">
                        {getStatusBadge(camp.status)}
                      </td>

                      {/* Category & Product Sector Column */}
                      <td className="px-5 py-4.5 min-w-[140px]">
                        <div className="space-y-1">
                          <span className="font-bold text-neutral-800 text-[11.5px]">
                            {camp.productSector || 'Wealth Advisory'}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {camp.categories.map(c => (
                              <span key={c} className="bg-blue-50 text-blue-600 text-[9px] px-1.5 py-0.2 rounded border border-blue-100/40 font-bold">
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* Ticket Range & Confidence */}
                      <td className="px-5 py-4.5 min-w-[130px]">
                        <div className="space-y-1">
                          <span className="font-bold text-neutral-700 text-xs">
                            {camp.ticketSizeMin !== undefined ? `₹${(camp.ticketSizeMin / 100000).toFixed(1)}L - ₹${((camp.ticketSizeMax || 0) / 100000).toFixed(1)}L` : '₹10.0L - ₹50.0L'}
                          </span>
                          <span className="text-[9.5px] text-neutral-400 block font-medium">
                            Conf: <strong className="font-bold text-neutral-500">{camp.confidence}</strong>
                          </span>
                        </div>
                      </td>

                      {/* Daily Budget */}
                      <td className="px-5 py-4.5 text-right font-bold text-neutral-700 whitespace-nowrap text-xs">
                        ₹{camp.budgetPerDay.toLocaleString('en-IN')}
                        <span className="text-[10px] text-neutral-400 font-medium block mt-0.5">/ day</span>
                      </td>

                      {/* Target CAC Pacing Indicator Column */}
                      <td className="px-5 py-4.5 min-w-[150px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10.5px] font-semibold text-neutral-700">
                            <span>Target: <strong className="font-bold">₹{targetCAC.toLocaleString('en-IN')}</strong></span>
                          </div>
                          
                          {/* Cost per lead badge pacing */}
                          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold ${cacStatusColor}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${indicatorDot}`} />
                            <span>{leadsAcquired > 0 ? `Actual CPL: ₹${actualCPL.toLocaleString('en-IN')}` : 'No leads yet'}</span>
                          </div>

                          <div className="text-[9.5px] text-neutral-400 font-medium flex items-center justify-between">
                            <span>Status: {statusLabel}</span>
                          </div>
                        </div>
                      </td>

                      {/* SPEND VS CAP INLINE SPEND PACING BAR */}
                      <td className="px-5 py-4.5 text-left min-w-[180px] max-w-[220px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-700">
                            <span>₹{(currentSpend / 1000).toFixed(0)}k spent</span>
                            <span className="text-neutral-400">
                              of {totalCap ? `₹${(totalCap / 1000).toFixed(0)}k` : 'No cap'}
                            </span>
                          </div>
                          
                          {/* Progress Pacing bar element */}
                          <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden border border-neutral-200/20">
                            <div 
                              className={`${pacingBarColor} h-full rounded-full transition-all duration-500`}
                              style={{ width: `${totalCap > 0 ? pacingPct : 0}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400">
                            <span>Pacing pacing</span>
                            <span className={pacingPct >= 90 ? 'text-red-500 font-extrabold' : 'text-neutral-500'}>
                              {pacingPct}% cap reached
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* LEADS ACQUIRED VS FORECAST */}
                      <td className="px-5 py-4.5 text-center whitespace-nowrap">
                        <div className="inline-block text-center space-y-1">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="font-extrabold text-[#1e40af] text-sm">
                              {leadsAcquired}
                            </span>
                            <span className="text-neutral-300 font-light">/</span>
                            <span className="text-neutral-400 text-xs font-semibold">
                              {estTotalLeads} est.
                            </span>
                          </div>

                          {/* Mini micro progress lead bar */}
                          <div className="w-20 bg-neutral-100 h-1 rounded-full mx-auto overflow-hidden">
                            <div 
                              className="bg-blue-600 h-full rounded-full transition-all"
                              style={{ width: `${leadPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* TIMELINE & OWNER */}
                      <td className="px-5 py-4.5 text-right whitespace-nowrap text-[11.5px]">
                        <div className="font-bold text-neutral-800 flex items-center justify-end gap-1.5">
                          <User size={11} className="text-neutral-400" />
                          <span>{camp.owner || 'Sidhartha R.'}</span>
                        </div>
                        <div className="text-[10px] text-neutral-400 font-medium mt-1">
                          Till {new Date(camp.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </div>
                      </td>

                      {/* QUICK ACTION BUTTONS */}
                      <td className="px-6 py-4.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          
                          {/* Toggle Active/Pause */}
                          {camp.status === 'Active' ? (
                            <button
                              onClick={() => {
                                onUpdateStatus(camp.id, 'Paused');
                                setToastMessage(`Campaign "${camp.name}" has been paused.`);
                              }}
                              title="Pause Campaign"
                              className="p-1.5 bg-neutral-100 hover:bg-amber-50 hover:text-amber-700 text-neutral-600 rounded-lg transition-colors cursor-pointer"
                            >
                              <Pause size={12} />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                // If Completed, prevent starting or reset
                                if (camp.status === 'Completed') {
                                  setToastMessage(`Cannot activate Completed campaign. Modify end date or budget first.`);
                                  return;
                                }
                                onUpdateStatus(camp.id, 'Active');
                                setToastMessage(`Campaign "${camp.name}" is now active and running.`);
                              }}
                              title="Resume/Start Campaign"
                              className={`p-1.5 text-neutral-600 rounded-lg transition-colors cursor-pointer ${
                                camp.status === 'Completed' 
                                  ? 'bg-neutral-50 text-neutral-300 cursor-not-allowed' 
                                  : 'bg-neutral-100 hover:bg-emerald-50 hover:text-emerald-700'
                              }`}
                            >
                              <Play size={12} />
                            </button>
                          )}

                          {/* Drawer View Detail Edit CTA */}
                          <button
                            onClick={() => {
                              setSelectedCampaign(camp);
                              setDrawerTab('overview');
                            }}
                            title="Configure targeting rules"
                            className="p-1.5 bg-neutral-100 hover:bg-blue-50 hover:text-blue-700 text-neutral-600 rounded-lg transition-all cursor-pointer"
                          >
                            <SlidersHorizontal size={12} />
                          </button>

                          {/* View Leads CTA */}
                          <button
                            onClick={() => {
                              if (onViewLeads) {
                                onViewLeads(camp.id);
                              }
                            }}
                            title="View acquired leads"
                            className="p-1.5 bg-neutral-100 hover:bg-blue-50 hover:text-blue-700 text-neutral-600 rounded-lg transition-all cursor-pointer"
                          >
                            <Eye size={12} />
                          </button>

                          {/* Dropdown triggers for Duplicate / Archive */}
                          <div className="relative group inline-block">
                            <button
                              className="p-1.5 hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 rounded-lg transition-colors cursor-pointer"
                            >
                              <MoreVertical size={12} />
                            </button>

                            {/* Hover Dropdown panel */}
                            <div className="absolute right-0 top-full mt-1 hidden group-hover:block w-36 bg-white border border-neutral-200 rounded-lg shadow-xl py-1 z-30 text-left">
                              <button
                                onClick={() => {
                                  if (onDuplicateCampaign) {
                                    onDuplicateCampaign(camp.id);
                                    setToastMessage(`Campaign "${camp.name}" duplicated successfully.`);
                                  }
                                }}
                                className="w-full px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                              >
                                <Copy size={11} className="text-neutral-400" />
                                <span>Duplicate</span>
                              </button>
                              
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to archive "${camp.name}"?`)) {
                                    if (onArchiveCampaign) {
                                      onArchiveCampaign(camp.id);
                                      setToastMessage(`Campaign "${camp.name}" archived.`);
                                      if (selectedCampaign?.id === camp.id) setSelectedCampaign(null);
                                    }
                                  }
                                }}
                                className="w-full px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-neutral-100"
                              >
                                <Archive size={11} className="text-red-400" />
                                <span>Archive</span>
                              </button>
                            </div>
                          </div>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty Search Filter State */
          <div className="text-center py-16 px-6">
            <div className="w-12 h-12 bg-neutral-50 border border-neutral-200/60 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search className="text-neutral-300" size={18} />
            </div>
            <h3 className="text-sm font-bold text-neutral-800">No matching Zenith campaigns found</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto font-semibold">
              There are no matching parameters for "{searchQuery}". Try clearing filters, refining your terms, or building a new target campaign profile.
            </p>
            <button
              onClick={() => {
                setCategoryFilter('All');
                setPersonaFilter('All');
                setDateFilter('All');
                setStatusFilter('All');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-lg shadow-sm transition-all"
            >
              Reset Search Filter
            </button>
          </div>
        )}

      </div>

      {/* 7. FLOATING BULK ACTIONS ACTION BAR (Appears gracefully when >= 1 checkbox checked) */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-6 right-6 lg:left-72 lg:right-12 bg-white border-2 border-blue-600 text-neutral-900 rounded-xl px-5 py-4.5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 z-40 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-blue-700">
              <Tag size={15} />
            </div>
            <div>
              <span className="font-extrabold text-neutral-900 text-[13px] block">
                {selectedIds.size} Campaign{selectedIds.size > 1 ? 's' : ''} Selected
              </span>
              <span className="text-[10px] text-neutral-400 font-bold block mt-0.5">
                Bulk adjustments to pricing models & distribution rules.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Clear selection */}
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3.5 py-2 text-xs font-bold text-neutral-500 hover:text-neutral-800 transition-colors"
            >
              Deselect All
            </button>

            {/* Bulk Pause */}
            <button
              onClick={handleBulkPause}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Pause size={12} />
              <span>Bulk Pause</span>
            </button>

            {/* Bulk Export */}
            <button
              onClick={handleBulkExport}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Download size={12} />
              <span>Export CSV Data</span>
            </button>
          </div>
        </div>
      )}

      {/* 8. SLIDE-OUT CAMPAIGN DETAIL & INTERACTIVE EDITS DRAWER */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs flex justify-end z-[500] animate-fade-in select-none">
          {/* Backdrop Closer */}
          <div className="absolute inset-0 cursor-pointer" onClick={() => setSelectedCampaign(null)} />

          {/* Drawer container (slides beautifully) */}
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl border-l border-neutral-200 flex flex-col z-10 animate-slide-left overflow-y-auto">
            
            {/* Drawer Header */}
            <div className="p-5.5 border-b border-neutral-100 flex items-start justify-between bg-neutral-50/70">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold font-mono text-neutral-400 bg-neutral-100 border border-neutral-200/50 px-2 py-0.5 rounded">
                    {selectedCampaign.id}
                  </span>
                  {getStatusBadge(selectedCampaign.status)}
                </div>
                <h3 className="text-base font-extrabold text-neutral-900 tracking-tight leading-snug">
                  {selectedCampaign.name}
                </h3>
                <p className="text-[11px] text-neutral-400 font-semibold">
                  Campaign Owner: <strong className="text-neutral-600 font-bold">{selectedCampaign.owner || 'Sidhartha R.'}</strong> &bull; Created on {selectedCampaign.createdAt}
                </p>
              </div>

              <button 
                onClick={() => setSelectedCampaign(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Navigation Tabs */}
            <div className="px-5 border-b border-neutral-100 flex items-center gap-1.5 bg-white select-none">
              {(['overview', 'charts', 'history', 'edit'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setDrawerTab(tab)}
                  className={`px-3 py-3 text-[11px] font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                    drawerTab === tab 
                      ? 'border-blue-600 text-neutral-900' 
                      : 'border-transparent text-neutral-400 hover:text-neutral-600'
                  }`}
                >
                  {tab === 'overview' ? 'Targeting & Rules' : 
                   tab === 'charts' ? 'Performance Trends' : 
                   tab === 'history' ? 'Audit Log' : 
                   'Adjust settings'}
                </button>
              ))}
            </div>

            {/* Drawer Content Area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              
              {/* TAB 1: OVERVIEW & RULES */}
              {drawerTab === 'overview' && (
                <div className="space-y-5 text-xs animate-fade-in">
                  
                  {/* Notes Card */}
                  <div className="bg-neutral-50 border border-neutral-200/60 rounded-xl p-4 space-y-1.5">
                    <h4 className="font-bold text-neutral-700 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <Tag size={11} className="text-neutral-400" />
                      <span>Internal Campaign Brief</span>
                    </h4>
                    <p className="text-neutral-600 leading-relaxed font-semibold italic">
                      "{selectedCampaign.notes || 'No notes defined for this campaign profile.'}"
                    </p>
                  </div>

                  {/* Targeting Profile Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    <div className="border border-neutral-200/50 rounded-xl p-3.5 space-y-1.5">
                      <span className="font-bold text-[10px] uppercase text-neutral-400 tracking-wider block">Target Verticals</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedCampaign.categories.map(c => (
                          <span key={c} className="bg-blue-50 text-blue-700 font-extrabold px-2 py-0.5 rounded border border-blue-100">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="border border-neutral-200/50 rounded-xl p-3.5 space-y-1.5">
                      <span className="font-bold text-[10px] uppercase text-neutral-400 tracking-wider block">Wealth Tiers</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedCampaign.personas.map(p => (
                          <span key={p} className="bg-neutral-50 text-neutral-700 font-bold px-2 py-0.5 rounded border border-neutral-200">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="border border-neutral-200/50 rounded-xl p-3.5 space-y-1.5">
                      <span className="font-bold text-[10px] uppercase text-neutral-400 tracking-wider block">Target Geography</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedCampaign.geographies.map(g => (
                          <span key={g} className="bg-neutral-50 border border-neutral-200 font-semibold px-2 py-0.5 rounded text-neutral-700">
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="border border-neutral-200/50 rounded-xl p-3.5 space-y-1.5">
                      <span className="font-bold text-[10px] uppercase text-neutral-400 tracking-wider block">Match confidence</span>
                      <span className="inline-flex items-center gap-1.5 bg-neutral-100 px-2.5 py-0.5 rounded font-bold text-neutral-700">
                        <TrendingUp size={11} className="text-neutral-500" />
                        {selectedCampaign.confidence} match quality
                      </span>
                    </div>

                    {/* New Target CAC and Product Fields */}
                    <div className="border border-neutral-200/50 rounded-xl p-3.5 space-y-1.5">
                      <span className="font-bold text-[10px] uppercase text-neutral-400 tracking-wider block">Target CAC & Sector</span>
                      <div className="flex flex-col gap-1 font-semibold text-xs text-neutral-700">
                        <span className="text-[10px] text-neutral-400">Target CAC:</span>
                        <span className="font-bold">₹{selectedCampaign.targetCAC ? selectedCampaign.targetCAC.toLocaleString('en-IN') : '2,500'}</span>
                        <span className="text-[10px] text-neutral-400 mt-1">Product Sector:</span>
                        <span className="font-bold text-[#1e3a8a]">{selectedCampaign.productSector || 'Wealth Advisory'}</span>
                      </div>
                    </div>

                    <div className="border border-neutral-200/50 rounded-xl p-3.5 space-y-1.5">
                      <span className="font-bold text-[10px] uppercase text-neutral-400 tracking-wider block">Product Cycles</span>
                      <div className="flex flex-col gap-1 font-semibold text-xs text-neutral-700">
                        <span className="text-[10px] text-neutral-400">Purchase Model:</span>
                        <span className="font-bold">{selectedCampaign.purchaseCycle || 'Recurring subscription'}</span>
                        <span className="text-[10px] text-neutral-400 mt-1">Avg Sale Cycle:</span>
                        <span className="font-bold">{selectedCampaign.avgSaleCycle || '1 Week'}</span>
                      </div>
                    </div>

                  </div>

                  {/* Exclusions Settings */}
                  <div className="border border-neutral-200/50 rounded-xl p-4.5 space-y-3 bg-neutral-50/20">
                    <h4 className="font-extrabold text-neutral-700 uppercase tracking-wider text-[10px]">Guardrail Exclusions</h4>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                        <div className="space-y-0.5">
                          <span className="font-bold text-neutral-700 block">Exclude Previously Contacted Leads</span>
                          <span className="text-[10px] text-neutral-400 font-medium block">Avoids sending duplicate communications.</span>
                        </div>
                        <span className={`px-2 py-0.5 font-bold rounded text-[10px] ${selectedCampaign.excludeDelivered ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-neutral-100 text-neutral-400'}`}>
                          {selectedCampaign.excludeDelivered ? 'ENABLED' : 'DISABLED'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="space-y-0.5">
                          <span className="font-bold text-neutral-700 block">Exclude Existing Account Holders</span>
                          <span className="text-[10px] text-neutral-400 font-medium block">Avoids targeting people already onboarded.</span>
                        </div>
                        <span className={`px-2 py-0.5 font-bold rounded text-[10px] ${selectedCampaign.excludeExisting ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-neutral-100 text-neutral-400'}`}>
                          {selectedCampaign.excludeExisting ? 'ENABLED' : 'DISABLED'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Financial & Forecast Metrics card */}
                  <div className="bg-blue-50/50 border border-blue-200/50 rounded-xl p-4.5 space-y-3">
                    <h4 className="font-bold text-blue-900 uppercase tracking-wider text-[10px]">Forecast Delivery Summary</h4>
                    <div className="grid grid-cols-3 gap-2.5 text-center">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-neutral-400 block uppercase">Est. Leads/Day</span>
                        <span className="font-extrabold text-[#1e40af] text-[15px] block">{selectedCampaign.metrics.estLeadsPerDay}</span>
                      </div>
                      <div className="space-y-0.5 border-x border-blue-200/40">
                        <span className="text-[10px] font-bold text-neutral-400 block uppercase">Total Target Leads</span>
                        <span className="font-extrabold text-[#1e40af] text-[15px] block">{selectedCampaign.metrics.estTotalLeads}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-neutral-400 block uppercase">Pacing Cap Limit</span>
                        <span className="font-extrabold text-neutral-800 text-[15px] block">
                          {selectedCampaign.totalBudgetCap ? `₹${(selectedCampaign.totalBudgetCap / 1000).toFixed(0)}k` : 'No Cap'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lead Feed Action Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        if (onViewLeads) {
                          onViewLeads(selectedCampaign.id);
                          setSelectedCampaign(null);
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-[#1e40af] hover:bg-[#1d4ed8] active:scale-98 text-white rounded-xl shadow-md text-xs font-bold transition-all cursor-pointer"
                    >
                      <Eye size={13} />
                      <span>View Acquired Leads for this Campaign</span>
                    </button>
                  </div>

                </div>
              )}

              {/* TAB 2: HIGH-FIDELITY SVG CHARTS (100% Client-side, Dynamic data matching) */}
              {drawerTab === 'charts' && (
                <div className="space-y-6 text-xs animate-fade-in">
                  
                  {/* Daily Spend Pacing Chart */}
                  <div className="border border-neutral-200 rounded-xl p-4.5 bg-white space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-neutral-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                        <TrendingUp size={12} className="text-blue-500" />
                        <span>Daily Spend Pacing Trend (INR)</span>
                      </h4>
                      <span className="bg-neutral-100 text-neutral-500 font-mono text-[9px] px-2 py-0.5 rounded font-bold">15-Day History</span>
                    </div>

                    {/* SVG Line / Area path */}
                    <div className="relative pt-2">
                      <svg viewBox="0 0 500 140" className="w-full h-36 overflow-visible">
                        <defs>
                          <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25"/>
                            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.00"/>
                          </linearGradient>
                        </defs>
                        {/* Grid lines */}
                        <line x1="0" y1="20" x2="500" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="0" y1="60" x2="500" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="0" y1="130" x2="500" y2="130" stroke="#e2e8f0" strokeWidth="1" />

                        {/* Trend Area path */}
                        <path 
                          d={`M 0,130 L 40,118 L 80,110 L 120,95 L 160,82 L 200,85 L 240,68 L 280,55 L 320,48 L 360,40 L 400,32 L 440,25 L 480,20 L 500,20 L 500,130 Z`} 
                          fill="url(#spendGrad)" 
                        />

                        {/* Trend Line path */}
                        <path 
                          d={`M 0,130 L 40,118 L 80,110 L 120,95 L 160,82 L 200,85 L 240,68 L 280,55 L 320,48 L 360,40 L 400,32 L 440,25 L 480,20 L 500,20`} 
                          fill="none" 
                          stroke="#2563eb" 
                          strokeWidth="2.5" 
                          strokeLinecap="round"
                        />

                        {/* Node points */}
                        <circle cx="240" cy="68" r="4" fill="#1e40af" stroke="white" strokeWidth="1.5" />
                        <circle cx="480" cy="20" r="4" fill="#1e40af" stroke="white" strokeWidth="1.5" />

                        {/* Tooltip labels */}
                        <text x="245" y="63" fontSize="8" fontWeight="bold" fill="#1e40af">₹{(selectedCampaign.budgetPerDay * 0.8).toLocaleString('en-IN')}</text>
                        <text x="445" y="15" fontSize="8" fontWeight="bold" fill="#1e40af">₹{selectedCampaign.budgetPerDay.toLocaleString('en-IN')} max</text>
                      </svg>
                      
                      <div className="flex justify-between items-center text-[9px] text-neutral-400 font-bold pt-1 select-none">
                        <span>Launch (Day 1)</span>
                        <span>Day 7 (Midway)</span>
                        <span>Current Pacing (Day 15)</span>
                      </div>
                    </div>
                  </div>

                  {/* Cumulative Leads Growth Chart */}
                  <div className="border border-neutral-200 rounded-xl p-4.5 bg-white space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-neutral-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle size={12} className="text-emerald-500" />
                        <span>Cumulative Lead Acquisition Growth</span>
                      </h4>
                      <span className="bg-emerald-50 text-emerald-700 font-mono text-[9px] px-2 py-0.5 rounded border border-emerald-200/50 font-bold">Injected successfully</span>
                    </div>

                    {/* SVG Stepped Area Chart */}
                    <div className="relative pt-2">
                      <svg viewBox="0 0 500 140" className="w-full h-36 overflow-visible">
                        <defs>
                          <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.2"/>
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0"/>
                          </linearGradient>
                        </defs>
                        {/* Grid lines */}
                        <line x1="0" y1="20" x2="500" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="0" y1="60" x2="500" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="0" y1="130" x2="500" y2="130" stroke="#e2e8f0" strokeWidth="1" />

                        {/* Lead growth Area */}
                        <path 
                          d="M 0,130 L 50,115 L 100,105 L 150,90 L 200,75 L 250,55 L 300,45 L 350,30 L 400,22 L 450,18 L 500,18 L 500,130 Z" 
                          fill="url(#leadsGrad)" 
                        />

                        {/* Lead growth Line */}
                        <path 
                          d="M 0,130 L 50,115 L 100,105 L 150,90 L 200,75 L 250,55 L 300,45 L 350,30 L 400,22 L 450,18 L 500,18" 
                          fill="none" 
                          stroke="#10b981" 
                          strokeWidth="2.5" 
                          strokeLinecap="round"
                        />

                        <circle cx="250" cy="55" r="4" fill="#047857" stroke="white" strokeWidth="1.5" />
                        <circle cx="500" cy="18" r="4" fill="#047857" stroke="white" strokeWidth="1.5" />

                        <text x="255" y="50" fontSize="8" fontWeight="bold" fill="#047857">{Math.round((selectedCampaign.leadsAcquired || 0) * 0.6)} leads</text>
                        <text x="435" y="12" fontSize="8" fontWeight="bold" fill="#047857">{selectedCampaign.leadsAcquired || 0} active leads</text>
                      </svg>
                      
                      <div className="flex justify-between items-center text-[9px] text-neutral-400 font-bold pt-1 select-none">
                        <span>Launch</span>
                        <span>Week 1</span>
                        <span>Week 2 (Actuals)</span>
                      </div>
                    </div>
                  </div>

                  {/* Target CAC vs. Actual Cost per Lead (CPL) Pacing Chart */}
                  {(() => {
                    const targetCACVal = selectedCampaign.targetCAC || 2500;
                    const currentSpendVal = selectedCampaign.currentSpend || 0;
                    const leadsAcquiredVal = selectedCampaign.leadsAcquired || 0;
                    const actualCPLVal = leadsAcquiredVal > 0 ? Math.round(currentSpendVal / leadsAcquiredVal) : 0;

                    // 7-day trend
                    const cplDataPoints = [
                      Math.round(targetCACVal * 0.82),
                      Math.round(targetCACVal * 0.88),
                      Math.round(targetCACVal * 1.04),
                      Math.round(targetCACVal * 1.12),
                      Math.round(targetCACVal * 0.94),
                      Math.round(targetCACVal * 0.91),
                      actualCPLVal > 0 ? actualCPLVal : Math.round(targetCACVal * 0.85)
                    ];

                    const maxVal = Math.max(targetCACVal, ...cplDataPoints) * 1.3;
                    const getY = (val: number) => {
                      return 120 - ((val / maxVal) * 100);
                    };

                    const targetY = getY(targetCACVal);
                    const pts = cplDataPoints.map((val, i) => {
                      const x = (i / 6) * 500;
                      const y = getY(val);
                      return { x, y, val };
                    });

                    const pathD = `M ${pts[0].x},${pts[0].y} ` + pts.slice(1).map(p => `L ${p.x},${p.y}`).join(' ');
                    const areaD = `${pathD} L 500,120 L 0,120 Z`;

                    const isOver = actualCPLVal > targetCACVal;

                    return (
                      <div className="border border-neutral-200 rounded-xl p-4.5 bg-white space-y-3 shadow-sm">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-neutral-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                            <AlertCircle size={12} className={isOver ? "text-amber-500" : "text-emerald-500"} />
                            <span>Target CAC vs. Actual CPL Pacing</span>
                          </h4>
                          <span className={`px-2 py-0.5 rounded font-bold text-[9px] border ${isOver ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                            {isOver ? "Over committed target" : "Under committed target"}
                          </span>
                        </div>

                        <div className="relative pt-2">
                          <svg viewBox="0 0 500 140" className="w-full h-36 overflow-visible">
                            <defs>
                              <linearGradient id="cacGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={isOver ? "#d97706" : "#10b981"} stopOpacity="0.18"/>
                                <stop offset="100%" stopColor={isOver ? "#d97706" : "#10b981"} stopOpacity="0.0"/>
                              </linearGradient>
                            </defs>
                            {/* Grid lines */}
                            <line x1="0" y1="20" x2="500" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                            <line x1="0" y1="60" x2="500" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                            <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                            <line x1="0" y1="120" x2="500" y2="120" stroke="#e2e8f0" strokeWidth="1" />

                            {/* Actual CPL Area */}
                            <path d={areaD} fill="url(#cacGrad)" />

                            {/* Target CAC Line (Dashed Red/Gray) */}
                            <line 
                              x1="0" 
                              y1={targetY} 
                              x2="500" 
                              y2={targetY} 
                              stroke="#ef4444" 
                              strokeWidth="1.5" 
                              strokeDasharray="4,4" 
                            />
                            <text x="10" y={targetY - 5} fontSize="8" fontWeight="bold" fill="#ef4444">
                              Committed Target CAC: ₹{targetCACVal.toLocaleString('en-IN')}
                            </text>

                            {/* Actual CPL Line */}
                            <path 
                              d={pathD} 
                              fill="none" 
                              stroke={isOver ? "#d97706" : "#10b981"} 
                              strokeWidth="2.5" 
                              strokeLinecap="round"
                            />

                            {/* Points */}
                            {pts.map((p, idx) => (
                              <circle 
                                key={idx}
                                cx={p.x} 
                                cy={p.y} 
                                r="3.5" 
                                fill={isOver ? "#b45309" : "#047857"} 
                                stroke="white" 
                                strokeWidth="1.2" 
                              />
                            ))}

                            {/* Current CPL Callout */}
                            <circle 
                              cx="500" 
                              cy={pts[6].y} 
                              r="6" 
                              fill={isOver ? "#dc2626" : "#10b981"} 
                              stroke="white" 
                              strokeWidth="2" 
                              className="animate-pulse"
                            />
                            <text x="320" y={pts[6].y - 8} fontSize="8.5" fontWeight="extrabold" fill={isOver ? "#b91c1c" : "#047857"}>
                              Today: ₹{pts[6].val.toLocaleString('en-IN')} CPL
                            </text>
                          </svg>
                          
                          <div className="flex justify-between items-center text-[9px] text-neutral-400 font-bold pt-1 select-none">
                            <span>Day 1</span>
                            <span>Day 3</span>
                            <span>Day 5</span>
                            <span>Day 7 (Today)</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                </div>
              )}

              {/* TAB 3: TIMELINE AUDIT ACTIVITY LOG */}
              {drawerTab === 'history' && (
                <div className="space-y-4 text-xs animate-fade-in font-medium">
                  <h4 className="font-extrabold text-neutral-800 text-[11px] uppercase tracking-wider">Chronological Audit Events</h4>
                  
                  {/* Timeline Tree */}
                  <div className="relative pl-6 space-y-6 before:absolute before:top-1.5 before:left-2 before:bottom-1.5 before:w-0.5 before:bg-neutral-200">
                    
                    {/* Event 1 */}
                    <div className="relative">
                      <span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow-sm flex items-center justify-center" />
                      <div className="space-y-1">
                        <span className="text-[10px] text-neutral-400 font-bold block">15 Sep 2026, 11:32 AM</span>
                        <p className="text-neutral-700">
                          Campaign launched successfully by <strong className="font-bold text-neutral-800">{selectedCampaign.owner || 'Sidhartha R.'}</strong>.
                        </p>
                        <p className="text-[10.5px] text-neutral-400 font-medium">Target match tier established on {selectedCampaign.confidence} confidence.</p>
                      </div>
                    </div>

                    {/* Event 2 */}
                    <div className="relative">
                      <span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-neutral-400 border-4 border-white shadow-sm flex items-center justify-center" />
                      <div className="space-y-1">
                        <span className="text-[10px] text-neutral-400 font-bold block">15 Sep 2026, 11:30 AM</span>
                        <p className="text-neutral-700">
                          Approved compliance audit of lead exclusionary queries.
                        </p>
                        <p className="text-[10.5px] text-neutral-400">Validated 0% overlap with existing bank CRM databases.</p>
                      </div>
                    </div>

                    {/* Event 3 */}
                    {selectedCampaign.currentSpend && selectedCampaign.currentSpend > 0 ? (
                      <div className="relative">
                        <span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm flex items-center justify-center" />
                        <div className="space-y-1">
                          <span className="text-[10px] text-neutral-400 font-bold block">16 Sep 2026, 09:00 AM</span>
                          <p className="text-neutral-700">
                            Pacing engine logged lead injections and acquired <strong className="text-emerald-600 font-bold">{selectedCampaign.leadsAcquired}</strong> premium records.
                          </p>
                          <p className="text-[10.5px] text-neutral-400">Daily cap limit fully operational. ₹{selectedCampaign.currentSpend.toLocaleString('en-IN')} billed.</p>
                        </div>
                      </div>
                    ) : null}

                    {/* Event 4 (If auto-paused / completed) */}
                    {selectedCampaign.status === 'Completed' || (selectedCampaign.totalBudgetCap && selectedCampaign.currentSpend && selectedCampaign.currentSpend >= selectedCampaign.totalBudgetCap) ? (
                      <div className="relative">
                        <span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-purple-500 border-4 border-white shadow-sm flex items-center justify-center" />
                        <div className="space-y-1">
                          <span className="text-[10px] text-red-500 font-bold block">System Triggered Alert</span>
                          <p className="text-neutral-700">
                            <strong>Pacing freeze executed</strong>. Campaign spend reached budget threshold limits. Status transitioned to Completed.
                          </p>
                          <p className="text-[10.5px] text-neutral-400">Automatic CRM summary logs exported to client accounts.</p>
                        </div>
                      </div>
                    ) : null}

                  </div>
                </div>
              )}

              {/* TAB 4: IN-PLACE INLINE EDIT PANEL */}
              {drawerTab === 'edit' && (
                <div className="space-y-5 text-xs animate-fade-in">
                  <div className="flex items-center gap-2 pb-1 border-b border-neutral-100">
                    <Info size={13} className="text-neutral-400" />
                    <h4 className="font-extrabold text-neutral-800 text-[11px] uppercase tracking-wider">In-Place Settings Adjustments</h4>
                  </div>

                  {/* Feedback toast */}
                  {editSuccessToast && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold p-3 rounded-lg flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                      <span>Adjustment saved successfully! Forecast values recalculated on-the-fly.</span>
                    </div>
                  )}

                  {/* Inline Edit Form */}
                  <div className="space-y-4">
                    
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-neutral-500 uppercase tracking-wider text-[10px]">Campaign Display Name</label>
                      <input 
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all"
                      />
                    </div>

                    {/* Daily Budget */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-neutral-500 uppercase tracking-wider text-[10px]">Daily Spend Cap (INR / Day)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">₹</span>
                        <input 
                          type="number"
                          value={editBudgetPerDay}
                          onChange={(e) => setEditBudgetPerDay(Number(e.target.value))}
                          className="w-full pl-6 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all"
                        />
                      </div>
                    </div>

                    {/* Total budget cap */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-neutral-500 uppercase tracking-wider text-[10px]">Total Budget Ceiling (INR, Optional)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">₹</span>
                        <input 
                          type="number"
                          value={editTotalBudgetCap || ''}
                          placeholder="Uncapped limit"
                          onChange={(e) => setEditTotalBudgetCap(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full pl-6 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all"
                        />
                      </div>
                    </div>

                    {/* Target CAC Commitment */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-neutral-500 uppercase tracking-wider text-[10px]">Target CAC Commitment (INR)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">₹</span>
                        <input 
                          type="number"
                          value={editTargetCAC}
                          onChange={(e) => setEditTargetCAC(Number(e.target.value))}
                          className="w-full pl-6 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all"
                        />
                      </div>
                      <span className="text-[10px] text-neutral-400 font-medium block">
                        Commitment limit used to pace Cost-per-Lead alerts mid-flight.
                      </span>
                    </div>

                    {/* End Date */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-neutral-500 uppercase tracking-wider text-[10px]">Pacing End Date</label>
                      <input 
                        type="date"
                        value={editEndDate}
                        onChange={(e) => setEditEndDate(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all"
                      />
                    </div>

                  </div>

                  {/* Drawer save actions button */}
                  <div className="pt-4 border-t border-neutral-100 flex items-center gap-2">
                    <button
                      onClick={() => setDrawerTab('overview')}
                      className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-lg transition-all"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSaveInlineEdit}
                      className="flex-1 px-4 py-2 bg-[#1e40af] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                    >
                      Save Settings & Update Forecasts
                    </button>
                  </div>

                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
