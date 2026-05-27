import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

// Razorpay webhook handler - no auth required (uses signature verification)
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'webhook_secret'
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex')

    if (expectedSignature !== signature) {
      console.error('Webhook signature verification failed')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)
    const { event: eventType, payload } = event

    console.log(`Razorpay webhook received: ${eventType}`)

    switch (eventType) {
      case 'payment.captured': {
        const paymentEntity = payload.payment.entity
        const orderId = paymentEntity.order_id

        if (orderId) {
          const payment = await db.payment.findFirst({
            where: { razorpayOrderId: orderId },
          })

          if (payment && payment.status !== 'paid') {
            await db.payment.update({
              where: { id: payment.id },
              data: {
                status: 'paid',
                razorpayPaymentId: paymentEntity.id,
              },
            })

            // Update user plan
            await db.user.update({
              where: { id: payment.userId },
              data: { plan: payment.plan },
            })

            await db.billingLog.create({
              data: {
                userId: payment.userId,
                action: 'payment_verified',
                details: JSON.stringify({
                  source: 'webhook',
                  eventType,
                  razorpayPaymentId: paymentEntity.id,
                  amount: paymentEntity.amount / 100,
                }),
                amount: paymentEntity.amount / 100,
                status: 'paid',
              },
            })
          }
        }
        break
      }

      case 'payment.failed': {
        const failedPayment = payload.payment.entity
        const orderId = failedPayment.order_id

        if (orderId) {
          const payment = await db.payment.findFirst({
            where: { razorpayOrderId: orderId },
          })

          if (payment && payment.status !== 'paid') {
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
                  razorpayPaymentId: failedPayment.id,
                  errorCode: failedPayment.error_code,
                  errorDescription: failedPayment.error_description,
                }),
                amount: payment.amount,
                status: 'failed',
              },
            })
          }
        }
        break
      }

      case 'subscription.activated': {
        const subEntity = payload.subscription.entity
        const razorpaySubId = subEntity.id

        const subscription = await db.subscription.findFirst({
          where: { razorpaySubscriptionId: razorpaySubId },
        })

        if (subscription) {
          await db.subscription.update({
            where: { id: subscription.id },
            data: {
              status: 'active',
              currentPeriodStart: subEntity.current_start
                ? new Date(subEntity.current_start * 1000)
                : undefined,
              currentPeriodEnd: subEntity.current_end
                ? new Date(subEntity.current_end * 1000)
                : undefined,
            },
          })

          await db.billingLog.create({
            data: {
              userId: subscription.userId,
              action: 'subscription_created',
              details: JSON.stringify({
                source: 'webhook',
                eventType,
                razorpaySubscriptionId: razorpaySubId,
              }),
              status: 'active',
            },
          })
        }
        break
      }

      case 'subscription.cancelled': {
        const cancelledSub = payload.subscription.entity
        const razorpaySubId = cancelledSub.id

        const subscription = await db.subscription.findFirst({
          where: { razorpaySubscriptionId: razorpaySubId },
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
            where: { id: subscription.userId },
            data: { plan: 'free' },
          })

          await db.billingLog.create({
            data: {
              userId: subscription.userId,
              action: 'subscription_cancelled',
              details: JSON.stringify({
                source: 'webhook',
                eventType,
                razorpaySubscriptionId: razorpaySubId,
              }),
              status: 'cancelled',
            },
          })
        }
        break
      }

      case 'subscription.charged': {
        const chargedSub = payload.subscription.entity
        const razorpaySubId = chargedSub.id

        const subscription = await db.subscription.findFirst({
          where: { razorpaySubscriptionId: razorpaySubId },
        })

        if (subscription) {
          const periodEnd = chargedSub.current_end
            ? new Date(chargedSub.current_end * 1000)
            : null
          const periodStart = chargedSub.current_start
            ? new Date(chargedSub.current_start * 1000)
            : null
          const remainingDays = periodEnd
            ? Math.max(
                0,
                Math.ceil(
                  (periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                )
              )
            : null

          await db.subscription.update({
            where: { id: subscription.id },
            data: {
              status: 'active',
              currentPeriodStart: periodStart,
              currentPeriodEnd: periodEnd,
              remainingDays,
              nextBillingDate: periodEnd,
            },
          })

          await db.billingLog.create({
            data: {
              userId: subscription.userId,
              action: 'subscription_created',
              details: JSON.stringify({
                source: 'webhook',
                eventType,
                razorpaySubscriptionId: razorpaySubId,
                renewal: true,
              }),
              status: 'active',
            },
          })
        }
        break
      }

      case 'subscription.expired': {
        const expiredSub = payload.subscription.entity
        const razorpaySubId = expiredSub.id

        const subscription = await db.subscription.findFirst({
          where: { razorpaySubscriptionId: razorpaySubId },
        })

        if (subscription) {
          await db.subscription.update({
            where: { id: subscription.id },
            data: {
              status: 'expired',
            },
          })

          // Revert user to free plan
          await db.user.update({
            where: { id: subscription.userId },
            data: { plan: 'free' },
          })

          await db.billingLog.create({
            data: {
              userId: subscription.userId,
              action: 'subscription_cancelled',
              details: JSON.stringify({
                source: 'webhook',
                eventType,
                razorpaySubscriptionId: razorpaySubId,
                reason: 'expired',
              }),
              status: 'expired',
            },
          })
        }
        break
      }

      default:
        console.log(`Unhandled webhook event: ${eventType}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
