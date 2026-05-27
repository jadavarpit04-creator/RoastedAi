'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cpu,
  ChevronDown,
  ChevronRight,
  Download,
  Copy,
  Search,
  Zap,
  Shield,
  BarChart3,
  Clock,
  Globe,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  RefreshCw,
  History,
  FileJson,
  FileText,
  Trash2,
  ArrowRightLeft,
  Sparkles,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScoreRing } from '@/components/score-ring'
import { useToast } from '@/hooks/use-toast'
import { usePlanFeatures } from '@/hooks/use-plan-features'
import { FEATURES } from '@/lib/plan-config'
import { TechCategory, CATEGORY_META } from '@/lib/tech-detection-rules'
// getCachedHtml is server-side only — not available in client components

// ─── Types ──────────────────────────────────────────────────────────────────

type Confidence = 'high' | 'medium' | 'low'

interface DetectedTechnology {
  id: string
  name: string
  category: TechCategory
  icon: string
  confidence: Confidence
  version: string | null
  patterns?: string[]
  description?: string
  source?: 'regex' | 'ai' | 'merged'
}

interface Insight {
  type: 'security' | 'performance' | 'recommendation' | 'info'
  title: string
  description: string
  severity: 'high' | 'medium' | 'low'
}

interface AnalysisData {
  url: string
  domain: string
  technologies: DetectedTechnology[]
  insights: Insight[]
  modernScore: number
  scanMode: 'quick' | 'deep'
  scanTime: number
  totalTechnologies: number
  detectionMethod?: 'regex' | 'ai' | 'hybrid'
}

interface HistoryEntry {
  id: string
  url: string
  domain: string
  timestamp: number
  totalTechnologies: number
  modernScore: number
  topTechs: string[]
}

interface TechAnalyzerPanelProps {
  websiteUrl: string
  websiteDomain: string
  reportId: string
}

// ─── Constants ──────────────────────────────────────────────────────────────

const PROGRESS_STEPS = [
  { label: 'Connecting to server', icon: Globe },
  { label: 'Fetching page data', icon: Eye },
  { label: 'Analyzing technologies', icon: Cpu },
  { label: 'Generating insights', icon: Sparkles },
  { label: 'Calculating scores', icon: BarChart3 },
]

const HISTORY_STORAGE_KEY = 'tech-analyzer-history'
const MAX_HISTORY_ENTRIES = 50

const CONFIDENCE_CONFIG: Record<Confidence, { emoji: string; label: string; color: string; bg: string; border: string }> = {
  high: { emoji: '🟢', label: 'High', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  medium: { emoji: '🟡', label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  low: { emoji: '🔴', label: 'Low', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
}

const INSIGHT_TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  security: { icon: Shield, color: 'text-red-400', bg: 'bg-red-500/5', border: 'border-red-500/20' },
  performance: { icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/5', border: 'border-yellow-500/20' },
  recommendation: { icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-500/5', border: 'border-purple-500/20' },
  info: { icon: Eye, color: 'text-blue-400', bg: 'bg-blue-500/5', border: 'border-blue-500/20' },
}

const SEVERITY_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  high: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  low: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

function loadHistory(): HistoryEntry[] {
  try {
    if (typeof window === 'undefined') return []
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.slice(0, MAX_HISTORY_ENTRIES)
  } catch {
    return []
  }
}

function saveHistory(entries: HistoryEntry[]): void {
  try {
    if (typeof window === 'undefined') return
    const trimmed = entries.slice(0, MAX_HISTORY_ENTRIES)
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmed))
  } catch {
    // localStorage may be full or unavailable
  }
}

function addToHistory(entry: HistoryEntry): HistoryEntry[] {
  const existing = loadHistory()
  // Remove duplicate by URL
  const filtered = existing.filter(e => e.url !== entry.url)
  const updated = [entry, ...filtered].slice(0, MAX_HISTORY_ENTRIES)
  saveHistory(updated)
  return updated
}

function removeFromHistory(id: string): HistoryEntry[] {
  const existing = loadHistory()
  const updated = existing.filter(e => e.id !== id)
  saveHistory(updated)
  return updated
}

function clearAllHistory(): HistoryEntry[] {
  saveHistory([])
  return []
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHrs = Math.floor(diffMin / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString()
}

function groupTechnologiesByCategory(techs: DetectedTechnology[]): Record<string, DetectedTechnology[]> {
  const groups: Record<string, DetectedTechnology[]> = {}
  for (const tech of techs) {
    const cat = tech.category
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(tech)
  }
  // Sort each group by confidence (high first), then name
  const confidenceOrder: Record<Confidence, number> = { high: 0, medium: 1, low: 2 }
  for (const cat of Object.keys(groups)) {
    groups[cat].sort((a, b) => confidenceOrder[a.confidence] - confidenceOrder[b.confidence] || a.name.localeCompare(b.name))
  }
  return groups
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function ProgressLoader({ currentStep, scanMode }: { currentStep: number; scanMode: 'quick' | 'deep' }) {
  const progress = Math.min(((currentStep + 0.5) / PROGRESS_STEPS.length) * 100, 98)

  return (
    <div className="min-h-[350px] flex flex-col items-center justify-center py-12">
      {/* Main animated icon */}
      <div className="relative mb-8">
        <div className="absolute -inset-6 rounded-full border border-purple-500/10 animate-spin [animation-duration:12s]" />
        <div className="absolute -inset-10 rounded-full border border-purple-500/5 animate-spin [animation-duration:20s]" style={{ animationDirection: 'reverse' }} />
        <div className="absolute -inset-4 rounded-full bg-purple-500/5 animate-pulse" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-violet-600 shadow-2xl shadow-purple-500/30">
          <Cpu className="h-10 w-10 text-white animate-pulse" />
        </div>
        <div className="absolute -top-1 -left-1 h-3 w-3 border-t-2 border-l-2 border-purple-400/60 rounded-tl" />
        <div className="absolute -top-1 -right-1 h-3 w-3 border-t-2 border-r-2 border-purple-400/60 rounded-tr" />
        <div className="absolute -bottom-1 -left-1 h-3 w-3 border-b-2 border-l-2 border-purple-400/60 rounded-bl" />
        <div className="absolute -bottom-1 -right-1 h-3 w-3 border-b-2 border-r-2 border-purple-400/60 rounded-br" />
      </div>

      <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
        <Cpu className="h-5 w-5 text-purple-400" />
        Analyzing Tech Stack
        <span className="inline-flex gap-0.5">
          <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
          <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
          <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
        </span>
      </h3>

      <AnimatePresence mode="wait">
        <motion.p
          key={currentStep}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="text-sm text-purple-400/80 mb-6 font-mono h-5"
        >
          {PROGRESS_STEPS[currentStep]?.label || 'Finalizing...'}
        </motion.p>
      </AnimatePresence>

      {/* Step progress bar */}
      <div className="w-80 space-y-3">
        <div className="h-1.5 rounded-full dark:bg-white/5 bg-black/5 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-600"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-muted-foreground font-mono">
            {scanMode.toUpperCase()} SCAN
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            Step {currentStep + 1}/{PROGRESS_STEPS.length}
          </span>
        </div>
        {/* Step dots */}
        <div className="flex items-center justify-between gap-1">
          {PROGRESS_STEPS.map((step, i) => {
            const StepIcon = step.icon
            const isCompleted = i < currentStep
            const isCurrent = i === currentStep
            return (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-300 ${
                  isCompleted
                    ? 'bg-green-500/20 border border-green-500/30'
                    : isCurrent
                    ? 'bg-purple-500/20 border border-purple-500/40 animate-pulse'
                    : 'dark:bg-white/5 bg-black/5 border border-transparent'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                  ) : (
                    <StepIcon className={`h-3.5 w-3.5 ${isCurrent ? 'text-purple-400' : 'text-muted-foreground/40'}`} />
                  )}
                </div>
                <span className={`text-[8px] font-medium text-center leading-tight ${
                  isCurrent ? 'text-purple-400' : isCompleted ? 'text-green-400/60' : 'text-muted-foreground/30'
                }`}>
                  {step.label.split(' ')[0]}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="min-h-[350px] flex flex-col items-center justify-center py-12">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 mb-4">
        <AlertTriangle className="h-8 w-8 text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">Analysis Failed</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md text-center leading-relaxed">{message}</p>
      <Button
        onClick={onRetry}
        className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40"
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Try Again
      </Button>
    </div>
  )
}

function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  const config = CONFIDENCE_CONFIG[confidence]
  return (
    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-semibold ${config.color} ${config.bg} ${config.border}`}>
      {config.emoji} {config.label}
    </Badge>
  )
}

function InsightCard({ insight }: { insight: Insight }) {
  const typeConfig = INSIGHT_TYPE_CONFIG[insight.type] || INSIGHT_TYPE_CONFIG.info
  const sevConfig = SEVERITY_STYLES[insight.severity] || SEVERITY_STYLES.low
  const Icon = typeConfig.icon

  return (
    <div className={`rounded-xl border ${typeConfig.border} ${typeConfig.bg} p-4 transition-colors dark:hover:bg-opacity-10`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${typeConfig.bg} border ${typeConfig.border} shrink-0`}>
          <Icon className={`h-4 w-4 ${typeConfig.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h5 className="text-sm font-semibold text-foreground">{insight.title}</h5>
            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 font-semibold ${sevConfig.color} ${sevConfig.bg} ${sevConfig.border}`}>
              {insight.severity.toUpperCase()}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
        </div>
      </div>
    </div>
  )
}

function TechCard({ tech }: { tech: DetectedTechnology }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border dark:border-white/[0.06] border-border/50 dark:bg-white/[0.02] bg-card/80 p-3 transition-colors dark:hover:border-white/[0.12] hover:border-muted-foreground/20 dark:hover:bg-white/[0.04] hover:bg-muted/30 group">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg dark:bg-white/[0.06] bg-muted shrink-0 text-lg">
        {tech.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground truncate">{tech.name}</span>
          {tech.version && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono text-purple-400 bg-purple-500/10 border-purple-500/20">
              v{tech.version}
            </Badge>
          )}
          {tech.source === 'ai' && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono text-cyan-400 bg-cyan-500/10 border-cyan-500/20">
              AI ✨
            </Badge>
          )}
          {tech.source === 'merged' && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono text-green-400 bg-green-500/10 border-green-500/20">
              Verified ✓
            </Badge>
          )}
        </div>
        {tech.description && (
          <p className="text-[11px] text-muted-foreground/60 truncate mt-0.5">{tech.description}</p>
        )}
      </div>
      <div className="shrink-0">
        <ConfidenceBadge confidence={tech.confidence} />
      </div>
    </div>
  )
}

function CategorySection({
  category,
  techs,
  isExpanded,
  onToggle,
}: {
  category: TechCategory
  techs: DetectedTechnology[]
  isExpanded: boolean
  onToggle: () => void
}) {
  const meta = CATEGORY_META[category]
  if (!meta) return null

  const highCount = techs.filter(t => t.confidence === 'high').length
  const medCount = techs.filter(t => t.confidence === 'medium').length
  const lowCount = techs.filter(t => t.confidence === 'low').length

  return (
    <div className="overflow-hidden rounded-2xl border dark:border-white/[0.06] border-border/50 dark:bg-white/[0.02] bg-card/80">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 sm:p-5 text-left transition-colors dark:hover:bg-white/[0.03] hover:bg-muted/30"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/20 shrink-0">
            <span className="text-lg">{meta.icon}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-foreground text-sm sm:text-base">{meta.label}</h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span>{techs.length} tech{techs.length !== 1 ? 's' : ''}</span>
              {highCount > 0 && <span className="text-green-400/70">🟢 {highCount}</span>}
              {medCount > 0 && <span className="text-yellow-400/70">🟡 {medCount}</span>}
              {lowCount > 0 && <span className="text-red-400/70">🔴 {lowCount}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-semibold text-muted-foreground dark:bg-white/[0.04] bg-muted border-border/50">
            {techs.length}
          </Badge>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t dark:border-white/[0.05] border-border/50 px-4 sm:px-5 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {techs.map(tech => (
                  <TechCard key={tech.id} tech={tech} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function HistoryPanel({
  history,
  searchQuery,
  onSearchChange,
  onSelect,
  onRemove,
  onClearAll,
}: {
  history: HistoryEntry[]
  searchQuery: string
  onSearchChange: (q: string) => void
  onSelect: (entry: HistoryEntry) => void
  onRemove: (id: string) => void
  onClearAll: () => void
}) {
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return history
    const q = searchQuery.toLowerCase()
    return history.filter(
      e => e.domain.toLowerCase().includes(q) || e.url.toLowerCase().includes(q) || e.topTechs.some(t => t.toLowerCase().includes(q))
    )
  }, [history, searchQuery])

  return (
    <div className="rounded-2xl border dark:border-white/[0.06] border-border/50 dark:bg-white/[0.02] bg-card/80 overflow-hidden">
      <div className="p-4 border-b dark:border-white/[0.05] border-border/50">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <History className="h-4 w-4 text-purple-400" />
            Scan History
          </h4>
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="text-xs text-red-400/70 hover:text-red-400 h-7 px-2"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search history..."
            className="pl-8 h-8 text-xs rounded-lg dark:bg-white/[0.04] bg-muted border-border/50"
          />
        </div>
      </div>
      <div className="max-h-72 overflow-y-auto custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground/50">
            {history.length === 0 ? 'No scan history yet' : 'No matching results'}
          </div>
        ) : (
          <div className="divide-y dark:divide-white/[0.04] divide-border/30">
            {filtered.map(entry => (
              <div
                key={entry.id}
                className="flex items-center gap-3 p-3 transition-colors dark:hover:bg-white/[0.03] hover:bg-muted/30 cursor-pointer group"
                onClick={() => onSelect(entry)}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20 shrink-0">
                  <Globe className="h-3.5 w-3.5 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-foreground truncate">{entry.domain}</div>
                  <div className="text-[10px] text-muted-foreground/60 truncate">
                    {entry.topTechs.slice(0, 3).join(' · ')} · {formatTimestamp(entry.timestamp)}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className={`text-[9px] px-1.5 py-0 font-semibold ${
                    entry.modernScore >= 70 ? 'text-green-400 bg-green-500/10 border-green-500/20'
                    : entry.modernScore >= 40 ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
                    : 'text-red-400 bg-red-500/10 border-red-500/20'
                  }`}>
                    {entry.modernScore}
                  </Badge>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-muted-foreground dark:bg-white/[0.04] bg-muted border-border/50">
                    {entry.totalTechnologies} techs
                  </Badge>
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemove(entry.id) }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3 w-3 text-red-400/60" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ComparisonView({
  primary,
  comparisonData,
  comparisonUrl,
}: {
  primary: AnalysisData
  comparisonData: AnalysisData | null
  comparisonUrl: string
}) {
  if (!comparisonData) {
    return (
      <div className="rounded-2xl border dark:border-white/[0.06] border-border/50 dark:bg-white/[0.02] bg-card/80 p-8 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-purple-400 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Analyzing {comparisonUrl}...</p>
      </div>
    )
  }

  const allCategories = new Set<TechCategory>([
    ...primary.technologies.map(t => t.category),
    ...comparisonData.technologies.map(t => t.category),
  ])

  const primaryIds = new Set(primary.technologies.map(t => t.id))
  const compIds = new Set(comparisonData.technologies.map(t => t.id))

  const onlyInPrimary = primary.technologies.filter(t => !compIds.has(t.id))
  const onlyInComp = comparisonData.technologies.filter(t => !primaryIds.has(t.id))
  const common = primary.technologies.filter(t => compIds.has(t.id))

  return (
    <div className="space-y-4">
      {/* Side by side score */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { data: primary, label: 'Primary' },
          { data: comparisonData, label: 'Comparison' },
        ].map(({ data, label }) => (
          <div
            key={label}
            className="rounded-2xl border dark:border-white/[0.06] border-border/50 dark:bg-white/[0.02] bg-card/80 p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className={`text-[10px] px-2 py-0.5 font-semibold ${
                label === 'Primary' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
              }`}>
                {label}
              </Badge>
              <span className="text-sm font-semibold text-foreground truncate">{data.domain}</span>
            </div>
            <div className="flex items-center gap-4">
              <ScoreRing score={data.modernScore} size={80} strokeWidth={6} />
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Technologies</span>
                  <span className="font-semibold text-foreground">{data.totalTechnologies}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Scan Time</span>
                  <span className="font-semibold text-foreground">{data.scanTime}s</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Insights</span>
                  <span className="font-semibold text-foreground">{data.insights.length}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 text-center">
          <div className="text-lg font-bold text-purple-400">{common.length}</div>
          <div className="text-[10px] text-muted-foreground">Shared</div>
        </div>
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3 text-center">
          <div className="text-lg font-bold text-green-400">{onlyInPrimary.length}</div>
          <div className="text-[10px] text-muted-foreground">Only {primary.domain}</div>
        </div>
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-center">
          <div className="text-lg font-bold text-cyan-400">{onlyInComp.length}</div>
          <div className="text-[10px] text-muted-foreground">Only {comparisonData.domain}</div>
        </div>
      </div>

      {/* Category comparison */}
      <div className="rounded-2xl border dark:border-white/[0.06] border-border/50 dark:bg-white/[0.02] bg-card/80 overflow-hidden">
        <div className="p-4 border-b dark:border-white/[0.05] border-border/50">
          <h4 className="text-sm font-semibold text-foreground">Category Comparison</h4>
        </div>
        <div className="divide-y dark:divide-white/[0.04] divide-border/30">
          {[...allCategories].sort().map(cat => {
            const meta = CATEGORY_META[cat]
            if (!meta) return null
            const primaryCount = primary.technologies.filter(t => t.category === cat).length
            const compCount = comparisonData.technologies.filter(t => t.category === cat).length
            const maxCount = Math.max(primaryCount, compCount, 1)
            return (
              <div key={cat} className="flex items-center gap-3 p-3">
                <span className="text-sm shrink-0">{meta.icon}</span>
                <span className="text-xs text-muted-foreground w-32 shrink-0 truncate">{meta.label}</span>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full dark:bg-white/5 bg-black/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-700"
                      style={{ width: `${(primaryCount / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-purple-400 w-5 text-right">{primaryCount}</span>
                </div>
                <span className="text-[10px] text-muted-foreground/40">vs</span>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full dark:bg-white/5 bg-black/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-teal-600 transition-all duration-700"
                      style={{ width: `${(compCount / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-cyan-400 w-5 text-right">{compCount}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function TechAnalyzerPanel({ websiteUrl, websiteDomain, reportId }: TechAnalyzerPanelProps) {
  const { toast } = useToast()
  const { canCompare, canExportPdf } = usePlanFeatures()

  // Core state
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [scanMode, setScanMode] = useState<'quick' | 'deep'>('quick')
  const [currentStep, setCurrentStep] = useState(0)

  // UI state
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [showHistory, setShowHistory] = useState(false)
  const [historySearch, setHistorySearch] = useState('')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [activeSection, setActiveSection] = useState<'technologies' | 'insights' | 'compare' | 'history'>('technologies')

  // Comparison state
  const [comparisonUrl, setComparisonUrl] = useState('')
  const [comparisonData, setComparisonData] = useState<AnalysisData | null>(null)
  const [isComparing, setIsComparing] = useState(false)

  // Export state
  const [isExporting, setIsExporting] = useState(false)

  // Refs
  const abortRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)

  // ─── Load history on mount ───────────────────────────────────────────
  useEffect(() => {
    setHistory(loadHistory())
  }, [])

  // ─── Step animation during loading ───────────────────────────────────
  useEffect(() => {
    if (!isLoading) return
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= PROGRESS_STEPS.length - 1) return prev
        return prev + 1
      })
    }, 1200)
    return () => clearInterval(stepInterval)
  }, [isLoading])

  // ─── Auto-analyze on mount ───────────────────────────────────────────
  const runAnalysis = useCallback(async (mode: 'quick' | 'deep', url?: string) => {
    const targetUrl = url || websiteUrl
    if (!targetUrl) return

    if (abortRef.current) {
      abortRef.current.abort()
    }
    const controller = new AbortController()
    abortRef.current = controller

    setIsLoading(true)
    setErrorMessage(null)
    setCurrentStep(0)

    // Clear previous results only if analyzing the main URL
    if (!url) {
      setAnalysisData(null)
    }

    try {
      const requestBody: Record<string, string> = { url: targetUrl, scanMode: mode }

      const res = await fetch('/api/tech-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })

      const data = await res.json()

      if (data.success && data.data) {
        const result: AnalysisData = {
          url: data.data.url,
          domain: data.data.domain,
          technologies: data.data.technologies || [],
          insights: data.data.insights || [],
          modernScore: data.data.modernScore ?? 0,
          scanMode: data.data.scanMode || mode,
          scanTime: data.data.scanTime ?? 0,
          totalTechnologies: data.data.totalTechnologies ?? (data.data.technologies || []).length,
          detectionMethod: data.data.detectionMethod || 'regex',
        }

        if (!url) {
          // Main analysis
          setAnalysisData(result)
          // Don't auto-expand any category — let user explore manually
          // All categories start collapsed so user sees the full overview first
          // Save to history
          const entry: HistoryEntry = {
            id: generateId(),
            url: result.url,
            domain: result.domain,
            timestamp: Date.now(),
            totalTechnologies: result.totalTechnologies,
            modernScore: result.modernScore,
            topTechs: result.technologies.slice(0, 5).map(t => t.name),
          }
          setHistory(prev => {
            const updated = [entry, ...prev.filter(e => e.url !== entry.url)].slice(0, MAX_HISTORY_ENTRIES)
            saveHistory(updated)
            return updated
          })
        } else {
          // Comparison analysis
          setComparisonData(result)
        }
      } else {
        const msg = data.error || 'Could not complete technology analysis.'
        if (!url) {
          setErrorMessage(msg)
        } else {
          toast({ title: 'Comparison Failed', description: msg, variant: 'destructive' })
          setComparisonData(null)
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      const msg = 'Network error. Please check your connection and try again.'
      if (!url) {
        setErrorMessage(msg)
      } else {
        toast({ title: 'Comparison Error', description: msg, variant: 'destructive' })
        setComparisonData(null)
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
        setCurrentStep(PROGRESS_STEPS.length - 1)
      }
    }
  }, [websiteUrl, toast])

  // Auto-analyze on mount — only if no data exists yet (preserves state when navigating back)
  useEffect(() => {
    mountedRef.current = true
    if (!analysisData && !isLoading && !errorMessage) {
      runAnalysis(scanMode)
    }
    return () => {
      mountedRef.current = false
      if (abortRef.current) abortRef.current.abort()
    }
  }, [])

  // ─── Handlers ─────────────────────────────────────────────────────────

  const handleScanModeChange = useCallback((mode: 'quick' | 'deep') => {
    setScanMode(mode)
    runAnalysis(mode)
  }, [runAnalysis])

  const handleRetry = useCallback(() => {
    runAnalysis(scanMode)
  }, [runAnalysis, scanMode])

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }, [])

  const expandAllCategories = useCallback(() => {
    if (!analysisData) return
    const groups = groupTechnologiesByCategory(analysisData.technologies)
    setExpandedCategories(new Set(Object.keys(groups)))
  }, [analysisData])

  const collapseAllCategories = useCallback(() => {
    setExpandedCategories(new Set())
  }, [])

  // Comparison
  const handleStartComparison = useCallback(() => {
    if (!comparisonUrl.trim()) {
      toast({ title: 'URL Required', description: 'Enter a URL to compare against.', variant: 'destructive' })
      return
    }
    if (!canCompare) {
      toast({ title: '🔒 Comparison Locked', description: 'Upgrade to Pro plan to compare websites.' })
      return
    }
    setIsComparing(true)
    setComparisonData(null)
    setActiveSection('compare')

    // Run comparison analysis
    const doCompare = async () => {
      try {
        const res = await fetch('/api/tech-analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: comparisonUrl, scanMode: 'quick' }),
        })
        const data = await res.json()
        if (data.success && data.data) {
          setComparisonData({
            url: data.data.url,
            domain: data.data.domain,
            technologies: data.data.technologies || [],
            insights: data.data.insights || [],
            modernScore: data.data.modernScore ?? 0,
            scanMode: data.data.scanMode || 'quick',
            scanTime: data.data.scanTime ?? 0,
            totalTechnologies: data.data.totalTechnologies ?? (data.data.technologies || []).length,
            detectionMethod: data.data.detectionMethod || 'regex',
          })
        } else {
          toast({ title: 'Comparison Failed', description: data.error || 'Could not analyze comparison URL.', variant: 'destructive' })
          setComparisonData(null)
        }
      } catch {
        toast({ title: 'Error', description: 'Network error during comparison.', variant: 'destructive' })
        setComparisonData(null)
      } finally {
        setIsComparing(false)
      }
    }
    doCompare()
  }, [comparisonUrl, canCompare, toast])

  // History
  const handleHistorySelect = useCallback((entry: HistoryEntry) => {
    // Re-analyze the historical URL
    setComparisonUrl('')
    setComparisonData(null)
    runAnalysis(scanMode, entry.url)
    setShowHistory(false)
  }, [runAnalysis, scanMode])

  const handleHistoryRemove = useCallback((id: string) => {
    setHistory(prev => removeFromHistory(id))
  }, [])

  const handleHistoryClear = useCallback(() => {
    setHistory(clearAllHistory())
  }, [])

  // ─── Export Handlers ──────────────────────────────────────────────────

  const handleExportJSON = useCallback(() => {
    if (!analysisData) return
    setIsExporting(true)
    try {
      const blob = new Blob([JSON.stringify(analysisData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tech-analysis-${websiteDomain}-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast({ title: 'JSON Exported', description: 'Tech analysis results downloaded as JSON.' })
    } catch {
      toast({ title: 'Export Failed', description: 'Could not export JSON.', variant: 'destructive' })
    } finally {
      setIsExporting(false)
    }
  }, [analysisData, websiteDomain, toast])

  const handleExportCSV = useCallback(() => {
    if (!analysisData) return
    setIsExporting(true)
    try {
      const rows = [
        ['Name', 'Category', 'Confidence', 'Version', 'ID'],
        ...analysisData.technologies.map(t => [
          t.name,
          CATEGORY_META[t.category]?.label || t.category,
          t.confidence,
          t.version || '',
          t.id,
        ]),
      ]
      const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tech-analysis-${websiteDomain}-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast({ title: 'CSV Exported', description: 'Tech analysis results downloaded as CSV.' })
    } catch {
      toast({ title: 'Export Failed', description: 'Could not export CSV.', variant: 'destructive' })
    } finally {
      setIsExporting(false)
    }
  }, [analysisData, websiteDomain, toast])

  const handleExportPDF = useCallback(() => {
    if (!analysisData) return
    setIsExporting(true)
    try {
      const primaryColor = '#7c3aed'
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        const grouped = groupTechnologiesByCategory(analysisData.technologies)
        const categoryRows = Object.entries(grouped).map(([cat, techs]) => {
          const meta = CATEGORY_META[cat as TechCategory]
          return `
            <div class="category">
              <div class="category-header">
                <h3>${meta?.icon || ''} ${meta?.label || cat}</h3>
                <span class="count">${techs.length} tech${techs.length !== 1 ? 's' : ''}</span>
              </div>
              <div class="techs">
                ${techs.map(t => `
                  <div class="tech">
                    <span class="tech-icon">${t.icon}</span>
                    <span class="tech-name">${t.name}</span>
                    ${t.version ? `<span class="tech-version">v${t.version}</span>` : ''}
                    <span class="tech-confidence confidence-${t.confidence}">${t.confidence}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `
        }).join('')

        const insightRows = analysisData.insights.map(insight => `
          <div class="insight insight-${insight.type}">
            <div class="insight-header">
              <strong>${insight.title}</strong>
              <span class="severity severity-${insight.severity}">${insight.severity.toUpperCase()}</span>
            </div>
            <p>${insight.description}</p>
          </div>
        `).join('')

        printWindow.document.write(`<!DOCTYPE html><html><head><title>Tech Analysis - ${websiteDomain}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a2e; line-height: 1.6; background: #fff; }
          .header { background: ${primaryColor}; color: white; padding: 24px 32px; display: flex; align-items: center; justify-content: space-between; }
          .header h1 { font-size: 20px; font-weight: 600; }
          .header .subtitle { font-size: 13px; opacity: 0.8; }
          .score-section { display: flex; align-items: center; gap: 32px; padding: 32px; border-bottom: 1px solid #e5e7eb; }
          .score-circle { width: 100px; height: 100px; border-radius: 50%; border: 8px solid ${primaryColor}; display: flex; align-items: center; justify-content: center; flex-direction: column; }
          .score-circle .score { font-size: 28px; font-weight: 700; color: ${primaryColor}; }
          .score-circle .label { font-size: 10px; color: #6b7280; }
          .score-details { flex: 1; }
          .score-details h2 { font-size: 22px; margin-bottom: 4px; }
          .score-details .url { color: #6b7280; font-size: 14px; margin-bottom: 8px; }
          .stat-pills { display: flex; gap: 12px; flex-wrap: wrap; }
          .stat-pill { background: #f3f4f6; border-radius: 20px; padding: 4px 12px; font-size: 12px; }
          .categories { padding: 24px 32px; }
          .category { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 12px; page-break-inside: avoid; }
          .category-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
          .category-header h3 { font-size: 15px; font-weight: 600; }
          .count { font-size: 12px; color: #6b7280; background: #f3f4f6; padding: 2px 8px; border-radius: 12px; }
          .techs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          .tech { display: flex; align-items: center; gap: 6px; font-size: 13px; padding: 6px 8px; background: #f9fafb; border-radius: 8px; }
          .tech-icon { font-size: 16px; }
          .tech-name { font-weight: 500; }
          .tech-version { font-size: 10px; color: #7c3aed; font-family: monospace; }
          .tech-confidence { font-size: 9px; padding: 1px 6px; border-radius: 10px; font-weight: 600; }
          .confidence-high { background: #dcfce7; color: #166534; }
          .confidence-medium { background: #fef9c3; color: #854d0e; }
          .confidence-low { background: #fef2f2; color: #991b1b; }
          .insights { padding: 0 32px 24px; }
          .insight { border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; margin-bottom: 10px; page-break-inside: avoid; }
          .insight-security { border-color: #fca5a5; background: #fef2f2; }
          .insight-performance { border-color: #fde68a; background: #fefce8; }
          .insight-recommendation { border-color: #c4b5fd; background: #f5f3ff; }
          .insight-info { border-color: #93c5fd; background: #eff6ff; }
          .insight-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
          .severity { font-size: 9px; padding: 2px 6px; border-radius: 10px; font-weight: 600; }
          .severity-high { background: #fecaca; color: #991b1b; }
          .severity-medium { background: #fde68a; color: #854d0e; }
          .severity-low { background: #dbeafe; color: #1e40af; }
          .footer { text-align: center; padding: 16px 32px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; margin-top: 24px; }
          @media print { .no-print { display: none; } }
        </style></head><body>
        <div class="header">
          <div><h1>Tech Stack Analysis</h1><div class="subtitle">${websiteDomain} · ${analysisData.scanMode.toUpperCase()} Scan · ${analysisData.scanTime}s</div></div>
        </div>
        <div class="score-section">
          <div class="score-circle"><span class="score">${analysisData.modernScore}</span><span class="label">/ 100</span></div>
          <div class="score-details">
            <h2>${websiteDomain}</h2>
            <div class="url">${analysisData.url}</div>
            <div class="stat-pills">
              <span class="stat-pill">${analysisData.totalTechnologies} Technologies</span>
              <span class="stat-pill">${analysisData.insights.length} Insights</span>
              <span class="stat-pill">${analysisData.scanTime}s Scan Time</span>
              <span class="stat-pill">${analysisData.scanMode.toUpperCase()} Scan</span>
            </div>
          </div>
        </div>
        <div class="categories"><h2 style="margin-bottom:16px;font-size:18px;">Detected Technologies</h2>${categoryRows}</div>
        ${analysisData.insights.length > 0 ? `<div class="insights"><h2 style="margin-bottom:16px;font-size:18px;">AI Insights</h2>${insightRows}</div>` : ''}
        <div class="footer">Tech Stack Analysis Report · ${websiteDomain} · ${new Date().toLocaleDateString()}</div>
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
  }, [analysisData, websiteDomain, toast])

  // ─── Copy Handlers ────────────────────────────────────────────────────

  const handleCopyMarkdown = useCallback(async () => {
    if (!analysisData) return
    const groups = groupTechnologiesByCategory(analysisData.technologies)
    const lines = [
      `# Tech Stack Analysis: ${analysisData.domain}`,
      '',
      `- **URL**: ${analysisData.url}`,
      `- **Modern Score**: ${analysisData.modernScore}/100`,
      `- **Technologies Detected**: ${analysisData.totalTechnologies}`,
      `- **Scan Mode**: ${analysisData.scanMode.toUpperCase()}`,
      `- **Scan Time**: ${analysisData.scanTime}s`,
      '',
      '## Detected Technologies',
      '',
    ]

    for (const [cat, techs] of Object.entries(groups)) {
      const meta = CATEGORY_META[cat as TechCategory]
      lines.push(`### ${meta?.icon || ''} ${meta?.label || cat}`)
      lines.push('')
      for (const t of techs) {
        const confEmoji = CONFIDENCE_CONFIG[t.confidence].emoji
        lines.push(`- ${t.icon} **${t.name}**${t.version ? ` \`v${t.version}\`` : ''} ${confEmoji} ${t.confidence}`)
      }
      lines.push('')
    }

    if (analysisData.insights.length > 0) {
      lines.push('## AI Insights')
      lines.push('')
      for (const insight of analysisData.insights) {
        const typeEmoji = { security: '🔒', performance: '⚡', recommendation: '✨', info: '👁️' }[insight.type] || 'ℹ️'
        lines.push(`- ${typeEmoji} **${insight.title}** [${insight.severity.toUpperCase()}]: ${insight.description}`)
      }
    }

    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      toast({ title: 'Copied as Markdown', description: 'Tech analysis results copied to clipboard.' })
    } catch {
      toast({ title: 'Copy Failed', description: 'Could not copy to clipboard.', variant: 'destructive' })
    }
  }, [analysisData, toast])

  const handleCopyJSON = useCallback(async () => {
    if (!analysisData) return
    try {
      await navigator.clipboard.writeText(JSON.stringify(analysisData, null, 2))
      toast({ title: 'Copied as JSON', description: 'Tech analysis results copied to clipboard.' })
    } catch {
      toast({ title: 'Copy Failed', description: 'Could not copy to clipboard.', variant: 'destructive' })
    }
  }, [analysisData, toast])

  // ─── Computed values ──────────────────────────────────────────────────

  const groupedTechs = useMemo(() => {
    if (!analysisData) return {}
    return groupTechnologiesByCategory(analysisData.technologies)
  }, [analysisData])

  const sortedCategories = useMemo(() => {
    return Object.keys(groupedTechs).sort((a, b) => {
      // Sort by number of technologies descending
      return groupedTechs[b].length - groupedTechs[a].length
    })
  }, [groupedTechs])

  const insightCounts = useMemo(() => {
    if (!analysisData) return { security: 0, performance: 0, recommendation: 0, info: 0, total: 0 }
    const counts = { security: 0, performance: 0, recommendation: 0, info: 0, total: analysisData.insights.length }
    for (const insight of analysisData.insights) {
      if (insight.type in counts) counts[insight.type as keyof typeof counts]++
    }
    return counts
  }, [analysisData])

  // ─── Render: Loading ──────────────────────────────────────────────────

  if (isLoading && !analysisData) {
    return (
      <div className="w-full">
        {/* Scan mode toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-purple-400" />
            <h3 className="text-base font-semibold text-foreground">Tech Stack Analyzer</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 rounded-xl border dark:border-white/[0.06] border-border/50 dark:bg-white/[0.02] bg-card/80">
              <button
                onClick={() => setScanMode('quick')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                  scanMode === 'quick'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Zap className="h-3 w-3" />
                Quick
              </button>
              <button
                onClick={() => setScanMode('deep')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                  scanMode === 'deep'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Shield className="h-3 w-3" />
                Deep
              </button>
            </div>
            <span className="text-[10px] text-muted-foreground/50 hidden sm:inline">
              {scanMode === 'quick' ? 'Regex-based, faster results (~5-8s)' : 'AI + Regex, more accurate (~10-20s)'}
            </span>
          </div>
        </div>
        <ProgressLoader currentStep={currentStep} scanMode={scanMode} />
      </div>
    )
  }

  // ─── Render: Error ────────────────────────────────────────────────────

  if (errorMessage && !analysisData) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-purple-400" />
            <h3 className="text-base font-semibold text-foreground">Tech Stack Analyzer</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 rounded-xl border dark:border-white/[0.06] border-border/50 dark:bg-white/[0.02] bg-card/80">
              <button
                onClick={() => handleScanModeChange('quick')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                  scanMode === 'quick'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Zap className="h-3 w-3" />
                Quick
              </button>
              <button
                onClick={() => handleScanModeChange('deep')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                  scanMode === 'deep'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Shield className="h-3 w-3" />
                Deep
              </button>
            </div>
            <span className="text-[10px] text-muted-foreground/50 hidden sm:inline">
              {scanMode === 'quick' ? 'Regex-based, faster results (~5-8s)' : 'AI + Regex, more accurate (~10-20s)'}
            </span>
          </div>
        </div>
        <ErrorState message={errorMessage} onRetry={handleRetry} />
      </div>
    )
  }

  if (!analysisData) return null

  // ─── Render: Results ──────────────────────────────────────────────────

  return (
    <div className="w-full space-y-4">
      {/* Header with score */}
      <div className="overflow-hidden rounded-2xl border dark:border-white/[0.06] border-border/50 dark:bg-white/[0.02] bg-card/80">
        <div className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Score Ring */}
            <div className="shrink-0">
              <ScoreRing score={analysisData.modernScore} size={110} strokeWidth={7} delay={0.2} showGlow />
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left w-full">
              <div className="mb-3">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2 justify-center sm:justify-start">
                  <Cpu className="h-5 w-5 text-purple-400" />
                  Tech Stack Analysis
                </h3>
                <a
                  href={analysisData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 transition-colors mt-1"
                >
                  {analysisData.url}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              {/* Quick stats */}
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-1 text-xs text-purple-400">
                  <Cpu className="h-3 w-3" />
                  {analysisData.totalTechnologies} Technologies
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 text-xs text-cyan-400">
                  <Clock className="h-3 w-3" />
                  {analysisData.scanTime}s
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-xs text-indigo-400">
                  {analysisData.scanMode === 'deep' ? <Shield className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
                  {analysisData.scanMode.toUpperCase()} Scan
                </div>
                {insightCounts.security > 0 && (
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/20 px-3 py-1 text-xs text-red-400">
                    <AlertTriangle className="h-3 w-3" />
                    {insightCounts.security} Security
                  </div>
                )}
                {insightCounts.performance > 0 && (
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 text-xs text-yellow-400">
                    <Zap className="h-3 w-3" />
                    {insightCounts.performance} Performance
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scan mode + action bar */}
        <div className="border-t dark:border-white/[0.05] border-border/50 px-5 sm:px-6 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Scan mode toggle */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 rounded-xl border dark:border-white/[0.06] border-border/50 dark:bg-white/[0.02] bg-card/80">
                <button
                  onClick={() => handleScanModeChange('quick')}
                  disabled={isLoading}
                  title="Quick Scan: Regex-based detection only (~5-8s)"
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 disabled:opacity-50 ${
                    scanMode === 'quick'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Zap className="h-3 w-3" />
                  Quick
                </button>
                <button
                  onClick={() => handleScanModeChange('deep')}
                  disabled={isLoading}
                  title="Deep Scan: Regex + AI detection + AI insights + extra paths (~10-20s)"
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 disabled:opacity-50 ${
                    scanMode === 'deep'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Shield className="h-3 w-3" />
                  Deep
                </button>
              </div>
              <span className="text-[10px] text-muted-foreground/50 hidden sm:inline">
                {scanMode === 'quick' ? 'Regex-based, faster results (~5-8s)' : 'AI + Regex, more accurate (~10-20s)'}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                disabled={isLoading}
                className="h-7 text-[11px] rounded-lg dark:border-white/10 border-border dark:bg-white/5 bg-muted"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Rescan
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportJSON}
                disabled={isExporting}
                className="h-7 text-[11px] rounded-lg dark:border-white/10 border-border dark:bg-white/5 bg-muted"
              >
                <FileJson className="h-3 w-3 mr-1" />
                JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={isExporting}
                className="h-7 text-[11px] rounded-lg dark:border-white/10 border-border dark:bg-white/5 bg-muted"
              >
                <FileText className="h-3 w-3 mr-1" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={isExporting}
                className="h-7 text-[11px] rounded-lg dark:border-white/10 border-border dark:bg-white/5 bg-muted"
              >
                {isExporting ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Download className="h-3 w-3 mr-1" />}
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyMarkdown}
                className="h-7 text-[11px] rounded-lg dark:border-white/10 border-border dark:bg-white/5 bg-muted"
              >
                <Copy className="h-3 w-3 mr-1" />
                MD
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyJSON}
                className="h-7 text-[11px] rounded-lg dark:border-white/10 border-border dark:bg-white/5 bg-muted"
              >
                <Copy className="h-3 w-3 mr-1" />
                JSON
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex items-center gap-1 p-1 rounded-2xl border dark:border-white/[0.06] border-border/50 dark:bg-white/[0.02] bg-card/80 w-fit">
        <button
          onClick={() => setActiveSection('technologies')}
          className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium transition-all duration-200 ${
            activeSection === 'technologies'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20'
              : 'text-muted-foreground hover:text-foreground dark:hover:bg-white/5 hover:bg-muted/50'
          }`}
        >
          <Cpu className="h-3.5 w-3.5" />
          Technologies
          <Badge variant="outline" className={`text-[9px] px-1 py-0 ml-1 ${
            activeSection === 'technologies' ? 'border-white/20 text-white/80' : 'border-border/50 text-muted-foreground'
          }`}>
            {analysisData.totalTechnologies}
          </Badge>
        </button>
        <button
          onClick={() => setActiveSection('insights')}
          className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium transition-all duration-200 ${
            activeSection === 'insights'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20'
              : 'text-muted-foreground hover:text-foreground dark:hover:bg-white/5 hover:bg-muted/50'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Insights
          <Badge variant="outline" className={`text-[9px] px-1 py-0 ml-1 ${
            activeSection === 'insights' ? 'border-white/20 text-white/80' : 'border-border/50 text-muted-foreground'
          }`}>
            {analysisData.insights.length}
          </Badge>
        </button>
        <button
          onClick={() => setActiveSection('compare')}
          className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium transition-all duration-200 ${
            activeSection === 'compare'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20'
              : 'text-muted-foreground hover:text-foreground dark:hover:bg-white/5 hover:bg-muted/50'
          }`}
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
          Compare
          {!canCompare && (
            <Badge variant="outline" className="text-[8px] px-1 py-0 border-amber-500/30 text-amber-400 ml-0.5">PRO</Badge>
          )}
        </button>
        <button
          onClick={() => setActiveSection('history')}
          className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium transition-all duration-200 ${
            activeSection === 'history'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20'
              : 'text-muted-foreground hover:text-foreground dark:hover:bg-white/5 hover:bg-muted/50'
          }`}
        >
          <History className="h-3.5 w-3.5" />
          History
          {history.length > 0 && (
            <Badge variant="outline" className={`text-[9px] px-1 py-0 ml-1 ${
              activeSection === 'history' ? 'border-white/20 text-white/80' : 'border-border/50 text-muted-foreground'
            }`}>
              {history.length}
            </Badge>
          )}
        </button>
      </div>

      {/* Section content */}
      <AnimatePresence mode="wait">
        {/* Technologies Section */}
        {activeSection === 'technologies' && (
          <motion.div
            key="technologies"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {/* Controls */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {analysisData.totalTechnologies} technologies detected across {sortedCategories.length} categories
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={expandAllCategories}
                  className="h-6 text-[10px] text-muted-foreground hover:text-foreground px-2"
                >
                  Expand All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={collapseAllCategories}
                  className="h-6 text-[10px] text-muted-foreground hover:text-foreground px-2"
                >
                  Collapse All
                </Button>
              </div>
            </div>

            {/* Category sections */}
            <div className="space-y-2">
              {sortedCategories.map(category => (
                <CategorySection
                  key={category}
                  category={category as TechCategory}
                  techs={groupedTechs[category]}
                  isExpanded={expandedCategories.has(category)}
                  onToggle={() => toggleCategory(category)}
                />
              ))}
            </div>

            {sortedCategories.length === 0 && (
              <div className="text-center py-12">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50 border border-border/30 mx-auto mb-3">
                  <Cpu className="h-6 w-6 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">No technologies detected</p>
                <p className="text-xs text-muted-foreground/50 mt-1">Try running a Deep Scan for more thorough detection</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Insights Section */}
        {activeSection === 'insights' && (
          <motion.div
            key="insights"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {/* Insight type filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/20 px-3 py-1 text-xs text-red-400">
                <Shield className="h-3 w-3" />
                {insightCounts.security} Security
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 text-xs text-yellow-400">
                <Zap className="h-3 w-3" />
                {insightCounts.performance} Performance
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-1 text-xs text-purple-400">
                <Sparkles className="h-3 w-3" />
                {insightCounts.recommendation} Recommendations
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs text-blue-400">
                <Eye className="h-3 w-3" />
                {insightCounts.info} Info
              </div>
            </div>

            {/* Insight cards */}
            <div className="space-y-2">
              {/* Show high severity first */}
              {analysisData.insights
                .sort((a, b) => {
                  const sevOrder = { high: 0, medium: 1, low: 2 }
                  return sevOrder[a.severity] - sevOrder[b.severity]
                })
                .map((insight, i) => (
                  <InsightCard key={`${insight.title}-${i}`} insight={insight} />
                ))}
            </div>

            {analysisData.insights.length === 0 && (
              <div className="text-center py-12">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10 border border-green-500/20 mx-auto mb-3">
                  <CheckCircle2 className="h-6 w-6 text-green-400" />
                </div>
                <p className="text-sm text-muted-foreground">No issues detected</p>
                <p className="text-xs text-muted-foreground/50 mt-1">The tech stack looks healthy!</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Comparison Section */}
        {activeSection === 'compare' && (
          <motion.div
            key="compare"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Comparison input */}
            <div className="rounded-2xl border dark:border-white/[0.06] border-border/50 dark:bg-white/[0.02] bg-card/80 p-4">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <ArrowRightLeft className="h-4 w-4 text-purple-400" />
                Compare with Another Site
              </h4>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                  <Input
                    value={comparisonUrl}
                    onChange={(e) => setComparisonUrl(e.target.value)}
                    placeholder="Enter URL to compare (e.g., https://competitor.com)"
                    className="pl-8 h-9 text-sm rounded-lg dark:bg-white/[0.04] bg-muted border-border/50"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleStartComparison()
                    }}
                  />
                </div>
                <Button
                  onClick={handleStartComparison}
                  disabled={isComparing || !comparisonUrl.trim()}
                  className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 h-9 px-4 text-xs"
                >
                  {isComparing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />
                      Compare
                    </>
                  )}
                </Button>
              </div>
              {!canCompare && (
                <p className="text-[11px] text-amber-400/70 mt-2 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Comparison requires Pro plan or above
                </p>
              )}
            </div>

            {/* Comparison results */}
            {comparisonData && analysisData && (
              <ComparisonView
                primary={analysisData}
                comparisonData={comparisonData}
                comparisonUrl={comparisonUrl}
              />
            )}

            {!comparisonData && !isComparing && (
              <div className="text-center py-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/20 mx-auto mb-3">
                  <ArrowRightLeft className="h-6 w-6 text-purple-400/40" />
                </div>
                <p className="text-sm text-muted-foreground">Enter a URL above to compare tech stacks side by side</p>
              </div>
            )}
          </motion.div>
        )}

        {/* History Section */}
        {activeSection === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <HistoryPanel
              history={history}
              searchQuery={historySearch}
              onSearchChange={setHistorySearch}
              onSelect={handleHistorySelect}
              onRemove={handleHistoryRemove}
              onClearAll={handleHistoryClear}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading overlay for rescan */}
      {isLoading && analysisData && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="flex items-center gap-2 rounded-xl border dark:border-white/10 border-border dark:bg-black/90 bg-background/90 px-4 py-2.5 shadow-2xl backdrop-blur-sm">
            <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
            <span className="text-xs text-foreground font-medium">
              {scanMode === 'deep' ? 'Deep' : 'Quick'} scanning...
            </span>
          </div>
        </div>
      )}

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  )
}
