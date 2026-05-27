// Bug Report Types - AI-Powered Bug Detection Module

export type BugSeverity = 'critical' | 'high' | 'medium' | 'low'
export type BugCategory = 'ui_layout' | 'functional' | 'performance' | 'seo' | 'accessibility' | 'security'
export type BugStatus = 'open' | 'fixed' | 'ignored'

export interface BugItem {
  id: string
  title: string
  category: BugCategory
  severity: BugSeverity
  description: string
  whyItMatters: string
  affectedSection: string
  rootCause: string
  recommendedFix: string
  priority: number
  estimatedScoreImpact: number
  status: BugStatus
}

export interface BugCategoryBreakdown {
  ui_layout: number
  functional: number
  performance: number
  seo: number
  accessibility: number
  security: number
}

export interface BugSeverityBreakdown {
  critical: number
  high: number
  medium: number
  low: number
}

export interface BugReportSummary {
  totalBugs: number
  criticalBugs: number
  highBugs: number
  mediumBugs: number
  lowBugs: number
  passedChecks: number
  healthScore: number
  improvementPotential: number
  categoryBreakdown: BugCategoryBreakdown
  severityBreakdown: BugSeverityBreakdown
}

export interface BugReport {
  bugs: BugItem[]
  summary: BugReportSummary
  scannedAt: string
  websiteUrl: string
  websiteDomain: string
}

// Category labels for display
export const BUG_CATEGORY_CONFIG: Record<BugCategory, { label: string; icon: string; color: string; gradient: string }> = {
  ui_layout: {
    label: 'UI / Layout',
    icon: 'Layout',
    color: 'text-purple-400',
    gradient: 'from-purple-500 to-indigo-500',
  },
  functional: {
    label: 'Functional',
    icon: 'Bug',
    color: 'text-red-400',
    gradient: 'from-red-500 to-rose-500',
  },
  performance: {
    label: 'Performance',
    icon: 'Gauge',
    color: 'text-green-400',
    gradient: 'from-green-500 to-emerald-500',
  },
  seo: {
    label: 'SEO',
    icon: 'Search',
    color: 'text-blue-400',
    gradient: 'from-blue-500 to-cyan-500',
  },
  accessibility: {
    label: 'Accessibility',
    icon: 'Accessibility',
    color: 'text-amber-400',
    gradient: 'from-amber-500 to-orange-500',
  },
  security: {
    label: 'Security',
    icon: 'Shield',
    color: 'text-rose-400',
    gradient: 'from-rose-500 to-pink-500',
  },
}

// Severity config for display
export const BUG_SEVERITY_CONFIG: Record<BugSeverity, { label: string; color: string; bgColor: string; borderColor: string; icon: string }> = {
  critical: {
    label: 'Critical',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    icon: 'AlertOctagon',
  },
  high: {
    label: 'High',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    icon: 'AlertTriangle',
  },
  medium: {
    label: 'Medium',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    icon: 'AlertCircle',
  },
  low: {
    label: 'Low',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    icon: 'Info',
  },
}

// Tab options
export type BugTabFilter = 'all' | 'open' | 'critical' | 'fixed'
