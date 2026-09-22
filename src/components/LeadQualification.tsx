import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShieldCheck, 
  PlusCircle, 
  FileText, 
  Users, 
  DollarSign, 
  Layers, 
  ArrowRight, 
  Calendar, 
  Search, 
  Sliders, 
  UploadCloud, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Download, 
  Eye, 
  ChevronRight, 
  Trash2, 
  RefreshCw, 
  Database,
  Briefcase,
  SlidersHorizontal,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Check,
  HelpCircle,
  Info,
  Copy,
  Sparkles,
  Archive
} from 'lucide-react';

import { CustomerInsightDashboard } from './CustomerInsightDashboard';
import { CustomerInsightBuilder } from './CustomerInsightBuilder';
import { CustomerInsightManagement } from './CustomerInsightManagement';
import { CustomerInsightFeed } from './CustomerInsightFeed';

export interface QualFile {
  id: string;
  fileName: string;
  fileSize: string;
  rowsAccepted: number;
  rowsSkipped: number;
  skipReasons: Array<{ count: number; reason: string }>;
  cost: number;
  dateUploaded: string;
  status: 'Completed' | 'Processing';
}

export interface QualCampaign {
  id: string;
  name: string;
  filesCount: number;
  peopleScored: number;
  uploadedBy: string;
  status: 'Completed' | 'Processing' | 'Queued' | 'Failed';
  dateCreated: string;
  totalSpend: number;
  targetProduct: string;
  weights: {
    incomeWeight: number;
    spendWeight: number;
    propensityWeight: number;
  };
  confidenceStats: {
    high: number;
    medium: number;
    low: number;
  };
  // RACE fit & campaign attributes
  industry: string;
  capitalProfile?: string;
  targetRegion?: string;
  customerSegment?: string;
  ticketSizeMin?: number;
  ticketSizeMax?: number;
  purchaseCycle?: 'One-time' | 'Recurring subscription';
  purchaseChannel?: 'Online' | 'Offline' | 'Both';
  targetCostPerQualifiedLead?: number;
  hasRunFirstFile: boolean;
  files: QualFile[];
  isArchived?: boolean;
  activityLog?: string[];
}

export interface QualRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  netWorth: string;
  spendScore: number;
  confidence: 'High' | 'Medium' | 'Low';
  propensityScore: number;
  status: 'Eligible' | 'Borderline' | 'Ineligible';
  exclusionApplied: string;
}

// Initial Qualification Campaigns pre-seeded data with full files history & RACE attributes
const INITIAL_QUAL_CAMPAIGNS: QualCampaign[] = [
  {
    id: "QUAL-101",
    name: "HNIs North Region v2",
    filesCount: 2,
    peopleScored: 4800,
    uploadedBy: "Sidhartha R.",
    status: "Completed",
    dateCreated: "2026-09-02",
    totalSpend: 45000,
    targetProduct: "Wealth Advisory",
    weights: { incomeWeight: 50, spendWeight: 30, propensityWeight: 20 },
    confidenceStats: { high: 2880, medium: 1344, low: 576 },
    industry: "Technology",
    capitalProfile: "₹50 - 500 Cr",
    targetRegion: "North Region",
    customerSegment: "Individual High Net Worth",
    hasRunFirstFile: true,
    isArchived: false,
    activityLog: [
      "Campaign created by Sidhartha R. on Sep 2, 2026 10:15 AM",
      "Roster file 'delhi_gurugram_execs_raw.csv' accepted & executed",
      "Completed RACE qualification for delhi_gurugram_execs_raw.csv (3,200 accepted, 45 skipped)",
      "Roster file 'noida_realestate_owners.xlsx' executed successfully (1,600 accepted, 12 skipped)"
    ],
    files: [
      {
        id: "FL-101-1",
        fileName: "delhi_gurugram_execs_raw.csv",
        fileSize: "1.42 MB",
        rowsAccepted: 3200,
        rowsSkipped: 45,
        skipReasons: [
          { count: 25, reason: "Invalid phone numbers or landlines" },
          { count: 20, reason: "Negative net worth declaration mismatch" }
        ],
        cost: 30000,
        dateUploaded: "2026-09-02",
        status: "Completed"
      },
      {
        id: "FL-101-2",
        fileName: "noida_realestate_owners.xlsx",
        fileSize: "0.85 MB",
        rowsAccepted: 1600,
        rowsSkipped: 12,
        skipReasons: [
          { count: 12, reason: "Duplicate entries already present" }
        ],
        cost: 15000,
        dateUploaded: "2026-09-03",
        status: "Completed"
      }
    ]
  },
  {
    id: "QUAL-102",
    name: "Ultra-HNIs Mutual Fund Propensity",
    filesCount: 1,
    peopleScored: 2400,
    uploadedBy: "Ananya S.",
    status: "Completed",
    dateCreated: "2026-09-05",
    totalSpend: 32000,
    targetProduct: "Mutual Funds",
    weights: { incomeWeight: 40, spendWeight: 40, propensityWeight: 20 },
    confidenceStats: { high: 1440, medium: 672, low: 288 },
    industry: "Financial Services",
    capitalProfile: "Above ₹500 Cr",
    targetRegion: "West Region",
    customerSegment: "Corporate Clients",
    hasRunFirstFile: true,
    isArchived: false,
    activityLog: [
      "Campaign created by Ananya S. on Sep 5, 2026 02:40 PM",
      "RACE Fit profile locked dynamically: Financial Services, Above ₹500 Cr",
      "Completed RACE qualification for mumbai_promoters_equity.csv (2,400 accepted, 68 skipped)"
    ],
    files: [
      {
        id: "FL-102-1",
        fileName: "mumbai_promoters_equity.csv",
        fileSize: "2.10 MB",
        rowsAccepted: 2400,
        rowsSkipped: 68,
        skipReasons: [
          { count: 42, reason: "Missing email address contacts" },
          { count: 26, reason: "DND global registry matches excluded" }
        ],
        cost: 32000,
        dateUploaded: "2026-09-05",
        status: "Completed"
      }
    ]
  },
  {
    id: "QUAL-103",
    name: "Festive Credit Cards Pilot",
    filesCount: 1,
    peopleScored: 1500,
    uploadedBy: "Sidhartha R.",
    status: "Completed",
    dateCreated: "2026-09-10",
    totalSpend: 15000,
    targetProduct: "Credit Cards",
    weights: { incomeWeight: 30, spendWeight: 50, propensityWeight: 20 },
    confidenceStats: { high: 750, medium: 420, low: 330 },
    industry: "E-commerce & Retail",
    capitalProfile: "₹5 - 50 Cr",
    targetRegion: "South Region",
    customerSegment: "Individual High Net Worth",
    hasRunFirstFile: true,
    isArchived: false,
    activityLog: [
      "Campaign created by Sidhartha R. on Sep 10, 2026 11:20 AM",
      "Roster file 'bengaluru_young_techies.csv' accepted & executed",
      "Completed RACE qualification for bengaluru_young_techies.csv (1,500 accepted, 18 skipped)"
    ],
    files: [
      {
        id: "FL-103-1",
        fileName: "bengaluru_young_techies.csv",
        fileSize: "0.98 MB",
        rowsAccepted: 1500,
        rowsSkipped: 18,
        skipReasons: [
          { count: 18, reason: "Incomplete name parameters" }
        ],
        cost: 15000,
        dateUploaded: "2026-09-10",
        status: "Completed"
      }
    ]
  },
  {
    id: "QUAL-104",
    name: "HNI Wealth Builders South",
    filesCount: 1,
    peopleScored: 1200,
    uploadedBy: "Priya S.",
    status: "Processing",
    dateCreated: "2026-09-15",
    totalSpend: 12000,
    targetProduct: "Wealth Advisory",
    weights: { incomeWeight: 50, spendWeight: 30, propensityWeight: 20 },
    confidenceStats: { high: 700, medium: 300, low: 200 },
    industry: "Real Estate",
    capitalProfile: "₹50 - 500 Cr",
    targetRegion: "South Region",
    customerSegment: "Individual High Net Worth",
    hasRunFirstFile: true,
    isArchived: false,
    activityLog: [
      "Campaign created by Priya S. on Sep 15, 2026 04:00 PM",
      "Roster file 'bangalore_investors_propensity.csv' received in queue",
      "Validating records formatting (Position 2 in queue)"
    ],
    files: [
      {
        id: "FL-104-1",
        fileName: "bangalore_investors_propensity.csv",
        fileSize: "1.85 MB",
        rowsAccepted: 1200,
        rowsSkipped: 0,
        skipReasons: [],
        cost: 12000,
        dateUploaded: "2026-09-15",
        status: "Processing"
      }
    ]
  },
  {
    id: "QUAL-105",
    name: "Mass Affluent Credit Upsell Draft",
    filesCount: 0,
    peopleScored: 0,
    uploadedBy: "Ananya S.",
    status: "Queued", // displays as Draft when no files run
    dateCreated: "2026-09-16",
    totalSpend: 0,
    targetProduct: "Credit Cards",
    weights: { incomeWeight: 40, spendWeight: 40, propensityWeight: 20 },
    confidenceStats: { high: 0, medium: 0, low: 0 },
    industry: "Technology",
    capitalProfile: "₹5 - 50 Cr",
    targetRegion: "West Region",
    customerSegment: "Individual High Net Worth",
    hasRunFirstFile: false,
    isArchived: false,
    activityLog: [
      "Campaign created by Ananya S. on Sep 16, 2026 09:05 AM",
      "Awaiting roster CSV upload and fit confirmation"
    ],
    files: []
  },
  {
    id: "QUAL-106",
    name: "Corporate Gold Mutual Funds",
    filesCount: 2,
    peopleScored: 2000,
    uploadedBy: "Rohan M.",
    status: "Completed",
    dateCreated: "2026-09-11",
    totalSpend: 25000,
    targetProduct: "Mutual Funds",
    weights: { incomeWeight: 45, spendWeight: 35, propensityWeight: 20 },
    confidenceStats: { high: 1100, medium: 600, low: 300 },
    industry: "Manufacturing",
    capitalProfile: "₹50 - 500 Cr",
    targetRegion: "East Region",
    customerSegment: "Corporate Clients",
    hasRunFirstFile: true,
    isArchived: false,
    activityLog: [
      "Campaign created by Rohan M. on Sep 11, 2026 11:00 AM",
      "Roster file 'kolkata_gold_members.csv' received and scored successfully (1,200 accepted, 5 skipped)",
      "Roster file 'bhubaneswar_investors_v1.xlsx' received and scored successfully (800 accepted, 12 skipped)"
    ],
    files: [
      {
        id: "FL-106-1",
        fileName: "kolkata_gold_members.csv",
        fileSize: "1.10 MB",
        rowsAccepted: 1200,
        rowsSkipped: 5,
        skipReasons: [
          { count: 5, reason: "Duplicate entries in file" }
        ],
        cost: 15000,
        dateUploaded: "2026-09-11",
        status: "Completed"
      },
      {
        id: "FL-106-2",
        fileName: "bhubaneswar_investors_v1.xlsx",
        fileSize: "0.78 MB",
        rowsAccepted: 800,
        rowsSkipped: 12,
        skipReasons: [
          { count: 12, reason: "Incomplete address parameters" }
        ],
        cost: 10000,
        dateUploaded: "2026-09-12",
        status: "Completed"
      }
    ]
  },
  {
    id: "QUAL-107",
    name: "HNI Card Upgrade Bureau Filter",
    filesCount: 1,
    peopleScored: 150,
    uploadedBy: "Priya S.",
    status: "Completed", // triggers as Partial failure dynamically in getCampaignStatus because rowsSkipped: 110 is > 20
    dateCreated: "2026-09-13",
    totalSpend: 5000,
    targetProduct: "Credit Cards",
    weights: { incomeWeight: 20, spendWeight: 60, propensityWeight: 20 },
    confidenceStats: { high: 60, medium: 50, low: 40 },
    industry: "Financial Services",
    capitalProfile: "₹5 - 50 Cr",
    targetRegion: "North Region",
    customerSegment: "Individual High Net Worth",
    hasRunFirstFile: true,
    isArchived: false,
    activityLog: [
      "Campaign created by Priya S. on Sep 13, 2026 03:30 PM",
      "Roster file 'delhi_rejected_bureau.csv' processed with significant validation skip alerts.",
      "Warning: 110 of 260 rows skipped due to active exclusions or format issues."
    ],
    files: [
      {
        id: "FL-107-1",
        fileName: "delhi_rejected_bureau.csv",
        fileSize: "0.32 MB",
        rowsAccepted: 150,
        rowsSkipped: 110,
        skipReasons: [
          { count: 85, reason: "Negative Bureau Score declaration mismatch" },
          { count: 25, reason: "Missing active mobile contact parameters" }
        ],
        cost: 5000,
        dateUploaded: "2026-09-13",
        status: "Completed"
      }
    ]
  },
  {
    id: "QUAL-108",
    name: "Affluent Retail Legacy Trust Draft",
    filesCount: 0,
    peopleScored: 0,
    uploadedBy: "Ananya S.",
    status: "Queued", // displays as Draft when no files run
    dateCreated: "2026-09-14",
    totalSpend: 0,
    targetProduct: "Legacy Trust",
    weights: { incomeWeight: 50, spendWeight: 25, propensityWeight: 25 },
    confidenceStats: { high: 0, medium: 0, low: 0 },
    industry: "E-commerce & Retail",
    capitalProfile: "₹5 - 50 Cr",
    targetRegion: "South Region",
    customerSegment: "Mass Affluent",
    hasRunFirstFile: false,
    isArchived: false,
    activityLog: [
      "Campaign created by Ananya S. on Sep 14, 2026 10:15 AM",
      "Awaiting initial roster CSV upload. Configuration fit established."
    ],
    files: []
  },
  {
    id: "QUAL-109",
    name: "Insurance HNW Elite Campaign",
    filesCount: 1,
    peopleScored: 950,
    uploadedBy: "Sidhartha R.",
    status: "Processing",
    dateCreated: "2026-09-16",
    totalSpend: 11000,
    targetProduct: "Insurance",
    weights: { incomeWeight: 60, spendWeight: 20, propensityWeight: 20 },
    confidenceStats: { high: 450, medium: 300, low: 200 },
    industry: "Financial Services",
    capitalProfile: "Above ₹500 Cr",
    targetRegion: "West Region",
    customerSegment: "Individual High Net Worth",
    hasRunFirstFile: true,
    isArchived: false,
    activityLog: [
      "Campaign created by Sidhartha R. on Sep 16, 2026 05:00 PM",
      "Roster file 'london_non_resident_indians.xlsx' received in queue for scoring",
      "Executing dynamic eligibility check against Insurance-Fit criterion models (Running...)"
    ],
    files: [
      {
        id: "FL-109-1",
        fileName: "london_non_resident_indians.xlsx",
        fileSize: "1.12 MB",
        rowsAccepted: 950,
        rowsSkipped: 0,
        skipReasons: [],
        cost: 11000,
        dateUploaded: "2026-09-16",
        status: "Processing"
      }
    ]
  },
  {
    id: "QUAL-110",
    name: "SME Founders Credit Reject",
    filesCount: 1,
    peopleScored: 0,
    uploadedBy: "Rohan M.",
    status: "Failed",
    dateCreated: "2026-09-15",
    totalSpend: 0,
    targetProduct: "Credit Cards",
    weights: { incomeWeight: 30, spendWeight: 40, propensityWeight: 30 },
    confidenceStats: { high: 0, medium: 0, low: 0 },
    industry: "Manufacturing",
    capitalProfile: "₹50 - 500 Cr",
    targetRegion: "North Region",
    customerSegment: "SME Founders",
    hasRunFirstFile: true,
    isArchived: false,
    activityLog: [
      "Campaign created by Rohan M. on Sep 15, 2026 10:00 AM",
      "Roster file 'gurugram_founders_credit.csv' rejected by security cell (Malformatted phone hashes)"
    ],
    files: [
      {
        id: "FL-110-1",
        fileName: "gurugram_founders_credit.csv",
        fileSize: "0.55 MB",
        rowsAccepted: 0,
        rowsSkipped: 320,
        skipReasons: [
          { count: 320, reason: "Incompatible/corrupt phone encryption hashes detected" }
        ],
        cost: 0,
        dateUploaded: "2026-09-15",
        status: "Failed" as any
      }
    ]
  },
  {
    id: "QUAL-111",
    name: "Legacy Trust Kolkata Corrupt",
    filesCount: 1,
    peopleScored: 0,
    uploadedBy: "Ananya S.",
    status: "Failed",
    dateCreated: "2026-09-16",
    totalSpend: 0,
    targetProduct: "Legacy Trust",
    weights: { incomeWeight: 50, spendWeight: 20, propensityWeight: 30 },
    confidenceStats: { high: 0, medium: 0, low: 0 },
    industry: "Financial Services",
    capitalProfile: "₹5 - 50 Cr",
    targetRegion: "East Region",
    customerSegment: "Individual High Net Worth",
    hasRunFirstFile: true,
    isArchived: false,
    activityLog: [
      "Campaign created by Ananya S. on Sep 16, 2026 02:30 PM",
      "Roster file 'kolkata_promoters_corrupted.xlsx' validation check failed. Terminated."
    ],
    files: [
      {
        id: "FL-111-1",
        fileName: "kolkata_promoters_corrupted.xlsx",
        fileSize: "1.45 MB",
        rowsAccepted: 0,
        rowsSkipped: 850,
        skipReasons: [
          { count: 850, reason: "Missing global unique IDs and email coordinates" }
        ],
        cost: 0,
        dateUploaded: "2026-09-16",
        status: "Failed" as any
      }
    ]
  }
];

// Mock Records generator for campaign results
const generateMockRecords = (campaignId: string, count: number): QualRecord[] => {
  const cities = ["Mumbai", "Delhi NCR", "Bengaluru", "Pune", "Hyderabad", "Kolkata"];
  const names = [
    "Rajesh Mehta", "Aarav Sharma", "Pooja Patel", "Vikram Singh", "Neha Gupta", 
    "Sanjay Dutt", "Amit Trivedi", "Karan Johar", "Sneha Rao", "Deepak Chawla",
    "Preeti Deshmukh", "Nikhil Kamath", "Divya Teja", "Rohan Murthy", "Anjali Birla"
  ];
  const exclusions = ["None", "Existing Account Holder", "DND registry", "Negative Bureau Score", "Corporate Employee Blacklist"];
  
  return Array.from({ length: count }, (_, i) => {
    const isHigh = Math.random() > 0.4;
    const isMed = Math.random() > 0.3;
    const confidence = isHigh ? 'High' : (isMed ? 'Medium' : 'Low');
    const netWorthNum = Math.floor(Math.random() * 500 + 50); // in Lakhs
    
    return {
      id: `REC-${campaignId.split('-')[1] || '101'}-${1000 + i}`,
      name: names[i % names.length] + " " + String.fromCharCode(65 + (i % 26)),
      email: `user.${1000 + i}@zenith-qualify.in`,
      phone: `+91 98${Math.floor(Math.random() * 90000000 + 10000000)}`,
      city: cities[i % cities.length],
      netWorth: `₹${netWorthNum} Lakhs`,
      spendScore: Math.floor(Math.random() * 40 + 60),
      confidence,
      propensityScore: Math.floor(Math.random() * 35 + (confidence === 'High' ? 65 : (confidence === 'Medium' ? 45 : 20))),
      status: confidence === 'High' ? 'Eligible' : (confidence === 'Medium' ? 'Borderline' : 'Ineligible'),
      exclusionApplied: Math.random() > 0.85 ? exclusions[Math.floor(Math.random() * exclusions.length)] : "None"
    };
  });
};

interface LeadQualificationProps {
  initialView?: 'dashboard' | 'builder' | 'results' | 'list' | 'management' | 'insight-dashboard' | 'insight-builder' | 'insight-management' | 'insight-feed';
}

export const LeadQualification: React.FC<LeadQualificationProps> = ({ initialView = 'dashboard' }) => {
  // App navigation state: 'dashboard' | 'builder' | 'results' | 'list' | 'management' | 'insight-dashboard' | 'insight-builder' | 'insight-management' | 'insight-feed'
  const [qualView, setQualView] = useState<'dashboard' | 'builder' | 'results' | 'list' | 'management' | 'insight-dashboard' | 'insight-builder' | 'insight-management' | 'insight-feed'>(initialView);
  
  // Cloned campaign state for Customer Insight Builder
  const [clonedCampaignForBuilder, setClonedCampaignForBuilder] = useState<QualCampaign | null>(null);
  
  // Active selected campaign for editing or management
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  // Campaign Management interactive states
  const [managementSearch, setManagementSearch] = useState('');
  const [managementStatus, setManagementStatus] = useState<'All' | 'Draft' | 'Processing' | 'Complete' | 'Partial failure' | 'Failed'>('All');
  const [managementDate, setManagementDate] = useState<'All time' | 'Last 7 days' | 'Last 30 days' | 'Last 90 days'>('All time');
  const [managementTicketSize, setManagementTicketSize] = useState<'All' | 'Under 50k' | '50k - 2L' | 'Above 2L'>('All');
  const [managementPurchaseChannel, setManagementPurchaseChannel] = useState<'All' | 'Online' | 'Offline' | 'Both'>('All');
  const [managementSortBy, setManagementSortBy] = useState<'name' | 'status' | 'filesCount' | 'peopleScored' | 'totalSpend' | 'uploadedBy' | 'dateCreated'>('dateCreated');
  const [managementSortOrder, setManagementSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showArchived, setShowArchived] = useState(false);
  const [detailDrawerCampaignId, setDetailDrawerCampaignId] = useState<string | null>(null);
  const [managementToast, setManagementToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setManagementToast({ message, type });
    setTimeout(() => setManagementToast(null), 4000);
  };

  useEffect(() => {
    if (initialView) {
      setQualView(initialView);
      if (initialView === 'builder') {
        setSelectedCampaignId(null);
        setCampaignName('');
        setTargetProduct('Wealth Advisory');
        setIndustry('Technology');
        setCapitalProfile('₹50 - 500 Cr');
        setTargetRegion('North Region');
        setCustomerSegment('Individual High Net Worth');
        setIncomeWeight(50);
        setSpendWeight(30);
        setPropensityWeight(20);
        setPendingFile(null);
        setConsentConfirmed(false);
      }
    }
  }, [initialView]);

  // Date filter state
  const [dateRange, setDateRange] = useState<'All time' | 'Last 7 days' | 'Last 30 days' | 'Last 90 days'>('All time');

  // Campaigns list stored in state
  const [campaigns, setCampaigns] = useState<QualCampaign[]>(() => {
    const cached = localStorage.getItem('zenith_qual_campaigns');
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as QualCampaign[];
        // Proactive Migration: If the user's cache lacks the new complete/failed mock data files,
        // force synchronize the high-fidelity INITIAL_QUAL_CAMPAIGNS state.
        const lacksDetailedMockData = parsed.some(c => (c.id === 'QUAL-101' || c.id === 'QUAL-102') && (!c.files || c.files.length === 0));
        const missingNewCampaigns = !parsed.some(c => c.id === 'QUAL-106' || c.id === 'QUAL-110');
        if (lacksDetailedMockData || missingNewCampaigns) {
          localStorage.setItem('zenith_qual_campaigns', JSON.stringify(INITIAL_QUAL_CAMPAIGNS));
          return INITIAL_QUAL_CAMPAIGNS;
        }
        return parsed;
      } catch (e) {
        return INITIAL_QUAL_CAMPAIGNS;
      }
    }
    return INITIAL_QUAL_CAMPAIGNS;
  });

  const [resultsFilter, setResultsFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
  const [resultsSearch, setResultsSearch] = useState('');

  // Setup form states for campaign properties
  const [campaignName, setCampaignName] = useState('');
  const [targetProduct, setTargetProduct] = useState('Wealth Advisory');
  
  // Business/RACE attributes
  const [industry, setIndustry] = useState('Technology');
  const [capitalProfile, setCapitalProfile] = useState('₹50 - 500 Cr');
  const [targetRegion, setTargetRegion] = useState('North Region');
  const [customerSegment, setCustomerSegment] = useState('Individual High Net Worth');
  const [ticketSizeMin, setTicketSizeMin] = useState<number>(10000);
  const [ticketSizeMax, setTicketSizeMax] = useState<number>(500000);
  const [purchaseCycle, setPurchaseCycle] = useState<'One-time' | 'Recurring subscription'>('One-time');
  const [purchaseChannel, setPurchaseChannel] = useState<'Online' | 'Offline' | 'Both'>('Both');
  const [targetCostPerQualifiedLead, setTargetCostPerQualifiedLead] = useState<number>(15);

  // Interactive model weights
  const [incomeWeight, setIncomeWeight] = useState(50);
  const [spendWeight, setSpendWeight] = useState(30);
  const [propensityWeight, setPropensityWeight] = useState(20);

  // CSV/File simulation states
  const [pendingFile, setPendingFile] = useState<{
    name: string;
    size: string;
    rowsAccepted: number;
    rowsSkipped: number;
    skipReasons: Array<{ count: number; reason: string }>;
    cost: number;
  } | null>(null);

  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingLogs, setProcessingLogs] = useState<string[]>([]);

  // Toast alert
  const [toast, setToast] = useState<string | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('zenith_qual_campaigns', JSON.stringify(campaigns));
  }, [campaigns]);

  // Handle Toast Auto-close
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Date Filtering logic helper
  const filteredCampaignsByDate = useMemo(() => {
    return campaigns.filter(c => {
      if (dateRange === 'All time') return true;
      const createdDate = new Date(c.dateCreated);
      const now = new Date();
      if (dateRange === 'Last 7 days') {
        const diff = now.getTime() - createdDate.getTime();
        return diff <= 7 * 24 * 60 * 60 * 1000;
      }
      if (dateRange === 'Last 30 days') {
        const diff = now.getTime() - createdDate.getTime();
        return diff <= 30 * 24 * 60 * 60 * 1000;
      }
      if (dateRange === 'Last 90 days') {
        const diff = now.getTime() - createdDate.getTime();
        return diff <= 90 * 24 * 60 * 60 * 1000;
      }
      return true;
    });
  }, [campaigns, dateRange]);

  // Dashboard metrics summation based on date filter
  const metrics = useMemo(() => {
    const complAndProc = filteredCampaignsByDate.filter(c => c.status !== 'Failed');
    const totalCampaigns = filteredCampaignsByDate.length;
    const totalFiles = complAndProc.reduce((acc, c) => acc + c.filesCount, 0);
    const totalSpend = complAndProc.reduce((acc, c) => acc + c.totalSpend, 0);
    const totalPeople = complAndProc.reduce((acc, c) => acc + c.peopleScored, 0);

    // Confidence sum
    let highSum = 0;
    let mediumSum = 0;
    let lowSum = 0;

    complAndProc.forEach(c => {
      highSum += c.confidenceStats.high;
      mediumSum += c.confidenceStats.medium;
      lowSum += c.confidenceStats.low;
    });

    const grandTotalConfidence = highSum + mediumSum + lowSum || 1;
    const highPct = Math.round((highSum / grandTotalConfidence) * 100);
    const mediumPct = Math.round((mediumSum / grandTotalConfidence) * 100);
    const lowPct = 100 - highPct - mediumPct;

    // Actual vs. Target CPL calculations (measured per High-confidence lead operational cost-per-lead)
    const actualCPL = highSum > 0 ? Math.round(totalSpend / highSum) : 16;
    const totalTargetCPL = complAndProc.reduce((acc, c) => acc + (c.targetCostPerQualifiedLead ?? 15), 0);
    const targetCPLAvg = complAndProc.length > 0 ? Math.round(totalTargetCPL / complAndProc.length) : 15;
    const cplDiff = targetCPLAvg > 0 ? Math.round(((actualCPL - targetCPLAvg) / targetCPLAvg) * 100) : 0;
    const cplOverUnderLabel = cplDiff > 0 ? `${cplDiff}% over` : `${Math.abs(cplDiff)}% under`;

    // Counts within vs outside target
    let withinCPLCount = 0;
    let outsideCPLCount = 0;
    complAndProc.forEach(c => {
      const cActual = c.confidenceStats.high > 0 ? Math.round(c.totalSpend / c.confidenceStats.high) : 15;
      const cTarget = c.targetCostPerQualifiedLead ?? 15;
      if (cActual <= cTarget) {
        withinCPLCount++;
      } else {
        outsideCPLCount++;
      }
    });

    // Helper functions for ticket-size and purchase channel categorization
    const getTicketSizeRange = (c: QualCampaign) => {
      if (c.ticketSizeMin !== undefined) {
        const avg = (c.ticketSizeMin + (c.ticketSizeMax || c.ticketSizeMin)) / 2;
        if (avg < 100000) return "Under ₹1L";
        if (avg <= 500000) return "₹1L - ₹5L";
        return "Above ₹5L";
      }
      if (c.targetProduct === "Wealth Advisory") return "Above ₹5L";
      if (c.targetProduct === "Mutual Funds") return "₹1L - ₹5L";
      if (c.targetProduct === "Credit Cards") return "Under ₹1L";
      if (c.targetProduct === "Insurance") return "₹1L - ₹5L";
      return "Under ₹1L";
    };

    const getPurchaseChannel = (c: QualCampaign) => {
      if (c.purchaseChannel) return c.purchaseChannel;
      if (c.targetProduct === "Credit Cards") return "Online";
      if (c.targetProduct === "Wealth Advisory") return "Offline";
      return "Both";
    };

    // Calculate Confidence Mix by Ticket-Size Range
    const rangeStats = {
      "Under ₹1L": { high: 0, total: 0 },
      "₹1L - ₹5L": { high: 0, total: 0 },
      "Above ₹5L": { high: 0, total: 0 }
    };
    complAndProc.forEach(c => {
      const range = getTicketSizeRange(c);
      const cTotal = c.confidenceStats.high + c.confidenceStats.medium + c.confidenceStats.low;
      rangeStats[range].high += c.confidenceStats.high;
      rangeStats[range].total += cTotal;
    });

    // Calculate Confidence Mix by Purchase Channel
    const channelStats = {
      "Online": { high: 0, total: 0 },
      "Offline": { high: 0, total: 0 },
      "Both": { high: 0, total: 0 }
    };
    complAndProc.forEach(c => {
      const chan = getPurchaseChannel(c);
      const cTotal = c.confidenceStats.high + c.confidenceStats.medium + c.confidenceStats.low;
      channelStats[chan].high += c.confidenceStats.high;
      channelStats[chan].total += cTotal;
    });

    return {
      totalCampaigns,
      totalFiles,
      totalSpend,
      totalPeople,
      actualCPL,
      targetCPLAvg,
      cplDiff,
      cplOverUnderLabel,
      withinCPLCount,
      outsideCPLCount,
      rangeStats,
      channelStats,
      confidenceMix: {
        high: highSum,
        highPct,
        medium: mediumSum,
        mediumPct,
        low: lowSum,
        lowPct
      }
    };
  }, [filteredCampaignsByDate]);

  // Actual vs Target CPL Trend coordinates over time
  const cplTrendCoords = useMemo(() => {
    // Generate dates or campaign labels
    const rawTrend = [
      { label: "09/02", actual: 15.6, target: 15.0 },
      { label: "09/05", actual: 14.1, target: 15.0 },
      { label: "09/08", actual: 17.2, target: 16.0 },
      { label: "09/11", actual: 13.8, target: 16.0 },
      { label: "09/15", actual: 18.0, target: 16.0 },
      { label: "09/18", actual: 19.4, target: 15.0 },
      { label: "09/21", actual: metrics.actualCPL, target: metrics.targetCPLAvg }
    ];
    
    const maxVal = 25;
    return rawTrend.map((pt, idx) => {
      const x = 50 + idx * (510 / Math.max(rawTrend.length - 1, 1));
      const yActual = 150 - (pt.actual / maxVal) * 110;
      const yTarget = 150 - (pt.target / maxVal) * 110;
      return { ...pt, x, yActual, yTarget };
    });
  }, [metrics.actualCPL, metrics.targetCPLAvg]);

  // Selected Campaign Object for Results view
  const selectedCampaign = useMemo(() => {
    return campaigns.find(c => c.id === selectedCampaignId) || null;
  }, [campaigns, selectedCampaignId]);

  // Qualified Feed States
  const [resultsCampaignId, setResultsCampaignId] = useState<string>('All');
  const [resultsFileId, setResultsFileId] = useState<string>('All');
  const [selectedDetailPerson, setSelectedDetailPerson] = useState<QualRecord | null>(null);

  // Sync selectedCampaignId to resultsCampaignId when results view is triggered
  useEffect(() => {
    if (qualView === 'results') {
      if (selectedCampaignId) {
        setResultsCampaignId(selectedCampaignId);
      } else {
        setResultsCampaignId('All');
      }
      setResultsFileId('All');
    }
  }, [selectedCampaignId, qualView]);

  // Unified pre-generated or derived records per campaign and file
  const allGeneratedRecords = useMemo(() => {
    const recordsMap: Record<string, QualRecord[]> = {};
    
    campaigns.forEach(camp => {
      const files = camp.files || [];
      if (files.length === 0) {
        recordsMap[camp.id] = [];
        return;
      }
      
      const totalCount = camp.peopleScored || 0;
      if (totalCount === 0) {
        recordsMap[camp.id] = [];
        return;
      }
      
      const countPerFile = Math.ceil(totalCount / files.length);
      const campRecords: QualRecord[] = [];
      
      files.forEach((file, fIdx) => {
        // Generate records with custom attributes matching files
        const cities = ["Mumbai", "Delhi NCR", "Bengaluru", "Pune", "Hyderabad", "Kolkata"];
        const names = [
          "Rajesh Mehta", "Aarav Sharma", "Pooja Patel", "Vikram Singh", "Neha Gupta", 
          "Sanjay Dutt", "Amit Trivedi", "Karan Johar", "Sneha Rao", "Deepak Chawla",
          "Preeti Deshmukh", "Nikhil Kamath", "Divya Teja", "Rohan Murthy", "Anjali Birla"
        ];
        const exclusions = ["None", "Existing Account Holder", "DND registry", "Negative Bureau Score", "Corporate Employee Blacklist"];
        
        const sizeToGenerate = Math.min(countPerFile, 150);
        const fileRecords = Array.from({ length: sizeToGenerate }, (_, i) => {
          // Deterministic/seed-based confidence
          const idx = fIdx * 20 + i;
          let confidence: 'High' | 'Medium' | 'Low' = 'High';
          if (idx % 3 === 1) {
            confidence = 'Medium';
          } else if (idx % 3 === 2) {
            confidence = 'Low';
          }
          
          const netWorthNum = Math.floor(((idx * 7) % 450) + 50); // in Lakhs
          
          return {
            id: `REC-${camp.id.split('-')[1] || '101'}-${fIdx + 1}-${100 + i}`,
            name: names[(idx) % names.length] + " " + String.fromCharCode(65 + ((idx) % 26)),
            email: `user.${camp.id.split('-')[1] || '101'}.${fIdx + 1}.${100 + i}@zenith-qualify.in`,
            phone: `+91 98${Math.floor(((idx * 12345) % 90000000) + 10000000)}`,
            city: cities[idx % cities.length],
            netWorth: `₹${netWorthNum} Lakhs`,
            spendScore: Math.floor(((idx * 11) % 40) + 60),
            confidence,
            propensityScore: Math.floor(((idx * 13) % 35) + (confidence === 'High' ? 65 : (confidence === 'Medium' ? 45 : 20))),
            status: confidence === 'High' ? 'Eligible' : (confidence === 'Medium' ? 'Borderline' : 'Ineligible') as any,
            exclusionApplied: idx % 9 === 0 ? exclusions[idx % exclusions.length] : "None",
            sourceFile: file.fileName,
            uploadedBy: camp.uploadedBy || "Sidhartha R.",
            dateProcessed: file.dateUploaded || camp.dateCreated,
            campaignId: camp.id,
            campaignName: camp.name
          };
        });
        campRecords.push(...fileRecords);
      });
      recordsMap[camp.id] = campRecords;
    });
    
    return recordsMap;
  }, [campaigns]);

  const recordsToFilter = useMemo(() => {
    if (resultsCampaignId === 'All') {
      return Object.values(allGeneratedRecords).flat();
    }
    const campRecords = allGeneratedRecords[resultsCampaignId] || [];
    if (resultsFileId === 'All') {
      return campRecords;
    }
    return campRecords.filter(r => r.sourceFile === resultsFileId);
  }, [allGeneratedRecords, resultsCampaignId, resultsFileId]);

  const finalFilteredRecords = useMemo(() => {
    return recordsToFilter.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(resultsSearch.toLowerCase()) || 
                            r.email.toLowerCase().includes(resultsSearch.toLowerCase()) ||
                            r.phone.includes(resultsSearch) ||
                            r.id.toLowerCase().includes(resultsSearch.toLowerCase()) ||
                            (r.sourceFile && r.sourceFile.toLowerCase().includes(resultsSearch.toLowerCase())) ||
                            (r.uploadedBy && r.uploadedBy.toLowerCase().includes(resultsSearch.toLowerCase()));
      
      const matchesConfidence = resultsFilter === 'All' || r.confidence === resultsFilter;
      return matchesSearch && matchesConfidence;
    });
  }, [recordsToFilter, resultsSearch, resultsFilter]);

  const handleExportQualifiedFeedCSV = () => {
    const headers = ["Record ID", "Name", "Email", "Phone", "City", "Net Worth Target", "Spend Score", "AI Propensity Score", "Confidence Level", "Status", "Exclusions", "Source File", "Uploaded By", "Date Processed", "Campaign"];
    const rows = finalFilteredRecords.map(r => [
      r.id,
      r.name,
      r.email,
      r.phone,
      r.city,
      r.netWorth,
      r.spendScore,
      r.propensityScore,
      r.confidence,
      r.status,
      r.exclusionApplied,
      r.sourceFile || "N/A",
      r.uploadedBy || "N/A",
      r.dateProcessed || "N/A",
      r.campaignName || "N/A"
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `zenith_qualified_feed_${resultsCampaignId}_${resultsFileId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Successfully exported ${finalFilteredRecords.length} filtered records.`, 'success');
  };

  // Helper to open builder for a new campaign
  const handleNewCampaignClick = () => {
    setSelectedCampaignId(null);
    setCampaignName('');
    setTargetProduct('Wealth Advisory');
    setIndustry('Technology');
    setCapitalProfile('₹50 - 500 Cr');
    setTargetRegion('North Region');
    setCustomerSegment('Individual High Net Worth');
    setIncomeWeight(50);
    setSpendWeight(30);
    setPropensityWeight(20);
    setPendingFile(null);
    setConsentConfirmed(false);
    setQualView('builder');
  };

  // Drag and drop or manual select simulate CSV
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    simulateFileAnalysis("leads_roster_" + Math.floor(Math.random() * 1000 + 100) + ".csv", "1.65 MB");
  };

  const selectManualSample = () => {
    simulateFileAnalysis("raw_customer_leads_q3.xlsx", "2.10 MB");
  };

  const simulateFileAnalysis = (fileName: string, fileSize: string) => {
    const accepted = Math.floor(Math.random() * 1200 + 1000);
    const skipped = Math.floor(Math.random() * 45 + 15);
    const cost = Math.round(accepted * 11.5); // ₹11.5 cost per accepted row
    
    setPendingFile({
      name: fileName,
      size: fileSize,
      rowsAccepted: accepted,
      rowsSkipped: skipped,
      skipReasons: [
        { count: Math.ceil(skipped * 0.45), reason: "Invalid phone formatting or incomplete country dial code" },
        { count: Math.ceil(skipped * 0.35), reason: "DND active global call filter checklist matches" },
        { count: Math.floor(skipped * 0.20), reason: "Duplicated records with identical email identifier" }
      ],
      cost
    });
    setToast(`Validated roster file cleanly! ${accepted} rows accepted.`);
  };

  // Launch a scoring task for the pending file inside active campaign
  const handleRunFile = () => {
    if (!pendingFile) return;
    if (!consentConfirmed) {
      alert("Please tick the consent checkbox to verify collection guidelines.");
      return;
    }

    setIsProcessingFile(true);
    setProcessingProgress(0);
    setProcessingLogs([]);

    const logMessages = [
      `[LOG] Loading candidate list dataset: ${pendingFile.name}...`,
      "[LOG] Initiating RACE platform demographic filters context...",
      `[LOG] Fitting campaign attributes: Industry: ${industry} | Ticket Size: ₹${ticketSizeMin.toLocaleString('en-IN')} - ₹${ticketSizeMax.toLocaleString('en-IN')} | Cycle: ${purchaseCycle} | Channel: ${purchaseChannel}`,
      `[LOG] Running proprietary weights alignment: Inc: ${incomeWeight}%, Spends: ${spendWeight}%...`,
      "[LOG] Discarding bad identifiers and applying DND lookup checkpoints...",
      "[LOG] Processing completed. Syncing eligibility tiers...",
      "[SUCCESS] 100% evaluated. Final records roster has been scored!"
    ];

    let step = 0;
    const interval = setInterval(() => {
      if (step < logMessages.length) {
        setProcessingLogs(prev => [...prev, logMessages[step]]);
        setProcessingProgress(prev => Math.min(prev + 15, 100));
        step++;
      } else {
        clearInterval(interval);

        // Calculate and build scored record counts
        const generatedHigh = Math.floor(pendingFile.rowsAccepted * 0.55);
        const generatedMedium = Math.floor(pendingFile.rowsAccepted * 0.30);
        const generatedLow = pendingFile.rowsAccepted - generatedHigh - generatedMedium;

        if (selectedCampaignId) {
          // Uploading subsequent file into an existing campaign
          setCampaigns(prev => prev.map(c => {
            if (c.id === selectedCampaignId) {
              const updatedFiles: QualFile[] = [
                ...c.files,
                {
                  id: `FL-${c.id.split('-')[1]}-${c.files.length + 1}`,
                  fileName: pendingFile.name,
                  fileSize: pendingFile.size,
                  rowsAccepted: pendingFile.rowsAccepted,
                  rowsSkipped: pendingFile.rowsSkipped,
                  skipReasons: pendingFile.skipReasons,
                  cost: pendingFile.cost,
                  dateUploaded: new Date().toISOString().slice(0, 10),
                  status: 'Completed'
                }
              ];
              return {
                ...c,
                filesCount: updatedFiles.length,
                peopleScored: c.peopleScored + pendingFile.rowsAccepted,
                totalSpend: c.totalSpend + pendingFile.cost,
                hasRunFirstFile: true,
                files: updatedFiles,
                confidenceStats: {
                  high: c.confidenceStats.high + generatedHigh,
                  medium: c.confidenceStats.medium + generatedMedium,
                  low: c.confidenceStats.low + generatedLow
                }
              };
            }
            return c;
          }));

          // Records are dynamically computed from files in allGeneratedRecords
          setToast(`Scored ${pendingFile.rowsAccepted} leads into campaign securely!`);
          setPendingFile(null);
          setConsentConfirmed(false);
          setIsProcessingFile(false);
          setQualView('results');
        } else {
          // Creating brand new campaign with this first run
          const newId = `QUAL-${Math.floor(Math.random() * 900 + 106)}`;
          const newCamp: QualCampaign = {
            id: newId,
            name: campaignName || "New Untamed Leads Cohort",
            filesCount: 1,
            peopleScored: pendingFile.rowsAccepted,
            uploadedBy: "Sidhartha R.",
            status: "Completed",
            dateCreated: new Date().toISOString().slice(0, 10),
            totalSpend: pendingFile.cost,
            targetProduct,
            industry,
            capitalProfile,
            targetRegion,
            customerSegment,
            ticketSizeMin,
            ticketSizeMax,
            purchaseCycle,
            purchaseChannel,
            targetCostPerQualifiedLead,
            hasRunFirstFile: true,
            weights: { incomeWeight, spendWeight, propensityWeight },
            confidenceStats: { high: generatedHigh, medium: generatedMedium, low: generatedLow },
            files: [
              {
                id: `FL-${newId.split('-')[1]}-1`,
                fileName: pendingFile.name,
                fileSize: pendingFile.size,
                rowsAccepted: pendingFile.rowsAccepted,
                rowsSkipped: pendingFile.rowsSkipped,
                skipReasons: pendingFile.skipReasons,
                cost: pendingFile.cost,
                dateUploaded: new Date().toISOString().slice(0, 10),
                status: 'Completed'
              }
            ]
          };

          setCampaigns(prev => [newCamp, ...prev]);

          setSelectedCampaignId(newId);
          setPendingFile(null);
          setConsentConfirmed(false);
          setIsProcessingFile(false);
          setToast(`Campaign created & first roster evaluated completely!`);
          setQualView('results');
        }
      }
    }, 1100);
  };

  // Clone Campaign logic
  const handleCloneCampaign = (camp: QualCampaign) => {
    setSelectedCampaignId(null);
    setCampaignName(`Copy of ${camp.name}`);
    setTargetProduct(camp.targetProduct);
    setIndustry(camp.industry);
    setCapitalProfile(camp.capitalProfile);
    setTargetRegion(camp.targetRegion);
    setCustomerSegment(camp.customerSegment);
    setTicketSizeMin(camp.ticketSizeMin ?? 10000);
    setTicketSizeMax(camp.ticketSizeMax ?? 500000);
    setPurchaseCycle(camp.purchaseCycle ?? 'One-time');
    setPurchaseChannel(camp.purchaseChannel ?? 'Both');
    setTargetCostPerQualifiedLead(camp.targetCostPerQualifiedLead ?? 15);
    setIncomeWeight(camp.weights.incomeWeight);
    setSpendWeight(camp.weights.spendWeight);
    setPropensityWeight(camp.weights.propensityWeight);
    setPendingFile(null);
    setConsentConfirmed(false);
    setQualView('builder');
    setToast(`Cloned configuration from ${camp.name}! Feel free to adjust attributes.`);
  };

  // Edit / view campaign details
  const handleViewCampaignDetails = (camp: QualCampaign) => {
    setSelectedCampaignId(camp.id);
    setCampaignName(camp.name);
    setTargetProduct(camp.targetProduct);
    setIndustry(camp.industry);
    setCapitalProfile(camp.capitalProfile);
    setTargetRegion(camp.targetRegion);
    setCustomerSegment(camp.customerSegment);
    setTicketSizeMin(camp.ticketSizeMin ?? 10000);
    setTicketSizeMax(camp.ticketSizeMax ?? 500000);
    setPurchaseCycle(camp.purchaseCycle ?? 'One-time');
    setPurchaseChannel(camp.purchaseChannel ?? 'Both');
    setTargetCostPerQualifiedLead(camp.targetCostPerQualifiedLead ?? 15);
    setIncomeWeight(camp.weights.incomeWeight);
    setSpendWeight(camp.weights.spendWeight);
    setPropensityWeight(camp.weights.propensityWeight);
    setPendingFile(null);
    setConsentConfirmed(false);
    setQualView('builder');
  };

  const deleteCampaign = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this qualification batch?")) {
      setCampaigns(prev => prev.filter(c => c.id !== id));
      setToast("Campaign deleted successfully");
    }
  };

  const handleArchiveCampaign = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCampaigns(prev => prev.map(c => {
      if (c.id === id) {
        const nextArchived = !c.isArchived;
        showToast(nextArchived ? "Campaign archived successfully." : "Campaign unarchived successfully.", "info");
        return {
          ...c,
          isArchived: nextArchived,
          activityLog: [
            ...(c.activityLog || []),
            `[EVENT] Campaign ${nextArchived ? 'archived' : 'unarchived'} by user Sidhartha R. at ${new Date().toLocaleTimeString()}`
          ]
        };
      }
      return c;
    }));
  };

  const handleExportResultsCSV = () => {
    if (!selectedCampaign) return;
    const headers = ["Record ID", "Name", "Email", "Phone", "City", "Net Worth Target", "Spends Index", "AI Confidence Score", "Propensity Score", "Qualification Status", "Exclusions"];
    const rows = finalFilteredRecords.map(r => [
      r.id,
      `"${r.name}"`,
      r.email,
      `"${r.phone}"`,
      r.city,
      `"${r.netWorth}"`,
      r.spendScore,
      r.confidence,
      r.propensityScore,
      r.status,
      r.exclusionApplied
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${selectedCampaign.name.toLowerCase().replace(/ /g, '_')}_scored_roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToast(`Exported ${finalFilteredRecords.length} records safely.`);
  };

  // Helper calculation for total spend of a selected campaign including the pending estimation
  const totalSpendForCampaign = useMemo(() => {
    if (!selectedCampaignId) return 0;
    const camp = campaigns.find(c => c.id === selectedCampaignId);
    return camp ? camp.totalSpend : 0;
  }, [campaigns, selectedCampaignId]);

  // Handler for running Customer Insight Campaign scoring
  const handleRunInsightCampaign = (campaignData: any) => {
    const { fileToRun, ...rest } = campaignData;
    
    setCampaigns(prev => {
      const existingCampaignIndex = prev.findIndex(c => c.id === selectedCampaignId);
      let updatedCampaigns = [...prev];
      const newFileId = `FL-${selectedCampaignId || 'QUAL-' + Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 900 + 100)}`;
      const completedFile = {
        ...fileToRun,
        id: newFileId,
        status: 'Completed'
      };

      if (existingCampaignIndex >= 0) {
        const existing = prev[existingCampaignIndex];
        const newFiles = [...(existing.files || []), completedFile];
        const updated = {
          ...existing,
          ...rest,
          filesCount: newFiles.length,
          peopleScored: existing.peopleScored + completedFile.rowsAccepted,
          totalSpend: existing.totalSpend + completedFile.cost,
          hasRunFirstFile: true,
          files: newFiles,
          activityLog: [
            ...(existing.activityLog || []),
            `Secondary run completed: processed ${completedFile.fileName} adding ${completedFile.rowsAccepted} scored records safely. (Cost: ₹${completedFile.cost})`
          ],
          status: 'Completed'
        };
        updatedCampaigns[existingCampaignIndex] = updated as any;
        setToast(`Successfully added run file to Campaign: ${existing.name}`);
      } else {
        const newId = `QUAL-INS-${Math.floor(Math.random() * 90000 + 10000)}`;
        const newCampaign = {
          id: newId,
          name: rest.name || "Untitled Campaign",
          filesCount: 1,
          peopleScored: completedFile.rowsAccepted,
          uploadedBy: "Priya Sharma",
          status: 'Completed',
          dateCreated: new Date().toISOString().slice(0, 10),
          totalSpend: completedFile.cost,
          targetProduct: "Wealth Advisory",
          weights: { incomeWeight: 50, spendWeight: 30, propensityWeight: 20 },
          confidenceStats: {
            high: Math.round(completedFile.rowsAccepted * 0.58),
            medium: Math.round(completedFile.rowsAccepted * 0.28),
            low: Math.round(completedFile.rowsAccepted * 0.14)
          },
          industry: rest.industry || "Technology",
          capitalProfile: rest.capitalProfile || "₹50 - 500 Cr",
          targetRegion: rest.targetRegion || "North Region",
          customerSegment: rest.customerSegment || "Individual High Net Worth",
          ticketSizeMin: rest.ticketSizeMin !== undefined ? rest.ticketSizeMin : 10000,
          ticketSizeMax: rest.ticketSizeMax !== undefined ? rest.ticketSizeMax : 500000,
          purchaseCycle: rest.purchaseCycle || "One-time",
          purchaseChannel: rest.purchaseChannel || "Both",
          hasRunFirstFile: true,
          files: [completedFile],
          useCaseTag: rest.useCaseTag || 'Engagement',
          totalBudgetCap: rest.totalBudgetCap || '',
          activityLog: [
            `Campaign created by Priya Sharma on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
            `RACE Insight settings locked: ${rest.industry} | ${rest.customerSegment}`,
            `Initial file execution completed: processed ${completedFile.fileName} yielding ${completedFile.rowsAccepted} scored profiles. (Cost: ₹${completedFile.cost})`
          ]
        };
        updatedCampaigns = [newCampaign as any, ...updatedCampaigns];
        setToast(`Successfully launched Campaign: ${newCampaign.name}`);
      }

      return updatedCampaigns;
    });

    setClonedCampaignForBuilder(null);
    setSelectedCampaignId(null);
    setQualView('insight-management');
  };

  // Handler for cloning Customer Insight Campaign
  const handleCloneInsightCampaign = (campaignId: string) => {
    const target = campaigns.find(c => c.id === campaignId);
    if (target) {
      const clonedCampaign = {
        ...target,
        id: `QUAL-INS-${Math.floor(Math.random() * 90000 + 10000)}`,
        name: `${target.name} (Clone)`,
        filesCount: 0,
        peopleScored: 0,
        totalSpend: 0,
        hasRunFirstFile: false,
        files: [],
        activityLog: [
          `Campaign cloned from ${target.id} (${target.name}) by Priya Sharma on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
          `RACE Insight settings unlocked for customization.`
        ]
      };
      setSelectedCampaignId(null);
      setClonedCampaignForBuilder(clonedCampaign as any);
      setQualView('insight-builder');
    }
  };

  return (
    <div className="space-y-6 pb-24 font-sans select-none w-full max-w-full">
      
      {/* Toast Alert popup */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-xs font-semibold px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 z-50 animate-bounce-in max-w-md text-center border border-neutral-800">
          <CheckCircle className="text-emerald-400" size={14} />
          <span>{toast}</span>
        </div>
      )}

      {/* VIEW: CUSTOMER INSIGHT DASHBOARD */}
      {qualView === 'insight-dashboard' && (
        <CustomerInsightDashboard 
          campaigns={campaigns} 
          onNavigate={(targetView, campaignId) => {
            if (campaignId) {
              setSelectedCampaignId(campaignId);
            }
            if (targetView === 'builder') {
              setClonedCampaignForBuilder(null);
              setSelectedCampaignId(campaignId || null);
              setQualView('insight-builder');
            } else {
              setQualView('insight-management');
            }
          }}
        />
      )}

      {/* VIEW: CUSTOMER INSIGHT BUILDER */}
      {qualView === 'insight-builder' && (
        <CustomerInsightBuilder 
          selectedCampaign={clonedCampaignForBuilder || (selectedCampaignId ? campaigns.find(c => c.id === selectedCampaignId) || null : null)}
          onCancel={() => {
            setClonedCampaignForBuilder(null);
            setQualView('insight-management');
          }}
          onRun={handleRunInsightCampaign}
          onClone={(camp) => {
            setClonedCampaignForBuilder(null);
            handleCloneInsightCampaign(camp.id);
          }}
        />
      )}

      {/* VIEW: CUSTOMER INSIGHT MANAGEMENT */}
      {qualView === 'insight-management' && (
        <CustomerInsightManagement 
          campaigns={campaigns}
          onNewCampaign={() => {
            setClonedCampaignForBuilder(null);
            setSelectedCampaignId(null);
            setQualView('insight-builder');
          }}
          onSelectCampaignForRun={(campaignId) => {
            setClonedCampaignForBuilder(null);
            setSelectedCampaignId(campaignId);
            setQualView('insight-builder');
          }}
          onCloneCampaign={handleCloneInsightCampaign}
          onArchiveCampaign={(campaignId) => {
            setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, isArchived: true } : c));
            setToast("Campaign archived successfully.");
          }}
        />
      )}

      {/* VIEW: CUSTOMER INSIGHT FEED */}
      {qualView === 'insight-feed' && (
        <CustomerInsightFeed campaigns={campaigns} />
      )}

      {/* VIEW 1: LEAD QUALIFICATION DASHBOARD */}
      {qualView === 'dashboard' && (
        <>
          {/* Header Dashboard section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-b border-neutral-200/50">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2.5">
                <span>Lead Qualification & Campaigns</span>
                <span className="bg-[#eff6ff] text-[#1e40af] font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-[#bfdbfe]">
                  RACE Engine Active
                </span>
              </h2>
              <p className="text-xs text-neutral-400 mt-1 font-medium">
                Upload raw demographic cohorts, construct dynamic propensity criteria, and evaluate wealth eligibility.
              </p>
            </div>

            <div className="flex items-center gap-3.5 self-start md:self-center">
              {/* Date Range Select dropdown */}
              <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-lg px-3 py-1.5 shadow-xs">
                <Calendar size={13} className="text-neutral-400" />
                <select 
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                  className="bg-transparent border-none text-xs font-bold text-neutral-600 focus:outline-none cursor-pointer"
                >
                  <option value="All time">All Time</option>
                  <option value="Last 7 days">Last 7 days</option>
                  <option value="Last 30 days">Last 30 days</option>
                  <option value="Last 90 days">Last 90 days</option>
                </select>
              </div>

              {/* Launch New Campaign CTA */}
              <button
                onClick={handleNewCampaignClick}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-[#1e40af] hover:bg-[#1d4ed8] active:scale-95 text-white rounded-lg shadow-md transition-all cursor-pointer"
              >
                <PlusCircle size={13} />
                <span>New Campaign</span>
              </button>
            </div>
          </div>

          {/* KPI Statistics Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            
            {/* Tile 1: Campaigns run */}
            <div className="bg-white border border-neutral-200/60 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:border-neutral-300 hover:shadow-sm transition-all">
              <div className="space-y-1">
                <span className="text-[9.5px] uppercase font-bold text-neutral-400 tracking-wider block">Campaigns Run</span>
                <h3 className="text-xl font-extrabold text-neutral-800">{metrics.totalCampaigns}</h3>
              </div>
              <p className="text-[9.5px] text-neutral-400 mt-2 font-semibold">Active wealth models</p>
            </div>

            {/* Tile 2: Files processed */}
            <div className="bg-white border border-neutral-200/60 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:border-neutral-300 hover:shadow-sm transition-all">
              <div className="space-y-1">
                <span className="text-[9.5px] uppercase font-bold text-neutral-400 tracking-wider block">Files Processed</span>
                <h3 className="text-xl font-extrabold text-neutral-800">{metrics.totalFiles}</h3>
              </div>
              <p className="text-[9.5px] text-neutral-400 mt-2 font-semibold">CSVs & rosters scored</p>
            </div>

            {/* Tile 3: Total spend */}
            <div className="bg-white border border-neutral-200/60 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:border-neutral-300 hover:shadow-sm transition-all">
              <div className="space-y-1">
                <span className="text-[9.5px] uppercase font-bold text-neutral-400 tracking-wider block">Total Spend</span>
                <h3 className="text-xl font-extrabold text-neutral-800">₹{metrics.totalSpend.toLocaleString('en-IN')}</h3>
              </div>
              <p className="text-[9.5px] text-neutral-400 mt-2 font-semibold">Operational engine cost</p>
            </div>

            {/* Tile 4: People Scored */}
            <div className="bg-white border border-neutral-200/60 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:border-neutral-300 hover:shadow-sm transition-all">
              <div className="space-y-1">
                <span className="text-[9.5px] uppercase font-bold text-neutral-400 tracking-wider block">People Scored</span>
                <h3 className="text-xl font-extrabold text-neutral-800">{metrics.totalPeople.toLocaleString('en-IN')}</h3>
              </div>
              <p className="text-[9.5px] text-neutral-400 mt-2 font-semibold">Grand cohort analyzed</p>
            </div>

            {/* Tile 5: Actual vs. Target cost per qualified lead */}
            <div className="bg-white border border-neutral-200/60 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:border-neutral-300 hover:shadow-sm transition-all col-span-2 sm:col-span-1 lg:col-span-1">
              <div className="space-y-1">
                <span className="text-[9.5px] uppercase font-bold text-neutral-400 tracking-wider block">Actual vs. Target CPL</span>
                <div className="flex items-baseline gap-1 mr-1">
                  <h3 className="text-base font-extrabold text-neutral-800">₹{metrics.actualCPL}</h3>
                  <span className="text-[9.5px] text-neutral-400 font-semibold whitespace-nowrap">vs ₹{metrics.targetCPLAvg}</span>
                </div>
              </div>
              <div className="mt-2">
                <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-extrabold border inline-block ${
                  metrics.cplDiff > 0 
                    ? 'bg-rose-50 border-rose-200 text-rose-700' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}>
                  {metrics.cplOverUnderLabel}
                </span>
              </div>
            </div>

            {/* Tile 6: Campaigns within / outside target */}
            <div className="bg-white border border-neutral-200/60 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:border-neutral-300 hover:shadow-sm transition-all col-span-2 sm:col-span-1 lg:col-span-1">
              <div className="space-y-1">
                <span className="text-[9.5px] uppercase font-bold text-neutral-400 tracking-wider block">Target Audit</span>
                <h3 className="text-xs font-extrabold text-neutral-800 leading-tight">
                  <span className="text-emerald-700 font-bold">{metrics.withinCPLCount} within</span>
                  <span className="text-neutral-300 mx-1 font-normal">&bull;</span>
                  <span className="text-rose-700 font-bold">{metrics.outsideCPLCount} outside</span>
                </h3>
              </div>
              <p className="text-[9.5px] text-neutral-400 mt-2 font-semibold">Campaign cost alignment</p>
            </div>

          </div>

          {/* Charts & Status lists */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Donut 1: Qualification confidence Chart */}
            <div className="bg-white border border-neutral-200/60 rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-800 tracking-tight">Qualification Confidence Mix</h3>
                <p className="text-[10.5px] text-neutral-400 font-medium">Distribution of scoring results across the active period.</p>
              </div>

              {/* Graphic visualization */}
              <div className="flex items-center justify-center py-2 relative">
                <svg width="120" height="120" className="transform -rotate-90">
                  {/* High Confidence */}
                  <circle
                    cx="60"
                    cy="60"
                    r="44"
                    fill="transparent"
                    stroke="#1e40af"
                    strokeWidth="12"
                    strokeDasharray={`${2 * Math.PI * 44 * (metrics.confidenceMix.highPct / 100)} ${2 * Math.PI * 44 * (1 - metrics.confidenceMix.highPct / 100)}`}
                  />
                  {/* Medium Confidence */}
                  <circle
                    cx="60"
                    cy="60"
                    r="44"
                    fill="transparent"
                    stroke="#60a5fa"
                    strokeWidth="12"
                    strokeDasharray={`${2 * Math.PI * 44 * (metrics.confidenceMix.mediumPct / 100)} ${2 * Math.PI * 44 * (1 - metrics.confidenceMix.mediumPct / 100)}`}
                    strokeDashoffset={`-${2 * Math.PI * 44 * (metrics.confidenceMix.highPct / 100)}`}
                  />
                  {/* Low Confidence */}
                  <circle
                    cx="60"
                    cy="60"
                    r="44"
                    fill="transparent"
                    stroke="#bfdbfe"
                    strokeWidth="12"
                    strokeDasharray={`${2 * Math.PI * 44 * (metrics.confidenceMix.lowPct / 100)} ${2 * Math.PI * 44 * (1 - metrics.confidenceMix.lowPct / 100)}`}
                    strokeDashoffset={`-${2 * Math.PI * 44 * ((metrics.confidenceMix.highPct + metrics.confidenceMix.mediumPct) / 100)}`}
                  />
                </svg>

                {/* Inner label info */}
                <div className="absolute text-center">
                  <span className="text-[8px] font-bold text-neutral-400 block uppercase tracking-wider">Scored</span>
                  <strong className="text-xs font-black text-neutral-800">
                    {(metrics.confidenceMix.high + metrics.confidenceMix.medium + metrics.confidenceMix.low).toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>

              {/* Legend with drillthrough clicks */}
              <div className="grid grid-cols-3 gap-1.5 pt-3 border-t border-neutral-100 text-[10px] text-center font-bold">
                <button
                  onClick={() => {
                    if (campaigns[0]) {
                      setSelectedCampaignId(campaigns[0].id);
                      setResultsFilter('High');
                      setQualView('results');
                    }
                  }}
                  className="bg-neutral-50/50 hover:bg-neutral-50 border border-neutral-200/40 p-1.5 rounded-lg flex flex-col items-center cursor-pointer transition-all active:scale-95"
                >
                  <span className="w-2 h-2 rounded-full bg-[#1e40af] mb-0.5 block" />
                  <span className="text-neutral-500 text-[9px]">High</span>
                  <strong className="text-neutral-800 font-extrabold mt-0.5">{metrics.confidenceMix.highPct || 58}%</strong>
                </button>

                <button
                  onClick={() => {
                    if (campaigns[0]) {
                      setSelectedCampaignId(campaigns[0].id);
                      setResultsFilter('Medium');
                      setQualView('results');
                    }
                  }}
                  className="bg-neutral-50/50 hover:bg-neutral-50 border border-neutral-200/40 p-1.5 rounded-lg flex flex-col items-center cursor-pointer transition-all active:scale-95"
                >
                  <span className="w-2 h-2 rounded-full bg-[#60a5fa] mb-0.5 block" />
                  <span className="text-neutral-500 text-[9px]">Medium</span>
                  <strong className="text-neutral-800 font-extrabold mt-0.5">{metrics.confidenceMix.mediumPct || 28}%</strong>
                </button>

                <button
                  onClick={() => {
                    if (campaigns[0]) {
                      setSelectedCampaignId(campaigns[0].id);
                      setResultsFilter('Low');
                      setQualView('results');
                    }
                  }}
                  className="bg-neutral-50/50 hover:bg-neutral-50 border border-neutral-200/40 p-1.5 rounded-lg flex flex-col items-center cursor-pointer transition-all active:scale-95"
                >
                  <span className="w-2 h-2 rounded-full bg-[#bfdbfe] mb-0.5 block" />
                  <span className="text-neutral-500 text-[9px]">Low</span>
                  <strong className="text-neutral-800 font-extrabold mt-0.5">{metrics.confidenceMix.lowPct || 14}%</strong>
                </button>
              </div>
            </div>

            {/* Donut 2: Confidence mix by ticket-size range */}
            {(() => {
              const rUnder = metrics.rangeStats["Under ₹1L"].high || 400;
              const rMid = metrics.rangeStats["₹1L - ₹5L"].high || 650;
              const rAbove = metrics.rangeStats["Above ₹5L"].high || 550;
              const rTotal = rUnder + rMid + rAbove || 1;
              const rUnderPct = Math.round((rUnder / rTotal) * 100);
              const rMidPct = Math.round((rMid / rTotal) * 100);
              const rAbovePct = 100 - rUnderPct - rMidPct;

              return (
                <div className="bg-white border border-neutral-200/60 rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-800 tracking-tight">Confidence Mix by Ticket-Size</h3>
                    <p className="text-[10.5px] text-neutral-400 font-medium">High-confidence qualification spread by product price point.</p>
                  </div>

                  {/* Graphic visualization */}
                  <div className="flex items-center justify-center py-2 relative">
                    <svg width="120" height="120" className="transform -rotate-90">
                      {/* Under 1L */}
                      <circle
                        cx="60"
                        cy="60"
                        r="44"
                        fill="transparent"
                        stroke="#3b82f6"
                        strokeWidth="12"
                        strokeDasharray={`${2 * Math.PI * 44 * (rUnderPct / 100)} ${2 * Math.PI * 44 * (1 - rUnderPct / 100)}`}
                      />
                      {/* 1L - 5L */}
                      <circle
                        cx="60"
                        cy="60"
                        r="44"
                        fill="transparent"
                        stroke="#0ea5e9"
                        strokeWidth="12"
                        strokeDasharray={`${2 * Math.PI * 44 * (rMidPct / 100)} ${2 * Math.PI * 44 * (1 - rMidPct / 100)}`}
                        strokeDashoffset={`-${2 * Math.PI * 44 * (rUnderPct / 100)}`}
                      />
                      {/* Above 5L */}
                      <circle
                        cx="60"
                        cy="60"
                        r="44"
                        fill="transparent"
                        stroke="#10b981"
                        strokeWidth="12"
                        strokeDasharray={`${2 * Math.PI * 44 * (rAbovePct / 100)} ${2 * Math.PI * 44 * (1 - rAbovePct / 100)}`}
                        strokeDashoffset={`-${2 * Math.PI * 44 * ((rUnderPct + rMidPct) / 100)}`}
                      />
                    </svg>

                    {/* Inner label info */}
                    <div className="absolute text-center">
                      <span className="text-[8px] font-bold text-neutral-400 block uppercase tracking-wider">Premium</span>
                      <strong className="text-xs font-black text-[#10b981]">{rAbovePct}%</strong>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="grid grid-cols-3 gap-1.5 pt-3 border-t border-neutral-100 text-[10px] text-center font-bold">
                    <div className="bg-neutral-50/50 p-1.5 rounded-lg flex flex-col items-center">
                      <span className="w-2 h-2 rounded-full bg-[#3b82f6] mb-0.5 block" />
                      <span className="text-neutral-500 text-[8.5px] truncate max-w-full">&lt; ₹1L</span>
                      <strong className="text-neutral-800 font-extrabold mt-0.5">{rUnderPct}%</strong>
                    </div>
                    <div className="bg-neutral-50/50 p-1.5 rounded-lg flex flex-col items-center">
                      <span className="w-2 h-2 rounded-full bg-[#0ea5e9] mb-0.5 block" />
                      <span className="text-neutral-500 text-[8.5px] truncate max-w-full">₹1L - ₹5L</span>
                      <strong className="text-neutral-800 font-extrabold mt-0.5">{rMidPct}%</strong>
                    </div>
                    <div className="bg-neutral-50/50 p-1.5 rounded-lg flex flex-col items-center">
                      <span className="w-2 h-2 rounded-full bg-[#10b981] mb-0.5 block" />
                      <span className="text-neutral-500 text-[8.5px] truncate max-w-full">&gt; ₹5L</span>
                      <strong className="text-neutral-800 font-extrabold mt-0.5">{rAbovePct}%</strong>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Donut 3: Confidence mix by purchase channel */}
            {(() => {
              const cOnline = metrics.channelStats["Online"].high || 450;
              const cOffline = metrics.channelStats["Offline"].high || 600;
              const cBoth = metrics.channelStats["Both"].high || 550;
              const cTotal = cOnline + cOffline + cBoth || 1;
              const cOnlinePct = Math.round((cOnline / cTotal) * 100);
              const cOfflinePct = Math.round((cOffline / cTotal) * 100);
              const cBothPct = 100 - cOnlinePct - cOfflinePct;

              return (
                <div className="bg-white border border-neutral-200/60 rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-800 tracking-tight">Confidence Mix by Channel</h3>
                    <p className="text-[10.5px] text-neutral-400 font-medium">Scoring efficiency compared across distinct buying avenues.</p>
                  </div>

                  {/* Graphic visualization */}
                  <div className="flex items-center justify-center py-2 relative">
                    <svg width="120" height="120" className="transform -rotate-90">
                      {/* Online */}
                      <circle
                        cx="60"
                        cy="60"
                        r="44"
                        fill="transparent"
                        stroke="#6366f1"
                        strokeWidth="12"
                        strokeDasharray={`${2 * Math.PI * 44 * (cOnlinePct / 100)} ${2 * Math.PI * 44 * (1 - cOnlinePct / 100)}`}
                      />
                      {/* Offline */}
                      <circle
                        cx="60"
                        cy="60"
                        r="44"
                        fill="transparent"
                        stroke="#a855f7"
                        strokeWidth="12"
                        strokeDasharray={`${2 * Math.PI * 44 * (cOfflinePct / 100)} ${2 * Math.PI * 44 * (1 - cOfflinePct / 100)}`}
                        strokeDashoffset={`-${2 * Math.PI * 44 * (cOnlinePct / 100)}`}
                      />
                      {/* Both */}
                      <circle
                        cx="60"
                        cy="60"
                        r="44"
                        fill="transparent"
                        stroke="#ec4899"
                        strokeWidth="12"
                        strokeDasharray={`${2 * Math.PI * 44 * (cBothPct / 100)} ${2 * Math.PI * 44 * (1 - cBothPct / 100)}`}
                        strokeDashoffset={`-${2 * Math.PI * 44 * ((cOnlinePct + cOfflinePct) / 100)}`}
                      />
                    </svg>

                    {/* Inner label info */}
                    <div className="absolute text-center">
                      <span className="text-[8px] font-bold text-neutral-400 block uppercase tracking-wider">Digital</span>
                      <strong className="text-xs font-black text-[#6366f1]">{cOnlinePct}%</strong>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="grid grid-cols-3 gap-1.5 pt-3 border-t border-neutral-100 text-[10px] text-center font-bold">
                    <div className="bg-neutral-50/50 p-1.5 rounded-lg flex flex-col items-center">
                      <span className="w-2 h-2 rounded-full bg-[#6366f1] mb-0.5 block" />
                      <span className="text-neutral-500 text-[8.5px] truncate max-w-full">Online</span>
                      <strong className="text-neutral-800 font-extrabold mt-0.5">{cOnlinePct}%</strong>
                    </div>
                    <div className="bg-neutral-50/50 p-1.5 rounded-lg flex flex-col items-center">
                      <span className="w-2 h-2 rounded-full bg-[#a855f7] mb-0.5 block" />
                      <span className="text-neutral-500 text-[8.5px] truncate max-w-full">Offline</span>
                      <strong className="text-neutral-800 font-extrabold mt-0.5">{cOfflinePct}%</strong>
                    </div>
                    <div className="bg-neutral-50/50 p-1.5 rounded-lg flex flex-col items-center">
                      <span className="w-2 h-2 rounded-full bg-[#ec4899] mb-0.5 block" />
                      <span className="text-neutral-500 text-[8.5px] truncate max-w-full">Omni</span>
                      <strong className="text-neutral-800 font-extrabold mt-0.5">{cBothPct}%</strong>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Row 2, Col 1-2: Actual vs. Target CPL Trend SVG Line Chart */}
            <div className="bg-white border border-neutral-200/60 rounded-xl p-5 shadow-sm space-y-4 lg:col-span-2 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-neutral-800 tracking-tight">Actual vs. Target CPL Trend</h3>
                  <p className="text-[10.5px] text-neutral-400 font-medium">Cost to qualify per High-confidence lead against committed budget limit.</p>
                </div>
                {/* Legend */}
                <div className="flex items-center gap-3 text-[9px] font-bold text-neutral-500">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-0.5 bg-[#1e40af] block" />
                    <span>Actual CPL</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-0.5 border-t border-dashed border-rose-500 block" />
                    <span>Target CPL</span>
                  </div>
                </div>
              </div>

              {/* Line Chart Graphic */}
              <div className="relative pt-2 flex-1">
                <svg viewBox="0 0 600 170" className="w-full h-auto overflow-visible select-none">
                  {/* Grid Lines */}
                  {[0, 1, 2, 3].map((val) => (
                    <line
                      key={val}
                      x1="45"
                      y1="35 + val * 35"
                      x2="565"
                      y2="35 + val * 35"
                      stroke="#f3f4f6"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Y Axis Labels */}
                  <text x="35" y="38" textAnchor="end" className="text-[9px] font-bold fill-neutral-400">₹25</text>
                  <text x="35" y="73" textAnchor="end" className="text-[9px] font-bold fill-neutral-400">₹18</text>
                  <text x="35" y="108" textAnchor="end" className="text-[9px] font-bold fill-neutral-400">₹12</text>
                  <text x="35" y="143" textAnchor="end" className="text-[9px] font-bold fill-neutral-400">₹5</text>

                  {/* Shaded Area under Actual CPL */}
                  <path
                    d={`M ${cplTrendCoords[0].x} 145 ` + cplTrendCoords.map(pt => `L ${pt.x} ${pt.yActual}`).join(' ') + ` L ${cplTrendCoords[cplTrendCoords.length - 1].x} 145 Z`}
                    fill="url(#cplAreaGrad)"
                    className="opacity-20"
                  />
                  <defs>
                    <linearGradient id="cplAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Target Line (Dashed) */}
                  <path
                    d={cplTrendCoords.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.yTarget}`).join(' ')}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                  />

                  {/* Actual Line */}
                  <path
                    d={cplTrendCoords.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.yActual}`).join(' ')}
                    fill="none"
                    stroke="#1e40af"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Actual points */}
                  {cplTrendCoords.map((pt, idx) => (
                    <g key={idx} className="group cursor-pointer">
                      <circle
                        cx={pt.x}
                        cy={pt.yActual}
                        r="3.5"
                        className="fill-white stroke-[#1e40af] stroke-[2]"
                      />
                      <circle
                        cx={pt.x}
                        cy={pt.yActual}
                        r="8"
                        className="fill-transparent hover:fill-blue-600/10 transition-all"
                      />
                      {/* Tooltip on hover */}
                      <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <rect
                          x={pt.x - 35}
                          y={pt.yActual - 32}
                          width="70"
                          height="20"
                          rx="4"
                          fill="#1e293b"
                        />
                        <text
                          x={pt.x}
                          y={pt.yActual - 19}
                          textAnchor="middle"
                          className="text-[8.5px] font-black fill-white"
                        >
                          ₹{pt.actual.toFixed(1)} / CPL
                        </text>
                      </g>
                    </g>
                  ))}

                  {/* X Axis Labels */}
                  {cplTrendCoords.map((pt, idx) => (
                    <text
                      key={idx}
                      x={pt.x}
                      y="160"
                      textAnchor="middle"
                      className="text-[9px] font-bold fill-neutral-400"
                    >
                      {pt.label}
                    </text>
                  ))}
                </svg>
              </div>
            </div>

            {/* Col 3: Active & Queued Jobs */}
            <div className="bg-white border border-neutral-200/60 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral-800 tracking-tight">Active & Queued Jobs</h3>
                <p className="text-[10.5px] text-neutral-400 font-medium">Real-time status of lead processing engines.</p>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-[140px] pr-1 my-3">
                {campaigns.filter(c => c.status === 'Processing' || c.status === 'Queued').length > 0 ? (
                  campaigns.filter(c => c.status === 'Processing' || c.status === 'Queued').map((c) => (
                    <div key={c.id} className="p-2.5 bg-neutral-50 border border-neutral-100 rounded-lg space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-neutral-700 truncate max-w-[130px]">{c.name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-extrabold ${
                          c.status === 'Processing' ? 'bg-blue-50 text-blue-700 border border-blue-100 animate-pulse' : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                        }`}>
                          {c.status}
                        </span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-1">
                        <div 
                          className={`h-1 rounded-full ${c.status === 'Processing' ? 'bg-blue-600 animate-pulse' : 'bg-neutral-400'}`} 
                          style={{ width: c.status === 'Processing' ? '45%' : '0%' }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[8.5px] text-neutral-400 font-bold">
                        <span>{c.status === 'Processing' ? 'Scoring propensity...' : 'Queued in position 1'}</span>
                        <span>{c.status === 'Processing' ? '45%' : 'Pending'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-3 space-y-1.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                      <ShieldCheck size={16} />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-neutral-700 block">All Systems Optimal</span>
                      <span className="text-[9.5px] text-neutral-400 font-medium leading-tight">Execution queues idle. Ready for roster uploads.</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-[9.5px] font-bold text-neutral-400">
                <span className="flex items-center gap-1 text-[#1e40af]">
                  <RefreshCw size={10} className="animate-spin text-blue-500" />
                  <span>Real-time Monitoring Active</span>
                </span>
              </div>
            </div>

          </div>

          {/* Recent qualification campaigns */}
          <div className="bg-white border border-neutral-200/60 rounded-xl shadow-sm space-y-4 p-5.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral-800 tracking-tight">Active Qualification Campaigns</h3>
                <p className="text-[10.5px] text-neutral-400 font-medium mt-0.5">Scored rosters processed to client targets recently.</p>
              </div>

              <button
                onClick={() => setQualView('list')}
                className="text-blue-600 hover:text-blue-800 font-bold text-xs hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View all campaigns</span>
                <ChevronRight size={13} />
              </button>
            </div>

            {/* Table layout */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-100 text-neutral-400 font-bold text-[10px] uppercase tracking-wider select-none">
                    <th className="px-4 py-3">Campaign Name & ID</th>
                    <th className="px-4 py-3">RACE Fit Context</th>
                    <th className="px-4 py-3">Files Processed</th>
                    <th className="px-4 py-3">Cumulative Spend</th>
                    <th className="px-4 py-3">Actual / Target CPL</th>
                    <th className="px-4 py-3">Pacing Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredCampaignsByDate.map(camp => {
                    const cActual = camp.confidenceStats.high > 0 ? Math.round(camp.totalSpend / camp.confidenceStats.high) : 15;
                    const cTarget = camp.targetCostPerQualifiedLead ?? 15;
                    const isOnTarget = cActual <= cTarget;

                    return (
                      <tr 
                        key={camp.id} 
                        className="hover:bg-neutral-50/40 cursor-pointer transition-all"
                        onClick={() => handleViewCampaignDetails(camp)}
                      >
                        <td className="px-4 py-3">
                          <div className="space-y-0.5">
                            <span className="font-bold text-neutral-800 hover:text-blue-600 transition-colors block">
                              {camp.name}
                            </span>
                            <span className="text-[9.5px] font-mono text-neutral-400 font-bold uppercase">{camp.id} &bull; {camp.dateCreated}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="space-y-0.5 text-[11px]">
                            <span className="font-bold text-neutral-700">{camp.industry || "General"}</span>
                            <span className="text-[9.5px] text-neutral-400 font-medium block">
                              {camp.ticketSizeMin !== undefined ? (
                                <span>Ticket: ₹{camp.ticketSizeMin >= 100000 ? `${(camp.ticketSizeMin/100000).toFixed(0)}L` : camp.ticketSizeMin.toLocaleString('en-IN')} - ₹{camp.ticketSizeMax ? (camp.ticketSizeMax >= 100000 ? `${(camp.ticketSizeMax/100000).toFixed(0)}L` : camp.ticketSizeMax.toLocaleString('en-IN')) : 'Any'} &bull; {camp.purchaseCycle || "One-time"}</span>
                              ) : (
                                <span>Profile: {camp.capitalProfile || "Any"} &bull; {camp.targetRegion || "Any"}</span>
                              )}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3 font-bold text-neutral-600">
                          {camp.files?.length || camp.filesCount} file(s)
                        </td>

                        <td className="px-4 py-3 font-extrabold text-neutral-800">
                          ₹{camp.totalSpend.toLocaleString('en-IN')}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-baseline gap-1">
                            <span className={`font-extrabold ${isOnTarget ? 'text-emerald-700' : 'text-rose-700'}`}>₹{cActual}</span>
                            <span className="text-[10px] text-neutral-400 font-semibold">/ ₹{cTarget}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold border ${
                            isOnTarget 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                              : 'bg-rose-50 border-rose-200 text-rose-700'
                          }`}>
                            {isOnTarget ? 'On Target' : 'Over Budget'}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleViewCampaignDetails(camp)}
                            className="p-1.5 bg-neutral-50 border border-neutral-200 hover:bg-neutral-100 hover:text-blue-700 text-neutral-600 rounded-md transition-colors cursor-pointer text-[10px] font-bold flex items-center gap-1"
                            title="Manage Files & Attributes"
                          >
                            <Sliders size={11} />
                            <span>Manage</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedCampaignId(camp.id);
                              setResultsFilter('All');
                              setQualView('results');
                            }}
                            className="p-1.5 hover:bg-neutral-150 hover:text-neutral-900 text-neutral-500 rounded transition-colors cursor-pointer"
                            title="View results roster"
                          >
                            <Eye size={13} />
                          </button>
                          
                          <button
                            onClick={() => handleCloneCampaign(camp)}
                            className="p-1.5 hover:bg-blue-50 hover:text-blue-700 text-neutral-500 rounded transition-colors cursor-pointer"
                            title="Clone Campaign Configuration"
                          >
                            <Copy size={13} />
                          </button>

                          <button
                            onClick={(e) => deleteCampaign(camp.id, e)}
                            className="p-1.5 hover:bg-red-50 hover:text-red-600 text-neutral-400 rounded transition-colors cursor-pointer"
                            title="Delete campaign"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>

        </>
      )}

      {/* VIEW 2: CAMPAIGN BUILDER & ACTIVE MANAGEMENT PANEL */}
      {qualView === 'builder' && (
        <div className="space-y-6">
          {/* Header navigation section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-b border-neutral-200/50">
            <div className="flex items-center gap-2.5">
              <button 
                type="button"
                onClick={() => setQualView('dashboard')}
                className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <div>
                <h2 className="text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                  <span>{selectedCampaignId ? `Manage Campaign: ${campaignName}` : "Create Lead Qualification Campaign"}</span>
                  {selectedCampaignId && (
                    <span className="bg-neutral-100 text-neutral-700 border border-neutral-200 font-mono text-[9px] px-2.5 py-0.5 rounded-full uppercase font-bold">
                      ID: {selectedCampaignId}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5 font-medium">
                  Define business parameters to set fit context, map attributes, upload client rosters, and approve execution.
                </p>
              </div>
            </div>

            {/* Campaign Cloner at top if campaign already has runs and is locked */}
            {selectedCampaignId && campaigns.find(c => c.id === selectedCampaignId)?.hasRunFirstFile && (
              <button
                type="button"
                onClick={() => {
                  const activeC = campaigns.find(c => c.id === selectedCampaignId);
                  if (activeC) handleCloneCampaign(activeC);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-700 hover:bg-blue-100 active:scale-95 text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer"
              >
                <Copy size={12.5} />
                <span>Clone Campaign to Change Attributes</span>
              </button>
            )}
          </div>

          {isProcessingFile ? (
            /* Scoring execution progress log block */
            <div className="bg-white border border-neutral-200/60 rounded-xl p-8 shadow-sm space-y-6 max-w-2xl mx-auto text-center py-16">
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center bg-[#eff6ff] rounded-full border border-blue-100">
                <RefreshCw className="text-blue-600 animate-spin" size={32} />
                <span className="absolute text-xs font-black text-blue-800">{processingProgress}%</span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-neutral-800 tracking-tight">AI Scoring Engine Evaluating Roster...</h3>
                <p className="text-xs text-neutral-400 font-semibold max-w-md mx-auto">
                  Applying propensity criteria models to your roster. Validating exclusion criteria in the background.
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-md h-2 bg-neutral-150 rounded-full mx-auto overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>

              {/* Console live log terminal */}
              <div className="bg-neutral-950 text-emerald-400 font-mono text-[10.5px] text-left p-4.5 rounded-lg max-w-xl mx-auto h-48 overflow-y-auto space-y-2 select-text shadow-inner border border-neutral-800">
                {processingLogs.map((log, i) => (
                  <div key={i} className="leading-relaxed font-semibold break-all opacity-95">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Main Form layout split: Attributes vs. File execution & history */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Col 1: Campaign Configuration Attributes */}
              <div className="space-y-6 lg:col-span-1">
                <div className="bg-white border border-neutral-200/60 rounded-xl p-5 shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <h3 className="text-xs uppercase font-extrabold text-neutral-400 tracking-wider flex items-center gap-1.5">
                      <Briefcase size={13.5} />
                      <span>RACE Fit Configuration</span>
                    </h3>
                    {selectedCampaignId && campaigns.find(c => c.id === selectedCampaignId)?.hasRunFirstFile ? (
                      <span className="bg-amber-50 text-amber-800 border border-amber-100 font-extrabold text-[8.5px] px-2 py-0.5 rounded uppercase flex items-center gap-1">
                        <Clock size={10} />
                        <span>Locked (First file run)</span>
                      </span>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 font-extrabold text-[8.5px] px-2 py-0.5 rounded uppercase flex items-center gap-1">
                        <Check size={10} />
                        <span>Editable</span>
                      </span>
                    )}
                  </div>

                  {/* Attribute input fields */}
                  <div className="space-y-4">
                    
                    {/* Campaign Name */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-700 block">Campaign Name <strong className="text-red-500">*</strong></label>
                      <input 
                        type="text"
                        required
                        disabled={!!selectedCampaignId && !!campaigns.find(c => c.id === selectedCampaignId)?.hasRunFirstFile}
                        placeholder="e.g. West Coast Asset Allocation Cohort"
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none transition-all disabled:opacity-65 disabled:bg-neutral-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Target Product */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-700 block">Target Product Offering</label>
                      <select
                        disabled={!!selectedCampaignId && !!campaigns.find(c => c.id === selectedCampaignId)?.hasRunFirstFile}
                        value={targetProduct}
                        onChange={(e) => setTargetProduct(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none cursor-pointer disabled:opacity-65 disabled:bg-neutral-100 disabled:cursor-not-allowed"
                      >
                        <option value="Wealth Advisory">Wealth Advisory</option>
                        <option value="Mutual Funds">Mutual Funds</option>
                        <option value="Credit Cards">Premium Cards</option>
                        <option value="Insurance">High Value Insurance</option>
                        <option value="Legacy Trust">Legacy Trust Planning</option>
                      </select>
                    </div>

                    {/* Industry */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-700 block">Industry Fit Context</label>
                      <select
                        disabled={!!selectedCampaignId && !!campaigns.find(c => c.id === selectedCampaignId)?.hasRunFirstFile}
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none cursor-pointer disabled:opacity-65 disabled:bg-neutral-100 disabled:cursor-not-allowed"
                      >
                        <option value="Technology">Technology & Software</option>
                        <option value="Financial Services">Financial Services & Banking</option>
                        <option value="Healthcare">Healthcare & Bio-Pharma</option>
                        <option value="E-commerce & Retail">E-commerce & Consumer Retail</option>
                        <option value="Real Estate">Real Estate & Developers</option>
                        <option value="Manufacturing">Heavy Manufacturing</option>
                      </select>
                      <p className="text-[9.5px] text-neutral-400 font-medium">Determines sector multiplier index values in the RACE judge engine.</p>
                    </div>

                    {/* Ticket size of the product */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-700 block">Product Ticket Size (₹) <strong className="text-red-500">*</strong></label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold text-neutral-400 block uppercase">Min (₹)</span>
                          <input 
                            type="number"
                            min="0"
                            step="5000"
                            disabled={!!selectedCampaignId && !!campaigns.find(c => c.id === selectedCampaignId)?.hasRunFirstFile}
                            value={ticketSizeMin}
                            onChange={(e) => setTicketSizeMin(Math.max(0, Number(e.target.value)))}
                            className="w-full bg-neutral-50 border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none transition-all disabled:opacity-65 disabled:bg-neutral-100 disabled:cursor-not-allowed"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold text-neutral-400 block uppercase">Max (₹)</span>
                          <input 
                            type="number"
                            min="0"
                            step="5000"
                            disabled={!!selectedCampaignId && !!campaigns.find(c => c.id === selectedCampaignId)?.hasRunFirstFile}
                            value={ticketSizeMax}
                            onChange={(e) => setTicketSizeMax(Math.max(0, Number(e.target.value)))}
                            className="w-full bg-neutral-50 border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none transition-all disabled:opacity-65 disabled:bg-neutral-100 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                      <p className="text-[9.5px] text-neutral-400 font-medium leading-tight">
                        Range: {ticketSizeMin >= 100000 ? `₹${(ticketSizeMin/100000).toFixed(1)}L` : `₹${ticketSizeMin.toLocaleString('en-IN')}`} - {ticketSizeMax >= 100000 ? `₹${(ticketSizeMax/100000).toFixed(1)}L` : `₹${ticketSizeMax.toLocaleString('en-IN')}`}.
                      </p>
                    </div>

                    {/* Purchase Cycle */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-700 block">Purchase Cycle</label>
                      <select
                        disabled={!!selectedCampaignId && !!campaigns.find(c => c.id === selectedCampaignId)?.hasRunFirstFile}
                        value={purchaseCycle}
                        onChange={(e) => setPurchaseCycle(e.target.value as any)}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none cursor-pointer disabled:opacity-65 disabled:bg-neutral-100 disabled:cursor-not-allowed"
                      >
                        <option value="One-time">One-time Purchase</option>
                        <option value="Recurring subscription">Recurring Subscription</option>
                      </select>
                    </div>

                    {/* Purchase Channel */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-700 block">Purchase Channel</label>
                      <select
                        disabled={!!selectedCampaignId && !!campaigns.find(c => c.id === selectedCampaignId)?.hasRunFirstFile}
                        value={purchaseChannel}
                        onChange={(e) => setPurchaseChannel(e.target.value as any)}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none cursor-pointer disabled:opacity-65 disabled:bg-neutral-100 disabled:cursor-not-allowed"
                      >
                        <option value="Online">Online Only</option>
                        <option value="Offline">Offline Only</option>
                        <option value="Both">Both (Omnichannel)</option>
                      </select>
                    </div>

                    {/* Target cost per qualified lead */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-700 block">Target Cost per Qualified Lead (₹) <strong className="text-red-500">*</strong></label>
                      <input 
                        type="number"
                        min="1"
                        step="1"
                        required
                        disabled={!!selectedCampaignId && !!campaigns.find(c => c.id === selectedCampaignId)?.hasRunFirstFile}
                        value={targetCostPerQualifiedLead}
                        onChange={(e) => setTargetCostPerQualifiedLead(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-neutral-50 border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none transition-all disabled:opacity-65 disabled:bg-neutral-100 disabled:cursor-not-allowed"
                      />
                      <p className="text-[9.5px] text-neutral-400 font-medium">Committed limit for High-confidence operational cost-per-lead.</p>
                    </div>

                  </div>
                </div>

              </div>

              {/* Col 2 & 3: File execution workspace & history */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* File Upload execution Workspace */}
                <div className="bg-white border border-neutral-200/60 rounded-xl p-5 shadow-sm space-y-4">
                  <h3 className="text-xs uppercase font-extrabold text-neutral-400 tracking-wider flex items-center gap-1.5">
                    <UploadCloud size={14.5} />
                    <span>Upload & Execute Candidate Roster</span>
                  </h3>

                  {/* Drag drop area */}
                  <div 
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileDrop}
                    className="border-2 border-dashed border-neutral-200 hover:border-blue-500 hover:bg-blue-50/10 rounded-xl p-6 text-center transition-all cursor-pointer space-y-2.5"
                  >
                    <div className="w-10 h-10 bg-neutral-50 border border-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-400">
                      <UploadCloud size={18} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-neutral-700">Drag & drop client rosters here</p>
                      <p className="text-[10px] text-neutral-400 font-medium">Supports CSV, XLS, XLSX formats up to 20MB.</p>
                    </div>

                    <div className="flex justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={selectManualSample}
                        className="px-3.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 text-[10.5px] font-bold rounded-lg hover:bg-blue-100 transition-all cursor-pointer"
                      >
                        Simulate Sample CSV Upload
                      </button>
                    </div>
                  </div>

                  {/* Inline Validation Summary */}
                  {pendingFile && (
                    <div className="bg-neutral-50/50 border border-neutral-200/70 p-4.5 rounded-xl space-y-3.5">
                      <div className="flex items-center justify-between text-xs border-b border-neutral-200/50 pb-2.5">
                        <div className="flex items-center gap-2 font-bold text-neutral-800">
                          <FileText size={13} className="text-neutral-400" />
                          <span>{pendingFile.name}</span>
                          <span className="text-[10px] font-mono text-neutral-400">({pendingFile.size})</span>
                        </div>
                        <button 
                          onClick={() => setPendingFile(null)}
                          className="text-neutral-400 hover:text-red-600 transition-colors cursor-pointer font-bold text-[10px]"
                        >
                          Clear File
                        </button>
                      </div>

                      {/* Summary statistics grid */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 bg-white border border-neutral-200 rounded-lg text-center">
                          <span className="text-[9px] uppercase font-bold text-neutral-400 block">Total Cohort Rows</span>
                          <strong className="text-sm font-extrabold text-neutral-800">{(pendingFile.rowsAccepted + pendingFile.rowsSkipped).toLocaleString()}</strong>
                        </div>
                        <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg text-center">
                          <span className="text-[9px] uppercase font-bold text-emerald-600 block">Rows Accepted</span>
                          <strong className="text-sm font-extrabold text-emerald-800">{pendingFile.rowsAccepted.toLocaleString()}</strong>
                        </div>
                        <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-lg text-center">
                          <span className="text-[9px] uppercase font-bold text-amber-600 block">Rows Skipped</span>
                          <strong className="text-sm font-extrabold text-neutral-800">{pendingFile.rowsSkipped.toLocaleString()}</strong>
                        </div>
                      </div>

                      {/* Skip breakdown reasons */}
                      <div className="space-y-1.5 pt-1 bg-white border border-neutral-150 rounded-lg p-3">
                        <span className="text-[9.5px] font-bold text-neutral-400 uppercase tracking-wider block">Skipped Records Audit Breakdown:</span>
                        <div className="space-y-1">
                          {pendingFile.skipReasons.map((reason, rIdx) => (
                            <div key={rIdx} className="flex items-start justify-between text-[10.5px] font-semibold text-neutral-600">
                              <span className="flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 block shrink-0" />
                                <span className="leading-tight">{reason.reason}</span>
                              </span>
                              <span className="text-neutral-400 font-mono text-[9px] font-bold shrink-0">{reason.count} rows</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Cost metrics and checkbox confirmation */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1.5">
                        
                        {/* Cost estimate for this file */}
                        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-[9px] uppercase font-extrabold text-emerald-700 block">Cost Estimate (This File)</span>
                            <span className="text-[10px] text-neutral-400 font-medium">₹11.5 per evaluated record</span>
                          </div>
                          <strong className="text-base font-black text-emerald-800">₹{pendingFile.cost.toLocaleString('en-IN')}</strong>
                        </div>

                        {/* Running total across campaign */}
                        <div className="p-3 bg-neutral-100 border border-neutral-200 rounded-lg flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-[9px] uppercase font-extrabold text-neutral-600 block">Running Spend Total</span>
                            <span className="text-[10px] text-neutral-400 font-medium">All historical files in batch</span>
                          </div>
                          <strong className="text-base font-black text-neutral-800">₹{(totalSpendForCampaign + pendingFile.cost).toLocaleString('en-IN')}</strong>
                        </div>

                      </div>

                      {/* Consent Checkbox */}
                      <div className="p-3 bg-[#eff6ff]/50 border border-[#bfdbfe]/50 rounded-lg flex items-start gap-2.5">
                        <input 
                          type="checkbox"
                          id="consent_check"
                          checked={consentConfirmed}
                          onChange={(e) => setConsentConfirmed(e.target.checked)}
                          className="mt-0.5 h-3.5 w-3.5 text-[#1e40af] focus:ring-[#1e40af]/30 rounded border-neutral-300 cursor-pointer"
                        />
                        <label htmlFor="consent_check" className="text-[10.5px] font-bold text-neutral-700 leading-tight cursor-pointer select-none">
                          I confirm that this client contact cohort roster was explicitly collected under appropriate regulatory consent guidelines and satisfies compliance checklists.
                        </label>
                      </div>

                      {/* RUN BUTTON */}
                      <button
                        type="button"
                        onClick={handleRunFile}
                        disabled={!consentConfirmed || (incomeWeight + spendWeight + propensityWeight !== 100) || (!selectedCampaignId && !campaignName.trim())}
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs shadow-md transition-all ${
                          consentConfirmed && (incomeWeight + spendWeight + propensityWeight === 100) && (selectedCampaignId || campaignName.trim())
                            ? 'bg-[#1e40af] hover:bg-[#1d4ed8] text-white cursor-pointer active:scale-98'
                            : 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
                        }`}
                      >
                        <ShieldCheck size={14} />
                        <span>Run Lead Qualification (Approve & Execute File)</span>
                      </button>

                    </div>
                  )}

                </div>

                {/* historical files in this campaign */}
                {selectedCampaignId && (
                  <div className="bg-white border border-neutral-200/60 rounded-xl p-5 shadow-sm space-y-4">
                    <div>
                      <h3 className="text-xs uppercase font-extrabold text-neutral-400 tracking-wider">Historical Scored Files in this Campaign</h3>
                      <p className="text-[10.5px] text-neutral-400 font-medium">Audit logs of client rosters successfully scored under this campaign batch.</p>
                    </div>

                    <div className="space-y-3.5">
                      {campaigns.find(c => c.id === selectedCampaignId)?.files?.length ? (
                        campaigns.find(c => c.id === selectedCampaignId)?.files?.map(file => (
                          <div key={file.id} className="bg-neutral-50 border border-neutral-150 p-4 rounded-xl space-y-2.5">
                            <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                              <div className="flex items-center gap-2">
                                <FileText className="text-neutral-400" size={13} />
                                <span className="font-bold text-neutral-800 text-xs truncate max-w-[240px]">{file.fileName}</span>
                                <span className="text-[9.5px] text-neutral-400 font-mono">({file.fileSize})</span>
                              </div>
                              <span className="text-[9.5px] font-mono text-neutral-400 font-bold">{file.dateUploaded}</span>
                            </div>

                            <div className="grid grid-cols-4 gap-2 text-center text-xs">
                              <div className="p-2 bg-white rounded-lg border border-neutral-200">
                                <span className="text-[8.5px] text-neutral-400 block uppercase font-bold">File ID</span>
                                <strong className="text-[10.5px] text-neutral-700 font-bold font-mono">{file.id}</strong>
                              </div>
                              <div className="p-2 bg-emerald-50/40 rounded-lg border border-emerald-100">
                                <span className="text-[8.5px] text-emerald-600 block uppercase font-bold">Accepted</span>
                                <strong className="text-[10.5px] text-emerald-800 font-extrabold">{file.rowsAccepted.toLocaleString()}</strong>
                              </div>
                              <div className="p-2 bg-amber-50/40 rounded-lg border border-amber-100">
                                <span className="text-[8.5px] text-amber-600 block uppercase font-bold">Skipped</span>
                                <strong className="text-[10.5px] text-amber-800 font-extrabold">{file.rowsSkipped.toLocaleString()}</strong>
                              </div>
                              <div className="p-2 bg-neutral-100 rounded-lg border border-neutral-150">
                                <span className="text-[8.5px] text-neutral-500 block uppercase font-bold">File Cost</span>
                                <strong className="text-[10.5px] text-neutral-800 font-black">₹{file.cost.toLocaleString('en-IN')}</strong>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-neutral-400 font-medium text-xs space-y-1">
                          <p>No roster files have been run under this campaign yet.</p>
                          <p className="text-[10px] text-neutral-400">Upload and validate a candidate roster at the top to trigger your first run.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}

        </div>
      )}

      {/* VIEW 3: CAMPAIGN RESULTS LIST & DETAILED DRILLDOWN (QUALIFIED FEED) */}
      {qualView === 'results' && (() => {
        // Compute statistics at the selected level (based on recordsToFilter)
        const totalCount = recordsToFilter.length;
        const highCount = recordsToFilter.filter(r => r.confidence === 'High').length;
        const mediumCount = recordsToFilter.filter(r => r.confidence === 'Medium').length;
        const lowCount = recordsToFilter.filter(r => r.confidence === 'Low').length;
        
        const totalDiv = totalCount || 1;
        const highPct = Math.round((highCount / totalDiv) * 100);
        const mediumPct = Math.round((mediumCount / totalDiv) * 100);
        const lowPct = 100 - highPct - mediumPct;

        return (
          <div className="space-y-6">
            {/* Header navigation and controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-4 border-b border-neutral-200/50 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2.5">
                  <span>Qualified Feed</span>
                  <span className="bg-blue-50 text-[#1e40af] border border-blue-100 font-bold text-[9.5px] px-2.5 py-0.5 rounded-full uppercase">
                    Scored Rosters
                  </span>
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5 font-medium">
                  Unified client ledger of all validated, scored, and qualified customer contact profiles.
                </p>
              </div>

              <div className="flex items-center gap-2.5 self-start lg:self-center">
                {/* Export Button */}
                <button
                  type="button"
                  id="feed_export_btn"
                  onClick={handleExportQualifiedFeedCSV}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold bg-[#1e40af] hover:bg-[#1d4ed8] active:scale-95 text-white rounded-lg shadow-md transition-all cursor-pointer"
                >
                  <Download size={13} />
                  <span>Export {finalFilteredRecords.length} Filtered Results</span>
                </button>
              </div>
            </div>

            {/* Filters Dashboard Panel */}
            <div className="bg-white border border-neutral-200/60 p-5 rounded-xl shadow-sm space-y-4">
              <h3 className="text-[10px] uppercase font-extrabold text-neutral-400 tracking-wider">Feed Filter Matrix</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Campaign Selector */}
                <div className="space-y-1.5">
                  <label htmlFor="feed_campaign_filter" className="text-[10.5px] font-bold text-neutral-500 uppercase tracking-wider block">Campaign Context</label>
                  <select
                    id="feed_campaign_filter"
                    value={resultsCampaignId}
                    onChange={(e) => {
                      setResultsCampaignId(e.target.value);
                      setResultsFileId('All');
                    }}
                    className="w-full bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs rounded-lg px-3 py-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-[#1e40af]/20 cursor-pointer"
                  >
                    <option value="All">All Campaigns ({campaigns.length})</option>
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                    ))}
                  </select>
                </div>

                {/* File Upload Selector */}
                <div className="space-y-1.5">
                  <label htmlFor="feed_file_filter" className="text-[10.5px] font-bold text-neutral-500 uppercase tracking-wider block">Roster File Upload</label>
                  <select
                    id="feed_file_filter"
                    value={resultsFileId}
                    onChange={(e) => setResultsFileId(e.target.value)}
                    disabled={resultsCampaignId === 'All'}
                    className={`w-full bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs rounded-lg px-3 py-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-[#1e40af]/20 cursor-pointer ${
                      resultsCampaignId === 'All' ? 'opacity-50 cursor-not-allowed bg-neutral-100' : ''
                    }`}
                  >
                    <option value="All">All File Uploads</option>
                    {resultsCampaignId !== 'All' && campaigns.find(c => c.id === resultsCampaignId)?.files?.map(f => (
                      <option key={f.id} value={f.fileName}>{f.fileName}</option>
                    ))}
                  </select>
                </div>

                {/* Confidence Level Pill filters */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10.5px] font-bold text-neutral-500 uppercase tracking-wider block">Qualification Confidence Filter</label>
                  <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-lg">
                    {(['All', 'High', 'Medium', 'Low'] as const).map(conf => (
                      <button
                        key={conf}
                        type="button"
                        onClick={() => setResultsFilter(conf)}
                        className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                          resultsFilter === conf 
                            ? 'bg-white text-neutral-900 shadow-xs' 
                            : 'text-neutral-500 hover:text-neutral-800'
                        }`}
                      >
                        {conf} Confidence
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Confidence Mix Stat Tiles */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Total Scored */}
              <div className="bg-white border border-neutral-200/60 p-4 rounded-xl shadow-sm space-y-1">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">Total Scored Records</span>
                <h3 className="text-xl font-extrabold text-neutral-800">{totalCount.toLocaleString('en-IN')}</h3>
                <p className="text-[9px] text-neutral-400 font-semibold">Active at current filter level</p>
              </div>

              {/* High Confidence */}
              <div className="bg-white border border-neutral-200/60 p-4 rounded-xl shadow-sm space-y-1">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider text-emerald-600">High Confidence Matches</span>
                <h3 className="text-xl font-extrabold text-emerald-700">{highCount.toLocaleString('en-IN')}</h3>
                <p className="text-[9px] text-neutral-400 font-semibold">{highPct}% of selected context</p>
              </div>

              {/* Medium Confidence */}
              <div className="bg-white border border-neutral-200/60 p-4 rounded-xl shadow-sm space-y-1">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider text-blue-600">Medium Confidence Matches</span>
                <h3 className="text-xl font-extrabold text-blue-700">{mediumCount.toLocaleString('en-IN')}</h3>
                <p className="text-[9px] text-neutral-400 font-semibold">{mediumPct}% of selected context</p>
              </div>

              {/* Low Confidence */}
              <div className="bg-white border border-neutral-200/60 p-4 rounded-xl shadow-sm space-y-1">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider text-neutral-500">Low Confidence Matches</span>
                <h3 className="text-xl font-extrabold text-neutral-500">{lowCount.toLocaleString('en-IN')}</h3>
                <p className="text-[9px] text-neutral-400 font-semibold">{lowPct}% of selected context</p>
              </div>
            </div>

            {/* Results Table & Live search */}
            <div className="bg-white border border-neutral-200/60 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4.5 border-b border-neutral-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-neutral-800 text-xs">Scored Leads Ledger</h3>
                  <p className="text-[10px] text-neutral-400 font-medium">Click on any customer row below to slide open full contact card and analytical parameters.</p>
                </div>

                <div className="relative w-full md:w-72">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input 
                    type="text"
                    placeholder="Search by name, email, phone, file..."
                    value={resultsSearch}
                    onChange={(e) => setResultsSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 text-xs bg-neutral-50 focus:bg-white border border-neutral-200 rounded-lg text-neutral-800 placeholder-neutral-400 font-semibold focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Records table list */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-100 text-neutral-400 font-bold text-[10px] uppercase tracking-wider">
                      <th className="px-5 py-3">Lead Profile & ID</th>
                      <th className="px-5 py-3">Contact Information</th>
                      <th className="px-5 py-3">RACE Confidence Rating</th>
                      <th className="px-5 py-3">Source Roster File</th>
                      <th className="px-5 py-3">Uploaded By</th>
                      <th className="px-5 py-3">Date Processed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {finalFilteredRecords.length > 0 ? (
                      finalFilteredRecords.map(rec => (
                        <tr 
                          key={rec.id} 
                          onClick={() => setSelectedDetailPerson(rec)}
                          className="hover:bg-blue-50/20 active:bg-blue-50/40 transition-all cursor-pointer"
                        >
                          {/* Profile ID & Name */}
                          <td className="px-5 py-3.5">
                            <div className="space-y-0.5">
                              <strong className="text-neutral-800 block text-xs">{rec.name}</strong>
                              <span className="text-[9.5px] text-neutral-400 font-mono block">{rec.id}</span>
                            </div>
                          </td>

                          {/* Contact Details Stack */}
                          <td className="px-5 py-3.5">
                            <div className="space-y-0.5 text-neutral-600 font-semibold text-[11px]">
                              <div>{rec.email}</div>
                              <div className="text-neutral-400 text-[10px]">{rec.phone}</div>
                            </div>
                          </td>

                          {/* Confidence Rating */}
                          <td className="px-5 py-3.5">
                            <div className="space-y-1">
                              <span className={`inline-flex items-center gap-1 font-bold text-[9px] px-2 py-0.5 rounded-full border ${
                                rec.confidence === 'High' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                rec.confidence === 'Medium' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                'bg-neutral-100 text-neutral-600 border-neutral-200'
                              } uppercase`}>
                                {rec.confidence} Match
                              </span>
                              <div className="text-[9px] font-bold text-neutral-400 font-mono">
                                Score: {rec.propensityScore}%
                              </div>
                            </div>
                          </td>

                          {/* Source File and Campaign Info */}
                          <td className="px-5 py-3.5 text-neutral-600">
                            <div className="space-y-0.5">
                              <span className="font-bold text-xs flex items-center gap-1">
                                <FileText size={11} className="text-neutral-400" />
                                {rec.sourceFile || "N/A"}
                              </span>
                              <span className="text-[9.5px] font-mono text-neutral-400 block tracking-tight">
                                {rec.campaignName || "General"}
                              </span>
                            </div>
                          </td>

                          {/* Uploaded By */}
                          <td className="px-5 py-3.5 text-neutral-500 font-semibold font-mono">
                            {rec.uploadedBy || "Sidhartha R."}
                          </td>

                          {/* Date Processed */}
                          <td className="px-5 py-3.5 text-neutral-500 font-semibold font-mono">
                            {rec.dateProcessed || "N/A"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-16 text-neutral-400 font-medium">
                          No scored records match your active search filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Plain Text Footnote - Compliance / Data Deletion */}
            <div className="text-center py-6 border-t border-neutral-200/50 mt-6">
              <p className="text-[10px] text-neutral-400 font-medium leading-relaxed max-w-3xl mx-auto">
                Zenith Client Data Policy: Under local regulatory guidelines (including DPDPA 2023), client roster candidates reserve the right to request deletion or modification of scored contact records. To request an audit or purge of any candidate record, please submit your request to our compliance cell at <span className="font-semibold text-neutral-500">compliance@zenithbank.co.in</span>. Deletion requests are fulfilled within 48 business hours of verification.
              </p>
            </div>

            {/* Slide-out Person Detail Drawer */}
            {selectedDetailPerson && (
              <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
                {/* Backdrop overlay */}
                <div 
                  className="absolute inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity duration-300"
                  onClick={() => setSelectedDetailPerson(null)}
                />

                <div className="absolute inset-y-0 right-0 max-w-full pl-10 flex">
                  <div className="w-screen max-w-md bg-white border-l border-neutral-200 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-250">
                    
                    {/* Header Block */}
                    <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                      <div>
                        <span className="text-[9.5px] uppercase font-bold text-[#1e40af] tracking-widest font-mono">Lead Detail Profile</span>
                        <h3 className="text-base font-bold text-neutral-900 mt-1">{selectedDetailPerson.name}</h3>
                        <p className="text-[10px] text-neutral-400 font-mono mt-0.5">{selectedDetailPerson.id}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedDetailPerson(null)}
                        className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-neutral-800 transition-colors cursor-pointer"
                      >
                        <ChevronLeft size={16} className="rotate-180" />
                      </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      
                      {/* Section: Contact Coordinates */}
                      <div className="space-y-3">
                        <h4 className="text-[10.5px] uppercase font-bold text-neutral-400 tracking-wider">Contact Coordinates</h4>
                        <div className="bg-neutral-50 border border-neutral-150 rounded-xl p-4 space-y-3.5">
                          <div>
                            <span className="text-[9.5px] text-neutral-400 uppercase font-bold block">Full Email Address</span>
                            <span className="text-xs text-neutral-800 font-bold select-all break-all">{selectedDetailPerson.email}</span>
                          </div>
                          <div>
                            <span className="text-[9.5px] text-neutral-400 uppercase font-bold block">Mobile Phone Number</span>
                            <span className="text-xs text-neutral-800 font-bold select-all font-mono">{selectedDetailPerson.phone}</span>
                          </div>
                          <div>
                            <span className="text-[9.5px] text-neutral-400 uppercase font-bold block">Primary Registered City</span>
                            <span className="text-xs text-neutral-800 font-bold">{selectedDetailPerson.city}</span>
                          </div>
                        </div>
                      </div>

                      {/* Section: Scoring Metrics */}
                      <div className="space-y-3">
                        <h4 className="text-[10.5px] uppercase font-bold text-neutral-400 tracking-wider">Scoring Analytical Profile</h4>
                        <div className="bg-neutral-50 border border-neutral-150 rounded-xl p-4 space-y-3.5">
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-[9.5px] text-neutral-400 uppercase font-bold block">Net Worth Target</span>
                              <span className="text-xs text-neutral-800 font-bold">{selectedDetailPerson.netWorth}</span>
                            </div>
                            <div>
                              <span className="text-[9.5px] text-neutral-400 uppercase font-bold block">RACE Spend Index</span>
                              <span className="text-xs text-neutral-800 font-bold">{selectedDetailPerson.spendScore}/100</span>
                            </div>
                          </div>

                          <div className="border-t border-neutral-200/60 pt-3 space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-[9.5px] text-neutral-400 uppercase font-bold">AI Propensity Score</span>
                              <strong className="text-neutral-800 font-extrabold">{selectedDetailPerson.propensityScore}%</strong>
                            </div>
                            <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-[#1e40af] h-full rounded-full transition-all duration-500" 
                                style={{ width: `${selectedDetailPerson.propensityScore}%` }} 
                              />
                            </div>
                          </div>

                          <div className="border-t border-neutral-200/60 pt-3 grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-[9.5px] text-neutral-400 uppercase font-bold block">Exclusion Rule Applied</span>
                              {selectedDetailPerson.exclusionApplied === 'None' ? (
                                <span className="inline-flex items-center gap-1 font-bold text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded uppercase mt-0.5">Passed</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 font-bold text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded uppercase mt-0.5 max-w-full truncate">{selectedDetailPerson.exclusionApplied}</span>
                              )}
                            </div>
                            <div>
                              <span className="text-[9.5px] text-neutral-400 uppercase font-bold block">Decision Status</span>
                              <span className={`inline-flex items-center gap-1 font-bold text-[9px] px-2 py-0.5 rounded uppercase mt-0.5 border ${
                                selectedDetailPerson.status === 'Eligible' ? 'bg-emerald-50 text-emerald-800 border-emerald-200/50' :
                                selectedDetailPerson.status === 'Borderline' ? 'bg-amber-50 text-amber-800 border-amber-200/50' :
                                'bg-red-50 text-red-800 border-red-200/40'
                              }`}>
                                {selectedDetailPerson.status}
                              </span>
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* Section: Sourcing & Operations Context */}
                      <div className="space-y-3">
                        <h4 className="text-[10.5px] uppercase font-bold text-neutral-400 tracking-wider">Operations & Campaign Context</h4>
                        <div className="bg-neutral-50 border border-neutral-150 rounded-xl p-4 space-y-3.5">
                          <div>
                            <span className="text-[9.5px] text-neutral-400 uppercase font-bold block">Campaign Assignment</span>
                            <span className="text-xs text-neutral-800 font-bold">{selectedDetailPerson.campaignName}</span>
                            <span className="text-[9.5px] font-mono text-neutral-400 block mt-0.5">({selectedDetailPerson.campaignId})</span>
                          </div>
                          <div>
                            <span className="text-[9.5px] text-neutral-400 uppercase font-bold block">Candidate Roster File</span>
                            <span className="text-xs text-neutral-800 font-bold flex items-center gap-1 mt-0.5">
                              <FileText size={11} className="text-neutral-400" />
                              {selectedDetailPerson.sourceFile || "N/A"}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 border-t border-neutral-200/60 pt-3">
                            <div>
                              <span className="text-[9.5px] text-neutral-400 uppercase font-bold block">Operator Scored</span>
                              <span className="text-xs text-neutral-800 font-bold">{selectedDetailPerson.uploadedBy}</span>
                            </div>
                            <div>
                              <span className="text-[9.5px] text-neutral-400 uppercase font-bold block">Processed Timestamp</span>
                              <span className="text-xs text-neutral-800 font-bold">{selectedDetailPerson.dateProcessed}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Footer Block */}
                    <div className="p-6 bg-neutral-50 border-t border-neutral-100 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedDetailPerson(null)}
                        className="w-full py-2 px-4 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-xs text-neutral-600 font-bold transition-all text-center cursor-pointer"
                      >
                        Dismiss Details
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            )}

          </div>
        );
      })()}

      {/* VIEW 4: ALL CAMPAIGNS LIST & CAMPAIGN MANAGEMENT SECTION */}
      {(qualView === 'list' || qualView === 'management') && (() => {
        // Calculate interactive rolled up status
        const getCampaignStatus = (camp: QualCampaign): 'Draft' | 'Processing' | 'Complete' | 'Partial failure' | 'Failed' => {
          if (camp.status === 'Failed' || (camp.files && camp.files.some(f => f.status as string === 'Failed'))) {
            return 'Failed';
          }
          if (!camp.files || camp.files.length === 0) {
            return 'Draft';
          }
          if (camp.files.some(f => f.status === 'Processing')) {
            return 'Processing';
          }
          if (camp.files.some(f => f.rowsSkipped > 20)) {
            return 'Partial failure';
          }
          return 'Complete';
        };

        // Aggregates for campaign run counters
        const campaignsRunCount = campaigns.filter(c => !c.isArchived).length;
        const totalFilesCount = campaigns.filter(c => !c.isArchived).reduce((acc, c) => acc + (c.files?.length || 0), 0);
        const totalSpendRunning = campaigns.filter(c => !c.isArchived).reduce((acc, c) => acc + c.totalSpend, 0);
        const totalPeopleScoredCount = campaigns.filter(c => !c.isArchived).reduce((acc, c) => acc + c.peopleScored, 0);

        // Sorting toggles
        const toggleSort = (col: typeof managementSortBy) => {
          if (managementSortBy === col) {
            setManagementSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
          } else {
            setManagementSortBy(col);
            setManagementSortOrder('desc');
          }
        };

        const getCampaignTargetCPL = (camp: QualCampaign): number => {
          if (camp.targetCostPerQualifiedLead !== undefined) return camp.targetCostPerQualifiedLead;
          switch(camp.id) {
            case 'QUAL-101': return 15;
            case 'QUAL-102': return 25;
            case 'QUAL-103': return 20;
            case 'QUAL-104': return 18;
            case 'QUAL-106': return 22;
            case 'QUAL-107': return 75;
            case 'QUAL-109': return 25;
            default: return 15;
          }
        };

        const getCampaignTicketSize = (camp: QualCampaign) => {
          const min = camp.ticketSizeMin !== undefined ? camp.ticketSizeMin : (camp.id === 'QUAL-102' ? 500000 : (camp.id === 'QUAL-101' ? 100000 : 25000));
          const max = camp.ticketSizeMax !== undefined ? camp.ticketSizeMax : (camp.id === 'QUAL-102' ? 2500000 : (camp.id === 'QUAL-101' ? 500000 : 150000));
          return { min, max };
        };

        const getCampaignPurchaseChannel = (camp: QualCampaign): string => {
          return camp.purchaseChannel || (camp.id === 'QUAL-101' ? 'Online' : (camp.id === 'QUAL-102' ? 'Offline' : 'Both'));
        };

        const getCampaignPurchaseCycle = (camp: QualCampaign): string => {
          return camp.purchaseCycle || (camp.id === 'QUAL-101' ? 'One-time' : (camp.id === 'QUAL-102' ? 'Recurring subscription' : 'One-time'));
        };

        // Filter and sort campaigns
        const filteredCampaigns = campaigns.filter(camp => {
          // Archive check
          if (showArchived) {
            if (!camp.isArchived) return false;
          } else {
            if (camp.isArchived) return false;
          }

          // Search check
          if (managementSearch && !camp.name.toLowerCase().includes(managementSearch.toLowerCase())) {
            return false;
          }

          // Status check
          if (managementStatus !== 'All') {
            const status = getCampaignStatus(camp);
            if (status !== managementStatus) return false;
          }

          // Ticket size check
          if (managementTicketSize !== 'All') {
            const { min, max } = getCampaignTicketSize(camp);
            if (managementTicketSize === 'Under 50k' && max > 50000) return false;
            if (managementTicketSize === '50k - 2L' && (min < 50000 || max > 200000)) return false;
            if (managementTicketSize === 'Above 2L' && min < 200000) return false;
          }

          // Purchase Channel check
          if (managementPurchaseChannel !== 'All') {
            const channel = getCampaignPurchaseChannel(camp);
            if (channel !== managementPurchaseChannel) return false;
          }

          // Date check
          if (managementDate !== 'All time') {
            const createdDate = new Date(camp.dateCreated);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - createdDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (managementDate === 'Last 7 days' && diffDays > 7) return false;
            if (managementDate === 'Last 30 days' && diffDays > 30) return false;
            if (managementDate === 'Last 90 days' && diffDays > 90) return false;
          }

          return true;
        });

        const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
          let valA: any = a[managementSortBy as keyof QualCampaign];
          let valB: any = b[managementSortBy as keyof QualCampaign];

          if (managementSortBy === 'status') {
            valA = getCampaignStatus(a);
            valB = getCampaignStatus(b);
          } else if (managementSortBy === 'filesCount') {
            valA = a.files?.length || 0;
            valB = b.files?.length || 0;
          }

          if (valA === undefined) return 1;
          if (valB === undefined) return -1;

          if (typeof valA === 'string') {
            return managementSortOrder === 'asc' 
              ? valA.localeCompare(valB) 
              : valB.localeCompare(valA);
          } else {
            return managementSortOrder === 'asc' 
              ? valA - valB 
              : valB - valA;
          }
        });

        const drawerCampaign = campaigns.find(c => c.id === detailDrawerCampaignId);

        return (
          <div className="space-y-6 relative">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-b border-neutral-200/50">
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => setQualView('dashboard')}
                  className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 tracking-tight font-sans">
                    Campaign Management
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5 font-medium">
                    Manage qualification campaigns, audit active attributes, track processed roster files, and review results.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    if (confirm("Restore default high-fidelity demo campaigns with full file history and status states?")) {
                      localStorage.setItem('zenith_qual_campaigns', JSON.stringify(INITIAL_QUAL_CAMPAIGNS));
                      setCampaigns(INITIAL_QUAL_CAMPAIGNS);
                      showToast("Restored high-fidelity demo campaigns successfully!", "success");
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-lg transition-all cursor-pointer"
                  title="Force restore high-fidelity pre-seeded data"
                >
                  <RefreshCw size={11} className="text-neutral-500" />
                  <span>Reset Demo Data</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedCampaignId(null);
                    setCampaignName('');
                    setPendingFile(null);
                    setConsentConfirmed(false);
                    setQualView('builder');
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#1e40af] hover:bg-[#1d4ed8] active:scale-95 text-white rounded-lg shadow-md transition-all cursor-pointer"
                >
                  <PlusCircle size={14} />
                  <span>New Campaign</span>
                </button>
              </div>
            </div>

            {/* Toast inline alert for campaign events */}
            {managementToast && (
              <div className={`p-3 rounded-lg text-xs font-bold flex items-center gap-2 border shadow-sm transition-all animate-fadeIn ${
                managementToast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                managementToast.type === 'info' ? 'bg-blue-50 text-blue-800 border-blue-100' :
                'bg-rose-50 text-rose-800 border-rose-100'
              }`}>
                <Info size={14} />
                <span>{managementToast.message}</span>
              </div>
            )}

            {/* 4 Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-neutral-200/60 p-4.5 rounded-xl shadow-xs space-y-1">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">Campaigns Run</span>
                  <div className="p-1.5 bg-neutral-50 rounded text-neutral-500">
                    <Briefcase size={14} />
                  </div>
                </div>
                <h3 className="text-xl font-extrabold text-neutral-800">{campaignsRunCount}</h3>
                <p className="text-[9.5px] text-neutral-400 font-semibold">Total configured profiles</p>
              </div>

              <div className="bg-white border border-neutral-200/60 p-4.5 rounded-xl shadow-xs space-y-1">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">Files Processed</span>
                  <div className="p-1.5 bg-neutral-50 rounded text-neutral-500">
                    <FileText size={14} />
                  </div>
                </div>
                <h3 className="text-xl font-extrabold text-neutral-800">{totalFilesCount}</h3>
                <p className="text-[9.5px] text-neutral-400 font-semibold">Rosters scored to date</p>
              </div>

              <div className="bg-white border border-neutral-200/60 p-4.5 rounded-xl shadow-xs space-y-1">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider text-emerald-600">Total spend</span>
                  <div className="p-1.5 bg-emerald-50/50 rounded text-emerald-600">
                    <DollarSign size={14} />
                  </div>
                </div>
                <h3 className="text-xl font-extrabold text-emerald-800 font-black">₹{totalSpendRunning.toLocaleString('en-IN')}</h3>
                <p className="text-[9.5px] text-neutral-400 font-semibold">Across the whole module</p>
              </div>

              <div className="bg-white border border-neutral-200/60 p-4.5 rounded-xl shadow-xs space-y-1">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider text-blue-600">People Scored</span>
                  <div className="p-1.5 bg-blue-50/50 rounded text-blue-600">
                    <Users size={14} />
                  </div>
                </div>
                <h3 className="text-xl font-extrabold text-blue-800">{totalPeopleScoredCount.toLocaleString('en-IN')}</h3>
                <p className="text-[9.5px] text-neutral-400 font-semibold">Qualified lead candidates</p>
              </div>
            </div>

            {/* Search & Filter controls */}
            <div className="bg-white border border-neutral-200/60 rounded-xl p-4.5 shadow-sm space-y-4">
              <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
                
                {/* Search query */}
                <div className="relative flex-1 max-w-md">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search campaigns by name..."
                    value={managementSearch}
                    onChange={(e) => setManagementSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs bg-neutral-50 focus:bg-white border border-neutral-200 rounded-lg text-neutral-800 placeholder-neutral-400 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* Filters right side */}
                <div className="flex flex-wrap items-center gap-3">
                  
                  {/* Status dropdown/selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10.5px] font-bold text-neutral-400 uppercase tracking-tight">Status</span>
                    <select
                      value={managementStatus}
                      onChange={(e) => setManagementStatus(e.target.value as any)}
                      className="bg-neutral-50 border border-neutral-200 text-neutral-700 font-bold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Draft">Draft</option>
                      <option value="Processing">Processing</option>
                      <option value="Complete">Complete</option>
                      <option value="Partial failure">Partial failure</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>

                  {/* Ticket Size Filter */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10.5px] font-bold text-neutral-400 uppercase tracking-tight">Ticket</span>
                    <select
                      value={managementTicketSize}
                      onChange={(e) => setManagementTicketSize(e.target.value as any)}
                      className="bg-neutral-50 border border-neutral-200 text-neutral-700 font-bold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
                    >
                      <option value="All">All Ticket Sizes</option>
                      <option value="Under 50k">Under ₹50k</option>
                      <option value="50k - 2L">₹50k - ₹2L</option>
                      <option value="Above 2L">Above ₹2L</option>
                    </select>
                  </div>

                  {/* Purchase Channel Filter */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10.5px] font-bold text-neutral-400 uppercase tracking-tight">Channel</span>
                    <select
                      value={managementPurchaseChannel}
                      onChange={(e) => setManagementPurchaseChannel(e.target.value as any)}
                      className="bg-neutral-50 border border-neutral-200 text-neutral-700 font-bold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
                    >
                      <option value="All">All Channels</option>
                      <option value="Online">Online</option>
                      <option value="Offline">Offline</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>

                  {/* Date range dropdown/selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10.5px] font-bold text-neutral-400 uppercase tracking-tight">Created</span>
                    <select
                      value={managementDate}
                      onChange={(e) => setManagementDate(e.target.value as any)}
                      className="bg-neutral-50 border border-neutral-200 text-neutral-700 font-bold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
                    >
                      <option value="All time">All Time</option>
                      <option value="Last 7 days">Last 7 Days</option>
                      <option value="Last 30 days">Last 30 Days</option>
                      <option value="Last 90 days">Last 90 Days</option>
                    </select>
                  </div>

                  {/* Toggle Archived Checkbox */}
                  <label className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 cursor-pointer text-xs font-semibold text-neutral-600 select-none hover:bg-neutral-100/60 transition-colors">
                    <input
                      type="checkbox"
                      checked={showArchived}
                      onChange={(e) => setShowArchived(e.target.checked)}
                      className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                    <span>Show Archived</span>
                  </label>

                </div>

              </div>
            </div>

            {/* Campaign Table Directory */}
            <div className="bg-white border border-neutral-200/60 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-50/75 border-b border-neutral-150 text-neutral-400 font-bold text-[10px] uppercase tracking-wider select-none">
                      <th className="px-5 py-3.5 cursor-pointer hover:bg-neutral-100/50 hover:text-neutral-700 transition-colors" onClick={() => toggleSort('name')}>
                        <div className="flex items-center gap-1.5">
                          <span>Campaign Name & ID</span>
                          {managementSortBy === 'name' && (
                            <span className="text-blue-600 font-black">{managementSortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="px-5 py-3.5 cursor-pointer hover:bg-neutral-100/50 hover:text-neutral-700 transition-colors" onClick={() => toggleSort('status')}>
                        <div className="flex items-center gap-1.5">
                          <span>Status</span>
                          {managementSortBy === 'status' && (
                            <span className="text-blue-600 font-black">{managementSortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="px-5 py-3.5 cursor-pointer hover:bg-neutral-100/50 hover:text-neutral-700 transition-colors" onClick={() => toggleSort('filesCount')}>
                        <div className="flex items-center gap-1.5">
                          <span>Files Run</span>
                          {managementSortBy === 'filesCount' && (
                            <span className="text-blue-600 font-black">{managementSortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="px-5 py-3.5 cursor-pointer hover:bg-neutral-100/50 hover:text-neutral-700 transition-colors" onClick={() => toggleSort('peopleScored')}>
                        <div className="flex items-center gap-1.5">
                          <span>People Scored</span>
                          {managementSortBy === 'peopleScored' && (
                            <span className="text-blue-600 font-black">{managementSortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="px-5 py-3.5">
                        <span>Ticket Size Range</span>
                      </th>
                      <th className="px-5 py-3.5 cursor-pointer hover:bg-neutral-100/50 hover:text-neutral-700 transition-colors" onClick={() => toggleSort('totalSpend')}>
                        <div className="flex items-center gap-1.5">
                          <span>Spend</span>
                          {managementSortBy === 'totalSpend' && (
                            <span className="text-blue-600 font-black">{managementSortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="px-5 py-3.5">
                        <span>Qual. Cost</span>
                      </th>
                      <th className="px-5 py-3.5">
                        <span>Cost Target</span>
                      </th>
                      <th className="px-5 py-3.5 min-w-[160px]">
                        <span>Pacing Status</span>
                      </th>
                      <th className="px-5 py-3.5 cursor-pointer hover:bg-neutral-100/50 hover:text-neutral-700 transition-colors" onClick={() => toggleSort('uploadedBy')}>
                        <div className="flex items-center gap-1.5">
                          <span>Uploaded By</span>
                          {managementSortBy === 'uploadedBy' && (
                            <span className="text-blue-600 font-black">{managementSortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="px-5 py-3.5 cursor-pointer hover:bg-neutral-100/50 hover:text-neutral-700 transition-colors" onClick={() => toggleSort('dateCreated')}>
                        <div className="flex items-center gap-1.5">
                          <span>Last Updated</span>
                          {managementSortBy === 'dateCreated' && (
                            <span className="text-blue-600 font-black">{managementSortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="px-5 py-3.5 text-right font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {sortedCampaigns.length > 0 ? (
                       sortedCampaigns.map(camp => {
                         const status = getCampaignStatus(camp);
                         
                         // Metric calculations with default fallbacks
                         const cActual = camp.confidenceStats.high > 0 ? Math.round(camp.totalSpend / camp.confidenceStats.high) : 15;
                         const cTarget = getCampaignTargetCPL(camp);
                         const { min, max } = getCampaignTicketSize(camp);
                         const isOnTarget = cActual <= cTarget;

                         const pacingPct = cTarget > 0 ? Math.min(100, Math.round((cActual / cTarget) * 100)) : 0;
                         let barColor = 'bg-emerald-500';
                         let textColor = 'text-emerald-700';
                         let bgBadge = 'bg-emerald-50 border-emerald-200/60';
                         let statusText = 'Within Target';

                         if (cActual > cTarget * 1.15) {
                           barColor = 'bg-rose-500 animate-pulse';
                           textColor = 'text-rose-700';
                           bgBadge = 'bg-rose-50 border-rose-200/60';
                           statusText = 'Target Exceeded';
                         } else if (cActual > cTarget) {
                           barColor = 'bg-amber-500';
                           textColor = 'text-amber-700';
                           bgBadge = 'bg-amber-50 border-amber-200/60';
                           statusText = 'At Risk';
                         }

                         return (
                           <tr
                             key={camp.id}
                             className="hover:bg-neutral-50/50 cursor-pointer transition-colors animate-fadeIn"
                             onClick={() => setDetailDrawerCampaignId(camp.id)}
                           >
                             {/* Campaign Name */}
                             <td className="px-5 py-4">
                               <div className="space-y-0.5">
                                 <span className="font-bold text-neutral-800 hover:text-blue-600 transition-colors block text-xs">
                                   {camp.name}
                                 </span>
                                 <span className="text-[9.5px] font-mono text-neutral-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                   <span>{camp.id}</span>
                                   <span>&bull;</span>
                                   <span>{camp.targetProduct}</span>
                                 </span>
                               </div>
                             </td>
 
                             {/* Status rolled up Badge */}
                             <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                               <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-extrabold uppercase ${
                                 status === 'Draft' ? 'bg-neutral-50 text-neutral-600 border-neutral-200' :
                                 status === 'Processing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                 status === 'Partial failure' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                 status === 'Failed' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                 'bg-emerald-50 text-emerald-700 border-emerald-200'
                               }`}>
                                 {status === 'Processing' && (
                                   <RefreshCw size={10} className="animate-spin text-blue-600" />
                                 )}
                                 <span>{status === 'Complete' ? 'Completed' : status}</span>
                               </span>
                             </td>
 
                             {/* Files Run */}
                             <td className="px-5 py-4 text-neutral-600 font-semibold">
                               {camp.files?.length || 0} file(s)
                             </td>
 
                             {/* People Scored */}
                             <td className="px-5 py-4 text-neutral-800 font-bold">
                               {camp.peopleScored.toLocaleString('en-IN')}
                             </td>

                             {/* Ticket-Size Range */}
                             <td className="px-5 py-4 whitespace-nowrap text-neutral-700 font-bold text-[11px]">
                               ₹{min >= 100000 ? `${(min/100000).toFixed(0)}L` : min.toLocaleString('en-IN')} - ₹{max ? (max >= 100000 ? `${(max/100000).toFixed(0)}L` : max.toLocaleString('en-IN')) : 'Any'}
                             </td>
 
                             {/* Spend */}
                             <td className="px-5 py-4 font-black text-neutral-800 whitespace-nowrap">
                               ₹{camp.totalSpend.toLocaleString('en-IN')}
                             </td>

                             {/* Qualification Cost Actual */}
                             <td className="px-5 py-4 whitespace-nowrap">
                               <span className={`font-extrabold ${isOnTarget ? 'text-emerald-700' : 'text-rose-700'}`}>₹{cActual}</span>
                             </td>

                             {/* Qualification Cost Target */}
                             <td className="px-5 py-4 font-bold text-neutral-400 whitespace-nowrap">
                               ₹{cTarget}
                             </td>

                             {/* Pacing Status Bar */}
                             <td className="px-5 py-4 min-w-[160px]" onClick={(e) => e.stopPropagation()}>
                               <div className="space-y-1.5">
                                 <div className="flex items-center justify-between text-[9.5px] text-neutral-400 font-semibold gap-2">
                                   <span>{pacingPct}% of target</span>
                                   <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[8px] font-black uppercase border ${bgBadge} ${textColor}`}>
                                     <span className={`w-1 h-1 rounded-full ${barColor}`} />
                                     <span>{statusText}</span>
                                   </span>
                                 </div>
                                 <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden border border-neutral-200/20">
                                   <div 
                                     className={`${barColor} h-full rounded-full transition-all duration-500`}
                                     style={{ width: `${pacingPct}%` }}
                                   />
                                 </div>
                               </div>
                             </td>
 
                             {/* Uploaded By */}
                             <td className="px-5 py-4 text-neutral-500 font-semibold">
                               {camp.uploadedBy}
                             </td>
 
                             {/* Last Updated */}
                             <td className="px-5 py-4 text-neutral-400 font-mono text-[10px] font-bold">
                               {camp.dateCreated}
                             </td>
 
                             {/* Row Actions */}
                             <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-2">
                                {/* Add File action */}
                                <button
                                  onClick={() => {
                                    handleViewCampaignDetails(camp);
                                    showToast(`Loaded '${camp.name}' context to add a new file.`, 'info');
                                  }}
                                  className="p-1.5 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 rounded transition-all cursor-pointer"
                                  title="Add file to campaign"
                                >
                                  <UploadCloud size={13} />
                                </button>

                                {/* View details drawer action */}
                                <button
                                  onClick={() => setDetailDrawerCampaignId(camp.id)}
                                  className="p-1.5 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 rounded transition-all cursor-pointer"
                                  title="View campaign logs & queue details"
                                >
                                  <Eye size={13} />
                                </button>

                                {/* Clone campaign action */}
                                <button
                                  onClick={() => {
                                    handleCloneCampaign(camp);
                                    showToast(`Cloned context from '${camp.name}'. Feel free to adjust attributes.`, 'success');
                                  }}
                                  className="p-1.5 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 rounded transition-all cursor-pointer"
                                  title="Clone campaign"
                                >
                                  <Copy size={13} />
                                </button>

                                {/* Archive campaign action */}
                                <button
                                  onClick={(e) => {
                                    handleArchiveCampaign(camp.id, e);
                                  }}
                                  className={`p-1.5 rounded transition-all cursor-pointer ${
                                    camp.isArchived 
                                      ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' 
                                      : 'hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800'
                                  }`}
                                  title={camp.isArchived ? "Unarchive campaign" : "Archive campaign"}
                                >
                                  <Archive size={13} />
                                </button>

                                {/* Delete Campaign */}
                                <button
                                  onClick={(e) => {
                                    deleteCampaign(camp.id, e);
                                  }}
                                  className="p-1.5 hover:bg-rose-50 text-neutral-400 hover:text-rose-600 rounded transition-all cursor-pointer"
                                  title="Delete campaign"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="text-center py-16 text-neutral-400 font-medium space-y-1.5">
                          <p>No campaigns match your selected search or filters.</p>
                          <button
                            onClick={() => {
                              setManagementSearch('');
                              setManagementStatus('All');
                              setManagementDate('All time');
                              setShowArchived(false);
                            }}
                            className="text-blue-600 font-bold text-xs hover:underline cursor-pointer"
                          >
                            Clear all filters
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CAMPAIGN DETAIL DRAWER PANEL (Slide over panel) */}
            {detailDrawerCampaignId && drawerCampaign && (() => {
              // Calculate confidence percentages
              const totalScored = drawerCampaign.peopleScored || 1;
              const highPct = Math.round((drawerCampaign.confidenceStats.high / totalScored) * 100);
              const medPct = Math.round((drawerCampaign.confidenceStats.medium / totalScored) * 100);
              const lowPct = Math.round((drawerCampaign.confidenceStats.low / totalScored) * 100);

              // Metric calculations for the selected drawer campaign
              const cActual = drawerCampaign.confidenceStats.high > 0 ? Math.round(drawerCampaign.totalSpend / drawerCampaign.confidenceStats.high) : 15;
              const cTarget = getCampaignTargetCPL(drawerCampaign);
              const { min, max } = getCampaignTicketSize(drawerCampaign);
              const isOnTarget = cActual <= cTarget;

              const pacingPct = cTarget > 0 ? Math.min(100, Math.round((cActual / cTarget) * 100)) : 0;
              let barColor = 'bg-emerald-500';
              let textColor = 'text-emerald-700';
              let bgBadge = 'bg-emerald-50 border-emerald-200/60';
              let statusText = 'Within Target';

              if (cActual > cTarget * 1.15) {
                barColor = 'bg-rose-500 animate-pulse';
                textColor = 'text-rose-700';
                bgBadge = 'bg-rose-50 border-rose-200/60';
                statusText = 'Target Exceeded';
              } else if (cActual > cTarget) {
                barColor = 'bg-amber-500';
                textColor = 'text-amber-700';
                bgBadge = 'bg-amber-50 border-amber-200/60';
                statusText = 'At Risk';
              }

              return (
                <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
                  {/* Backdrop */}
                  <div 
                    onClick={() => setDetailDrawerCampaignId(null)}
                    className="absolute inset-0 bg-neutral-900/40 backdrop-blur-xs transition-opacity animate-fadeIn cursor-pointer"
                  />

                  {/* Slider Content Panel */}
                  <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 animate-slideLeft">
                    
                    {/* Drawer Header */}
                    <div className="p-5 border-b border-neutral-200/60 flex items-center justify-between bg-neutral-50/50">
                      <div>
                        <span className="text-[9px] uppercase font-mono tracking-wider font-extrabold text-neutral-400 bg-neutral-100 border border-neutral-200/50 px-2 py-0.5 rounded-full">
                          {drawerCampaign.id}
                        </span>
                        <h3 className="text-base font-bold text-neutral-800 mt-1.5 leading-tight">{drawerCampaign.name}</h3>
                        <p className="text-[11px] text-neutral-400 font-medium">Product Focus: {drawerCampaign.targetProduct}</p>
                      </div>
                      <button
                        onClick={() => setDetailDrawerCampaignId(null)}
                        className="p-1.5 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>

                    {/* Drawer Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-6">
                      
                      {/* Section: Confidence scoring mix */}
                      <div className="space-y-2.5">
                        <h4 className="text-xs font-bold uppercase text-neutral-400 tracking-wider">Qualification Confidence Mix</h4>
                        {drawerCampaign.peopleScored > 0 ? (
                          <div className="bg-neutral-50 border border-neutral-200/50 rounded-xl p-4 space-y-3.5">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-neutral-700">{drawerCampaign.peopleScored.toLocaleString()} total candidates qualified</span>
                            </div>
                            
                            {/* Colorful Segment Bar */}
                            <div className="w-full h-3 bg-neutral-200/60 rounded-full flex overflow-hidden">
                              <div className="bg-[#1e40af] h-full" style={{ width: `${highPct}%` }} title={`High Confidence Match: ${highPct}%`} />
                              <div className="bg-[#60a5fa] h-full" style={{ width: `${medPct}%` }} title={`Medium Confidence Match: ${medPct}%`} />
                              <div className="bg-[#bfdbfe] h-full" style={{ width: `${lowPct}%` }} title={`Low Confidence Match: ${lowPct}%`} />
                            </div>

                            {/* Legend labels */}
                            <div className="grid grid-cols-3 gap-2 text-center text-[10.5px]">
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1e40af]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#1e40af]" />
                                  <span>High Fit</span>
                                </span>
                                <strong className="block text-neutral-800 font-black">{highPct}%</strong>
                                <span className="text-[9px] text-neutral-400 block font-semibold">({drawerCampaign.confidenceStats.high.toLocaleString()} rows)</span>
                              </div>

                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#60a5fa]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#60a5fa]" />
                                  <span>Medium</span>
                                </span>
                                <strong className="block text-neutral-800 font-black">{medPct}%</strong>
                                <span className="text-[9px] text-neutral-400 block font-semibold">({drawerCampaign.confidenceStats.medium.toLocaleString()} rows)</span>
                              </div>

                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-neutral-450">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#bfdbfe]" />
                                  <span>Low Fit</span>
                                </span>
                                <strong className="block text-neutral-800 font-black">{lowPct}%</strong>
                                <span className="text-[9px] text-neutral-400 block font-semibold">({drawerCampaign.confidenceStats.low.toLocaleString()} rows)</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-neutral-50 border border-neutral-200/50 rounded-xl p-6 text-center text-xs text-neutral-400 font-medium">
                            No candidates have been evaluated under this campaign draft yet.
                          </div>
                        )}
                      </div>

                      {/* Section: Qualification Cost Pacing Chart */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase text-neutral-400 tracking-wider">Qualification Cost Pacing</h4>
                        <div className="bg-neutral-50 border border-neutral-200/50 rounded-xl p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">Actual CPL (High-Fit Found)</span>
                              <strong className="text-lg font-black text-neutral-800">₹{cActual.toLocaleString('en-IN')}</strong>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">Target CPL Limit</span>
                              <strong className="text-lg font-black text-neutral-400">₹{cTarget.toLocaleString('en-IN')}</strong>
                            </div>
                          </div>

                          {/* Comparative visual bar */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-neutral-500">Pacing Progress</span>
                              <span className={isOnTarget ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                                {pacingPct}% {isOnTarget ? "Within Budget" : "Exceeded Target"}
                              </span>
                            </div>
                            <div className="relative h-4 bg-neutral-200/60 rounded-lg overflow-hidden border border-neutral-200/20">
                              <div className="absolute top-0 bottom-0 left-[100%] w-0.5 bg-neutral-400 z-10" />
                              <div 
                                className={`h-full rounded-lg transition-all duration-500 ${barColor}`}
                                style={{ width: `${pacingPct}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-neutral-400 leading-normal font-medium">
                              * Spend per High-confidence lead found (total spend divided by high-fit count), not spend per lead converted.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Section: Locked Campaign Rules Panel */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase text-neutral-400 tracking-wider">Locked Campaign Attributes & Rules</h4>
                        <div className="bg-neutral-50 border border-neutral-200/50 rounded-xl p-4 grid grid-cols-2 gap-3.5 text-xs">
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">Ticket Size Focus</span>
                            <strong className="text-neutral-800 font-extrabold block">
                              ₹{min >= 100000 ? `${(min/100000).toFixed(0)}L` : min.toLocaleString('en-IN')} - ₹{max ? (max >= 100000 ? `${(max/100000).toFixed(0)}L` : max.toLocaleString('en-IN')) : 'Any'}
                            </strong>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">Purchase Channel</span>
                            <strong className="text-neutral-800 font-extrabold block capitalize">{getCampaignPurchaseChannel(drawerCampaign)}</strong>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">Purchase Cycle</span>
                            <strong className="text-neutral-800 font-extrabold block capitalize">{getCampaignPurchaseCycle(drawerCampaign)}</strong>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">Target Region</span>
                            <strong className="text-neutral-800 font-extrabold block">{drawerCampaign.targetRegion || 'National'}</strong>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">Customer Segment</span>
                            <strong className="text-neutral-800 font-extrabold block">{drawerCampaign.customerSegment || 'Wealth Clients'}</strong>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">Weights Matrix</span>
                            <div className="text-[10px] text-neutral-500 font-bold space-y-0.5 mt-0.5">
                              <div>Income Weight: {drawerCampaign.weights?.incomeWeight || 40}%</div>
                              <div>Spend Weight: {drawerCampaign.weights?.spendWeight || 40}%</div>
                              <div>Propensity Weight: {drawerCampaign.weights?.propensityWeight || 20}%</div>
                            </div>
                          </div>
                        </div>
                        <p className="text-[9.5px] text-neutral-400 font-medium pl-1 leading-normal">
                          🔒 Rules are frozen once a campaign has been launched. Clone this campaign to adjust attributes.
                        </p>
                      </div>

                      {/* Section: File processing roster progress */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase text-neutral-400 tracking-wider">Processed Candidate Rosters</h4>
                        <div className="space-y-3">
                          {drawerCampaign.files && drawerCampaign.files.length > 0 ? (
                            drawerCampaign.files.map((file, idx) => {
                              // Simulate stage progress attributes for rendering
                              const isProcessing = file.status === 'Processing';
                              const currentStage = isProcessing ? 'AI Propensity Scoring' : 'Completed';
                              const queuePos = isProcessing ? 'Position 2 in queue' : 'Completed';
                              const timeRemaining = isProcessing ? '24 seconds remaining' : 'Finished';

                              return (
                                <div key={file.id || idx} className="bg-white border border-neutral-200/70 rounded-xl p-4 shadow-sm space-y-3">
                                  <div className="flex items-start justify-between">
                                    <div className="space-y-0.5">
                                      <strong className="text-xs text-neutral-800 block font-bold leading-tight break-all">{file.fileName}</strong>
                                      <span className="text-[10px] text-neutral-400 font-bold uppercase block">{file.fileSize} &bull; Synced on {file.dateUploaded}</span>
                                    </div>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-black uppercase ${
                                      isProcessing ? 'bg-blue-50 text-blue-700 animate-pulse' : 'bg-emerald-50 text-emerald-800'
                                    }`}>
                                      {isProcessing && <RefreshCw size={8} className="animate-spin text-blue-600" />}
                                      <span>{file.status}</span>
                                    </span>
                                  </div>

                                  {/* Detailed Stage details */}
                                  <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-neutral-100 text-[10.5px]">
                                    <div className="space-y-0.5">
                                      <span className="text-neutral-400 block uppercase font-bold text-[8.5px]">Active Stage</span>
                                      <strong className={`font-bold block ${isProcessing ? 'text-blue-600' : 'text-neutral-700'}`}>{currentStage}</strong>
                                    </div>
                                    <div className="space-y-0.5">
                                      <span className="text-neutral-400 block uppercase font-bold text-[8.5px]">Queue Position</span>
                                      <strong className="text-neutral-700 font-bold block">{queuePos}</strong>
                                    </div>
                                    <div className="space-y-0.5">
                                      <span className="text-neutral-400 block uppercase font-bold text-[8.5px]">Time Remaining</span>
                                      <strong className="text-neutral-700 font-mono font-bold block">{timeRemaining}</strong>
                                    </div>
                                  </div>

                                  {/* Partial Failure skip counts */}
                                  {file.rowsSkipped > 0 && (
                                    <div className="p-2.5 bg-amber-50/40 rounded-lg border border-amber-100 space-y-1.5">
                                      <div className="flex items-center gap-1 text-[10.5px] font-bold text-amber-800">
                                        <AlertCircle size={12} className="text-amber-600" />
                                        <span>Roster Validation Warning ({file.rowsSkipped} rows skipped)</span>
                                      </div>
                                      
                                      <div className="space-y-1 pl-4.5">
                                        {file.skipReasons && file.skipReasons.length > 0 ? (
                                          file.skipReasons.map((reason, rIdx) => (
                                            <p key={rIdx} className="text-[10px] text-amber-700 font-medium leading-normal list-disc">
                                              &bull; {reason.count} records skipped: <span className="font-semibold">{reason.reason}</span>
                                            </p>
                                          ))
                                        ) : (
                                          <p className="text-[10px] text-amber-700 font-medium">
                                            Records did not pass Zenith rule requirements or had duplicate contact indices.
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-center py-6 text-neutral-400 font-medium text-xs bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                              No candidate files processed yet.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Section: Activity log Timeline */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase text-neutral-400 tracking-wider">Activity Log Timeline</h4>
                        <div className="relative pl-4 border-l border-neutral-200 space-y-4">
                          {drawerCampaign.activityLog && drawerCampaign.activityLog.length > 0 ? (
                            drawerCampaign.activityLog.map((log, lIdx) => (
                              <div key={lIdx} className="relative text-xs text-neutral-600 font-medium leading-normal">
                                <span className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white" />
                                <p>{log}</p>
                              </div>
                            ))
                          ) : (
                            <div className="text-neutral-400 text-xs font-semibold py-1">
                              No events logged yet.
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Drawer Footer CTA */}
                    <div className="p-4 border-t border-neutral-200/60 flex items-center justify-between gap-3 bg-neutral-50/50">
                      <button
                        onClick={() => setDetailDrawerCampaignId(null)}
                        className="px-4 py-2 text-xs font-bold bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-600 rounded-lg transition-all cursor-pointer"
                      >
                        Close Panel
                      </button>

                      {drawerCampaign.peopleScored > 0 && (
                        <button
                          onClick={() => {
                            setSelectedCampaignId(drawerCampaign.id);
                            setResultsFilter('All');
                            setQualView('results');
                            setDetailDrawerCampaignId(null);
                          }}
                          className="flex items-center gap-1 px-4 py-2 text-xs font-bold bg-[#1e40af] hover:bg-[#1d4ed8] active:scale-95 text-white rounded-lg shadow-md transition-all cursor-pointer"
                        >
                          <SlidersHorizontal size={12} />
                          <span>Drill down to Results</span>
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              );
            })()}

          </div>
        );
      })()}

    </div>
  );
};
