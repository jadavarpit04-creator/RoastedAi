'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useAnalysisStore } from '@/hooks/use-analysis-store'
import { AnimatedBackground } from '@/components/animated-background'
import { Navbar } from '@/components/navbar'
import { HeroSection } from '@/components/hero-section'
import { FeaturesSection } from '@/components/features-section'
import { PricingSection } from '@/components/pricing-section'
import { FAQSection } from '@/components/faq-section'
import { RoastExamplesSection } from '@/components/roast-examples-section'
import { AnalysisLoader } from '@/components/analysis-loader'
import { ResultsDashboard } from '@/components/results-dashboard'
import { BillingDashboard } from '@/components/billing-dashboard'
import { Footer } from '@/components/footer'
import type { AnalysisResult } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { usePlanFeatures } from '@/hooks/use-plan-features'

export default function Home() {
  const { view, url, roastMode, setAnalysisResult, setError, setStep, setView, reset } = useAnalysisStore()
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const reportLoadedRef = useRef<string | false>(false)
  const isAnalyzingRef = useRef(false)
  const { refetch: refetchUsage } = usePlanFeatures()

  // Load shared report from URL query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const reportId = params.get('report')
    if (reportId && view === 'landing') {
      if (reportLoadedRef.current === reportId) return // Already loading/loading this exact report
      reportLoadedRef.current = reportId
      const loadReport = async () => {
        try {
          const res = await fetch(`/api/analyze?id=${reportId}`)
          const data = await res.json()
          if (data.success && data.data) {
            const report = data.data
            const result: AnalysisResult = {
              success: true,
              reportId: report.id,
              data: {
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
              },
              website: {
                title: report.domain,
                url: report.url,
                domain: report.domain,
              },
            }
            setAnalysisResult(result)
          } else {
            toast({ title: 'Report Not Found', description: 'This shared report may have been deleted or doesn\'t exist.', variant: 'destructive' })
          }
        } catch {
          toast({ title: 'Error', description: 'Failed to load shared report.', variant: 'destructive' })
        }
      }
      loadReport()
    }
  }, [view, setAnalysisResult, toast])

  const runAnalysis = useCallback(async () => {
    // Guard against duplicate calls — if already analyzing, skip
    if (isAnalyzingRef.current) return
    isAnalyzingRef.current = true

    try {
      if (!session) {
        setError('Please sign in to analyze websites')
        return
      }

      let analysisUrl = url.trim().toLowerCase()
      if (!analysisUrl.startsWith('http')) {
        analysisUrl = `https://${analysisUrl}`
      }

      try {
        const parsed = new URL(analysisUrl)
        analysisUrl = `https://${parsed.hostname}`
      } catch {
        // If URL parsing fails, proceed as-is
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: analysisUrl, roastMode }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Analysis failed' }))
        if (errorData.error === 'invalid_website') {
          throw new Error('invalid_website:' + (errorData.domain || '') + ':' + (errorData.message || ''))
        }
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const result: AnalysisResult = await response.json()

      if (!result.success) {
        throw new Error('Analysis was not successful')
      }

      setStep(6)
      await new Promise((resolve) => setTimeout(resolve, 800))
      setAnalysisResult(result)
      // Refresh usage data so remaining count is accurate
      refetchUsage()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred'
      
      if (message.startsWith('invalid_website:')) {
        const parts = message.split(':')
        const domain = parts.slice(1, 2).join(':')
        const detailedMessage = parts.slice(2).join(':')
        setError('Invalid website')
        toast({
          title: 'Invalid Website',
          description: detailedMessage
            || (domain
              ? `"${domain}" is not a valid or reachable website. Please check the URL and try again.`
              : 'This website does not exist or cannot be reached. Please check the URL and try again.'),
          variant: 'destructive',
        })
      } else if (message.includes('limit reached') || message.includes('Limit reached')) {
        setError(message)
        toast({
          title: 'Daily Limit Reached',
          description: message,
          variant: 'destructive',
        })
      } else if (message.includes('Analysis failed') || message.includes('Server error') || message.includes('500')) {
        setError('Server error')
        toast({
          title: 'Analysis Error',
          description: message || 'Something went wrong. Please try again in a moment.',
          variant: 'destructive',
        })
      } else {
        setError(message)
        toast({
          title: 'Analysis Failed',
          description: message,
          variant: 'destructive',
        })
      }
    } finally {
      isAnalyzingRef.current = false
    }
  }, [url, roastMode, session, setAnalysisResult, setError, setStep, toast, refetchUsage])

  useEffect(() => {
    if (view === 'loading' && session) {
      runAnalysis()
    } else if (view === 'loading' && !session && status !== 'loading') {
      setError('Please sign in to analyze websites')
    }
  }, [view, session, status, runAnalysis, setError])

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      <AnimatedBackground />
      <Navbar />

      {view === 'loading' && <AnalysisLoader />}

      <div className="flex-1 flex flex-col">
        {view === 'landing' && (
          <main className="flex-1 flex flex-col">
            <HeroSection />
            <FeaturesSection />
            <RoastExamplesSection />
            <PricingSection />
            <FAQSection />
          </main>
        )}

        {/* Keep ResultsDashboard & BillingDashboard mounted but hidden to preserve child state
            (e.g., TechAnalyzerPanel loading/results) when navigating between views */}
        <main className={`flex-1 flex flex-col ${view === 'results' ? '' : 'hidden'}`}>
          <ResultsDashboard />
        </main>

        <main className={`flex-1 flex flex-col ${view === 'billing' ? '' : 'hidden'}`}>
          <BillingDashboard />
        </main>
      </div>

      <Footer />
    </div>
  )
}
