import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

// Razorpay webhook handler for async payment events
// This handles events like payment.captured, payment.failed, order.paid, etc.

function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) {
    console.warn('RAZORPAY_WEBHOOK_SECRET not set — skipping webhook verification')
    return true // Allow in dev if no secret configured
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(signature, 'hex')
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(body)
    const { event: eventType, payload } = event

    console.log(`[Webhook] Received event: ${eventType}`)

    switch (eventType) {
      case 'payment.captured': {
        const paymentEntity = payload.payment.entity
        const orderId = paymentEntity.order_id
        const paymentId = paymentEntity.id

        if (!orderId) break

        // Find the payment record by Razorpay order ID
        const payment = await db.payment.findFirst({
          where: { razorpayOrderId: orderId },
        })

        if (payment && payment.status !== 'paid') {
          // Update payment status
          await db.payment.update({
            where: { id: payment.id },
            data: {
              razorpayPaymentId: paymentId,
              status: 'paid',
            },
          })

          // Update user plan
          await db.user.update({
            where: { id: payment.userId },
            data: { plan: payment.plan },
          })

          // Log
          await db.billingLog.create({
            data: {
              userId: payment.userId,
              action: 'payment_verified',
              details: JSON.stringify({
                source: 'webhook',
                eventType,
                razorpayPaymentId: paymentId,
                razorpayOrderId: orderId,
                plan: payment.plan,
              }),
              amount: payment.amount,
              status: 'paid',
            },
          })

          console.log(`[Webhook] Payment captured for order ${orderId}, plan ${payment.plan}`)
        }
        break
      }

      case 'payment.failed': {
        const paymentEntity = payload.payment.entity
        const orderId = paymentEntity.order_id

        if (!orderId) break

        const payment = await db.payment.findFirst({
          where: { razorpayOrderId: orderId },
        })

        if (payment && payment.status === 'created') {
          await db.payment.update({
            where: { id: payment.id },
            data: { status: 'failed' },
          })

          await db.billingLog.create({
            data: {
              userId: payment.userId,
              action: 'payment_verified',
              details: JSON.stringify({
                source: 'webhook',
                eventType,
                razorpayOrderId: orderId,
                errorCode: paymentEntity.error_code,
                errorDescription: paymentEntity.error_description,
              }),
              amount: payment.amount,
              status: 'failed',
            },
          })

          console.log(`[Webhook] Payment failed for order ${orderId}`)
        }
        break
      }

      case 'refund.processed': {
        const refundEntity = payload.refund.entity
        const paymentId = refundEntity.payment_id

        const payment = await db.payment.findFirst({
          where: { razorpayPaymentId: paymentId },
        })

        if (payment) {
          await db.payment.update({
            where: { id: payment.id },
            data: { status: 'refunded' },
          })

          // Cancel subscription
          const subscription = await db.subscription.findFirst({
            where: { userId: payment.userId, status: 'active' },
          })

          if (subscription) {
            await db.subscription.update({
              where: { id: subscription.id },
              data: {
                status: 'cancelled',
                cancelledAt: new Date(),
              },
            })

            await db.user.update({
              where: { id: payment.userId },
              data: { plan: 'free' },
            })
          }

          await db.billingLog.create({
            data: {
              userId: payment.userId,
              action: 'refund_requested',
              details: JSON.stringify({
                source: 'webhook',
                eventType,
                refundId: refundEntity.id,
                amount: refundEntity.amount,
              }),
              amount: payment.amount,
              status: 'refunded',
            },
          })

          console.log(`[Webhook] Refund processed for payment ${paymentId}`)
        }
        break
      }

      case 'subscription.cancelled': {
        const subEntity = payload.subscription.entity
        const subId = subEntity.id

        const subscription = await db.subscription.findFirst({
          where: { razorpaySubscriptionId: subId },
        })

        if (subscription) {
          await db.subscription.update({
            where: { id: subscription.id },
            data: {
              status: 'cancelled',
              cancelledAt: new Date(),
            },
          })

          await db.billingLog.create({
            data: {
              userId: subscription.userId,
              action: 'subscription_cancelled',
              details: JSON.stringify({
                source: 'webhook',
                subscriptionId: subId,
              }),
              status: 'cancelled',
            },
          })

          console.log(`[Webhook] Subscription cancelled: ${subId}`)
        }
        break
      }

      default:
        console.log(`[Webhook] Unhandled event: ${eventType}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Webhook] Error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
