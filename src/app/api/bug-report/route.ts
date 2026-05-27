import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getCachedHtml, fetchWebsiteContent } from '@/lib/ai-service'
import { generateBugReport } from '@/lib/bug-report-service'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to generate bug reports' }, { status: 401 })
    }

    let body: { url?: string; reportId?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { url, reportId } = body

    if (!url && !reportId) {
      return NextResponse.json({ error: 'URL or report ID is required' }, { status: 400 })
    }

    // Check if we already have a cached bug report for this report
    if (reportId) {
      const existingReport = await db.report.findUnique({ where: { id: reportId } })
      if (existingReport?.bugReportData) {
        try {
          const cachedBugReport = JSON.parse(existingReport.bugReportData)
          if (cachedBugReport && cachedBugReport.bugs && Array.isArray(cachedBugReport.bugs) && cachedBugReport.summary) {
            return NextResponse.json({ success: true, data: cachedBugReport, cached: true })
          }
        } catch {
          // Invalid cached data — fall through to generate new report
        }
      }
    }

    // Determine the URL to analyze
    let targetUrl = url

    if (reportId && !url) {
      const report = await db.report.findUnique({ where: { id: reportId } })
      if (!report) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 })
      }
      targetUrl = report.url
    }

    if (!targetUrl) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate URL and strip to root domain only
    let parsedUrl: URL
    try {
      parsedUrl = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    // Only use root domain — no paths, query strings, or hashes
    const validUrl = `https://${parsedUrl.hostname}`

    // ── PERFORMANCE OPTIMIZATION ───────────────────────
    // 1. Try in-memory HTML cache first (avoids re-fetching, saves 5-10 seconds)
    let htmlContent = ''
    let pageTitle = ''
    const cachedHtml = getCachedHtml(validUrl)

    if (cachedHtml && cachedHtml.html.length >= 100) {
      htmlContent = cachedHtml.html
      pageTitle = cachedHtml.title
    } else {
      // 2. Fall back to fetching if not cached
      try {
        const websiteContent = await fetchWebsiteContent(validUrl)
        htmlContent = websiteContent.html
        pageTitle = websiteContent.title
      } catch {
        return NextResponse.json({ error: 'Could not fetch website content. The website may be down or blocking automated access.' }, { status: 400 })
      }
    }

    if (!htmlContent || htmlContent.length < 100) {
      return NextResponse.json({ error: 'Insufficient website content for bug analysis. The page may be empty or require JavaScript to render.' }, { status: 400 })
    }

    // Generate bug report using AI
    const bugReport = await generateBugReport(validUrl, htmlContent, pageTitle)

    // Save the bug report data to the existing report if reportId was provided
    if (reportId) {
      try {
        await db.report.update({
          where: { id: reportId },
          data: { bugReportData: JSON.stringify(bugReport) },
        })
      } catch (dbError) {
        console.error('Failed to save bug report to DB:', dbError)
        // Non-critical - still return the report
      }
    }

    return NextResponse.json({ success: true, data: bugReport })
  } catch (error) {
    console.error('Bug report generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate bug report. Please try again.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to view bug reports' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get('reportId')

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 })
    }

    const report = await db.report.findUnique({ where: { id: reportId } })
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    if (!report.bugReportData) {
      return NextResponse.json({ error: 'No bug report generated yet for this report' }, { status: 404 })
    }

    try {
      const cachedBugReport = JSON.parse(report.bugReportData)
      if (cachedBugReport && cachedBugReport.bugs && cachedBugReport.summary) {
        return NextResponse.json({ success: true, data: cachedBugReport, cached: true })
      }
    } catch {
      // Invalid cached data
    }

    return NextResponse.json({ error: 'Invalid cached bug report data' }, { status: 500 })
  } catch (error) {
    console.error('Bug report fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch bug report' }, { status: 500 })
  }
}
