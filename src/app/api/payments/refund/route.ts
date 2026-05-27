import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

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
    const { paymentId, reason } = body

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 })
    }

    // Find the payment
    const payment = await db.payment.findFirst({
      where: {
        id: paymentId,
        userId: session.user.id,
        status: 'paid',
      },
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Paid payment not found' },
        { status: 404 }
      )
    }

    if (!payment.razorpayPaymentId) {
      return NextResponse.json(
        { error: 'No Razorpay payment ID found for this payment' },
        { status: 400 }
      )
    }

    // Process refund via Razorpay
    let refundResult: { id: string; status: string } | null = null

    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      try {
        const razorpay = getRazorpayInstance()
        // Calculate refund amount (full amount with GST)
        const refundAmount = (payment.amount - payment.discountAmount + payment.gstAmount) * 100

        refundResult = await razorpay.payments.refund(payment.razorpayPaymentId, {
          amount: refundAmount,
          notes: {
            reason: reason || 'Customer requested refund',
            paymentId: payment.id,
            userId: session.user.id,
          },
        })
      } catch (refundError) {
        console.error('Razorpay refund error:', refundError)
        return NextResponse.json(
          { error: 'Failed to process refund with payment gateway' },
          { status: 500 }
        )
      }
    }

    // Update payment status
    await db.payment.update({
      where: { id: payment.id },
      data: { status: 'refunded' },
    })

    // Cancel subscription if exists
    const subscription = await db.subscription.findFirst({
      where: {
        userId: session.user.id,
        plan: payment.plan,
        status: 'active',
      },
    })

    if (subscription) {
      await db.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelAtPeriodEnd: false,
        },
      })

      // Revert user to free plan
      await db.user.update({
        where: { id: session.user.id },
        data: { plan: 'free' },
      })
    }

    // Update invoice status if exists
    if (payment.invoiceId) {
      await db.invoice.update({
        where: { id: payment.invoiceId },
        data: { status: 'cancelled' },
      })
    }

    // Log to BillingLog
    await db.billingLog.create({
      data: {
        userId: session.user.id,
        action: 'refund_requested',
        details: JSON.stringify({
          paymentId: payment.id,
          razorpayPaymentId: payment.razorpayPaymentId,
          amount: payment.amount,
          gstAmount: payment.gstAmount,
          discountAmount: payment.discountAmount,
          reason: reason || 'Customer requested refund',
          razorpayRefundId: refundResult?.id || null,
          subscriptionCancelled: !!subscription,
        }),
        amount: payment.amount,
        status: 'refunded',
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        status: 'refunded',
        refundAmount: payment.amount - payment.discountAmount + payment.gstAmount,
        razorpayRefundId: refundResult?.id || null,
        subscriptionCancelled: !!subscription,
      },
    })
  } catch (error) {
    console.error('Refund error:', error)
    return NextResponse.json({ error: 'Failed to process refund' }, { status: 500 })
  }
}
