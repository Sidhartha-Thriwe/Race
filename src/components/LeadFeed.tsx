import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Download, 
  Eye, 
  Plus, 
  Users, 
  Award, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  SlidersHorizontal,
  Mail,
  Phone,
  Building,
  CheckCircle,
  HelpCircle,
  Clock,
  ExternalLink,
  PlusCircle,
  MapPin,
  Trash2,
  FileText
} from 'lucide-react';
import { Campaign } from './CampaignBuilder';

// Lead Interface
export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  spendBucket: string; // Net Worth Bucket or Spend Capacity
  confidence: 'High' | 'Medium' | 'Low';
  competitors: string[]; // Active competitors pitching to them
  campaignId: string; // Source campaign
  dateReceived: string; // "YYYY-MM-DD"
  assignedTo: string; // Rajesh K., Ananya S., Sidhartha R., Unassigned
  status: 'New' | 'Contacted' | 'Not interested' | 'Converted';
  location: string;
  category: string;
  persona: string;
  engagementHistory: Array<{
    id: string;
    date: string;
    type: 'Status Change' | 'Assignment' | 'Note Added' | 'System';
    text: string;
    user?: string;
  }>;
}

interface LeadFeedProps {
  campaigns: Campaign[];
  initialCampaignFilter?: string | null;
  onClearInitialCampaign?: () => void;
}

// Highly realistic mock dataset for Lead Feed
const INITIAL_LEADS: Lead[] = [
  {
    id: "LEAD-2041",
    name: "Vikram Malhotra",
    email: "vikram.m@malhotragroup.in",
    phone: "+91 98110 54321",
    company: "Malhotra Enterprises",
    role: "Managing Director",
    spendBucket: "₹5Cr - ₹10Cr",
    confidence: "High",
    competitors: ["HDFC Bank", "HSBC"],
    campaignId: "CAMP-10485", // Global UHNI Yield
    dateReceived: "2026-09-15",
    assignedTo: "Sidhartha R.",
    status: "New",
    location: "Mumbai",
    category: "Wealth Advisory",
    persona: "UHNI",
    engagementHistory: [
      { id: "h1", date: "2026-09-15 10:30 AM", type: "System", text: "Lead captured via Global UHNI Yield campaign form." },
      { id: "h2", date: "2026-09-15 11:00 AM", type: "Assignment", text: "Auto-assigned to Sidhartha R. based on regional high-net-worth routing logic.", user: "System" }
    ]
  },
  {
    id: "LEAD-2042",
    name: "Anjali Deshmukh",
    email: "anjali.deshmukh@techventures.co",
    phone: "+91 99300 87654",
    company: "TechVentures India",
    role: "Co-Founder & CEO",
    spendBucket: "₹10Cr+",
    confidence: "High",
    competitors: ["Kotak Wealth"],
    campaignId: "CAMP-10485", // Global UHNI Yield
    dateReceived: "2026-09-14",
    assignedTo: "Ananya S.",
    status: "Contacted",
    location: "Bengaluru",
    category: "Wealth Advisory",
    persona: "UHNI",
    engagementHistory: [
      { id: "h3", date: "2026-09-14 02:15 PM", type: "System", text: "Lead captured via Global UHNI Yield landing page." },
      { id: "h4", date: "2026-09-14 02:30 PM", type: "Assignment", text: "Assigned to Ananya S. manually by Admin Rajesh K.", user: "Rajesh K." },
      { id: "h5", date: "2026-09-15 09:15 AM", type: "Note Added", text: "Left a voicemail regarding bespoke offshore asset allocation schemes. Plan to call again tomorrow.", user: "Ananya S." },
      { id: "h6", date: "2026-09-15 09:15 AM", type: "Status Change", text: "Status updated from 'New' to 'Contacted'", user: "Ananya S." }
    ]
  },
  {
    id: "LEAD-2043",
    name: "Rohan Singhal",
    email: "rohan@singhalmetals.com",
    phone: "+91 98450 12345",
    company: "Singhal Metals Ltd.",
    role: "Executive Director",
    spendBucket: "₹1Cr - ₹5Cr",
    confidence: "Medium",
    competitors: ["ICICI Bank", "Standard Chartered"],
    campaignId: "CAMP-94182", // Corporate Trust Advantage
    dateReceived: "2026-09-13",
    assignedTo: "Rajesh K.",
    status: "New",
    location: "Delhi NCR",
    category: "Corporate Trust",
    persona: "HNI",
    engagementHistory: [
      { id: "h7", date: "2026-09-13 11:45 AM", type: "System", text: "Lead registered through Trust and Estate Planning webinar download." },
      { id: "h8", date: "2026-09-13 12:05 PM", type: "Assignment", text: "Auto-assigned to Rajesh K. based on corporate accounts assignment table.", user: "System" }
    ]
  },
  {
    id: "LEAD-2044",
    name: "Priya Chandrasekhar",
    email: "p.chandrasekhar@icloud.com",
    phone: "+91 94440 98765",
    company: "Self-Employed",
    role: "Independent Consultant",
    spendBucket: "₹50L - ₹1Cr",
    confidence: "Low",
    competitors: ["None"],
    campaignId: "CAMP-38102", // Sovereign Yields Elite
    dateReceived: "2026-09-12",
    assignedTo: "Unassigned",
    status: "New",
    location: "Chennai",
    category: "Structured Notes",
    persona: "Mass affluent",
    engagementHistory: [
      { id: "h9", date: "2026-09-12 04:10 PM", type: "System", text: "Lead captured via Sovereign Yield premium calculator widget." }
    ]
  },
  {
    id: "LEAD-2045",
    name: "Amitabh Banerjee",
    email: "amitabh.b@banerjeecapital.in",
    phone: "+91 98300 24680",
    company: "Banerjee Capital",
    role: "Managing Partner",
    spendBucket: "₹10Cr+",
    confidence: "High",
    competitors: ["HDFC Bank", "Kotak Wealth", "HSBC"],
    campaignId: "CAMP-10485", // Global UHNI Yield
    dateReceived: "2026-09-10",
    assignedTo: "Sidhartha R.",
    status: "Converted",
    location: "Kolkata",
    category: "Wealth Advisory",
    persona: "UHNI",
    engagementHistory: [
      { id: "h10", date: "2026-09-10 09:30 AM", type: "System", text: "Captured from UHNI offshore allocation brochure inquiry." },
      { id: "h11", date: "2026-09-10 10:15 AM", type: "Assignment", text: "Assigned to Sidhartha R.", user: "System" },
      { id: "h12", date: "2026-09-11 02:00 PM", type: "Note Added", text: "Initial consultation done. High interest in overseas trust structured notes.", user: "Sidhartha R." },
      { id: "h13", date: "2026-09-15 04:30 PM", type: "Note Added", text: "Onboarded client with initial wire of ₹12 Crores. Account opened successfully.", user: "Sidhartha R." },
      { id: "h14", date: "2026-09-15 04:30 PM", type: "Status Change", text: "Status updated to 'Converted'", user: "Sidhartha R." }
    ]
  },
  {
    id: "LEAD-2046",
    name: "Sunita Reddy",
    email: "sunita.reddy@reddyproperties.com",
    phone: "+91 99490 13579",
    company: "Reddy Realty Holdings",
    role: "Executive Chairperson",
    spendBucket: "₹5Cr - ₹10Cr",
    confidence: "Medium",
    competitors: ["Axis Bank"],
    campaignId: "CAMP-94182", // Corporate Trust Advantage
    dateReceived: "2026-09-08",
    assignedTo: "Ananya S.",
    status: "Contacted",
    location: "Hyderabad",
    category: "Corporate Trust",
    persona: "HNI",
    engagementHistory: [
      { id: "h15", date: "2026-09-08 05:20 PM", type: "System", text: "Lead registered for Bangalore Trust planning forum RSVP." },
      { id: "h16", date: "2026-09-09 10:00 AM", type: "Assignment", text: "Assigned to Ananya S.", user: "System" },
      { id: "h17", date: "2026-09-11 11:30 AM", type: "Note Added", text: "Client requested detailed brochure on NRI family holding structures.", user: "Ananya S." }
    ]
  },
  {
    id: "LEAD-2047",
    name: "Devendra Kulkarni",
    email: "dkulkarni@kulkarni-associates.in",
    phone: "+91 98220 56789",
    company: "Kulkarni & Associates",
    role: "Senior Partner",
    spendBucket: "₹1Cr - ₹5Cr",
    confidence: "Medium",
    competitors: ["ICICI Bank", "HDFC Bank"],
    campaignId: "CAMP-49520", // Tier 2 Mass Affluent Boost
    dateReceived: "2026-09-06",
    assignedTo: "Rajesh K.",
    status: "Not interested",
    location: "Pune",
    category: "General Wealth",
    persona: "Mass affluent",
    engagementHistory: [
      { id: "h18", date: "2026-09-06 01:10 PM", type: "System", text: "Lead registered via Mass Affluent Wealth Planning ad campaign." },
      { id: "h19", date: "2026-09-06 02:00 PM", type: "Assignment", text: "Assigned to Rajesh K.", user: "System" },
      { id: "h20", date: "2026-09-08 10:45 AM", type: "Note Added", text: "Client states they already have a long-term dedicated desk at ICICI Bank and do not wish to migrate portfolio.", user: "Rajesh K." },
      { id: "h21", date: "2026-09-08 10:45 AM", type: "Status Change", text: "Status updated to 'Not interested'", user: "Rajesh K." }
    ]
  },
  {
    id: "LEAD-2048",
    name: "Sandhya Iyer",
    email: "sandhya.iyer@fintechelite.com",
    phone: "+91 97410 32109",
    company: "Fintech Elite",
    role: "VP Marketing",
    spendBucket: "₹50L - ₹1Cr",
    confidence: "Low",
    competitors: ["None"],
    campaignId: "CAMP-49520", // Tier 2 Mass Affluent Boost
    dateReceived: "2026-09-05",
    assignedTo: "Unassigned",
    status: "New",
    location: "Bengaluru",
    category: "General Wealth",
    persona: "Mass affluent",
    engagementHistory: [
      { id: "h22", date: "2026-09-05 03:00 PM", type: "System", text: "Captured from dynamic newsletter subscription popup." }
    ]
  },
  {
    id: "LEAD-2049",
    name: "Naveen Jindal",
    email: "njindal@jindaltextiles.co.in",
    phone: "+91 98140 11223",
    company: "Jindal Textiles",
    role: "Founder & CFO",
    spendBucket: "₹5Cr - ₹10Cr",
    confidence: "High",
    competitors: ["Kotak Wealth", "HSBC"],
    campaignId: "CAMP-20194", // NRE Deposits Spark
    dateReceived: "2026-08-12",
    assignedTo: "Sidhartha R.",
    status: "Converted",
    location: "Mumbai",
    category: "Wealth Advisory",
    persona: "HNI",
    engagementHistory: [
      { id: "h23", date: "2026-08-12 11:00 AM", type: "System", text: "Lead received through NRE Spark custom advisory application." },
      { id: "h24", date: "2026-08-12 11:30 AM", type: "Assignment", text: "Assigned to Sidhartha R.", user: "System" },
      { id: "h25", date: "2026-08-14 03:00 PM", type: "Note Added", text: "Discussed FCNR interest arbitrage options. Extremely positive meeting.", user: "Sidhartha R." },
      { id: "h26", date: "2026-08-15 11:00 AM", type: "Status Change", text: "Status changed to 'Converted' after booking deposits.", user: "Sidhartha R." }
    ]
  },
  {
    id: "LEAD-2050",
    name: "Arjun Rao",
    email: "arjun.rao@hydcorp.com",
    phone: "+91 99890 88888",
    company: "Hyderabad Corporates",
    role: "Partner",
    spendBucket: "₹1Cr - ₹5Cr",
    confidence: "Medium",
    competitors: ["HDFC Bank"],
    campaignId: "CAMP-55102", // Corporate Salary Elevate
    dateReceived: "2026-08-15",
    assignedTo: "Rajesh K.",
    status: "Contacted",
    location: "Hyderabad",
    category: "Loans & Mortgages",
    persona: "Mass affluent",
    engagementHistory: [
      { id: "h27", date: "2026-08-15 09:10 AM", type: "System", text: "Lead registered from Salary Elevate custom loan program." },
      { id: "h28", date: "2026-08-15 10:00 AM", type: "Assignment", text: "Assigned to Rajesh K.", user: "System" }
    ]
  }
];

export const LeadFeed: React.FC<LeadFeedProps> = ({ 
  campaigns,
  initialCampaignFilter,
  onClearInitialCampaign
}) => {
  // State for leads, persistent with localStorage
  const [leads, setLeads] = useState<Lead[]>(() => {
    const cached = localStorage.getItem('zenith_leads');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (err) {
        return INITIAL_LEADS;
      }
    }
    return INITIAL_LEADS;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('zenith_leads', JSON.stringify(leads));
  }, [leads]);

  // Search, Filter, and Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [campaignFilter, setCampaignFilter] = useState<string>(initialCampaignFilter || 'All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'New' | 'Contacted' | 'Not interested' | 'Converted'>('All');
  const [confidenceFilter, setConfidenceFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
  const [personaFilter, setPersonaFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [geographyFilter, setGeographyFilter] = useState<string>('All');
  const [competitorFilter, setCompetitorFilter] = useState<string>('All');
  const [assignedFilter, setAssignedFilter] = useState<string>('All');
  
  // Date range filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sorting
  const [sortField, setSortField] = useState<keyof Lead>('dateReceived');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected Lead for Slider Drawer
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [newNoteText, setNewNoteText] = useState('');

  // Feedback Notification Toast
  const [toast, setToast] = useState<string | null>(null);

  // Sync initialCampaignFilter if parent updates it (e.g. from campaign row click)
  useEffect(() => {
    if (initialCampaignFilter) {
      setCampaignFilter(initialCampaignFilter);
    }
  }, [initialCampaignFilter]);

  // Close toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Unique attribute options derived from leads
  const uniqueCampaigns = useMemo(() => {
    const list = new Map<string, string>(); // campaignId -> campaignName
    campaigns.forEach(c => list.set(c.id, c.name));
    // Add any that exist in mock leads but aren't in current campaigns
    leads.forEach(l => {
      if (!list.has(l.campaignId)) {
        list.set(l.campaignId, `Campaign ${l.campaignId}`);
      }
    });
    return Array.from(list.entries()).map(([id, name]) => ({ id, name }));
  }, [campaigns, leads]);

  const uniquePersonas = useMemo(() => {
    const list = new Set<string>();
    leads.forEach(l => list.add(l.persona));
    return Array.from(list);
  }, [leads]);

  const uniqueCategories = useMemo(() => {
    const list = new Set<string>();
    leads.forEach(l => list.add(l.category));
    return Array.from(list);
  }, [leads]);

  const uniqueGeographies = useMemo(() => {
    const list = new Set<string>();
    leads.forEach(l => list.add(l.location));
    return Array.from(list);
  }, [leads]);

  const uniqueCompetitors = useMemo(() => {
    const list = new Set<string>();
    leads.forEach(l => l.competitors.forEach(comp => {
      if (comp !== 'None') list.add(comp);
    }));
    return Array.from(list);
  }, [leads]);

  // List of active advisors
  const advisors = ["Unassigned", "Sidhartha R.", "Ananya S.", "Rajesh K."];

  // Sorting columns helper
  const handleSort = (field: keyof Lead) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Filter Pipeline
  const filteredLeads = useMemo(() => {
    let result = leads.filter(lead => {
      // 1. Search Query Match (Name, Email, Phone, Company)
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        lead.name.toLowerCase().includes(query) || 
        lead.email.toLowerCase().includes(query) ||
        lead.phone.includes(query) ||
        lead.company.toLowerCase().includes(query) ||
        lead.id.toLowerCase().includes(query);

      // 2. Campaign Filter Match
      const matchesCampaign = campaignFilter === 'All' || lead.campaignId === campaignFilter;

      // 3. Status Filter Match
      const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;

      // 4. Confidence Filter Match
      const matchesConfidence = confidenceFilter === 'All' || lead.confidence === confidenceFilter;

      // 5. Persona Filter Match
      const matchesPersona = personaFilter === 'All' || lead.persona === personaFilter;

      // 6. Category Filter Match
      const matchesCategory = categoryFilter === 'All' || lead.category === categoryFilter;

      // 7. Geography Filter Match
      const matchesGeo = geographyFilter === 'All' || lead.location === geographyFilter;

      // 8. Competitor Filter Match
      const matchesCompetitor = competitorFilter === 'All' || lead.competitors.includes(competitorFilter);

      // 9. Assigned Filter Match
      const matchesAssigned = assignedFilter === 'All' || lead.assignedTo === assignedFilter;

      // 10. Date Range Filter Match
      let matchesDates = true;
      if (startDate) {
        matchesDates = matchesDates && new Date(lead.dateReceived) >= new Date(startDate);
      }
      if (endDate) {
        matchesDates = matchesDates && new Date(lead.dateReceived) <= new Date(endDate);
      }

      return matchesSearch && matchesCampaign && matchesStatus && matchesConfidence && 
             matchesPersona && matchesCategory && matchesGeo && matchesCompetitor && 
             matchesAssigned && matchesDates;
    });

    // Sort Pipeline
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal as string) 
          : (bVal as string).localeCompare(aVal);
      } else {
        // Fallback for arrays or other structures
        return 0;
      }
    });

    return result;
  }, [leads, searchQuery, campaignFilter, statusFilter, confidenceFilter, personaFilter, categoryFilter, geographyFilter, competitorFilter, assignedFilter, startDate, endDate, sortField, sortOrder]);

  // Pagination bounds
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const currentLeads = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLeads.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLeads, currentPage]);

  // Keep pagination within bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Action: Change Status of a lead
  const handleStatusChange = (leadId: string, newStatus: Lead['status']) => {
    setLeads(prev => prev.map(l => {
      if (l.id === leadId) {
        const timestamp = new Date().toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric'
        }) + " " + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const historyItem = {
          id: 'hist-' + Math.random().toString(36).substr(2, 9),
          date: timestamp,
          type: 'Status Change' as const,
          text: `Status updated to '${newStatus}'`,
          user: "Sidhartha R." // Current user logged in
        };

        const updated = {
          ...l,
          status: newStatus,
          engagementHistory: [historyItem, ...l.engagementHistory]
        };

        // Sync currently open lead drawer if it matches
        if (selectedLead && selectedLead.id === leadId) {
          setSelectedLead(updated);
        }

        return updated;
      }
      return l;
    }));

    setToast(`Status updated to ${newStatus}`);
  };

  // Action: Assign Advisor to a lead
  const handleAssignChange = (leadId: string, newAdvisor: string) => {
    setLeads(prev => prev.map(l => {
      if (l.id === leadId) {
        const timestamp = new Date().toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric'
        }) + " " + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const historyItem = {
          id: 'hist-' + Math.random().toString(36).substr(2, 9),
          date: timestamp,
          type: 'Assignment' as const,
          text: `Assigned to ${newAdvisor}`,
          user: "Sidhartha R."
        };

        const updated = {
          ...l,
          assignedTo: newAdvisor,
          engagementHistory: [historyItem, ...l.engagementHistory]
        };

        if (selectedLead && selectedLead.id === leadId) {
          setSelectedLead(updated);
        }

        return updated;
      }
      return l;
    }));

    setToast(`Lead assigned to ${newAdvisor}`);
  };

  // Action: Add Note in the Details Drawer
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !newNoteText.trim()) return;

    const timestamp = new Date().toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    }) + " " + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const historyItem = {
      id: 'hist-' + Math.random().toString(36).substr(2, 9),
      date: timestamp,
      type: 'Note Added' as const,
      text: newNoteText.trim(),
      user: "Sidhartha R."
    };

    const updatedLead = {
      ...selectedLead,
      engagementHistory: [historyItem, ...selectedLead.engagementHistory]
    };

    // Update main array
    setLeads(prev => prev.map(l => l.id === selectedLead.id ? updatedLead : l));
    setSelectedLead(updatedLead);
    setNewNoteText('');
    setToast("Activity log note added successfully.");
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      "Lead ID", "Name", "Email", "Phone", "Company", "Role", "Geography",
      "Confidence", "Wealth Tier", "Product Category", "Source Campaign ID", "Competitors Active", "Assigned To", "Date Received", "Status"
    ];
    const rows = filteredLeads.map(l => [
      l.id,
      `"${l.name}"`,
      l.email,
      `"${l.phone}"`,
      `"${l.company}"`,
      `"${l.role}"`,
      l.location,
      l.confidence,
      l.persona,
      l.category,
      l.campaignId,
      `"${l.competitors.join(', ')}"`,
      l.assignedTo,
      l.dateReceived,
      l.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `zenith_leads_feed_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToast(`Exported ${filteredLeads.length} leads successfully.`);
  };

  // Dynamic status-based metrics cards
  const summaryMetrics = useMemo(() => {
    const total = filteredLeads.length;
    const newLeads = filteredLeads.filter(l => l.status === 'New').length;
    const contacted = filteredLeads.filter(l => l.status === 'Contacted').length;
    const converted = filteredLeads.filter(l => l.status === 'Converted').length;
    const unassigned = filteredLeads.filter(l => l.assignedTo === 'Unassigned').length;

    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;
    const unassignedPct = total > 0 ? Math.round((unassigned / total) * 100) : 0;

    return { total, newLeads, contacted, converted, conversionRate, unassigned, unassignedPct };
  }, [filteredLeads]);

  // Clean name of campaigns mapping
  const getCampaignName = (id: string) => {
    const match = campaigns.find(c => c.id === id);
    return match ? match.name : id;
  };

  return (
    <div className="space-y-6 pb-24 font-sans select-none w-full max-w-full">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-xs font-semibold px-4.5 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 z-50 animate-bounce-in max-w-md text-center">
          <CheckCircle className="text-emerald-400" size={14} />
          <span>{toast}</span>
          <button onClick={() => setToast(null)} className="text-neutral-400 hover:text-white ml-2">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-b border-neutral-200/50">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2.5">
            <span>Lead feed</span>
            <span className="bg-[#e0f2fe] text-[#0369a1] font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-[#bae6fd]">
              {filteredLeads.length} of {leads.length} leads
            </span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1 font-medium">
            Monitor incoming client formulas, assign outreach pipelines, and log real-time conversions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          {initialCampaignFilter && (
            <button
              onClick={() => {
                setCampaignFilter('All');
                if (onClearInitialCampaign) onClearInitialCampaign();
              }}
              className="px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-800 bg-neutral-100 rounded-lg flex items-center gap-1.5 border border-neutral-200/40"
            >
              <span>Viewing Specific Campaign Leads</span>
              <X size={12} />
            </button>
          )}

          {/* Export to CSV CTA */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 active:scale-95 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>


      {/* ADVANCED MULTIVARIATE FILTER CONSOLE */}
      <div className="bg-white border border-neutral-200/60 rounded-xl p-4.5 shadow-sm space-y-4">
        
        {/* Row 1: Search & Basic Status Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Status filtering segmented bar */}
          <div className="flex flex-wrap items-center gap-1 bg-neutral-100 p-1 rounded-lg">
            {(['All', 'New', 'Contacted', 'Not interested', 'Converted'] as const).map(status => (
              <button
                key={status}
                onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
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

          {/* Search bar finding name/contact fast */}
          <div className="relative w-full lg:w-80">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input 
              type="text"
              placeholder="Search by name, contact info, ID..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-xs bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white border border-neutral-200 rounded-lg text-neutral-800 placeholder-neutral-400 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
            />
          </div>

        </div>

        {/* Row 2: Advanced Dropdown Attributes & Timeline Controls */}
        <div className="pt-3.5 border-t border-neutral-100/70 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
          
          {/* Source Campaign Filter */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wide">Source Campaign</span>
            <select
              value={campaignFilter}
              onChange={(e) => { setCampaignFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200 text-neutral-700 font-semibold rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-all cursor-pointer"
            >
              <option value="All">All Campaigns</option>
              {uniqueCampaigns.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Advisor Assigned Filter */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wide">Assigned Advisor</span>
            <select
              value={assignedFilter}
              onChange={(e) => { setAssignedFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200 text-neutral-700 font-semibold rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-all cursor-pointer"
            >
              <option value="All">All Staff</option>
              {advisors.map(adv => (
                <option key={adv} value={adv}>{adv}</option>
              ))}
            </select>
          </div>

          {/* Wealth Segment Tier (Persona) */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wide">Wealth Tier</span>
            <select
              value={personaFilter}
              onChange={(e) => { setPersonaFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200 text-neutral-700 font-semibold rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-all cursor-pointer"
            >
              <option value="All">All Tiers</option>
              {uniquePersonas.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Location / Geography */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wide">Geography</span>
            <select
              value={geographyFilter}
              onChange={(e) => { setGeographyFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200 text-neutral-700 font-semibold rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-all cursor-pointer"
            >
              <option value="All">All Cities</option>
              {uniqueGeographies.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Date range inputs */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wide">Arrived From</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
              className="w-full bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200 text-neutral-700 font-semibold rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-all cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wide">Arrived Till</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
              className="w-full bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200 text-neutral-700 font-semibold rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-all cursor-pointer"
            />
          </div>

        </div>

        {/* Additional Optional Attributes Row */}
        <div className="flex flex-wrap items-center gap-4.5 pt-3 border-t border-neutral-100/50 text-[11px] font-semibold text-neutral-500">
          
          {/* Confidence Category Filter */}
          <div className="flex items-center gap-1.5">
            <span>Confidence:</span>
            <div className="flex items-center gap-1">
              {['All', 'High', 'Medium', 'Low'].map(c => (
                <button
                  key={c}
                  onClick={() => { setConfidenceFilter(c as any); setCurrentPage(1); }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                    confidenceFilter === c
                      ? 'bg-neutral-900 border-neutral-900 text-white shadow-xs'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Active Competitors */}
          <div className="flex items-center gap-1.5">
            <span>Competitor:</span>
            <select
              value={competitorFilter}
              onChange={(e) => { setCompetitorFilter(e.target.value); setCurrentPage(1); }}
              className="bg-neutral-50 border border-neutral-200 text-neutral-700 font-bold rounded px-1.5 py-0.5 text-[10.5px] cursor-pointer"
            >
              <option value="All">All Competitors</option>
              {uniqueCompetitors.map(comp => (
                <option key={comp} value={comp}>{comp}</option>
              ))}
            </select>
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5">
            <span>Product Focus:</span>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="bg-neutral-50 border border-neutral-200 text-neutral-700 font-bold rounded px-1.5 py-0.5 text-[10.5px] cursor-pointer"
            >
              <option value="All">All Categories</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Reset button if filter is active */}
          {(searchQuery || campaignFilter !== 'All' || statusFilter !== 'All' || confidenceFilter !== 'All' || 
            personaFilter !== 'All' || categoryFilter !== 'All' || geographyFilter !== 'All' || 
            competitorFilter !== 'All' || assignedFilter !== 'All' || startDate || endDate) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCampaignFilter('All');
                setStatusFilter('All');
                setConfidenceFilter('All');
                setPersonaFilter('All');
                setCategoryFilter('All');
                setGeographyFilter('All');
                setCompetitorFilter('All');
                setAssignedFilter('All');
                setStartDate('');
                setEndDate('');
                setCurrentPage(1);
                if (onClearInitialCampaign) onClearInitialCampaign();
              }}
              className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1.5 text-xs font-bold ml-auto"
            >
              <X size={12} />
              <span>Clear filters</span>
            </button>
          )}

        </div>

      </div>

      {/* MASTER LEAD LIST TABLE */}
      <div className="bg-white border border-neutral-200/60 rounded-xl shadow-sm overflow-hidden">
        {filteredLeads.length > 0 ? (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-100 text-neutral-400 font-bold text-[10px] uppercase tracking-wider select-none">
                  <th className="px-5 py-4 cursor-pointer hover:text-neutral-700 transition-colors" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">
                      <span>Lead Profile</span>
                      {sortField === 'name' && (sortOrder === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
                    </div>
                  </th>
                  <th className="px-5 py-4 cursor-pointer hover:text-neutral-700 transition-colors" onClick={() => handleSort('persona')}>
                    <div className="flex items-center gap-1">
                      <span>Demographics</span>
                      {sortField === 'persona' && (sortOrder === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
                    </div>
                  </th>
                  <th className="px-5 py-4 cursor-pointer hover:text-neutral-700 transition-colors" onClick={() => handleSort('spendBucket')}>
                    <div className="flex items-center gap-1">
                      <span>Capital Profile</span>
                      {sortField === 'spendBucket' && (sortOrder === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
                    </div>
                  </th>
                  <th className="px-5 py-4 cursor-pointer hover:text-neutral-700 transition-colors" onClick={() => handleSort('campaignId')}>
                    <div className="flex items-center gap-1 font-bold">
                      <span>Source Campaign</span>
                      {sortField === 'campaignId' && (sortOrder === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
                    </div>
                  </th>
                  <th className="px-5 py-4 cursor-pointer hover:text-neutral-700 transition-colors" onClick={() => handleSort('dateReceived')}>
                    <div className="flex items-center gap-1">
                      <span>Date Received</span>
                      {sortField === 'dateReceived' && (sortOrder === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {currentLeads.map(lead => {
                  
                  // Confidence badge colors
                  let confBg = 'bg-neutral-100 text-neutral-600';
                  if (lead.confidence === 'High') confBg = 'bg-emerald-100 text-emerald-800';
                  else if (lead.confidence === 'Medium') confBg = 'bg-amber-100 text-amber-800';
                  else if (lead.confidence === 'Low') confBg = 'bg-red-100 text-red-800';

                  return (
                    <tr key={lead.id} className="hover:bg-neutral-50/40 transition-all">
                      
                      {/* Name & Contact profile */}
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span 
                              onClick={() => setSelectedLead(lead)}
                              className="font-bold text-neutral-800 text-[13px] hover:text-blue-600 hover:underline cursor-pointer transition-all"
                            >
                              {lead.name}
                            </span>
                            <span className="text-[9px] font-mono text-neutral-400 font-bold uppercase bg-neutral-100 px-1 py-0.2 rounded border border-neutral-200/50">
                              {lead.id}
                            </span>
                          </div>
                          
                          <div className="flex flex-col gap-0.5 text-[10.5px] text-neutral-400 font-semibold">
                            <span className="flex items-center gap-1">
                              <Mail size={10} />
                              <span>{lead.email}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone size={10} />
                              <span>{lead.phone}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Demographics / Persona */}
                      <td className="px-5 py-4">
                        <div className="space-y-1 text-[11px]">
                          <div className="font-bold text-neutral-700 flex items-center gap-1">
                            <MapPin size={11} className="text-neutral-400 shrink-0" />
                            <span>{lead.location}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase">
                            <span className="text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100/40">{lead.persona}</span>
                            <span className="text-neutral-400 text-[8px]">&bull;</span>
                            <span className="text-neutral-500 bg-neutral-100 px-1.5 py-0.2 rounded border border-neutral-200/50">{lead.category}</span>
                          </div>
                        </div>
                      </td>

                      {/* Capital Net Worth bucket */}
                      <td className="px-5 py-4">
                        <div className="space-y-1.5">
                          <span className="font-bold text-neutral-800">{lead.spendBucket}</span>
                          <div className="flex items-center gap-1">
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${confBg}`}>
                              {lead.confidence} Confidence
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Source Campaign link */}
                      <td className="px-5 py-4 min-w-[140px] max-w-[200px]">
                        <div className="space-y-1 text-[11px]">
                          <div className="font-bold text-neutral-700 truncate hover:text-blue-600 cursor-pointer">
                            {getCampaignName(lead.campaignId)}
                          </div>
                          <span className="text-[10px] text-neutral-400 font-mono font-medium block">ID: {lead.campaignId}</span>
                        </div>
                      </td>

                      {/* Date Received */}
                      <td className="px-5 py-4">
                        <span className="font-bold text-neutral-700">
                          {new Date(lead.dateReceived).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty Filter State */
          <div className="text-center py-20 px-6">
            <div className="w-12 h-12 bg-neutral-50 border border-neutral-200/60 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search className="text-neutral-300" size={18} />
            </div>
            <h3 className="text-sm font-bold text-neutral-800">No leads match your active filters</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto font-semibold">
              We couldn't find any lead matching your search parameters or attribute filters. Try resetting controls to view all incoming inquiries.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setCampaignFilter('All');
                setStatusFilter('All');
                setConfidenceFilter('All');
                setPersonaFilter('All');
                setCategoryFilter('All');
                setGeographyFilter('All');
                setCompetitorFilter('All');
                setAssignedFilter('All');
                setStartDate('');
                setEndDate('');
                setCurrentPage(1);
                if (onClearInitialCampaign) onClearInitialCampaign();
              }}
              className="mt-4 px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* PAGINATION PANEL FOOTER */}
        {totalPages > 1 && (
          <div className="px-6 py-4.5 bg-neutral-50/60 border-t border-neutral-100 flex items-center justify-between">
            <span className="text-[11.5px] text-neutral-400 font-semibold">
              Showing page <strong className="font-bold text-neutral-700">{currentPage}</strong> of <strong className="font-bold text-neutral-700">{totalPages}</strong> ({filteredLeads.length} total filtered leads)
            </span>

            <div className="flex items-center gap-1">
              {/* Prev Page Button */}
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  currentPage === 1
                    ? 'bg-neutral-50 border-neutral-200 text-neutral-300 cursor-not-allowed'
                    : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 active:scale-95 cursor-pointer'
                }`}
              >
                Previous
              </button>

              {/* Jump to specific page blocks */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white shadow-sm font-extrabold'
                      : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              {/* Next Page Button */}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  currentPage === totalPages
                    ? 'bg-neutral-50 border-neutral-200 text-neutral-300 cursor-not-allowed'
                    : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 active:scale-95 cursor-pointer'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}

      </div>

      {/* LEAD DETAILS ENGAGEMENT HISTORY & OUTREACH NOTES DRAWER */}
      {selectedLead && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs flex justify-end z-[500] animate-fade-in">
          {/* Closer backdrop */}
          <div className="absolute inset-0 cursor-pointer" onClick={() => setSelectedLead(null)} />

          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl border-l border-neutral-200 flex flex-col z-10 animate-slide-left overflow-y-auto">
            
            {/* Drawer Header */}
            <div className="p-5.5 border-b border-neutral-100 flex items-start justify-between bg-neutral-50/70">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200/50 uppercase">
                    {selectedLead.id}
                  </span>
                  <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${
                    selectedLead.status === 'New' ? 'bg-emerald-50 text-emerald-800 border-emerald-200/50' :
                    selectedLead.status === 'Contacted' ? 'bg-blue-50 text-blue-800 border-blue-200/50' :
                    selectedLead.status === 'Not interested' ? 'bg-red-50 text-red-800 border-red-200/40' :
                    'bg-purple-50 text-purple-800 border-purple-200/50'
                  }`}>
                    {selectedLead.status}
                  </span>
                </div>
                
                <h3 className="text-base font-extrabold text-neutral-900 tracking-tight leading-snug">
                  {selectedLead.name}
                </h3>
                
                <p className="text-[11px] text-neutral-400 font-semibold flex items-center gap-1">
                  <Building size={11} />
                  <span>{selectedLead.role} at <strong className="text-neutral-600 font-bold">{selectedLead.company}</strong></span>
                </p>
              </div>

              <button 
                onClick={() => setSelectedLead(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Main Content Drawer Body */}
            <div className="flex-1 p-5.5 space-y-6 overflow-y-auto text-xs">
              
              {/* Profile Attributes Card */}
              <div className="bg-neutral-50 border border-neutral-200/60 rounded-xl p-4.5 space-y-3.5">
                <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Key Lead Attributes</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[10.5px] text-neutral-400 font-medium">Wealth Tier</span>
                    <p className="font-bold text-neutral-800 text-xs">{selectedLead.persona}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10.5px] text-neutral-400 font-medium">Spend / Capacity</span>
                    <p className="font-bold text-neutral-800 text-xs">{selectedLead.spendBucket}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10.5px] text-neutral-400 font-medium">Assigned Advisor</span>
                    <p className="font-bold text-neutral-800 text-xs">{selectedLead.assignedTo}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10.5px] text-neutral-400 font-medium">Geography</span>
                    <p className="font-bold text-neutral-800 text-xs">{selectedLead.location}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10.5px] text-neutral-400 font-medium">Active Competitors</span>
                    <p className="font-bold text-red-600 text-xs">
                      {selectedLead.competitors.join(', ') === 'None' ? 'None' : selectedLead.competitors.join(', ')}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10.5px] text-neutral-400 font-medium">Date Arrived</span>
                    <p className="font-bold text-neutral-800 text-xs">
                      {new Date(selectedLead.dateReceived).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="pt-3.5 border-t border-neutral-200/60 space-y-2">
                  <span className="text-[10.5px] text-neutral-400 font-medium block">Source Campaign Formula</span>
                  <div className="bg-white border border-neutral-200/50 p-2.5 rounded-lg flex items-center justify-between text-xs font-semibold text-neutral-700">
                    <span className="truncate pr-4">{getCampaignName(selectedLead.campaignId)}</span>
                    <span className="font-mono text-[9.5px] bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded shrink-0 font-bold uppercase">{selectedLead.campaignId}</span>
                  </div>
                </div>
              </div>

              {/* Fast Update Dropdown Options inside Drawer */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Quick Action Center</h4>
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400">Update Lead Status</label>
                    <select
                      value={selectedLead.status}
                      onChange={(e) => handleStatusChange(selectedLead.id, e.target.value as any)}
                      className="w-full bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200 font-bold text-neutral-700 text-xs rounded-lg px-2.5 py-2 focus:outline-none transition-all cursor-pointer"
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Not interested">Not Interested</option>
                      <option value="Converted">Converted</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400">Reassign Advisor</label>
                    <select
                      value={selectedLead.assignedTo}
                      onChange={(e) => handleAssignChange(selectedLead.id, e.target.value)}
                      className="w-full bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200 font-bold text-neutral-700 text-xs rounded-lg px-2.5 py-2 focus:outline-none transition-all cursor-pointer"
                    >
                      {advisors.map(adv => (
                        <option key={adv} value={adv}>{adv}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Add Note Outreach Form */}
              <form onSubmit={handleAddNote} className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Log Activity / Note</label>
                  <span className="text-[10px] text-neutral-400 font-semibold font-mono">Logged as Sidhartha R.</span>
                </div>
                <div className="relative">
                  <textarea
                    placeholder="Enter notes on outreach, user feedback, meeting updates..."
                    rows={3}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="w-full border border-neutral-200 focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 rounded-xl p-3 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none transition-all resize-none font-semibold"
                  />
                  <button
                    type="submit"
                    disabled={!newNoteText.trim()}
                    className={`absolute bottom-3.5 right-3.5 px-3 py-1.5 rounded-lg text-[10.5px] font-bold flex items-center gap-1 transition-all ${
                      newNoteText.trim()
                        ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-sm active:scale-95'
                        : 'bg-neutral-100 text-neutral-300 cursor-not-allowed'
                    }`}
                  >
                    <PlusCircle size={11} />
                    <span>Log Note</span>
                  </button>
                </div>
              </form>

              {/* Historic engagement activity log timeline */}
              <div className="space-y-3.5">
                <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Chronological Engagement History</h4>
                
                <div className="relative border-l border-neutral-200 pl-4 ml-2.5 space-y-4">
                  {selectedLead.engagementHistory.map(hist => (
                    <div key={hist.id} className="relative space-y-1">
                      {/* Timeline dot */}
                      <span className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full border border-white bg-blue-600" />
                      
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-neutral-400 font-mono">{hist.date}</span>
                        <span className={`px-1.5 py-0.1 rounded font-bold uppercase text-[8px] ${
                          hist.type === 'Status Change' ? 'bg-indigo-50 text-indigo-700' :
                          hist.type === 'Assignment' ? 'bg-sky-50 text-sky-700' :
                          hist.type === 'Note Added' ? 'bg-amber-50 text-amber-700 border border-amber-100/50' :
                          'bg-neutral-100 text-neutral-600'
                        }`}>
                          {hist.type}
                        </span>
                      </div>

                      <p className="text-neutral-700 font-semibold text-xs leading-relaxed break-words pr-2">
                        {hist.text}
                      </p>

                      {hist.user && (
                        <div className="text-[9px] text-neutral-400 font-bold flex items-center gap-0.5">
                          <User size={9} />
                          <span>By {hist.user}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
