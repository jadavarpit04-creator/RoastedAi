'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Bug,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  AlertOctagon,
  AlertCircle,
  Info,
  Download,
  Copy,
  FileDown,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Radar,
  Terminal,
  Eye,
  Lock,
  KeyRound,
  Code,
  Database,
  ArrowUpDown,
  BarChart3,
  Zap,
  Target,
  X,
  Server,
  FileText,
  FolderOpen,
  FolderSearch,
  Layers,
  Cookie,
  Fingerprint,
  Upload,
  Radio,
  Globe,
  Network,
  Package,
  Unlink,
  Settings,
  Webhook,
  Braces,
  FileCode,
  TerminalSquare,
  FileSearch,
  ArrowLeftRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScoreRing } from '@/components/score-ring'
import { useToast } from '@/hooks/use-toast'
import type {
  ScanResult,
  VulnFinding,
  VulnCategory,
  VulnSeverity,
  VulnStatus,
  ScanMode,
  ScannerTabFilter,
} from '@/lib/scanner-types'
import {
  VULN_CATEGORY_CONFIG,
  VULN_SEVERITY_CONFIG,
  VULN_STATUS_CONFIG,
  getReferenceUrl,
} from '@/lib/scanner-types'

// ─── Icon Helpers ────────────────────────────────────────────

const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  Code, Database, ShieldAlert, Server, FileText, Terminal, FolderOpen,
  FolderSearch, ExternalLink, Layers, ArrowLeftRight, Shield,
  ShieldCheck, Lock, Cookie, KeyRound, Fingerprint, TerminalSquare,
  Braces, Upload, FileCode, Eye, Radio, Globe, Network, Package,
  Unlink, AlertTriangle, Webhook, FileSearch, Settings, Bug,
}

function CategoryIcon({ category, className = 'h-4 w-4' }: { category: VulnCategory; className?: string }) {
  const config = VULN_CATEGORY_CONFIG[category]
  const IconComp = CATEGORY_ICON_MAP[config.icon] || Bug
  return <IconComp className={className} />
}

function SeverityIcon({ severity, className = 'h-4 w-4' }: { severity: VulnSeverity; className?: string }) {
  switch (severity) {
    case 'critical': return <AlertOctagon className={className} />
    case 'high': return <AlertTriangle className={className} />
    case 'medium': return <AlertCircle className={className} />
    case 'low': return <Info className={className} />
    case 'info': return <Eye className={className} />
  }
}

// ─── Grade Badge ─────────────────────────────────────────────

function GradeBadge({ grade }: { grade: string }) {
  const gradeStyles: Record<string, string> = {
    'A+': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'A': 'bg-green-500/10 text-green-400 border-green-500/20',
    'B': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    'C': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    'D': 'bg-red-500/10 text-red-400 border-red-500/20',
    'F': 'bg-red-600/10 text-red-500 border-red-600/20',
  }
  return (
    <span className={`inline-flex items-center justify-center rounded-lg border px-2 py-0.5 text-xs font-bold ${gradeStyles[grade] || gradeStyles['F']}`}>
      {grade}
    </span>
  )
}

// ─── Scan Step Texts ─────────────────────────────────────────

const SCAN_STEPS = [
  'Initializing scan engine...',
  'Checking XSS vectors...',
  'Analyzing security headers...',
  'Testing injection points...',
  'Scanning SSL/TLS configuration...',
  'Probing authentication mechanisms...',
  'Examining CORS policies...',
  'Detecting information leakage...',
  'Evaluating cookie security...',
  'Crawling attack surface...',
  'Testing file inclusion paths...',
  'Checking CSRF protections...',
  'Scanning for exposed secrets...',
  'Analyzing Content Security Policy...',
  'Verifying access controls...',
]

// ─── Loading Animation ───────────────────────────────────────

function CyberpunkLoader({ scanMode }: { scanMode: ScanMode }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % SCAN_STEPS.length)
    }, 2200)
    return () => clearInterval(stepInterval)
  }, [])

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return prev + (Math.random() * 0.5)
        return prev + Math.random() * 3
      })
    }, 300)
    return () => clearInterval(progressInterval)
  }, [])

  const clampedProgress = Math.min(progress, 98)

  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center py-16">
      {/* Radar / Shield icon with pulse */}
      <div className="relative mb-8">
        {/* Outer scanning ring */}
        <div className="absolute -inset-6 rounded-full border border-purple-500/10 animate-spin [animation-duration:12s]" />
        <div className="absolute -inset-10 rounded-full border border-purple-500/5 animate-spin [animation-duration:20s]" style={{ animationDirection: 'reverse' }} />

        {/* Pulsing glow */}
        <div className="absolute -inset-4 rounded-full bg-purple-500/5 animate-pulse" />

        {/* Main icon */}
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 via-purple-600 to-cyan-600 shadow-2xl shadow-purple-500/30">
          <Radar className="h-10 w-10 text-white animate-pulse" />
        </div>

        {/* Corner accents */}
        <div className="absolute -top-1 -left-1 h-3 w-3 border-t-2 border-l-2 border-cyan-400/60 rounded-tl" />
        <div className="absolute -top-1 -right-1 h-3 w-3 border-t-2 border-r-2 border-cyan-400/60 rounded-tr" />
        <div className="absolute -bottom-1 -left-1 h-3 w-3 border-b-2 border-l-2 border-cyan-400/60 rounded-bl" />
        <div className="absolute -bottom-1 -right-1 h-3 w-3 border-b-2 border-r-2 border-cyan-400/60 rounded-br" />
      </div>

      <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
        <Shield className="h-5 w-5 text-purple-400" />
        Scanning for vulnerabilities
        <span className="inline-flex gap-0.5">
          <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
          <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
          <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
        </span>
      </h3>

      <AnimatePresence mode="wait">
        <motion.p
          key={stepIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="text-sm text-cyan-400/80 mb-6 font-mono h-5"
        >
          {SCAN_STEPS[stepIndex]}
        </motion.p>
      </AnimatePresence>

      {/* Progress bar */}
      <div className="w-72 space-y-2">
        <div className="h-1.5 rounded-full dark:bg-white/5 bg-black/5 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-red-500 via-purple-500 to-cyan-500"
            style={{ width: `${clampedProgress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-muted-foreground font-mono">
            {scanMode === 'deep' ? 'DEEP' : 'QUICK'} SCAN
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {Math.round(clampedProgress)}%
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Summary Dashboard ───────────────────────────────────────

function ScanSummaryDashboard({ summary }: { summary: ScanResult['summary'] }) {
  const stats = [
    { label: 'Risk Score', value: summary.riskScore, color: summary.riskScore >= 70 ? 'text-green-400' : summary.riskScore >= 40 ? 'text-yellow-400' : 'text-red-400', bg: 'dark:bg-white/[0.03] bg-card/80', isProminent: true },
    { label: 'Critical', value: summary.criticalCount, color: 'text-red-400', bg: 'bg-red-500/5' },
    { label: 'High', value: summary.highCount, color: 'text-orange-400', bg: 'bg-orange-500/5' },
    { label: 'Medium', value: summary.mediumCount, color: 'text-yellow-400', bg: 'bg-yellow-500/5' },
    { label: 'Low', value: summary.lowCount, color: 'text-blue-400', bg: 'bg-blue-500/5' },
    { label: 'Info', value: summary.infoCount, color: 'text-gray-400', bg: 'bg-gray-500/5' },
    { label: 'Passed', value: summary.passedChecks, color: 'text-green-400', bg: 'bg-green-500/5' },
    { label: 'Attack %', value: `${summary.exposedAttackSurface}%`, color: summary.exposedAttackSurface > 50 ? 'text-red-400' : 'text-yellow-400', bg: 'bg-purple-500/5' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`rounded-2xl border dark:border-white/[0.06] border-border/50 ${stat.bg} p-4 transition-colors ${stat.isProminent ? 'sm:col-span-1' : ''}`}
        >
          <div className="flex items-center gap-2">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            {stat.isProminent && <GradeBadge grade={summary.securityGrade} />}
          </div>
          <div className="text-[11px] text-muted-foreground font-medium mt-0.5">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Category Breakdown Chart ────────────────────────────────

function CategoryBreakdownChart({ breakdown }: { breakdown: Record<VulnCategory, number> }) {
  const sorted = Object.entries(breakdown)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8) as [VulnCategory, number][]

  if (sorted.length === 0) return null

  const maxCount = Math.max(...sorted.map(([, c]) => c), 1)

  return (
    <div className="rounded-2xl border dark:border-white/[0.06] border-border/50 dark:bg-white/[0.02] bg-card/80 p-5">
      <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-purple-400" />
        Vulnerability Distribution
      </h4>
      <div className="space-y-3">
        {sorted.map(([cat, count]) => {
          const config = VULN_CATEGORY_CONFIG[cat]
          const pct = Math.round((count / maxCount) * 100)
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

// ─── Risk Score Ring Panel ───────────────────────────────────

function RiskScorePanel({ summary }: { summary: ScanResult['summary'] }) {
  return (
    <div className="rounded-2xl border dark:border-white/[0.06] border-border/50 dark:bg-white/[0.02] bg-card/80 p-5 flex flex-col items-center">
      <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2 self-start">
        <Target className="h-4 w-4 text-purple-400" />
        Risk Score
      </h4>
      <ScoreRing score={summary.riskScore} size={120} strokeWidth={8} delay={0.3} showGlow />
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-4 w-full">
        {(['critical', 'high', 'medium', 'low', 'info'] as VulnSeverity[]).map((sev) => {
          const config = VULN_SEVERITY_CONFIG[sev]
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

// ─── Attack Paths ────────────────────────────────────────────

function AttackPathsSection({ paths }: { paths: string[] }) {
  if (paths.length === 0) return null

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Zap className="h-4 w-4 text-red-400" />
        Top Attack Paths
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {paths.map((path, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-xl border border-red-500/15 bg-red-500/[0.03] p-3"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-orange-600 text-white text-[10px] font-bold mt-0.5">
              {i + 1}
            </div>
            <p className="text-xs text-red-300/90 leading-relaxed">{path}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Vulnerability Card ──────────────────────────────────────

function VulnCard({
  vuln,
  onStatusChange,
  onMarkFalsePositive,
}: {
  vuln: VulnFinding
  onStatusChange: (id: string, status: VulnStatus) => void
  onMarkFalsePositive: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const catConfig = VULN_CATEGORY_CONFIG[vuln.category]
  const sevConfig = VULN_SEVERITY_CONFIG[vuln.severity]
  const statusConfig = VULN_STATUS_CONFIG[vuln.status]

  const exploitabilityStyle: Record<string, string> = {
    easy: 'text-red-400 bg-red-500/10 border-red-500/20',
    moderate: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    difficult: 'text-green-400 bg-green-500/10 border-green-500/20',
  }

  const impactStyle: Record<string, string> = {
    confidentiality: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    integrity: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    availability: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    multiple: 'text-red-400 bg-red-500/10 border-red-500/20',
  }

  const effortStyle: Record<string, string> = {
    low: 'text-green-400 bg-green-500/10 border-green-500/20',
    medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    high: 'text-red-400 bg-red-500/10 border-red-500/20',
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border transition-colors ${
        vuln.status === 'fixed'
          ? 'border-green-500/20 dark:bg-green-500/[0.02] bg-green-50/30 opacity-70'
          : vuln.status === 'false_positive'
          ? 'border-muted/20 dark:bg-white/[0.01] bg-muted/10 opacity-50'
          : `dark:border-white/[0.06] border-border/50 dark:bg-white/[0.02] bg-card/80 hover:dark:border-white/[0.12] hover:border-muted-foreground/20`
      }`}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!expanded) } }}
        className="flex w-full items-center justify-between p-4 sm:p-5 text-left transition-colors dark:hover:bg-white/[0.02] hover:bg-muted/20 cursor-pointer"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${catConfig.gradient} shadow-lg shadow-black/10 shrink-0`}>
            <CategoryIcon category={vuln.category} className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-semibold text-foreground truncate">{vuln.title}</h4>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-semibold ${sevConfig.color} ${sevConfig.bgColor} ${sevConfig.borderColor}`}>
                {sevConfig.label}
              </Badge>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-semibold text-purple-400 bg-purple-500/10 border-purple-500/20">
                CVSS {vuln.cvssScore.toFixed(1)}
              </Badge>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-semibold ${statusConfig.color} ${statusConfig.bgColor}`}>
                {statusConfig.label}
              </Badge>
              <span className="text-[10px] text-muted-foreground">{catConfig.label}</span>
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
      </div>

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
                <p className="text-sm text-muted-foreground leading-relaxed">{vuln.description}</p>
              </div>

              {/* Affected Endpoint */}
              <div>
                <h5 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Affected Endpoint</h5>
                <code className="text-xs font-mono dark:text-cyan-400 text-cyan-600 bg-cyan-500/5 border border-cyan-500/10 rounded-lg px-3 py-1.5 block overflow-x-auto">
                  {vuln.affectedEndpoint}
                </code>
              </div>

              {/* Proof of Detection */}
              <div>
                <h5 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Proof of Detection</h5>
                <div className="rounded-lg dark:bg-amber-500/5 bg-amber-50/50 border border-amber-500/10 p-3">
                  <p className="text-sm dark:text-amber-200/80 text-amber-700 leading-relaxed font-mono text-xs">{vuln.proofOfDetection}</p>
                </div>
              </div>

              {/* Root Cause */}
              <div>
                <h5 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Root Cause</h5>
                <p className="text-sm text-muted-foreground leading-relaxed">{vuln.rootCause}</p>
              </div>

              {/* Recommended Fix */}
              <div className="rounded-xl dark:bg-green-500/5 bg-green-50/50 border border-green-500/10 p-3.5">
                <h5 className="text-[11px] font-semibold uppercase tracking-wider text-green-400 mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Recommended Fix
                </h5>
                <p className="text-sm text-muted-foreground leading-relaxed">{vuln.recommendedFix}</p>
              </div>

              {/* Badges: Exploitability + Impact + Remediation Effort */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={`text-[10px] px-2 py-0.5 font-semibold ${exploitabilityStyle[vuln.exploitability]}`}>
                  <Zap className="h-3 w-3 mr-1" />
                  Exploitability: {vuln.exploitability}
                </Badge>
                <Badge variant="outline" className={`text-[10px] px-2 py-0.5 font-semibold ${impactStyle[vuln.impact]}`}>
                  <Target className="h-3 w-3 mr-1" />
                  Impact: {vuln.impact}
                </Badge>
                <Badge variant="outline" className={`text-[10px] px-2 py-0.5 font-semibold ${effortStyle[vuln.remediationEffort]}`}>
                  <Shield className="h-3 w-3 mr-1" />
                  Effort: {vuln.remediationEffort}
                </Badge>
              </div>

              {/* OWASP / CVE References */}
              {vuln.references.length > 0 && (
                <div>
                  <h5 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">References</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {vuln.references.map((ref, i) => {
                      const url = getReferenceUrl(ref)
                      const handleRefClick = (e: React.MouseEvent) => {
                        e.stopPropagation()
                        e.preventDefault()
                        const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
                        if (!newWindow) {
                          // Fallback: copy URL to clipboard if popup blocked
                          navigator.clipboard.writeText(url).then(() => {
                            // brief visual feedback is handled by the toast in parent
                          }).catch(() => {
                            // Last resort: change location
                            window.location.href = url
                          })
                        }
                      }
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={handleRefClick}
                          title={`${ref} — ${url}`}
                          className="inline-flex items-center gap-1 rounded-md border border-purple-500/15 bg-purple-500/5 px-2 py-0.5 text-[10px] font-medium text-purple-400 hover:bg-purple-500/15 hover:border-purple-500/25 hover:text-purple-300 transition-colors text-left"
                        >
                          <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                          <span className="truncate max-w-[180px]">{ref}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Status Toggle Buttons */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="text-[11px] text-muted-foreground mr-1">Status:</span>
                {(['open', 'confirmed', 'false_positive', 'accepted', 'fixed'] as VulnStatus[]).map((status) => {
                  const cfg = VULN_STATUS_CONFIG[status]
                  const isActive = vuln.status === status
                  return (
                    <button
                      key={status}
                      onClick={(e) => { e.stopPropagation(); onStatusChange(vuln.id, status) }}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                        isActive
                          ? `${cfg.color} ${cfg.bgColor} border-current/20`
                          : 'border-transparent text-muted-foreground/50 hover:text-muted-foreground'
                      }`}
                    >
                      {cfg.icon === 'AlertCircle' && <AlertCircle className="h-3 w-3" />}
                      {cfg.icon === 'CheckCircle2' && <CheckCircle2 className="h-3 w-3" />}
                      {cfg.icon === 'XCircle' && <XCircle className="h-3 w-3" />}
                      {cfg.icon === 'Check' && <CheckCircle2 className="h-3 w-3" />}
                      {cfg.label}
                    </button>
                  )
                })}
              </div>

              {/* Quick Mark as False Positive */}
              {vuln.status !== 'false_positive' && (
                <button
                  onClick={(e) => { e.stopPropagation(); onMarkFalsePositive(vuln.id) }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-muted-foreground/10 px-2.5 py-1 text-[11px] font-medium text-muted-foreground/60 hover:text-muted-foreground hover:border-muted-foreground/20 transition-colors"
                >
                  <XCircle className="h-3 w-3" />
                  Mark as False Positive
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────

function EmptyVulnState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10 border border-green-500/20 mb-4">
        <ShieldCheck className="h-8 w-8 text-green-400" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">No vulnerabilities found</h3>
      <p className="text-sm text-muted-foreground max-w-md">
        No vulnerabilities match your current filters. Try adjusting your search or filter criteria.
      </p>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────

interface ScannerDashboardProps {
  websiteUrl: string
  websiteDomain: string
  reportId: string
}

export function ScannerDashboard({ websiteUrl, websiteDomain, reportId }: ScannerDashboardProps) {
  const { toast } = useToast()
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<ScannerTabFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<VulnCategory | 'all'>('all')
  const [severityFilter, setSeverityFilter] = useState<VulnSeverity | 'all'>('all')
  const [sortBy, setSortBy] = useState<'severity' | 'cvss' | 'category' | 'exploitability'>('severity')
  const [showFilters, setShowFilters] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [scanMode, setScanMode] = useState<ScanMode>('quick')
  const abortRef = useRef<AbortController | null>(null)

  // Fetch scan
  const fetchScan = useCallback(async (mode: ScanMode) => {
    if (abortRef.current) {
      abortRef.current.abort()
    }
    const controller = new AbortController()
    abortRef.current = controller

    setIsLoading(true)
    setErrorMessage(null)
    setScanResult(null)

    try {
      const res = await fetch('/api/scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl, reportId, scanMode: mode }),
        signal: controller.signal,
      })
      const data = await res.json()
      if (data.success && data.data) {
        setScanResult(data.data)
      } else {
        const msg = data.error || 'Could not complete security scan.'
        setErrorMessage(msg)
        toast({ title: 'Scan Failed', description: msg, variant: 'destructive' })
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      const msg = 'Network error. Please check your connection and try again.'
      setErrorMessage(msg)
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [websiteUrl, reportId, toast])

  // Auto-fetch on mount
  useEffect(() => {
    fetchScan(scanMode)
    return () => {
      if (abortRef.current) abortRef.current.abort()
    }
  }, [])

  // Handle scan mode change
  const handleScanModeChange = useCallback((mode: ScanMode) => {
    setScanMode(mode)
    fetchScan(mode)
  }, [fetchScan])

  // Handle status change
  const handleStatusChange = useCallback((vulnId: string, status: VulnStatus) => {
    setScanResult((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        vulnerabilities: prev.vulnerabilities.map((v) =>
          v.id === vulnId ? { ...v, status, isFalsePositive: status === 'false_positive' } : v
        ),
      }
    })
  }, [])

  // Handle mark as false positive
  const handleMarkFalsePositive = useCallback((vulnId: string) => {
    handleStatusChange(vulnId, 'false_positive')
    toast({ title: 'Marked as False Positive', description: 'Vulnerability status updated.' })
  }, [handleStatusChange, toast])

  // Filter & sort vulnerabilities
  const filteredVulns = useMemo(() => {
    if (!scanResult) return []

    let vulns = [...scanResult.vulnerabilities]

    // Tab filter
    if (activeTab === 'critical') vulns = vulns.filter((v) => v.severity === 'critical')
    else if (activeTab === 'high') vulns = vulns.filter((v) => v.severity === 'high' || v.severity === 'critical')
    else if (activeTab === 'confirmed') vulns = vulns.filter((v) => v.status === 'confirmed')
    else if (activeTab === 'false_positive') vulns = vulns.filter((v) => v.status === 'false_positive')

    // Category filter
    if (categoryFilter !== 'all') vulns = vulns.filter((v) => v.category === categoryFilter)

    // Severity filter
    if (severityFilter !== 'all') vulns = vulns.filter((v) => v.severity === severityFilter)

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      vulns = vulns.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.description.toLowerCase().includes(q) ||
          v.affectedEndpoint.toLowerCase().includes(q) ||
          v.recommendedFix.toLowerCase().includes(q) ||
          v.rootCause.toLowerCase().includes(q)
      )
    }

    // Sort
    const severityOrder: Record<VulnSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }
    const exploitOrder: Record<string, number> = { easy: 0, moderate: 1, difficult: 2 }

    if (sortBy === 'severity') vulns.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity] || b.cvssScore - a.cvssScore)
    else if (sortBy === 'cvss') vulns.sort((a, b) => b.cvssScore - a.cvssScore)
    else if (sortBy === 'category') vulns.sort((a, b) => a.category.localeCompare(b.category))
    else if (sortBy === 'exploitability') vulns.sort((a, b) => exploitOrder[a.exploitability] - exploitOrder[b.exploitability])

    return vulns
  }, [scanResult, activeTab, categoryFilter, severityFilter, searchQuery, sortBy])

  // Tab counts
  const tabCounts = useMemo(() => {
    if (!scanResult) return { all: 0, critical: 0, high: 0, confirmed: 0, false_positive: 0 }
    const vulns = scanResult.vulnerabilities
    return {
      all: vulns.length,
      critical: vulns.filter((v) => v.severity === 'critical').length,
      high: vulns.filter((v) => v.severity === 'high' || v.severity === 'critical').length,
      confirmed: vulns.filter((v) => v.status === 'confirmed').length,
      false_positive: vulns.filter((v) => v.status === 'false_positive').length,
    }
  }, [scanResult])

  // Categories with findings (for filter)
  const activeCategories = useMemo(() => {
    if (!scanResult) return []
    const cats = new Set(scanResult.vulnerabilities.map((v) => v.category))
    return [...cats].sort()
  }, [scanResult])

  // ─── Export Handlers ──────────────────────────────────────

  const handleExportJSON = useCallback(() => {
    if (!scanResult) return
    setIsExporting(true)
    try {
      const blob = new Blob([JSON.stringify(scanResult, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `security-scan-${websiteDomain}-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast({ title: 'JSON Exported', description: 'Security scan results downloaded as JSON.' })
    } catch {
      toast({ title: 'Export Failed', description: 'Could not export JSON.', variant: 'destructive' })
    } finally {
      setIsExporting(false)
    }
  }, [scanResult, websiteDomain, toast])

  const handleExportPDF = useCallback(() => {
    if (!scanResult) return
    setIsExporting(true)
    try {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        const primaryColor = '#dc2626'
        const s = scanResult.summary
        printWindow.document.write(`<!DOCTYPE html><html><head><title>Security Scan - ${websiteDomain}</title>
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
          .vuln { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 12px 32px; page-break-inside: avoid; }
          .vuln-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
          .vuln-header h3 { font-size: 14px; font-weight: 600; }
          .severity { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
          .severity-critical { background: #fef2f2; color: #dc2626; }
          .severity-high { background: #fff7ed; color: #ea580c; }
          .severity-medium { background: #fefce8; color: #ca8a04; }
          .severity-low { background: #eff6ff; color: #2563eb; }
          .severity-info { background: #f9fafb; color: #6b7280; }
          .vuln-detail { font-size: 13px; color: #374151; margin: 4px 0; }
          .vuln-detail strong { color: #1a1a2e; }
          .fix-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; margin-top: 8px; }
          .fix-box strong { color: #166534; }
          .endpoint { font-family: monospace; font-size: 12px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
          .footer { text-align: center; padding: 16px 32px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; margin-top: 24px; }
          @media print { .no-print { display: none; } }
        </style></head><body>
        <div class="header"><h1>Security Scan Report — ${websiteDomain}</h1><div class="subtitle">Generated by Vulnerability Scanner AI · ${new Date().toLocaleDateString()} · ${scanResult.scanMode.toUpperCase()} Scan</div></div>
        <div class="summary">
          <div class="summary-item"><div class="value" style="color:${primaryColor}">${s.riskScore}/100</div><div class="label">Risk Score (${s.securityGrade})</div></div>
          <div class="summary-item"><div class="value" style="color:#dc2626">${s.criticalCount}</div><div class="label">Critical</div></div>
          <div class="summary-item"><div class="value" style="color:#ea580c">${s.highCount}</div><div class="label">High</div></div>
          <div class="summary-item"><div class="value" style="color:#22c55e">${s.passedChecks}</div><div class="label">Passed</div></div>
        </div>
        ${scanResult.vulnerabilities.map((v, i) => `
          <div class="vuln">
            <div class="vuln-header">
              <h3>${i + 1}. ${v.title}</h3>
              <span class="severity severity-${v.severity}">${VULN_SEVERITY_CONFIG[v.severity].label} (${v.cvssScore.toFixed(1)})</span>
            </div>
            <div class="vuln-detail"><strong>Category:</strong> ${VULN_CATEGORY_CONFIG[v.category].label}</div>
            <div class="vuln-detail"><strong>Endpoint:</strong> <span class="endpoint">${v.affectedEndpoint}</span></div>
            <div class="vuln-detail">${v.description}</div>
            <div class="vuln-detail"><strong>Root Cause:</strong> ${v.rootCause}</div>
            <div class="fix-box"><strong>Fix:</strong> ${v.recommendedFix}</div>
            <div class="vuln-detail"><strong>Exploitability:</strong> ${v.exploitability} | <strong>Impact:</strong> ${v.impact} | <strong>Effort:</strong> ${v.remediationEffort}</div>
          </div>
        `).join('')}
        <div class="footer">Security Scan Report · ${websiteDomain} · ${new Date().toLocaleDateString()}</div>
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
  }, [scanResult, websiteDomain, toast])

  const handleCopySummary = useCallback(async () => {
    if (!scanResult) return
    const s = scanResult.summary
    const lines = [
      `Security Scan: ${websiteDomain}`,
      `Risk Score: ${s.riskScore}/100 (Grade: ${s.securityGrade})`,
      `Scan Mode: ${scanResult.scanMode.toUpperCase()}`,
      `Total Vulnerabilities: ${s.totalVulns} (Critical: ${s.criticalCount}, High: ${s.highCount}, Medium: ${s.mediumCount}, Low: ${s.lowCount}, Info: ${s.infoCount})`,
      `Passed Checks: ${s.passedChecks}`,
      `Attack Surface: ${s.exposedAttackSurface}%`,
      `Exploitability Score: ${s.exploitabilityScore}/100`,
      '',
      'Top Attack Paths:',
      ...s.topAttackPaths.map((p, i) => `  ${i + 1}. ${p}`),
      '',
      'Top Vulnerabilities:',
      ...scanResult.vulnerabilities.slice(0, 10).map((v, i) => `${i + 1}. [${VULN_SEVERITY_CONFIG[v.severity].label}] ${v.title} (CVSS ${v.cvssScore.toFixed(1)}) — ${v.recommendedFix}`),
    ]
    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      toast({ title: 'Copied!', description: 'Security scan summary copied to clipboard.' })
    } catch {
      toast({ title: 'Copy Failed', description: 'Could not copy to clipboard.', variant: 'destructive' })
    }
  }, [scanResult, websiteDomain, toast])

  // ─── Loading State ──────────────────────────────────────
  if (isLoading) {
    return <CyberpunkLoader scanMode={scanMode} />
  }

  // ─── Error State ────────────────────────────────────────
  if (!scanResult && !isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 mb-4">
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Scan Failed</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-md text-center">
          {errorMessage || 'Could not complete the security scan for this website.'}
        </p>
        <Button onClick={() => fetchScan(scanMode)} variant="outline" className="rounded-xl">
          <Loader2 className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </div>
    )
  }

  const summary = scanResult!.summary

  return (
    <div className="space-y-6">
      {/* ── Header + Scan Mode Toggle ──────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 via-purple-600 to-cyan-600 shadow-lg shadow-purple-500/20">
              <Radar className="h-4 w-4 text-white" />
            </div>
            Vulnerability Scanner
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Security analysis for <span className="text-foreground font-medium">{websiteDomain}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Scan Mode Toggle */}
          <div className="flex items-center rounded-xl border dark:border-white/[0.06] border-border/50 dark:bg-white/[0.02] bg-card/80 p-0.5">
            <button
              onClick={() => scanMode !== 'quick' && handleScanModeChange('quick')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                scanMode === 'quick'
                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Zap className="h-3 w-3 inline mr-1" />
              Quick
            </button>
            <button
              onClick={() => scanMode !== 'deep' && handleScanModeChange('deep')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                scanMode === 'deep'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Shield className="h-3 w-3 inline mr-1" />
              Deep
            </button>
          </div>

          {/* Scan metadata */}
          <div className="hidden sm:flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
            <span>{scanResult!.pagesScanned} page{scanResult!.pagesScanned !== 1 ? 's' : ''}</span>
            <span>·</span>
            <span>{scanResult!.checksPerformed} checks</span>
            <span>·</span>
            <span>{scanResult!.scanDuration}s</span>
          </div>
        </div>
      </div>

      {/* ── Summary Stats ──────────────────────────────── */}
      <ScanSummaryDashboard summary={summary} />

      {/* ── Charts Row ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <CategoryBreakdownChart breakdown={summary.categoryBreakdown} />
        </div>
        <div className="lg:col-span-2">
          <RiskScorePanel summary={summary} />
        </div>
      </div>

      {/* ── Attack Paths ───────────────────────────────── */}
      <AttackPathsSection paths={summary.topAttackPaths} />

      {/* ── Tabs ───────────────────────────────────────── */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {([
          { key: 'all', label: 'All' },
          { key: 'critical', label: 'Critical' },
          { key: 'high', label: 'High+' },
          { key: 'confirmed', label: 'Confirmed' },
          { key: 'false_positive', label: 'False Positive' },
        ] as { key: ScannerTabFilter; label: string }[]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : 'text-muted-foreground hover:text-foreground dark:hover:bg-white/5 hover:bg-muted/50 border border-transparent'
            }`}
          >
            {tab.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              activeTab === tab.key ? 'bg-red-500/15 text-red-400' : 'dark:bg-white/5 bg-muted/50 text-muted-foreground'
            }`}>
              {tabCounts[tab.key]}
            </span>
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search vulnerabilities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 rounded-lg border-0 dark:bg-white/5 bg-muted/50 pl-8 text-xs w-40 sm:w-48 focus-visible:ring-1 focus-visible:ring-red-500/50"
            />
          </div>

          {/* Filter toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`rounded-xl text-xs h-8 ${showFilters ? 'border-red-500/20 text-red-400' : ''}`}
          >
            <Filter className="mr-1.5 h-3.5 w-3.5" />
            Filters
          </Button>

          {/* Sort */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const sorts: typeof sortBy[] = ['severity', 'cvss', 'category', 'exploitability']
              const idx = sorts.indexOf(sortBy)
              setSortBy(sorts[(idx + 1) % sorts.length])
            }}
            className="rounded-xl text-xs h-8"
          >
            <ArrowUpDown className="mr-1.5 h-3.5 w-3.5" />
            {sortBy === 'severity' ? 'Severity' : sortBy === 'cvss' ? 'CVSS' : sortBy === 'category' ? 'Category' : 'Exploit'}
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
              {/* Category filter */}
              <div>
                <span className="text-[11px] text-muted-foreground font-medium mr-2">Category:</span>
                <div className="inline-flex gap-1 flex-wrap">
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      categoryFilter === 'all' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-muted-foreground hover:text-foreground border border-transparent'
                    }`}
                  >
                    All
                  </button>
                  {activeCategories.map((cat) => {
                    const config = VULN_CATEGORY_CONFIG[cat]
                    return (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                          categoryFilter === cat ? `${config.color} bg-gradient-to-r ${config.gradient}/10 border border-current/20` : 'text-muted-foreground hover:text-foreground border border-transparent'
                        }`}
                      >
                        {config.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="h-4 w-px dark:bg-white/10 bg-border" />

              {/* Severity filter */}
              <div>
                <span className="text-[11px] text-muted-foreground font-medium mr-2">Severity:</span>
                <div className="inline-flex gap-1">
                  <button
                    onClick={() => setSeverityFilter('all')}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      severityFilter === 'all' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-muted-foreground hover:text-foreground border border-transparent'
                    }`}
                  >
                    All
                  </button>
                  {(['critical', 'high', 'medium', 'low', 'info'] as VulnSeverity[]).map((sev) => (
                    <button
                      key={sev}
                      onClick={() => setSeverityFilter(sev)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                        severityFilter === sev ? `${VULN_SEVERITY_CONFIG[sev].color} ${VULN_SEVERITY_CONFIG[sev].bgColor} border ${VULN_SEVERITY_CONFIG[sev].borderColor}` : 'text-muted-foreground hover:text-foreground border border-transparent'
                      }`}
                    >
                      {VULN_SEVERITY_CONFIG[sev].label}
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

      {/* ── Vulnerability List ─────────────────────────── */}
      <div className="space-y-2.5 max-h-[800px] overflow-y-auto pr-1 custom-scrollbar">
        {filteredVulns.length === 0 ? (
          <EmptyVulnState />
        ) : (
          filteredVulns.map((vuln) => (
            <VulnCard
              key={vuln.id}
              vuln={vuln}
              onStatusChange={handleStatusChange}
              onMarkFalsePositive={handleMarkFalsePositive}
            />
          ))
        )}
      </div>

      {/* ── Export Bar ─────────────────────────────────── */}
      <div className="flex items-center gap-2 pt-2 border-t dark:border-white/[0.05] border-border/50">
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
          Export JSON
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPDF}
          disabled={isExporting}
          className="rounded-xl text-xs h-8"
        >
          {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="mr-1.5 h-3.5 w-3.5" />}
          Export PDF
        </Button>
      </div>
    </div>
  )
}
