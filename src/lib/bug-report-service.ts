import { createChatCompletion } from './llm-client'
import type { BugReport, BugItem, BugCategory, BugSeverity } from './bug-report-types'

// In-memory cache for bug reports
interface BugCacheEntry {
  result: BugReport
  timestamp: number
  url: string
}

const bugCache: BugCacheEntry[] = []
const CACHE_MAX_SIZE = 50
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

function getCachedBugReport(url: string): BugReport | null {
  const now = Date.now()
  const expiredIdx = bugCache.findIndex(e => now - e.timestamp > CACHE_TTL_MS)
  if (expiredIdx > -1) bugCache.splice(0, expiredIdx + 1)

  const entry = bugCache.find(e => e.url === url)
  if (entry && now - entry.timestamp < CACHE_TTL_MS) return entry.result
  return null
}

function setCachedBugReport(url: string, result: BugReport) {
  const existingIdx = bugCache.findIndex(e => e.url === url)
  if (existingIdx > -1) bugCache.splice(existingIdx, 1)

  bugCache.push({ result, timestamp: Date.now(), url })
  if (bugCache.length > CACHE_MAX_SIZE) bugCache.splice(0, bugCache.length - CACHE_MAX_SIZE)
}

function generateBugId(): string {
  return `bug_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
}

// Strip HTML to essential content for faster LLM processing
function stripHtml(html: string, maxChars: number): string {
  // Remove scripts, styles, comments to focus on meaningful content
  let stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  // If still too long, take the first portion
  if (stripped.length > maxChars) {
    stripped = stripped.substring(0, maxChars)
  }

  return stripped
}

export async function generateBugReport(
  url: string,
  htmlContent: string,
  pageTitle: string
): Promise<BugReport> {
  // Check cache first
  const cached = getCachedBugReport(url)
  if (cached) return cached

  // Strip HTML to essential content for faster processing
  const compactHtml = stripHtml(htmlContent, 8000)

  const prompt = `Analyze this website for bugs. URL: ${url} | Title: ${pageTitle}

HTML: ${compactHtml}

Find 5-20 bugs across: ui_layout (broken layout, overflow, mobile issues), functional (broken links, dead buttons, form issues), performance (large images, render-blocking, missing lazy load), seo (missing meta/h1/structured data, poor headings), accessibility (missing alt/labels/ARIA, contrast, lang attr), security (no HTTPS, inline scripts, missing CSP).

Return JSON only:
{"bugs":[{"title":"...","category":"ui_layout|functional|performance|seo|accessibility|security","severity":"critical|high|medium|low","description":"...","whyItMatters":"...","affectedSection":"...","rootCause":"...","recommendedFix":"...","estimatedScoreImpact":1-20}],"passedChecks":number,"improvementPotential":0-50}

Rules: Only report detectable bugs. No duplicates. critical=site-breaking/security, high=major UX, medium=degraded UX, low=polish. Keep descriptions and fixes concise. No markdown.`

  const systemPrompt = 'You are a QA auditor AI. Respond with valid JSON only. No markdown, no code blocks. Be precise and concise. Only report bugs detectable from the HTML provided.'

  const completion = await createChatCompletion({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.1,
    maxTokens: 4000,
  })

  const responseText = completion.content

  try {
    let cleanResponse = responseText.trim()
    if (cleanResponse.startsWith('```json')) cleanResponse = cleanResponse.slice(7)
    if (cleanResponse.startsWith('```')) cleanResponse = cleanResponse.slice(3)
    if (cleanResponse.endsWith('```')) cleanResponse = cleanResponse.slice(0, -3)
    cleanResponse = cleanResponse.trim()

    const parsed = JSON.parse(cleanResponse)

    // Process and validate bugs
    const bugs: BugItem[] = (parsed.bugs || []).map((bug: Record<string, unknown>, index: number) => ({
      id: generateBugId(),
      title: String(bug.title || 'Unknown Bug'),
      category: validateCategory(bug.category as string),
      severity: validateSeverity(bug.severity as string),
      description: String(bug.description || ''),
      whyItMatters: String(bug.whyItMatters || ''),
      affectedSection: String(bug.affectedSection || 'General'),
      rootCause: String(bug.rootCause || 'Not determined'),
      recommendedFix: String(bug.recommendedFix || ''),
      priority: index + 1,
      estimatedScoreImpact: clampImpact(Number(bug.estimatedScoreImpact) || 3),
      status: 'open' as const,
    }))

    // Sort by severity: critical first, then high, medium, low
    const severityOrder: Record<BugSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 }
    bugs.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    bugs.forEach((bug, i) => { bug.priority = i + 1 })

    const passedChecks = Math.max(0, Number(parsed.passedChecks) || 0)
    const improvementPotential = Math.max(0, Math.min(50, Math.round(Number(parsed.improvementPotential) || 0)))

    // Calculate summary
    const summary = calculateSummary(bugs, passedChecks, improvementPotential)

    const report: BugReport = {
      bugs,
      summary,
      scannedAt: new Date().toISOString(),
      websiteUrl: url,
      websiteDomain: new URL(url).hostname,
    }

    // Cache the result
    setCachedBugReport(url, report)

    return report
  } catch (parseError) {
    console.error('Failed to parse bug report AI response:', parseError)
    console.error('Raw response:', responseText.substring(0, 500))

    // Return a minimal fallback
    const fallbackBugs: BugItem[] = [{
      id: generateBugId(),
      title: 'Analysis parsing issue',
      category: 'functional',
      severity: 'medium',
      description: 'The bug report could not be fully parsed. Some issues may not be displayed.',
      whyItMatters: 'You may be missing important bug information.',
      affectedSection: 'Report Generation',
      rootCause: 'AI response format issue',
      recommendedFix: 'Try running the bug report again.',
      priority: 1,
      estimatedScoreImpact: 3,
      status: 'open',
    }]

    return {
      bugs: fallbackBugs,
      summary: calculateSummary(fallbackBugs, 0, 0),
      scannedAt: new Date().toISOString(),
      websiteUrl: url,
      websiteDomain: new URL(url).hostname,
    }
  }
}

function validateCategory(cat: string): BugCategory {
  const valid: BugCategory[] = ['ui_layout', 'functional', 'performance', 'seo', 'accessibility', 'security']
  return valid.includes(cat as BugCategory) ? (cat as BugCategory) : 'functional'
}

function validateSeverity(sev: string): BugSeverity {
  const valid: BugSeverity[] = ['critical', 'high', 'medium', 'low']
  return valid.includes(sev as BugSeverity) ? (sev as BugSeverity) : 'medium'
}

function clampImpact(n: number): number {
  return Math.max(1, Math.min(20, Math.round(n)))
}

function calculateSummary(bugs: BugItem[], passedChecks: number, improvementPotential: number) {
  const severityBreakdown = {
    critical: bugs.filter(b => b.severity === 'critical').length,
    high: bugs.filter(b => b.severity === 'high').length,
    medium: bugs.filter(b => b.severity === 'medium').length,
    low: bugs.filter(b => b.severity === 'low').length,
  }

  const categoryBreakdown = {
    ui_layout: bugs.filter(b => b.category === 'ui_layout').length,
    functional: bugs.filter(b => b.category === 'functional').length,
    performance: bugs.filter(b => b.category === 'performance').length,
    seo: bugs.filter(b => b.category === 'seo').length,
    accessibility: bugs.filter(b => b.category === 'accessibility').length,
    security: bugs.filter(b => b.category === 'security').length,
  }

  // Health score: 100 minus weighted impact of bugs
  const totalImpact = bugs.reduce((sum, b) => sum + b.estimatedScoreImpact, 0)
  const healthScore = Math.max(0, Math.min(100, 100 - totalImpact))

  return {
    totalBugs: bugs.length,
    criticalBugs: severityBreakdown.critical,
    highBugs: severityBreakdown.high,
    mediumBugs: severityBreakdown.medium,
    lowBugs: severityBreakdown.low,
    passedChecks,
    healthScore,
    improvementPotential: Math.min(improvementPotential, 100 - healthScore),
    categoryBreakdown,
    severityBreakdown,
  }
}
