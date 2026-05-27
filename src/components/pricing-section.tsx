'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Check, Sparkles, Zap, Shield, Crown, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AuthDialog } from '@/components/auth-dialog'
import { UpgradeDialog } from '@/components/upgrade-dialog'
import { useToast } from '@/hooks/use-toast'

const PLAN_DATA = {
  monthly: [
    {
      name: 'Free',
      price: '₹0',
      period: 'forever',
      description: 'Perfect for trying out RoastMySite AI',
      icon: Zap,
      features: [
        '3 analyses per day',
        'Full 7-category audit',
        'AI roast (professional & savage)',
        'PDF report export',
        'Historical tracking',
        'Competitor comparison',
        'Email report',
      ],
      cta: 'Start Free',
      highlighted: false,
      planKey: 'free' as const,
    },
    {
      name: 'Starter',
      price: '₹499',
      period: '/month',
      description: 'For individual creators & freelancers',
      icon: Sparkles,
      features: [
        '10 analyses per day',
        'All Free features',
        'Email support',
      ],
      cta: 'Go Starter',
      highlighted: false,
      planKey: 'starter' as const,
    },
    {
      name: 'Pro',
      price: '₹1,499',
      period: '/month',
      description: 'For serious website optimization',
      icon: Crown,
      features: [
        'Unlimited analyses',
        'All Starter features',
        'Security Scanner',
        'Tech Stack Analysis',
        'Priority processing',
        'API access (100/day)',
      ],
      cta: 'Go Pro',
      highlighted: true,
      planKey: 'pro' as const,
    },
    {
      name: 'Enterprise',
      price: '₹4,999',
      period: '/month',
      description: 'For agencies and large teams',
      icon: Building2,
      features: [
        'Everything in Pro',
        'Up to 25 team members',
        'Shared dashboard',
        'API access (10,000/day)',
        'White-label reports',
        'Custom branding',
        'Priority support',
        'Dedicated account manager',
        'SLA guarantee',
        'Custom integrations',
      ],
      cta: 'Go Enterprise',
      highlighted: false,
      planKey: 'enterprise' as const,
    },
  ],
  yearly: [
    {
      name: 'Free',
      price: '₹0',
      period: 'forever',
      description: 'Perfect for trying out RoastMySite AI',
      icon: Zap,
      features: [
        '3 analyses per day',
        'Full 7-category audit',
        'AI roast (professional & savage)',
        'PDF report export',
        'Historical tracking',
        'Competitor comparison',
        'Email report',
      ],
      cta: 'Start Free',
      highlighted: false,
      planKey: 'free' as const,
    },
    {
      name: 'Starter',
      price: '₹4,990',
      period: '/year',
      description: 'For individual creators & freelancers',
      icon: Sparkles,
      features: [
        '10 analyses per day',
        'All Free features',
        'Email support',
      ],
      cta: 'Go Starter',
      highlighted: false,
      planKey: 'starter' as const,
      savings: '₹988/yr',
    },
    {
      name: 'Pro',
      price: '₹14,990',
      period: '/year',
      description: 'For serious website optimization',
      icon: Crown,
      features: [
        'Unlimited analyses',
        'All Starter features',
        'Security Scanner',
        'Tech Stack Analysis',
        'Priority processing',
        'API access (100/day)',
      ],
      cta: 'Go Pro',
      highlighted: true,
      planKey: 'pro' as const,
      savings: '₹2,998/yr',
    },
    {
      name: 'Enterprise',
      price: '₹49,990',
      period: '/year',
      description: 'For agencies and large teams',
      icon: Building2,
      features: [
        'Everything in Pro',
        'Up to 25 team members',
        'Shared dashboard',
        'API access (10,000/day)',
        'White-label reports',
        'Custom branding',
        'Priority support',
        'Dedicated account manager',
        'SLA guarantee',
        'Custom integrations',
      ],
      cta: 'Go Enterprise',
      highlighted: false,
      planKey: 'enterprise' as const,
      savings: '₹9,998/yr',
    },
  ],
}

type PlanKey = 'free' | 'starter' | 'pro' | 'enterprise'

export function PricingSection() {
  const { data: session } = useSession()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [authOpen, setAuthOpen] = useState(false)
  const [authTab, setAuthTab] = useState<'login' | 'register'>('register')
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [upgradePlan, setUpgradePlan] = useState<PlanKey>('pro')
  const { toast } = useToast()

  const currentPlan = session?.user?.plan || 'free'
  const plans = PLAN_DATA[billingCycle]

  const handlePlanClick = (plan: typeof plans[0]) => {
    if (plan.planKey === 'free' && currentPlan !== 'free') {
      toast({ title: 'Downgrade not available', description: 'Your current plan includes all Free features.' })
      return
    }
    if (plan.planKey === 'free') {
      if (session) {
        document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' })
      } else {
        setAuthTab('register')
        setAuthOpen(true)
      }
    } else {
      if (!session) {
        setAuthTab('register')
        setAuthOpen(true)
      } else if (currentPlan === plan.planKey) {
        toast({ title: `You're already on the ${plan.name} plan!` })
      } else if (
        (plan.planKey === 'starter' && (currentPlan === 'pro' || currentPlan === 'enterprise')) ||
        (plan.planKey === 'pro' && currentPlan === 'enterprise')
      ) {
        toast({ title: 'You already have these features!', description: 'Your current plan includes this plan\'s features.' })
      } else {
        setUpgradePlan(plan.planKey)
        setUpgradeOpen(true)
      }
    }
  }

  const getButtonLabel = (plan: typeof plans[0]) => {
    if (!session) return plan.cta
    if (currentPlan === plan.planKey) return 'Current Plan'
    if (plan.planKey === 'free' && currentPlan !== 'free') return 'Included'
    if (plan.planKey === 'starter' && (currentPlan === 'pro' || currentPlan === 'enterprise')) return 'Included'
    if (plan.planKey === 'pro' && currentPlan === 'enterprise') return 'Included'
    return plan.cta
  }

  const isPlanIncluded = (planKey: string) => {
    if (planKey === 'free' && currentPlan !== 'free') return true
    if (planKey === 'starter' && (currentPlan === 'pro' || currentPlan === 'enterprise')) return true
    if (planKey === 'pro' && currentPlan === 'enterprise') return true
    return false
  }

  return (
    <section id="pricing" className="relative px-4 py-28">
      {/* Background accent */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-1/4 h-[400px] w-[400px] rounded-full dark:bg-green-600/[0.03] bg-green-400/[0.03] blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 h-[300px] w-[300px] rounded-full dark:bg-purple-600/[0.03] bg-purple-400/[0.03] blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-green-500/20 dark:bg-green-500/10 bg-green-50/80 px-4 py-1.5 text-xs dark:text-green-300 text-green-700 mb-4 badge-shimmer">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            No Hidden Fees · All Inclusive
          </div>
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
            Simple,{' '}
            <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent animated-gradient-text">
              Transparent
            </span>{' '}
            Pricing
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
            Start free and upgrade when you need more. No hidden fees, no surprises.
          </p>
        </motion.div>

        {/* Billing toggle - always centered at full width */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex items-center justify-center gap-3 mb-12"
        >
          <span className={`text-sm font-medium transition-colors ${billingCycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>
            Monthly
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              billingCycle === 'yearly' ? 'bg-purple-600' : 'dark:bg-white/10 bg-muted'
            }`}
          >
            <div className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
              billingCycle === 'yearly' ? 'translate-x-5.5' : 'translate-x-0.5'
            }`} />
          </button>
          <span className={`text-sm font-medium transition-colors ${billingCycle === 'yearly' ? 'text-foreground' : 'text-muted-foreground'}`}>
            Yearly
          </span>
          <Badge className={`bg-green-500/15 text-green-400 border-green-500/30 text-[10px] ${billingCycle === 'yearly' ? 'animate-pulse' : 'invisible'}`}>
            Save up to 17%
          </Badge>
        </motion.div>

        {/* Pricing cards - constrained width for yearly */}
        <div className={billingCycle === 'yearly' ? 'max-w-5xl mx-auto' : ''}>
          <div className={`grid gap-5 sm:grid-cols-2 items-stretch ${
            billingCycle === 'yearly' ? 'lg:grid-cols-3' : 'lg:grid-cols-4'
          }`}>
          {plans.filter(p => billingCycle === 'yearly' ? p.planKey !== 'free' : true).map((plan, index) => {
            const PlanIcon = plan.icon
            const isCurrentPlan = currentPlan === plan.planKey
            const isIncluded = isPlanIncluded(plan.planKey)
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`relative overflow-hidden rounded-2xl border backdrop-blur-sm transition-all flex flex-col ${
                  plan.highlighted
                    ? 'border-purple-500/40 bg-gradient-to-b from-purple-500/[0.08] to-indigo-500/[0.03] shadow-2xl shadow-purple-500/10'
                    : 'dark:border-white/[0.06] border-border/50 dark:bg-white/[0.02] bg-card/80 dark:hover:border-white/[0.12] hover:border-muted-foreground/20'
                }`}
              >
                {/* Top gradient bar */}
                {plan.highlighted && (
                  <div className="h-1 w-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500" />
                )}

                <div className="p-5 lg:p-6 flex flex-col flex-1">
                  {/* Popular badge */}
                  {plan.highlighted && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-1 text-[10px] font-bold text-white shadow-lg shadow-purple-500/20">
                        <Sparkles className="h-3 w-3" />
                        MOST POPULAR
                      </div>
                    </div>
                  )}

                  {/* Savings badge */}
                  {'savings' in plan && plan.savings && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <Badge className="bg-green-500/15 text-green-400 border-green-500/30 text-[10px]">
                        Save {plan.savings}
                      </Badge>
                    </div>
                  )}

                  {/* Current plan badge */}
                  {session && isCurrentPlan && (
                    <div className={`absolute top-4 right-4 ${plan.highlighted ? 'top-6' : ''}`}>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">
                        Current
                      </Badge>
                    </div>
                  )}

                  {/* Plan icon + name */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                      plan.highlighted
                        ? 'bg-gradient-to-br from-amber-500 to-yellow-500 shadow-lg shadow-amber-500/25'
                        : (plan.planKey === 'pro' || plan.planKey === 'enterprise')
                        ? 'bg-gradient-to-br from-purple-500 to-indigo-500 shadow-lg shadow-purple-500/15'
                        : 'dark:bg-white/5 bg-muted'
                    }`}>
                      <PlanIcon className={`h-4.5 w-4.5 ${(plan.planKey === 'pro' || plan.planKey === 'enterprise') ? 'text-white' : plan.highlighted ? 'text-white' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground">{plan.name}</h3>
                      {(plan.planKey === 'pro' || plan.planKey === 'enterprise') && (
                        <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[8px] px-1.5 py-0 font-bold border-0 shadow-sm shadow-amber-500/20">
                          <Crown className="h-2.5 w-2.5 mr-0.5" />
                          PREMIUM
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground ml-1 text-sm">{plan.period}</span>
                  </div>

                  {/* CTA */}
                  <Button
                    onClick={() => handlePlanClick(plan)}
                    disabled={!!(session && (isCurrentPlan || isIncluded))}
                    className={`mb-4 w-full rounded-xl h-10 text-sm font-semibold ${
                      session && (isCurrentPlan || isIncluded)
                        ? 'dark:bg-white/5 bg-muted dark:text-white/50 text-muted-foreground cursor-default'
                        : plan.highlighted
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:from-purple-500 hover:to-indigo-500 transition-all'
                        : 'border dark:border-white/10 border-border dark:bg-white/5 bg-muted dark:text-white text-foreground dark:hover:bg-white/10 hover:bg-muted/80'
                    }`}
                    variant={plan.highlighted && !isCurrentPlan && !isIncluded ? 'default' : 'outline'}
                  >
                    {getButtonLabel(plan)}
                  </Button>

                  {/* Features list */}
                  <ul className="space-y-2.5 mt-auto">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm">
                        <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                          plan.highlighted ? 'bg-purple-500/15' : 'dark:bg-white/5 bg-muted/50'
                        }`}>
                          <Check className={`h-2.5 w-2.5 ${plan.highlighted ? 'text-purple-400' : 'text-muted-foreground'}`} />
                        </div>
                        <span className="text-muted-foreground text-[12px]">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )
          })}
        </div>
        </div>

        {/* GST notice */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-xs text-muted-foreground/50 mt-8"
        >
          All prices are inclusive of all taxes. Payment securely processed via Razorpay.
        </motion.p>
      </div>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} defaultTab={authTab} />
      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} defaultPlan={upgradePlan} defaultBillingCycle={billingCycle} />
    </section>
  )
}
