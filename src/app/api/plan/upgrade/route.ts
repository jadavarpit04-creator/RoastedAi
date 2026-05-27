import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { plan } = body

    if (!plan || !['pro', 'team'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan. Choose "pro" or "team".' }, { status: 400 })
    }

    // In production, this would integrate with Stripe/payment provider
    // For now, we simulate the upgrade by updating the user's plan directly
    const user = await db.user.update({
      where: { id: session.user.id },
      data: { plan },
    })

    return NextResponse.json({
      success: true,
      data: {
        plan: user.plan,
        message: `Successfully upgraded to ${plan === 'pro' ? 'Pro' : 'Team'} plan!`,
      },
    })
  } catch (error) {
    console.error('Plan upgrade error:', error)
    return NextResponse.json({ error: 'Failed to upgrade plan' }, { status: 500 })
  }
}
