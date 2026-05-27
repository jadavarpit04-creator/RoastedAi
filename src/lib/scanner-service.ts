import { createChatCompletion, type ChatMessage } from './llm-client'
import type {
  ScanResult,
  ScanSummary,
  ScanMode,
  ScanStatus,
  VulnFinding,
  VulnCategory,
  VulnSeverity,
  VulnStatus,
} from './scanner-types'

// ─── In-Memory Cache ─────────────────────────────────────────────────────────

interface ScanCacheEntry {
  result: ScanResult
  timestamp: number
  cacheKey: string
}

const scanCache: ScanCacheEntry[] = []
const CACHE_MAX_SIZE = 50
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

function getCachedScan(cacheKey: string): ScanResult | null {
  const now = Date.now()
  const expiredIdx = scanCache.findIndex(e => now - e.timestamp > CACHE_TTL_MS)
  if (expiredIdx > -1) scanCache.splice(0, expiredIdx + 1)

  const entry = scanCache.find(e => e.cacheKey === cacheKey)
  if (entry && now - entry.timestamp < CACHE_TTL_MS) return entry.result
  return null
}

function setCachedScan(cacheKey: string, result: ScanResult) {
  const existingIdx = scanCache.findIndex(e => e.cacheKey === cacheKey)
  if (existingIdx > -1) scanCache.splice(existingIdx, 1)

  scanCache.push({ result, timestamp: Date.now(), cacheKey })
  if (scanCache.length > CACHE_MAX_SIZE) scanCache.splice(0, scanCache.length - CACHE_MAX_SIZE)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateScanId(): string {
  return `scan_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
}

function stripHtml(html: string, maxChars: number): string {
  let stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (stripped.length > maxChars) {
    stripped = stripped.substring(0, maxChars)
  }

  return stripped
}

const VALID_CATEGORIES: VulnCategory[] = [
  'xss', 'sqli', 'nosqli', 'csrf', 'ssrf', 'xxe', 'rce',
  'lfi', 'dir_traversal', 'open_redirect', 'clickjacking',
  'cors', 'security_headers', 'csp', 'ssl_tls', 'cookie_security',
  'auth', 'idor', 'cmd_injection', 'template_injection',
  'file_upload', 'deserialization', 'exposed_secrets', 'open_ports',
  'dns', 'subdomain', 'outdated_libs', 'broken_links',
  'mixed_content', 'api_security', 'info_leakage', 'misconfiguration',
]

const VALID_SEVERITIES: VulnSeverity[] = ['critical', 'high', 'medium', 'low', 'info']
const VALID_STATUSES: VulnStatus[] = ['open', 'confirmed', 'false_positive', 'accepted', 'fixed']
const VALID_EXPLOITABILITIES = ['easy', 'moderate', 'difficult'] as const
const VALID_IMPACTS = ['confidentiality', 'integrity', 'availability', 'multiple'] as const
const VALID_REMEDIATION = ['low', 'medium', 'high'] as const

function validateCategory(cat: string): VulnCategory {
  return VALID_CATEGORIES.includes(cat as VulnCategory) ? (cat as VulnCategory) : 'misconfiguration'
}

function validateSeverity(sev: string): VulnSeverity {
  return VALID_SEVERITIES.includes(sev as VulnSeverity) ? (sev as VulnSeverity) : 'medium'
}

function validateStatus(status: string): VulnStatus {
  return VALID_STATUSES.includes(status as VulnStatus) ? (status as VulnStatus) : 'open'
}

function validateExploitability(val: string): 'easy' | 'moderate' | 'difficult' {
  return VALID_EXPLOITABILITIES.includes(val as typeof VALID_EXPLOITABILITIES[number])
    ? (val as typeof VALID_EXPLOITABILITIES[number])
    : 'moderate'
}

function validateImpact(val: string): 'confidentiality' | 'integrity' | 'availability' | 'multiple' {
  return VALID_IMPACTS.includes(val as typeof VALID_IMPACTS[number])
    ? (val as typeof VALID_IMPACTS[number])
    : 'multiple'
}

function validateRemediation(val: string): 'low' | 'medium' | 'high' {
  return VALID_REMEDIATION.includes(val as typeof VALID_REMEDIATION[number])
    ? (val as typeof VALID_REMEDIATION[number])
    : 'medium'
}

function clampCvss(score: number): number {
  if (typeof score !== 'number' || isNaN(score)) return 5.0
  return Math.round(Math.max(0, Math.min(10, score)) * 10) / 10
}

function calculateSecurityGrade(riskScore: number): 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' {
  if (riskScore >= 95) return 'A+'
  if (riskScore >= 85) return 'A'
  if (riskScore >= 70) return 'B'
  if (riskScore >= 55) return 'C'
  if (riskScore >= 40) return 'D'
  return 'F'
}

function calculateRiskScore(vulns: VulnFinding[], checksPerformed: number): number {
  if (vulns.length === 0) return 100

  // Weighted scoring: critical vulns have massive impact
  const severityWeights: Record<VulnSeverity, number> = {
    critical: 25,
    high: 15,
    medium: 8,
    low: 3,
    info: 1,
  }

  const totalDeduction = vulns.reduce((sum, v) => {
    const weight = severityWeights[v.severity] || 5
    const cvssMultiplier = v.cvssScore / 10
    return sum + weight * cvssMultiplier
  }, 0)

  // Normalize: cap the deduction so score stays 0-100
  // More checks performed = more thorough = slight bonus
  const thoroughnessBonus = Math.min(5, Math.floor(checksPerformed / 10))
  const rawScore = 100 - totalDeduction + thoroughnessBonus

  return Math.max(0, Math.min(100, Math.round(rawScore)))
}

// ─── OWASP Reference Map ─────────────────────────────────────────────────────

const OWASP_REFERENCES: Partial<Record<VulnCategory, string[]>> = {
  xss: ['OWASP Top 10 A03:2021 – Injection', 'CWE-79: Cross-site Scripting'],
  sqli: ['OWASP Top 10 A03:2021 – Injection', 'CWE-89: SQL Injection'],
  nosqli: ['OWASP Top 10 A03:2021 – Injection', 'CWE-943: NoSQL Injection'],
  csrf: ['OWASP Top 10 A01:2021 – Broken Access Control', 'CWE-352: CSRF'],
  ssrf: ['OWASP Top 10 A10:2021 – SSRF', 'CWE-918: Server-Side Request Forgery'],
  xxe: ['OWASP Top 10 A05:2021 – Security Misconfiguration', 'CWE-611: XXE'],
  rce: ['OWASP Top 10 A03:2021 – Injection', 'CWE-78: OS Command Injection'],
  lfi: ['OWASP Top 10 A01:2021 – Broken Access Control', 'CWE-98: LFI'],
  dir_traversal: ['CWE-22: Path Traversal', 'OWASP Path Traversal'],
  open_redirect: ['CWE-601: Open Redirect', 'OWASP Unvalidated Redirects'],
  clickjacking: ['CWE-451: Clickjacking', 'OWASP Clickjacking'],
  cors: ['CWE-942: CORS', 'OWASP CORS Origin'],
  security_headers: ['OWASP Secure Headers Project', 'CWE-693: Protection Mechanism Failure'],
  csp: ['CWE-693: CSP Not Implemented', 'OWASP Content Security Policy'],
  ssl_tls: ['OWASP Transport Layer Protection', 'CWE-326: Weak Encryption'],
  cookie_security: ['CWE-614: Sensitive Cookie Without Secure Flag', 'OWASP Cookie Security'],
  auth: ['OWASP Top 10 A07:2021 – Auth Failures', 'CWE-287: Improper Authentication'],
  idor: ['OWASP Top 10 A01:2021 – Broken Access Control', 'CWE-639: IDOR'],
  cmd_injection: ['OWASP Top 10 A03:2021 – Injection', 'CWE-78: OS Command Injection'],
  template_injection: ['CWE-1336: Server-Side Template Injection', 'OWASP SSTI'],
  file_upload: ['CWE-434: Unrestricted File Upload', 'OWASP File Upload'],
  deserialization: ['OWASP Top 10 A08:2021 – Software Data Integrity', 'CWE-502: Deserialization'],
  exposed_secrets: ['OWASP Top 10 A02:2021 – Cryptographic Failures', 'CWE-200: Information Exposure'],
  open_ports: ['CWE-200: Information Exposure', 'OWASP Configuration Guides'],
  dns: ['CWE-200: Information Exposure', 'OWASP DNS Security'],
  subdomain: ['CWE-200: Information Exposure', 'OWASP Reconnaissance'],
  outdated_libs: ['OWASP Top 10 A06:2021 – Vulnerable Components', 'CWE-1104: Outdated Components'],
  broken_links: ['CWE-676: Use of Potentially Dangerous Function'],
  mixed_content: ['CWE-311: Missing Encryption', 'OWASP Transport Layer Protection'],
  api_security: ['OWASP API Security Top 10', 'CWE-306: Missing Authentication'],
  info_leakage: ['CWE-200: Information Exposure', 'OWASP Information Leakage'],
  misconfiguration: ['OWASP Top 10 A05:2021 – Security Misconfiguration', 'CWE-16: Configuration'],
}

function getOwaspRefs(category: VulnCategory, aiRefs: string[]): string[] {
  const baseRefs = OWASP_REFERENCES[category] || ['OWASP Web Security Guide']
  // Merge AI-provided refs with base refs, deduplicate
  const all = [...baseRefs, ...aiRefs.filter(r => !baseRefs.includes(r))]
  return all.slice(0, 4) // Cap at 4 refs
}

// ─── Main Scanner Function ───────────────────────────────────────────────────

export async function runVulnerabilityScan(
  url: string,
  htmlContent: string,
  pageTitle: string,
  scanMode: ScanMode = 'quick'
): Promise<ScanResult> {
  // Build cache key from URL + mode for consistent results
  const cacheKey = `${url}::${scanMode}`
  const cached = getCachedScan(cacheKey)
  if (cached) return cached

  const scanId = generateScanId()
  const startTime = Date.now()

  // Compact HTML for speed
  const maxHtmlChars = scanMode === 'deep' ? 8000 : 5000
  const compactHtml = stripHtml(htmlContent, maxHtmlChars)

  const isDeep = scanMode === 'deep'

  const systemPrompt = `You are an elite security auditor AI. Analyze website HTML for vulnerabilities. Return ONLY valid JSON — no markdown, no code blocks, no extra text. Be precise, thorough, and realistic. Only report findings detectable from the provided HTML and metadata.`

  const prompt = `Security scan (${scanMode}) for: ${url} | Title: ${pageTitle}

HTML: ${compactHtml}

Analyze for ALL these vulnerability categories: xss, sqli, nosqli, csrf, ssrf, xxe, rce, lfi, dir_traversal, open_redirect, clickjacking, cors, security_headers, csp, ssl_tls, cookie_security, auth, idor, cmd_injection, template_injection, file_upload, deserialization, exposed_secrets, open_ports, dns, subdomain, outdated_libs, broken_links, mixed_content, api_security, info_leakage, misconfiguration.

${isDeep ? 'DEEP mode: Report 10-25 findings with detailed analysis. Check every category thoroughly.' : 'QUICK mode: Report 5-15 high-confidence findings. Focus on critical/high severity.'}

Return JSON only:
{
  "vulnerabilities": [
    {
      "title": "short title",
      "category": "category_key",
      "severity": "critical|high|medium|low|info",
      "cvssScore": 0.0-10.0,
      "description": "what the vulnerability is",
      "affectedEndpoint": "URL or path",
      "proofOfDetection": "how detected from HTML",
      "rootCause": "why this exists",
      "recommendedFix": "specific fix",
      "exploitability": "easy|moderate|difficult",
      "impact": "confidentiality|integrity|availability|multiple",
      "remediationEffort": "low|medium|high",
      "references": ["OWASP/CVE ref"],
      "isFalsePositive": false
    }
  ],
  "passedChecks": number,
  "checksPerformed": number,
  "pagesScanned": 1,
  "topAttackPaths": ["path1", "path2", "path3"]
}

Rules:
- Only report vulnerabilities detectable from the HTML provided
- CVSS: critical=9.0-10.0, high=7.0-8.9, medium=4.0-6.9, low=1.0-3.9, info=0.0
- severity MUST match cvssScore range
- Critical findings: exposed secrets, auth bypass, injection, RCE
- High: XSS, CSRF, SSRF, broken access control
- Medium: missing headers, CSP issues, cookie flags
- Low/Info: informational findings, best practice gaps
- Keep descriptions concise (1-2 sentences)
- Recommended fixes should be actionable and specific
- No duplicates across categories
- topAttackPaths: most likely attack scenarios (2-5)`

  try {
    const completion = await createChatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      maxTokens: isDeep ? 6000 : 4000,
    })

    const responseText = completion.content

    // Parse response
    let cleanResponse = responseText.trim()
    if (cleanResponse.startsWith('```json')) cleanResponse = cleanResponse.slice(7)
    if (cleanResponse.startsWith('```')) cleanResponse = cleanResponse.slice(3)
    if (cleanResponse.endsWith('```')) cleanResponse = cleanResponse.slice(0, -3)
    cleanResponse = cleanResponse.trim()

    const parsed = JSON.parse(cleanResponse)

    // ── Process Vulnerabilities ──
    const rawVulns = Array.isArray(parsed.vulnerabilities) ? parsed.vulnerabilities : []

    const vulnerabilities: VulnFinding[] = rawVulns.map(
      (v: Record<string, unknown>, index: number) => {
        const category = validateCategory(String(v.category || 'misconfiguration'))
        const severity = validateSeverity(String(v.severity || 'medium'))
        const cvssScore = clampCvss(Number(v.cvssScore) || 5.0)

        // Ensure CVSS aligns with severity
        const correctedCvss = enforceCvssSeverityAlignment(cvssScore, severity)

        return {
          id: `vuln_${Date.now()}_${Math.random().toString(36).substring(2, 6)}_${index}`,
          title: String(v.title || 'Unknown Vulnerability').substring(0, 200),
          category,
          severity,
          cvssScore: correctedCvss,
          status: validateStatus(String(v.status || 'open')),
          description: String(v.description || '').substring(0, 500),
          affectedEndpoint: String(v.affectedEndpoint || url).substring(0, 300),
          proofOfDetection: String(v.proofOfDetection || 'Detected via HTML analysis').substring(0, 500),
          rootCause: String(v.rootCause || 'Not determined').substring(0, 300),
          recommendedFix: String(v.recommendedFix || '').substring(0, 500),
          exploitability: validateExploitability(String(v.exploitability || 'moderate')),
          impact: validateImpact(String(v.impact || 'multiple')),
          remediationEffort: validateRemediation(String(v.remediationEffort || 'medium')),
          references: getOwaspRefs(category, Array.isArray(v.references) ? v.references.map(String) : []),
          isFalsePositive: Boolean(v.isFalsePositive),
        }
      }
    )

    // Sort by severity (critical first), then by CVSS score descending
    const severityOrder: Record<VulnSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }
    vulnerabilities.sort((a, b) => {
      const sevDiff = severityOrder[a.severity] - severityOrder[b.severity]
      if (sevDiff !== 0) return sevDiff
      return b.cvssScore - a.cvssScore
    })

    // ── Calculate Summary ──
    const checksPerformed = Math.max(vulnerabilities.length, Number(parsed.checksPerformed) || vulnerabilities.length + 10)
    const passedChecks = Math.max(0, Number(parsed.passedChecks) || Math.max(0, checksPerformed - vulnerabilities.length))
    const pagesScanned = Math.max(1, Number(parsed.pagesScanned) || 1)
    const topAttackPaths = Array.isArray(parsed.topAttackPaths)
      ? parsed.topAttackPaths.map(String).slice(0, 5)
      : []

    const severityBreakdown = buildSeverityBreakdown(vulnerabilities)
    const categoryBreakdown = buildCategoryBreakdown(vulnerabilities)

    const riskScore = calculateRiskScore(vulnerabilities, checksPerformed)
    const securityGrade = calculateSecurityGrade(riskScore)

    // Exploitability score: average CVSS * 10, capped 0-100
    const avgCvss = vulnerabilities.length > 0
      ? vulnerabilities.reduce((s, v) => s + v.cvssScore, 0) / vulnerabilities.length
      : 0
    const exploitabilityScore = Math.round(Math.min(100, avgCvss * 10))

    // Exposed attack surface: ratio of vulns to checks performed
    const exposedAttackSurface = checksPerformed > 0
      ? Math.round(Math.min(100, (vulnerabilities.length / checksPerformed) * 100))
      : 0

    const summary: ScanSummary = {
      riskScore,
      totalVulns: vulnerabilities.length,
      criticalCount: severityBreakdown.critical,
      highCount: severityBreakdown.high,
      mediumCount: severityBreakdown.medium,
      lowCount: severityBreakdown.low,
      infoCount: severityBreakdown.info,
      passedChecks,
      exploitabilityScore,
      exposedAttackSurface,
      categoryBreakdown,
      severityBreakdown,
      topAttackPaths,
      securityGrade,
    }

    const scanDuration = Math.round((Date.now() - startTime) / 1000)

    const result: ScanResult = {
      id: scanId,
      vulnerabilities,
      summary,
      scanMode,
      status: 'completed' as ScanStatus,
      scannedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      websiteUrl: url,
      websiteDomain: extractDomain(url),
      scanDuration,
      pagesScanned,
      checksPerformed,
    }

    // Cache the result
    setCachedScan(cacheKey, result)

    return result
  } catch (parseError) {
    console.error('Failed to parse scanner AI response:', parseError)

    // Return a minimal fallback result
    const scanDuration = Math.round((Date.now() - startTime) / 1000)
    const fallbackVulns: VulnFinding[] = [{
      id: `vuln_${Date.now()}_fallback_0`,
      title: 'Scan parsing issue',
      category: 'misconfiguration',
      severity: 'medium',
      cvssScore: 5.0,
      status: 'open',
      description: 'The vulnerability scan could not be fully parsed. Some findings may not be displayed.',
      affectedEndpoint: url,
      proofOfDetection: 'AI response format issue',
      rootCause: 'AI response could not be parsed as structured JSON',
      recommendedFix: 'Try running the scan again.',
      exploitability: 'moderate',
      impact: 'availability',
      remediationEffort: 'low',
      references: ['OWASP Web Security Guide'],
      isFalsePositive: false,
    }]

    const fallbackSummary: ScanSummary = {
      riskScore: 50,
      totalVulns: 1,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 1,
      lowCount: 0,
      infoCount: 0,
      passedChecks: 0,
      exploitabilityScore: 50,
      exposedAttackSurface: 50,
      categoryBreakdown: buildCategoryBreakdown(fallbackVulns),
      severityBreakdown: buildSeverityBreakdown(fallbackVulns),
      topAttackPaths: [],
      securityGrade: 'D',
    }

    const result: ScanResult = {
      id: scanId,
      vulnerabilities: fallbackVulns,
      summary: fallbackSummary,
      scanMode,
      status: 'completed',
      scannedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      websiteUrl: url,
      websiteDomain: extractDomain(url),
      scanDuration,
      pagesScanned: 1,
      checksPerformed: 1,
    }

    return result
  }
}

// ─── Utility Functions ───────────────────────────────────────────────────────

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

function enforceCvssSeverityAlignment(cvss: number, severity: VulnSeverity): number {
  // Ensure CVSS score falls within the range of the declared severity
  const ranges: Record<VulnSeverity, [number, number]> = {
    critical: [9.0, 10.0],
    high: [7.0, 8.9],
    medium: [4.0, 6.9],
    low: [1.0, 3.9],
    info: [0.0, 0.0],
  }
  const [min, max] = ranges[severity]
  if (cvss >= min && cvss <= max) return cvss

  // Clamp to the midpoint of the severity range
  const midpoint = Math.round(((min + max) / 2) * 10) / 10
  return clampCvss(midpoint)
}

function buildSeverityBreakdown(vulns: VulnFinding[]): Record<VulnSeverity, number> {
  return {
    critical: vulns.filter(v => v.severity === 'critical').length,
    high: vulns.filter(v => v.severity === 'high').length,
    medium: vulns.filter(v => v.severity === 'medium').length,
    low: vulns.filter(v => v.severity === 'low').length,
    info: vulns.filter(v => v.severity === 'info').length,
  }
}

function buildCategoryBreakdown(vulns: VulnFinding[]): Record<VulnCategory, number> {
  const breakdown = {} as Record<VulnCategory, number>
  for (const cat of VALID_CATEGORIES) {
    breakdown[cat] = vulns.filter(v => v.category === cat).length
  }
  return breakdown
}
