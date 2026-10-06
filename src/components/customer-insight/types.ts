export type SectorType = 'Automobile' | 'Luxury Watch' | 'Real Estate';

export const SECTOR_TICKET_PRICES: Record<SectorType, string[]> = {
  'Automobile': ['₹10–20L', '₹20–50L', '₹50L+'],
  'Luxury Watch': ['₹25k–50k', '₹50k–1L', '₹1L+'],
  'Real Estate': ['₹1–5Cr', '₹5–10Cr', '₹10Cr+']
};

export interface CustomerInsightRunData {
  step: number; // 1 to 6
  sector: SectorType;
  ticketPrice: string;
  subjectId: string;
  email: string;
  isStored: boolean;
  isLawfulConsent: boolean;
  
  // Costs & Telemetry
  vendorSpendINR: number;
  monthToDateINR: number;
  fetchSpendUSD: number;
  model: string;
  
  // Step 2 Data
  identityStats: {
    modulesFound: number;
    detailedProfiles: number;
    registeredOnly: number;
    breachRecords: number;
    timelineEvents?: number;
  };
  vendorBreakdown: {
    osint: { detailed: number; registered: number; breach: number };
    bte: { detailed: number; registered: number; breach: number };
    foundByBoth: string[];
  };
  identityRows: Array<{
    platform: string;
    keySignals: string[];
    verified: boolean;
    source: string;
    category: 'detailed' | 'registered' | 'breach' | 'timeline';
  }>;
  runLog: Array<{ time: string; message: string }>;
  
  // Step 3 Data
  sourcePlan: {
    identifiersFound: number;
    modulesRouted: number;
    readyCount: number;
    blockedCount: number;
    noRouteCount: number;
    sources: Array<{
      id: string;
      platform: string;
      icon: string;
      reader: string;
      status: 'verified' | 'unverified' | 'contested';
      builtFrom: string[];
      flag?: string;
      hasViewInput?: boolean;
    }>;
    blockedReasons: Array<{ label: string; count: number }>;
  };
  
  // Step 4 Data
  profileFetch: {
    duration: string;
    totalSpendUSD: number;
    usable: number;
    stubOnly: number;
    failed: number;
    fieldsFilled: number;
    totalFields: number;
    profiles: Array<{
      platform: string;
      icon: string;
      duration: string;
      costUSD: number;
      status: 'good' | 'stub' | 'failed';
      fieldsFilled: number;
      totalFields: number;
      note?: string;
    }>;
  };
  
  // Step 5 Data
  persona: {
    attributesCount: number;
    traitsCount: number;
    profilesUsed: number;
    confidence: { high: number; medium: number; low: number; estimated?: number; insufficient?: number };
    summary?: string;
    identityLocation?: string;
    traits: Array<{
      name: string;
      score: number;
      narrative: string;
      warning?: boolean;
    }>;
    attributeAreas: Array<{
      title: string;
      density: string;
      attributes: Array<{
        label: string;
        value: string;
        confidence: 'high' | 'medium' | 'low' | 'estimated' | 'insufficient';
        basis?: string;
      }>;
      sources: string[];
    }>;
  };
  
  // Step 6 Data
  categories: {
    whyRanking: Array<{
      icon: 'briefcase' | 'slash' | 'eye-off';
      title: string;
      subtitle: string;
    }>;
    dormantFound?: boolean;
    ruleCounts?: Array<{ label: string; count: number }>;
    scoredCount: number;
    rankedCount: number;
    setAsideCount: number;
    ranked: Array<{
      rank: number;
      title: string;
      description: string;
      tags: string[];
      evidence: number;
      psychFit: number;
      bullets?: Array<{ text: string; caveat?: boolean }>;
    }>;
    setAside: Array<{
      title: string;
      reason: string;
      rule?: string;
    }>;
  };
}

export const SAMPLE_S01_DATA: CustomerInsightRunData = {
  step: 1,
  sector: 'Automobile',
  ticketPrice: '₹10–20L',
  subjectId: 'Subject S-01',
  email: 'prospect@enterprise.com',
  isStored: true,
  isLawfulConsent: true,
  
  vendorSpendINR: 62.88,
  monthToDateINR: 62.88,
  fetchSpendUSD: 0.05,
  model: 'claude-opus-5',
  
  identityStats: {
    modulesFound: 42,
    detailedProfiles: 17,
    registeredOnly: 23,
    breachRecords: 14,
  },
  vendorBreakdown: {
    osint: { detailed: 16, registered: 19, breach: 12 },
    bte: { detailed: 6, registered: 4, breach: 1 },
    foundByBoth: ['Google', 'Microsoft', 'Spotify', 'Notion', 'Strava'],
  },
  identityRows: [
    { platform: 'LinkedIn', keySignals: ['Profile URL', 'Headline'], verified: true, source: 'Both', category: 'detailed' },
    { platform: 'Notion', keySignals: ['Workspace host'], verified: true, source: 'Vendor A', category: 'detailed' },
    { platform: 'Spotify', keySignals: ['Plan visible'], verified: false, source: 'Both', category: 'detailed' },
    { platform: 'Strava', keySignals: ['Public profile', 'Activity type'], verified: true, source: 'Vendor B', category: 'detailed' },
    { platform: 'Canva', keySignals: ['Account ID'], verified: false, source: 'Vendor A', category: 'detailed' },
    { platform: 'Eventbrite', keySignals: ['Events attended'], verified: false, source: 'Vendor A', category: 'detailed' },
    { platform: 'GitHub', keySignals: ['User ID', 'Username'], verified: true, source: 'Both', category: 'registered' },
    { platform: 'Duolingo', keySignals: ['Learner rank'], verified: true, source: 'Vendor A', category: 'registered' },
    { platform: 'Google Maps', keySignals: ['Local Guide level'], verified: true, source: 'Vendor B', category: 'registered' },
    { platform: 'Adobe Creative Cloud', keySignals: ['Account ID'], verified: false, source: 'Vendor A', category: 'registered' },
    { platform: 'Gravatar', keySignals: ['Display name'], verified: true, source: 'Both', category: 'registered' },
    { platform: 'Medium', keySignals: ['Author URL'], verified: true, source: 'Vendor B', category: 'registered' },
  ],
  runLog: [
    { time: '07:05:32', message: 'Run accepted' },
    { time: '07:05:32', message: 'Two vendors set' },
    { time: '07:06:51', message: 'Vendor A · 36 items' },
    { time: '07:06:57', message: 'Vendor B · 9 items' },
    { time: '07:07:02', message: 'Saved to store' },
  ],
  
  sourcePlan: {
    identifiersFound: 21,
    modulesRouted: 42,
    readyCount: 4,
    blockedCount: 12,
    noRouteCount: 26,
    sources: [
      {
        id: 'linkedin',
        platform: 'LinkedIn',
        icon: 'in',
        reader: 'profile reader',
        status: 'verified',
        builtFrom: ['Profile URL'],
      },
      {
        id: 'duolingo',
        platform: 'Duolingo',
        icon: 'Du',
        reader: 'learner profile reader',
        status: 'unverified',
        builtFrom: ['Profile URL', 'Username', 'User ID'],
        flag: 'Shows a paid-plan flag',
        hasViewInput: true,
      },
      {
        id: 'github',
        platform: 'GitHub',
        icon: 'GH',
        reader: 'user profile reader',
        status: 'contested',
        builtFrom: ['User ID', 'Username', 'Website'],
      },
      {
        id: 'google-maps',
        platform: 'Google Maps',
        icon: 'GM',
        reader: 'contributor reviews reader',
        status: 'verified',
        builtFrom: ['Contributor ID'],
      },
    ],
    blockedReasons: [
      { label: 'Login required', count: 5 },
      { label: 'No public source', count: 4 },
      { label: 'Rate limited', count: 2 },
      { label: 'Excluded by policy', count: 1 },
    ],
  },
  
  profileFetch: {
    duration: '61s',
    totalSpendUSD: 0.05,
    usable: 2,
    stubOnly: 1,
    failed: 1,
    fieldsFilled: 58,
    totalFields: 102,
    profiles: [
      {
        platform: 'LinkedIn',
        icon: '✓',
        duration: '12s',
        costUSD: 0.00,
        status: 'good',
        fieldsFilled: 39,
        totalFields: 51,
      },
      {
        platform: 'Duolingo',
        icon: '✓',
        duration: '24s',
        costUSD: 0.05,
        status: 'good',
        fieldsFilled: 17,
        totalFields: 27,
      },
      {
        platform: 'GitHub',
        icon: '!',
        duration: '13s',
        costUSD: 0.00,
        status: 'stub',
        fieldsFilled: 2,
        totalFields: 12,
        note: 'Profile stub, not enrichment. Source is contested.',
      },
      {
        platform: 'Google Maps',
        icon: '✕',
        duration: '13s',
        costUSD: 0.00,
        status: 'failed',
        fieldsFilled: 0,
        totalFields: 12,
        note: 'Returned an error report, not data.',
      },
    ],
  },
  
  persona: {
    attributesCount: 38,
    traitsCount: 6,
    profilesUsed: 2,
    confidence: { high: 22, medium: 11, low: 5 },
    traits: [
      { name: 'Achievement', score: 9, narrative: 'Steady credentials and title growth' },
      { name: 'Self-direction', score: 8, narrative: 'Self-led learning outside work' },
      { name: 'Learning', score: 8, narrative: 'Active on a learning app' },
      { name: 'Thrift', score: 7, narrative: 'Free tiers across platforms' },
      { name: 'Affiliation', score: 5, narrative: 'Professional network, little social' },
      { name: 'Status', score: 3, narrative: 'Low evidence, not low trait', warning: true },
    ],
    attributeAreas: [
      {
        title: 'Career',
        density: 'Dense · 14',
        attributes: [
          { label: 'Role level', value: 'Mid to senior', confidence: 'high' },
          { label: 'Function', value: 'Operations', confidence: 'high' },
          { label: 'Industry', value: 'Financial services', confidence: 'high' },
          { label: 'Trajectory', value: 'Rising', confidence: 'medium' },
        ],
        sources: ['LinkedIn'],
      },
      {
        title: 'Learning',
        density: 'Good · 9',
        attributes: [
          { label: 'Certifications', value: '10 or more', confidence: 'high' },
          { label: 'Learning app', value: 'Active, free tier', confidence: 'high' },
          { label: 'Topics', value: 'Technology, strategy', confidence: 'medium' },
        ],
        sources: ['LinkedIn', 'Duolingo'],
      },
      {
        title: 'Digital footprint',
        density: 'Good · 8',
        attributes: [
          { label: 'Platforms', value: '42 found', confidence: 'high' },
          { label: 'Audience', value: 'Large, professional', confidence: 'medium' },
          { label: 'Publishes', value: 'Articles', confidence: 'medium' },
        ],
        sources: ['Identity match'],
      },
      {
        title: 'Leisure',
        density: 'Sparse · 4',
        attributes: [
          { label: 'Fitness', value: 'Registered only', confidence: 'medium' },
          { label: 'Music', value: 'Free plan', confidence: 'medium' },
          { label: 'Events', value: 'Occasional', confidence: 'low' },
        ],
        sources: ['Identity match'],
      },
      {
        title: 'Spend signal',
        density: 'Near zero · 3',
        attributes: [
          { label: 'Paid plans', value: 'None found', confidence: 'high' },
          { label: 'Price flags', value: '0 of 42 modules', confidence: 'high' },
          { label: 'Ticket fit', value: 'Not yet evidenced', confidence: 'low' },
        ],
        sources: ['All sources'],
      },
    ],
  },
  
  categories: {
    whyRanking: [
      {
        icon: 'briefcase',
        title: 'Career evidence is dense',
        subtitle: 'Most signal is professional',
      },
      {
        icon: 'slash',
        title: 'Spend signal near zero',
        subtitle: 'No price-bearing flags',
      },
      {
        icon: 'eye-off',
        title: 'Leisure side unobserved',
        subtitle: 'Unobserved, not absent',
      },
    ],
    scoredCount: 15,
    rankedCount: 4,
    setAsideCount: 11,
    ranked: [
      {
        rank: 1,
        title: 'Professional mastery and credentials',
        description: 'Steady certification and skill growth. All learning so far obtained free.',
        tags: ['Certifications', 'Title progression', 'Awards'],
        evidence: 9,
        psychFit: 10,
      },
      {
        rank: 2,
        title: 'Public expertise and audience-building',
        description: 'Consistent publishing on industry trends with an engaged executive follower base.',
        tags: ['Thought Leadership', 'Audience Growth'],
        evidence: 9,
        psychFit: 9,
      },
      {
        rank: 3,
        title: 'Cross-border work and self-study',
        description: 'Active language learning and global operational methodology study.',
        tags: ['Languages', 'Global Strategy'],
        evidence: 7,
        psychFit: 8,
      },
      {
        rank: 4,
        title: 'Industry events and networking',
        description: 'Selective attendance at premier finance and technology summits.',
        tags: ['Summits', 'Executive Meetups'],
        evidence: 6,
        psychFit: 7,
      },
    ],
    setAside: [
      { title: 'Luxury Aviation & Jet Charters', reason: 'No monetisable headroom evidenced' },
      { title: 'High-Stakes Dining & Hospitality', reason: 'Hygiene only / unobserved' },
      { title: 'Competitive Yachting & Sailing', reason: 'Out of scope' },
      { title: 'Elite Golf Club Memberships', reason: 'Low propensity fit' },
      { title: 'Art & Antiquities Auctioning', reason: 'Sparse signal' },
      { title: 'Supercar Track Days', reason: 'Zero price flags' },
      { title: 'Private Wealth Management Advisory', reason: 'Ubiquitous, not identity' },
      { title: 'Bespoke Haute Horlogerie', reason: 'Unstated' },
      { title: 'Concierge Wellness Retreats', reason: 'Stale' },
      { title: 'Premium Ski Resorts', reason: 'Unobserved' },
      { title: 'Designer Fashion Subscription', reason: 'Free tiers across platforms' },
    ],
  },
};
