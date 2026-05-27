'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { GitCompare, Plus, X, Loader2, AlertTriangle, Trophy } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { usePlanFeatures } from '@/hooks/use-plan-features'

interface ComparisonResult {
  url: string
  domain?: string
  title?: string
  overallScore?: number
  categories?: {
    uiux: number
    seo: number
    accessibility: number
    performance: number
    mobile: number
    design: number
    conversion: number
  }
  isCurrentSite?: boolean
  error?: string
}

interface CompareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUrl?: string
  currentDomain?: string
  currentTitle?: string
  currentOverallScore?: number
  currentCategories?: {
    uiux: number
    seo: number
    accessibility: number
    performance: number
    mobile: number
    design: number
    conversion: number
  }
}

const categoryLabels: Record<string, string> = {
  uiux: 'UI/UX',
  seo: 'SEO',
  accessibility: 'A11y',
  performance: 'Perf',
  mobile: 'Mobile',
  design: 'Design',
  conversion: 'Conv.',
}

export function CompareDialog({
  open,
  onOpenChange,
  currentUrl,
  currentDomain,
  currentTitle,
  currentOverallScore,
  currentCategories,
}: CompareDialogProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [urls, setUrls] = useState<string[]>([''])
  const [isComparing, setIsComparing] = useState(false)
  const [results, setResults] = useState<{
    results: ComparisonResult[]
    winner: string | null
  } | null>(null)
  const { canCompare } = usePlanFeatures()
  const hasCurrentSite = !!currentUrl

  // Remove the independent plan fetch — use usePlanFeatures instead

  const addUrl = () => {
    if (urls.length < 4) setUrls([...urls, ''])
  }

  const removeUrl = (index: number) => {
    if (urls.length > 1) {
      setUrls(urls.filter((_, i) => i !== index))
    }
  }

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls]
    newUrls[index] = value
    setUrls(newUrls)
  }

  const normalizeUrl = (rawUrl: string): string => {
    try {
      const u = rawUrl.trim().toLowerCase()
      const parsed = new URL(u.startsWith('http') ? u : `https://${u}`)
      // Only use the hostname (root domain) — strip paths, queries, hashes
      return parsed.hostname
    } catch {
      return rawUrl.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/\/+$/, '')
    }
  }

  const cleanUrlToDomain = (rawUrl: string): { domain: string; hadSubpath: boolean } => {
    try {
      const u = rawUrl.trim().toLowerCase()
      const parsed = new URL(u.startsWith('http') ? u : `https://${u}`)
      const hadSubpath = (parsed.pathname !== '/' && parsed.pathname !== '') || parsed.search !== '' || parsed.hash !== ''
      return { domain: parsed.hostname, hadSubpath }
    } catch {
      return { domain: rawUrl.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/\/+$/, ''), hadSubpath: false }
    }
  }

  const handleCompare = async () => {
    const validUrls = urls.filter((u) => u.trim())
    if (validUrls.length < 1) {
      toast({ title: 'Need at least 1 competitor URL', variant: 'destructive' })
      return
    }

    // Clean all URLs to domain-only and notify if any were stripped
    const cleanedUrls = validUrls.map((u) => {
      const { domain, hadSubpath } = cleanUrlToDomain(u)
      if (hadSubpath) {
        toast({ title: 'Domain Extracted', description: `Using root domain: ${domain}` })
      }
      return domain
    })

    // Check if any competitor URL matches the current site (already roasted)
    if (hasCurrentSite && currentUrl) {
      const currentNorm = normalizeUrl(currentUrl)
      const duplicate = cleanedUrls.find((u) => normalizeUrl(u) === currentNorm)
      if (duplicate) {
        toast({
          title: '🔥 Already Roasted!',
          description: `"${duplicate}" is the same as your current site. It's already been roasted! Enter a different competitor URL.`,
          variant: 'destructive',
        })
        return
      }
    }

    // Check for duplicate competitor URLs
    const seen = new Set<string>()
    for (const u of cleanedUrls) {
      const norm = normalizeUrl(u)
      if (seen.has(norm)) {
        toast({
          title: 'Duplicate URL',
          description: `"${u}" is entered more than once. Please enter unique competitor URLs.`,
          variant: 'destructive',
        })
        return
      }
      seen.add(norm)
    }

    setIsComparing(true)
    setResults(null)
    try {
      // If we have a current site, include it in the comparison
      const allUrls = hasCurrentSite ? [currentUrl!, ...cleanedUrls] : cleanedUrls
      const res = await fetch('/api/analyze', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'compare', urls: allUrls }),
      })
      const data = await res.json()
      if (data.success) {
        // Mark the current site in results
        const finalResults = data.data.results.map((r: ComparisonResult) => {
          if (r.domain === currentDomain || r.url === currentUrl) {
            return { ...r, isCurrentSite: true }
          }
          return r
        })
        setResults({ results: finalResults, winner: data.data.winner })
      } else if (data.error === 'already_roasted') {
        toast({
          title: '🔥 Already Roasted!',
          description: data.message || `"${data.domain}" is already in the comparison. Each website should only appear once.`,
          variant: 'destructive',
        })
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Comparison failed', variant: 'destructive' })
    } finally {
      setIsComparing(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400'
    if (score >= 40) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] dark:border-white/10 border-border dark:bg-[#0a0a0f] bg-background backdrop-blur-xl p-0 overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600" />
        <div className="p-6">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/25">
                <GitCompare className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-foreground">Competitor Comparison</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Compare your site against competitors
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {!canCompare ? (
            <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Pro Plan Required</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Competitor comparison is available on Pro and Enterprise plans.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {/* Current site (pre-filled, read-only) */}
              {hasCurrentSite && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Site</p>
                  <div className="flex gap-2 items-center">
                    <span className="text-xs font-mono text-muted-foreground w-4 shrink-0">★</span>
                    <div className="flex-1 flex items-center gap-2 h-10 rounded-xl border border-purple-500/30 bg-purple-500/5 px-3">
                      <span className="text-sm text-foreground truncate">{currentUrl}</span>
                    </div>
                    <Badge variant="outline" className="shrink-0 border-purple-500/30 text-purple-400 text-[10px]">
                      Score: {currentOverallScore}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Competitor URL inputs */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Competitor Sites
                </p>
                {urls.map((url, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <span className="text-xs font-mono text-muted-foreground w-4 shrink-0">{index + 1}</span>
                    <Input
                      value={url}
                      onChange={(e) => updateUrl(index, e.target.value)}
                      placeholder="competitor.com"
                      className="h-10 rounded-xl dark:border-white/10 border-border dark:bg-white/5 bg-muted"
                    />
                    {urls.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeUrl(index)}
                        className="h-10 w-10 shrink-0 text-muted-foreground hover:text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {urls.length < 4 && (
                  <Button
                    variant="outline"
                    onClick={addUrl}
                    className="w-full h-9 rounded-xl border-dashed text-muted-foreground"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Competitor
                  </Button>
                )}
              </div>

              <Button
                onClick={handleCompare}
                disabled={isComparing}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
              >
                {isComparing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Analyzing {urls.filter((u) => u.trim()).length + (hasCurrentSite ? 1 : 0)} websites...
                  </>
                ) : (
                  <>
                    <GitCompare className="h-4 w-4 mr-2" />
                    Compare {hasCurrentSite ? 'with Your Site' : 'Websites'}
                  </>
                )}
              </Button>

              {/* Results */}
              <AnimatePresence>
                {results && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    {results.winner && (
                      <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                        <Trophy className="h-5 w-5 text-amber-400" />
                        <p className="text-sm">
                          <span className="font-medium text-foreground">{results.winner}</span>
                          <span className="text-muted-foreground"> scores highest!</span>
                        </p>
                      </div>
                    )}

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b dark:border-white/10 border-border">
                            <th className="py-2 px-3 text-left text-xs font-medium text-muted-foreground">Category</th>
                            {results.results.filter(r => !r.error).map((r, i) => (
                              <th key={i} className="py-2 px-3 text-center text-xs font-medium">
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className="text-foreground">{r.domain}</span>
                                  {r.isCurrentSite && (
                                    <Badge variant="outline" className="text-[9px] px-1 py-0 border-purple-500/30 text-purple-400">
                                      YOURS
                                    </Badge>
                                  )}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b dark:border-white/5 border-border">
                            <td className="py-2 px-3 font-medium text-foreground">Overall</td>
                            {results.results.filter(r => !r.error).map((r, i) => (
                              <td key={i} className="py-2 px-3 text-center">
                                <span className={`text-lg font-bold ${getScoreColor(r.overallScore || 0)}`}>
                                  {r.overallScore}
                                </span>
                              </td>
                            ))}
                          </tr>
                          {Object.entries(categoryLabels).map(([key, label]) => (
                            <tr key={key} className="border-b dark:border-white/5 border-border">
                              <td className="py-2 px-3 text-muted-foreground">{label}</td>
                              {results.results.filter(r => !r.error).map((r, i) => (
                                <td key={i} className="py-2 px-3 text-center">
                                  <span className={`font-medium ${getScoreColor(r.categories?.[key as keyof typeof r.categories] || 0)}`}>
                                    {r.categories?.[key as keyof typeof r.categories] || '-'}
                                  </span>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
