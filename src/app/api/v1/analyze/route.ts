import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { fetchWebsiteContent, analyzeWebsite } from '@/lib/ai-service'

// Public API endpoint - authenticates via API key
export async function POST(request: NextRequest) {
  try {
    // Extract API key from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header. Use: Authorization: Bearer rmai_xxx' },
        { status: 401 }
      )
    }

    const key = authHeader.substring(7)

    // Look up API key
    const apiKey = await db.apiKey.findUnique({
      where: { key },
      include: { user: true },
    })

    if (!apiKey || !apiKey.isActive) {
      return NextResponse.json(
        { error: 'Invalid or revoked API key' },
        { status: 401 }
      )
    }

    // Check user plan
    if (apiKey.user.plan === 'free') {
      return NextResponse.json(
        { error: 'API access requires an active Pro or Team subscription' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { url, roastMode = 'professional' } = body

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required. Send: { "url": "https://example.com", "roastMode": "professional" }' },
        { status: 400 }
      )
    }

    // Validate URL
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    const validUrl = parsedUrl.toString()
    const domain = parsedUrl.hostname
    const userId = apiKey.user.id

    // Check rate limits (pro: 100/day, team: 1000/day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayReports = await db.report.count({
      where: { userId, createdAt: { gte: today } },
    })

    const limit = apiKey.user.plan === 'team' ? 1000 : 100
    if (todayReports >= limit) {
      return NextResponse.json(
        { error: `API rate limit reached (${limit} analyses/day for ${apiKey.user.plan} plan)` },
        { status: 429 }
      )
    }

    // Update last used timestamp
    await db.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })

    // Fetch and analyze
    const websiteContent = await fetchWebsiteContent(validUrl)
    const analysis = await analyzeWebsite(
      validUrl,
      websiteContent.html,
      websiteContent.title,
      roastMode as 'professional' | 'savage'
    )

    // Save report
    const report = await db.report.create({
      data: {
        url: validUrl,
        domain,
        overallScore: analysis.overallScore,
        uiuxScore: analysis.uiux.score,
        seoScore: analysis.seo.score,
        accessibilityScore: analysis.accessibility.score,
        performanceScore: analysis.performance.score,
        mobileScore: analysis.mobile.score,
        designScore: analysis.design.score,
        conversionScore: analysis.conversion.score,
        roastMode,
        roast: analysis.roast,
        finalVerdict: analysis.finalVerdict,
        aiResponse: JSON.stringify(analysis),
        uiuxIssues: JSON.stringify(analysis.uiux.issues),
        uiuxSuggestions: JSON.stringify(analysis.uiux.suggestions),
        seoIssues: JSON.stringify(analysis.seo.issues),
        seoSuggestions: JSON.stringify(analysis.seo.suggestions),
        accessibilityIssues: JSON.stringify(analysis.accessibility.issues),
        accessibilitySuggestions: JSON.stringify(analysis.accessibility.suggestions),
        performanceIssues: JSON.stringify(analysis.performance.issues),
        performanceSuggestions: JSON.stringify(analysis.performance.suggestions),
        mobileIssues: JSON.stringify(analysis.mobile.issues),
        mobileSuggestions: JSON.stringify(analysis.mobile.suggestions),
        designIssues: JSON.stringify(analysis.design.issues),
        designSuggestions: JSON.stringify(analysis.design.suggestions),
        conversionIssues: JSON.stringify(analysis.conversion.issues),
        conversionSuggestions: JSON.stringify(analysis.conversion.suggestions),
        userId,
      },
    })

    // Update usage count
    await db.user.update({
      where: { id: userId },
      data: { analysesUsed: { increment: 1 } },
    })

    return NextResponse.json({
      success: true,
      reportId: report.id,
      data: analysis,
      website: {
        title: websiteContent.title,
        url: validUrl,
        domain,
      },
      meta: {
        plan: apiKey.user.plan,
        usageToday: todayReports + 1,
        dailyLimit: limit,
      },
    })
  } catch (error) {
    console.error('API analysis error:', error)
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
