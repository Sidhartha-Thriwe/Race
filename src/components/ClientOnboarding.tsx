import React, { useState, useRef } from 'react';
import { 
  Building2, 
  PlusCircle, 
  Car, 
  Building, 
  Watch, 
  Globe, 
  Linkedin, 
  Twitter, 
  Instagram, 
  UploadCloud, 
  FileText, 
  File, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  X, 
  Mail, 
  DollarSign, 
  ShoppingBag, 
  Edit3, 
  RotateCcw,
  Sparkles,
  Loader2,
  Check,
  AlertCircle,
  Target,
  ExternalLink,
  Eye,
  Trash2
} from 'lucide-react';
import { GeneratingReportScreen } from './GeneratingReportScreen';
import { ClientProfileReport } from './ClientProfileReport';

export type ClientIndustry = 'Automobile' | 'Real Estate' | 'Luxury Watches';
export type PurchaseChannel = 'Offline' | 'Online' | 'Both';

export interface UploadedFileItem {
  id: string;
  name: string;
  size: string;
  type: string;
}

export interface OnboardedClient {
  id: string;
  clientName: string;
  industry: ClientIndustry;
  businessLines: string[];
  digitalPresence: {
    website?: string;
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    competitorWebsites?: string[]; // Top 3 competitor website links
  };
  brandGuidelinesFile?: UploadedFileItem | null;
  salesMaterials: UploadedFileItem[];
  avgTicketSize: number;
  categoryTicketSizes?: Record<string, number>; // per product category ticket size
  purchaseChannel: PurchaseChannel;
  adminEmail: string;
  status: 'Invite sent';
  dateOnboarded: string;
}

const INDUSTRY_BUSINESS_LINES: Record<ClientIndustry, string[]> = {
  'Automobile': ['New Sale', 'Resale', 'Services', 'Parts'],
  'Real Estate': ['New Launch', 'Resale', 'Rentals / Leasing', 'Commercial'],
  'Luxury Watches': ['New Watches', 'Pre-owned', 'Servicing & Repairs', 'Accessories']
};

const INITIAL_CLIENTS: OnboardedClient[] = [];

export const ClientOnboarding: React.FC = () => {
  // Session-persisted clients list (starts empty with no default clients)
  const [clients, setClients] = useState<OnboardedClient[]>(INITIAL_CLIENTS);
  const [selectedClientForView, setSelectedClientForView] = useState<OnboardedClient | null>(null);
  const [clientToDelete, setClientToDelete] = useState<OnboardedClient | null>(null);

  const handleDeleteClient = (client: OnboardedClient) => {
    setClients(prev => prev.filter(c => c.id !== client.id));
    if (selectedClientForView?.id === client.id) {
      setSelectedClientForView(null);
    }
    setClientToDelete(null);
  };
  
  // View states: 'list' | 'stepper' | 'review' | 'generating_report' | 'profile'
  const [view, setView] = useState<'list' | 'stepper' | 'review' | 'generating_report' | 'profile'>('list');
  const [activeReportClient, setActiveReportClient] = useState<OnboardedClient | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1); // 1 to 7

  // Form State
  const [clientName, setClientName] = useState<string>('');
  const [industry, setIndustry] = useState<ClientIndustry | null>(null);
  const [businessLines, setBusinessLines] = useState<string[]>([]);
  const [website, setWebsite] = useState<string>('');
  const [linkedin, setLinkedin] = useState<string>('');
  const [twitter, setTwitter] = useState<string>('');
  const [instagram, setInstagram] = useState<string>('');
  const [competitor1, setCompetitor1] = useState<string>('');
  const [competitor2, setCompetitor2] = useState<string>('');
  const [competitor3, setCompetitor3] = useState<string>('');
  const [brandGuidelines, setBrandGuidelines] = useState<UploadedFileItem | null>(null);
  const [salesMaterials, setSalesMaterials] = useState<UploadedFileItem[]>([]);
  const [avgTicketSize, setAvgTicketSize] = useState<string>('');
  const [categoryTicketSizes, setCategoryTicketSizes] = useState<Record<string, string>>({});
  const [purchaseChannel, setPurchaseChannel] = useState<PurchaseChannel | null>(null);
  const [adminEmail, setAdminEmail] = useState<string>('');

  // Validation / Error states
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Last onboarded client for success screen
  const [lastOnboardedClient, setLastOnboardedClient] = useState<{ clientName: string; adminEmail: string } | null>(null);

  // Hidden file inputs
  const brandFileInputRef = useRef<HTMLInputElement>(null);
  const salesFileInputRef = useRef<HTMLInputElement>(null);

  // Reset form
  const resetForm = () => {
    setClientName('');
    setIndustry(null);
    setBusinessLines([]);
    setWebsite('');
    setLinkedin('');
    setTwitter('');
    setInstagram('');
    setCompetitor1('');
    setCompetitor2('');
    setCompetitor3('');
    setBrandGuidelines(null);
    setSalesMaterials([]);
    setAvgTicketSize('');
    setCategoryTicketSizes({});
    setPurchaseChannel(null);
    setAdminEmail('');
    setErrors({});
    setCurrentStep(1);
  };

  const handleStartOnboarding = () => {
    resetForm();
    setView('stepper');
  };

  // Industry change handler (clears business lines to prevent carrying over invalid selections)
  const handleIndustrySelect = (selectedInd: ClientIndustry) => {
    if (industry !== selectedInd) {
      setIndustry(selectedInd);
      setBusinessLines([]); // Clear business lines
      setCategoryTicketSizes({}); // Clear per-category ticket sizes
      if (errors.industry) {
        setErrors(prev => ({ ...prev, industry: '' }));
      }
    }
  };

  const toggleBusinessLine = (line: string) => {
    setBusinessLines(prev => {
      const exists = prev.includes(line);
      const updated = exists ? prev.filter(item => item !== line) : [...prev, line];
      if (updated.length > 0 && errors.businessLines) {
        setErrors(err => ({ ...err, businessLines: '' }));
      }
      return updated;
    });
  };

  // Basic URL validator helper
  const isValidUrl = (url: string): boolean => {
    if (!url.trim()) return true;
    try {
      const toTest = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
      const parsed = new URL(toTest);
      return Boolean(parsed.hostname && parsed.hostname.includes('.'));
    } catch {
      return false;
    }
  };

  // Basic Email validator helper
  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  // Format file size helper
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // File upload simulation handlers
  const handleBrandFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBrandGuidelines({
        id: `file-${Date.now()}`,
        name: file.name,
        size: formatBytes(file.size),
        type: file.type || 'document'
      });
    }
    if (e.target) e.target.value = '';
  };

  const handleSalesFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newItems: UploadedFileItem[] = Array.from(files).map((f: File, idx: number) => ({
        id: `sales-file-${Date.now()}-${idx}`,
        name: f.name,
        size: formatBytes(f.size),
        type: f.type || 'document'
      }));
      setSalesMaterials(prev => [...prev, ...newItems]);
    }
    if (e.target) e.target.value = '';
  };

  // Step Validator
  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!clientName.trim()) {
        newErrors.clientName = 'Client name is required.';
      }
      if (!industry) {
        newErrors.industry = 'Please select an industry.';
      }
    } else if (currentStep === 2) {
      if (businessLines.length === 0) {
        newErrors.businessLines = 'Select at least one business line.';
      }
    } else if (currentStep === 3) {
      if (website && !isValidUrl(website)) {
        newErrors.website = 'Enter a valid website URL (e.g., https://company.com).';
      }
      if (linkedin && !isValidUrl(linkedin)) {
        newErrors.linkedin = 'Enter a valid LinkedIn URL.';
      }
      if (twitter && !isValidUrl(twitter)) {
        newErrors.twitter = 'Enter a valid Twitter/X URL.';
      }
      if (instagram && !isValidUrl(instagram)) {
        newErrors.instagram = 'Enter a valid Instagram URL.';
      }
      if (competitor1 && !isValidUrl(competitor1)) {
        newErrors.competitor1 = 'Enter a valid competitor website URL (e.g., https://competitor1.com).';
      }
      if (competitor2 && !isValidUrl(competitor2)) {
        newErrors.competitor2 = 'Enter a valid competitor website URL (e.g., https://competitor2.com).';
      }
      if (competitor3 && !isValidUrl(competitor3)) {
        newErrors.competitor3 = 'Enter a valid competitor website URL (e.g., https://competitor3.com).';
      }
    } else if (currentStep === 6) {
      if (businessLines.length > 0) {
        businessLines.forEach((cat) => {
          const raw = (categoryTicketSizes[cat] || '').replace(/,/g, '').trim();
          if (!raw || isNaN(Number(raw)) || Number(raw) <= 0) {
            newErrors[`ticket_${cat}`] = `Enter a valid average ticket size for ${cat}.`;
          }
        });
      } else {
        const cleanTicket = avgTicketSize.replace(/,/g, '').trim();
        if (!cleanTicket || isNaN(Number(cleanTicket)) || Number(cleanTicket) <= 0) {
          newErrors.avgTicketSize = 'Please enter a valid ticket size amount in ₹.';
        }
      }
      if (!purchaseChannel) {
        newErrors.purchaseChannel = 'Please select a purchase channel.';
      }
    } else if (currentStep === 7) {
      if (!adminEmail.trim()) {
        newErrors.adminEmail = 'Admin email address is required.';
      } else if (!isValidEmail(adminEmail)) {
        newErrors.adminEmail = 'Enter a valid email address.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    
    if (currentStep < 7) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Finished step 7 -> go to Review
      setView('review');
    }
  };

  const handleSkip = () => {
    setErrors({});
    if (currentStep < 7) {
      setCurrentStep(prev => prev + 1);
    } else {
      setView('review');
    }
  };

  const handleBack = () => {
    setErrors({});
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      setView('list');
    }
  };

  // Submit and send invite handler -> transitions immediately to graphical generating_report loading screen
  const handleSubmitAndInvite = () => {
    const compWebsites = [competitor1.trim(), competitor2.trim(), competitor3.trim()].filter(Boolean);

    const numericCategoryTicketSizes: Record<string, number> = {};
    let ticketSum = 0;
    let ticketCount = 0;
    businessLines.forEach((cat) => {
      const raw = (categoryTicketSizes[cat] || '').replace(/,/g, '').trim();
      const num = parseFloat(raw);
      if (!isNaN(num) && num > 0) {
        numericCategoryTicketSizes[cat] = num;
        ticketSum += num;
        ticketCount += 1;
      }
    });

    const fallbackTicket = parseFloat(avgTicketSize.replace(/,/g, '')) || 0;
    const finalBlendedAvgTicket = ticketCount > 0 ? Math.round(ticketSum / ticketCount) : fallbackTicket;

    const newClient: OnboardedClient = {
      id: `CLIENT-${Date.now().toString().slice(-5)}`,
      clientName: clientName.trim(),
      industry: industry!,
      businessLines: [...businessLines],
      digitalPresence: {
        website: website.trim() || undefined,
        linkedin: linkedin.trim() || undefined,
        twitter: twitter.trim() || undefined,
        instagram: instagram.trim() || undefined,
        competitorWebsites: compWebsites.length > 0 ? compWebsites : undefined
      },
      brandGuidelinesFile: brandGuidelines,
      salesMaterials: [...salesMaterials],
      avgTicketSize: finalBlendedAvgTicket,
      categoryTicketSizes: Object.keys(numericCategoryTicketSizes).length > 0 ? numericCategoryTicketSizes : undefined,
      purchaseChannel: purchaseChannel!,
      adminEmail: adminEmail.trim(),
      status: 'Invite sent',
      dateOnboarded: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    setClients(prev => [newClient, ...prev]);
    setLastOnboardedClient({ clientName: clientName.trim(), adminEmail: adminEmail.trim() });
    setActiveReportClient(newClient);
    setView('generating_report');
  };

  // Format currency display helper
  const formatINR = (val: number): string => {
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-6 pb-20 font-sans" id="client-onboarding-container">
      
      {/* LANDING PAGE / CLIENT LIST VIEW */}
      {view === 'list' && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-neutral-200 rounded-xl p-6 shadow-2xs">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-[#2563eb] rounded-lg">
                  <Building2 size={20} />
                </div>
                <h1 className="text-xl font-bold text-neutral-900">Client Onboarding</h1>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Configure and onboard new enterprise client accounts into the RACE platform.
              </p>
            </div>

            <button
              onClick={handleStartOnboarding}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-98 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
              id="onboard_new_client_btn"
            >
              <PlusCircle size={15} />
              <span>Onboard new client</span>
            </button>
          </div>

          {/* Table or Empty State */}
          {clients.length === 0 ? (
            <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center shadow-2xs">
              <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-400">
                <Building2 size={26} />
              </div>
              <h3 className="text-sm font-bold text-neutral-800">No clients onboarded yet.</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                No enterprise accounts have been configured in this session. Start by onboarding your first client.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handleStartOnboarding}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg shadow-xs transition-all cursor-pointer"
                >
                  <PlusCircle size={14} />
                  <span>Onboard new client</span>
                </button>
                <button
                  onClick={() => {
                    setActiveReportClient(null);
                    setView('profile');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg transition-all cursor-pointer border border-neutral-200"
                >
                  <FileText size={14} />
                  <span>Explore Sample Report (Aurelia Watches)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-neutral-200 rounded-xl shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
                <h2 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Session Onboarded Clients ({clients.length})
                </h2>
                <span className="text-[11px] text-neutral-400 font-mono">
                  State held in browser session
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-200 text-[11px] uppercase tracking-wider">
                      <th className="px-6 py-3.5">Client name</th>
                      <th className="px-6 py-3.5">Industry</th>
                      <th className="px-6 py-3.5">Business lines</th>
                      <th className="px-6 py-3.5">Top Competitors</th>
                      <th className="px-6 py-3.5">Purchase channel</th>
                      <th className="px-6 py-3.5">Admin email</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 bg-white">
                    {clients.map((c) => (
                      <tr key={c.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-neutral-900">{c.clientName}</div>
                          <div className="text-[10px] text-neutral-400 font-mono mt-0.5">{c.id} · {c.dateOnboarded}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-neutral-100 text-neutral-800 border border-neutral-200/80">
                            {c.industry === 'Automobile' && <Car size={12} className="text-blue-600" />}
                            {c.industry === 'Real Estate' && <Building size={12} className="text-amber-600" />}
                            {c.industry === 'Luxury Watches' && <Watch size={12} className="text-purple-600" />}
                            <span>{c.industry}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {c.businessLines.map((line, idx) => (
                              <span key={idx} className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 font-medium rounded border border-blue-100">
                                {line}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {c.digitalPresence?.competitorWebsites && c.digitalPresence.competitorWebsites.length > 0 ? (
                            <div className="flex flex-col gap-1 max-w-[200px]">
                              <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-neutral-700">
                                <Target size={11} className="text-[#2563eb]" />
                                <span>{c.digitalPresence.competitorWebsites.length} Competitors</span>
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {c.digitalPresence.competitorWebsites.map((comp, idx) => {
                                  const displayDomain = comp.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
                                  return (
                                    <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-neutral-100 text-neutral-600 font-mono rounded truncate max-w-[130px]" title={comp}>
                                      {displayDomain}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-neutral-400 italic">None</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-semibold text-neutral-700">
                          {c.purchaseChannel}
                        </td>
                        <td className="px-6 py-4 font-mono text-neutral-600">
                          {c.adminEmail}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{c.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setActiveReportClient(c);
                                setView('profile');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#2563eb] hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                              title="View Client Intelligence Report"
                            >
                              <FileText size={13} />
                              <span>Report</span>
                            </button>
                            <button
                              onClick={() => setSelectedClientForView(c)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-neutral-600 hover:text-[#2563eb] hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
                              title="View Full Profile & Competitor Links"
                            >
                              <Eye size={13} />
                              <span>View</span>
                            </button>
                            <button
                              onClick={() => setClientToDelete(c)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                              title="Delete Client"
                            >
                              <Trash2 size={13} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEPPER FORM VIEW */}
      {view === 'stepper' && (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Top Progress & Header Bar */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#2563eb] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                  Step {currentStep} of 7
                </span>
                <h2 className="text-base font-bold text-neutral-900 mt-2">
                  {currentStep === 1 && 'Client & Industry'}
                  {currentStep === 2 && 'Business Lines'}
                  {currentStep === 3 && 'Digital Presence (Optional)'}
                  {currentStep === 4 && 'Brand Guidelines (Optional)'}
                  {currentStep === 5 && 'Sales Material (Optional)'}
                  {currentStep === 6 && 'Commercials'}
                  {currentStep === 7 && 'Admin Access'}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setView('list')}
                className="text-xs font-semibold text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {/* Stepper Progress Bar */}
            <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-[#2563eb] h-full transition-all duration-300 rounded-full"
                style={{ width: `${(currentStep / 7) * 100}%` }}
              />
            </div>
          </div>

          {/* STEP 1: CLIENT & INDUSTRY */}
          {currentStep === 1 && (
            <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-2xs space-y-6">
              {/* Client Name Input */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                  Client Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Motors Luxury Group"
                  value={clientName}
                  onChange={(e) => {
                    setClientName(e.target.value);
                    if (errors.clientName) setErrors(prev => ({ ...prev, clientName: '' }));
                  }}
                  className={`w-full px-3.5 py-2.5 text-xs bg-neutral-50 hover:bg-white focus:bg-white border rounded-lg focus:outline-hidden focus:ring-1 transition-all ${
                    errors.clientName ? 'border-rose-300 focus:ring-rose-500' : 'border-neutral-200 focus:ring-[#2563eb]'
                  }`}
                  id="client_name_input"
                />
                {errors.clientName && (
                  <p className="text-[11px] text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                    <AlertCircle size={12} />
                    <span>{errors.clientName}</span>
                  </p>
                )}
              </div>

              {/* Industry Cards Single Select */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                  Select Industry <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-neutral-500 mb-3">
                  Selecting an industry configures the business line catalog for this account.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Automobile */}
                  <div
                    onClick={() => handleIndustrySelect('Automobile')}
                    className={`border rounded-xl p-4 cursor-pointer transition-all flex flex-col justify-between ${
                      industry === 'Automobile'
                        ? 'border-[#2563eb] bg-blue-50/50 shadow-xs ring-1 ring-[#2563eb]'
                        : 'border-neutral-200 hover:border-neutral-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className={`p-2.5 rounded-lg w-fit mb-3 ${
                        industry === 'Automobile' ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-600'
                      }`}>
                        <Car size={18} />
                      </div>
                      <h4 className="text-xs font-bold text-neutral-900">Automobile</h4>
                      <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                        Passenger vehicles, commercial fleets, EV mobility, luxury auto.
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-neutral-400">4 Business Lines</span>
                      {industry === 'Automobile' && (
                        <span className="w-5 h-5 rounded-full bg-[#2563eb] text-white flex items-center justify-center">
                          <Check size={12} />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Real Estate */}
                  <div
                    onClick={() => handleIndustrySelect('Real Estate')}
                    className={`border rounded-xl p-4 cursor-pointer transition-all flex flex-col justify-between ${
                      industry === 'Real Estate'
                        ? 'border-[#2563eb] bg-blue-50/50 shadow-xs ring-1 ring-[#2563eb]'
                        : 'border-neutral-200 hover:border-neutral-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className={`p-2.5 rounded-lg w-fit mb-3 ${
                        industry === 'Real Estate' ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-600'
                      }`}>
                        <Building size={18} />
                      </div>
                      <h4 className="text-xs font-bold text-neutral-900">Real Estate</h4>
                      <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                        Residential towers, luxury villas, commercial developments, leasing.
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-neutral-400">4 Business Lines</span>
                      {industry === 'Real Estate' && (
                        <span className="w-5 h-5 rounded-full bg-[#2563eb] text-white flex items-center justify-center">
                          <Check size={12} />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Luxury Watches */}
                  <div
                    onClick={() => handleIndustrySelect('Luxury Watches')}
                    className={`border rounded-xl p-4 cursor-pointer transition-all flex flex-col justify-between ${
                      industry === 'Luxury Watches'
                        ? 'border-[#2563eb] bg-blue-50/50 shadow-xs ring-1 ring-[#2563eb]'
                        : 'border-neutral-200 hover:border-neutral-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className={`p-2.5 rounded-lg w-fit mb-3 ${
                        industry === 'Luxury Watches' ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-600'
                      }`}>
                        <Watch size={18} />
                      </div>
                      <h4 className="text-xs font-bold text-neutral-900">Luxury Watches</h4>
                      <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                        Haute horlogerie, certified pre-owned, servicing & horology accessories.
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-neutral-400">4 Business Lines</span>
                      {industry === 'Luxury Watches' && (
                        <span className="w-5 h-5 rounded-full bg-[#2563eb] text-white flex items-center justify-center">
                          <Check size={12} />
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {errors.industry && (
                  <p className="text-[11px] text-rose-500 mt-2 flex items-center gap-1 font-medium">
                    <AlertCircle size={12} />
                    <span>{errors.industry}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: BUSINESS LINES */}
          {currentStep === 2 && (
            <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-2xs space-y-5">
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Business Lines for {industry || 'Selected Industry'} <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-neutral-500 mb-4">
                  Select at least one operating vertical active for this client.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {industry && INDUSTRY_BUSINESS_LINES[industry].map((line) => {
                    const isSelected = businessLines.includes(line);
                    return (
                      <label
                        key={line}
                        onClick={() => toggleBusinessLine(line)}
                        className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition-all select-none ${
                          isSelected
                            ? 'border-[#2563eb] bg-blue-50/50 shadow-2xs'
                            : 'border-neutral-200 hover:border-neutral-300 bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // handled by label onClick
                          className="w-4 h-4 text-[#2563eb] rounded border-neutral-300 focus:ring-[#2563eb]"
                        />
                        <span className="text-xs font-bold text-neutral-800">{line}</span>
                      </label>
                    );
                  })}
                </div>

                {errors.businessLines && (
                  <p className="text-[11px] text-rose-500 mt-3 flex items-center gap-1 font-medium">
                    <AlertCircle size={12} />
                    <span>{errors.businessLines}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: DIGITAL PRESENCE (OPTIONAL) */}
          {currentStep === 3 && (
            <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-neutral-800">Online & Social Handles</h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Optional links used for brand verification and domain discovery.
                  </p>
                </div>
                <span className="text-[10.5px] px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded font-semibold">
                  Optional
                </span>
              </div>

              {/* Website */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Website URL</label>
                <div className="relative">
                  <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="https://www.company.com"
                    value={website}
                    onChange={(e) => {
                      setWebsite(e.target.value);
                      if (errors.website) setErrors(prev => ({ ...prev, website: '' }));
                    }}
                    className={`w-full pl-9 pr-3.5 py-2 text-xs bg-neutral-50 hover:bg-white focus:bg-white border rounded-lg focus:outline-hidden focus:ring-1 transition-all ${
                      errors.website ? 'border-rose-300 focus:ring-rose-500' : 'border-neutral-200 focus:ring-[#2563eb]'
                    }`}
                  />
                </div>
                {errors.website && <p className="text-[11px] text-rose-500 mt-1">{errors.website}</p>}
              </div>

              {/* LinkedIn */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">LinkedIn Profile</label>
                <div className="relative">
                  <Linkedin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="https://linkedin.com/company/handle"
                    value={linkedin}
                    onChange={(e) => {
                      setLinkedin(e.target.value);
                      if (errors.linkedin) setErrors(prev => ({ ...prev, linkedin: '' }));
                    }}
                    className={`w-full pl-9 pr-3.5 py-2 text-xs bg-neutral-50 hover:bg-white focus:bg-white border rounded-lg focus:outline-hidden focus:ring-1 transition-all ${
                      errors.linkedin ? 'border-rose-300 focus:ring-rose-500' : 'border-neutral-200 focus:ring-[#2563eb]'
                    }`}
                  />
                </div>
                {errors.linkedin && <p className="text-[11px] text-rose-500 mt-1">{errors.linkedin}</p>}
              </div>

              {/* Twitter / X */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Twitter / X</label>
                <div className="relative">
                  <Twitter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="https://x.com/handle"
                    value={twitter}
                    onChange={(e) => {
                      setTwitter(e.target.value);
                      if (errors.twitter) setErrors(prev => ({ ...prev, twitter: '' }));
                    }}
                    className={`w-full pl-9 pr-3.5 py-2 text-xs bg-neutral-50 hover:bg-white focus:bg-white border rounded-lg focus:outline-hidden focus:ring-1 transition-all ${
                      errors.twitter ? 'border-rose-300 focus:ring-rose-500' : 'border-neutral-200 focus:ring-[#2563eb]'
                    }`}
                  />
                </div>
                {errors.twitter && <p className="text-[11px] text-rose-500 mt-1">{errors.twitter}</p>}
              </div>

              {/* Instagram */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Instagram</label>
                <div className="relative">
                  <Instagram size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="https://instagram.com/handle"
                    value={instagram}
                    onChange={(e) => {
                      setInstagram(e.target.value);
                      if (errors.instagram) setErrors(prev => ({ ...prev, instagram: '' }));
                    }}
                    className={`w-full pl-9 pr-3.5 py-2 text-xs bg-neutral-50 hover:bg-white focus:bg-white border rounded-lg focus:outline-hidden focus:ring-1 transition-all ${
                      errors.instagram ? 'border-rose-300 focus:ring-rose-500' : 'border-neutral-200 focus:ring-[#2563eb]'
                    }`}
                  />
                </div>
                {errors.instagram && <p className="text-[11px] text-rose-500 mt-1">{errors.instagram}</p>}
              </div>

              {/* TOP 3 COMPETITOR WEBSITES */}
              <div className="pt-5 border-t border-neutral-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                      <Target size={14} className="text-[#2563eb]" />
                      <span>Top 3 Competitor Website Links</span>
                    </h4>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Add up to 3 competitor websites for cross-domain benchmarking, intent modeling, and audience overlap intelligence.
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded border border-blue-100 shrink-0">
                    Competitive Intel
                  </span>
                </div>

                <div className="space-y-3 pt-1">
                  {/* Competitor 1 */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-neutral-700">Competitor 1 Website Link</label>
                      <span className="text-[10px] text-neutral-400 font-medium">Primary Competitor</span>
                    </div>
                    <div className="relative">
                      <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        placeholder="https://www.competitor1.com"
                        value={competitor1}
                        onChange={(e) => {
                          setCompetitor1(e.target.value);
                          if (errors.competitor1) setErrors(prev => ({ ...prev, competitor1: '' }));
                        }}
                        className={`w-full pl-9 pr-3.5 py-2 text-xs bg-neutral-50 hover:bg-white focus:bg-white border rounded-lg focus:outline-hidden focus:ring-1 transition-all ${
                          errors.competitor1 ? 'border-rose-300 focus:ring-rose-500' : 'border-neutral-200 focus:ring-[#2563eb]'
                        }`}
                      />
                    </div>
                    {errors.competitor1 && <p className="text-[11px] text-rose-500 mt-1">{errors.competitor1}</p>}
                  </div>

                  {/* Competitor 2 */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-neutral-700">Competitor 2 Website Link</label>
                      <span className="text-[10px] text-neutral-400 font-medium">Secondary Competitor</span>
                    </div>
                    <div className="relative">
                      <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        placeholder="https://www.competitor2.com"
                        value={competitor2}
                        onChange={(e) => {
                          setCompetitor2(e.target.value);
                          if (errors.competitor2) setErrors(prev => ({ ...prev, competitor2: '' }));
                        }}
                        className={`w-full pl-9 pr-3.5 py-2 text-xs bg-neutral-50 hover:bg-white focus:bg-white border rounded-lg focus:outline-hidden focus:ring-1 transition-all ${
                          errors.competitor2 ? 'border-rose-300 focus:ring-rose-500' : 'border-neutral-200 focus:ring-[#2563eb]'
                        }`}
                      />
                    </div>
                    {errors.competitor2 && <p className="text-[11px] text-rose-500 mt-1">{errors.competitor2}</p>}
                  </div>

                  {/* Competitor 3 */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-neutral-700">Competitor 3 Website Link</label>
                      <span className="text-[10px] text-neutral-400 font-medium">Tertiary Competitor</span>
                    </div>
                    <div className="relative">
                      <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        placeholder="https://www.competitor3.com"
                        value={competitor3}
                        onChange={(e) => {
                          setCompetitor3(e.target.value);
                          if (errors.competitor3) setErrors(prev => ({ ...prev, competitor3: '' }));
                        }}
                        className={`w-full pl-9 pr-3.5 py-2 text-xs bg-neutral-50 hover:bg-white focus:bg-white border rounded-lg focus:outline-hidden focus:ring-1 transition-all ${
                          errors.competitor3 ? 'border-rose-300 focus:ring-rose-500' : 'border-neutral-200 focus:ring-[#2563eb]'
                        }`}
                      />
                    </div>
                    {errors.competitor3 && <p className="text-[11px] text-rose-500 mt-1">{errors.competitor3}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: BRAND GUIDELINES (OPTIONAL) */}
          {currentStep === 4 && (
            <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-neutral-800">Brand Kit & Guidelines</h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Upload official branding PDFs, logos, or slide decks.
                  </p>
                </div>
                <span className="text-[10.5px] px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded font-semibold">
                  Optional
                </span>
              </div>

              {/* Hidden file input */}
              <input
                type="file"
                ref={brandFileInputRef}
                onChange={handleBrandFileUpload}
                accept=".pdf,.ppt,.pptx,.png,.jpg,.jpeg,.svg"
                className="hidden"
              />

              {!brandGuidelines ? (
                <div
                  onClick={() => brandFileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      setBrandGuidelines({
                        id: `file-${Date.now()}`,
                        name: file.name,
                        size: formatBytes(file.size),
                        type: file.type || 'document'
                      });
                    }
                  }}
                  className="border-2 border-dashed border-neutral-300 hover:border-[#2563eb] bg-neutral-50/60 hover:bg-blue-50/20 rounded-xl p-8 text-center cursor-pointer transition-all"
                >
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-2xs text-neutral-500">
                    <UploadCloud size={20} className="text-[#2563eb]" />
                  </div>
                  <h4 className="text-xs font-bold text-neutral-800">Click or drag file to upload</h4>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Accepts PDF, PPT, PPTX and high-res image files (Up to 25 MB)
                  </p>
                  <span className="inline-block mt-3 text-[10px] font-semibold text-neutral-400 bg-neutral-100 px-2.5 py-1 rounded-md">
                    Files stored in local session memory
                  </span>
                </div>
              ) : (
                <div className="border border-neutral-200 rounded-xl p-4 bg-neutral-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-100 text-blue-700 rounded-lg">
                      <FileText size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900">{brandGuidelines.name}</h4>
                      <p className="text-[10.5px] text-neutral-400 font-mono mt-0.5">{brandGuidelines.size}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBrandGuidelines(null)}
                    className="p-1.5 hover:bg-neutral-200 text-neutral-400 hover:text-neutral-700 rounded-lg transition-colors cursor-pointer"
                    title="Remove file"
                  >
                    <X size={15} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: SALES MATERIAL (OPTIONAL) */}
          {currentStep === 5 && (
            <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-neutral-800">Sales Decks & Product Catalogs</h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Upload collateral, product specification sheets, and pitch decks.
                  </p>
                </div>
                <span className="text-[10.5px] px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded font-semibold">
                  Optional
                </span>
              </div>

              {/* Hidden multi-file input */}
              <input
                type="file"
                ref={salesFileInputRef}
                onChange={handleSalesFileUpload}
                accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg"
                multiple
                className="hidden"
              />

              <div
                onClick={() => salesFileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const files = e.dataTransfer.files;
                  if (files && files.length > 0) {
                    const newItems: UploadedFileItem[] = Array.from(files).map((f: File, idx: number) => ({
                      id: `sales-file-${Date.now()}-${idx}`,
                      name: f.name,
                      size: formatBytes(f.size),
                      type: f.type || 'document'
                    }));
                    setSalesMaterials(prev => [...prev, ...newItems]);
                  }
                }}
                className="border-2 border-dashed border-neutral-300 hover:border-[#2563eb] bg-neutral-50/60 hover:bg-blue-50/20 rounded-xl p-8 text-center cursor-pointer transition-all"
              >
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-2xs text-neutral-500">
                  <UploadCloud size={20} className="text-[#2563eb]" />
                </div>
                <h4 className="text-xs font-bold text-neutral-800">Click or drag files to upload</h4>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Accepts PDF, PPT, DOC, DOCX and image files (Multi-file upload enabled)
                </p>
              </div>

              {/* Uploaded Chips List */}
              {salesMaterials.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h5 className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
                    Attached Sales Files ({salesMaterials.length})
                  </h5>
                  <div className="space-y-2">
                    {salesMaterials.map((file) => (
                      <div key={file.id} className="border border-neutral-200 rounded-lg p-3 bg-neutral-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <File size={15} className="text-blue-600 shrink-0" />
                          <div>
                            <span className="text-xs font-semibold text-neutral-800 block truncate max-w-sm">{file.name}</span>
                            <span className="text-[10px] text-neutral-400 font-mono">{file.size}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSalesMaterials(prev => prev.filter(f => f.id !== file.id))}
                          className="p-1 hover:bg-neutral-200 text-neutral-400 hover:text-neutral-700 rounded transition-colors cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 6: COMMERCIALS */}
          {currentStep === 6 && (
            <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-2xs space-y-6">
              {/* Average Ticket Size per Product Category */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-neutral-800">
                    Average Ticket Size <span className="text-rose-500">*</span>
                  </label>
                  {businessLines.length > 0 && (
                    <span className="text-[10.5px] px-2.5 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded-md border border-blue-100">
                      {businessLines.length} {businessLines.length === 1 ? 'Product Category' : 'Product Categories'} Selected
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-500 mb-3.5">
                  Set the average ticket size (in ₹) for each product category selected in Step 2.
                </p>

                {businessLines.length > 0 ? (
                  <div className="space-y-3">
                    {businessLines.map((cat) => {
                      const errorKey = `ticket_${cat}`;
                      const hasError = Boolean(errors[errorKey]);
                      return (
                        <div key={cat} className="p-3.5 bg-neutral-50/70 hover:bg-neutral-50 rounded-xl border border-neutral-200 transition-colors">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
                              <span>{cat}</span>
                            </span>
                            <span className="text-[10px] text-neutral-400 font-medium">Avg Ticket (₹)</span>
                          </div>
                          <div className="relative">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 font-bold text-xs font-mono">
                              ₹
                            </div>
                            <input
                              type="text"
                              placeholder={
                                cat.toLowerCase().includes('service') || cat.toLowerCase().includes('part')
                                  ? 'e.g. 50,000'
                                  : cat.toLowerCase().includes('rent') || cat.toLowerCase().includes('lease')
                                  ? 'e.g. 1,50,000'
                                  : 'e.g. 25,00,000'
                              }
                              value={categoryTicketSizes[cat] || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCategoryTicketSizes(prev => ({ ...prev, [cat]: val }));
                                if (errors[errorKey]) setErrors(prev => ({ ...prev, [errorKey]: '' }));
                              }}
                              className={`w-full pl-8 pr-3.5 py-2 text-xs bg-white border rounded-lg focus:outline-hidden focus:ring-1 font-mono transition-all ${
                                hasError ? 'border-rose-300 focus:ring-rose-500' : 'border-neutral-200 focus:ring-[#2563eb]'
                              }`}
                            />
                          </div>
                          {hasError && (
                            <p className="text-[11px] text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                              <AlertCircle size={12} />
                              <span>{errors[errorKey]}</span>
                            </p>
                          )}
                        </div>
                      );
                    })}

                    {businessLines.length > 1 && (
                      <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center justify-between text-xs text-blue-900">
                        <span className="text-[11px] font-medium text-neutral-600">Calculated Blended Average:</span>
                        <span className="font-mono font-bold text-[#2563eb]">
                          {(() => {
                            let sum = 0;
                            let count = 0;
                            businessLines.forEach(c => {
                              const num = parseFloat((categoryTicketSizes[c] || '').replace(/,/g, '').trim());
                              if (!isNaN(num) && num > 0) {
                                sum += num;
                                count += 1;
                              }
                            });
                            return count > 0 ? formatINR(Math.round(sum / count)) : '—';
                          })()}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
                    <AlertCircle size={16} className="text-amber-600 shrink-0" />
                    <span>No product categories were selected in Step 2. Please return to Step 2 to select at least one.</span>
                  </div>
                )}
              </div>

              {/* Purchase Channel Radio Group */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                  Purchase Channel <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-neutral-500 mb-3">
                  Select the primary conversion mechanism for client transactions.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['Offline', 'Online', 'Both'] as PurchaseChannel[]).map((chan) => {
                    const isSelected = purchaseChannel === chan;
                    return (
                      <label
                        key={chan}
                        onClick={() => {
                          setPurchaseChannel(chan);
                          if (errors.purchaseChannel) setErrors(prev => ({ ...prev, purchaseChannel: '' }));
                        }}
                        className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition-all select-none ${
                          isSelected
                            ? 'border-[#2563eb] bg-blue-50/50 shadow-2xs ring-1 ring-[#2563eb]'
                            : 'border-neutral-200 hover:border-neutral-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="purchaseChannel"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 text-[#2563eb] border-neutral-300 focus:ring-[#2563eb]"
                          />
                          <span className="text-xs font-bold text-neutral-900">{chan}</span>
                        </div>
                        <ShoppingBag size={14} className={isSelected ? 'text-[#2563eb]' : 'text-neutral-400'} />
                      </label>
                    );
                  })}
                </div>

                {errors.purchaseChannel && (
                  <p className="text-[11px] text-rose-500 mt-2 flex items-center gap-1 font-medium">
                    <AlertCircle size={12} />
                    <span>{errors.purchaseChannel}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 7: ADMIN ACCESS */}
          {currentStep === 7 && (
            <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-2xs space-y-5">
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                  Client Administrator Email ID <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="email"
                    placeholder="admin.contact@clientcompany.com"
                    value={adminEmail}
                    onChange={(e) => {
                      setAdminEmail(e.target.value);
                      if (errors.adminEmail) setErrors(prev => ({ ...prev, adminEmail: '' }));
                    }}
                    className={`w-full pl-9 pr-3.5 py-2.5 text-xs bg-neutral-50 hover:bg-white focus:bg-white border rounded-lg focus:outline-hidden focus:ring-1 transition-all ${
                      errors.adminEmail ? 'border-rose-300 focus:ring-rose-500' : 'border-neutral-200 focus:ring-[#2563eb]'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-neutral-500 mt-1.5 font-medium">
                  This person will receive the RACE admin invite.
                </p>
                {errors.adminEmail && (
                  <p className="text-[11px] text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                    <AlertCircle size={12} />
                    <span>{errors.adminEmail}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Bottom Action Bar */}
          <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-3">
              {/* Optional step skip link */}
              {(currentStep === 3 || currentStep === 4 || currentStep === 5) && (
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer px-2 py-1"
                >
                  Skip this step
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <span>{currentStep === 7 ? 'Review Details' : 'Continue'}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVIEW & SUBMIT SCREEN */}
      {view === 'review' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#2563eb] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                Final Review
              </span>
              <h2 className="text-base font-bold text-neutral-900 mt-2">
                Review Client Onboarding Details
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Verify the configuration below before sending the RACE administrative invite.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setCurrentStep(7);
                setView('stepper');
              }}
              className="text-xs font-semibold text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
            >
              Back to edit
            </button>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl shadow-2xs divide-y divide-neutral-100 overflow-hidden">
            {/* 1. Client & Industry */}
            <div className="p-5 flex items-start justify-between">
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Client & Industry
                </div>
                <div className="text-sm font-bold text-neutral-900">{clientName || 'Not provided'}</div>
                <div className="text-xs text-neutral-600 font-medium">{industry || 'Not provided'}</div>
              </div>
              <button
                onClick={() => {
                  setCurrentStep(1);
                  setView('stepper');
                }}
                className="flex items-center gap-1 text-xs font-bold text-[#2563eb] hover:text-[#1d4ed8] cursor-pointer"
              >
                <Edit3 size={12} />
                <span>Edit</span>
              </button>
            </div>

            {/* 2. Business Lines */}
            <div className="p-5 flex items-start justify-between">
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Business Lines
                </div>
                {businessLines.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {businessLines.map((line, idx) => (
                      <span key={idx} className="text-xs font-semibold px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-100">
                        {line}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-neutral-400 italic">Not provided</div>
                )}
              </div>
              <button
                onClick={() => {
                  setCurrentStep(2);
                  setView('stepper');
                }}
                className="flex items-center gap-1 text-xs font-bold text-[#2563eb] hover:text-[#1d4ed8] cursor-pointer"
              >
                <Edit3 size={12} />
                <span>Edit</span>
              </button>
            </div>

            {/* 3. Digital Presence & Competitors */}
            <div className="p-5 flex items-start justify-between">
              <div className="space-y-2.5 w-full pr-4">
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Digital Presence & Competitor Benchmarks
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
                  <div><span className="text-neutral-400 font-medium">Website: </span><span className="font-semibold text-neutral-800">{website || 'Not provided'}</span></div>
                  <div><span className="text-neutral-400 font-medium">LinkedIn: </span><span className="font-semibold text-neutral-800">{linkedin || 'Not provided'}</span></div>
                  <div><span className="text-neutral-400 font-medium">Twitter / X: </span><span className="font-semibold text-neutral-800">{twitter || 'Not provided'}</span></div>
                  <div><span className="text-neutral-400 font-medium">Instagram: </span><span className="font-semibold text-neutral-800">{instagram || 'Not provided'}</span></div>
                </div>

                {/* Top 3 Competitor Websites */}
                <div className="pt-2 border-t border-neutral-100">
                  <span className="text-[11px] text-neutral-500 font-semibold block mb-1.5">Top 3 Competitor Website Links:</span>
                  {(competitor1 || competitor2 || competitor3) ? (
                    <div className="flex flex-wrap gap-2">
                      {[competitor1, competitor2, competitor3].filter(Boolean).map((link, idx) => (
                        <a
                          key={idx}
                          href={link.startsWith('http') ? link : `https://${link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-md text-xs font-mono text-neutral-700 hover:text-blue-600 transition-colors"
                        >
                          <Globe size={12} className="text-[#2563eb]" />
                          <span>{link}</span>
                          <ExternalLink size={10} className="text-neutral-400" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-neutral-400 italic">None provided</div>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setCurrentStep(3);
                  setView('stepper');
                }}
                className="flex items-center gap-1 text-xs font-bold text-[#2563eb] hover:text-[#1d4ed8] cursor-pointer shrink-0"
              >
                <Edit3 size={12} />
                <span>Edit</span>
              </button>
            </div>

            {/* 4. Brand Guidelines */}
            <div className="p-5 flex items-start justify-between">
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Brand Guidelines
                </div>
                {brandGuidelines ? (
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-neutral-50 rounded-md border border-neutral-200 text-xs font-medium text-neutral-800">
                    <FileText size={13} className="text-blue-600" />
                    <span>{brandGuidelines.name}</span>
                    <span className="text-neutral-400 font-mono text-[10px]">({brandGuidelines.size})</span>
                  </div>
                ) : (
                  <div className="text-xs text-neutral-400 italic">Not provided</div>
                )}
              </div>
              <button
                onClick={() => {
                  setCurrentStep(4);
                  setView('stepper');
                }}
                className="flex items-center gap-1 text-xs font-bold text-[#2563eb] hover:text-[#1d4ed8] cursor-pointer"
              >
                <Edit3 size={12} />
                <span>Edit</span>
              </button>
            </div>

            {/* 5. Sales Materials */}
            <div className="p-5 flex items-start justify-between">
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Sales Material
                </div>
                {salesMaterials.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {salesMaterials.map((file) => (
                      <span key={file.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-50 rounded-md border border-neutral-200 text-xs font-medium text-neutral-800">
                        <File size={12} className="text-blue-600" />
                        <span>{file.name}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-neutral-400 italic">Not provided</div>
                )}
              </div>
              <button
                onClick={() => {
                  setCurrentStep(5);
                  setView('stepper');
                }}
                className="flex items-center gap-1 text-xs font-bold text-[#2563eb] hover:text-[#1d4ed8] cursor-pointer"
              >
                <Edit3 size={12} />
                <span>Edit</span>
              </button>
            </div>

            {/* 6. Commercials */}
            <div className="p-5 flex items-start justify-between">
              <div className="space-y-2 w-full pr-4">
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Commercials
                </div>
                <div className="text-xs space-y-2">
                  <div>
                    <span className="text-neutral-500 font-medium block mb-1.5">Average Ticket Size by Product Category:</span>
                    {businessLines.length > 0 ? (
                      <div className="space-y-1.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {businessLines.map((cat) => {
                            const raw = (categoryTicketSizes[cat] || '').replace(/,/g, '').trim();
                            const val = parseFloat(raw);
                            return (
                              <div key={cat} className="flex items-center justify-between p-2.5 bg-neutral-50 rounded-lg border border-neutral-100">
                                <span className="font-semibold text-neutral-700 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
                                  <span>{cat}</span>
                                </span>
                                <span className="font-mono font-bold text-neutral-900">
                                  {!isNaN(val) && val > 0 ? formatINR(val) : 'Not set'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        {businessLines.length > 1 && (
                          <div className="text-[11px] text-neutral-500 flex items-center gap-1 pt-0.5">
                            <span>Blended Average:</span>
                            <span className="font-mono font-bold text-neutral-900">
                              {(() => {
                                let sum = 0;
                                let count = 0;
                                businessLines.forEach(c => {
                                  const num = parseFloat((categoryTicketSizes[c] || '').replace(/,/g, '').trim());
                                  if (!isNaN(num) && num > 0) {
                                    sum += num;
                                    count += 1;
                                  }
                                });
                                return count > 0 ? formatINR(Math.round(sum / count)) : '—';
                              })()}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="font-bold text-neutral-900 font-mono">
                        {avgTicketSize ? formatINR(parseFloat(avgTicketSize.replace(/,/g, '')) || 0) : 'Not provided'}
                      </span>
                    )}
                  </div>
                  <div className="pt-1 border-t border-neutral-100">
                    <span className="text-neutral-400 font-medium">Purchase Channel: </span>
                    <span className="font-semibold text-neutral-800">{purchaseChannel || 'Not provided'}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setCurrentStep(6);
                  setView('stepper');
                }}
                className="flex items-center gap-1 text-xs font-bold text-[#2563eb] hover:text-[#1d4ed8] cursor-pointer shrink-0"
              >
                <Edit3 size={12} />
                <span>Edit</span>
              </button>
            </div>

            {/* 7. Admin Access */}
            <div className="p-5 flex items-start justify-between">
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Admin Access
                </div>
                <div className="text-xs font-mono font-bold text-neutral-900">{adminEmail || 'Not provided'}</div>
                <div className="text-[11px] text-neutral-400">Recipient of initial platform credentials</div>
              </div>
              <button
                onClick={() => {
                  setCurrentStep(7);
                  setView('stepper');
                }}
                className="flex items-center gap-1 text-xs font-bold text-[#2563eb] hover:text-[#1d4ed8] cursor-pointer"
              >
                <Edit3 size={12} />
                <span>Edit</span>
              </button>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setCurrentStep(7);
                setView('stepper');
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to Step 7</span>
            </button>

            <button
              type="button"
              onClick={handleSubmitAndInvite}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer active:scale-98"
              id="submit_send_invite_btn"
            >
              <Mail size={14} />
              <span>Submit & Send Invite</span>
            </button>
          </div>
        </div>
      )}

      {/* GENERATING REPORT LOADING SCREEN */}
      {view === 'generating_report' && (
        <GeneratingReportScreen
          client={activeReportClient}
          onComplete={() => setView('profile')}
        />
      )}

      {/* CLIENT INTELLIGENCE PROFILE SCREEN */}
      {view === 'profile' && (
        <ClientProfileReport
          client={activeReportClient}
          onBack={() => setView('list')}
          onNewClient={handleStartOnboarding}
        />
      )}

      {/* CLIENT DETAILS VIEW MODAL */}
      {selectedClientForView && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedClientForView(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-neutral-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-[#2563eb] rounded-xl">
                  {selectedClientForView.industry === 'Automobile' && <Car size={22} />}
                  {selectedClientForView.industry === 'Real Estate' && <Building size={22} />}
                  {selectedClientForView.industry === 'Luxury Watches' && <Watch size={22} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-neutral-900">{selectedClientForView.clientName}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {selectedClientForView.status}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">
                    {selectedClientForView.id} · Onboarded {selectedClientForView.dateOnboarded}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedClientForView(null)}
                className="p-1.5 hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Industry & Business Lines */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 space-y-1">
                  <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Industry</span>
                  <div className="text-sm font-bold text-neutral-900">{selectedClientForView.industry}</div>
                </div>
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 space-y-1">
                  <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Purchase Channel</span>
                  <div className="text-sm font-bold text-neutral-900">{selectedClientForView.purchaseChannel}</div>
                </div>
              </div>

              {/* Business Lines */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Active Business Lines</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedClientForView.businessLines.map((line, idx) => (
                    <span key={idx} className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-100">
                      {line}
                    </span>
                  ))}
                </div>
              </div>

              {/* Top 3 Competitor Websites Section */}
              <div className="space-y-3 p-4 bg-gradient-to-br from-blue-50/40 via-white to-neutral-50 rounded-xl border border-blue-100/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target size={16} className="text-[#2563eb]" />
                    <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Top 3 Competitor Website Links</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-blue-100/80 text-blue-800 rounded font-semibold">
                    Competitive Scraping
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Target competitor domains monitored for intent signals, conversion factors, and psychographic benchmarks.
                </p>

                {selectedClientForView.digitalPresence?.competitorWebsites && selectedClientForView.digitalPresence.competitorWebsites.length > 0 ? (
                  <div className="space-y-2 pt-1">
                    {selectedClientForView.digitalPresence.competitorWebsites.map((comp, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-white border border-neutral-200 rounded-lg text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-mono text-neutral-800 truncate">{comp}</span>
                        </div>
                        <a
                          href={comp.startsWith('http') ? comp : `https://${comp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] font-semibold text-[#2563eb] hover:text-[#1d4ed8] hover:underline shrink-0 ml-3"
                        >
                          <span>Visit site</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400 italic">No competitor website links provided.</p>
                )}
              </div>

              {/* Digital Handles */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Client Online & Social Handles</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-100 flex items-center justify-between">
                    <span className="text-neutral-500">Website</span>
                    <span className="font-semibold text-neutral-800 font-mono truncate max-w-[180px]">
                      {selectedClientForView.digitalPresence?.website || '—'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-100 flex items-center justify-between">
                    <span className="text-neutral-500">LinkedIn</span>
                    <span className="font-semibold text-neutral-800 font-mono truncate max-w-[180px]">
                      {selectedClientForView.digitalPresence?.linkedin || '—'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-100 flex items-center justify-between">
                    <span className="text-neutral-500">Twitter / X</span>
                    <span className="font-semibold text-neutral-800 font-mono truncate max-w-[180px]">
                      {selectedClientForView.digitalPresence?.twitter || '—'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-100 flex items-center justify-between">
                    <span className="text-neutral-500">Instagram</span>
                    <span className="font-semibold text-neutral-800 font-mono truncate max-w-[180px]">
                      {selectedClientForView.digitalPresence?.instagram || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Commercials & Admin */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 space-y-3 text-xs">
                <div>
                  <span className="text-[11px] text-neutral-400 font-semibold block mb-1">
                    Average Ticket Size {selectedClientForView.categoryTicketSizes ? 'by Product Category' : ''}
                  </span>
                  {selectedClientForView.categoryTicketSizes && Object.keys(selectedClientForView.categoryTicketSizes).length > 0 ? (
                    <div className="space-y-1.5 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(selectedClientForView.categoryTicketSizes).map(([cat, amount]) => (
                          <div key={cat} className="flex items-center justify-between p-2 bg-white rounded-lg border border-neutral-200">
                            <span className="font-semibold text-neutral-700 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
                              <span>{cat}</span>
                            </span>
                            <span className="font-mono font-bold text-neutral-900">{formatINR(Number(amount))}</span>
                          </div>
                        ))}
                      </div>
                      <div className="text-[11px] text-neutral-500 flex items-center gap-1 pt-0.5">
                        <span>Blended Average:</span>
                        <span className="font-mono font-bold text-neutral-900">
                          {formatINR(selectedClientForView.avgTicketSize)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="font-mono font-bold text-neutral-900 text-sm">
                      {formatINR(selectedClientForView.avgTicketSize)}
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-neutral-200/60">
                  <div>
                    <span className="text-[11px] text-neutral-400 font-semibold block">Purchase Channel</span>
                    <span className="font-semibold text-neutral-900">{selectedClientForView.purchaseChannel}</span>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-[11px] text-neutral-400 font-semibold block">Admin Email</span>
                    <span className="font-mono font-bold text-neutral-900">{selectedClientForView.adminEmail}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setClientToDelete(selectedClientForView)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Delete Client</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveReportClient(selectedClientForView);
                    setSelectedClientForView(null);
                    setView('profile');
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <FileText size={13} />
                  <span>View Intelligence Report</span>
                </button>

                <button
                  onClick={() => setSelectedClientForView(null)}
                  className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {clientToDelete && (
        <div 
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setClientToDelete(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Delete Client Onboarding?</h3>
                <p className="text-xs text-neutral-500 font-mono mt-0.5">
                  {clientToDelete.clientName} ({clientToDelete.id})
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Are you sure you want to delete <strong className="text-neutral-900">{clientToDelete.clientName}</strong>? All associated configuration, product categories, and competitor links will be permanently removed.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteClient(clientToDelete)}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Delete Client</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
