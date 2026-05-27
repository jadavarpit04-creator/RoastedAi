import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { randomBytes } from 'crypto'
import { fetchWebsiteContent, analyzeWebsite } from '@/lib/ai-service'
import { isAdminEmail, isAdminRole } from '@/lib/plan-config'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const apiKeys = await db.apiKey.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        prefix: true,
        lastUsedAt: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: apiKeys })
  } catch (error) {
    console.error('API keys fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, role: true },
    })

    if (!user || (user.plan === 'free' && !isAdminRole(user.role) && !isAdminEmail(session.user?.email))) {
      return NextResponse.json(
        { error: 'API access requires a Pro or Team plan. Please upgrade to access the API.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const name = body.name || 'API Key'

    const randomString = randomBytes(24).toString('hex')
    const key = `rmai_${randomString}`
    const prefix = key.substring(0, 8)

    const apiKey = await db.apiKey.create({
      data: { name, key, prefix, userId: session.user.id },
    })

    return NextResponse.json({
      success: true,
      data: { id: apiKey.id, name: apiKey.name, key, prefix: apiKey.prefix, createdAt: apiKey.createdAt },
    })
  } catch (error) {
    console.error('API key creation error:', error)
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'API key ID is required' }, { status: 400 })
    }

    const apiKey = await db.apiKey.findUnique({ where: { id } })
    if (!apiKey || apiKey.userId !== session.user.id) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    await db.apiKey.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API key deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 })
  }
}

// PUT handles public API access (v1/analyze equivalent)
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing Authorization header. Use: Bearer rmai_xxx' }, { status: 401 })
    }

    const key = authHeader.substring(7)
    const apiKey = await db.apiKey.findUnique({ where: { key }, include: { user: true } })

    if (!apiKey || !apiKey.isActive) {
      return NextResponse.json({ error: 'Invalid or revoked API key' }, { status: 401 })
    }

    if (apiKey.user.plan === 'free' && !isAdminRole(apiKey.user.role) && !isAdminEmail(apiKey.user.email)) {
      return NextResponse.json({ error: 'API access requires active Pro or Team subscription' }, { status: 403 })
    }

    const body = await request.json()
    const { url, roastMode = 'professional' } = body

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    let parsedUrl: URL
    try { parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`) } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    // Only use root domain — strip paths, query strings, and hashes
    const validUrl = `https://${parsedUrl.hostname}`
    const domain = parsedUrl.hostname
    const userId = apiKey.user.id

    // Check API rate limit using DailyUsage (independent of report count)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dailyUsage = await db.dailyUsage.findUnique({
      where: { userId_date: { userId, date: today } }
    })
    const apiUsageToday = dailyUsage?.apiCount ?? 0
    const userPlan = apiKey.user.plan
    const limit = userPlan === 'enterprise' ? 10000 : 100
    if (apiUsageToday >= limit) {
      return NextResponse.json({ error: `API rate limit reached (${limit}/day)` }, { status: 429 })
    }

    await db.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })

    const websiteContent = await fetchWebsiteContent(validUrl)
    const analysis = await analyzeWebsite(validUrl, websiteContent.html, websiteContent.title, roastMode as 'professional' | 'savage')

    const report = await db.report.create({
      data: {
        url: validUrl, domain, overallScore: analysis.overallScore, uiuxScore: analysis.uiux.score, seoScore: analysis.seo.score, accessibilityScore: analysis.accessibility.score, performanceScore: analysis.performance.score, mobileScore: analysis.mobile.score, designScore: analysis.design.score, conversionScore: analysis.conversion.score, roastMode, roast: analysis.roast, finalVerdict: analysis.finalVerdict, aiResponse: JSON.stringify(analysis), uiuxIssues: JSON.stringify(analysis.uiux.issues), uiuxSuggestions: JSON.stringify(analysis.uiux.suggestions), seoIssues: JSON.stringify(analysis.seo.issues), seoSuggestions: JSON.stringify(analysis.seo.suggestions), accessibilityIssues: JSON.stringify(analysis.accessibility.issues), accessibilitySuggestions: JSON.stringify(analysis.accessibility.suggestions), performanceIssues: JSON.stringify(analysis.performance.issues), performanceSuggestions: JSON.stringify(analysis.performance.suggestions), mobileIssues: JSON.stringify(analysis.mobile.issues), mobileSuggestions: JSON.stringify(analysis.mobile.suggestions), designIssues: JSON.stringify(analysis.design.issues), designSuggestions: JSON.stringify(analysis.design.suggestions), conversionIssues: JSON.stringify(analysis.conversion.issues), conversionSuggestions: JSON.stringify(analysis.conversion.suggestions), userId,
      }
    })

    await db.user.update({ where: { id: userId }, data: { analysesUsed: { increment: 1 } } })

    // Increment API usage counter in DailyUsage (never decremented on report delete)
    await db.dailyUsage.upsert({
      where: { userId_date: { userId, date: today } },
      update: { apiCount: { increment: 1 } },
      create: { userId, date: today, count: 0, apiCount: 1 },
    })

    return NextResponse.json({
      success: true, reportId: report.id, data: analysis,
      website: { title: websiteContent.title, url: validUrl, domain },
      meta: { plan: apiKey.user.plan, usageToday: apiUsageToday + 1, dailyLimit: limit },
    })
  } catch (error) {
    console.error('API analysis error:', error)
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
