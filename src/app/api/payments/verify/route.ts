import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import crypto from 'crypto'

// Helper: generate sequential invoice number
async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const lastInvoice = await db.invoice.findFirst({
    where: {
      invoiceNumber: {
        startsWith: `INV-${year}-`,
      },
    },
    orderBy: { invoiceNumber: 'desc' },
  })

  let nextSeq = 1
  if (lastInvoice) {
    const parts = lastInvoice.invoiceNumber.split('-')
    const lastSeq = parseInt(parts[parts.length - 1], 10)
    if (!isNaN(lastSeq)) {
      nextSeq = lastSeq + 1
    }
  }

  return `INV-${year}-${String(nextSeq).padStart(4, '0')}`
}

// Helper: get billing period string
function getBillingPeriod(billingCycle: string): string {
  const now = new Date()
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  if (billingCycle === 'yearly') {
    return `${now.getFullYear()}`
  }
  return `${monthNames[now.getMonth()]} ${now.getFullYear()}`
}

// Helper: calculate period end date
function getPeriodEnd(billingCycle: string): Date {
  const now = new Date()
  if (billingCycle === 'yearly') {
    const end = new Date(now)
    end.setFullYear(end.getFullYear() + 1)
    return end
  }
  const end = new Date(now)
  end.setMonth(end.getMonth() + 1)
  return end
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment verification details' }, { status: 400 })
    }

    // Find the payment record
    const payment = await db.payment.findFirst({
      where: { razorpayOrderId: razorpay_order_id, userId: session.user.id },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 })
    }

    if (payment.status === 'paid') {
      return NextResponse.json({ error: 'Payment already verified' }, { status: 400 })
    }

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET!
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      // Mark payment as failed
      await db.payment.update({
        where: { id: payment.id },
        data: { status: 'failed' },
      })

      await db.billingLog.create({
        data: {
          userId: session.user.id,
          action: 'payment_verified',
          details: JSON.stringify({
            paymentId: payment.id,
            razorpayOrderId: razorpay_order_id,
            reason: 'signature_mismatch',
          }),
          amount: payment.amount,
          status: 'failed',
        },
      })

      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 })
    }

    const billingCycle = payment.billingCycle || 'monthly'
    const periodStart = new Date()
    const periodEnd = getPeriodEnd(billingCycle)
    const remainingDays = Math.ceil(
      (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber()

    // Total amount (no GST, no discount — price is the total)
    const totalAmount = payment.amount

    // Create invoice
    const invoice = await db.invoice.create({
      data: {
        userId: session.user.id,
        invoiceNumber,
        paymentId: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        gstAmount: 0,
        gstRate: 0,
        taxInclusive: true,
        totalAmount,
        status: 'paid',
        plan: payment.plan,
        billingCycle,
        billingPeriod: getBillingPeriod(billingCycle),
        paidAt: new Date(),
      },
    })

    // Payment verified — update payment record
    await db.payment.update({
      where: { id: payment.id },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: 'paid',
        invoiceId: invoice.id,
      },
    })

    // Create or update subscription
    const existingSubscription = await db.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ['active', 'trial'] },
      },
    })

    if (existingSubscription) {
      // Update existing subscription
      await db.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          plan: payment.plan,
          billingCycle,
          status: 'active',
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
          cancelledAt: null,
          remainingDays,
          nextBillingDate: periodEnd,
        },
      })
    } else {
      // Create new subscription
      await db.subscription.create({
        data: {
          userId: session.user.id,
          plan: payment.plan,
          billingCycle,
          status: 'active',
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          remainingDays,
          nextBillingDate: periodEnd,
        },
      })
    }

    // Update user plan
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: { plan: payment.plan },
    })

    // Log to BillingLog
    await db.billingLog.create({
      data: {
        userId: session.user.id,
        action: 'payment_verified',
        details: JSON.stringify({
          paymentId: payment.id,
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          plan: payment.plan,
          billingCycle,
          amount: payment.amount,
          totalAmount,
          invoiceNumber,
        }),
        amount: totalAmount,
        status: 'paid',
      },
    })

    // Log invoice generation
    await db.billingLog.create({
      data: {
        userId: session.user.id,
        action: 'invoice_generated',
        details: JSON.stringify({
          invoiceId: invoice.id,
          invoiceNumber,
          amount: payment.amount,
          totalAmount,
        }),
        amount: totalAmount,
        status: 'paid',
      },
    })

    // Log subscription creation
    await db.billingLog.create({
      data: {
        userId: session.user.id,
        action: 'subscription_created',
        details: JSON.stringify({
          plan: payment.plan,
          billingCycle,
          periodStart: periodStart.toISOString(),
          periodEnd: periodEnd.toISOString(),
        }),
        amount: totalAmount,
        status: 'active',
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        plan: updatedUser.plan,
        billingCycle,
        invoiceNumber,
        periodEnd: periodEnd.toISOString(),
        message: `Successfully upgraded to ${payment.plan} plan!`,
      },
    })
  } catch (error) {
    console.error('Verify payment error:', error)
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 })
  }
}
