'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { BarChart3, ExternalLink, Loader2, Flame, Clock, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { ScoreRing } from '@/components/score-ring'
import { useAnalysisStore } from '@/hooks/use-analysis-store'
import { usePlanFeatures } from '@/hooks/use-plan-features'
import { useToast } from '@/hooks/use-toast'
import type { AnalysisData } from '@/lib/types'

interface ReportSummary {
  id: string
  url: string
  domain: string
  overallScore: number
  roastMode: string
  createdAt: string
}

interface ReportsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReportsDialog({ open, onOpenChange }: ReportsDialogProps) {
  const { data: session } = useSession()
  const [reports, setReports] = useState<ReportSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingReport, setLoadingReport] = useState<string | null>(null)
  const { setAnalysisResult, startAnalysis, reset } = useAnalysisStore()
  const { refetch } = usePlanFeatures()
  const { toast } = useToast()

  useEffect(() => {
    if (open && session) {
      fetchReports()
    }
  }, [open, session])

  const fetchReports = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/analyze')
      const data = await res.json()
      if (data.success) {
        setReports(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadReport = async (reportId: string) => {
    setLoadingReport(reportId)
    try {
      const res = await fetch(`/api/analyze?id=${reportId}`)
      const data = await res.json()
      if (data.success) {
        const report = data.data
        const analysisData: AnalysisData = {
          overallScore: report.overallScore,
          uiux: report.uiux,
          seo: report.seo,
          accessibility: report.accessibility,
          performance: report.performance,
          mobile: report.mobile,
          design: report.design,
          conversion: report.conversion,
          roast: report.roast,
          finalVerdict: report.finalVerdict,
        }
        setAnalysisResult({
          success: true,
          reportId: report.id,
          data: analysisData,
          website: {
            title: report.domain,
            url: report.url,
            domain: report.domain,
          },
        })
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Failed to load report:', error)
    } finally {
      setLoadingReport(null)
    }
  }

  const deleteReport = async (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await fetch(`/api/analyze?id=${reportId}`, { method: 'DELETE' })
      setReports(reports.filter(r => r.id !== reportId))
      // Refresh usage data (note: deleting a report does NOT restore daily analysis count)
      await refetch()
      toast({ title: 'Report Deleted', description: 'Report has been removed successfully.' })
    } catch (error) {
      console.error('Failed to delete report:', error)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400'
    if (score >= 40) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] dark:border-white/10 border-border dark:bg-[#0a0a0f] bg-background backdrop-blur-xl p-0 overflow-hidden">
        {/* Top gradient bar */}
        <div className="h-1 w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600" />

        <div className="p-6">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/25">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-foreground">My Reports</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Your past website analyses
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
              </div>
            ) : reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl dark:bg-white/5 bg-muted/50">
                  <Flame className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">No reports yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Analyze a website to see your reports here
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-96">
                <div className="space-y-2 pr-3">
                  {reports.map((report, index) => (
                    <motion.button
                      key={report.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => loadReport(report.id)}
                      disabled={loadingReport !== null}
                      className="flex w-full items-center gap-4 rounded-xl border dark:border-white/10 border-border dark:bg-white/5 bg-card p-4 text-left transition-all dark:hover:border-white/20 hover:border-muted-foreground/20 dark:hover:bg-white/10 hover:bg-muted/50 disabled:opacity-50 disabled:cursor-wait"
                    >
                      <div className="shrink-0">
                        <ScoreRing score={report.overallScore} size={48} strokeWidth={3} delay={0.1 + index * 0.05} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-foreground">{report.domain}</p>
                          <Badge
                            variant="outline"
                            className={`shrink-0 text-[10px] px-1.5 py-0 ${
                              report.roastMode === 'savage'
                                ? 'border-orange-500/30 text-orange-400'
                                : 'border-purple-500/30 text-purple-400'
                            }`}
                          >
                            {report.roastMode}
                          </Badge>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDate(report.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {loadingReport === report.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => deleteReport(report.id, e)}
                              className="h-8 w-8 text-muted-foreground hover:text-red-400 dark:hover:bg-white/5 hover:bg-muted/50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
