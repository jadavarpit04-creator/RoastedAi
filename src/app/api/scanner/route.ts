import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getCachedHtml, fetchWebsiteContent } from '@/lib/ai-service'
import { runVulnerabilityScan } from '@/lib/scanner-service'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to run security scans' }, { status: 401 })
    }

    let body: { url?: string; reportId?: string; scanMode?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { url, reportId, scanMode: rawScanMode } = body
    const scanMode = rawScanMode === 'deep' ? 'deep' : 'quick'

    if (!url && !reportId) {
      return NextResponse.json({ error: 'URL or report ID is required' }, { status: 400 })
    }

    // Check if we already have cached scan data for this report
    if (reportId) {
      const existingReport = await db.report.findUnique({ where: { id: reportId } })
      if (existingReport?.scanData) {
        try {
          const cachedScan = JSON.parse(existingReport.scanData)
          if (cachedScan && cachedScan.summary && cachedScan.vulnerabilities) {
            return NextResponse.json({ success: true, data: cachedScan, cached: true })
          }
        } catch {
          // Invalid cached data — fall through to run a new scan
        }
      }
    }

    // Determine the URL to scan
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
      return NextResponse.json({ error: 'Insufficient website content for security scanning. The page may be empty or require JavaScript to render.' }, { status: 400 })
    }

    // Run security scan
    const result = await runVulnerabilityScan(validUrl, htmlContent, pageTitle, scanMode)

    // Save the scan data to the existing report if reportId was provided
    if (reportId) {
      try {
        await db.report.update({
          where: { id: reportId },
          data: { scanData: JSON.stringify(result) },
        })
      } catch (dbError) {
        console.error('Failed to save scan data to DB:', dbError)
        // Non-critical — still return the result
      }
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Security scan error:', error)
    return NextResponse.json(
      { error: 'Failed to run security scan. Please try again.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to view scan results' }, { status: 401 })
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

    if (!report.scanData) {
      return NextResponse.json({ error: 'No security scan generated yet for this report' }, { status: 404 })
    }

    try {
      const cachedScan = JSON.parse(report.scanData)
      if (cachedScan && cachedScan.summary && cachedScan.vulnerabilities) {
        return NextResponse.json({ success: true, data: cachedScan, cached: true })
      }
    } catch {
      // Invalid cached data
    }

    return NextResponse.json({ error: 'Invalid cached scan data' }, { status: 500 })
  } catch (error) {
    console.error('Security scan fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch scan results' }, { status: 500 })
  }
}
