'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bug,
  Shield,
  Search as SearchIcon,
  Gauge,
  Layout,
  Accessibility,
  AlertOctagon,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Filter,
  FileDown,
  Copy,
  Loader2,
  CheckCircle2,
  XCircle,
  X,
  ArrowUpDown,
  BarChart3,
  TrendingUp,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScoreRing } from '@/components/score-ring'
import { useToast } from '@/hooks/use-toast'
import type {
  BugReport,
  BugItem,
  BugCategory,
  BugSeverity,
  BugStatus,
  BugTabFilter,
  BugCategoryBreakdown,
} from '@/lib/bug-report-types'
import {
  BUG_CATEGORY_CONFIG,
  BUG_SEVERITY_CONFIG,
} from '@/lib/bug-report-types'

// ─── Icon Helper ────────────────────────────────────────────
function CategoryIcon({ category, className = 'h-4 w-4' }: { category: BugCategory; className?: string }) {
  const config = BUG_CATEGORY_CONFIG[category]
  switch (config.icon) {
    case 'Layout': return <Layout className={className} />
    case 'Bug': return <Bug className={className} />
    case 'Gauge': return <Gauge className={className} />
    case 'Search': return <SearchIcon className={className} />
    case 'Accessibility': return <Accessibility className={className} />
    case 'Shield': return <Shield className={className} />
    default: return <Bug className={className} />
  }
}

function SeverityIcon({ severity, className = 'h-4 w-4' }: { severity: BugSeverity; className?: string }) {
  switch (severity) {
    case 'critical': return <AlertOctagon className={className} />
    case 'high': return <AlertTriangle className={className} />
    case 'medium': return <AlertCircle className={className} />
    case 'low': return <Info className={className} />
  }
}

// ─── Summary Dashboard ──────────────────────────────────────
function BugSummaryDashboard({ summary, isLoading }: { summary: BugReport['summary'] | null; isLoading: boolean }) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl border dark:border-white/[0.06] border-border/50 dark:bg-white/[0.02] bg-card/80 p-4 animate-pulse">
            <div className="h-8 w-12 rounded bg-muted/30 mb-2" />
            <div className="h-3 w-16 rounded bg-muted/20" />
          </div>
        ))}
      </div>
    )
  }

  const stats = [
    { label: 'Total Bugs', value: summary.totalBugs, color: 'text-foreground', bg: 'dark:bg-white/[0.03] bg-card/80' },
    { label: 'Critical', value: summary.criticalBugs, color: 'text-red-400', bg: 'bg-red-500/5' },
    { label: 'High', value: summary.highBugs, color: 'text-orange-400', bg: 'bg-orange-500/5' },
    { label: 'Medium', value: summary.mediumBugs, color: 'text-yellow-400', bg: 'bg-yellow-500/5' },
    { label: 'Low', value: summary.lowBugs, color: 'text-blue-400', bg: 'bg-blue-500/5' },
    { label: 'Passed', value: summary.passedChecks, color: 'text-green-400', bg: 'bg-green-500/5' },
    { label: 'Health', value: summary.healthScore, color: summary.healthScore >= 70 ? 'text-green-400' : summary.healthScore >= 40 ? 'text-yellow-400' : 'text-red-400', bg: 'bg-purple-500/5' },
    { label: 'Can Improve', value: `+${summary.improvementPotential}`, color: 'text-purple-400', bg: 'bg-purple-500/5' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`rounded-2xl border dark:border-white/[0.06] border-border/50 ${stat.bg} p-4 transition-colors`}
        >
          <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
          <div className="text-[11px] text-muted-foreground font-medium mt-0.5">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Category Breakdown Chart ────────────────────────────────
function CategoryChart({ breakdown }: { breakdown: BugCategoryBreakdown }) {
  const total = Object.values(breakdown).reduce((s, v) => s + v, 0)
  if (total === 0) return null

  const categories: BugCategory[] = ['ui_layout', 'functional', 'performance', 'seo', 'accessibility', 'security']

  return (
    <div className="rounded-2xl border dark:border-white/[0.06] border-border/50 dark:bg-white/[0.02] bg-card/80 p-5">
      <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-purple-400" />
        Bug Distribution
      </h4>
      <div className="space-y-3">
        {categories.map((cat) => {
          const config = BUG_CATEGORY_CONFIG[cat]
          const count = breakdown[cat]
          const pct = total > 0 ? (count / total) * 100 : 0

          return (
            <div key={cat} className="flex items-center gap-3">
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${config.gradient} shrink-0`}>
                <CategoryIcon category={cat} className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-xs text-muted-foreground w-24 shrink-0 truncate">{config.label}</span>
              <div className="flex-1 h-2.5 rounded-full dark:bg-white/5 bg-black/5 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${config.gradient} transition-all duration-700 ease-out`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs font-bold text-foreground w-6 text-right">{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Severity Ring Chart ────────────────────────────────────
function SeverityRingChart({ summary }: { summary: BugReport['summary'] }) {
  return (
    <div className="rounded-2xl border dark:border-white/[0.06] border-border/50 dark:bg-white/[0.02] bg-card/80 p-5 flex flex-col items-center">
      <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2 self-start">
        <TrendingUp className="h-4 w-4 text-purple-400" />
        Health Score
      </h4>
      <ScoreRing score={summary.healthScore} size={120} strokeWidth={8} delay={0.3} showGlow />
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-4 w-full">
        {(['critical', 'high', 'medium', 'low'] as BugSeverity[]).map((sev) => {
          const config = BUG_SEVERITY_CONFIG[sev]
          const count = summary.severityBreakdown[sev]
          return (
            <div key={sev} className="flex items-center gap-2">
              <SeverityIcon severity={sev} className={`h-3 w-3 ${config.color}`} />
              <span className="text-[11px] text-muted-foreground">{config.label}</span>
              <span className={`text-[11px] font-bold ${config.color} ml-auto`}>{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Bug Card ───────────────────────────────────────────────
function BugCard({ bug, onStatusChange }: { bug: BugItem; onStatusChange: (id: string, status: BugStatus) => void }) {
  const [expanded, setExpanded] = useState(false)
  const catConfig = BUG_CATEGORY_CONFIG[bug.category]
  const sevConfig = BUG_SEVERITY_CONFIG[bug.severity]

  return (
    <div
      className={`overflow-hidden rounded-2xl border transition-colors ${
        bug.status === 'fixed'
          ? 'border-green-500/20 dark:bg-green-500/[0.02] bg-green-50/30 opacity-70'
          : bug.status === 'ignored'
          ? 'border-muted/20 dark:bg-white/[0.01] bg-muted/10 opacity-50'
          : `dark:border-white/[0.06] border-border/50 dark:bg-white/[0.02] bg-card/80 hover:dark:border-white/[0.12] hover:border-muted-foreground/20`
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 sm:p-5 text-left transition-colors dark:hover:bg-white/[0.02] hover:bg-muted/20"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${catConfig.gradient} shadow-lg shadow-black/10 shrink-0`}>
            <CategoryIcon category={bug.category} className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-semibold text-foreground truncate">{bug.title}</h4>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-semibold ${sevConfig.color} ${sevConfig.bgColor} ${sevConfig.borderColor}`}>
                {sevConfig.label}
              </Badge>
              <span className="text-[10px] text-muted-foreground">{catConfig.label}</span>
              {bug.estimatedScoreImpact > 0 && (
                <span className="text-[10px] text-red-400/70">-{bug.estimatedScoreImpact}pts</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t dark:border-white/[0.05] border-border/50 px-4 sm:px-5 py-4 space-y-4">
              {/* Description */}
              <div>
                <h5 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Description</h5>
                <p className="text-sm text-muted-foreground leading-relaxed">{bug.description}</p>
              </div>

              {/* Two columns for details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Why It Matters</h5>
                  <p className="text-sm text-muted-foreground leading-relaxed">{bug.whyItMatters}</p>
                </div>
                <div>
                  <h5 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Root Cause</h5>
                  <p className="text-sm text-muted-foreground leading-relaxed">{bug.rootCause}</p>
                </div>
              </div>

              {/* Affected Section */}
              <div>
                <h5 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Affected Section</h5>
                <p className="text-sm text-muted-foreground">{bug.affectedSection}</p>
              </div>

              {/* Recommended Fix */}
              <div className="rounded-xl dark:bg-green-500/5 bg-green-50/50 border border-green-500/10 p-3.5">
                <h5 className="text-[11px] font-semibold uppercase tracking-wider text-green-400 mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Recommended Fix
                </h5>
                <p className="text-sm text-muted-foreground leading-relaxed">{bug.recommendedFix}</p>
              </div>

              {/* Status Actions */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-muted-foreground mr-1">Status:</span>
                {(['open', 'fixed', 'ignored'] as BugStatus[]).map((status) => {
                  const statusConfig: Record<BugStatus, { label: string; color: string; icon: React.ElementType }> = {
                    open: { label: 'Open', color: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5', icon: AlertCircle },
                    fixed: { label: 'Fixed', color: 'text-green-400 border-green-500/20 bg-green-500/5', icon: CheckCircle2 },
                    ignored: { label: 'Ignored', color: 'text-muted-foreground border-muted-foreground/20 bg-muted/5', icon: XCircle },
                  }
                  const cfg = statusConfig[status]
                  const isActive = bug.status === status
                  return (
                    <button
                      key={status}
                      onClick={(e) => { e.stopPropagation(); onStatusChange(bug.id, status) }}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                        isActive ? cfg.color : 'border-transparent text-muted-foreground/50 hover:text-muted-foreground'
                      }`}
                    >
                      <cfg.icon className="h-3 w-3" />
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Empty State ────────────────────────────────────────────
function EmptyBugState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10 border border-green-500/20 mb-4">
        <CheckCircle2 className="h-8 w-8 text-green-400" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">No Bugs Found!</h3>
      <p className="text-sm text-muted-foreground max-w-md">
        This website passed all checks in the selected filter. Great job! Try a different filter to see other bugs.
      </p>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────
interface BugReportPanelProps {
  websiteUrl: string
  websiteDomain: string
  reportId: string
  onClose?: () => void
}

export function BugReportPanel({ websiteUrl, websiteDomain, reportId }: BugReportPanelProps) {
  const { toast } = useToast()
  const [bugReport, setBugReport] = useState<BugReport | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<BugTabFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<BugCategory | 'all'>('all')
  const [severityFilter, setSeverityFilter] = useState<BugSeverity | 'all'>('all')
  const [sortBy, setSortBy] = useState<'priority' | 'severity' | 'category' | 'impact'>('priority')
  const [showFilters, setShowFilters] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Fetch bug report
  const fetchBugReport = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const res = await fetch('/api/bug-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl, reportId }),
      })
      const data = await res.json()
      if (data.success && data.data) {
        setBugReport(data.data)
      } else {
        const msg = data.error || 'Could not generate bug report.'
        setErrorMessage(msg)
        toast({ title: 'Bug Report Failed', description: msg, variant: 'destructive' })
      }
    } catch {
      const msg = 'Network error. Please check your connection and try again.'
      setErrorMessage(msg)
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [websiteUrl, reportId, toast])

  // Auto-fetch on mount
  useEffect(() => {
    fetchBugReport()
  }, [fetchBugReport])

  // Handle bug status change
  const handleStatusChange = useCallback((bugId: string, status: BugStatus) => {
    setBugReport((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        bugs: prev.bugs.map((b) => (b.id === bugId ? { ...b, status } : b)),
      }
    })
  }, [])

  // Filter & sort bugs
  const filteredBugs = useMemo(() => {
    if (!bugReport) return []

    let bugs = [...bugReport.bugs]

    // Tab filter
    if (activeTab === 'open') bugs = bugs.filter((b) => b.status === 'open')
    else if (activeTab === 'critical') bugs = bugs.filter((b) => b.severity === 'critical' || b.severity === 'high')
    else if (activeTab === 'fixed') bugs = bugs.filter((b) => b.status === 'fixed')

    // Category filter
    if (categoryFilter !== 'all') bugs = bugs.filter((b) => b.category === categoryFilter)

    // Severity filter
    if (severityFilter !== 'all') bugs = bugs.filter((b) => b.severity === severityFilter)

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      bugs = bugs.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          b.affectedSection.toLowerCase().includes(q) ||
          b.recommendedFix.toLowerCase().includes(q)
      )
    }

    // Sort
    const severityOrder: Record<BugSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 }
    if (sortBy === 'severity') bugs.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    else if (sortBy === 'category') bugs.sort((a, b) => a.category.localeCompare(b.category))
    else if (sortBy === 'impact') bugs.sort((a, b) => b.estimatedScoreImpact - a.estimatedScoreImpact)
    else bugs.sort((a, b) => a.priority - b.priority)

    return bugs
  }, [bugReport, activeTab, categoryFilter, severityFilter, searchQuery, sortBy])

  // Tab counts
  const tabCounts = useMemo(() => {
    if (!bugReport) return { all: 0, open: 0, critical: 0, fixed: 0 }
    return {
      all: bugReport.bugs.length,
      open: bugReport.bugs.filter((b) => b.status === 'open').length,
      critical: bugReport.bugs.filter((b) => b.severity === 'critical' || b.severity === 'high').length,
      fixed: bugReport.bugs.filter((b) => b.status === 'fixed').length,
    }
  }, [bugReport])

  // Export handlers
  const handleExportJSON = useCallback(() => {
    if (!bugReport) return
    setIsExporting(true)
    try {
      const blob = new Blob([JSON.stringify(bugReport, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bug-report-${websiteDomain}-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast({ title: 'JSON Exported', description: 'Bug report downloaded as JSON.' })
    } catch {
      toast({ title: 'Export Failed', description: 'Could not export JSON.', variant: 'destructive' })
    } finally {
      setIsExporting(false)
    }
  }, [bugReport, websiteDomain, toast])

  const handleExportPDF = useCallback(() => {
    if (!bugReport) return
    setIsExporting(true)
    try {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        const primaryColor = '#7c3aed'
        printWindow.document.write(`<!DOCTYPE html><html><head><title>Bug Report - ${websiteDomain}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a2e; line-height: 1.6; background: #fff; }
          .header { background: ${primaryColor}; color: white; padding: 24px 32px; }
          .header h1 { font-size: 20px; font-weight: 600; }
          .header .subtitle { font-size: 13px; opacity: 0.8; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 24px 32px; border-bottom: 1px solid #e5e7eb; }
          .summary-item { text-align: center; }
          .summary-item .value { font-size: 24px; font-weight: 700; }
          .summary-item .label { font-size: 11px; color: #6b7280; }
          .bug { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 12px 32px; page-break-inside: avoid; }
          .bug-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
          .bug-header h3 { font-size: 14px; font-weight: 600; }
          .severity { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
          .severity-critical { background: #fef2f2; color: #dc2626; }
          .severity-high { background: #fff7ed; color: #ea580c; }
          .severity-medium { background: #fefce8; color: #ca8a04; }
          .severity-low { background: #eff6ff; color: #2563eb; }
          .bug-detail { font-size: 13px; color: #374151; margin: 4px 0; }
          .bug-detail strong { color: #1a1a2e; }
          .fix-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; margin-top: 8px; }
          .fix-box strong { color: #166534; }
          .footer { text-align: center; padding: 16px 32px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; margin-top: 24px; }
          @media print { .no-print { display: none; } }
        </style></head><body>
        <div class="header"><h1>Bug Report — ${websiteDomain}</h1><div class="subtitle">Generated by RoastMySite AI · ${new Date().toLocaleDateString()}</div></div>
        <div class="summary">
          <div class="summary-item"><div class="value" style="color:${primaryColor}">${bugReport.summary.totalBugs}</div><div class="label">Total Bugs</div></div>
          <div class="summary-item"><div class="value" style="color:#dc2626">${bugReport.summary.criticalBugs}</div><div class="label">Critical</div></div>
          <div class="summary-item"><div class="value" style="color:#22c55e">${bugReport.summary.passedChecks}</div><div class="label">Passed</div></div>
          <div class="summary-item"><div class="value" style="color:${primaryColor}">${bugReport.summary.healthScore}/100</div><div class="label">Health Score</div></div>
        </div>
        ${bugReport.bugs.map((bug, i) => `
          <div class="bug">
            <div class="bug-header">
              <h3>${i + 1}. ${bug.title}</h3>
              <span class="severity severity-${bug.severity}">${BUG_SEVERITY_CONFIG[bug.severity].label}</span>
            </div>
            <div class="bug-detail"><strong>Category:</strong> ${BUG_CATEGORY_CONFIG[bug.category].label}</div>
            <div class="bug-detail"><strong>Section:</strong> ${bug.affectedSection}</div>
            <div class="bug-detail">${bug.description}</div>
            <div class="bug-detail"><strong>Why it matters:</strong> ${bug.whyItMatters}</div>
            <div class="fix-box"><strong>Fix:</strong> ${bug.recommendedFix}</div>
          </div>
        `).join('')}
        <div class="footer">Bug Report by RoastMySite AI · ${websiteDomain} · ${new Date().toLocaleDateString()}</div>
        <div class="no-print" style="text-align:center;padding:16px;">
          <button onclick="window.print()" style="padding:10px 24px;background:${primaryColor};color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;">Print / Save as PDF</button>
        </div>
        </body></html>`)
        printWindow.document.close()
        toast({ title: 'PDF Ready', description: 'Use Print > Save as PDF in the new window.' })
      }
    } catch {
      toast({ title: 'Export Failed', description: 'Could not export PDF.', variant: 'destructive' })
    } finally {
      setIsExporting(false)
    }
  }, [bugReport, websiteDomain, toast])

  const handleCopySummary = useCallback(async () => {
    if (!bugReport) return
    const lines = [
      `Bug Report: ${websiteDomain}`,
      `Health Score: ${bugReport.summary.healthScore}/100`,
      `Total Bugs: ${bugReport.summary.totalBugs} (Critical: ${bugReport.summary.criticalBugs}, High: ${bugReport.summary.highBugs}, Medium: ${bugReport.summary.mediumBugs}, Low: ${bugReport.summary.lowBugs})`,
      `Passed Checks: ${bugReport.summary.passedChecks}`,
      `Improvement Potential: +${bugReport.summary.improvementPotential} points`,
      '',
      'Top Issues:',
      ...bugReport.bugs.slice(0, 10).map((b, i) => `${i + 1}. [${BUG_SEVERITY_CONFIG[b.severity].label}] ${b.title} — ${b.recommendedFix}`),
    ]
    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      toast({ title: 'Copied!', description: 'Bug summary copied to clipboard.' })
    } catch {
      toast({ title: 'Copy Failed', description: 'Could not copy to clipboard.', variant: 'destructive' })
    }
  }, [bugReport, websiteDomain, toast])

  // ─── Loading State ──────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center py-16">
        <div className="relative mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-xl shadow-purple-500/30 glow-pulse">
            <Bug className="h-8 w-8 text-white" />
          </div>
          <div className="absolute -inset-3 rounded-3xl border border-purple-500/20 animate-spin [animation-duration:8s]" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Generating Bug Report</h3>
        <p className="text-sm text-muted-foreground mb-6">AI is scanning for bugs across 6 categories...</p>
        <div className="w-64 h-1.5 rounded-full dark:bg-white/5 bg-black/5 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-500 animate-pulse w-2/3" />
        </div>
      </div>
    )
  }

  // ─── Error / Empty State ───────────────────────────────
  if (!bugReport) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-4">
          <AlertTriangle className="h-8 w-8 text-orange-400" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Bug Report Unavailable</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-md text-center">
          {errorMessage || 'Could not generate bug report for this website.'}
        </p>
        <Button onClick={fetchBugReport} variant="outline" className="rounded-xl">
          <Loader2 className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </div>
    )
  }

  const summary = bugReport.summary

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/20">
              <Bug className="h-4 w-4 text-white" />
            </div>
            Bug Report
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered bug detection for <span className="text-foreground font-medium">{websiteDomain}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopySummary}
            className="rounded-xl text-xs h-8"
          >
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            Copy Summary
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJSON}
            disabled={isExporting}
            className="rounded-xl text-xs h-8"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="rounded-xl text-xs h-8"
          >
            {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="mr-1.5 h-3.5 w-3.5" />}
            PDF
          </Button>
        </div>
      </div>

      {/* ── Summary Stats ──────────────────────────────── */}
      <BugSummaryDashboard summary={summary} isLoading={false} />

      {/* ── Charts Row ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <CategoryChart breakdown={summary.categoryBreakdown} />
        </div>
        <div className="lg:col-span-2">
          <SeverityRingChart summary={summary} />
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────── */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {([
          { key: 'all', label: 'All Bugs' },
          { key: 'open', label: 'Open' },
          { key: 'critical', label: 'Critical' },
          { key: 'fixed', label: 'Fixed' },
        ] as { key: BugTabFilter; label: string }[]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                : 'text-muted-foreground hover:text-foreground dark:hover:bg-white/5 hover:bg-muted/50 border border-transparent'
            }`}
          >
            {tab.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              activeTab === tab.key ? 'bg-purple-500/15 text-purple-400' : 'dark:bg-white/5 bg-muted/50 text-muted-foreground'
            }`}>
              {tabCounts[tab.key]}
            </span>
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search bugs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 rounded-lg border-0 dark:bg-white/5 bg-muted/50 pl-8 text-xs w-40 focus-visible:ring-1 focus-visible:ring-purple-500/50"
            />
          </div>

          {/* Filter toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`rounded-xl text-xs h-8 ${showFilters ? 'border-purple-500/20 text-purple-400' : ''}`}
          >
            <Filter className="mr-1.5 h-3.5 w-3.5" />
            Filters
          </Button>

          {/* Sort */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const sorts: typeof sortBy[] = ['priority', 'severity', 'category', 'impact']
              const idx = sorts.indexOf(sortBy)
              setSortBy(sorts[(idx + 1) % sorts.length])
            }}
            className="rounded-xl text-xs h-8"
          >
            <ArrowUpDown className="mr-1.5 h-3.5 w-3.5" />
            {sortBy === 'priority' ? 'Priority' : sortBy === 'severity' ? 'Severity' : sortBy === 'category' ? 'Category' : 'Impact'}
          </Button>
        </div>
      </div>

      {/* ── Filter Row ─────────────────────────────────── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-3 rounded-xl border dark:border-white/[0.06] border-border/50 dark:bg-white/[0.02] bg-card/80 p-4">
              <div>
                <span className="text-[11px] text-muted-foreground font-medium mr-2">Category:</span>
                <div className="inline-flex gap-1">
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      categoryFilter === 'all' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'text-muted-foreground hover:text-foreground border border-transparent'
                    }`}
                  >
                    All
                  </button>
                  {(['ui_layout', 'functional', 'performance', 'seo', 'accessibility', 'security'] as BugCategory[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                        categoryFilter === cat ? `${BUG_CATEGORY_CONFIG[cat].color} ${BUG_CATEGORY_CONFIG[cat].gradient ? 'bg-gradient-to-r ' + BUG_CATEGORY_CONFIG[cat].gradient + '/10 border ' + BUG_CATEGORY_CONFIG[cat].gradient + '/20' : ''}` : 'text-muted-foreground hover:text-foreground border border-transparent'
                      }`}
                    >
                      {BUG_CATEGORY_CONFIG[cat].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-4 w-px dark:bg-white/10 bg-border" />

              <div>
                <span className="text-[11px] text-muted-foreground font-medium mr-2">Severity:</span>
                <div className="inline-flex gap-1">
                  <button
                    onClick={() => setSeverityFilter('all')}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      severityFilter === 'all' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'text-muted-foreground hover:text-foreground border border-transparent'
                    }`}
                  >
                    All
                  </button>
                  {(['critical', 'high', 'medium', 'low'] as BugSeverity[]).map((sev) => (
                    <button
                      key={sev}
                      onClick={() => setSeverityFilter(sev)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                        severityFilter === sev ? `${BUG_SEVERITY_CONFIG[sev].color} ${BUG_SEVERITY_CONFIG[sev].bgColor} border ${BUG_SEVERITY_CONFIG[sev].borderColor}` : 'text-muted-foreground hover:text-foreground border border-transparent'
                      }`}
                    >
                      {BUG_SEVERITY_CONFIG[sev].label}
                    </button>
                  ))}
                </div>
              </div>

              {(categoryFilter !== 'all' || severityFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setCategoryFilter('all'); setSeverityFilter('all') }}
                  className="rounded-lg text-xs h-7 text-muted-foreground"
                >
                  <X className="mr-1 h-3 w-3" /> Clear
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bug List ───────────────────────────────────── */}
      <div className="space-y-2.5">
        {filteredBugs.length === 0 ? (
          <EmptyBugState />
        ) : (
          filteredBugs.map((bug) => (
            <BugCard key={bug.id} bug={bug} onStatusChange={handleStatusChange} />
          ))
        )}
      </div>
    </div>
  )
}
