import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, analysesUsed: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      plan: user.plan,
      analysesUsed: user.analysesUsed,
    })
  } catch (error) {
    console.error('Stats fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}

// Plan upgrade endpoint (POST) - only via verified Razorpay payment OR active subscription
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { plan } = body

    if (!plan || !['starter', 'pro', 'enterprise'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Choose starter, pro, or enterprise.' },
        { status: 400 }
      )
    }

    // Check if user has a verified payment for this plan
    const paidPayment = await db.payment.findFirst({
      where: {
        userId: session.user.id,
        plan: plan,
        status: 'paid',
      },
      orderBy: { createdAt: 'desc' },
    })

    // Also check for an active subscription for this plan
    const activeSubscription = await db.subscription.findFirst({
      where: {
        userId: session.user.id,
        plan: plan,
        status: { in: ['active', 'trial'] },
      },
    })

    if (!paidPayment && !activeSubscription) {
      return NextResponse.json(
        {
          error:
            'Payment verification required. Please complete payment via Razorpay or have an active subscription.',
        },
        { status: 403 }
      )
    }

    const user = await db.user.update({
      where: { id: session.user.id },
      data: { plan },
    })

    return NextResponse.json({
      success: true,
      data: {
        plan: user.plan,
        message: `Successfully upgraded to ${plan} plan!`,
      },
    })
  } catch (error) {
    console.error('Plan upgrade error:', error)
    return NextResponse.json({ error: 'Failed to upgrade plan' }, { status: 500 })
  }
}
