import React, { useState } from 'react';
import { 
  FolderTree, 
  Plus, 
  Search, 
  Archive, 
  X, 
  Users, 
  Target, 
  History, 
  Check, 
  Edit2, 
  UserPlus, 
  Globe, 
  TrendingUp, 
  ChevronRight,
  Bookmark,
  CheckCircle2,
  Trash2
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string;
  usersAssigned: string[]; // Names of assigned users
  campaignsTagged: string[]; // Names of campaigns tagged
  status: 'Active' | 'Archived';
  createdAt: string;
}

const SYSTEM_USERS = [
  "Priya Sharma",
  "Sidhartha Rajput",
  "Amit Patel",
  "Rohan Sen",
  "Neha Gupta"
];

const INITIAL_CATEGORIES: Category[] = [
  {
    id: "CAT-101",
    name: "Credit Cards",
    description: "Retail and premium card acquisition, reward structures, and festive card upsells.",
    usersAssigned: ["Priya Sharma", "Sidhartha Rajput", "Rohan Sen"],
    campaignsTagged: ["Festive Season Push", "Premium Card Upsell"],
    status: "Active",
    createdAt: "10 Jan 2026"
  },
  {
    id: "CAT-102",
    name: "Wealth Advisory",
    description: "HNI client onboarding, customized portfolio reviews, and discretionary advisors.",
    usersAssigned: ["Priya Sharma", "Sidhartha Rajput", "Amit Patel"],
    campaignsTagged: ["HNI Wealth Onboarding", "NRI Wealth Push"],
    status: "Active",
    createdAt: "15 Jan 2026"
  },
  {
    id: "CAT-103",
    name: "Retail Banking",
    description: "Standard savings account signups, debit card activation, and digital lockers.",
    usersAssigned: ["Priya Sharma"],
    campaignsTagged: [],
    status: "Active",
    createdAt: "20 Jan 2026"
  },
  {
    id: "CAT-104",
    name: "Personal Loans",
    description: "Unsecured high-speed personal credit lines and payroll overdraft systems.",
    usersAssigned: ["Priya Sharma"],
    campaignsTagged: [],
    status: "Active",
    createdAt: "01 Feb 2026"
  },
  {
    id: "CAT-105",
    name: "Business Loans",
    description: "SME working capital loans, collateralized trade credit, and machinery financing.",
    usersAssigned: ["Priya Sharma"],
    campaignsTagged: [],
    status: "Archived",
    createdAt: "05 Feb 2026"
  }
];

export const CategoriesManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Archived'>('All');
  
  // Creation form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatDescription, setNewCatDescription] = useState('');
  
  // Detail drawer state
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAssigningUser, setIsAssigningUser] = useState(false);
  
  // Editing category state
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [editingCatDescription, setEditingCatDescription] = useState('');

  // Floating notifications feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Create Category
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || !newCatDescription) {
      triggerToast("Please provide both a name and a description.");
      return;
    }
    
    // Check for duplicates
    if (categories.some(c => c.name.toLowerCase() === newCatName.toLowerCase())) {
      triggerToast(`A category named "${newCatName}" already exists.`);
      return;
    }

    const newCategory: Category = {
      id: "CAT-" + Math.floor(Math.random() * 900 + 100),
      name: newCatName,
      description: newCatDescription,
      usersAssigned: ["Priya Sharma"], // Default creator assignment
      campaignsTagged: [],
      status: "Active",
      createdAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    setCategories(prev => [newCategory, ...prev]);
    triggerToast(`Created category: "${newCatName}" successfully.`);
    setNewCatName('');
    setNewCatDescription('');
  };

  // Archive / Reactivate Category
  const handleToggleArchiveCategory = (catId: string) => {
    setCategories(prev => prev.map(c => {
      if (c.id === catId) {
        const nextStatus = c.status === 'Archived' ? 'Active' : 'Archived';
        triggerToast(`Category "${c.name}" is now ${nextStatus}.`);
        
        // If selected in drawer, sync status
        if (selectedCategory?.id === catId) {
          setSelectedCategory(prevSelected => prevSelected ? { ...prevSelected, status: nextStatus } : null);
        }
        
        return { ...c, status: nextStatus };
      }
      return c;
    }));
  };

  // Edit category trigger
  const startEditCategory = (cat: Category) => {
    setEditingCatId(cat.id);
    setEditingCatName(cat.name);
    setEditingCatDescription(cat.description);
  };

  // Save category edits
  const handleSaveCategoryEdits = (catId: string) => {
    if (!editingCatName || !editingCatDescription) {
      triggerToast("Fields cannot be empty.");
      return;
    }

    setCategories(prev => prev.map(c => {
      if (c.id === catId) {
        const updated = { ...c, name: editingCatName, description: editingCatDescription };
        if (selectedCategory?.id === catId) {
          setSelectedCategory(updated);
        }
        return updated;
      }
      return c;
    }));

    triggerToast("Category definitions updated successfully.");
    setEditingCatId(null);
  };

  // Assign user to category
  const handleToggleUserAssignment = (username: string) => {
    if (!selectedCategory) return;
    
    setCategories(prev => prev.map(c => {
      if (c.id === selectedCategory.id) {
        const alreadyAssigned = c.usersAssigned.includes(username);
        let nextUsers: string[];
        if (alreadyAssigned) {
          // Prevent removing the sole admin if desired, but keep simple
          nextUsers = c.usersAssigned.filter(u => u !== username);
        } else {
          nextUsers = [...c.usersAssigned, username];
        }
        
        const updated = { ...c, usersAssigned: nextUsers };
        setSelectedCategory(updated);
        return updated;
      }
      return c;
    }));
  };

  // Open Details Drawer
  const openDetailsDrawer = (cat: Category) => {
    setSelectedCategory(cat);
    setIsDrawerOpen(true);
    setIsAssigningUser(false);
  };

  const filteredCategories = categories.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pt-4 pb-12 select-none relative">
      
      {/* HEADER BLOCK */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-neutral-400 font-bold">
            SYSTEM SETUP
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 mt-1 flex items-center gap-2">
            <FolderTree size={22} className="text-[#2563eb]" />
            <span>Categories Management</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Define organizational boundaries, regional divisions, and assigned personnel scope buckets.
          </p>
        </div>
      </div>

      {/* TWO COLUMN MASTER LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COMPONENT (70%): List & Search of Categories */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-neutral-200/80 rounded-xl shadow-sm overflow-hidden">
            {/* Search + filter bar */}
            <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-2.5 text-neutral-400" />
                <input 
                  type="text"
                  placeholder="Search categories by name or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg placeholder-neutral-400 text-neutral-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-1 bg-neutral-200/50 p-1 rounded-lg">
                {(['All', 'Active', 'Archived'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                      statusFilter === status 
                        ? 'bg-white text-neutral-900 shadow-xs' 
                        : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-100 text-[9px] font-mono uppercase tracking-wider text-neutral-400 bg-neutral-50/20 select-none">
                    <th className="px-5 py-3 font-semibold">Category Name</th>
                    <th className="px-5 py-3 font-semibold">Purpose & Description</th>
                    <th className="px-5 py-3 font-semibold text-center">Assigned Users</th>
                    <th className="px-5 py-3 font-semibold text-center">Tagged Campaigns</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs">
                  {filteredCategories.map((cat) => {
                    const isEditing = editingCatId === cat.id;

                    return (
                      <tr key={cat.id} className="hover:bg-neutral-50/50 transition-all">
                        {/* Name Column */}
                        <td className="px-5 py-4">
                          {isEditing ? (
                            <input 
                              type="text"
                              value={editingCatName}
                              onChange={(e) => setEditingCatName(e.target.value)}
                              className="text-xs bg-white border border-neutral-200 p-1 rounded font-bold w-32 focus:outline-none"
                            />
                          ) : (
                            <button
                              onClick={() => openDetailsDrawer(cat)}
                              className="text-left font-bold text-neutral-900 hover:text-blue-600 hover:underline flex items-center gap-1 group cursor-pointer"
                            >
                              <span>{cat.name}</span>
                              <ChevronRight size={12} className="text-neutral-300 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                          )}
                        </td>

                        {/* Description Column */}
                        <td className="px-5 py-4 text-neutral-500 font-normal leading-normal max-w-xs">
                          {isEditing ? (
                            <textarea
                              value={editingCatDescription}
                              onChange={(e) => setEditingCatDescription(e.target.value)}
                              className="text-xs bg-white border border-neutral-200 p-1.5 rounded w-full h-12 focus:outline-none"
                            />
                          ) : (
                            <span className="line-clamp-2">{cat.description}</span>
                          )}
                        </td>

                        {/* Users Assigned Count */}
                        <td className="px-5 py-4 text-center select-none">
                          <button 
                            onClick={() => openDetailsDrawer(cat)}
                            className="bg-neutral-50 hover:bg-neutral-100 text-neutral-700 font-mono text-[10px] font-bold px-2 py-1 rounded-md border border-neutral-200/50 cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <Users size={11} className="text-neutral-400" />
                            <span>{cat.usersAssigned.length} Users</span>
                          </button>
                        </td>

                        {/* Campaigns Count */}
                        <td className="px-5 py-4 text-center select-none">
                          <span className="bg-neutral-50 text-neutral-700 font-mono text-[10px] font-bold px-2 py-1 rounded-md border border-neutral-200/50 inline-flex items-center gap-1.5">
                            <Target size={11} className="text-neutral-400" />
                            <span>{cat.campaignsTagged.length} Campaigns</span>
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4 select-none">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            cat.status === 'Active' 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : 'bg-neutral-100 text-neutral-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cat.status === 'Active' ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                            <span>{cat.status}</span>
                          </span>
                        </td>

                        {/* Row Actions */}
                        <td className="px-5 py-4 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleSaveCategoryEdits(cat.id)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer"
                                title="Save"
                              >
                                <Check size={14} className="stroke-[3]" />
                              </button>
                              <button
                                onClick={() => setEditingCatId(null)}
                                className="p-1 text-neutral-400 hover:bg-neutral-100 rounded-lg cursor-pointer"
                                title="Cancel"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => startEditCategory(cat)}
                                className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg cursor-pointer transition-colors"
                                title="Edit Definition"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleToggleArchiveCategory(cat.id)}
                                className={`p-1 rounded-lg cursor-pointer transition-colors ${
                                  cat.status === 'Archived' 
                                    ? 'text-emerald-600 hover:bg-emerald-50' 
                                    : 'text-neutral-400 hover:text-rose-600 hover:bg-rose-50'
                                }`}
                                title={cat.status === 'Archived' ? "Restore Category" : "Archive Category"}
                              >
                                <Archive size={13} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COMPONENT (30%): New Category Form */}
        <div className="space-y-6">
          
          <div className="bg-[#0b0c0e] text-white border border-white/5 rounded-xl p-5 shadow-md">
            <div className="flex items-center gap-2 border-b border-white/5 pb-4 mb-4 select-none">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Plus size={16} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-100">New Category</h3>
                <p className="text-[10px] text-neutral-400">Flat definitions for campaigns & users</p>
              </div>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              {/* Category Name */}
              <div>
                <label className="block text-[10px] font-mono tracking-wider uppercase text-neutral-400 mb-1 font-semibold">
                  Category Name
                </label>
                <input 
                  type="text"
                  placeholder="e.g. Retail Banking"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-neutral-500 transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-mono tracking-wider uppercase text-neutral-400 mb-1 font-semibold">
                  Category Description & Scope
                </label>
                <textarea
                  placeholder="What campaigns or regional units fall under this category scope..."
                  value={newCatDescription}
                  onChange={(e) => setNewCatDescription(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white h-24 focus:outline-none focus:border-blue-500 placeholder-neutral-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all shadow-sm hover:translate-y-[-1px] active:translate-y-0 cursor-pointer"
              >
                Create Category Segment
              </button>
            </form>
          </div>

          {/* POLICY EXPLAINER CARD */}
          <div className="bg-white border border-neutral-200/80 rounded-xl p-5 shadow-sm select-none">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-3 mb-3">
              <Bookmark className="text-neutral-500" size={16} />
              <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider font-mono">
                Archival vs Deletion
              </h4>
            </div>

            <p className="text-xs text-neutral-500 leading-normal mb-3">
              To guarantee historical audit accountability, retired category definitions are **Archived** rather than hard deleted.
            </p>
            <p className="text-xs text-neutral-600 font-semibold flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-500" />
              <span>Prior tagged campaigns keep records intact.</span>
            </p>
          </div>

        </div>

      </div>

      {/* DETAIL SIDE DRAWER (Category detail: users, campaigns, activity) */}
      {isDrawerOpen && selectedCategory && (
        <>
          {/* Backdrop */}
          <div 
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-neutral-950/40 z-40 backdrop-blur-3xs"
          />
          
          {/* Slider Drawer Panel */}
          <div className="fixed inset-y-0 right-0 w-full sm:max-w-md bg-white border-l border-neutral-200 shadow-2xl z-50 p-6 overflow-y-auto space-y-6 flex flex-col justify-between select-none animate-in slide-in-from-right duration-300">
            <div className="space-y-6">
              {/* Drawer header */}
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                <div>
                  <span className="text-[9px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">
                    {selectedCategory.id}
                  </span>
                  <h3 className="text-lg font-bold text-neutral-900 mt-1">{selectedCategory.name}</h3>
                </div>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-neutral-800 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scope Explainer */}
              <div>
                <h4 className="text-[10px] font-mono tracking-wider uppercase text-neutral-400 font-semibold mb-1.5">
                  Scope Objective
                </h4>
                <p className="text-xs text-neutral-600 leading-relaxed bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                  {selectedCategory.description}
                </p>
              </div>

              {/* Assigned Users Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-mono tracking-wider uppercase text-neutral-400 font-semibold flex items-center gap-1">
                    <Users size={12} />
                    <span>Assigned Personnel ({selectedCategory.usersAssigned.length})</span>
                  </h4>
                  <button
                    onClick={() => setIsAssigningUser(!isAssigningUser)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus size={12} />
                    <span>Manage assignments</span>
                  </button>
                </div>

                {/* Manage User Assignments Selection list */}
                {isAssigningUser ? (
                  <div className="border border-neutral-200 rounded-lg p-3 bg-neutral-50 space-y-2">
                    <p className="text-[10px] text-neutral-500 font-medium">Click on a user to assign or remove them from this category:</p>
                    <div className="space-y-1">
                      {SYSTEM_USERS.map((username) => {
                        const isChecked = selectedCategory.usersAssigned.includes(username);
                        return (
                          <button
                            key={username}
                            onClick={() => handleToggleUserAssignment(username)}
                            className={`w-full flex items-center justify-between p-2 rounded text-xs transition-colors text-left cursor-pointer ${
                              isChecked 
                                ? 'bg-blue-50 text-blue-700 font-semibold' 
                                : 'bg-white text-neutral-600 hover:bg-neutral-100/50 border border-neutral-100'
                            }`}
                          >
                            <span>{username}</span>
                            {isChecked && <Check size={14} className="text-blue-600 stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCategory.usersAssigned.length === 0 ? (
                      <p className="text-xs text-neutral-400 italic">No direct personnel assignments. Anyone with scope "All" has read access.</p>
                    ) : (
                      selectedCategory.usersAssigned.map((u) => (
                        <span key={u} className="bg-neutral-100 text-neutral-800 px-2.5 py-1 rounded-md text-xs font-semibold border border-neutral-200/40 inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          <span>{u}</span>
                        </span>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Tagged Campaigns */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-mono tracking-wider uppercase text-neutral-400 font-semibold flex items-center gap-1 select-none">
                  <Target size={12} />
                  <span>Tagged Active Campaigns ({selectedCategory.campaignsTagged.length})</span>
                </h4>
                {selectedCategory.campaignsTagged.length === 0 ? (
                  <p className="text-xs text-neutral-400 italic">No campaigns are currently tagged to this retired or newly defined category.</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedCategory.campaignsTagged.map((camp) => (
                      <div key={camp} className="p-2.5 border border-neutral-200/70 rounded-lg flex items-center justify-between bg-neutral-50/50">
                        <span className="text-xs font-bold text-neutral-800">{camp}</span>
                        <span className="text-[9px] font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-semibold">ACTIVE</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Small activity log */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-mono tracking-wider uppercase text-neutral-400 font-semibold flex items-center gap-1 select-none">
                  <History size={12} />
                  <span>Operational Activity Rollup</span>
                </h4>
                <div className="space-y-2 font-mono text-[10px] text-neutral-500 bg-neutral-50 p-3 rounded-lg border border-neutral-100 max-h-36 overflow-y-auto scrollbar-thin">
                  <p className="pb-1.5 border-b border-neutral-200/50">
                    <span className="text-neutral-700 font-bold">17 Sep 2026:</span> Priya Sharma updated user assignments for segment {selectedCategory.name}.
                  </p>
                  <p className="pb-1.5 border-b border-neutral-200/50">
                    <span className="text-neutral-700 font-bold">12 Sep 2026:</span> System scrubbed list matching keys against this category.
                  </p>
                  <p>
                    <span className="text-neutral-700 font-bold">01 Sep 2026:</span> Category segment initialized for Zenith Bank.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer triggers */}
            <div className="pt-4 border-t border-neutral-100 flex items-center justify-between gap-3">
              <button
                onClick={() => handleToggleArchiveCategory(selectedCategory.id)}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer text-center ${
                  selectedCategory.status === 'Archived' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/50' 
                    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/50'
                }`}
              >
                {selectedCategory.status === 'Archived' ? "Restore Category" : "Archive Category"}
              </button>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="py-2 px-4 text-xs font-bold border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 rounded-lg cursor-pointer transition-all"
              >
                Close View
              </button>
            </div>
          </div>
        </>
      )}

      {/* CUSTOM TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#0b0c0e] text-white border border-white/10 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
            <Check size={12} className="text-white" />
          </div>
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-neutral-400 hover:text-white transition-colors cursor-pointer pl-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

    </div>
  );
};
