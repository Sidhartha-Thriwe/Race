import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  FileText, 
  Download, 
  X, 
  Info, 
  AlertCircle, 
  CheckCircle, 
  User, 
  Eye, 
  DownloadCloud, 
  Sparkles,
  Award,
  ChevronRight,
  TrendingUp,
  BrainCircuit,
  Lock,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QualCampaign } from './LeadQualification';

export interface ProfiledPerson {
  id: string;
  name: string;
  contact: string;
  dataQuality: 'Sufficient' | 'Insufficient';
  sourceCampaignId: string;
  sourceCampaignName: string;
  fileId: string;
  fileName: string;
  dateProcessed: string;
  gender?: string;
  location?: string;
  role?: string;
  company?: string;
  personaSummary?: string;
  topCategories?: Array<{
    rank: number;
    name: string;
    evidenceStrength: number; // out of 10
    psychFit: number; // out of 10
    rationale: string;
  }>;
  motivationalDrivers?: Array<{ name: string; value: number }>; // 6 dimensions
  bigFivePersonality?: Array<{ name: string; value: number }>; // 5 dimensions
  behavioralDigitalProfile?: Array<{ name: string; value: number }>; // 7 dimensions
}

interface CustomerInsightFeedProps {
  campaigns: QualCampaign[];
}

// Complete high-fidelity mock dataset of profiled individuals
const INITIAL_PROFILED_PEOPLE: ProfiledPerson[] = [
  {
    id: "PROF-401",
    name: "Rajesh K. Singhania",
    contact: "rajesh.singhania@singhaniaindustries.com",
    dataQuality: "Sufficient",
    sourceCampaignId: "QUAL-101",
    sourceCampaignName: "HNIs North Region v2",
    fileId: "FL-101-1",
    fileName: "delhi_gurugram_execs_raw.csv",
    dateProcessed: "2026-09-02",
    location: "New Delhi",
    role: "Managing Director",
    company: "Singhania Industries",
    personaSummary: "Risk-Averse Wealth Creator with an emphasis on intergenerational legacy and high financial security. Skeptical of ultra-automated web interfaces, placing high value on personal premium advisors, face-to-face discretion, and stable hard-asset allocation.",
    topCategories: [
      {
        rank: 1,
        name: "Private Wealth Advisory",
        evidenceStrength: 9.4,
        psychFit: 9.6,
        rationale: "Faced with upcoming generational transition of a legacy business; highly motivated by hand-held, discrete estate planning and trust structures."
      },
      {
        rank: 2,
        name: "Multi-Asset PMS Advisory",
        evidenceStrength: 8.5,
        psychFit: 8.8,
        rationale: "Requires high-grade hedging to balance substantial equity in his core manufacturing business; seeks downside-insulated PMS."
      },
      {
        rank: 3,
        name: "Commercial Real Estate Yield Funds",
        evidenceStrength: 7.8,
        psychFit: 8.2,
        rationale: "Exhibits a strong mental association between hard assets and security; seeks prime commercial assets for secondary rental yields."
      }
    ],
    motivationalDrivers: [
      { name: "Security", value: 9.5 },
      { name: "Growth", value: 6.8 },
      { name: "Status", value: 8.5 },
      { name: "Autonomy", value: 7.2 },
      { name: "Legacy", value: 9.8 },
      { name: "Convenience", value: 5.0 }
    ],
    bigFivePersonality: [
      { name: "Openness", value: 5.5 },
      { name: "Conscientiousness", value: 9.2 },
      { name: "Extraversion", value: 7.8 },
      { name: "Agreeableness", value: 8.4 },
      { name: "Neuroticism", value: 4.2 }
    ],
    behavioralDigitalProfile: [
      { name: "Mobile Affinity", value: 4.5 },
      { name: "Brand Loyalty", value: 9.5 },
      { name: "Risk Appetite", value: 5.0 },
      { name: "Inbound Response", value: 7.2 },
      { name: "Newsletter Reader", value: 8.0 },
      { name: "Community Trust", value: 9.0 },
      { name: "Direct Mail Open", value: 8.5 }
    ]
  },
  {
    id: "PROF-402",
    name: "Priya Mehta",
    contact: "priya.mehta@nexgenvc.com",
    dataQuality: "Sufficient",
    sourceCampaignId: "QUAL-102",
    sourceCampaignName: "Ultra-HNIs Mutual Fund Propensity",
    fileId: "FL-102-1",
    fileName: "mumbai_promoters_equity.csv",
    dateProcessed: "2026-09-05",
    location: "Mumbai",
    role: "Co-Founder & GP",
    company: "NexGen Ventures",
    personaSummary: "High-Growth Bold Innovator focused on rapid compounding, tech-led global disruption, and autonomous transaction execution. Prefers seamless digital platforms with rich analytical capabilities, high-conviction thematic bets, and cross-border equity opportunities.",
    topCategories: [
      {
        rank: 1,
        name: "Global Venture PMS",
        evidenceStrength: 9.5,
        psychFit: 9.7,
        rationale: "Active venture investor who believes tech is the primary long-term return driver; highly receptive to global venture PMS and seed structures."
      },
      {
        rank: 2,
        name: "Aggressive Equity Mutual Funds",
        evidenceStrength: 8.8,
        psychFit: 9.0,
        rationale: "Desires systematic liquidity coupled with maximum beta; comfortable with high-volatility thematic mutual fund classes."
      },
      {
        rank: 3,
        name: "Arbitrage & Tax-Efficient Liquid Parking",
        evidenceStrength: 7.5,
        psychFit: 8.0,
        rationale: "Needs sophisticated treasury and arbitrage solutions to park capital between funding rounds and secondary liquidation events."
      }
    ],
    motivationalDrivers: [
      { name: "Security", value: 4.2 },
      { name: "Growth", value: 9.6 },
      { name: "Status", value: 8.0 },
      { name: "Autonomy", value: 9.5 },
      { name: "Legacy", value: 7.0 },
      { name: "Convenience", value: 9.2 }
    ],
    bigFivePersonality: [
      { name: "Openness", value: 9.5 },
      { name: "Conscientiousness", value: 8.2 },
      { name: "Extraversion", value: 8.8 },
      { name: "Agreeableness", value: 7.0 },
      { name: "Neuroticism", value: 3.5 }
    ],
    behavioralDigitalProfile: [
      { name: "Mobile Affinity", value: 9.8 },
      { name: "Brand Loyalty", value: 5.2 },
      { name: "Risk Appetite", value: 9.5 },
      { name: "Inbound Response", value: 8.5 },
      { name: "Newsletter Reader", value: 6.0 },
      { name: "Community Trust", value: 6.5 },
      { name: "Direct Mail Open", value: 3.0 }
    ]
  },
  {
    id: "PROF-403",
    name: "Dr. Amit K. Sen",
    contact: "drak_sen@fortishealthcare.com",
    dataQuality: "Sufficient",
    sourceCampaignId: "QUAL-101",
    sourceCampaignName: "HNIs North Region v2",
    fileId: "FL-101-1",
    fileName: "delhi_gurugram_execs_raw.csv",
    dateProcessed: "2026-09-02",
    location: "Gurugram",
    role: "Director of Cardiology",
    company: "Fortis Healthcare",
    personaSummary: "Detail-Oriented Expert seeking mathematically backed proof and absolute convenience. Constrained by a punishing surgical schedule, he delegates management but requires complete disclosure, regular analytical reports, and risk-insulated passive yields.",
    topCategories: [
      {
        rank: 1,
        name: "Comprehensive Estate & Succession Planning",
        evidenceStrength: 9.0,
        psychFit: 9.2,
        rationale: "Diversified real estate and equity assets spread internationally; needs automated legal mapping for secure family succession."
      },
      {
        rank: 2,
        name: "Sovereign Gold & Passive Debt PMS",
        evidenceStrength: 8.4,
        psychFit: 8.6,
        rationale: "Displays high aversion to daily public equity market volatility; prefers inflation-adjusted stable sovereign structures."
      },
      {
        rank: 3,
        name: "Direct Algorithm-Selected Mutual Funds",
        evidenceStrength: 7.0,
        psychFit: 7.8,
        rationale: "Responds strongly to data, mathematical backtesting, and scientific portfolio theory over discretionary manager pitches."
      }
    ],
    motivationalDrivers: [
      { name: "Security", value: 8.8 },
      { name: "Growth", value: 5.8 },
      { name: "Status", value: 6.2 },
      { name: "Autonomy", value: 7.5 },
      { name: "Legacy", value: 8.5 },
      { name: "Convenience", value: 9.4 }
    ],
    bigFivePersonality: [
      { name: "Openness", value: 7.2 },
      { name: "Conscientiousness", value: 9.8 },
      { name: "Extraversion", value: 5.5 },
      { name: "Agreeableness", value: 8.0 },
      { name: "Neuroticism", value: 4.8 }
    ],
    behavioralDigitalProfile: [
      { name: "Mobile Affinity", value: 7.5 },
      { name: "Brand Loyalty", value: 8.2 },
      { name: "Risk Appetite", value: 4.2 },
      { name: "Inbound Response", value: 5.0 },
      { name: "Newsletter Reader", value: 9.2 },
      { name: "Community Trust", value: 7.8 },
      { name: "Direct Mail Open", value: 6.0 }
    ]
  },
  {
    id: "PROF-404",
    name: "Meera Nair",
    contact: "meera.nair@zomato.com",
    dataQuality: "Sufficient",
    sourceCampaignId: "QUAL-103",
    sourceCampaignName: "Festive Credit Cards Pilot",
    fileId: "FL-103-1",
    fileName: "festive_spend_leads.csv",
    dateProcessed: "2026-09-10",
    location: "Bengaluru",
    role: "VP of Brand Strategy",
    company: "Zomato",
    personaSummary: "Experiential Trend-Setter driven by high social status, curated privilege, and ultimate convenience. Extremely active consumer of premium dining, lifestyle events, and international boutique travel; values frictionless, instant digital servicing and unique privileges.",
    topCategories: [
      {
        rank: 1,
        name: "Zenith Super-Premium Card",
        evidenceStrength: 9.8,
        psychFit: 9.9,
        rationale: "Exceptional transaction velocity on travel and fine dining. High psychological fit for premium metal products offering bespoke partner privileges."
      },
      {
        rank: 2,
        name: "Bespoke Concierge & Travel Booking Services",
        evidenceStrength: 8.5,
        psychFit: 9.0,
        rationale: "Values elite access to Michelin-starred restaurants and custom global tours over simple baseline cashbacks."
      },
      {
        rank: 3,
        name: "Points-to-Air-Miles PMS Optimization",
        evidenceStrength: 7.2,
        psychFit: 8.5,
        rationale: "Actively tracks loyalty status; prefers a product where everyday high business spends directly power premium vacation mileage."
      }
    ],
    motivationalDrivers: [
      { name: "Security", value: 3.5 },
      { name: "Growth", value: 6.2 },
      { name: "Status", value: 9.8 },
      { name: "Autonomy", value: 8.0 },
      { name: "Legacy", value: 4.5 },
      { name: "Convenience", value: 9.5 }
    ],
    bigFivePersonality: [
      { name: "Openness", value: 9.0 },
      { name: "Conscientiousness", value: 7.5 },
      { name: "Extraversion", value: 9.2 },
      { name: "Agreeableness", value: 8.5 },
      { name: "Neuroticism", value: 3.0 }
    ],
    behavioralDigitalProfile: [
      { name: "Mobile Affinity", value: 9.9 },
      { name: "Brand Loyalty", value: 6.5 },
      { name: "Risk Appetite", value: 7.0 },
      { name: "Inbound Response", value: 9.2 },
      { name: "Newsletter Reader", value: 5.0 },
      { name: "Community Trust", value: 7.0 },
      { name: "Direct Mail Open", value: 4.0 }
    ]
  },
  {
    id: "PROF-405",
    name: "Abhishek Goel",
    contact: "abhishek.goel87@gmail.com",
    dataQuality: "Insufficient",
    sourceCampaignId: "QUAL-101",
    sourceCampaignName: "HNIs North Region v2",
    fileId: "FL-101-1",
    fileName: "delhi_gurugram_execs_raw.csv",
    dateProcessed: "2026-09-02",
    location: "Noida",
    role: "Senior Engineering Lead",
    company: "Publicis Sapient",
    personaSummary: undefined
  },
  {
    id: "PROF-406",
    name: "Shruti Srinivasan",
    contact: "shruti.s@tcs.com",
    dataQuality: "Insufficient",
    sourceCampaignId: "QUAL-102",
    sourceCampaignName: "Ultra-HNIs Mutual Fund Propensity",
    fileId: "FL-102-1",
    fileName: "mumbai_promoters_equity.csv",
    dateProcessed: "2026-09-05",
    location: "Mumbai",
    role: "Principal Enterprise Architect",
    company: "Tata Consultancy Services",
    personaSummary: undefined
  },
  {
    id: "PROF-407",
    name: "Anand R. Verma",
    contact: "anand.verma@vermaexports.co",
    dataQuality: "Sufficient",
    sourceCampaignId: "QUAL-101",
    sourceCampaignName: "HNIs North Region v2",
    fileId: "FL-101-2",
    fileName: "noida_realestate_owners.xlsx",
    dateProcessed: "2026-09-03",
    location: "Noida",
    role: "Managing Partner",
    company: "Verma Exports",
    personaSummary: "Conservative family merchant focused on liquidity preservation, local physical investments, and community reputation. Demands clear risk mitigation parameters and values physical bank presence coupled with high relational advisory.",
    topCategories: [
      {
        rank: 1,
        name: "Secured Short-Term Yield Advisory",
        evidenceStrength: 9.2,
        psychFit: 9.4,
        rationale: "Export sales are cyclical; requires absolute capital protection and same-quarter liquidity options for raw-material purchases."
      },
      {
        rank: 2,
        name: "Direct Commercial Property Fund",
        evidenceStrength: 8.0,
        psychFit: 8.5,
        rationale: "Highly confident in real estate; prefers fractional premium property investments offering stable rental dividends."
      },
      {
        rank: 3,
        name: "Generational Trust Planning",
        evidenceStrength: 7.4,
        psychFit: 8.0,
        rationale: "Keen to lock capital for his grandchildren; values physical gold-backed trusts and structured family covenants."
      }
    ],
    motivationalDrivers: [
      { name: "Security", value: 9.8 },
      { name: "Growth", value: 5.0 },
      { name: "Status", value: 7.8 },
      { name: "Autonomy", value: 6.5 },
      { name: "Legacy", value: 9.2 },
      { name: "Convenience", value: 6.0 }
    ],
    bigFivePersonality: [
      { name: "Openness", value: 4.8 },
      { name: "Conscientiousness", value: 9.5 },
      { name: "Extraversion", value: 7.0 },
      { name: "Agreeableness", value: 8.8 },
      { name: "Neuroticism", value: 5.0 }
    ],
    behavioralDigitalProfile: [
      { name: "Mobile Affinity", value: 5.0 },
      { name: "Brand Loyalty", value: 9.2 },
      { name: "Risk Appetite", value: 4.0 },
      { name: "Inbound Response", value: 6.0 },
      { name: "Newsletter Reader", value: 7.5 },
      { name: "Community Trust", value: 9.5 },
      { name: "Direct Mail Open", value: 8.0 }
    ]
  },
  {
    id: "PROF-408",
    name: "Karan Johar Malhotra",
    contact: "+91 98200 55112",
    dataQuality: "Insufficient",
    sourceCampaignId: "QUAL-101",
    sourceCampaignName: "HNIs North Region v2",
    fileId: "FL-101-2",
    fileName: "noida_realestate_owners.xlsx",
    dateProcessed: "2026-09-03",
    location: "Gurugram",
    role: "Director",
    company: "Dharma Hospitality",
    personaSummary: undefined
  }
];

// Helper to draw clean responsive SVG Radar Chart
const RadarChartSVG: React.FC<{
  data: Array<{ name: string; value: number }>;
  color: string;
  onHoverDimension: (dim: { name: string; value: number } | null) => void;
}> = ({ data, color, onHoverDimension }) => {
  const cx = 110;
  const cy = 110;
  const radius = 75;
  const N = data.length;

  // Grid levels (20%, 40%, 60%, 80%, 100%)
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Helper calculations for points
  const getCoordinates = (index: number, ratio: number) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * index) / N;
    const r = radius * ratio;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return { x, y };
  };

  // Coordinates of data points
  const points = data.map((d, i) => getCoordinates(i, d.value / 10));
  const pointsString = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="relative flex flex-col items-center select-none">
      <svg width={220} height={220} className="overflow-visible">
        {/* Render concentric polygon grids */}
        {levels.map((level, lIndex) => {
          const gridPoints = data.map((_, i) => {
            const p = getCoordinates(i, level);
            return `${p.x},${p.y}`;
          }).join(' ');

          return (
            <polygon
              key={`grid-${lIndex}`}
              points={gridPoints}
              fill="none"
              stroke="#e5e5e5"
              strokeWidth={0.75}
            />
          );
        })}

        {/* Render axes lines */}
        {data.map((_, i) => {
          const endPoint = getCoordinates(i, 1.0);
          return (
            <line
              key={`axis-${i}`}
              x1={cx}
              y1={cy}
              x2={endPoint.x}
              y2={endPoint.y}
              stroke="#e5e5e5"
              strokeWidth={1}
            />
          );
        })}

        {/* Render the data polygon */}
        <polygon
          points={pointsString}
          fill={color}
          fillOpacity={0.15}
          stroke={color.replace(')', ', 0.85)')}
          strokeWidth={1.5}
        />

        {/* Interactive hover targets for points */}
        {points.map((p, i) => {
          const d = data[i];
          return (
            <g 
              key={`pt-${i}`}
              className="cursor-pointer"
              onMouseEnter={() => onHoverDimension(d)}
              onMouseLeave={() => onHoverDimension(null)}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={4}
                fill={color.replace(')', ', 0.95)')}
                stroke="#fff"
                strokeWidth={1}
                className="transition-all hover:scale-150"
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={12}
                fill="transparent"
              />
            </g>
          );
        })}

        {/* Axis Labels */}
        {data.map((d, i) => {
          const p = getCoordinates(i, 1.15);
          // Adjust text anchoring based on quadrant
          const angle = -Math.PI / 2 + (2 * Math.PI * i) / N;
          const cos = Math.cos(angle);
          let textAnchor = 'middle';
          if (cos > 0.15) textAnchor = 'start';
          else if (cos < -0.15) textAnchor = 'end';

          return (
            <text
              key={`lbl-${i}`}
              x={p.x}
              y={p.y + 4}
              fontSize={8.5}
              fontWeight="600"
              fill="#525252"
              textAnchor={textAnchor}
              className="cursor-help font-sans"
              onMouseEnter={() => onHoverDimension(d)}
              onMouseLeave={() => onHoverDimension(null)}
            >
              {d.name}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

export const CustomerInsightFeed: React.FC<CustomerInsightFeedProps> = ({ campaigns }) => {
  // Navigation & filter states
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('All');
  const [selectedFileId, setSelectedFileId] = useState<string>('All');
  const [selectedQuality, setSelectedQuality] = useState<'All' | 'Sufficient' | 'Insufficient'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected person for detail drawer
  const [activePerson, setActivePerson] = useState<ProfiledPerson | null>(null);
  
  // Hovered driver dimension in the Radar charts
  const [hoveredDimension, setHoveredDimension] = useState<{ name: string; value: number } | null>(null);

  // Export Confirmation Dialogs
  const [isExportSummaryToast, setIsExportSummaryToast] = useState(false);
  const [showExportDetailConfirmation, setShowExportDetailConfirmation] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Retrieve files belonging to the currently selected campaign (or all if 'All' is selected)
  const availableFiles = useMemo(() => {
    if (selectedCampaignId === 'All') return [];
    const campaign = campaigns.find(c => c.id === selectedCampaignId);
    return campaign ? campaign.files || [] : [];
  }, [campaigns, selectedCampaignId]);

  // Reset file filter when campaign changes
  const handleCampaignChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCampaignId(e.target.value);
    setSelectedFileId('All');
  };

  // Filtered dataset
  const filteredPeople = useMemo(() => {
    return INITIAL_PROFILED_PEOPLE.filter(person => {
      // Filter by Campaign
      if (selectedCampaignId !== 'All' && person.sourceCampaignId !== selectedCampaignId) {
        return false;
      }
      // Filter by File
      if (selectedFileId !== 'All' && person.fileId !== selectedFileId) {
        return false;
      }
      // Filter by Data Quality
      if (selectedQuality !== 'All' && person.dataQuality !== selectedQuality) {
        return false;
      }
      // Search by Name or Contact
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesName = person.name.toLowerCase().includes(query);
        const matchesContact = person.contact.toLowerCase().includes(query);
        const matchesCompany = (person.company || '').toLowerCase().includes(query);
        if (!matchesName && !matchesContact && !matchesCompany) return false;
      }
      return true;
    });
  }, [selectedCampaignId, selectedFileId, selectedQuality, searchQuery]);

  // Export Summary Table (CSV Trigger)
  const triggerExportSummary = () => {
    const headers = ['ID', 'Name', 'Contact', 'Data Quality', 'Source Campaign', 'File Name', 'Date Processed', 'Location', 'Role', 'Company'];
    const rows = filteredPeople.map(p => [
      p.id,
      p.name,
      p.contact,
      p.dataQuality,
      p.sourceCampaignName,
      p.fileName,
      p.dateProcessed,
      p.location || '',
      p.role || '',
      p.company || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `RACE_Insight_Summary_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage(`Export Completed: ${filteredPeople.length} summary records downloaded successfully.`);
    setIsExportSummaryToast(true);
    setTimeout(() => setIsExportSummaryToast(false), 4000);
  };

  // Export Full Details (JSON formatted text package download with safety confirmation)
  const triggerExportFullDetails = () => {
    setShowExportDetailConfirmation(false);

    const detailedData = filteredPeople.map(p => {
      if (p.dataQuality === 'Insufficient') {
        return {
          id: p.id,
          name: p.name,
          contact: p.contact,
          dataQuality: p.dataQuality,
          sourceCampaignName: p.sourceCampaignName,
          fileName: p.fileName,
          dateProcessed: p.dateProcessed,
          note: "Insufficient behavioral data footprint collected to perform legal psychological profiling."
        };
      }
      return {
        id: p.id,
        name: p.name,
        contact: p.contact,
        dataQuality: p.dataQuality,
        sourceCampaignName: p.sourceCampaignName,
        fileName: p.fileName,
        dateProcessed: p.dateProcessed,
        demographics: {
          location: p.location,
          role: p.role,
          company: p.company
        },
        personaSummary: p.personaSummary,
        topActionableCategories: p.topCategories?.map(c => ({
          rank: c.rank,
          recommendation: c.name,
          evidenceStrength: `${c.evidenceStrength}/10`,
          psychologicalFit: `${c.psychFit}/10`,
          rationale: c.rationale
        })),
        analyticalProfile: {
          motivationalDrivers: p.motivationalDrivers,
          bigFivePersonality: p.bigFivePersonality,
          behavioralDigitalMetrics: p.behavioralDigitalProfile
        }
      };
    });

    const fileContent = JSON.stringify(detailedData, null, 2);
    const blob = new Blob([fileContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `RACE_Psychological_Deep_Export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage(`Secure Export Completed: Psychological deep profiles downloaded.`);
    setIsExportSummaryToast(true);
    setTimeout(() => setIsExportSummaryToast(false), 4000);
  };

  return (
    <div className="space-y-6 pb-24 font-sans select-none w-full max-w-full">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-neutral-100 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-950 flex items-center gap-2">
            <BrainCircuit className="text-[#3b82f6]" size={22} />
            Insight Feed
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Real-time actionable psychological and behavioral recommendations for processed profiles.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <button
            onClick={triggerExportSummary}
            disabled={filteredPeople.length === 0}
            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-white text-neutral-700 hover:text-neutral-900 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
          >
            <Download size={14} />
            <span>Export Summary Table</span>
          </button>
          
          <button
            onClick={() => setShowExportDetailConfirmation(true)}
            disabled={filteredPeople.length === 0}
            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-[#2563eb] text-white hover:bg-[#1d4ed8] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
          >
            <DownloadCloud size={14} />
            <span>Export Full Detail</span>
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Campaign Filter */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">Profiling Campaign</label>
            <div className="relative">
              <select
                value={selectedCampaignId}
                onChange={handleCampaignChange}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                <option value="All">All Campaigns</option>
                {campaigns.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-neutral-400">
                <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* File Filter */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">Uploaded File</label>
            <div className="relative">
              <select
                value={selectedFileId}
                disabled={selectedCampaignId === 'All'}
                onChange={(e) => setSelectedFileId(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <option value="All">All Uploaded Files</option>
                {availableFiles.map(f => (
                  <option key={f.id} value={f.id}>{f.fileName}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-neutral-400">
                <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Data-Quality Filter */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">Evidence Quality</label>
            <div className="relative">
              <select
                value={selectedQuality}
                onChange={(e) => setSelectedQuality(e.target.value as any)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                <option value="All">All Profiles (Quality)</option>
                <option value="Sufficient">Sufficient Evidence (Real Profile)</option>
                <option value="Insufficient">Insufficient Evidence (Thin Footprint)</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-neutral-400">
                <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Search Box */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">Search Profiles</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-neutral-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Search by name, company, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-9 pr-3 py-2 text-xs text-neutral-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-neutral-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-3 flex items-center text-neutral-400 hover:text-neutral-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100">
                <th className="px-5 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Profiled Person</th>
                <th className="px-5 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Digital Footprint Quality</th>
                <th className="px-5 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Source Campaign</th>
                <th className="px-5 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Execution Roster File</th>
                <th className="px-5 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Date Processed</th>
                <th className="px-5 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredPeople.length > 0 ? (
                filteredPeople.map(person => (
                  <tr 
                    key={person.id}
                    className="hover:bg-neutral-50/50 transition-colors"
                  >
                    {/* Person Details */}
                    <td className="px-5 py-4">
                      <div>
                        <div className="text-xs font-bold text-neutral-800">{person.name}</div>
                        <div className="text-[10px] text-neutral-400 mt-0.5">{person.contact}</div>
                      </div>
                    </td>

                    {/* Quality Tag */}
                    <td className="px-5 py-4">
                      {person.dataQuality === 'Sufficient' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                          <CheckCircle size={10} />
                          Sufficient Evidence
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertCircle size={10} />
                          Insufficient Evidence
                        </span>
                      )}
                    </td>

                    {/* Source Campaign */}
                    <td className="px-5 py-4">
                      <div className="text-xs font-semibold text-neutral-600">{person.sourceCampaignName}</div>
                      <div className="text-[9px] text-neutral-400 uppercase font-bold tracking-wider mt-0.5">{person.sourceCampaignId}</div>
                    </td>

                    {/* Roster File */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                        <FileText size={12} className="text-neutral-400 shrink-0" />
                        <span className="truncate max-w-[150px] font-medium">{person.fileName}</span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 text-xs text-neutral-500 font-medium">
                      {new Date(person.dateProcessed).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => {
                          setActivePerson(person);
                          setHoveredDimension(null);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye size={12} />
                        <span>View Insights</span>
                      </button>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="max-w-xs mx-auto">
                      <AlertCircle className="mx-auto text-neutral-300 mb-2" size={32} />
                      <h4 className="text-xs font-bold text-neutral-700">No profiled records found</h4>
                      <p className="text-[11px] text-neutral-400 mt-1">
                        Try adjusting your filters or search terms, or verify your campaign runs.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED INSIGHTS DRAWER */}
      <AnimatePresence>
        {activePerson && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivePerson(null)}
              className="fixed inset-0 bg-neutral-950 z-50 backdrop-blur-xs"
            />

            {/* Right Drawer */}
            <motion.div
              initial={{ translateX: '100%' }}
              animate={{ translateX: 0 }}
              exit={{ translateX: '100%' }}
              transition={{ type: 'tween', duration: 0.35, ease: 'easeOut' }}
              className="fixed inset-y-0 right-0 w-full md:max-w-2xl bg-[#f8fafc] shadow-2xl z-50 flex flex-col h-screen select-none border-l border-neutral-200 text-neutral-800"
            >
              {/* Header */}
              <div className="bg-white border-b border-neutral-200 px-6 py-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#2563eb]">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-950">{activePerson.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-neutral-500 font-medium">{activePerson.contact}</span>
                      <span className="text-neutral-300 text-[10px]">•</span>
                      <span className="text-[10px] text-neutral-500 font-bold">{activePerson.role} at {activePerson.company}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Status Quality Indicator */}
                  {activePerson.dataQuality === 'Sufficient' ? (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                      <CheckCircle size={10} />
                      High Confidence Profile
                    </span>
                  ) : (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <AlertCircle size={10} />
                      Insufficient Footprint
                    </span>
                  )}
                  <button
                    onClick={() => setActivePerson(null)}
                    className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Main Content Area - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                
                {/* 1. DATA QUALITY WARNING / INSUFFICIENT STATE */}
                {activePerson.dataQuality === 'Insufficient' ? (
                  <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs flex flex-col items-center text-center max-w-md mx-auto my-12 space-y-4">
                    <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                      <Lock size={22} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-800">Profiling Redacted (Insufficient Evidence)</h4>
                      <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                        Under Zenith's psychological profiling guidelines, behavioral modeling is strictly disabled for profiles with fewer than 4 validated registry data points. This ensures profile confidence rates exceed 85% and protects against false profiling assumptions.
                      </p>
                    </div>
                    <div className="pt-2 text-left border-t border-neutral-100 w-full">
                      <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">Registry Audit Details:</span>
                      <ul className="text-[10px] text-neutral-500 space-y-1 mt-1.5 list-disc pl-4">
                        <li>Filing declarations: 1 mismatch detected</li>
                        <li>Digital touchpoints: 1 of 5 minimum</li>
                        <li>RACE Qualification Score: Failed</li>
                      </ul>
                    </div>
                    <button
                      onClick={() => setActivePerson(null)}
                      className="w-full text-center py-2 text-xs font-bold text-neutral-600 hover:text-neutral-800 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-all cursor-pointer"
                    >
                      Close Panel
                    </button>
                  </div>
                ) : (
                  <>
                    {/* 2. PERSONA SUMMARY */}
                    <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-3">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="text-amber-500 animate-pulse" size={14} />
                        <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Actionable Persona Strategy</span>
                      </div>
                      <p className="text-xs font-semibold text-neutral-800 leading-relaxed italic bg-neutral-50/50 border-l-2 border-blue-500 p-3 rounded-r-lg">
                        "{activePerson.personaSummary}"
                      </p>
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-neutral-100 text-[11px] text-neutral-500">
                        <div>
                          <strong>Region Focus:</strong> {activePerson.location}
                        </div>
                        <div>
                          <strong>Source Campaign:</strong> {activePerson.sourceCampaignName}
                        </div>
                      </div>
                    </div>

                    {/* 3. TOP 3 RECOMMENDATION CATEGORIES */}
                    <div className="space-y-3">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">Top 3 Targeted Recommendations</span>
                      <div className="grid grid-cols-1 gap-3">
                        {activePerson.topCategories?.map((cat, idx) => (
                          <div 
                            key={idx}
                            className="group relative bg-white border border-neutral-200 hover:border-blue-200 rounded-xl p-4 transition-all hover:shadow-xs"
                          >
                            <div className="flex items-start gap-4">
                              {/* Rank Circle */}
                              <div className="w-7 h-7 rounded-full bg-blue-50 text-[#2563eb] flex items-center justify-center font-extrabold text-xs shrink-0 mt-0.5 border border-blue-100">
                                {cat.rank}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-extrabold text-neutral-800 group-hover:text-blue-600 transition-colors">
                                  {cat.name}
                                </h4>
                                <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                                  {cat.rationale}
                                </p>

                                {/* Hover / Tap Evidence details bar */}
                                <div className="flex items-center gap-4 mt-3 pt-2.5 border-t border-dashed border-neutral-100 text-[10px] text-neutral-400">
                                  <div className="flex items-center gap-1">
                                    <span className="font-bold text-neutral-500">Evidence Strength:</span>
                                    <span className="font-extrabold text-[#2563eb]">{cat.evidenceStrength}/10</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="font-bold text-neutral-500">Psychological Fit:</span>
                                    <span className="font-extrabold text-[#2563eb]">{cat.psychFit}/10</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 4. THREE DRILL-DOWN DRIVER PANELS */}
                    <div className="space-y-4">
                      <div className="border-t border-neutral-200 pt-5">
                        <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">Evidence Reasoning (Driver Panels)</span>
                        <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                          Verify the underlying behavioral footprints. Hover over individual axis points to view precise scoring.
                        </p>
                      </div>

                      {/* Display Hover State box */}
                      <div className="h-10 bg-blue-50/50 border border-blue-100 rounded-lg flex items-center justify-between px-4 text-xs font-semibold text-neutral-700 transition-all">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          <span>Interactive Dimension Reader:</span>
                        </div>
                        {hoveredDimension ? (
                          <div className="text-blue-700 font-extrabold">
                            {hoveredDimension.name}: <span className="text-neutral-800 font-black">{hoveredDimension.value.toFixed(1)}/10</span>
                          </div>
                        ) : (
                          <span className="text-neutral-400 text-[11px] font-normal italic">Hover over axes below for detailed parameters</span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* 4a. Motivational Drivers */}
                        <div className="bg-white border border-neutral-200 rounded-xl p-4 flex flex-col justify-between items-center text-center">
                          <div>
                            <h5 className="text-[11px] font-bold text-neutral-800 uppercase tracking-wide">Motivational Drivers</h5>
                            <span className="text-[9px] text-neutral-400 block mt-0.5">6 Core Dimensions</span>
                          </div>
                          
                          <div className="my-4">
                            <RadarChartSVG 
                              data={activePerson.motivationalDrivers || []} 
                              color="rgb(37, 99, 235)" 
                              onHoverDimension={setHoveredDimension}
                            />
                          </div>

                          <div className="text-[10px] text-neutral-400 italic">
                            Motivator Focus (Security & Legacy)
                          </div>
                        </div>

                        {/* 4b. Big Five */}
                        <div className="bg-white border border-neutral-200 rounded-xl p-4 flex flex-col justify-between items-center text-center">
                          <div>
                            <h5 className="text-[11px] font-bold text-neutral-800 uppercase tracking-wide">Big Five Personality</h5>
                            <span className="text-[9px] text-neutral-400 block mt-0.5">OCEAN Dimension Array</span>
                          </div>
                          
                          <div className="my-4">
                            <RadarChartSVG 
                              data={activePerson.bigFivePersonality || []} 
                              color="rgb(13, 148, 136)" 
                              onHoverDimension={setHoveredDimension}
                            />
                          </div>

                          <div className="text-[10px] text-neutral-400 italic">
                            Acoustic/Profiling Fit
                          </div>
                        </div>

                        {/* 4c. Behavioral & Digital */}
                        <div className="bg-white border border-neutral-200 rounded-xl p-4 flex flex-col justify-between items-center text-center">
                          <div>
                            <h5 className="text-[11px] font-bold text-neutral-800 uppercase tracking-wide">Behavioral & Digital</h5>
                            <span className="text-[9px] text-neutral-400 block mt-0.5">7 Engagement Channels</span>
                          </div>
                          
                          <div className="my-4">
                            <RadarChartSVG 
                              data={activePerson.behavioralDigitalProfile || []} 
                              color="rgb(124, 58, 237)" 
                              onHoverDimension={setHoveredDimension}
                            />
                          </div>

                          <div className="text-[10px] text-neutral-400 italic">
                            Channel Preference Metrics
                          </div>
                        </div>

                      </div>

                    </div>
                  </>
                )}

              </div>

              {/* Drawer Footer */}
              <div className="bg-white border-t border-neutral-200 p-5 flex items-center justify-between shrink-0">
                <span className="text-[10px] text-neutral-400 font-medium">
                  ID Ref: {activePerson.id}
                </span>
                <button
                  onClick={() => setActivePerson(null)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-neutral-800 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Close Insights
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* EXPORT SAFETY CONFIRMATION MODAL */}
      <AnimatePresence>
        {showExportDetailConfirmation && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExportDetailConfirmation(false)}
              className="fixed inset-0 bg-neutral-950 z-50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl border border-neutral-200 shadow-2xl p-6 z-50 w-full max-w-md select-none text-neutral-800"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Lock size={20} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-neutral-950">Security & Privacy Protocol</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    You are attempting a bulk export carrying detailed psychological profiles, driver rationales, and OCEAN personality vectors for <strong className="text-neutral-800">{filteredPeople.length}</strong> individuals. 
                  </p>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Under Zenith's internal data governance and GDPR-compliant client contracts, profiling insights must be guarded. Bulk pulls of psychological data must be logged and require deliberate, explicit operational confirmation.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setShowExportDetailConfirmation(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel Export
                </button>
                <button
                  onClick={triggerExportFullDetails}
                  className="px-3.5 py-2 text-xs font-bold bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Accept & Download Package</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* FLOATING SUCCESS TOASTS */}
      <AnimatePresence>
        {isExportSummaryToast && (
          <motion.div
            initial={{ translateY: 50, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            exit={{ translateY: 50, opacity: 0 }}
            className="fixed bottom-6 right-6 bg-[#0b0c0e] text-white px-4 py-3 rounded-xl shadow-2xl border border-white/10 z-50 flex items-center gap-2.5 select-none text-xs"
          >
            <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center">
              <CheckCircle size={12} />
            </div>
            <span className="font-medium text-neutral-100">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
