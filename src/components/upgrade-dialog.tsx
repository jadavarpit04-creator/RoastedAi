'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Check, Loader2, Zap, Shield, ArrowRight, CreditCard, Lock, Crown } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

type PlanKey = 'starter' | 'pro' | 'enterprise'

interface UpgradeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultPlan?: PlanKey
  defaultBillingCycle?: 'monthly' | 'yearly'
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  prefill: { name: string; email: string; contact?: string }
  theme: { color: string }
  handler: (response: RazorpayResponse) => void
  modal?: {
    ondismiss?: () => void
  }
  remember_customer?: boolean
}

interface RazorpayResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

interface RazorpayInstance {
  open: () => void
}

const PLAN_INFO: Record<string, { name: string; monthly: number; yearly: number; features: string[] }> = {
  starter: {
    name: 'Starter',
    monthly: 499,
    yearly: 4990,
    features: [
      '10 analyses per day',
      'Full 7-category audit',
      'AI roast (savage mode)',
      'PDF report export',
      'Historical tracking',
      'Email support',
    ],
  },
  pro: {
    name: 'Pro',
    monthly: 1499,
    yearly: 14990,
    features: [
      'Unlimited analyses',
      'Full 7-category audit',
      'AI roast (savage mode)',
      'Priority processing',
      'PDF report export',
      'Competitor comparison',
      'API access (100/day)',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    monthly: 4999,
    yearly: 49990,
    features: [
      'Everything in Pro',
      'Up to 25 team members',
      'Shared dashboard',
      'API access (10,000/day)',
      'White-label reports',
      'Custom branding',
      'Priority support',
      'Dedicated account manager',
    ],
  },
}

export function UpgradeDialog({ open, onOpenChange, defaultPlan = 'pro', defaultBillingCycle = 'monthly' }: UpgradeDialogProps) {
  const { data: session, update: updateSession } = useSession()
  const { toast } = useToast()
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(defaultPlan)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(defaultBillingCycle)
  const [isProcessing, setIsProcessing] = useState(false)

  const planInfo = PLAN_INFO[selectedPlan]
  const totalAmount = planInfo[billingCycle]

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
  }



  const handleUpgrade = async () => {
    if (!session?.user) return
    setIsProcessing(true)

    try {
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          billingCycle,

        }),
      })

      const orderData = await orderRes.json()

      if (!orderData.success) {
        toast({ title: 'Error', description: orderData.error || 'Failed to create order', variant: 'destructive' })
        setIsProcessing(false)
        return
      }

      const { contact: _contact, ...prefillWithoutContact } = orderData.prefill
      const options: RazorpayOptions = {
        key: orderData.key,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'RoastMySite AI',
        description: `${planInfo.name} Plan — ${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}`,
        order_id: orderData.order.id,
        prefill: prefillWithoutContact,
        remember_customer: false,
        theme: { color: '#7c3aed' },
        handler: async (response: RazorpayResponse) => {
          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })

            const verifyData = await verifyRes.json()

            if (verifyData.success) {
              await updateSession({ plan: selectedPlan })
              await new Promise(resolve => setTimeout(resolve, 800))
              await updateSession({ plan: selectedPlan })
              toast({
                title: `Upgraded to ${planInfo.name}! 🎉`,
                description: verifyData.data.message,
              })
              onOpenChange(false)
            } else {
              toast({
                title: 'Payment Verification Failed',
                description: verifyData.error || 'Please contact support if money was deducted.',
                variant: 'destructive',
              })
            }
          } catch {
            toast({
              title: 'Verification Error',
              description: 'Payment was processed but verification failed. Please contact support.',
              variant: 'destructive',
            })
          } finally {
            setIsProcessing(false)
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false)
            toast({ title: 'Payment Cancelled', description: 'Your payment was cancelled.' })
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch {
      toast({ title: 'Error', description: 'Failed to initiate payment', variant: 'destructive' })
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] dark:border-white/10 border-border dark:bg-[#0a0a0f] bg-background backdrop-blur-xl p-0 overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500" />
        <div className="p-6 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 shadow-lg shadow-amber-500/25">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-foreground">Upgrade Your Plan</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Unlock premium features · Secure payment via Razorpay
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Plan selection */}
          <div className="mt-5 space-y-2">
            {(Object.keys(PLAN_INFO) as PlanKey[]).map((key) => {
              const info = PLAN_INFO[key]
              const price = info[billingCycle]
              return (
                <button
                  key={key}
                  onClick={() => setSelectedPlan(key)}
                  className={`w-full rounded-xl border p-3.5 text-left transition-all ${
                    selectedPlan === key
                      ? 'border-purple-500/50 bg-purple-500/5 shadow-lg shadow-purple-500/10'
                      : 'dark:border-white/10 border-border dark:bg-white/5 bg-card hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-semibold text-foreground">{info.name}</h4>
                      {selectedPlan === key && (
                        <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px]">
                          Selected
                        </Badge>
                      )}
                      {key === 'pro' && (
                        <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-400">POPULAR</Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold text-foreground">{formatPrice(price)}</span>
                      <span className="text-muted-foreground text-xs">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Billing cycle toggle */}
          <div className="mt-4 flex items-center justify-between rounded-xl border dark:border-white/10 border-border p-3">
            <span className="text-sm text-muted-foreground">Billing cycle</span>
            <div className="flex items-center gap-1 rounded-lg dark:bg-white/5 bg-muted p-0.5">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  billingCycle === 'yearly'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Yearly
                <span className="ml-1 text-[9px] text-green-400">-17%</span>
              </button>
            </div>
          </div>

          {/* Features preview */}
          <div className="mt-4 rounded-xl border dark:border-white/10 border-border p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">What you get:</p>
            <div className="grid grid-cols-2 gap-1">
              {planInfo.features.slice(0, 6).map((feature) => (
                <div key={feature} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Check className="h-3 w-3 text-purple-400 shrink-0" />
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* Price breakdown */}
          <div className="mt-4 rounded-xl border dark:border-white/10 border-border p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Plan price</span>
              <span className="text-foreground">{formatPrice(totalAmount)}</span>
            </div>
            <div className="border-t dark:border-white/10 border-border pt-2 flex justify-between">
              <span className="text-sm font-semibold text-foreground">Total</span>
              <span className="text-lg font-bold text-foreground">{formatPrice(totalAmount)}</span>
            </div>
          </div>

          {/* Security notice */}
          <div className="mt-3 rounded-xl border border-green-500/20 bg-green-500/5 p-2.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-green-400" />
              Secure payment · Cancel anytime · Instant activation · 14-day money-back guarantee
            </div>
          </div>

          {/* Pay button */}
          <Button
            onClick={handleUpgrade}
            disabled={isProcessing}
            className="mt-4 w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 text-base font-medium"
          >
            {isProcessing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <CreditCard className="mr-2 h-5 w-5" />
                Pay {formatPrice(totalAmount)} with Razorpay
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>

          <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/50">
            <Lock className="h-3 w-3" />
            256-bit SSL encrypted · UPI · Cards · Net Banking · Wallets
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
