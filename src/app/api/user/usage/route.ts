import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getPlanKey, getAnalysesPerDay, PLANS, isAdminEmail, isAdminRole, FEATURES, type PlanKey } from '@/lib/plan-config'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const userEmail = session.user.email

    // Get user plan and role
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { plan: true, analysesUsed: true, role: true },
    })

    // Check if user is admin — admins get all features unlocked
    // Checks both DB role and email (legacy fallback)
    const isUserAdmin = isAdminRole(user?.role) || isAdminEmail(userEmail)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const planKey = getPlanKey(user.plan)
    const planConfig = PLANS[planKey]
    const dailyLimit = getAnalysesPerDay(planKey)

    // Get today's usage from DailyUsage table (independent of report count)
    // This ensures deleting a report does NOT restore the daily usage count
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dailyUsage = await db.dailyUsage.findUnique({
      where: { userId_date: { userId, date: today } }
    })
    const analysesUsedToday = dailyUsage?.count ?? 0

    // Admin users get unlimited analyses and all features
    if (isUserAdmin) {
      const allFeatures: Record<string, boolean> = {}
      for (const key of Object.values(FEATURES)) {
        allFeatures[key] = true
      }

      // Get active subscription (for display purposes)
      const subscription = await db.subscription.findFirst({
        where: { userId, status: { in: ['active', 'trial'] } },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({
        plan: 'enterprise',
        planName: 'Admin',
        analysesPerDay: -1,
        analysesUsedToday,
        analysesRemaining: -1,
        isUnlimited: true,
        canAnalyze: true,
        features: allFeatures,
        subscription: subscription ? {
          id: subscription.id,
          plan: subscription.plan,
          status: subscription.status,
          billingCycle: subscription.billingCycle,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        } : null,
        isExpired: false,
        isAdmin: true,
      })
    }

    const analysesRemaining = dailyLimit === -1 ? -1 : Math.max(0, dailyLimit - analysesUsedToday)
    const isUnlimited = dailyLimit === -1
    const canAnalyze = isUnlimited || analysesUsedToday < dailyLimit

    // Get active subscription
    const subscription = await db.subscription.findFirst({
      where: {
        userId,
        status: { in: ['active', 'trial'] },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Check if subscription is expired
    let isExpired = false
    if (subscription?.currentPeriodEnd) {
      isExpired = new Date(subscription.currentPeriodEnd) < new Date()
    }

    // If subscription is expired, downgrade to free
    if (isExpired && planKey !== 'free') {
      await db.user.update({
        where: { id: userId },
        data: { plan: 'free' },
      })
      // Return free plan data
      const freeConfig = PLANS.free
      const freeLimit = getAnalysesPerDay('free')
      const freeRemaining = Math.max(0, freeLimit - analysesUsedToday)
      return NextResponse.json({
        plan: 'free',
        planName: freeConfig.name,
        analysesPerDay: freeLimit,
        analysesUsedToday,
        analysesRemaining: freeRemaining,
        isUnlimited: false,
        canAnalyze: analysesUsedToday < freeLimit,
        features: freeConfig.features,
        subscription: null,
        isExpired: true,
      })
    }

    return NextResponse.json({
      plan: planKey,
      planName: planConfig.name,
      analysesPerDay: dailyLimit,
      analysesUsedToday,
      analysesRemaining,
      isUnlimited,
      canAnalyze,
      features: planConfig.features,
      subscription: subscription ? {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        billingCycle: subscription.billingCycle,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      } : null,
      isExpired: false,
    })
  } catch (error) {
    console.error('Usage fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 })
  }
}
