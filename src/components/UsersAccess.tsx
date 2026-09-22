import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Search, 
  Filter, 
  MoreVertical, 
  RefreshCw, 
  UserCheck, 
  UserX, 
  Check, 
  X, 
  FileText, 
  CheckSquare, 
  ChevronDown, 
  History, 
  Info, 
  Briefcase,
  Sliders,
  Mail,
  Lock,
  Globe,
  AlertCircle
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Org Admin' | 'Manager' | 'Viewer';
  categoryScope: string[]; // e.g. ["Credit Cards", "Wealth Advisory"] or ["All"]
  status: 'Active' | 'Invited' | 'Disabled';
  lastLogin: string;
  avatar: string;
}

interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  details: string;
}

const AVAILABLE_CATEGORIES = [
  "Credit Cards",
  "Wealth Advisory",
  "Retail Banking",
  "Personal Loans",
  "Business Loans"
];

const INITIAL_USERS: User[] = [
  {
    id: "USR-001",
    name: "Priya Sharma",
    email: "priya.sharma@zenith.com",
    role: "Org Admin",
    categoryScope: ["All"],
    status: "Active",
    lastLogin: "Today, 10:42 AM",
    avatar: "PS"
  },
  {
    id: "USR-002",
    name: "Sidhartha Rajput",
    email: "sidhartha.rajput@thriwe.com",
    role: "Manager",
    categoryScope: ["Credit Cards", "Wealth Advisory"],
    status: "Active",
    lastLogin: "Yesterday, 04:15 PM",
    avatar: "SR"
  },
  {
    id: "USR-003",
    name: "Amit Patel",
    email: "amit.patel@zenith.com",
    role: "Viewer",
    categoryScope: ["Wealth Advisory"],
    status: "Active",
    lastLogin: "14 Sep 2026, 11:20 AM",
    avatar: "AP"
  },
  {
    id: "USR-004",
    name: "Rohan Sen",
    email: "rohan.sen@zenith.com",
    role: "Manager",
    categoryScope: ["Credit Cards"],
    status: "Invited",
    lastLogin: "Never",
    avatar: "RS"
  },
  {
    id: "USR-005",
    name: "Neha Gupta",
    email: "neha.gupta@zenith.com",
    role: "Viewer",
    categoryScope: ["All"],
    status: "Disabled",
    lastLogin: "01 Sep 2026, 09:30 AM",
    avatar: "NG"
  }
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: "AUD-001",
    timestamp: "2026-09-17T02:30:15-07:00",
    actor: "Priya Sharma",
    action: "Invited user",
    target: "rohan.sen@zenith.com",
    details: "Role: Manager, Scope: Credit Cards"
  },
  {
    id: "AUD-002",
    timestamp: "2026-09-16T15:10:22-07:00",
    actor: "Priya Sharma",
    action: "Changed role",
    target: "sidhartha.rajput@thriwe.com",
    details: "Changed role from Viewer to Manager"
  },
  {
    id: "AUD-003",
    timestamp: "2026-09-15T09:45:10-07:00",
    actor: "Priya Sharma",
    action: "Deactivated user",
    target: "neha.gupta@zenith.com",
    details: "Status changed to Disabled due to security policy"
  },
  {
    id: "AUD-004",
    timestamp: "2026-09-14T11:05:00-07:00",
    actor: "Priya Sharma",
    action: "Approved data scope change",
    target: "amit.patel@zenith.com",
    details: "Scope restricted to 'Wealth Advisory' only"
  }
];

export const UsersAccess: React.FC = () => {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Invited' | 'Disabled'>('All');
  
  // Invite form states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'Org Admin' | 'Manager' | 'Viewer'>('Viewer');
  const [inviteScopeType, setInviteScopeType] = useState<'All' | 'Custom'>('All');
  const [selectedScopeCategories, setSelectedScopeCategories] = useState<string[]>([]);
  
  // Row action and edit states
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserRole, setEditingUserRole] = useState<'Org Admin' | 'Manager' | 'Viewer'>('Viewer');
  const [editingUserScope, setEditingUserScope] = useState<string[]>([]);
  const [editingUserScopeType, setEditingUserScopeType] = useState<'All' | 'Custom'>('All');
  
  // Row action menu dropdown track
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);
  const [expandedAuditUserId, setExpandedAuditUserId] = useState<string | null>(null);
  
  // Custom styled floating notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Log action helper
  const logAuditAction = (action: string, target: string, details: string) => {
    const newLog: AuditLog = {
      id: "AUD-" + Math.floor(Math.random() * 90000 + 10000),
      timestamp: new Date().toISOString(),
      actor: "Priya Sharma (Org Admin)",
      action,
      target,
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Submit invite handler
  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) {
      triggerToast("Please fill in both name and email fields.");
      return;
    }
    if (!inviteEmail.includes('@')) {
      triggerToast("Please enter a valid business email address.");
      return;
    }

    const scope = inviteScopeType === 'All' ? ["All"] : selectedScopeCategories;
    if (inviteScopeType === 'Custom' && scope.length === 0) {
      triggerToast("Please select at least one organization category for scope.");
      return;
    }

    const newUser: User = {
      id: "USR-" + Math.floor(Math.random() * 90000 + 10000),
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      categoryScope: scope,
      status: "Invited",
      lastLogin: "Never",
      avatar: inviteName.split(' ').map(n => n[0]).join('').toUpperCase()
    };

    setUsers(prev => [newUser, ...prev]);
    logAuditAction("Invited user", inviteEmail, `Role: ${inviteRole}, Scope: ${scope.join(', ')}`);
    triggerToast(`Roster updated: Invited ${inviteName} successfully.`);
    
    // Reset form
    setInviteEmail('');
    setInviteName('');
    setInviteRole('Viewer');
    setInviteScopeType('All');
    setSelectedScopeCategories([]);
  };

  // Action: Resend Invite
  const handleResendInvite = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'Invited' } : u));
    logAuditAction("Resent invitation link", user.email, `Invitation link refreshed for ${user.name}`);
    triggerToast(`Refreshed: Invitation email resent to ${user.email}.`);
    setActiveMenuUserId(null);
  };

  // Action: Deactivate / Reactivate
  const handleToggleStatus = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const newStatus = user.status === 'Disabled' ? 'Active' : 'Disabled';
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    
    const verb = newStatus === 'Disabled' ? "Deactivated user" : "Reactivated user";
    logAuditAction(verb, user.email, `Status changed from ${user.status} to ${newStatus}`);
    triggerToast(`Status update: ${user.name} is now ${newStatus}.`);
    setActiveMenuUserId(null);
  };

  // Save changes to edited user
  const handleSaveUserEdits = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const finalScope = editingUserScopeType === 'All' ? ["All"] : editingUserScope;
    if (editingUserScopeType === 'Custom' && finalScope.length === 0) {
      triggerToast("Please choose at least one category scope.");
      return;
    }

    setUsers(prev => prev.map(u => u.id === userId ? {
      ...u,
      role: editingUserRole,
      categoryScope: finalScope
    } : u));

    logAuditAction(
      "Updated user access metadata", 
      user.email, 
      `Changed role to ${editingUserRole}, Scope to: ${finalScope.join(', ')}`
    );
    
    triggerToast(`Successfully saved changes for ${user.name}.`);
    setEditingUserId(null);
    setActiveMenuUserId(null);
  };

  // Start edit flow for a user
  const startEditFlow = (user: User) => {
    setEditingUserId(user.id);
    setEditingUserRole(user.role);
    setEditingUserScope(user.categoryScope.includes("All") ? [] : user.categoryScope);
    setEditingUserScopeType(user.categoryScope.includes("All") ? 'All' : 'Custom');
    setActiveMenuUserId(null);
  };

  // Filter users roster
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pt-4 pb-12 select-none">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-neutral-400 font-bold">
            SYSTEM ADMINISTRATION
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 mt-1 flex items-center gap-2">
            <Users size={22} className="text-[#2563eb]" />
            <span>Users & Access</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage organization members, assign roles, and configure strict security category scopes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-[#0b0c0e] text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shadow-sm">
            <Shield size={14} className="text-[#5d8ae8]" />
            <span>Active Tenant: ZENITH</span>
          </span>
        </div>
      </div>

      {/* TWO COLUMN CONTENT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: ROSTER LIST & STATUS FILTERS (Takes 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white border border-neutral-200/80 rounded-xl shadow-sm overflow-hidden">
            {/* Search and Filters Header */}
            <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-2.5 text-neutral-400" />
                <input 
                  type="text"
                  placeholder="Search user by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg placeholder-neutral-400 text-neutral-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Status Tabs */}
              <div className="flex items-center gap-1 bg-neutral-200/50 p-1 rounded-lg">
                {(['All', 'Active', 'Invited', 'Disabled'] as const).map((status) => (
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

            {/* User List Table */}
            <div className="overflow-x-auto">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center">
                  <UserX size={36} className="mx-auto text-neutral-300 mb-2" />
                  <p className="text-xs font-semibold text-neutral-600">No matching users found</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Try widening your filters or inviting a new team member.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-100 text-[9px] font-mono uppercase tracking-wider text-neutral-400 bg-neutral-50/20 select-none">
                      <th className="px-5 py-3 font-semibold">User Details</th>
                      <th className="px-5 py-3 font-semibold">Security Role</th>
                      <th className="px-5 py-3 font-semibold">Category Scope</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold">Last Login</th>
                      <th className="px-5 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-xs">
                    {filteredUsers.map((user) => {
                      const isEditing = editingUserId === user.id;
                      const hasAuditTrail = expandedAuditUserId === user.id;

                      return (
                        <React.Fragment key={user.id}>
                          <tr className={`hover:bg-neutral-50/40 transition-colors ${user.status === 'Disabled' ? 'bg-neutral-50/20 text-neutral-400' : ''}`}>
                            {/* Avatar & Email */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center text-xs shrink-0 select-none ${
                                  user.status === 'Disabled' 
                                    ? 'bg-neutral-200 text-neutral-400' 
                                    : 'bg-gradient-to-tr from-blue-100 to-blue-50 text-blue-700'
                                }`}>
                                  {user.avatar}
                                </div>
                                <div className="leading-tight">
                                  <h4 className="font-semibold text-neutral-900">{user.name}</h4>
                                  <p className="text-[10px] text-neutral-400 font-mono mt-0.5">{user.email}</p>
                                </div>
                              </div>
                            </td>

                            {/* Security Role */}
                            <td className="px-5 py-4">
                              {isEditing ? (
                                <select
                                  value={editingUserRole}
                                  onChange={(e) => setEditingUserRole(e.target.value as any)}
                                  className="text-xs bg-white border border-neutral-200 p-1 rounded font-medium focus:outline-none"
                                >
                                  <option value="Org Admin">Org Admin</option>
                                  <option value="Manager">Manager</option>
                                  <option value="Viewer">Viewer</option>
                                </select>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <Shield size={12} className={user.role === 'Org Admin' ? 'text-amber-500' : 'text-blue-500'} />
                                  <span className="font-medium text-neutral-800">{user.role}</span>
                                </div>
                              )}
                            </td>

                            {/* Category Scope */}
                            <td className="px-5 py-4">
                              {isEditing ? (
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-1 cursor-pointer">
                                      <input 
                                        type="radio" 
                                        checked={editingUserScopeType === 'All'} 
                                        onChange={() => setEditingUserScopeType('All')}
                                      />
                                      <span className="text-[11px] font-medium">All</span>
                                    </label>
                                    <label className="flex items-center gap-1 cursor-pointer">
                                      <input 
                                        type="radio" 
                                        checked={editingUserScopeType === 'Custom'} 
                                        onChange={() => setEditingUserScopeType('Custom')}
                                      />
                                      <span className="text-[11px] font-medium">Custom</span>
                                    </label>
                                  </div>

                                  {editingUserScopeType === 'Custom' && (
                                    <div className="flex flex-wrap gap-1 p-1.5 border border-neutral-200 rounded bg-neutral-50 max-w-[200px]">
                                      {AVAILABLE_CATEGORIES.map((cat) => {
                                        const isChecked = editingUserScope.includes(cat);
                                        return (
                                          <button
                                            key={cat}
                                            type="button"
                                            onClick={() => {
                                              if (isChecked) {
                                                setEditingUserScope(prev => prev.filter(c => c !== cat));
                                              } else {
                                                setEditingUserScope(prev => [...prev, cat]);
                                              }
                                            }}
                                            className={`text-[9px] px-1.5 py-0.5 rounded font-medium border cursor-pointer ${
                                              isChecked 
                                                ? 'bg-blue-50 text-blue-700 border-blue-300' 
                                                : 'bg-white text-neutral-400 border-neutral-200'
                                            }`}
                                          >
                                            {cat}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex flex-wrap gap-1 max-w-[180px]">
                                  {user.categoryScope.includes("All") ? (
                                    <span className="bg-neutral-100 text-neutral-600 font-mono text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <Globe size={10} />
                                      <span>ALL PORTFOLIOS</span>
                                    </span>
                                  ) : (
                                    user.categoryScope.map((cat) => (
                                      <span 
                                        key={cat} 
                                        className="bg-blue-50 text-blue-700 font-mono text-[9px] font-bold px-2 py-0.5 rounded-sm"
                                      >
                                        {cat}
                                      </span>
                                    ))
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Status Pill */}
                            <td className="px-5 py-4 select-none">
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                user.status === 'Active' 
                                  ? 'bg-emerald-50 text-emerald-700' 
                                  : user.status === 'Invited' 
                                  ? 'bg-amber-50 text-amber-700' 
                                  : 'bg-neutral-100 text-neutral-400'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  user.status === 'Active' ? 'bg-emerald-500' : user.status === 'Invited' ? 'bg-amber-500' : 'bg-neutral-400'
                                }`} />
                                <span>{user.status}</span>
                              </span>
                            </td>

                            {/* Last Login */}
                            <td className="px-5 py-4 font-mono text-[10px] text-neutral-500">
                              {user.lastLogin}
                            </td>

                            {/* Actions column */}
                            <td className="px-5 py-4 text-right relative">
                              {isEditing ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleSaveUserEdits(user.id)}
                                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors"
                                    title="Save Access Parameters"
                                  >
                                    <Check size={16} className="stroke-[3]" />
                                  </button>
                                  <button
                                    onClick={() => setEditingUserId(null)}
                                    className="p-1 text-neutral-400 hover:bg-neutral-100 rounded-lg cursor-pointer transition-colors"
                                    title="Cancel Edit"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-2">
                                  {/* Log trigger */}
                                  <button
                                    onClick={() => {
                                      setExpandedAuditUserId(hasAuditTrail ? null : user.id);
                                    }}
                                    className={`p-1 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer ${hasAuditTrail ? 'text-[#2563eb] bg-blue-50/50' : 'text-neutral-400 hover:text-neutral-700'}`}
                                    title="View Audit History"
                                  >
                                    <History size={14} />
                                  </button>

                                  {/* Row maintenance trigger */}
                                  <div className="relative">
                                    <button
                                      onClick={() => {
                                        setActiveMenuUserId(activeMenuUserId === user.id ? null : user.id);
                                      }}
                                      className="p-1 text-neutral-400 hover:text-neutral-800 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                                    >
                                      <MoreVertical size={14} />
                                    </button>

                                    {/* Actions menu drop panel */}
                                    {activeMenuUserId === user.id && (
                                      <div className="absolute right-0 mt-1 w-48 bg-white border border-neutral-200 rounded-xl shadow-lg py-1.5 z-40 text-left">
                                        <button
                                          onClick={() => startEditFlow(user)}
                                          className="w-full px-3.5 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors flex items-center gap-2 cursor-pointer"
                                        >
                                          <Sliders size={13} className="text-neutral-400" />
                                          <span>Modify Permissions</span>
                                        </button>
                                        
                                        {user.status === 'Invited' && (
                                          <button
                                            onClick={() => handleResendInvite(user.id)}
                                            className="w-full px-3.5 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors flex items-center gap-2 cursor-pointer"
                                          >
                                            <RefreshCw size={13} className="text-neutral-400" />
                                            <span>Resend Invite</span>
                                          </button>
                                        )}

                                        <button
                                          onClick={() => handleToggleStatus(user.id)}
                                          className={`w-full px-3.5 py-1.5 text-xs transition-colors flex items-center gap-2 cursor-pointer ${
                                            user.status === 'Disabled' 
                                              ? 'text-emerald-700 hover:bg-emerald-50/50' 
                                              : 'text-rose-700 hover:bg-rose-50/50'
                                          }`}
                                        >
                                          {user.status === 'Disabled' ? (
                                            <>
                                              <UserCheck size={13} className="text-emerald-500" />
                                              <span>Reactivate User</span>
                                            </>
                                          ) : (
                                            <>
                                              <UserX size={13} className="text-rose-500" />
                                              <span>Deactivate User</span>
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>

                          {/* EXPANDABLE AUDIT TRAIL LOG PER USER */}
                          {hasAuditTrail && (
                            <tr>
                              <td colSpan={6} className="bg-neutral-50/60 p-4 border-b border-neutral-100 select-none">
                                <div className="border-l-2 border-blue-400 pl-4 py-1.5 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                                      <History size={12} className="text-neutral-400" />
                                      <span>Security Audit Records for {user.name}</span>
                                    </h5>
                                    <button 
                                      onClick={() => setExpandedAuditUserId(null)}
                                      className="text-[10px] text-neutral-400 hover:text-neutral-600 underline"
                                    >
                                      Collapse Log
                                    </button>
                                  </div>

                                  <div className="space-y-2">
                                    {auditLogs.filter(log => log.target === user.email).length === 0 ? (
                                      <p className="text-[11px] text-neutral-400 italic">No direct administrative modifications found.</p>
                                    ) : (
                                      auditLogs.filter(log => log.target === user.email).map((log) => (
                                        <div key={log.id} className="text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white border border-neutral-100 p-2.5 rounded-lg shadow-2xs">
                                          <div>
                                            <span className="font-semibold text-neutral-800">{log.action}</span>
                                            <span className="text-neutral-400 font-mono text-[10px] ml-1.5">• Details: {log.details}</span>
                                          </div>
                                          <div className="flex items-center gap-2 text-neutral-500 text-[10px] shrink-0">
                                            <span>By: {log.actor}</span>
                                            <span>•</span>
                                            <span className="font-mono">{new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* SYSTEM GLOBAL AUDIT TRAIL */}
          <div className="bg-white border border-neutral-200/80 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4 select-none">
              <div className="flex items-center gap-2">
                <History size={16} className="text-neutral-500" />
                <h3 className="text-sm font-semibold text-neutral-900">
                  Global Security Audit Trail
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-bold">
                ACCOUNTABILITY LOG
              </span>
            </div>

            <p className="text-xs text-neutral-500 mb-4 select-none">
              All user invitations, role changes, scope adjustments, and access revocations are cryptographically tagged and permanent.
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 bg-neutral-50/50 hover:bg-neutral-50 border border-neutral-200/50 rounded-lg flex flex-col sm:flex-row justify-between gap-2 transition-colors">
                  <div className="leading-normal">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded select-none">
                        {log.action.toUpperCase()}
                      </span>
                      <p className="text-xs font-bold text-neutral-900">{log.target}</p>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5">{log.details}</p>
                  </div>
                  <div className="text-right text-[10px] text-neutral-400 font-mono shrink-0 flex flex-row sm:flex-col justify-between sm:justify-center gap-2">
                    <p className="font-semibold text-neutral-700">By {log.actor}</p>
                    <p>{new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: INVITE USER FORM & ROLE MATRIX CARD */}
        <div className="space-y-6">
          
          {/* INVITE USER FORM CARD */}
          <div className="bg-[#0b0c0e] text-white border border-white/5 rounded-xl p-5 shadow-md">
            <div className="flex items-center gap-2 border-b border-white/5 pb-4 mb-4 select-none">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <UserPlus size={16} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-100">Invite User</h3>
                <p className="text-[10px] text-neutral-400">Add members and restrict category access</p>
              </div>
            </div>

            <form onSubmit={handleInviteUser} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-[10px] font-mono tracking-wider uppercase text-neutral-400 mb-1 font-semibold">
                  Full Name
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Rohan Sen"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-neutral-500 transition-colors"
                />
              </div>

              {/* Email address */}
              <div>
                <label className="block text-[10px] font-mono tracking-wider uppercase text-neutral-400 mb-1 font-semibold">
                  Business Email
                </label>
                <div className="relative">
                  <Mail size={12} className="absolute left-3 top-3 text-neutral-500" />
                  <input 
                    type="email" 
                    placeholder="name@zenith.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-neutral-500 transition-colors"
                  />
                </div>
              </div>

              {/* Role Dropdown */}
              <div>
                <label className="block text-[10px] font-mono tracking-wider uppercase text-neutral-400 mb-1 font-semibold flex items-center gap-1.5">
                  <span>System Role</span>
                  <span className="text-neutral-500 italic lowercase select-none">(determines operations)</span>
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full bg-[#161719] border border-white/10 rounded-lg px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="Viewer">Viewer (Read-only)</option>
                  <option value="Manager">Manager (Category-restricted runner)</option>
                  <option value="Org Admin">Org Admin (Full tenant privileges)</option>
                </select>
              </div>

              {/* Category Scope */}
              <div>
                <label className="block text-[10px] font-mono tracking-wider uppercase text-neutral-400 mb-1 font-semibold">
                  Access Category Scope
                </label>
                <div className="flex items-center gap-4 bg-white/5 p-2 rounded-lg border border-white/5 mb-2 select-none">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                    <input 
                      type="radio" 
                      name="scope-type" 
                      checked={inviteScopeType === 'All'}
                      onChange={() => setInviteScopeType('All')}
                      className="accent-blue-500"
                    />
                    <span>All Portfolios</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                    <input 
                      type="radio" 
                      name="scope-type" 
                      checked={inviteScopeType === 'Custom'}
                      onChange={() => setInviteScopeType('Custom')}
                      className="accent-blue-500"
                    />
                    <span>Custom Limit</span>
                  </label>
                </div>

                {inviteScopeType === 'Custom' && (
                  <div className="border border-white/5 rounded-lg p-2.5 space-y-1.5 bg-[#161719] select-none">
                    <p className="text-[10px] text-neutral-400 mb-1">Check categories this user is cleared to view:</p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {AVAILABLE_CATEGORIES.map((cat) => {
                        const isChecked = selectedScopeCategories.includes(cat);
                        return (
                          <label key={cat} className="flex items-center gap-2 text-xs text-neutral-300 hover:text-white cursor-pointer select-none">
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedScopeCategories(prev => prev.filter(c => c !== cat));
                                } else {
                                  setSelectedScopeCategories(prev => [...prev, cat]);
                                }
                              }}
                              className="rounded accent-blue-500 border-white/10 bg-white/5"
                            />
                            <span>{cat}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all shadow-sm select-none hover:translate-y-[-1px] active:translate-y-0 cursor-pointer"
              >
                Send Secure Invitation
              </button>
            </form>
          </div>

          {/* ROLE & PERMISSION MATRIX (View-only for MVP) */}
          <div className="bg-white border border-neutral-200/80 rounded-xl p-5 shadow-sm select-none">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-3 mb-3">
              <Shield className="text-neutral-500" size={16} />
              <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider font-mono">
                Role & Permission Matrix
              </h4>
            </div>

            <p className="text-[11px] text-neutral-500 mb-4 leading-normal">
              Reference overview of privilege boundaries. Custom policy granularity is supported in Phase-2.
            </p>

            <div className="space-y-4">
              {/* Org Admin Block */}
              <div className="border-l-2 border-amber-400 pl-3 py-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900">Org Admin</span>
                  <span className="text-[9px] font-mono bg-amber-50 text-amber-800 px-1.5 rounded">FULL CONTROL</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 mt-2 text-[10px] text-neutral-600 font-medium">
                  <div className="flex items-center gap-1"><Check className="text-emerald-500" size={12} /><span>Manage Users</span></div>
                  <div className="flex items-center gap-1"><Check className="text-emerald-500" size={12} /><span>Manage Scopes</span></div>
                  <div className="flex items-center gap-1"><Check className="text-emerald-500" size={12} /><span>Create Campaigns</span></div>
                  <div className="flex items-center gap-1"><Check className="text-emerald-500" size={12} /><span>Request Data</span></div>
                </div>
              </div>

              {/* Manager Block */}
              <div className="border-l-2 border-blue-500 pl-3 py-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900">Manager</span>
                  <span className="text-[9px] font-mono bg-blue-50 text-blue-800 px-1.5 rounded">SCOPED PRIVILEGES</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 mt-2 text-[10px] text-neutral-600 font-medium">
                  <div className="flex items-center gap-1"><X className="text-rose-400" size={12} /><span>No User Mgmt</span></div>
                  <div className="flex items-center gap-1"><Check className="text-emerald-500" size={12} /><span>Create Scoped Cam.</span></div>
                  <div className="flex items-center gap-1"><Check className="text-emerald-500" size={12} /><span>View Results</span></div>
                  <div className="flex items-center gap-1"><Check className="text-emerald-500" size={12} /><span>Export Scoped</span></div>
                </div>
              </div>

              {/* Viewer Block */}
              <div className="border-l-2 border-neutral-400 pl-3 py-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900">Viewer</span>
                  <span className="text-[9px] font-mono bg-neutral-100 text-neutral-600 px-1.5 rounded">READ-ONLY</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 mt-2 text-[10px] text-neutral-600 font-medium">
                  <div className="flex items-center gap-1"><X className="text-rose-400" size={12} /><span>No Campaigns</span></div>
                  <div className="flex items-center gap-1"><Check className="text-emerald-500" size={12} /><span>View Results</span></div>
                  <div className="flex items-center gap-1"><X className="text-rose-400" size={12} /><span>No Data Requests</span></div>
                  <div className="flex items-center gap-1"><X className="text-rose-400" size={12} /><span>No User Mgmt</span></div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* CUSTOM FLOATING TOAST NOTIFICATION CONTAINER */}
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
