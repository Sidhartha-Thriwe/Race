import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Target, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  BarChart3, 
  Settings, 
  FileText, 
  Shield, 
  HelpCircle, 
  LogOut,
  X
} from 'lucide-react';

export type AdminSection = 
  | 'dashboard' 
  | 'leadgen-dashboard' 
  | 'leadgen-dashboard-v2'
  | 'builder' 
  | 'management' 
  | 'leads' 
  | 'qual-dashboard' 
  | 'qual-builder' 
  | 'qual-management' 
  | 'qual-feed' 
  | 'insight-dashboard' 
  | 'insight-builder' 
  | 'insight-management' 
  | 'insight-feed' 
  | 'users-access' 
  | 'categories-management'
  | 'internal-insight';

interface AdminSidebarProps {
  onLogout: () => void;
  activeSection: AdminSection;
  setActiveSection: (section: AdminSection) => void;
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
  onLogout, 
  activeSection, 
  setActiveSection,
  isMobileOpen = false,
  onClose
}) => {
  const [isSuperAdminOpen, setIsSuperAdminOpen] = useState(true);
  return (
    <>
      {/* Mobile Sidebar Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-neutral-950/60 z-40 lg:hidden backdrop-blur-xs transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside className={`bg-[#0b0c0e] text-white flex flex-col justify-between border-r border-white/5 h-screen select-none font-sans transition-transform duration-300 ease-in-out fixed inset-y-0 left-0 w-64 z-50 lg:sticky lg:translate-x-0 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      } shrink-0`}>
        {/* Top Brand Block */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Custom Logo Graphic */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#3b82f6] to-[#1d4ed8] flex items-center justify-center shadow-md shadow-[#3b82f6]/20">
              <span className="font-sans font-bold text-sm tracking-tight text-white">R</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-wide text-neutral-100 flex items-center gap-1.5">
                RACE Admin
              </h1>
              <p className="text-[10px] text-neutral-400 tracking-wider font-mono uppercase">
                Zenith Private Bank
              </p>
            </div>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="lg:hidden p-1 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-7 scrollbar-thin">
        {/* Top-Level Items */}
        <div className="space-y-1">
          <button 
            onClick={() => setActiveSection('dashboard')}
            className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-lg cursor-pointer transition-colors ${
              activeSection === 'dashboard' 
                ? 'text-white bg-white/5' 
                : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard size={16} />
              <span>Home</span>
            </div>
          </button>
        </div>

        {/* Lead Gen - Active Section */}
        <div>
          <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold tracking-wider text-[#5d8ae8] uppercase">
            <div className="flex items-center gap-2.5">
              <Target size={16} className="text-[#5d8ae8]" />
              <span>Lead Gen</span>
            </div>
            <ChevronUp size={14} className="text-[#5d8ae8]" />
          </div>
          
          <div className="mt-2 pl-3 space-y-1 border-l border-white/5 ml-5">
            {/* Active Sub-item Dashboard */}
            <button 
              onClick={() => setActiveSection('leadgen-dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md cursor-pointer transition-all ${
                activeSection === 'leadgen-dashboard'
                  ? 'text-white bg-[#2563eb]/90 font-bold'
                  : 'text-neutral-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>Dashboard</span>
            </button>
            
            {/* Dashboard v2 (New!) */}
            <button 
              onClick={() => setActiveSection('leadgen-dashboard-v2')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md cursor-pointer transition-all ${
                activeSection === 'leadgen-dashboard-v2'
                  ? 'text-white bg-[#2563eb]/90 font-bold'
                  : 'text-neutral-400 hover:bg-white/5 hover:text-white'
              }`}
              id="sidebar_leadgen_dashboard_v2_btn"
            >
              <div className="flex items-center gap-1.5">
                <span>Dashboard v2</span>
                <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/20 text-blue-300 font-bold rounded">
                  v2
                </span>
              </div>
            </button>
            
            {/* Campaign builder */}
            <button 
              onClick={() => setActiveSection('builder')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md cursor-pointer transition-all ${
                activeSection === 'builder'
                  ? 'text-white bg-[#2563eb]/90 font-bold'
                  : 'text-neutral-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>Campaign builder</span>
            </button>

            {/* Campaign management */}
            <button 
              onClick={() => setActiveSection('management')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md cursor-pointer transition-all ${
                activeSection === 'management'
                  ? 'text-white bg-[#2563eb]/90 font-bold'
                  : 'text-neutral-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>Campaign management</span>
            </button>

            {/* Lead feed */}
            <button 
              onClick={() => setActiveSection('leads')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md cursor-pointer transition-all ${
                activeSection === 'leads'
                  ? 'text-white bg-[#2563eb]/90 font-bold'
                  : 'text-neutral-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>Lead feed</span>
            </button>
          </div>
        </div>

        {/* Lead Qualification */}
        <div>
          <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold tracking-wider text-[#5d8ae8] uppercase">
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={16} className="text-[#5d8ae8]" />
              <span>Lead Qualification</span>
            </div>
            <ChevronUp size={14} className="text-[#5d8ae8]" />
          </div>
          
          <div className="mt-2 pl-3 space-y-1 border-l border-white/5 ml-5">
            <button 
              onClick={() => setActiveSection('qual-dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md cursor-pointer transition-all ${
                activeSection === 'qual-dashboard'
                  ? 'text-white bg-[#2563eb]/90 font-bold'
                  : 'text-neutral-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>Dashboard</span>
            </button>
            <button 
              onClick={() => setActiveSection('qual-builder')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md cursor-pointer transition-all ${
                activeSection === 'qual-builder'
                  ? 'text-white bg-[#2563eb]/90 font-bold'
                  : 'text-neutral-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>Campaign Builder</span>
            </button>
            <button 
              onClick={() => setActiveSection('qual-management')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md cursor-pointer transition-all ${
                activeSection === 'qual-management'
                  ? 'text-white bg-[#2563eb]/90 font-bold'
                  : 'text-neutral-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>Campaign Management</span>
            </button>
            <button 
              onClick={() => setActiveSection('qual-feed')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md cursor-pointer transition-all ${
                activeSection === 'qual-feed'
                  ? 'text-white bg-[#2563eb]/90 font-bold'
                  : 'text-neutral-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>Qualified Feed</span>
            </button>
          </div>
        </div>

        {/* Customer Insight */}
        <div>
          <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold tracking-wider text-[#5d8ae8] uppercase">
            <div className="flex items-center gap-2.5">
              <BarChart3 size={16} className="text-[#5d8ae8]" />
              <span>Customer Insight</span>
            </div>
            <ChevronUp size={14} className="text-[#5d8ae8]" />
          </div>
          
          <div className="mt-2 pl-3 space-y-1 border-l border-white/5 ml-5">
            <button 
              onClick={() => setActiveSection('insight-dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md cursor-pointer transition-all ${
                activeSection === 'insight-dashboard'
                  ? 'text-white bg-[#2563eb]/90 font-bold'
                  : 'text-neutral-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>Dashboard</span>
            </button>
            <button 
              onClick={() => setActiveSection('insight-feed')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md cursor-pointer transition-all ${
                activeSection === 'insight-feed'
                  ? 'text-white bg-[#2563eb]/90 font-bold'
                  : 'text-neutral-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>Insight Feed</span>
            </button>
            <button 
              onClick={() => setActiveSection('insight-builder')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md cursor-pointer transition-all ${
                activeSection === 'insight-builder'
                  ? 'text-white bg-[#2563eb]/90 font-bold'
                  : 'text-neutral-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>Campaign Builder</span>
            </button>
            <button 
              onClick={() => setActiveSection('insight-management')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md cursor-pointer transition-all ${
                activeSection === 'insight-management'
                  ? 'text-white bg-[#2563eb]/90 font-bold'
                  : 'text-neutral-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>Campaign Management</span>
            </button>
          </div>
        </div>

        {/* Active Sidebar Accordions */}
        <div className="space-y-4">

          {/* Admin */}
          <div>
            <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold tracking-wider text-[#5d8ae8] uppercase">
              <div className="flex items-center gap-2.5">
                <Settings size={16} className="text-[#5d8ae8]" />
                <span>Admin</span>
              </div>
              <ChevronUp size={14} className="text-[#5d8ae8]" />
            </div>
            
            <div className="mt-2 pl-3 space-y-1 border-l border-white/5 ml-5">
              <button 
                onClick={() => setActiveSection('users-access')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md cursor-pointer transition-all ${
                  activeSection === 'users-access'
                    ? 'text-white bg-[#2563eb]/90 font-bold'
                    : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>Users & Access</span>
              </button>

              <button 
                onClick={() => setActiveSection('categories-management')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md cursor-pointer transition-all ${
                  activeSection === 'categories-management'
                    ? 'text-white bg-[#2563eb]/90 font-bold'
                    : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>Categories Management</span>
              </button>
            </div>
          </div>

          {/* Collapsed Sidebar Accordion Groups */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            {/* Report */}
            <div className="flex items-center justify-between px-3 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-100 rounded-lg cursor-not-allowed transition-colors">
              <div className="flex items-center gap-2.5">
                <FileText size={16} />
                <span>Report</span>
              </div>
              <ChevronDown size={14} className="text-neutral-500" />
            </div>

            {/* Super Admin */}
            <div>
              <div 
                onClick={() => setIsSuperAdminOpen(!isSuperAdminOpen)}
                className="flex items-center justify-between px-3 py-2 text-xs font-semibold tracking-wider text-[#5d8ae8] uppercase cursor-pointer hover:bg-white/5 rounded-lg transition-colors"
                id="sidebar_super_admin_toggle"
              >
                <div className="flex items-center gap-2.5">
                  <Shield size={16} className="text-[#5d8ae8]" />
                  <span>Super Admin</span>
                </div>
                {isSuperAdminOpen ? (
                  <ChevronUp size={14} className="text-[#5d8ae8]" />
                ) : (
                  <ChevronDown size={14} className="text-[#5d8ae8]" />
                )}
              </div>
              
              {isSuperAdminOpen && (
                <div className="mt-2 pl-3 space-y-1 border-l border-white/5 ml-5">
                  <button 
                    onClick={() => setActiveSection('internal-insight')}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md cursor-pointer transition-all ${
                      activeSection === 'internal-insight'
                        ? 'text-white bg-[#2563eb]/90 font-bold'
                        : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                    }`}
                    id="sidebar_internal_insight_btn"
                  >
                    <span>Internal Insight</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Blocks */}
      <div className="p-4 border-t border-white/5 space-y-4">
        {/* Knowledge Base link */}
        <div className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-100 rounded-lg cursor-not-allowed transition-colors">
          <HelpCircle size={16} />
          <span>Knowledge base</span>
        </div>

        {/* User Card */}
        <div className="flex items-center justify-between bg-white/5 rounded-xl p-3 border border-white/5">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Avatar bubble */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#3b82f6] to-[#60a5fa] flex items-center justify-center shrink-0">
              <span className="font-sans font-bold text-xs tracking-tight text-white">PS</span>
            </div>
            <div className="min-w-0 leading-tight">
              <h4 className="text-xs font-semibold text-neutral-200 truncate">Priya Sharma</h4>
              <p className="text-[10px] text-neutral-400 truncate">Thriwe Admin - Zenith</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="p-1.5 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-red-400 transition-colors cursor-pointer ml-1"
            title="Log Out to Website"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
   </>
  );
};
