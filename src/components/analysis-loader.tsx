'use client'

import { useEffect } from 'react'
import {
  Globe,
  FileText,
  Monitor,
  Search,
  Accessibility,
  Flame,
  Loader2,
  Cpu,
  CheckCircle2,
} from 'lucide-react'
import { useAnalysisStore } from '@/hooks/use-analysis-store'

const loadingSteps = [
  { label: 'Fetching website content', icon: Globe, duration: 3000 },
  { label: 'Capturing page metadata', icon: FileText, duration: 2000 },
  { label: 'Analyzing UI/UX patterns', icon: Monitor, duration: 3000 },
  { label: 'Checking SEO structure', icon: Search, duration: 2000 },
  { label: 'Running accessibility audit', icon: Accessibility, duration: 3000 },
  { label: 'Generating AI roast', icon: Flame, duration: 4000 },
]

const tips = [
  "Did you know? 53% of mobile users leave sites that take over 3 seconds to load.",
  "Websites with clear CTAs convert 202% better than those without.",
  "94% of first impressions are design-related.",
  "Accessible websites reach 15% more potential users.",
  "The average attention span online is just 8.25 seconds.",
]

export function AnalysisLoader() {
  const { currentStep, setStep } = useAnalysisStore()

  useEffect(() => {
    if (currentStep >= loadingSteps.length) return

    const timers: ReturnType<typeof setTimeout>[] = []
    let step = 0

    const advanceStep = () => {
      if (step < loadingSteps.length) {
        setStep(step)
        const delay = loadingSteps[step].duration + Math.random() * 1000
        step++
        timers.push(setTimeout(advanceStep, delay))
      }
    }

    timers.push(setTimeout(advanceStep, 500))

    return () => {
      timers.forEach(clearTimeout)
    }
  }, [setStep])

  const currentTip = tips[currentStep % tips.length]
  const progressPercent = ((currentStep + 1) / loadingSteps.length) * 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center dark:bg-black/90 bg-background/95 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-3xl border dark:border-white/[0.08] border-border/50 dark:bg-[#0c0c14] bg-card p-6 sm:p-8 shadow-2xl">
        {/* AI Brain Animation - CSS only */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-xl shadow-purple-500/30 glow-pulse">
              <Cpu className="h-8 w-8 text-white" />
            </div>
            <div className="absolute -inset-3 rounded-3xl border border-purple-500/20 animate-spin [animation-duration:8s]" />
            <div className="absolute -inset-6 rounded-3xl border border-indigo-500/10 animate-spin [animation-duration:12s] [animation-direction:reverse]" />
          </div>
        </div>

        {/* Title */}
        <h3 className="mb-1 text-center text-lg font-semibold text-foreground">
          Analyzing Your Website
        </h3>
        <p className="mb-5 text-center text-xs text-muted-foreground">
          Our AI is reviewing every detail...
        </p>

        {/* Steps - no Framer Motion */}
        <div className="space-y-1.5">
          {loadingSteps.map((step, index) => {
            const StepIcon = step.icon
            const isActive = index === currentStep
            const isComplete = index < currentStep
            const isPending = index > currentStep

            return (
              <div
                key={step.label}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-150 ${
                  isActive
                    ? 'bg-purple-600/10 border border-purple-500/20'
                    : isComplete
                      ? 'dark:bg-white/[0.02] bg-muted/20'
                      : 'opacity-30'
                }`}
              >
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  isActive
                    ? 'bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/20'
                    : isComplete
                      ? 'bg-green-500/15'
                      : 'dark:bg-white/5 bg-muted/50'
                }`}>
                  {isActive ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                  ) : isComplete ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <StepIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
                <span className={`text-xs ${
                  isActive ? 'text-foreground font-medium' : isComplete ? 'text-green-400/80' : 'text-muted-foreground'
                }`}>
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Progress bar - CSS transition */}
        <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full dark:bg-white/5 bg-black/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-[10px] text-muted-foreground">
            Step {Math.min(currentStep + 1, loadingSteps.length)} of {loadingSteps.length}
          </p>
          <p className="text-[10px] text-muted-foreground">
            ~20-40 seconds
          </p>
        </div>

        {/* Tip - key-based remount for transition */}
        <div
          key={currentStep}
          className="mt-4 rounded-xl dark:bg-white/[0.02] bg-muted/20 px-3 py-2.5 animate-in fade-in duration-300"
        >
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            💡 {currentTip}
          </p>
        </div>
      </div>
    </div>
  )
}
