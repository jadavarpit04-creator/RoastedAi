import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reportId, format = 'pdf' } = body

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 })
    }

    const report = await db.report.findUnique({
      where: { id: reportId },
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    if (report.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check plan for PDF export (pro+ only)
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    })

    if (!user || user.plan === 'free') {
      return NextResponse.json(
        { error: 'PDF export requires a Pro or Team plan. Please upgrade.' },
        { status: 403 }
      )
    }

    // Get white-label config if applicable
    let whiteLabel = null
    if (user.plan === 'team') {
      whiteLabel = await db.whiteLabelConfig.findFirst({
        where: { userId: session.user.id, isActive: true },
      })
    }

    // Build report data
    const reportData = {
      id: report.id,
      url: report.url,
      domain: report.domain,
      overallScore: report.overallScore,
      roastMode: report.roastMode,
      roast: report.roast,
      finalVerdict: report.finalVerdict,
      categories: {
        uiux: { score: report.uiuxScore, issues: JSON.parse(report.uiuxIssues), suggestions: JSON.parse(report.uiuxSuggestions) },
        seo: { score: report.seoScore, issues: JSON.parse(report.seoIssues), suggestions: JSON.parse(report.seoSuggestions) },
        accessibility: { score: report.accessibilityScore, issues: JSON.parse(report.accessibilityIssues), suggestions: JSON.parse(report.accessibilitySuggestions) },
        performance: { score: report.performanceScore, issues: JSON.parse(report.performanceIssues), suggestions: JSON.parse(report.performanceSuggestions) },
        mobile: { score: report.mobileScore, issues: JSON.parse(report.mobileIssues), suggestions: JSON.parse(report.mobileSuggestions) },
        design: { score: report.designScore, issues: JSON.parse(report.designIssues), suggestions: JSON.parse(report.designSuggestions) },
        conversion: { score: report.conversionScore, issues: JSON.parse(report.conversionIssues), suggestions: JSON.parse(report.conversionSuggestions) },
      },
      createdAt: report.createdAt,
      whiteLabel: whiteLabel ? {
        companyName: whiteLabel.companyName,
        logoUrl: whiteLabel.logoUrl,
        primaryColor: whiteLabel.primaryColor,
        accentColor: whiteLabel.accentColor,
        footerText: whiteLabel.footerText,
      } : null,
    }

    // For PDF, we return the report data that the client will render
    // The actual PDF generation happens client-side using the browser's print API
    return NextResponse.json({
      success: true,
      data: reportData,
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Failed to export report' }, { status: 500 })
  }
}
