import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { fetchAndCacheWebsiteContent, analyzeWebsite } from '@/lib/ai-service'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getPlanKey, getAnalysesPerDay, hasFeature, FEATURES, isAdminEmail, isAdminRole } from '@/lib/plan-config'

// Safe JSON parse — returns fallback on error instead of crashing
function safeJsonParse(str: string | null | undefined, fallback: unknown = []): unknown {
  if (!str) return fallback
  try { return JSON.parse(str) } catch { return fallback }
}

function isValidDomain(hostname: string): boolean {
  if (!hostname || hostname.length < 1) return false
  if (!hostname.includes('.')) return false

  const parts = hostname.split('.')
  const tld = parts[parts.length - 1].toLowerCase()
  // Allow 1-char TLDs (like .x, .q) and require at least 2 chars for most
  // but be lenient — the real validation is whether we can fetch the site
  if (tld.length < 1) return false
  if (parts.length >= 2 && parts[parts.length - 2].length < 1) return false

  // Allow alphanumeric, hyphens, and dots in hostname
  // Be more permissive — just check for obviously invalid characters
  const domainRegex = /^[a-z0-9]([a-z0-9._-]*[a-z0-9])?$/i
  return domainRegex.test(hostname)
}

export async function POST(request: NextRequest) {
  let domain = ''
  try {
    // Check authentication
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Please sign in to analyze websites' },
        { status: 401 }
      )
    }

    const body = await request.json()
    let { url, roastMode = 'professional' } = body

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Clean up URL
    url = url.trim().toLowerCase()

    // Validate URL format
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`)
    } catch {
      return NextResponse.json(
        { error: 'invalid_website', domain: url },
        { status: 400 }
      )
    }

    // Validate the domain structure
    if (!isValidDomain(parsedUrl.hostname)) {
      return NextResponse.json(
        { error: 'invalid_website', domain: parsedUrl.hostname },
        { status: 400 }
      )
    }

    // Only use root domain — strip paths, query strings, and hashes
    const validUrl = `https://${parsedUrl.hostname}`
    domain = parsedUrl.hostname
    const userId = session.user.id

    // Check usage limits and plan restrictions
    const user = await db.user.findUnique({ where: { id: userId } })
    const userPlan = getPlanKey(user?.plan)

    // Admin users bypass all limits — check both DB role and email
    const isUserAdmin = isAdminRole(user?.role) || isAdminEmail(session.user?.email)

    // Check if the user already analyzed this exact URL recently (within 24 hours)
    // Return the cached result for consistency — same URL = same score
    // IMPORTANT: Cache check happens BEFORE daily limit check so users can always
    // re-view their cached analyses even if they've hit their daily limit
    // Also scoped to the user to avoid returning other users' cached reports
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentReport = await db.report.findFirst({
      where: {
        url: validUrl,
        roastMode,
        userId,
        createdAt: { gte: oneDayAgo },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (recentReport) {
      // Return the cached report — consistent scores for the same URL
      return NextResponse.json({
        success: true,
        reportId: recentReport.id,
        data: {
          overallScore: recentReport.overallScore,
          uiux: {
            score: recentReport.uiuxScore,
            issues: safeJsonParse(recentReport.uiuxIssues),
            suggestions: safeJsonParse(recentReport.uiuxSuggestions),
          },
          seo: {
            score: recentReport.seoScore,
            issues: safeJsonParse(recentReport.seoIssues),
            suggestions: safeJsonParse(recentReport.seoSuggestions),
          },
          accessibility: {
            score: recentReport.accessibilityScore,
            issues: safeJsonParse(recentReport.accessibilityIssues),
            suggestions: safeJsonParse(recentReport.accessibilitySuggestions),
          },
          performance: {
            score: recentReport.performanceScore,
            issues: safeJsonParse(recentReport.performanceIssues),
            suggestions: safeJsonParse(recentReport.performanceSuggestions),
          },
          mobile: {
            score: recentReport.mobileScore,
            issues: safeJsonParse(recentReport.mobileIssues),
            suggestions: safeJsonParse(recentReport.mobileSuggestions),
          },
          design: {
            score: recentReport.designScore,
            issues: safeJsonParse(recentReport.designIssues),
            suggestions: safeJsonParse(recentReport.designSuggestions),
          },
          conversion: {
            score: recentReport.conversionScore,
            issues: safeJsonParse(recentReport.conversionIssues),
            suggestions: safeJsonParse(recentReport.conversionSuggestions),
          },
          roast: recentReport.roast,
          finalVerdict: recentReport.finalVerdict,
        },
        website: {
          title: recentReport.domain,
          url: recentReport.url,
          domain: recentReport.domain,
        },
        cached: true,
      })
    }

    // Check daily analysis limits using DailyUsage (independent of report count)
    // This only applies to NEW analyses — cached results are returned above
    // Admin users bypass daily limits
    if (!isUserAdmin) {
      const dailyLimit = getAnalysesPerDay(userPlan)
      if (dailyLimit !== -1) { // -1 = unlimited
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Get or create today's usage record
        let dailyUsage = await db.dailyUsage.findUnique({
          where: { userId_date: { userId, date: today } }
        })

        if (!dailyUsage) {
          dailyUsage = await db.dailyUsage.create({
            data: { userId, date: today, count: 0 }
          })
        }

        if (dailyUsage.count >= dailyLimit) {
          const planLabel = userPlan === 'free' ? 'Free' : userPlan === 'starter' ? 'Starter' : userPlan
          return NextResponse.json(
            { error: `${planLabel} plan limit reached (${dailyLimit} analyses/day). Upgrade for more analyses!` },
            { status: 429 }
          )
        }
      }
    }

    // Step 1: Fetch website content
    // If the site blocks automated access, fall back to AI-only analysis
    let websiteContent
    try {
      websiteContent = await fetchAndCacheWebsiteContent(validUrl)
    } catch (fetchError) {
      console.error('Website fetch error for', validUrl, ':', fetchError)
      return NextResponse.json(
        { error: 'invalid_website', domain, message: `Could not fetch "${domain}". The website may be down, blocking automated access, or doesn't exist.` },
        { status: 400 }
      )
    }

    const isFetchFailed = !!(websiteContent as { fetchFailed?: boolean }).fetchFailed

    // Validate that we got meaningful content back (not a parking page or empty response)
    // Skip this check if fetch failed — we'll use AI knowledge instead
    if (!isFetchFailed) {
      const htmlLength = websiteContent.html?.length || 0
      if (htmlLength < 100) {
        console.error('Website returned too little content:', validUrl, 'HTML length:', htmlLength)
        return NextResponse.json(
          { error: 'invalid_website', domain, message: `"${domain}" returned empty or minimal content. The site may be under construction or blocking access.` },
          { status: 400 }
        )
      }

      // Detect common parking/registrar page indicators
      const htmlLower = websiteContent.html?.toLowerCase() || ''
      const parkingIndicators = [
        'domain is for sale',
        'this domain is parked',
        'domain parking',
        'buy this domain',
        'domain name is for sale',
        'this domain may be for sale',
        'this page is parked',
        'parked free',
        'sedo.com/parking',
        'namecheap.com/parking',
        'hover.com/parking',
      ]
      const isParkedDomain = parkingIndicators.some(indicator => htmlLower.includes(indicator))
      if (isParkedDomain) {
        return NextResponse.json(
          { error: 'invalid_website', domain, message: `"${domain}" appears to be a parked or unused domain.` },
          { status: 400 }
        )
      }
    }

    // Step 2: AI Analysis
    const analysis = await analyzeWebsite(
      validUrl,
      websiteContent.html,
      websiteContent.title,
      roastMode as 'professional' | 'savage'
    )

    // Step 3: Save to database with user ID
    // Race condition guard: check again if a report was created in the last 30 seconds
    // by a concurrent duplicate request — if so, return that instead of creating a duplicate
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000)
    const raceReport = await db.report.findFirst({
      where: {
        url: validUrl,
        roastMode,
        userId,
        createdAt: { gte: thirtySecondsAgo },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (raceReport) {
      // A concurrent request already created this report — return it instead
      return NextResponse.json({
        success: true,
        reportId: raceReport.id,
        data: {
          overallScore: raceReport.overallScore,
          uiux: {
            score: raceReport.uiuxScore,
            issues: safeJsonParse(raceReport.uiuxIssues),
            suggestions: safeJsonParse(raceReport.uiuxSuggestions),
          },
          seo: {
            score: raceReport.seoScore,
            issues: safeJsonParse(raceReport.seoIssues),
            suggestions: safeJsonParse(raceReport.seoSuggestions),
          },
          accessibility: {
            score: raceReport.accessibilityScore,
            issues: safeJsonParse(raceReport.accessibilityIssues),
            suggestions: safeJsonParse(raceReport.accessibilitySuggestions),
          },
          performance: {
            score: raceReport.performanceScore,
            issues: safeJsonParse(raceReport.performanceIssues),
            suggestions: safeJsonParse(raceReport.performanceSuggestions),
          },
          mobile: {
            score: raceReport.mobileScore,
            issues: safeJsonParse(raceReport.mobileIssues),
            suggestions: safeJsonParse(raceReport.mobileSuggestions),
          },
          design: {
            score: raceReport.designScore,
            issues: safeJsonParse(raceReport.designIssues),
            suggestions: safeJsonParse(raceReport.designSuggestions),
          },
          conversion: {
            score: raceReport.conversionScore,
            issues: safeJsonParse(raceReport.conversionIssues),
            suggestions: safeJsonParse(raceReport.conversionSuggestions),
          },
          roast: raceReport.roast,
          finalVerdict: raceReport.finalVerdict,
        },
        website: {
          title: raceReport.domain,
          url: raceReport.url,
          domain: raceReport.domain,
        },
        deduplicated: true,
      })
    }

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
      }
    })

    // Update user's analysis count
    await db.user.update({
      where: { id: userId },
      data: { analysesUsed: { increment: 1 } },
    })

    // Increment daily usage counter (independent of reports — never decremented on delete)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    await db.dailyUsage.upsert({
      where: { userId_date: { userId, date: today } },
      update: { count: { increment: 1 } },
      create: { userId, date: today, count: 1 },
    })

    return NextResponse.json({
      success: true,
      reportId: report.id,
      data: analysis,
      website: {
        title: websiteContent.title,
        url: validUrl,
        domain,
      }
    })
  } catch (error) {
    console.error('Analysis error:', error)
    
    // Provide better error messages based on the error type
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    if (errorMessage === 'INVALID_WEBSITE') {
      return NextResponse.json(
        { error: 'invalid_website', domain },
        { status: 400 }
      )
    }
    
    // Check for specific database errors that might occur
    if (errorMessage.includes('Prisma') || errorMessage.includes('prisma') || errorMessage.includes('database')) {
      console.error('Database error during analysis:', errorMessage)
      // Still return the analysis data if we have it — the report may have been saved
      return NextResponse.json(
        { error: 'Analysis completed but there was an issue saving. Please try again.' },
        { status: 500 }
      )
    }
    
    // For any other error, return a more helpful message
    console.error('Unexpected analysis error for domain:', domain, ':', errorMessage)
    return NextResponse.json(
      { error: 'Analysis failed. Please try again later.', domain },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get('id')

    if (reportId) {
      // Verify the user owns this report (or it's a shared/public report)
      const session = await getServerSession(authOptions)
      
      const report = await db.report.findUnique({
        where: { id: reportId }
      })

      if (!report) {
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 }
        )
      }

      // If the report belongs to a user, verify ownership
      if (report.userId && (!session?.user?.id || report.userId !== session.user.id)) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          id: report.id,
          url: report.url,
          domain: report.domain,
          overallScore: report.overallScore,
          uiux: {
            score: report.uiuxScore,
            issues: safeJsonParse(report.uiuxIssues),
            suggestions: safeJsonParse(report.uiuxSuggestions),
          },
          seo: {
            score: report.seoScore,
            issues: safeJsonParse(report.seoIssues),
            suggestions: safeJsonParse(report.seoSuggestions),
          },
          accessibility: {
            score: report.accessibilityScore,
            issues: safeJsonParse(report.accessibilityIssues),
            suggestions: safeJsonParse(report.accessibilitySuggestions),
          },
          performance: {
            score: report.performanceScore,
            issues: safeJsonParse(report.performanceIssues),
            suggestions: safeJsonParse(report.performanceSuggestions),
          },
          mobile: {
            score: report.mobileScore,
            issues: safeJsonParse(report.mobileIssues),
            suggestions: safeJsonParse(report.mobileSuggestions),
          },
          design: {
            score: report.designScore,
            issues: safeJsonParse(report.designIssues),
            suggestions: safeJsonParse(report.designSuggestions),
          },
          conversion: {
            score: report.conversionScore,
            issues: safeJsonParse(report.conversionIssues),
            suggestions: safeJsonParse(report.conversionSuggestions),
          },
          roast: report.roast,
          finalVerdict: report.finalVerdict,
          roastMode: report.roastMode,
          createdAt: report.createdAt,
        }
      })
    }

    // Get user's recent reports
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reports = await db.report.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({
      success: true,
      data: reports.map(r => ({
        id: r.id,
        url: r.url,
        domain: r.domain,
        overallScore: r.overallScore,
        roastMode: r.roastMode,
        createdAt: r.createdAt,
      }))
    })
  } catch (error) {
    console.error('Fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get('id')

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 })
    }

    const report = await db.report.findUnique({
      where: { id: reportId }
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    if (report.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await db.report.delete({ where: { id: reportId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 })
  }
}

// PUT handles competitor comparison and PDF export
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'compare') {
      // Competitor Comparison — available to all plans
      const { urls } = body
      if (!urls || !Array.isArray(urls) || urls.length < 2) {
        return NextResponse.json({ error: 'At least 2 URLs required' }, { status: 400 })
      }
      if (urls.length > 5) {
        return NextResponse.json({ error: 'Maximum 5 URLs' }, { status: 400 })
      }

      // Deduplicate URLs — normalize and check for duplicates
      const normalizedUrls: string[] = []
      for (const rawUrl of urls) {
        try {
          const parsed = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`)
          const norm = parsed.hostname
          if (normalizedUrls.includes(norm)) {
            return NextResponse.json({
              error: 'already_roasted',
              domain: parsed.hostname,
              message: `"${parsed.hostname}" is entered more than once. Each website should only appear once in the comparison.`
            }, { status: 400 })
          }
          normalizedUrls.push(norm)
        } catch {
          // Invalid URL will be caught below
        }
      }

      const results = await Promise.all(
        urls.map(async (url: string) => {
          try {
            let parsedUrl: URL
            try { parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`) } catch { return { url, error: 'Invalid URL' } }
            // Only use root domain — strip paths, query strings, and hashes
            const validUrl = `https://${parsedUrl.hostname}`

            // Check if we already have a recent report for this URL — use cached data
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
            const recentReport = await db.report.findFirst({
              where: {
                url: validUrl,
                createdAt: { gte: oneDayAgo },
              },
              orderBy: { createdAt: 'desc' },
            })

            if (recentReport) {
              return {
                url: validUrl,
                domain: parsedUrl.hostname,
                title: recentReport.domain,
                overallScore: recentReport.overallScore,
                categories: {
                  uiux: recentReport.uiuxScore,
                  seo: recentReport.seoScore,
                  accessibility: recentReport.accessibilityScore,
                  performance: recentReport.performanceScore,
                  mobile: recentReport.mobileScore,
                  design: recentReport.designScore,
                  conversion: recentReport.conversionScore,
                }
              }
            }

            // No cached report — fetch and analyze fresh
            const websiteContent = await fetchAndCacheWebsiteContent(validUrl)
            const analysis = await analyzeWebsite(validUrl, websiteContent.html, websiteContent.title, 'professional')
            return { url: validUrl, domain: parsedUrl.hostname, title: websiteContent.title, overallScore: analysis.overallScore, categories: { uiux: analysis.uiux.score, seo: analysis.seo.score, accessibility: analysis.accessibility.score, performance: analysis.performance.score, mobile: analysis.mobile.score, design: analysis.design.score, conversion: analysis.conversion.score } }
          } catch (err) { return { url, error: err instanceof Error ? err.message : 'Failed' } }
        })
      )

      const successful = results.filter((r) => !('error' in r && r.error))
      const winner = successful.length >= 2 ? successful.reduce((best: { overallScore: number }, cur: { overallScore: number }) => cur.overallScore > best.overallScore ? cur : best) : null

      return NextResponse.json({ success: true, data: { results, winner: (winner as { domain?: string })?.domain || null } })
    }

    if (action === 'export') {
      // PDF Export — available to all plans
      const { reportId } = body
      if (!reportId) return NextResponse.json({ error: 'Report ID required' }, { status: 400 })

      const user = await db.user.findUnique({ where: { id: session.user.id }, select: { plan: true } })
      const userPlan = getPlanKey(user?.plan)

      const report = await db.report.findUnique({ where: { id: reportId } })
      if (!report || report.userId !== session.user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 })

      let whiteLabel = null
      if (hasFeature(userPlan, FEATURES.whiteLabel)) {
        whiteLabel = await db.whiteLabelConfig.findFirst({ where: { userId: session.user.id, isActive: true } })
      }

      return NextResponse.json({
        success: true,
        data: {
          id: report.id, url: report.url, domain: report.domain, overallScore: report.overallScore, roastMode: report.roastMode, roast: report.roast, finalVerdict: report.finalVerdict,
          categories: {
            uiux: { score: report.uiuxScore, issues: safeJsonParse(report.uiuxIssues), suggestions: safeJsonParse(report.uiuxSuggestions) },
            seo: { score: report.seoScore, issues: safeJsonParse(report.seoIssues), suggestions: safeJsonParse(report.seoSuggestions) },
            accessibility: { score: report.accessibilityScore, issues: safeJsonParse(report.accessibilityIssues), suggestions: safeJsonParse(report.accessibilitySuggestions) },
            performance: { score: report.performanceScore, issues: safeJsonParse(report.performanceIssues), suggestions: safeJsonParse(report.performanceSuggestions) },
            mobile: { score: report.mobileScore, issues: safeJsonParse(report.mobileIssues), suggestions: safeJsonParse(report.mobileSuggestions) },
            design: { score: report.designScore, issues: safeJsonParse(report.designIssues), suggestions: safeJsonParse(report.designSuggestions) },
            conversion: { score: report.conversionScore, issues: safeJsonParse(report.conversionIssues), suggestions: safeJsonParse(report.conversionSuggestions) },
          },
          whiteLabel: whiteLabel ? { companyName: whiteLabel.companyName, logoUrl: whiteLabel.logoUrl, primaryColor: whiteLabel.primaryColor, accentColor: whiteLabel.accentColor, footerText: whiteLabel.footerText } : null,
        }
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('PUT error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
