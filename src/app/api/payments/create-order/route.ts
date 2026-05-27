import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// Plan pricing in INR (rupees) — tax inclusive, no GST/coupon
const PLAN_PRICES: Record<string, Record<string, number>> = {
  starter: { monthly: 499, yearly: 4990 },
  pro: { monthly: 1499, yearly: 14990 },
  enterprise: { monthly: 4999, yearly: 49990 },
}

function getRazorpayInstance() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Razorpay = require('razorpay')
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  })
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { plan, billingCycle } = body

    // Validate plan
    if (!plan || !PLAN_PRICES[plan]) {
      return NextResponse.json(
        { error: 'Invalid plan. Choose starter, pro, or enterprise.' },
        { status: 400 }
      )
    }

    // Validate billing cycle
    if (!billingCycle || !['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json(
        { error: 'Invalid billing cycle. Choose monthly or yearly.' },
        { status: 400 }
      )
    }

    const totalAmount = PLAN_PRICES[plan][billingCycle]
    if (!totalAmount) {
      return NextResponse.json({ error: 'Invalid plan pricing' }, { status: 400 })
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 })
    }

    const razorpay = getRazorpayInstance()

    // Create Razorpay order (amount in paise)
    const order = await razorpay.orders.create({
      amount: totalAmount * 100,
      currency: 'INR',
      receipt: `rcpt_${plan}_${billingCycle}_${Date.now()}`,
      notes: {
        userId: session.user.id,
        plan: plan,
        billingCycle: billingCycle,
        email: session.user.email || '',
      },
    })

    // Save payment record in DB
    const payment = await db.payment.create({
      data: {
        userId: session.user.id,
        razorpayOrderId: order.id,
        amount: totalAmount,
        currency: 'INR',
        plan: plan,
        billingCycle: billingCycle,
        status: 'created',
        gstAmount: 0,
        gstRate: 0,
        discountAmount: 0,
      },
    })

    // Log to BillingLog
    await db.billingLog.create({
      data: {
        userId: session.user.id,
        action: 'payment_created',
        details: JSON.stringify({
          paymentId: payment.id,
          razorpayOrderId: order.id,
          plan,
          billingCycle,
          totalAmount,
        }),
        amount: totalAmount,
        status: 'created',
      },
    })

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      pricing: {
        baseAmount: totalAmount,
        totalAmount,
      },
      key: process.env.RAZORPAY_KEY_ID,
      prefill: {
        name: session.user.name || '',
        email: session.user.email || '',
      },
    })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 })
  }
}
