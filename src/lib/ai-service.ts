import { createChatCompletion, fetchWebsiteContentNative, type ChatMessage } from './llm-client'

// ─── HTML Content Cache ──────────────────────────────────────
// Caches fetched website HTML for reuse across analysis features
interface HtmlCacheEntry {
  html: string
  title: string
  timestamp: number
  url: string
}

const htmlCache: HtmlCacheEntry[] = []
const HTML_CACHE_MAX = 30
const HTML_CACHE_TTL = 30 * 60 * 1000 // 30 minutes

export function getCachedHtml(url: string): { html: string; title: string } | null {
  const now = Date.now()
  // Clean expired
  const expiredIdx = htmlCache.findIndex(e => now - e.timestamp > HTML_CACHE_TTL)
  if (expiredIdx > -1) htmlCache.splice(0, expiredIdx + 1)

  const entry = htmlCache.find(e => e.url === url)
  if (entry && now - entry.timestamp < HTML_CACHE_TTL) {
    return { html: entry.html, title: entry.title }
  }
  return null
}

export function setCachedHtml(url: string, html: string, title: string) {
  const existingIdx = htmlCache.findIndex(e => e.url === url)
  if (existingIdx > -1) htmlCache.splice(existingIdx, 1)

  htmlCache.push({ html, title, timestamp: Date.now(), url })
  if (htmlCache.length > HTML_CACHE_MAX) htmlCache.splice(0, htmlCache.length - HTML_CACHE_MAX)
}

export interface WebsiteAnalysis {
  overallScore: number
  uiux: {
    score: number
    issues: string[]
    suggestions: string[]
  }
  seo: {
    score: number
    issues: string[]
    suggestions: string[]
  }
  accessibility: {
    score: number
    issues: string[]
    suggestions: string[]
  }
  performance: {
    score: number
    issues: string[]
    suggestions: string[]
  }
  mobile: {
    score: number
    issues: string[]
    suggestions: string[]
  }
  design: {
    score: number
    issues: string[]
    suggestions: string[]
  }
  conversion: {
    score: number
    issues: string[]
    suggestions: string[]
  }
  roast: string
  finalVerdict: string
}

// In-memory cache for recent analyses to ensure consistent scores for the same URL
interface CacheEntry {
  result: WebsiteAnalysis
  timestamp: number
  url: string
  roastMode: string
}

const analysisCache: CacheEntry[] = []
const CACHE_MAX_SIZE = 100
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

function getCachedResult(url: string, roastMode: string): WebsiteAnalysis | null {
  // Clean expired entries
  const now = Date.now()
  const validIndex = analysisCache.findIndex(e => now - e.timestamp > CACHE_TTL_MS)
  if (validIndex > -1) {
    analysisCache.splice(0, validIndex + 1)
  }

  const entry = analysisCache.find(
    e => e.url === url && e.roastMode === roastMode
  )

  if (entry && now - entry.timestamp < CACHE_TTL_MS) {
    return entry.result
  }

  return null
}

function setCachedResult(url: string, roastMode: string, result: WebsiteAnalysis) {
  // Remove existing entry for same url+mode
  const existingIndex = analysisCache.findIndex(
    e => e.url === url && e.roastMode === roastMode
  )
  if (existingIndex > -1) {
    analysisCache.splice(existingIndex, 1)
  }

  analysisCache.push({ result, timestamp: Date.now(), url, roastMode })

  // Trim cache if too large
  if (analysisCache.length > CACHE_MAX_SIZE) {
    analysisCache.splice(0, analysisCache.length - CACHE_MAX_SIZE)
  }
}

export async function fetchWebsiteContent(url: string) {
  try {
    const result = await fetchWebsiteContentNative(url)

    // Validate that we got meaningful data back
    if (!result.html && !result.title) {
      throw new Error('INVALID_WEBSITE')
    }

    return result
  } catch {
    throw new Error('INVALID_WEBSITE')
  }
}

// Wrapper that also caches HTML for reuse
export async function fetchAndCacheWebsiteContent(url: string) {
  try {
    const content = await fetchWebsiteContent(url)
    setCachedHtml(url, content.html, content.title)
    return content
  } catch {
    // Website couldn't be fetched (blocks bots, down, etc.)
    // Return minimal content so analysis can still proceed with AI knowledge
    const domain = url.replace(/^https?:\/\//, '').replace(/\/$/, '')
    return {
      title: domain,
      url,
      html: '',
      publishedTime: null as string | null,
      fetchFailed: true as const,
    }
  }
}

export async function analyzeWebsite(
  url: string,
  htmlContent: string,
  pageTitle: string,
  roastMode: 'professional' | 'savage' = 'professional'
): Promise<WebsiteAnalysis> {
  // Check cache first — return consistent results for the same URL
  const cached = getCachedResult(url, roastMode)
  if (cached) {
    return cached
  }

  const roastPrompt = roastMode === 'savage'
    ? `You are a SAVAGE and HILARIOUS AI website roaster. Be brutally funny, use witty metaphors, pop culture references, and devastating humor. Think of a comedy roast but for websites. Examples: "This navbar looks like it survived Internet Explorer.", "Your CTA button is hiding like it owes money.", "Users leave this homepage faster than bad WiFi." Make it entertaining while still being technically accurate. ROAST MODE: Your issues and suggestions should be written in a SAVAGE, entertaining tone — use humor, sarcasm, and witty analogies. Don't just say 'Missing meta description' — say something like 'Your page is wandering the internet without a name tag like it forgot its own introduction.' Every issue and suggestion should have personality!`
    : `You are a professional and constructive AI website auditor. Be thorough, specific, and helpful while maintaining an engaging tone. PROFESSIONAL MODE: Your issues and suggestions should be clear, technical, and actionable. Use industry-standard terminology and provide precise recommendations. Every issue should be specific and every suggestion should be practical.`

  const modeSpecificGuidance = roastMode === 'savage'
    ? `
SAVAGE MODE RULES — You MUST follow these:
1. The "roast" field MUST be a brutally funny, sarcastic 3-5 sentence takedown of this website. Use witty metaphors, pop culture references, and devastating humor.
2. The "finalVerdict" MUST be written as a savage mic-drop summary — entertaining but still informative.
3. Every "issues" array MUST contain savage, witty descriptions. Example: Instead of "Missing meta description", write "This page has no meta description — it's like showing up to a job interview without a resume."
4. Every "suggestions" array MUST be entertaining but still useful. Example: Instead of "Add a meta description", write "Slap a meta description on this page before Google pretends you don't exist."
5. IMPORTANT: In savage mode, apply a HARSH LENS to scoring. Deduct ADDITIONAL points for mediocre design choices. Be a tough critic — scores should generally be 5-15 points LOWER than professional mode for the same site. Mediocrity deserves no mercy.
6. The same website analyzed in professional vs savage mode should produce DIFFERENT scores (savage = harsher) and VERY different tone in all text fields.`
    : `
PROFESSIONAL MODE RULES — You MUST follow these:
1. The "roast" field should be a professional but engaging 2-4 sentence summary with mild wit.
2. The "finalVerdict" should be a constructive, detailed 3-5 sentence assessment.
3. Every "issues" array should contain clear, technical descriptions. Example: "Missing meta description tag — impacts search engine result display."
4. Every "suggestions" array should be specific and actionable. Example: "Add a compelling meta description (150-160 characters) that includes primary keywords."
5. IMPORTANT: In professional mode, score objectively and fairly. Be constructive, not harsh. Scores should reflect the actual technical quality.`

  const isFetchFailed = !htmlContent || htmlContent.trim().length === 0

  const htmlSection = isFetchFailed
    ? `NOTE: The website's HTML content could NOT be fetched (the site may block automated access). You MUST analyze this website based on your KNOWLEDGE of it. Consider what you know about ${url} — its design, user experience, SEO, accessibility, performance, mobile experience, and conversion strategy. If you are not familiar with this specific website, provide a general analysis based on the domain name and typical characteristics of similar sites.`
    : `HTML Content (first 15000 chars):
${htmlContent.substring(0, 15000)}`

  const scoringNote = isFetchFailed
    ? `IMPORTANT: Since the HTML could not be fetched, score based on your KNOWLEDGE of this website. If you know the site well, score accurately. If you are less familiar, score conservatively (around 50-65 range) and note in your issues that the analysis is based on general knowledge rather than a direct scan. Do NOT give extremely low scores just because you couldn't see the HTML — give the benefit of the doubt where appropriate.`
    : `Score each category based ONLY on the actual HTML content provided. Do NOT guess or assume anything not in the HTML.`

  const prompt = `${roastPrompt}

Analyze the following website deeply.

Website URL: ${url}
Website Title: ${pageTitle}

${htmlSection}

Provide a comprehensive analysis and return a VALID JSON object with EXACTLY this structure (no extra text, no markdown, just raw JSON):

{
  "overallScore": <number 0-100>,
  "uiux": {
    "score": <number 0-100>,
    "issues": [<array of specific issue strings>],
    "suggestions": [<array of specific suggestion strings>]
  },
  "seo": {
    "score": <number 0-100>,
    "issues": [<array of specific issue strings>],
    "suggestions": [<array of specific suggestion strings>]
  },
  "accessibility": {
    "score": <number 0-100>,
    "issues": [<array of specific issue strings>],
    "suggestions": [<array of specific suggestion strings>]
  },
  "performance": {
    "score": <number 0-100>,
    "issues": [<array of specific issue strings>],
    "suggestions": [<array of specific suggestion strings>]
  },
  "mobile": {
    "score": <number 0-100>,
    "issues": [<array of specific issue strings>],
    "suggestions": [<array of specific suggestion strings>]
  },
  "design": {
    "score": <number 0-100>,
    "issues": [<array of specific issue strings>],
    "suggestions": [<array of specific suggestion strings>]
  },
  "conversion": {
    "score": <number 0-100>,
    "issues": [<array of specific issue strings>],
    "suggestions": [<array of specific suggestion strings>]
  },
  "roast": "<${roastMode === 'savage' ? 'A hilariously savage and witty 3-5 sentence roast paragraph with brutal humor, metaphors, and pop culture references' : 'A professional but engaging 2-4 sentence summary with mild wit'}>",
  "finalVerdict": "<${roastMode === 'savage' ? 'A savage mic-drop 3-5 sentence verdict — entertaining, devastating, but still informative' : 'A constructive, detailed 3-5 sentence professional assessment'}>"
}
${modeSpecificGuidance}

SCORING RULES — Apply these objective deduction rules for each category:
1. ${scoringNote}
2. Start at 100 and deduct points for each issue found:
   - Missing meta description: -10 points (SEO)
   - Missing h1 tag: -15 points (SEO, UI/UX)
   - Missing alt attributes on images: -5 per image, max -20 (Accessibility)
   - No viewport meta tag: -20 points (Mobile)
   - Inline styles overuse (>50% of elements): -10 points (Design)
   - Missing lang attribute on html tag: -5 points (Accessibility)
   - No semantic HTML (header, nav, main, footer): -10 points (UI/UX)
   - Forms without labels: -10 points (Accessibility)
   - No favicon: -5 points (Design)
   - Missing Open Graph tags: -5 points (SEO)
   - External scripts/styles without integrity: -3 points (Performance)
   - Large inline scripts (>5KB): -5 points (Performance)
   - No clear CTA elements: -15 points (Conversion)
   - Poor color contrast indicators: -10 points (Accessibility)
   - Missing structured data (JSON-LD): -5 points (SEO)
   - No responsive images (srcset/picture): -5 points (Performance, Mobile)
   - Missing canonical URL: -5 points (SEO)
   - Too many DOM elements (>1500): -5 points (Performance)
   - No preload/preconnect for critical resources: -3 points (Performance)
   - Images without width/height attributes: -5 points (Performance)
   - Using deprecated HTML elements: -5 points (UI/UX)
   - No skip navigation link: -5 points (Accessibility)
3. Also ANALYZE the tech stack visible in the HTML for additional scoring context:
   - If using a modern framework (React/Vue/Angular/Next.js), that's a positive indicator for UI/UX and Performance
   - If using Tailwind CSS or Bootstrap 5+, that's positive for Design consistency
   - If using WordPress with many plugins, deduct -5 for Performance
   - If using jQuery alongside a modern framework, deduct -3 for Performance
   - If the site is an SPA without SSR, deduct -5 for SEO
   - If using a CDN (Cloudflare, etc.), add +3 for Performance
4. The overallScore MUST be the AVERAGE of all 7 category scores, rounded to nearest integer.
5. ${roastMode === 'savage' ? 'In SAVAGE mode: apply a HARSH lens — deduct 5-15 ADDITIONAL points per category for mediocre or uninspired choices. Be a tough, unforgiving critic.' : 'In PROFESSIONAL mode: score fairly and objectively. Only deduct for actual technical issues, not subjective taste.'}

Score Guidelines:
- 90-100: Exceptional, best-in-class
- 75-89: Good, minor improvements needed
- 50-74: Average, significant improvements needed
- 25-49: Below average, major overhaul needed
- 0-24: Critical issues, needs complete redesign

For each category, provide 3-6 specific issues and suggestions.
Return ONLY the JSON object, no additional text.`

  const systemPrompt = roastMode === 'savage'
    ? 'You are a SAVAGE, hilarious AI website roaster who always responds with valid JSON only. No markdown, no code blocks, just raw JSON. You are BRUTALLY honest and entertaining. In savage mode, your scores should be STRICTER and your text should be witty, sarcastic, and devastating. The same website should score 5-15 points LOWER in savage mode than professional mode because you have zero tolerance for mediocrity. Every issue and suggestion should drip with personality and humor while still being technically accurate.'
    : 'You are an elite professional AI website auditor who always responds with valid JSON only. No markdown, no code blocks, just raw JSON. You are objective, thorough, and constructive. Score fairly based on actual technical quality. Your tone should be professional but engaging, with mild wit. Issues and suggestions should be clear, technical, and actionable.'

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: systemPrompt
    },
    {
      role: 'user',
      content: prompt
    }
  ]

  const completion = await createChatCompletion({
    messages,
    temperature: roastMode === 'savage' ? 0.3 : 0,
  })

  const responseText = completion.content
  
  try {
    // Try to parse the response as JSON
    let cleanResponse = responseText.trim()
    // Remove markdown code blocks if present
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.slice(7)
    }
    if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.slice(3)
    }
    if (cleanResponse.endsWith('```')) {
      cleanResponse = cleanResponse.slice(0, -3)
    }
    cleanResponse = cleanResponse.trim()
    
    const analysis = JSON.parse(cleanResponse) as WebsiteAnalysis
    
    // Validate and clamp scores
    analysis.overallScore = clampScore(analysis.overallScore)
    analysis.uiux.score = clampScore(analysis.uiux.score)
    analysis.seo.score = clampScore(analysis.seo.score)
    analysis.accessibility.score = clampScore(analysis.accessibility.score)
    analysis.performance.score = clampScore(analysis.performance.score)
    analysis.mobile.score = clampScore(analysis.mobile.score)
    analysis.design.score = clampScore(analysis.design.score)
    analysis.conversion.score = clampScore(analysis.conversion.score)

    // Recalculate overallScore as average of all categories for consistency
    const categoryAvg = Math.round(
      (analysis.uiux.score +
        analysis.seo.score +
        analysis.accessibility.score +
        analysis.performance.score +
        analysis.mobile.score +
        analysis.design.score +
        analysis.conversion.score) / 7
    )
    // Use the average if it differs significantly from the AI-provided overall
    if (Math.abs(analysis.overallScore - categoryAvg) > 10) {
      analysis.overallScore = categoryAvg
    }
    
    // Cache the result
    setCachedResult(url, roastMode, analysis)

    return analysis
  } catch (parseError) {
    console.error('Failed to parse AI response as JSON:', parseError)
    console.error('Raw response:', responseText.substring(0, 500))
    
    // Return a fallback analysis
    return {
      overallScore: 50,
      uiux: { score: 50, issues: ['Unable to fully parse AI response'], suggestions: ['Try analyzing again'] },
      seo: { score: 50, issues: ['Unable to fully parse AI response'], suggestions: ['Try analyzing again'] },
      accessibility: { score: 50, issues: ['Unable to fully parse AI response'], suggestions: ['Try analyzing again'] },
      performance: { score: 50, issues: ['Unable to fully parse AI response'], suggestions: ['Try analyzing again'] },
      mobile: { score: 50, issues: ['Unable to fully parse AI response'], suggestions: ['Try analyzing again'] },
      design: { score: 50, issues: ['Unable to fully parse AI response'], suggestions: ['Try analyzing again'] },
      conversion: { score: 50, issues: ['Unable to fully parse AI response'], suggestions: ['Try analyzing again'] },
      roast: responseText.substring(0, 300),
      finalVerdict: 'Analysis completed but with some parsing issues. The AI provided insights that could not be fully structured.'
    }
  }
}

function clampScore(score: number): number {
  if (typeof score !== 'number' || isNaN(score)) return 50
  return Math.max(0, Math.min(100, Math.round(score)))
}

// ─── AI-Powered Tech Stack Detection ────────────────────────────────────────

export interface AIDetectedTech {
  name: string
  category: string
  confidence: 'high' | 'medium' | 'low'
  version?: string
  evidence?: string
}

export async function detectTechStackAI(
  url: string,
  htmlContent: string,
  pageTitle: string,
  headers: Record<string, string> = {},
  scripts: string[] = [],
  meta: Record<string, string> = {},
  scanMode: 'quick' | 'deep' = 'deep'
): Promise<AIDetectedTech[]> {
  // Prepare a summary of the page data for the AI
  const headerSummary = Object.entries(headers)
    .filter(([k]) => !['set-cookie', 'cookie'].includes(k))
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  const scriptSummary = scripts
    .filter(s => !s.startsWith('inline:'))
    .slice(0, 30)
    .join('\n')

  const metaSummary = Object.entries(meta)
    .slice(0, 20)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  // Extract a focused sample of HTML for tech detection (key elements only)
  const headContent = htmlContent.match(/<head[\s\S]*?<\/head>/i)?.[0] || ''
  const bodyStart = htmlContent.match(/<body[\s\S]{0,5000}/i)?.[0] || ''
  const focusedHtml = (headContent + '\n' + bodyStart).substring(0, 12000)

  const isDeepScan = scanMode === 'deep'

  const systemPrompt = `You are an expert web technology stack analyzer. Your job is to identify the EXACT technologies, programming languages, frameworks, libraries, and tools used by a website by analyzing its HTML source code, HTTP headers, script URLs, and meta tags.

You must be VERY precise and specific. Only report technologies you are CONFIDENT about based on concrete evidence in the provided data.

Key detection strategies:
- **Frontend Languages**: HTML, CSS, JavaScript are always present. TypeScript can be inferred from .ts/.tsx file references in script URLs or __NEXT_DATA__ patterns. JSX is inferred from React patterns.
- **CSS Frameworks**: Tailwind CSS (utility classes like flex, p-4, bg-*, text-*), Bootstrap (container, row, col-*), Material UI (Mui* class names), Bulma, Foundation
- **Frontend Frameworks**: React (data-reactroot, react-dom scripts), Vue.js (data-v-*, v-cloak), Angular (ng-version, _nghost), Svelte (svelte-* classes), Next.js (__NEXT_DATA__, _next/static), Nuxt.js (__NUXT__), etc.
- **Backend Languages**: Python (csrfmiddlewaretoken → Django, gunicorn/uvicorn server headers), PHP (PHPSESSID cookie, .php URLs), Ruby (authenticity_token → Rails), Java (JSESSIONID), Go (Gin/Echo server headers), C#/ASP.NET (ASP.NET headers), Node.js (Express headers, connect.sid cookie), Rust, Elixir/Phoenix
- **Backend Frameworks**: Django, Flask, FastAPI, Laravel, Rails, Express, NestJS, Spring Boot, ASP.NET Core, Gin, etc.
- **CMS**: WordPress, Shopify, Webflow, Wix, Squarespace, Ghost, Drupal, Joomla, etc.
- **Analytics**: Google Analytics, Google Tag Manager, Facebook Pixel, Hotjar, Mixpanel, etc.
- **Hosting/CDN**: Cloudflare, Vercel, Netlify, AWS, GitHub Pages, etc.
- **Build Tools**: Vite, Webpack, Turbopack, esbuild, Rollup (inferred from script patterns)${isDeepScan ? `
- **Databases**: Look for Firebase SDK, Supabase client, Prisma client, MongoDB Realm, or other database-as-a-service SDKs in the scripts. Also infer from backend frameworks (Django→PostgreSQL/MySQL, Rails→PostgreSQL, Laravel→MySQL/PostgreSQL).
- **Infrastructure**: Look for container orchestration, serverless platforms (AWS Lambda, Vercel Edge), CI/CD indicators, monitoring SDKs (Sentry, Datadog), and authentication providers (Auth0, Clerk, NextAuth, Firebase Auth).
- **API & Networking**: Look for GraphQL clients (Apollo, urql), tRPC, REST API patterns, WebSocket libraries (Socket.io, Pusher), and real-time communication tools.` : `
- **Databases**: Cannot be directly detected from client-side. Only report if there is strong evidence (e.g., Firebase SDK, Supabase client).`}

Return ONLY valid JSON, no markdown, no code blocks.`

  const prompt = `Analyze this website and identify its technology stack:

URL: ${url}
Title: ${pageTitle}

HTTP Headers:
${headerSummary || 'None provided'}

Script URLs:
${scriptSummary || 'None found'}

Meta Tags:
${metaSummary || 'None found'}

HTML Source (key sections):
${focusedHtml}

Based on the evidence above, identify ALL technologies used. Return a JSON object:
{
  "technologies": [
    {
      "name": "Technology Name",
      "category": "frontend-language|frontend-framework|backend-language|backend-framework|cms-ecommerce|js-library|css-framework|analytics|hosting-cloud|build-tool|database|security|seo|performance|api-network|auth|monitoring",
      "confidence": "high|medium|low",
      "version": "version string or null",
      "evidence": "what evidence led to this detection"
    }
  ]
}

IMPORTANT RULES:
1. Always include HTML, CSS, and JavaScript as frontend languages if present
2. Be SPECIFIC about which CSS framework (e.g., "Tailwind CSS" not just "CSS Framework")
3. For backend languages, only report if you have EVIDENCE (headers, cookies, HTML patterns, framework signatures)
4. If Next.js is detected, also list React as its foundation
5. If Nuxt.js is detected, also list Vue.js as its foundation
6. Include version numbers when detectable from headers or script URLs
7. For WordPress sites, also detect PHP as the backend language
8. For Django/Rails/Laravel sites, also detect Python/Ruby/PHP as the backend language
9. Don't guess — only report technologies with at least medium confidence
10. Separate frameworks from languages (e.g., React is a framework, JavaScript is the language)
11. Look at CSS class patterns carefully for Tailwind, Bootstrap, Material UI
12. Check script URLs for CDN patterns that reveal libraries${isDeepScan ? `
13. CRITICAL: Also detect BACKEND technologies — look for server headers, cookies (PHPSESSID, JSESSIONID, csrfmiddlewaretoken), and framework signatures
14. CRITICAL: Also detect DATABASE technologies — look for SDK imports (Firebase, Supabase, Prisma, MongoDB) and infer from backend frameworks
15. CRITICAL: Also detect INFRASTRUCTURE — look for CDN headers, hosting indicators, monitoring SDKs (Sentry, Datadog, New Relic), and auth providers
16. CRITICAL: Also detect API technologies — look for GraphQL clients, tRPC patterns, REST API routes, WebSocket libraries
17. Provide MORE technologies than a basic scan would — this is a deep scan, so be thorough
18. Include at least 8-15 technologies if the evidence supports it` : `
13. Focus on frontend and CSS technologies that are clearly visible in the HTML
14. Only include backend technologies if there is very strong evidence (explicit headers or cookies)`}`

  try {
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ]

    const completion = await createChatCompletion({
      messages,
      temperature: 0.1,
      maxTokens: 2000,
    })

    const responseText = completion.content
    let cleanResponse = responseText.trim()
    if (cleanResponse.startsWith('```json')) cleanResponse = cleanResponse.slice(7)
    if (cleanResponse.startsWith('```')) cleanResponse = cleanResponse.slice(3)
    if (cleanResponse.endsWith('```')) cleanResponse = cleanResponse.slice(0, -3)
    cleanResponse = cleanResponse.trim()

    const parsed = JSON.parse(cleanResponse)
    if (Array.isArray(parsed.technologies)) {
      return parsed.technologies
        .filter((t: { name?: string; category?: string; confidence?: string }) => t.name && t.category && t.confidence)
        .map((t: { name: string; category: string; confidence: string; version?: string; evidence?: string }) => ({
          name: String(t.name).substring(0, 100),
          category: String(t.category).substring(0, 50),
          confidence: ['high', 'medium', 'low'].includes(t.confidence) ? t.confidence as 'high' | 'medium' | 'low' : 'low',
          version: t.version && t.version !== 'null' ? String(t.version).substring(0, 30) : undefined,
          evidence: t.evidence ? String(t.evidence).substring(0, 200) : undefined,
        }))
    }

    return []
  } catch (error) {
    console.error('AI tech detection error:', error)
    return []
  }
}
