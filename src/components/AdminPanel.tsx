import React, { useState, useEffect } from 'react';
import { AdminSidebar, AdminSection } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminDashboardView } from './AdminDashboardView';
import { GlobalOverview } from './GlobalOverview';
import { CampaignBuilder, Campaign } from './CampaignBuilder';
import { CampaignManagement } from './CampaignManagement';
import { LeadFeed } from './LeadFeed';
import { LeadQualification } from './LeadQualification';
import { UsersAccess } from './UsersAccess';
import { CategoriesManagement } from './CategoriesManagement';
import { InternalInsight } from './InternalInsight';
import { LeadDashboardV2 } from './LeadDashboardV2';
import { Menu } from 'lucide-react';

interface AdminPanelProps {
  onLogout: () => void;
}

export type DashboardPeriod = 'This week' | 'Last week' | 'This month' | 'Year to date';

const DEFAULT_CAMPAIGNS: Campaign[] = [
  {
    id: "CAMP-72810",
    name: "Festive Season Push",
    industry: "Wealth Management",
    categories: ["Golf", "Fine Dining"],
    confidence: "Both",
    personas: ["Mass affluent", "HNI"],
    geographies: ["Mumbai", "Delhi NCR", "Bengaluru"],
    excludeDelivered: true,
    excludeExisting: true,
    budgetPerDay: 50000,
    totalBudgetCap: 1500000,
    startDate: "2026-09-01",
    endDate: "2026-10-15",
    notes: "High impact festive targeting.",
    status: "Active",
    createdAt: "1 Sep 2026",
    metrics: {
      estLeadsPerDay: 31.2,
      estTotalLeads: 1450,
      estTotalSpend: 1500000
    },
    currentSpend: 1250000,
    leadsAcquired: 780,
    owner: "Sidhartha R.",
    targetCAC: 1500,
    productSector: "Credit Cards",
    ticketSizeMin: 150000,
    ticketSizeMax: 1000000,
    purchaseCycle: "One-time",
    avgSaleCycle: "1 Day"
  },
  {
    id: "CAMP-94182",
    name: "HNI Wealth Onboarding",
    industry: "Wealth Management",
    categories: ["Leisure travel"],
    confidence: "High",
    personas: ["HNI", "UHNI"],
    geographies: ["Mumbai", "Delhi NCR", "Pune", "Bengaluru"],
    excludeDelivered: true,
    excludeExisting: true,
    budgetPerDay: 60000,
    totalBudgetCap: 2200000,
    startDate: "2026-09-10",
    endDate: "2026-11-10",
    notes: "Targeting premium HNI asset onboarding.",
    status: "Active",
    createdAt: "10 Sep 2026",
    metrics: {
      estLeadsPerDay: 24.8,
      estTotalLeads: 1120,
      estTotalSpend: 2200000
    },
    currentSpend: 360000,
    leadsAcquired: 148,
    owner: "Sidhartha R.",
    targetCAC: 3200,
    productSector: "Wealth Advisory",
    ticketSizeMin: 1000000,
    ticketSizeMax: 5000000,
    purchaseCycle: "Recurring subscription",
    avgSaleCycle: "1 Month"
  },
  {
    id: "CAMP-38102",
    name: "Premium Card Upsell",
    industry: "Wealth Management",
    categories: ["Fine Dining"],
    confidence: "Both",
    personas: ["Mass affluent", "HNI"],
    geographies: ["Mumbai", "Bengaluru", "Kolkata"],
    excludeDelivered: true,
    excludeExisting: false,
    budgetPerDay: 28000,
    totalBudgetCap: 1000000,
    startDate: "2026-09-15",
    endDate: "2026-10-31",
    notes: "Co-brand premium metal card upsell targeting.",
    status: "Active",
    createdAt: "15 Sep 2026",
    metrics: {
      estLeadsPerDay: 20.1,
      estTotalLeads: 990,
      estTotalSpend: 1000000
    },
    currentSpend: 28000,
    leadsAcquired: 12,
    owner: "Ananya S.",
    targetCAC: 1100,
    productSector: "Credit Cards",
    ticketSizeMin: 200000,
    ticketSizeMax: 1500000,
    purchaseCycle: "One-time",
    avgSaleCycle: "1 Week"
  },
  {
    id: "CAMP-10582",
    name: "UHNI Referral Drive",
    industry: "Wealth Management",
    categories: ["Private Yachting", "High-End Horology"],
    confidence: "High",
    personas: ["UHNI"],
    geographies: ["Mumbai", "Delhi NCR", "Bengaluru"],
    excludeDelivered: true,
    excludeExisting: true,
    budgetPerDay: 40000,
    totalBudgetCap: 1500000,
    startDate: "2026-09-20",
    endDate: "2026-12-20",
    notes: "Bespoke referral engagement.",
    status: "Scheduled",
    createdAt: "16 Sep 2026",
    metrics: {
      estLeadsPerDay: 15.8,
      estTotalLeads: 648,
      estTotalSpend: 1500000
    },
    currentSpend: 0,
    leadsAcquired: 0,
    owner: "Rajesh K.",
    targetCAC: 5500,
    productSector: "Custom Portfolio",
    ticketSizeMin: 5000000,
    ticketSizeMax: 25000000,
    purchaseCycle: "Recurring subscription",
    avgSaleCycle: "1 Month"
  },
  {
    id: "CAMP-49520",
    name: "Mass Affluent Starter",
    industry: "Wealth Management",
    categories: ["Wellness & Spas"],
    confidence: "Medium",
    personas: ["Mass affluent"],
    geographies: ["Pune", "Hyderabad", "Ahmedabad", "Chennai"],
    excludeDelivered: false,
    excludeExisting: true,
    budgetPerDay: 18000,
    totalBudgetCap: 660000,
    startDate: "2026-09-05",
    endDate: "2026-10-05",
    notes: "Volume driver campaign.",
    status: "Draft",
    createdAt: "5 Sep 2026",
    metrics: {
      estLeadsPerDay: 14.0,
      estTotalLeads: 520,
      estTotalSpend: 660000
    },
    currentSpend: 0,
    leadsAcquired: 0,
    owner: "Ananya S.",
    targetCAC: 800,
    productSector: "Retail Banking",
    ticketSizeMin: 50000,
    ticketSizeMax: 300000,
    purchaseCycle: "One-time",
    avgSaleCycle: "1 Day"
  },
  {
    id: "CAMP-20194",
    name: "NRE Deposits Spark",
    industry: "Wealth Management",
    categories: ["Luxury Automobiles"],
    confidence: "Both",
    personas: ["UHNI", "HNI"],
    geographies: ["Mumbai", "Kolkata"],
    excludeDelivered: true,
    excludeExisting: true,
    budgetPerDay: 45000,
    totalBudgetCap: 450000,
    startDate: "2026-08-01",
    endDate: "2026-08-15",
    notes: "Completed campaign.",
    status: "Completed",
    createdAt: "1 Aug 2026",
    metrics: {
      estLeadsPerDay: 22.0,
      estTotalLeads: 310,
      estTotalSpend: 450000
    },
    currentSpend: 450000,
    leadsAcquired: 310,
    owner: "Rajesh K.",
    targetCAC: 2900,
    productSector: "Wealth Advisory",
    ticketSizeMin: 2000000,
    ticketSizeMax: 10000000,
    purchaseCycle: "Recurring subscription",
    avgSaleCycle: "1 Month"
  },
  {
    id: "CAMP-55102",
    name: "Corporate Salary Elevate",
    industry: "Wealth Management",
    categories: ["Golf"],
    confidence: "Medium",
    personas: ["Mass affluent"],
    geographies: ["Bengaluru", "Hyderabad"],
    excludeDelivered: true,
    excludeExisting: true,
    budgetPerDay: 25000,
    totalBudgetCap: 500000,
    startDate: "2026-08-10",
    endDate: "2026-09-10",
    notes: "Corporate segments push.",
    status: "Paused",
    createdAt: "10 Aug 2026",
    metrics: {
      estLeadsPerDay: 18.0,
      estTotalLeads: 220,
      estTotalSpend: 360000
    },
    currentSpend: 180000,
    leadsAcquired: 90,
    owner: "Sidhartha R.",
    targetCAC: 2100,
    productSector: "Business Loans",
    ticketSizeMin: 500000,
    ticketSizeMax: 3000000,
    purchaseCycle: "Recurring subscription",
    avgSaleCycle: "1 Month"
  }
];

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<DashboardPeriod>('This week');
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [managementInitialFilter, setManagementInitialFilter] = useState<'All' | 'Outside Target' | 'Within Target'>('All');
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
  const [selectedCampaignForLeads, setSelectedCampaignForLeads] = useState<string | null>(null);
  
  // Persistent campaign collection stored securely in state (hydrated from localStorage to handle refresh)
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    const cached = localStorage.getItem('zenith_campaigns');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // Migrate legacy formats to support detailed metrics
        return parsed.map((c: any) => ({
          ...c,
          currentSpend: c.currentSpend !== undefined ? c.currentSpend : 0,
          leadsAcquired: c.leadsAcquired !== undefined ? c.leadsAcquired : 0,
          owner: c.owner || "Sidhartha R."
        }));
      } catch (err) {
        return DEFAULT_CAMPAIGNS;
      }
    }
    return DEFAULT_CAMPAIGNS;
  });

  useEffect(() => {
    localStorage.setItem('zenith_campaigns', JSON.stringify(campaigns));
  }, [campaigns]);

  // Handler to persist a newly generated or updated campaign
  const handleSaveCampaign = (newCamp: Campaign) => {
    setCampaigns(prev => [newCamp, ...prev]);
    // On launch or draft, redirect straight to Campaign Management per requirements!
    setActiveSection('management');
  };

  // Handler to pause/resume/edit campaigns in the list
  const handleUpdateStatus = (id: string, newStatus: Campaign['status']) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
  };

  const handleUpdateCampaign = (updatedCamp: Campaign) => {
    setCampaigns(prev => prev.map(c => c.id === updatedCamp.id ? updatedCamp : c));
  };

  const handleDuplicateCampaign = (id: string) => {
    const target = campaigns.find(c => c.id === id);
    if (target) {
      const duplicate: Campaign = {
        ...target,
        id: 'CAMP-' + Math.floor(Math.random() * 90000 + 10000),
        name: `${target.name} (Copy)`,
        createdAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        currentSpend: 0,
        leadsAcquired: 0,
        status: 'Draft'
      };
      setCampaigns(prev => [duplicate, ...prev]);
    }
  };

  const handleArchiveCampaign = (id: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
  };

  const handlePauseAllActive = () => {
    setCampaigns(prev => prev.map(c => c.status === 'Active' ? { ...c, status: 'Paused' } : c));
  };

  return (
    <div className="flex flex-col lg:flex-row bg-[#f8fafc] min-h-screen text-neutral-800 antialiased overflow-x-hidden selection:bg-[#3b82f6]/20">
      {/* Mobile Top Header */}
      <div className="lg:hidden flex items-center justify-between bg-[#0b0c0e] text-white px-5 py-3 border-b border-white/5 sticky top-0 z-30">
        <button 
          onClick={() => setIsSidebarMobileOpen(true)}
          className="p-1.5 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <Menu size={20} />
        </button>
        <span className="font-sans font-bold text-sm tracking-tight text-white flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-gradient-to-tr from-[#3b82f6] to-[#1d4ed8] flex items-center justify-center text-[10px]">R</span>
          <span>RACE Console</span>
        </span>
        <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-[#3b82f6]">
          PS
        </div>
      </div>

      {/* Sidebar Navigation */}
      <AdminSidebar 
        onLogout={onLogout} 
        activeSection={activeSection} 
        setActiveSection={(section) => {
          setActiveSection(section);
          setIsSidebarMobileOpen(false);
          if (section !== 'management') {
            setManagementInitialFilter('All');
          }
        }}
        isMobileOpen={isSidebarMobileOpen}
        onClose={() => setIsSidebarMobileOpen(false)}
      />

      {/* Main Panel Area */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
        {/* Inner Content Centering / Spacing */}
        <div className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6">
          
          {/* Conditionally render header based on active sub-section */}
          {activeSection === 'dashboard' ? (
            <div className="flex-1 pt-6">
              <GlobalOverview setActiveSection={setActiveSection} />
            </div>
          ) : activeSection === 'leadgen-dashboard' ? (
            <>
              {/* Core Dashboard Header */}
              <AdminHeader 
                selectedPeriod={selectedPeriod} 
                onPeriodChange={setSelectedPeriod} 
                onNewCampaign={() => {
                  setManagementInitialFilter('All');
                  setActiveSection('builder');
                }}
              />

              {/* Core Dashboard Grid */}
              <div className="flex-1">
                <AdminDashboardView 
                  selectedPeriod={selectedPeriod} 
                  campaigns={campaigns}
                  onNavigateToManagement={(filter) => {
                    setManagementInitialFilter(filter || 'All');
                    setActiveSection('management');
                  }}
                  onNewCampaign={() => {
                    setManagementInitialFilter('All');
                    setActiveSection('builder');
                  }}
                  onSwitchToV2={() => setActiveSection('leadgen-dashboard-v2')}
                />
              </div>
            </>
          ) : activeSection === 'leadgen-dashboard-v2' ? (
            <>
              {/* Core Dashboard Header for V2 */}
              <AdminHeader 
                title="Dashboard v2"
                selectedPeriod={selectedPeriod} 
                onPeriodChange={setSelectedPeriod} 
                onNewCampaign={() => {
                  setManagementInitialFilter('All');
                  setActiveSection('builder');
                }}
              />

              {/* Lead Dashboard V2 Component */}
              <div className="flex-1">
                <LeadDashboardV2 
                  selectedPeriod={selectedPeriod} 
                  campaigns={campaigns}
                  onNavigateToManagement={(filter) => {
                    setManagementInitialFilter(filter || 'All');
                    setActiveSection('management');
                  }}
                  onNewCampaign={() => {
                    setManagementInitialFilter('All');
                    setActiveSection('builder');
                  }}
                />
              </div>
            </>
          ) : activeSection === 'builder' ? (
            <div className="flex-1 pt-6">
              <CampaignBuilder 
                onCancel={() => {
                  setManagementInitialFilter('All');
                  setActiveSection('leadgen-dashboard');
                }} 
                onSave={handleSaveCampaign} 
              />
            </div>
          ) : activeSection === 'management' ? (
            <div className="flex-1 pt-6">
              <CampaignManagement 
                campaigns={campaigns} 
                onNewCampaign={() => {
                  setManagementInitialFilter('All');
                  setActiveSection('builder');
                }} 
                onUpdateStatus={handleUpdateStatus}
                onUpdateCampaign={handleUpdateCampaign}
                onDuplicateCampaign={handleDuplicateCampaign}
                onArchiveCampaign={handleArchiveCampaign}
                onPauseAllActive={handlePauseAllActive}
                onViewLeads={(campaignId) => {
                  setSelectedCampaignForLeads(campaignId);
                  setActiveSection('leads');
                }}
                initialFilter={managementInitialFilter}
              />
            </div>
          ) : activeSection === 'leads' ? (
            <div className="flex-1 pt-6">
              <LeadFeed 
                campaigns={campaigns} 
                initialCampaignFilter={selectedCampaignForLeads}
                onClearInitialCampaign={() => setSelectedCampaignForLeads(null)}
              />
            </div>
          ) : activeSection === 'qual-builder' ? (
            <div className="flex-1 pt-6">
              <LeadQualification initialView="builder" />
            </div>
          ) : activeSection === 'qual-management' ? (
            <div className="flex-1 pt-6">
              <LeadQualification initialView="management" />
            </div>
          ) : activeSection === 'qual-feed' ? (
            <div className="flex-1 pt-6">
              <LeadQualification initialView="results" />
            </div>
          ) : activeSection === 'qual-dashboard' ? (
            <div className="flex-1 pt-6">
              <LeadQualification initialView="dashboard" />
            </div>
          ) : activeSection === 'insight-dashboard' ? (
            <div className="flex-1 pt-6">
              <LeadQualification initialView="insight-dashboard" />
            </div>
          ) : activeSection === 'insight-feed' ? (
            <div className="flex-1 pt-6">
              <LeadQualification initialView="insight-feed" />
            </div>
          ) : activeSection === 'insight-builder' ? (
            <div className="flex-1 pt-6">
              <LeadQualification initialView="insight-builder" />
            </div>
          ) : activeSection === 'insight-management' ? (
            <div className="flex-1 pt-6">
              <LeadQualification initialView="insight-management" />
            </div>
          ) : activeSection === 'users-access' ? (
            <div className="flex-1 pt-6">
              <UsersAccess />
            </div>
          ) : activeSection === 'categories-management' ? (
            <div className="flex-1 pt-6">
              <CategoriesManagement />
            </div>
          ) : activeSection === 'internal-insight' ? (
            <div className="flex-1 pt-6">
              <InternalInsight />
            </div>
          ) : (
            <div className="flex-1 pt-6">
              <LeadQualification initialView="dashboard" />
            </div>
          )}

        </div>
      </main>
    </div>
  );
};
