import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// Plan pricing in INR (rupees)
const PLAN_PRICES: Record<string, Record<string, number>> = {
  starter: { monthly: 499, yearly: 4990 },
  pro: { monthly: 1499, yearly: 14990 },
  enterprise: { monthly: 4999, yearly: 49990 },
}

const GST_RATE = 18

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code, plan, billingCycle } = body

    if (!code) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 })
    }

    // Find coupon
    const coupon = await db.coupon.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (!coupon) {
      return NextResponse.json({
        success: false,
        error: 'Invalid coupon code',
      }, { status: 400 })
    }

    // Validate coupon
    const now = new Date()
    const errors: string[] = []

    if (!coupon.isActive) {
      errors.push('This coupon is no longer active')
    }

    if (coupon.validFrom > now) {
      errors.push('This coupon is not yet valid')
    }

    if (coupon.validUntil && coupon.validUntil < now) {
      errors.push('This coupon has expired')
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      errors.push('This coupon has reached its usage limit')
    }

    // Check plan applicability
    if (plan && coupon.applicablePlans && coupon.applicablePlans !== 'all') {
      const applicablePlans = coupon.applicablePlans.split(',').map((p) => p.trim())
      if (!applicablePlans.includes(plan)) {
        errors.push(`This coupon is not applicable for the ${plan} plan`)
      }
    }

    // Check minimum amount
    if (plan && billingCycle && coupon.minAmount) {
      const planPrice = PLAN_PRICES[plan]?.[billingCycle] || 0
      if (planPrice < coupon.minAmount) {
        errors.push(`Minimum order amount of ₹${coupon.minAmount} required for this coupon`)
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: errors.join('. '),
      }, { status: 400 })
    }

    // Calculate discount
    let discountAmount = 0
    let finalPrice = 0
    let baseAmount = 0

    if (plan && billingCycle && PLAN_PRICES[plan]?.[billingCycle]) {
      baseAmount = PLAN_PRICES[plan][billingCycle]

      if (coupon.discountType === 'percentage') {
        discountAmount = Math.round(baseAmount * (coupon.discountValue / 100))
        if (coupon.maxDiscount) {
          discountAmount = Math.min(discountAmount, coupon.maxDiscount)
        }
      } else {
        // Fixed discount
        discountAmount = Math.min(coupon.discountValue, baseAmount)
      }

      const subtotalAfterDiscount = baseAmount - discountAmount
      const gstAmount = Math.round(subtotalAfterDiscount * (GST_RATE / 100))
      finalPrice = subtotalAfterDiscount + gstAmount
    }

    return NextResponse.json({
      success: true,
      data: {
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscount: coupon.maxDiscount,
        discountAmount,
        baseAmount,
        gstRate: GST_RATE,
        finalPrice,
        remainingUses: coupon.maxUses ? coupon.maxUses - coupon.usedCount : null,
      },
    })
  } catch (error) {
    console.error('Coupon validation error:', error)
    return NextResponse.json({ error: 'Failed to validate coupon' }, { status: 500 })
  }
}
