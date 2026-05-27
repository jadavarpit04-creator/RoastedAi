import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { isAdminRole, isAdminEmail } from '@/lib/plan-config'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'arpitjadav@gmail.com'

async function isAdmin(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, role: true },
  })
  // Check DB role first, then email-based checks (legacy + env)
  return isAdminRole(user?.role) || user?.email === ADMIN_EMAIL || isAdminEmail(user?.email)
}

// GET: Admin stats and data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'users': {
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
        const skip = (page - 1) * limit

        const [users, total] = await Promise.all([
          db.user.findMany({
            select: {
              id: true,
              name: true,
              email: true,
              plan: true,
              analysesUsed: true,
              createdAt: true,
              _count: {
                select: {
                  payments: true,
                  subscriptions: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          db.user.count(),
        ])

        return NextResponse.json({
          success: true,
          data: users,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      }

      case 'payments': {
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
        const skip = (page - 1) * limit

        const [payments, total] = await Promise.all([
          db.payment.findMany({
            include: {
              user: {
                select: { name: true, email: true },
              },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          db.payment.count(),
        ])

        return NextResponse.json({
          success: true,
          data: payments,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      }

      case 'refunds': {
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
        const skip = (page - 1) * limit

        const [refunds, total] = await Promise.all([
          db.payment.findMany({
            where: { status: 'refunded' },
            include: {
              user: {
                select: { name: true, email: true },
              },
            },
            orderBy: { updatedAt: 'desc' },
            skip,
            take: limit,
          }),
          db.payment.count({ where: { status: 'refunded' } }),
        ])

        return NextResponse.json({
          success: true,
          data: refunds,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      }

      default: {
        // Default: return admin stats
        const [
          totalRevenue,
          activeSubscriptions,
          failedPayments,
          refundCount,
          totalUsers,
          paidPayments,
        ] = await Promise.all([
          db.payment.aggregate({
            where: { status: 'paid' },
            _sum: { amount: true },
          }),
          db.subscription.count({ where: { status: 'active' } }),
          db.payment.count({ where: { status: 'failed' } }),
          db.payment.count({ where: { status: 'refunded' } }),
          db.user.count(),
          db.payment.findMany({
            where: { status: 'paid', billingCycle: 'monthly' },
            select: { amount: true },
          }),
        ])

        // Calculate MRR (Monthly Recurring Revenue)
        let mrr = 0
        for (const payment of paidPayments) {
          mrr += payment.amount
        }

        // Add yearly payments divided by 12
        const yearlyPayments = await db.payment.findMany({
          where: { status: 'paid', billingCycle: 'yearly' },
          select: { amount: true },
        })
        for (const payment of yearlyPayments) {
          mrr += Math.round(payment.amount / 12)
        }

        const revenue = totalRevenue._sum.amount || 0

        return NextResponse.json({
          success: true,
          data: {
            totalRevenue: revenue,
            mrr,
            activeSubscriptions,
            failedPayments,
            refundCount,
            totalUsers,
          },
        })
      }
    }
  } catch (error) {
    console.error('Admin billing error:', error)
    return NextResponse.json({ error: 'Failed to fetch admin data' }, { status: 500 })
  }
}

// POST: Admin actions
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 })
    }

    const body = await request.json()
    const { action, subscriptionId, paymentId, userId, reason } = body

    switch (action) {
      case 'suspend_subscription': {
        if (!subscriptionId) {
          return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 })
        }

        const subscription = await db.subscription.findUnique({
          where: { id: subscriptionId },
        })

        if (!subscription) {
          return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
        }

        await db.subscription.update({
          where: { id: subscriptionId },
          data: {
            status: 'paused',
            cancelledAt: new Date(),
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
              source: 'admin',
              adminId: session.user.id,
              subscriptionId,
              reason: reason || 'Admin suspended subscription',
            }),
            status: 'paused',
          },
        })

        return NextResponse.json({
          success: true,
          message: 'Subscription suspended successfully',
        })
      }

      case 'reactivate_subscription': {
        if (!subscriptionId) {
          return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 })
        }

        const subscription = await db.subscription.findUnique({
          where: { id: subscriptionId },
        })

        if (!subscription) {
          return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
        }

        await db.subscription.update({
          where: { id: subscriptionId },
          data: {
            status: 'active',
            cancelledAt: null,
            cancelAtPeriodEnd: false,
          },
        })

        // Restore user plan
        await db.user.update({
          where: { id: subscription.userId },
          data: { plan: subscription.plan },
        })

        await db.billingLog.create({
          data: {
            userId: subscription.userId,
            action: 'plan_changed',
            details: JSON.stringify({
              source: 'admin',
              adminId: session.user.id,
              subscriptionId,
              action: 'reactivated',
              plan: subscription.plan,
            }),
            status: 'active',
          },
        })

        return NextResponse.json({
          success: true,
          message: 'Subscription reactivated successfully',
        })
      }

      case 'approve_refund': {
        if (!paymentId) {
          return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 })
        }

        const payment = await db.payment.findUnique({
          where: { id: paymentId },
        })

        if (!payment) {
          return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
        }

        if (payment.status !== 'paid' && payment.status !== 'refunded') {
          return NextResponse.json(
            { error: 'Only paid payments can be refunded' },
            { status: 400 }
          )
        }

        // Process refund via Razorpay if keys available
        let razorpayRefundId: string | null = null
        if (
          process.env.RAZORPAY_KEY_ID &&
          process.env.RAZORPAY_KEY_SECRET &&
          payment.razorpayPaymentId
        ) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const Razorpay = require('razorpay')
            const razorpay = new Razorpay({
              key_id: process.env.RAZORPAY_KEY_ID,
              key_secret: process.env.RAZORPAY_KEY_SECRET,
            })

            const refundAmount =
              (payment.amount - payment.discountAmount + payment.gstAmount) * 100
            const refundResult = await razorpay.payments.refund(
              payment.razorpayPaymentId,
              {
                amount: refundAmount,
                notes: {
                  reason: reason || 'Admin approved refund',
                  approvedBy: session.user.id,
                },
              }
            )
            razorpayRefundId = refundResult.id
          } catch (refundError) {
            console.error('Razorpay refund error:', refundError)
            // Continue with DB update even if Razorpay fails
          }
        }

        // Update payment status
        await db.payment.update({
          where: { id: paymentId },
          data: { status: 'refunded' },
        })

        // Cancel associated subscription
        const subscription = await db.subscription.findFirst({
          where: {
            userId: payment.userId,
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

          await db.user.update({
            where: { id: payment.userId },
            data: { plan: 'free' },
          })
        }

        // Update invoice status
        if (payment.invoiceId) {
          await db.invoice.update({
            where: { id: payment.invoiceId },
            data: { status: 'cancelled' },
          })
        }

        await db.billingLog.create({
          data: {
            userId: payment.userId,
            action: 'refund_requested',
            details: JSON.stringify({
              source: 'admin',
              adminId: session.user.id,
              paymentId,
              amount: payment.amount,
              razorpayRefundId,
              reason: reason || 'Admin approved refund',
            }),
            amount: payment.amount,
            status: 'refunded',
          },
        })

        return NextResponse.json({
          success: true,
          message: 'Refund approved and processed',
          data: {
            razorpayRefundId,
          },
        })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Admin action error:', error)
    return NextResponse.json({ error: 'Failed to process admin action' }, { status: 500 })
  }
}
