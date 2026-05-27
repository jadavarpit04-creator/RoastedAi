'use client'

import { useState, memo } from 'react'
import { useSession } from 'next-auth/react'
import { AnimatePresence } from 'framer-motion'
import {
  Monitor,
  Search,
  Gauge,
  Accessibility,
  Smartphone,
  Palette,
  TrendingUp,
  ExternalLink,
  ChevronDown,
  AlertTriangle,
  Lightbulb,
  Flame,
  Gavel,
  ArrowLeft,
  Share2,
  FileDown,
  GitCompare,
  Mail,
  Loader2,
  Sparkles,
  XCircle,
  ShieldAlert,
  Lock,
  Cpu,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScoreRing } from '@/components/score-ring'
import { useAnalysisStore } from '@/hooks/use-analysis-store'
import { usePlanFeatures } from '@/hooks/use-plan-features'
import { useToast } from '@/hooks/use-toast'
import { CompareDialog } from '@/components/compare-dialog'
import { ScannerDashboard } from '@/components/scanner-dashboard'
import { TechAnalyzerPanel } from '@/components/tech-analyzer-panel'
import { FEATURES } from '@/lib/plan-config'
import { UpgradeDialog } from '@/components/upgrade-dialog'
import type { CategoryAnalysis, AnalysisData } from '@/lib/types'

interface CategoryConfig {
  key: keyof Omit<AnalysisData, 'overallScore' | 'roast' | 'finalVerdict'>
  label: string
  icon: React.ElementType
  gradient: string
  emoji: string
  locked?: boolean
  lockReason?: string
}

const categories: CategoryConfig[] = [
  { key: 'uiux', label: 'UI/UX', icon: Monitor, gradient: 'from-purple-500 to-indigo-500', emoji: '🎨' },
  { key: 'seo', label: 'SEO', icon: Search, gradient: 'from-blue-500 to-cyan-500', emoji: '🔍' },
  { key: 'accessibility', label: 'Accessibility', icon: Accessibility, gradient: 'from-amber-500 to-orange-500', emoji: '♿' },
  { key: 'performance', label: 'Performance', icon: Gauge, gradient: 'from-green-500 to-emerald-500', emoji: '⚡' },
  { key: 'mobile', label: 'Mobile', icon: Smartphone, gradient: 'from-pink-500 to-rose-500', emoji: '📱' },
  { key: 'design', label: 'Design', icon: Palette, gradient: 'from-violet-500 to-purple-500', emoji: '🖌️' },
  { key: 'conversion', label: 'Conversion', icon: TrendingUp, gradient: 'from-teal-500 to-cyan-500', emoji: '📈' },
]


function getScoreBarColor(score: number): string {
  if (score >= 70) return 'from-green-500 to-emerald-400'
  if (score >= 50) return 'from-yellow-500 to-amber-400'
  if (score >= 30) return 'from-orange-500 to-amber-500'
  return 'from-red-500 to-rose-400'
}

function getScoreBgColor(score: number): string {
  if (score >= 70) return 'bg-green-500/10 border-green-500/20'
  if (score >= 50) return 'bg-yellow-500/10 border-yellow-500/20'
  if (score >= 30) return 'bg-orange-500/10 border-orange-500/20'
  return 'bg-red-500/10 border-red-500/20'
}

const CategoryCard = memo(function CategoryCard({ category, data, index, isLocked, minPlan }: { category: CategoryConfig; data: CategoryAnalysis; index: number; isLocked: boolean; minPlan: string }) {
  const [isExpanded, setIsExpanded] = useState(index === 0)
  const Icon = category.icon

  if (isLocked) {
    return (
      <div className="overflow-hidden rounded-2xl border dark:border-white/[0.08] border-border/50 dark:bg-white/[0.03] bg-card/80 opacity-50">
        <div className="flex items-center justify-between p-4 sm:p-5">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${category.gradient} shadow-lg shadow-black/10 shrink-0 blur-[2px]`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-muted-foreground text-sm sm:text-base">{category.label}</h4>
                <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-amber-500/30 text-amber-400">
                  <Lock className="h-2.5 w-2.5 mr-0.5" />
                  {minPlan.toUpperCase()}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground/50">Upgrade to {minPlan} plan to unlock</p>
            </div>
          </div>
          <Lock className="h-4 w-4 text-muted-foreground/30" />
        </div>
      </div>
    )
  }

  return (
    <div
      className="overflow-hidden rounded-2xl border dark:border-white/[0.08] border-border/50 dark:bg-white/[0.03] bg-card/80 group"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 sm:p-5 text-left transition-colors dark:hover:bg-white/[0.04] hover:bg-muted/30"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${category.gradient} shadow-lg shadow-black/10 shrink-0`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-foreground text-sm sm:text-base">{category.label}</h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1">
                <XCircle className="h-3 w-3 text-red-400/70" />
                {data.issues.length} issues
              </span>
              <span className="text-border">·</span>
              <span className="flex items-center gap-1">
                <Lightbulb className="h-3 w-3 text-green-400/70" />
                {data.suggestions.length} tips
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className={`text-lg font-bold ${data.score >= 70 ? 'text-green-400' : data.score >= 50 ? 'text-yellow-400' : data.score >= 30 ? 'text-orange-400' : 'text-red-400'}`}>
            {data.score}
          </div>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <div
            className="overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200"
          >
            <div className="border-t dark:border-white/[0.05] border-border/50 px-4 sm:px-5 py-4 space-y-4">
              {/* Mini score bar */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground font-medium w-8">Score</span>
                <div className="flex-1 h-2 rounded-full dark:bg-white/5 bg-black/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${getScoreBarColor(data.score)} transition-all duration-700 ease-out`}
                    style={{ width: `${data.score}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-foreground w-8 text-right">{data.score}</span>
              </div>

              {data.issues.length > 0 && (
                <div>
                  <h5 className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-red-400/80">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Issues Found
                  </h5>
                  <ul className="space-y-2">
                    {data.issues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500/60" />
                        <span className="leading-relaxed">{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {data.suggestions.length > 0 && (
                <div>
                  <h5 className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-green-400/80">
                    <Lightbulb className="h-3.5 w-3.5" />
                    Suggestions
                  </h5>
                  <ul className="space-y-2">
                    {data.suggestions.map((suggestion, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500/60" />
                        <span className="leading-relaxed">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
})

export function ResultsDashboard() {
  const { analysisResult, reset } = useAnalysisStore()
  const { data: session } = useSession()
  const { toast } = useToast()
  const { isFeatureLocked, getMinPlanForFeature, canUseSecurityScanner, canUseTechStack } = usePlanFeatures()
  const [showRoast, setShowRoast] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isEmailing, setIsEmailing] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [upgradeFeature, setUpgradeFeature] = useState<string>('pro')
  const [activeView, setActiveView] = useState<'analysis' | 'tech' | 'scanner'>('analysis')

  const reportId = analysisResult?.reportId
  const websiteUrl = analysisResult?.website?.url

  if (!analysisResult) return null

  const { data, website } = analysisResult

  const getScoreLabel = (score: number) => {
    if (score >= 90) return { text: 'Excellent', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' }
    if (score >= 70) return { text: 'Good', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' }
    if (score >= 50) return { text: 'Average', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' }
    if (score >= 30) return { text: 'Below Average', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' }
    return { text: 'Critical', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' }
  }

  const scoreLabel = getScoreLabel(data.overallScore)

  // Get top issue and best category
  const worstCategory = categories.reduce((worst, cat) => 
    data[cat.key].score < data[worst.key].score ? cat : worst, categories[0])
  const bestCategory = categories.reduce((best, cat) => 
    data[cat.key].score > data[best.key].score ? cat : best, categories[0])

  const handleLockedFeature = (feature: string) => {
    const minPlan = getMinPlanForFeature(feature)
    setUpgradeFeature(minPlan)
    setUpgradeOpen(true)
  }

  const handlePdfExport = async () => {
    setIsExporting(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export', reportId }),
      })
      const exportData = await res.json()
      if (exportData.success) {
        const printWindow = window.open('', '_blank')
        if (printWindow) {
          const wl = exportData.data.whiteLabel
          const primaryColor = wl?.primaryColor || '#7c3aed'
          const companyName = wl?.companyName || 'RoastMySite AI'
          const footerText = wl?.footerText || `Generated by ${companyName}`

          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>${companyName} - ${website.domain} Report</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a2e; line-height: 1.6; }
                .header { background: ${primaryColor}; color: white; padding: 24px 32px; display: flex; align-items: center; gap: 16px; }
                .header h1 { font-size: 20px; font-weight: 600; }
                .header .subtitle { font-size: 13px; opacity: 0.8; }
                .score-hero { text-align: center; padding: 40px 32px; border-bottom: 1px solid #e5e7eb; }
                .score-circle { width: 120px; height: 120px; border-radius: 50%; border: 8px solid ${primaryColor}; display: inline-flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
                .score-circle .score { font-size: 36px; font-weight: 700; color: ${primaryColor}; }
                .score-hero h2 { font-size: 22px; margin-bottom: 4px; }
                .score-hero .url { color: #6b7280; font-size: 14px; }
                .score-hero .label { display: inline-block; margin-top: 8px; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 500; }
                .categories { padding: 24px 32px; }
                .category { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
                .category-header { display: flex; justify-between; align-items: center; margin-bottom: 12px; }
                .category-header h3 { font-size: 15px; font-weight: 600; }
                .category-header .score { font-size: 20px; font-weight: 700; color: ${primaryColor}; }
                .issues, .suggestions { margin-top: 8px; }
                .issues h4 { font-size: 13px; color: #ef4444; margin-bottom: 4px; }
                .suggestions h4 { font-size: 13px; color: #10b981; margin-bottom: 4px; }
                .item { font-size: 13px; color: #374151; padding: 2px 0 2px 16px; position: relative; }
                .item::before { content: '•'; position: absolute; left: 4px; }
                .roast-section { margin: 24px 32px; padding: 20px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; }
                .roast-section h3 { font-size: 15px; font-weight: 600; margin-bottom: 8px; }
                .roast-section p { font-style: italic; font-size: 14px; color: #374151; }
                .verdict-section { margin: 0 32px 24px; padding: 20px; background: #f3f0ff; border: 1px solid #c4b5fd; border-radius: 12px; }
                .verdict-section h3 { font-size: 15px; font-weight: 600; margin-bottom: 8px; }
                .verdict-section p { font-size: 14px; color: #374151; }
                .footer { text-align: center; padding: 16px 32px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
                @media print { .no-print { display: none; } }
              </style>
            </head>
            <body>
              <div class="header">
                <div>
                  <h1>${companyName}</h1>
                  <div class="subtitle">Website Analysis Report</div>
                </div>
              </div>
              <div class="score-hero">
                <div class="score-circle"><span class="score">${data.overallScore}</span></div>
                <h2>${website.title || website.domain}</h2>
                <div class="url">${website.url}</div>
                <div class="label" style="background: ${primaryColor}20; color: ${primaryColor};">${scoreLabel.text}</div>
              </div>
              <div class="categories">
                ${categories.map((cat) => {
                  const catData = data[cat.key]
                  return `
                    <div class="category">
                      <div class="category-header">
                        <h3>${cat.label}</h3>
                        <span class="score">${catData.score}/100</span>
                      </div>
                      ${catData.issues.length ? `<div class="issues"><h4>Issues</h4>${catData.issues.map((i: string) => `<div class="item">${i}</div>`).join('')}</div>` : ''}
                      ${catData.suggestions.length ? `<div class="suggestions"><h4>Suggestions</h4>${catData.suggestions.map((s: string) => `<div class="item">${s}</div>`).join('')}</div>` : ''}
                    </div>
                  `
                }).join('')}
              </div>
              <div class="roast-section">
                <h3>🔥 AI Roast</h3>
                <p>"${data.roast}"</p>
              </div>
              <div class="verdict-section">
                <h3>⚖️ Final Verdict</h3>
                <p>${data.finalVerdict}</p>
              </div>
              <div class="footer">${footerText} · ${new Date().toLocaleDateString()}</div>
              <div class="no-print" style="text-align:center;padding:16px;">
                <button onclick="window.print()" style="padding:10px 24px;background:${primaryColor};color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;">Print / Save as PDF</button>
              </div>
            </body>
            </html>
          `)
          printWindow.document.close()
          toast({ title: 'PDF Ready', description: 'Use Print > Save as PDF in the new window.' })
        }
      } else {
        toast({ title: 'Export Failed', description: exportData.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to export report', variant: 'destructive' })
    } finally {
      setIsExporting(false)
    }
  }

  const handleEmailReport = async () => {
    setIsEmailing(true)
    try {
      const shareUrl = `${window.location.origin}/?report=${reportId}`
      await navigator.clipboard.writeText(shareUrl)
      toast({
        title: '📋 Report Link Copied!',
        description: `Share this link to send the ${website.domain} report to anyone. They'll see the full analysis!`,
      })
    } catch {
      try {
        const shareUrl = `${window.location.origin}/?report=${reportId}`
        const textArea = document.createElement('textarea')
        textArea.value = shareUrl
        textArea.style.position = 'fixed'
        textArea.style.left = '-9999px'
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        toast({
          title: '📋 Report Link Copied!',
          description: `Share this link to send the ${website.domain} report to anyone.`,
        })
      } catch {
        toast({ title: 'Error', description: 'Failed to copy link. Please try again.', variant: 'destructive' })
      }
    } finally {
      setIsEmailing(false)
    }
  }

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/?report=${reportId}`
    const shareText = `I got a score of ${data.overallScore}/100 for ${website.domain} on RoastMySite AI! Can you beat my score?`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `RoastMySite AI - ${website.domain}`,
          text: shareText,
          url: shareUrl,
        })
      } catch {
        await navigator.clipboard.writeText(shareUrl)
        toast({ title: 'Link Copied!', description: 'Share link copied to clipboard.' })
      }
    } else {
      await navigator.clipboard.writeText(shareUrl)
      toast({ title: 'Link Copied!', description: 'Share link copied to clipboard.' })
    }
  }

  return (
    <div className="min-h-screen px-4 pt-24 pb-32">
      <div className="mx-auto max-w-5xl">
        {/* Top bar */}
        <div
          className="flex items-center justify-between mb-6"
        >
          <Button
            variant="ghost"
            onClick={reset}
            className="text-muted-foreground hover:text-foreground dark:hover:bg-white/5 hover:bg-muted/50 -ml-2 gap-1.5 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Analyze Another
          </Button>
          <Badge
            className={`${scoreLabel.color} ${scoreLabel.bg} text-xs font-semibold px-3 py-1 border`}
            variant="outline"
          >
            {scoreLabel.text}
          </Badge>
        </div>

        {/* Hero Score Card */}
        <div
          className="mb-8 overflow-hidden rounded-3xl border dark:border-white/[0.08] border-border/50 dark:bg-white/[0.03] bg-card/80"
        >
          <div className="p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Score Ring */}
              <div className="flex flex-col items-center shrink-0">
                <ScoreRing score={data.overallScore} size={160} strokeWidth={10} delay={0.2} showGlow />
              </div>

              {/* Website info + Quick stats */}
              <div className="flex-1 text-center lg:text-left w-full">
                <div className="mb-4">
                  <h2 className="mb-1.5 text-2xl font-bold text-foreground sm:text-3xl">
                    {website.title || website.domain}
                  </h2>
                  <a
                    href={website.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    {website.url}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                {/* Quick stat pills */}
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {categories.map((cat) => {
                    const catData = data[cat.key]
                    return (
                      <div
                        key={cat.key}
                        className={`rounded-xl border px-2 py-2 text-center ${getScoreBgColor(catData.score)}`}
                      >
                        <div className={`text-lg font-bold ${catData.score >= 70 ? 'text-green-400' : catData.score >= 50 ? 'text-yellow-400' : catData.score >= 30 ? 'text-orange-400' : 'text-red-400'}`}>
                          {catData.score}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-medium">{cat.label}</div>
                      </div>
                    )
                  })}
                </div>

                {/* Insight pills */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/20 px-3 py-1 text-xs text-red-400">
                    <span className="font-medium">Worst:</span> {worstCategory.label} ({data[worstCategory.key].score})
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 border border-green-500/20 px-3 py-1 text-xs text-green-400">
                    <span className="font-medium">Best:</span> {bestCategory.label} ({data[bestCategory.key].score})
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Category score bars (horizontal) */}
          <div className="border-t dark:border-white/[0.05] border-border/50 px-6 sm:px-8 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
              {categories.map((cat) => {
                const catData = data[cat.key]
                const Icon = cat.icon
                return (
                  <div key={cat.key} className="flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-xs w-20 shrink-0 text-muted-foreground">{cat.label}</span>
                    <div className="flex-1 h-2 rounded-full dark:bg-white/5 bg-black/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${getScoreBarColor(catData.score)} transition-all duration-700 ease-out`}
                        style={{ width: `${catData.score}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold w-6 text-right ${catData.score >= 70 ? 'text-green-400' : catData.score >= 50 ? 'text-yellow-400' : catData.score >= 30 ? 'text-orange-400' : 'text-red-400'}`}>
                      {catData.score}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Two column: Roast + Verdict */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {/* Roast section */}
          <div
            className="overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-red-500/5"
          >
            <button
              onClick={() => setShowRoast(!showRoast)}
              className="flex w-full items-center justify-between p-5 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/20">
                  <Flame className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">AI Roast</h3>
                  <p className="text-xs text-muted-foreground">Click to {showRoast ? 'hide' : 'reveal'} the roast</p>
                </div>
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${showRoast ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showRoast && (
                <div
                  className="overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200"
                >
                  <div className="border-t border-orange-500/10 px-5 pb-5 pt-3">
                    <p className="text-base leading-relaxed text-muted-foreground italic">
                      &ldquo;{data.roast}&rdquo;
                    </p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Final Verdict */}
          <div
            className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/20">
                <Gavel className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Final Verdict</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{data.finalVerdict}</p>
          </div>
        </div>

        {/* View Toggle Tabs */}
        <div className="mb-6">
          <div className="flex items-center gap-1 p-1 rounded-2xl border dark:border-white/[0.06] border-border/50 dark:bg-white/[0.02] bg-card/80 w-fit">
            <button
              onClick={() => setActiveView('analysis')}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                activeView === 'analysis'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20'
                  : 'text-muted-foreground hover:text-foreground dark:hover:bg-white/5 hover:bg-muted/50'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              Analysis
            </button>

            <button
              onClick={() => {
                if (!canUseSecurityScanner) {
                  toast({ title: '🔒 Scanner Locked', description: 'Upgrade to Pro plan to use the Security Scanner.' })
                  handleLockedFeature(FEATURES.securityScanner)
                  return
                }
                setActiveView('scanner')
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                activeView === 'scanner'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/20'
                  : 'text-muted-foreground hover:text-foreground dark:hover:bg-white/5 hover:bg-muted/50'
              }`}
            >
              <ShieldAlert className="h-4 w-4" />
              Scanner
              {!canUseSecurityScanner && <Badge variant="outline" className="ml-1 text-[8px] px-1 py-0 border-amber-500/30 text-amber-400">PRO</Badge>}
            </button>
            <button
              onClick={() => {
                if (!canUseTechStack) {
                  toast({ title: '🔒 Tech Stack Locked', description: 'Upgrade to Pro plan to use Tech Stack Analysis.' })
                  handleLockedFeature(FEATURES.techStackAnalysis)
                  return
                }
                setActiveView('tech')
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                activeView === 'tech'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20'
                  : 'text-muted-foreground hover:text-foreground dark:hover:bg-white/5 hover:bg-muted/50'
              }`}
            >
              <Cpu className="h-4 w-4" />
              Tech Stack
              {!canUseTechStack && <Badge variant="outline" className="ml-1 text-[8px] px-1 py-0 border-amber-500/30 text-amber-400">PRO</Badge>}
            </button>
          </div>
        </div>

        {/* Conditional view rendering */}
        <div>
          {/* Analysis View */}
          <div className={activeView === 'analysis' ? '' : 'hidden'}>

            {/* Category cards */}
            <div className="mb-8">
              <h3
                className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground"
              >
                <Sparkles className="h-4 w-4 text-purple-400" />
                Detailed Analysis

              </h3>
              <div className="space-y-2.5">
                {categories.map((category, index) => (
                  <CategoryCard
                    key={category.key}
                    category={category}
                    data={data[category.key]}
                    index={index}
                    isLocked={false}
                    minPlan="free"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Scanner View — Pro+ only */}
          {canUseSecurityScanner ? (
            <div className={activeView === 'scanner' ? '' : 'hidden'}>
              <ScannerDashboard
                websiteUrl={website.url}
                websiteDomain={website.domain || ''}
                reportId={reportId || ''}
              />
            </div>
          ) : activeView === 'scanner' ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 text-center">
              <ShieldAlert className="h-12 w-12 text-amber-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-1">Security Scanner Locked</h3>
              <p className="text-sm text-muted-foreground mb-4">Upgrade to Pro plan to access the Security Scanner.</p>
              <Button onClick={() => handleLockedFeature(FEATURES.securityScanner)} className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm">
                Upgrade to Pro
              </Button>
            </div>
          ) : null}

          {/* Tech Stack View — Pro+ only */}
          {canUseTechStack ? (
            <div className={activeView === 'tech' ? '' : 'hidden'}>
              <TechAnalyzerPanel
                websiteUrl={website.url}
                websiteDomain={website.domain || ''}
                reportId={reportId || ''}
              />
            </div>
          ) : activeView === 'tech' ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 text-center">
              <Cpu className="h-12 w-12 text-amber-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-1">Tech Stack Analysis Locked</h3>
              <p className="text-sm text-muted-foreground mb-4">Upgrade to Pro plan to access Tech Stack Analysis.</p>
              <Button onClick={() => handleLockedFeature(FEATURES.techStackAnalysis)} className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm">
                Upgrade to Pro
              </Button>
            </div>
          ) : null}
        </div>

        {/* Floating action bar */}
        <div
          className="sticky bottom-4 z-40 mx-auto max-w-2xl"
        >
          <div className="flex items-center justify-center gap-2 rounded-2xl border dark:border-white/10 border-border dark:bg-black/80 bg-background/80 px-4 py-3 shadow-2xl">
            <Button
              onClick={reset}
              className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:from-purple-500 hover:to-indigo-500 text-sm h-9"
            >
              <Flame className="mr-1.5 h-4 w-4" />
              Roast Another
            </Button>
            <Button
              variant="outline"
              onClick={handleShare}
              className="rounded-xl dark:border-white/10 border-border dark:bg-white/5 bg-muted dark:text-white text-foreground dark:hover:bg-white/10 hover:bg-muted/80 text-sm h-9"
            >
              <Share2 className="mr-1.5 h-4 w-4" />
              Share
            </Button>
            <Button
              variant="outline"
              onClick={handlePdfExport}
              disabled={isExporting}
              className="rounded-xl text-sm h-9"
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="mr-1.5 h-4 w-4" />}
              PDF

            </Button>
            <Button
              variant="outline"
              onClick={() => setCompareOpen(true)}
              className="rounded-xl text-sm h-9"
            >
              <GitCompare className="mr-1.5 h-4 w-4" />
              Compare
            </Button>
            <Button
              variant="outline"
              onClick={handleEmailReport}
              disabled={isEmailing}
              className="rounded-xl text-sm h-9"
            >
              {isEmailing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="mr-1.5 h-4 w-4" />}
              Copy Link
            </Button>
          </div>
        </div>
      </div>

      <CompareDialog
        open={compareOpen}
        onOpenChange={setCompareOpen}
        currentUrl={website.url}
        currentDomain={website.domain}
        currentTitle={website.title}
        currentOverallScore={data.overallScore}
        currentCategories={{
          uiux: data.uiux.score,
          seo: data.seo.score,
          accessibility: data.accessibility.score,
          performance: data.performance.score,
          mobile: data.mobile.score,
          design: data.design.score,
          conversion: data.conversion.score,
        }}
      />

      <UpgradeDialog
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        defaultPlan={upgradeFeature as 'starter' | 'pro' | 'enterprise'}
      />
    </div>
  )
}
