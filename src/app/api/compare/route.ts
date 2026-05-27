import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { fetchWebsiteContent, analyzeWebsite } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only pro and team users can use competitor comparison
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    })

    if (!user || user.plan === 'free') {
      return NextResponse.json(
        { error: 'Competitor comparison requires a Pro or Team plan. Please upgrade.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { urls } = body as { urls: string[] }

    if (!urls || !Array.isArray(urls) || urls.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 URLs are required for comparison' },
        { status: 400 }
      )
    }

    if (urls.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 URLs can be compared at once' },
        { status: 400 }
      )
    }

    // Analyze each URL
    const results = await Promise.all(
      urls.map(async (url) => {
        try {
          let parsedUrl: URL
          try {
            parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`)
          } catch {
            return { url, error: 'Invalid URL format' }
          }

          const validUrl = parsedUrl.toString()
          const websiteContent = await fetchWebsiteContent(validUrl)
          const analysis = await analyzeWebsite(
            validUrl,
            websiteContent.html,
            websiteContent.title,
            'professional'
          )

          return {
            url: validUrl,
            domain: parsedUrl.hostname,
            title: websiteContent.title,
            overallScore: analysis.overallScore,
            categories: {
              uiux: analysis.uiux.score,
              seo: analysis.seo.score,
              accessibility: analysis.accessibility.score,
              performance: analysis.performance.score,
              mobile: analysis.mobile.score,
              design: analysis.design.score,
              conversion: analysis.conversion.score,
            },
          }
        } catch (err) {
          return {
            url,
            error: err instanceof Error ? err.message : 'Analysis failed',
          }
        }
      })
    )

    // Calculate comparison insights
    const successfulResults = results.filter((r) => !('error' in r && r.error))
    let winner = null
    if (successfulResults.length >= 2) {
      winner = successfulResults.reduce((best, current) =>
        current.overallScore > best.overallScore ? current : best
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        results,
        winner: winner?.domain || null,
        comparedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Comparison error:', error)
    return NextResponse.json({ error: 'Failed to compare websites' }, { status: 500 })
  }
}
