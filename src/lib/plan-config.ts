// Admin emails — these users get ALL features unlocked regardless of plan
export const ADMIN_EMAILS = [
] as const

// Helper: check if an email belongs to an admin
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.some(admin => admin.toLowerCase() === email.toLowerCase())
}

// Helper: check if a user role is admin (DB-based role check)
export function isAdminRole(role: string | null | undefined): boolean {
  return role === 'admin'
}

// Helper: combined admin check — checks both role (DB) and email (legacy fallback)
export function isAdmin(role: string | null | undefined, email: string | null | undefined): boolean {
  return isAdminRole(role) || isAdminEmail(email)
}

// Centralized plan configuration — single source of truth for all plan features and limits

export type PlanKey = 'free' | 'starter' | 'pro' | 'enterprise'

export interface PlanFeature {
  key: string
  label: string
  description: string
}

export interface PlanConfig {
  name: string
  price: { monthly: number; yearly: number }
  analysesPerDay: number // -1 means unlimited
  features: Record<string, boolean>
  apiAccessPerDay?: number // API call limit per day
  maxTeamMembers?: number
}

// Feature keys — used across backend and frontend
export const FEATURES = {
  // Free features
  basicUIUX: 'basicUIUX',
  seoScore: 'seoScore',
  professionalRoast: 'professionalRoast',
  emailReport: 'emailReport',

  // Starter+ features
  fullAudit: 'fullAudit',           // Full 7-category audit (vs basic 3-category)
  savageMode: 'savageMode',         // AI roast (savage mode)
  pdfExport: 'pdfExport',           // PDF report export
  historicalTracking: 'historicalTracking', // Historical tracking
  emailSupport: 'emailSupport',     // Email support

  // Pro+ features
  priorityProcessing: 'priorityProcessing',
  competitorComparison: 'competitorComparison',
  apiAccess: 'apiAccess',           // API access
  securityScanner: 'securityScanner', // Security scanner (Pro+)
  techStackAnalysis: 'techStackAnalysis', // Tech stack analysis (Pro+)

  // Enterprise features
  teamMembers: 'teamMembers',       // Up to 25 team members
  sharedDashboard: 'sharedDashboard',
  whiteLabel: 'whiteLabel',         // White-label reports
  customBranding: 'customBranding',
  prioritySupport: 'prioritySupport',
  dedicatedManager: 'dedicatedManager', // Dedicated account manager
  slaGuarantee: 'slaGuarantee',
  customIntegrations: 'customIntegrations',
} as const

export const PLANS: Record<PlanKey, PlanConfig> = {
  free: {
    name: 'Free',
    price: { monthly: 0, yearly: 0 },
    analysesPerDay: 3,
    features: {
      [FEATURES.basicUIUX]: true,
      [FEATURES.seoScore]: true,
      [FEATURES.professionalRoast]: true,
      [FEATURES.emailReport]: true,
      [FEATURES.fullAudit]: true,
      [FEATURES.savageMode]: true,
      [FEATURES.pdfExport]: true,
      [FEATURES.historicalTracking]: true,
      [FEATURES.emailSupport]: true,
      [FEATURES.priorityProcessing]: true,
      [FEATURES.competitorComparison]: true,
      [FEATURES.apiAccess]: false,
      [FEATURES.securityScanner]: false,
      [FEATURES.techStackAnalysis]: false,
      [FEATURES.teamMembers]: false,
      [FEATURES.sharedDashboard]: false,
      [FEATURES.whiteLabel]: false,
      [FEATURES.customBranding]: false,
      [FEATURES.prioritySupport]: false,
      [FEATURES.dedicatedManager]: false,
      [FEATURES.slaGuarantee]: false,
      [FEATURES.customIntegrations]: false,
    },
  },
  starter: {
    name: 'Starter',
    price: { monthly: 499, yearly: 4990 },
    analysesPerDay: 10,
    features: {
      [FEATURES.basicUIUX]: true,
      [FEATURES.seoScore]: true,
      [FEATURES.professionalRoast]: true,
      [FEATURES.emailReport]: true,
      [FEATURES.fullAudit]: true,
      [FEATURES.savageMode]: true,
      [FEATURES.pdfExport]: true,
      [FEATURES.historicalTracking]: true,
      [FEATURES.emailSupport]: true,
      [FEATURES.priorityProcessing]: false,
      [FEATURES.competitorComparison]: false,
      [FEATURES.apiAccess]: false,
      [FEATURES.securityScanner]: false,
      [FEATURES.techStackAnalysis]: false,
      [FEATURES.teamMembers]: false,
      [FEATURES.sharedDashboard]: false,
      [FEATURES.whiteLabel]: false,
      [FEATURES.customBranding]: false,
      [FEATURES.prioritySupport]: false,
      [FEATURES.dedicatedManager]: false,
      [FEATURES.slaGuarantee]: false,
      [FEATURES.customIntegrations]: false,
    },
  },
  pro: {
    name: 'Pro',
    price: { monthly: 1499, yearly: 14990 },
    analysesPerDay: -1, // unlimited
    apiAccessPerDay: 100,
    features: {
      [FEATURES.basicUIUX]: true,
      [FEATURES.seoScore]: true,
      [FEATURES.professionalRoast]: true,
      [FEATURES.emailReport]: true,
      [FEATURES.fullAudit]: true,
      [FEATURES.savageMode]: true,
      [FEATURES.pdfExport]: true,
      [FEATURES.historicalTracking]: true,
      [FEATURES.emailSupport]: true,
      [FEATURES.priorityProcessing]: true,
      [FEATURES.competitorComparison]: true,
      [FEATURES.apiAccess]: true,
      [FEATURES.securityScanner]: true,
      [FEATURES.techStackAnalysis]: true,
      [FEATURES.teamMembers]: false,
      [FEATURES.sharedDashboard]: false,
      [FEATURES.whiteLabel]: false,
      [FEATURES.customBranding]: false,
      [FEATURES.prioritySupport]: false,
      [FEATURES.dedicatedManager]: false,
      [FEATURES.slaGuarantee]: false,
      [FEATURES.customIntegrations]: false,
    },
  },
  enterprise: {
    name: 'Enterprise',
    price: { monthly: 4999, yearly: 49990 },
    analysesPerDay: -1, // unlimited
    apiAccessPerDay: 10000,
    maxTeamMembers: 25,
    features: {
      [FEATURES.basicUIUX]: true,
      [FEATURES.seoScore]: true,
      [FEATURES.professionalRoast]: true,
      [FEATURES.emailReport]: true,
      [FEATURES.fullAudit]: true,
      [FEATURES.savageMode]: true,
      [FEATURES.pdfExport]: true,
      [FEATURES.historicalTracking]: true,
      [FEATURES.emailSupport]: true,
      [FEATURES.priorityProcessing]: true,
      [FEATURES.competitorComparison]: true,
      [FEATURES.apiAccess]: true,
      [FEATURES.securityScanner]: true,
      [FEATURES.techStackAnalysis]: true,
      [FEATURES.teamMembers]: true,
      [FEATURES.sharedDashboard]: true,
      [FEATURES.whiteLabel]: true,
      [FEATURES.customBranding]: true,
      [FEATURES.prioritySupport]: true,
      [FEATURES.dedicatedManager]: true,
      [FEATURES.slaGuarantee]: true,
      [FEATURES.customIntegrations]: true,
    },
  },
}

// Helper: check if a feature is available for a plan
export function hasFeature(plan: PlanKey, feature: string): boolean {
  return PLANS[plan]?.features[feature] ?? false
}

// Helper: get analyses per day limit
export function getAnalysesPerDay(plan: PlanKey): number {
  return PLANS[plan]?.analysesPerDay ?? 3
}

// Helper: get remaining analyses for today
export function getRemainingAnalyses(plan: PlanKey, usedToday: number): number {
  const limit = getAnalysesPerDay(plan)
  if (limit === -1) return -1 // unlimited
  return Math.max(0, limit - usedToday)
}

// Helper: check if user can analyze
export function canAnalyze(plan: PlanKey, usedToday: number): boolean {
  const limit = getAnalysesPerDay(plan)
  if (limit === -1) return true // unlimited
  return usedToday < limit
}

// Helper: get plan key from string (with fallback)
export function getPlanKey(planStr: string | null | undefined): PlanKey {
  if (planStr && planStr in PLANS) return planStr as PlanKey
  return 'free'
}

// Plan hierarchy for upgrade checks
export const PLAN_HIERARCHY: PlanKey[] = ['free', 'starter', 'pro', 'enterprise']

export function isPlanUpgrade(currentPlan: PlanKey, targetPlan: PlanKey): boolean {
  return PLAN_HIERARCHY.indexOf(targetPlan) > PLAN_HIERARCHY.indexOf(currentPlan)
}

// Feature display labels for UI
export const FEATURE_LABELS: Record<string, { label: string; minPlan: PlanKey }> = {
  [FEATURES.savageMode]: { label: 'Savage Mode', minPlan: 'free' },
  [FEATURES.fullAudit]: { label: 'Full 7-Category Audit', minPlan: 'free' },
  [FEATURES.pdfExport]: { label: 'PDF Export', minPlan: 'free' },
  [FEATURES.historicalTracking]: { label: 'Historical Tracking', minPlan: 'free' },
  [FEATURES.emailSupport]: { label: 'Email Support', minPlan: 'free' },
  [FEATURES.priorityProcessing]: { label: 'Priority Processing', minPlan: 'free' },
  [FEATURES.competitorComparison]: { label: 'Competitor Comparison', minPlan: 'free' },
  [FEATURES.apiAccess]: { label: 'API Access', minPlan: 'pro' },
  [FEATURES.securityScanner]: { label: 'Security Scanner', minPlan: 'pro' },
  [FEATURES.techStackAnalysis]: { label: 'Tech Stack Analysis', minPlan: 'pro' },
  [FEATURES.teamMembers]: { label: 'Team Members', minPlan: 'enterprise' },
  [FEATURES.sharedDashboard]: { label: 'Shared Dashboard', minPlan: 'enterprise' },
  [FEATURES.whiteLabel]: { label: 'White-Label Reports', minPlan: 'enterprise' },
  [FEATURES.customBranding]: { label: 'Custom Branding', minPlan: 'enterprise' },
  [FEATURES.prioritySupport]: { label: 'Priority Support', minPlan: 'enterprise' },
  [FEATURES.dedicatedManager]: { label: 'Dedicated Account Manager', minPlan: 'enterprise' },
  [FEATURES.slaGuarantee]: { label: 'SLA Guarantee', minPlan: 'enterprise' },
  [FEATURES.customIntegrations]: { label: 'Custom Integrations', minPlan: 'enterprise' },
}
