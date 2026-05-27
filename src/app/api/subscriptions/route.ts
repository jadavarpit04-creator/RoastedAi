import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET: Get user's current active subscription
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscription = await db.subscription.findFirst({
      where: {
        userId: session.user.id,
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!subscription) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No active subscription found',
      })
    }

    // Calculate remaining days
    let remainingDays = subscription.remainingDays
    if (subscription.currentPeriodEnd) {
      remainingDays = Math.max(
        0,
        Math.ceil(
          (new Date(subscription.currentPeriodEnd).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...subscription,
        remainingDays,
      },
    })
  } catch (error) {
    console.error('Get subscription error:', error)
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 })
  }
}

// POST: Cancel subscription (set cancelAtPeriodEnd=true)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reason } = body

    const subscription = await db.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ['active', 'trial'] },
        cancelAtPeriodEnd: false,
      },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription to cancel' },
        { status: 404 }
      )
    }

    // Cancel at period end
    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
        cancelledAt: new Date(),
      },
    })

    // Log to BillingLog
    await db.billingLog.create({
      data: {
        userId: session.user.id,
        action: 'subscription_cancelled',
        details: JSON.stringify({
          subscriptionId: subscription.id,
          plan: subscription.plan,
          billingCycle: subscription.billingCycle,
          reason: reason || 'User requested cancellation',
          cancelAtPeriodEnd: true,
          periodEnd: subscription.currentPeriodEnd,
        }),
        amount: 0,
        status: 'cancelling',
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        plan: subscription.plan,
        status: 'cancelling',
        cancelAtPeriodEnd: true,
        currentPeriodEnd: subscription.currentPeriodEnd,
        message: 'Subscription will be cancelled at the end of the current billing period.',
      },
    })
  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 })
  }
}

// PUT: Resume/renew cancelled subscription
export async function PUT() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscription = await db.subscription.findFirst({
      where: {
        userId: session.user.id,
        cancelAtPeriodEnd: true,
        status: { in: ['active', 'trial'] },
      },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'No cancelled subscription to resume' },
        { status: 404 }
      )
    }

    // Resume subscription
    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: false,
        cancelledAt: null,
      },
    })

    // Log to BillingLog
    await db.billingLog.create({
      data: {
        userId: session.user.id,
        action: 'plan_changed',
        details: JSON.stringify({
          subscriptionId: subscription.id,
          plan: subscription.plan,
          action: 'resumed',
        }),
        amount: 0,
        status: 'active',
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        plan: subscription.plan,
        status: 'active',
        cancelAtPeriodEnd: false,
        message: 'Subscription has been resumed successfully.',
      },
    })
  } catch (error) {
    console.error('Resume subscription error:', error)
    return NextResponse.json({ error: 'Failed to resume subscription' }, { status: 500 })
  }
}
