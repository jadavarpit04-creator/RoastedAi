'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { Flame, Sparkles, Zap, Globe, Shield, Clock, Gift, ArrowDown, ChevronRight, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAnalysisStore } from '@/hooks/use-analysis-store'
import { usePlanFeatures } from '@/hooks/use-plan-features'
import { useToast } from '@/hooks/use-toast'
import type { RoastMode } from '@/lib/types'
import { AuthDialog } from '@/components/auth-dialog'

const trustItems = [
  { icon: Gift, label: 'Free to start', color: 'text-green-400' },
  { icon: Shield, label: 'Create free account', color: 'text-blue-400' },
  { icon: Clock, label: 'Results in 30s', color: 'text-purple-400' },
]

const stats = [
  { value: '50,000+', label: 'Websites Analyzed' },
  { value: '7', label: 'Analysis Categories' },
  { value: '<30s', label: 'Average Scan Time' },
]

export function HeroSection() {
  const { url, setUrl, roastMode, setRoastMode, startAnalysis } = useAnalysisStore()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [authOpen, setAuthOpen] = useState(false)
  const { canAnalyze, analysesRemaining, analysesUsedToday, isUnlimited, currentPlan } = usePlanFeatures()
  const urlInputRef = useRef<HTMLInputElement>(null)

  const validateUrl = (input: string): { error: string | null; cleaned: string } => {
    const trimmed = input.trim()
    if (!trimmed) return { error: 'Please enter a website URL', cleaned: '' }

    const normalized = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`

    try {
      const parsed = new URL(normalized)
      const hostname = parsed.hostname

      if (!hostname.includes('.')) return { error: 'Please enter a full website URL (e.g., example.com)', cleaned: '' }
      const parts = hostname.split('.')
      const tld = parts[parts.length - 1]
      if (tld.length < 1) return { error: 'Invalid website URL. Please enter a valid domain like example.com', cleaned: '' }
      if (!/^[a-z0-9]([a-z0-9._-]*[a-z0-9])?$/i.test(hostname)) return { error: 'URL contains invalid characters.', cleaned: '' }
      if (hostname === 'localhost' || hostname.startsWith('127.') || hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('0.')) return { error: 'Please enter a public website URL.', cleaned: '' }

      return { error: null, cleaned: hostname }
    } catch {
      return { error: 'Invalid URL format. Please enter a valid website address like example.com', cleaned: '' }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Not signed in → open auth dialog immediately (no URL required first)
    if (!session) {
      setAuthOpen(true)
      return
    }

    // Signed in but no URL → focus the input
    if (!url.trim()) {
      toast({ title: 'Enter a Website', description: 'Please enter a website URL to roast.' })
      urlInputRef.current?.focus()
      return
    }

    const { error, cleaned } = validateUrl(url)
    if (error) {
      toast({ title: 'Invalid Website', description: error, variant: 'destructive' })
      return
    }

    // Check if user can analyze (plan limit check)
    if (!canAnalyze) {
      toast({
        title: 'Daily Limit Reached',
        description: `You've used all your analyses for today. Upgrade your plan for more!`,
        variant: 'destructive',
      })
      document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
      return
    }

    if (cleaned && cleaned !== url.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '')) {
      setUrl(cleaned)
      toast({ title: 'Domain Extracted', description: `Using root domain: ${cleaned}` })
    }

    setUrl(cleaned)
    startAnalysis()
  }

  const sessionTrustItems = session
    ? trustItems.map(t => t.label === 'Create free account' ? { ...t, label: 'Signed in' } : t)
    : trustItems

  return (
    <>
      <section
        id="hero"
        className="relative min-h-[85vh] flex items-center justify-center px-4 pt-24 pb-16"
      >
        {/* Multi-layer background effects */}
        <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full dark:bg-purple-600/8 bg-purple-400/8 blur-[140px]" />
        <div className="pointer-events-none absolute top-1/3 left-1/4 h-[400px] w-[400px] rounded-full dark:bg-pink-600/5 bg-pink-400/5 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full dark:bg-orange-600/5 bg-orange-400/5 blur-[100px]" />

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          {/* Badge with shimmer */}
          <motion.a
            href="#features"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-purple-500/20 dark:bg-purple-500/10 bg-purple-50/80 px-5 py-2.5 text-sm dark:text-purple-300 text-purple-700 badge-shimmer cursor-pointer hover:border-purple-500/40 hover:dark:bg-purple-500/15 hover:bg-purple-50 transition-colors"
          >
            <Sparkles className="h-4 w-4 animate-pulse" />
            AI-Powered Website Analysis
            <ChevronRight className="h-3 w-3 opacity-50" />
          </motion.a>

          {/* Headline with animated gradient */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1]"
          >
            Get Your Website{' '}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent animated-gradient-text">
              Roasted
            </span>{' '}
            by AI
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed"
          >
            AI-powered audits for UI, SEO, speed & accessibility — honest feedback in seconds.
          </motion.p>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-10 flex items-center justify-center gap-8 sm:gap-12"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Input area */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            onSubmit={handleSubmit}
            className="relative mx-auto max-w-2xl"
          >
            {/* Animated glow behind input */}
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-purple-600/15 via-pink-600/15 to-orange-600/15 blur-2xl animate-pulse-glow" />

            <div className="relative rounded-2xl border dark:border-white/[0.08] border-border/50 dark:bg-white/[0.04] bg-card/90 p-3 shadow-2xl dark:shadow-purple-500/5">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Globe className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={urlInputRef}
                    type="text"
                    placeholder="Enter a domain (e.g., youtube.com)"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="h-12 rounded-xl border-0 dark:bg-white/5 bg-muted/50 pl-11 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-purple-500/50 text-base"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!!(session && !canAnalyze)}
                  className="h-12 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:from-purple-500 hover:to-indigo-500 transition-all text-base font-semibold px-8 glow-pulse disabled:opacity-60"
                >
                  <Flame className="mr-2 h-5 w-5" />
                  {!session ? 'Sign In & Roast' : !canAnalyze ? 'Limit Reached' : 'Roast It'}
                </Button>
              </div>

              {/* Usage indicator for logged-in users */}
              {session && (
                <div className="mt-2.5 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    {isUnlimited ? (
                      <Badge className="bg-green-500/15 text-green-400 border-green-500/30 text-[10px] gap-1">
                        <Sparkles className="h-2.5 w-2.5" />
                        Unlimited analyses
                      </Badge>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Zap className="h-3 w-3 text-purple-400" />
                          <span>
                            {analysesRemaining} analyses remaining today
                          </span>
                        </div>
                        {/* Mini progress bar */}
                        <div className="w-20 h-1.5 rounded-full dark:bg-white/5 bg-black/5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              analysesRemaining === 0
                                ? 'bg-red-500'
                                : analysesRemaining <= 1
                                ? 'bg-amber-500'
                                : 'bg-purple-500'
                            }`}
                            style={{
                              width: `${Math.max(0, ((analysesUsedToday !== undefined ? (currentPlan === 'free' ? 3 : currentPlan === 'starter' ? 10 : 3) - analysesRemaining : 0) / (currentPlan === 'free' ? 3 : currentPlan === 'starter' ? 10 : 3)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  {!canAnalyze && (
                    <button
                      type="button"
                      onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                      className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      Upgrade for more
                    </button>
                  )}
                </div>
              )}

              {/* Mode toggle with enhanced styling */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRoastMode('professional')}
                  className={`group relative rounded-xl px-4 py-3 text-left transition-all duration-200 ${
                    roastMode === 'professional'
                      ? 'bg-purple-500/10 border border-purple-500/30 shadow-lg shadow-purple-500/5'
                      : 'dark:bg-white/[0.02] bg-muted/30 border border-transparent hover:border-purple-500/20 hover:bg-purple-500/5'
                  }`}
                >
                  {roastMode === 'professional' && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/5 to-indigo-500/5" />
                  )}
                  <div className="relative flex items-center gap-2 mb-1">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-lg transition-all duration-200 ${
                      roastMode === 'professional'
                        ? 'bg-gradient-to-br from-purple-500 to-indigo-500 shadow-lg shadow-purple-500/30'
                        : 'dark:bg-white/10 bg-muted group-hover:bg-purple-500/20'
                    }`}>
                      <Zap className={`h-3.5 w-3.5 transition-colors ${roastMode === 'professional' ? 'text-white' : 'text-muted-foreground'}`} />
                    </div>
                    <span className={`text-sm font-semibold transition-colors ${roastMode === 'professional' ? 'text-purple-300' : 'text-muted-foreground'}`}>
                      Professional
                    </span>
                  </div>
                  <p className={`relative text-[11px] leading-snug pl-8 transition-colors ${
                    roastMode === 'professional' ? 'text-purple-400/70' : 'text-muted-foreground/50'
                  }`}>
                    Constructive & actionable feedback
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setRoastMode('savage')}
                  className={`group relative rounded-xl px-4 py-3 text-left transition-all duration-200 ${
                    roastMode === 'savage'
                      ? 'bg-red-500/10 border border-red-500/30 shadow-lg shadow-red-500/5 fire-glow-active'
                      : 'dark:bg-white/[0.02] bg-muted/30 border border-transparent hover:border-red-500/20 hover:bg-red-500/5'
                  }`}
                >
                  {roastMode === 'savage' && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/5 to-orange-500/5" />
                  )}
                  <div className="relative flex items-center gap-2 mb-1">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-lg transition-all duration-200 ${
                      roastMode === 'savage'
                        ? 'bg-gradient-to-br from-red-500 to-orange-500 shadow-lg shadow-red-500/30'
                        : 'dark:bg-white/10 bg-muted group-hover:bg-red-500/20'
                    }`}>
                      <Flame className={`h-3.5 w-3.5 transition-colors ${roastMode === 'savage' ? 'text-white' : 'text-muted-foreground'}`} />
                    </div>
                    <span className={`text-sm font-semibold transition-colors ${roastMode === 'savage' ? 'text-red-300' : 'text-muted-foreground'}`}>
                      Savage Mode
                    </span>
                  </div>
                  <p className={`relative text-[11px] leading-snug pl-8 transition-colors ${
                    roastMode === 'savage' ? 'text-red-400/70' : 'text-muted-foreground/50'
                  }`}>
                    Brutally honest, fiery wit & humor
                  </p>
                </button>
              </div>
            </div>
          </motion.form>

          {/* Trust indicators with hover effects */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-6"
          >
            {sessionTrustItems.map((item) => (
              <span key={item.label} className="flex items-center gap-2 text-sm text-muted-foreground trust-item-glow cursor-default">
                <item.icon className={`h-4 w-4 ${item.color}`} />
                {item.label}
              </span>
            ))}
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-8 flex items-center justify-center gap-3"
          >
            <div className="flex -space-x-2">
              {['SC', 'MR', 'EW', 'AK'].map((initials, i) => (
                <div
                  key={i}
                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 dark:border-[#0a0a0f] border-background bg-gradient-to-br from-purple-600 to-indigo-600 text-[10px] font-bold text-white shadow-sm"
                >
                  {initials}
                </div>
              ))}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500 star-shimmer" style={{ animationDelay: `${i * 0.2}s` }} viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Loved by 2,000+ developers</p>
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.a
            href="#features"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="mt-12 flex flex-col items-center gap-1 animate-bounce-subtle cursor-pointer group"
          >
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 group-hover:text-muted-foreground/80 transition-colors">Explore</span>
            <ArrowDown className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors" />
          </motion.a>
        </div>
      </section>

      {/* Auth Dialog */}
      <AuthDialog
        open={authOpen}
        onOpenChange={(open) => {
          setAuthOpen(open)
          if (!open && session && url.trim()) {
            startAnalysis()
          }
        }}
        defaultTab="register"
      />
    </>
  )
}
