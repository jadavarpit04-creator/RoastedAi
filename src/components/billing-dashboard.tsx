'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  CreditCard, Clock, CheckCircle2, XCircle, AlertTriangle,
  Calendar, Receipt, RefreshCw, Shield, Loader2,
  ChevronRight, IndianRupee, Zap, Crown, Building2, FileText, ArrowLeft, Hourglass
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useAnalysisStore } from '@/hooks/use-analysis-store'

interface Payment {
  id: string
  razorpayOrderId: string
  razorpayPaymentId: string | null
  amount: number
  currency: string
  plan: string
  billingCycle: string
  status: string
  gstAmount: number
  discountAmount: number
  couponCode: string | null
  createdAt: string
}

interface Subscription {
  id: string
  plan: string
  status: string
  billingCycle: string
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  remainingDays: number | null
  nextBillingDate: string | null
  trialEnd: string | null
}

interface Invoice {
  id: string
  invoiceNumber: string
  amount: number
  totalAmount: number
  gstAmount: number
  currency: string
  plan: string
  billingCycle: string
  billingPeriod: string
  status: string
  paidAt: string | null
  createdAt: string
}

const PLAN_ICONS: Record<string, React.ElementType> = {
  free: Zap,
  starter: Shield,
  pro: Crown,
  enterprise: Building2,
}

const PLAN_NAMES: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function getRemainingTime(endDate: string): { days: number; hours: number; minutes: number; text: string } {
  const now = new Date().getTime()
  const end = new Date(endDate).getTime()
  const diff = end - now

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, text: 'Expired' }
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  const parts: string[] = []
  if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`)
  if (hours > 0) parts.push(`${hours} hr${hours !== 1 ? 's' : ''}`)
  if (minutes > 0) parts.push(`${minutes} min${minutes !== 1 ? 's' : ''}`)

  return { days, hours, minutes, text: parts.join(' ') || 'Less than a minute' }
}

export function BillingDashboard() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const { setView } = useAnalysisStore()
  const [tab, setTab] = useState<'overview' | 'history' | 'invoices'>('overview')
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [invoiceDetail, setInvoiceDetail] = useState<Invoice | null>(null)
  const [remainingTime, setRemainingTime] = useState<{ days: number; hours: number; minutes: number; text: string } | null>(null)

  const currentPlan = session?.user?.plan || 'free'
  const PlanIcon = PLAN_ICONS[currentPlan] || Zap

  // Get the most recent successful payment
  const lastPaidPayment = payments.find(p => p.status === 'paid')

  // Get purchase date from subscription or most recent successful payment
  const purchaseDate = subscription?.currentPeriodStart || lastPaidPayment?.createdAt || null
  
  // Get period end date from subscription, or compute from payment date + billing cycle
  const periodEnd = (() => {
    if (subscription?.currentPeriodEnd) return subscription.currentPeriodEnd
    if (lastPaidPayment && currentPlan !== 'free') {
      const startDate = new Date(lastPaidPayment.createdAt)
      const cycle = subscription?.billingCycle || lastPaidPayment.billingCycle || 'monthly'
      const endDate = new Date(startDate)
      if (cycle === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1)
      } else {
        endDate.setMonth(endDate.getMonth() + 1)
      }
      return endDate.toISOString()
    }
    return null
  })()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [subRes, payRes, invRes] = await Promise.all([
        fetch('/api/subscriptions'),
        fetch('/api/payments/history?limit=20'),
        fetch('/api/invoices?limit=20'),
      ])

      const subData = await subRes.json()
      if (subData.success && subData.data) setSubscription(subData.data)

      const payData = await payRes.json()
      if (payData.success) setPayments(payData.data)

      const invData = await invRes.json()
      if (invData.success) setInvoices(invData.data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session?.user) fetchData()
  }, [session, fetchData])

  // Update remaining time every minute
  useEffect(() => {
    if (!periodEnd || currentPlan === 'free') {
      setRemainingTime(null)
      return
    }

    const update = () => {
      setRemainingTime(getRemainingTime(periodEnd))
    }
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [periodEnd, currentPlan])

  const statusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
      paid: { bg: 'bg-green-500/15', text: 'text-green-400', icon: CheckCircle2 },
      created: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', icon: Clock },
      failed: { bg: 'bg-red-500/15', text: 'text-red-400', icon: XCircle },
      refunded: { bg: 'bg-orange-500/15', text: 'text-orange-400', icon: RefreshCw },
      active: { bg: 'bg-green-500/15', text: 'text-green-400', icon: CheckCircle2 },
      cancelled: { bg: 'bg-red-500/15', text: 'text-red-400', icon: XCircle },
      paused: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', icon: Clock },
      trial: { bg: 'bg-purple-500/15', text: 'text-purple-400', icon: Zap },
      draft: { bg: 'bg-gray-500/15', text: 'text-gray-400', icon: FileText },
      overdue: { bg: 'bg-red-500/15', text: 'text-red-400', icon: AlertTriangle },
    }
    const c = config[status] || config.created
    const Icon = c.icon
    return (
      <Badge className={`${c.bg} ${c.text} border-0 text-[10px] gap-1`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pt-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <button
          onClick={() => setView('landing')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 -ml-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <CreditCard className="h-6 w-6 text-purple-500" />
          Billing & Subscription
        </h1>
        <p className="text-muted-foreground mt-1">Manage your subscription, payments, and invoices</p>
      </motion.div>

      {/* Current Plan Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border dark:border-white/10 border-border dark:bg-white/[0.02] bg-card p-6 mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/25 shrink-0">
              <PlanIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">{PLAN_NAMES[currentPlan]} Plan</h2>
                {statusBadge(subscription?.status || (currentPlan !== 'free' ? 'active' : 'active'))}
              </div>
              <div className="flex flex-col gap-1.5 mt-1.5">
                {currentPlan !== 'free' && (subscription?.billingCycle || lastPaidPayment?.billingCycle) && (
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <IndianRupee className="h-3 w-3" />
                      {(subscription?.billingCycle || lastPaidPayment?.billingCycle) === 'yearly' ? 'Yearly' : 'Monthly'} billing
                    </span>
                  </div>
                )}
                {purchaseDate && (
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Purchased on {formatDateTime(purchaseDate)}
                    </span>
                  </div>
                )}
                {periodEnd && currentPlan !== 'free' && (
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {subscription?.cancelAtPeriodEnd ? 'Ends' : 'Renews'} on {formatDate(periodEnd)}
                    </span>
                  </div>
                )}
                {currentPlan === 'free' && (
                  <p className="text-xs text-muted-foreground mt-1">3 analyses per day · Basic features · Upgrade to unlock more</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Remaining time bar for paid plans */}
        {currentPlan !== 'free' && periodEnd && remainingTime && (
          <div className="mt-5 rounded-xl border dark:border-white/10 border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Hourglass className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-medium text-foreground">Time Remaining</span>
              </div>
              <span className={`text-sm font-bold ${
                remainingTime.days <= 3 ? 'text-red-400' :
                remainingTime.days <= 7 ? 'text-amber-400' :
                'text-green-400'
              }`}>
                {remainingTime.text}
              </span>
            </div>
            {/* Progress bar */}
            {purchaseDate && (
              (() => {
                const start = new Date(purchaseDate).getTime()
                const end = new Date(periodEnd).getTime()
                const now = Date.now()
                const totalDuration = end - start
                const elapsed = now - start
                const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))
                const isExpiringSoon = remainingTime.days <= 7

                return (
                  <div className="w-full h-2 rounded-full dark:bg-white/5 bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        isExpiringSoon
                          ? 'bg-gradient-to-r from-red-500 to-amber-500'
                          : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )
              })()
            )}
            {subscription?.cancelAtPeriodEnd && (
              <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Subscription will not renew at end of period
              </p>
            )}
          </div>
        )}
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex gap-1 mb-6 rounded-xl dark:bg-white/5 bg-muted p-1"
      >
        {(['overview', 'history', 'invoices'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              tab === t
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'overview' ? 'Overview' : t === 'history' ? 'Payment History' : 'Invoices'}
          </button>
        ))}
      </motion.div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border dark:border-white/10 border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <IndianRupee className="h-3.5 w-3.5" /> Total Spent
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatINR(payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0))}
            </p>
          </div>
          <div className="rounded-xl border dark:border-white/10 border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <Receipt className="h-3.5 w-3.5" /> Total Invoices
            </div>
            <p className="text-2xl font-bold text-foreground">{invoices.length}</p>
          </div>
          <div className="rounded-xl border dark:border-white/10 border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <CreditCard className="h-3.5 w-3.5" /> Successful Payments
            </div>
            <p className="text-2xl font-bold text-foreground">
              {payments.filter(p => p.status === 'paid').length}
            </p>
          </div>
        </motion.div>
      )}

      {tab === 'history' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {payments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No payment history yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-xl border dark:border-white/10 border-border p-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      payment.status === 'paid' ? 'bg-green-500/15' :
                      payment.status === 'failed' ? 'bg-red-500/15' :
                      'bg-yellow-500/15'
                    }`}>
                      {payment.status === 'paid' ? <CheckCircle2 className="h-4 w-4 text-green-400" /> :
                       payment.status === 'failed' ? <XCircle className="h-4 w-4 text-red-400" /> :
                       <Clock className="h-4 w-4 text-yellow-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {PLAN_NAMES[payment.plan] || payment.plan} Plan
                        <span className="text-muted-foreground font-normal"> · {payment.billingCycle}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(payment.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {statusBadge(payment.status)}
                    <span className="text-sm font-semibold text-foreground">{formatINR(payment.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {tab === 'invoices' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {invoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No invoices yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {invoices.map((invoice) => (
                <button
                  key={invoice.id}
                  onClick={() => setInvoiceDetail(invoice)}
                  className="w-full flex items-center justify-between rounded-xl border dark:border-white/10 border-border p-4 hover:bg-white/[0.02] transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/15">
                      <FileText className="h-4 w-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {invoice.billingPeriod} · {PLAN_NAMES[invoice.plan]} Plan
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {statusBadge(invoice.status)}
                    <span className="text-sm font-semibold text-foreground">{formatINR(invoice.totalAmount)}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Invoice detail dialog */}
      <Dialog open={!!invoiceDetail} onOpenChange={() => setInvoiceDetail(null)}>
        <DialogContent className="sm:max-w-[450px] dark:border-white/10 border-border dark:bg-[#0a0a0f] bg-background">
          {invoiceDetail && (
            <>
              <DialogHeader>
                <DialogTitle className="text-foreground flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-400" />
                  {invoiceDetail.invoiceNumber}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Invoice for {invoiceDetail.billingPeriod}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="text-foreground font-medium">{PLAN_NAMES[invoiceDetail.plan]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Billing Cycle</span>
                  <span className="text-foreground">{invoiceDetail.billingCycle}</span>
                </div>
                <div className="border-t dark:border-white/10 border-border pt-3 flex justify-between">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-bold text-foreground text-lg">{formatINR(invoiceDetail.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  {statusBadge(invoiceDetail.status)}
                </div>
                {invoiceDetail.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid On</span>
                    <span className="text-foreground">{formatDate(invoiceDetail.paidAt)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="text-foreground">{formatDate(invoiceDetail.createdAt)}</span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
