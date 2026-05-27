import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { detectTechStackAI, fetchWebsiteContent, type AIDetectedTech } from '@/lib/ai-service'
import { createChatCompletion, type ChatMessage } from '@/lib/llm-client'
import {
  TECH_RULES,
  CATEGORY_META,
  type DetectionPattern,
  type Confidence,
  type TechCategory,
} from '@/lib/tech-detection-rules'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DetectedTech {
  id: string
  name: string
  category: TechCategory
  icon: string
  confidence: Confidence
  version: string | null
  patterns: string[]
  description?: string
  source?: 'regex' | 'ai' | 'merged'
}

export interface Insight {
  type: 'security' | 'performance' | 'recommendation' | 'info'
  title: string
  description: string
  severity: 'high' | 'medium' | 'low'
}

interface PageData {
  html: string
  headers: Record<string, string>
  url: string
  scripts: string[]
  meta: Record<string, string>
  css: string[]
  cookies: string[]
  extraPathsChecked?: string[]
}

interface ScanResult {
  url: string
  domain: string
  technologies: DetectedTech[]
  categories: Record<string, {
    label: string
    icon: string
    color: string
    techs: DetectedTech[]
  }>
  insights: Insight[]
  modernScore: number
  scanMode: 'quick' | 'deep'
  scanTime: number
  totalTechnologies: number
  detectionMethod: 'regex' | 'ai' | 'hybrid'
}

// ─── In-Memory Cache ────────────────────────────────────────────────────────

interface CacheEntry {
  result: ScanResult
  timestamp: number
}

const scanCache: Map<string, CacheEntry> = new Map()
const CACHE_TTL_MS = 2 * 60 * 60 * 1000 // 2 hours
const CACHE_MAX_SIZE = 100

function getCachedResult(cacheKey: string): ScanResult | null {
  const entry = scanCache.get(cacheKey)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    scanCache.delete(cacheKey)
    return null
  }
  return entry.result
}

function setCachedResult(cacheKey: string, result: ScanResult): void {
  if (scanCache.size >= CACHE_MAX_SIZE) {
    const oldest = [...scanCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)
    for (let i = 0; i < Math.floor(CACHE_MAX_SIZE / 4); i++) {
      if (oldest[i]) scanCache.delete(oldest[i][0])
    }
  }
  scanCache.set(cacheKey, { result, timestamp: Date.now() })
}

// ─── Rate Limiting ──────────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimits: Map<string, RateLimitEntry> = new Map()
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_ANONYMOUS = 5
const RATE_LIMIT_AUTHENTICATED = 15

function checkRateLimit(ip: string, isAuthenticated: boolean): { allowed: boolean; remaining: number } {
  const limit = isAuthenticated ? RATE_LIMIT_AUTHENTICATED : RATE_LIMIT_ANONYMOUS
  const now = Date.now()

  const entry = rateLimits.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true, remaining: limit - 1 }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count }
}

// ─── URL Validation ─────────────────────────────────────────────────────────

function isValidUrl(url: string): { valid: boolean; normalizedUrl?: string; domain?: string; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' }
  }

  const trimmed = url.trim()
  if (!trimmed) {
    return { valid: false, error: 'URL cannot be empty' }
  }

  const urlWithProtocol = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`

  let parsedUrl: URL
  try {
    parsedUrl = new URL(urlWithProtocol)
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return { valid: false, error: 'Only HTTP and HTTPS URLs are supported' }
  }

  const hostname = parsedUrl.hostname
  if (!hostname || !hostname.includes('.')) {
    return { valid: false, error: 'Invalid domain name' }
  }

  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.')) {
    return { valid: false, error: 'Cannot scan internal or localhost URLs' }
  }

  return {
    valid: true,
    normalizedUrl: `${parsedUrl.protocol}//${hostname}${parsedUrl.pathname !== '/' ? parsedUrl.pathname : ''}`,
    domain: hostname,
  }
}

// ─── Fetch with Timeout ────────────────────────────────────────────────────

async function fetchWithTimeout(url: string, timeoutMs: number, options?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TechStackAnalyzer/1.0; +https://techanalyzer.dev)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        ...options?.headers,
      },
    })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

// ─── Extract Page Data from HTML ────────────────────────────────────────────

function extractPageData(html: string, headers: Record<string, string>, url: string): PageData {
  const scripts: string[] = []
  const meta: Record<string, string> = {}
  const css: string[] = []

  // Extract script sources
  const scriptSrcRegex = /<script[^>]+src=["']([^"']+)["']/gi
  let match: RegExpExecArray | null
  while ((match = scriptSrcRegex.exec(html)) !== null) {
    scripts.push(match[1])
  }

  // Extract inline script content (first 500 chars of each for analysis)
  const inlineScriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi
  while ((match = inlineScriptRegex.exec(html)) !== null) {
    const content = match[1].trim()
    if (content && content.length > 10) {
      scripts.push(`inline:${content.substring(0, 500)}`)
    }
  }

  // Extract meta tags
  const metaRegex = /<meta[^>]+>/gi
  while ((match = metaRegex.exec(html)) !== null) {
    const metaTag = match[0]
    const nameMatch = metaTag.match(/name=["']([^"']+)["']/i) || metaTag.match(/property=["']([^"']+)["']/i)
    const contentMatch = metaTag.match(/content=["']([^"']*?)["']/i)
    if (nameMatch && contentMatch) {
      meta[nameMatch[1]] = contentMatch[1]
    }
    const httpEquivMatch = metaTag.match(/http-equiv=["']([^"']+)["']/i)
    if (httpEquivMatch && contentMatch) {
      meta[httpEquivMatch[1]] = contentMatch[1]
    }
  }

  // Extract CSS links
  const cssLinkRegex = /<link[^>]+href=["']([^"']*\.css[^"']*)["']/gi
  while ((match = cssLinkRegex.exec(html)) !== null) {
    css.push(match[1])
  }

  // Extract inline style content
  const inlineStyleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi
  while ((match = inlineStyleRegex.exec(html)) !== null) {
    const content = match[1].trim()
    if (content) {
      css.push(`inline:${content.substring(0, 300)}`)
    }
  }

  // Extract cookies from Set-Cookie headers
  const cookies: string[] = []
  const setCookie = headers['set-cookie']
  if (setCookie) {
    const cookieStrings = Array.isArray(setCookie) ? setCookie : [setCookie]
    for (const c of cookieStrings) {
      const cookieName = c.split('=')[0]?.trim()
      if (cookieName) cookies.push(cookieName)
    }
  }

  return { html, headers, url, scripts, meta, css, cookies }
}

// ─── Fetch Website Data ────────────────────────────────────────────────────

async function fetchWebsiteData(url: string, scanMode: 'quick' | 'deep'): Promise<PageData> {
  const timeoutMs = scanMode === 'deep' ? 20000 : 8000

  const response = await fetchWithTimeout(url, timeoutMs)

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const html = await response.text()

  // Extract headers
  const setCookieHeaders: string[] = []
  const allHeaders: Record<string, string> = {}
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      setCookieHeaders.push(value)
    }
    allHeaders[key.toLowerCase()] = value
  })
  if (setCookieHeaders.length > 0) {
    allHeaders['set-cookie'] = setCookieHeaders.join('; ')
  }

  const pageData = extractPageData(html, allHeaders, url)

  // For deep scan, also check additional paths
  if (scanMode === 'deep') {
    pageData.extraPathsChecked = []
    const baseUrl = new URL(url)
    const extraPaths = ['/robots.txt', '/sitemap.xml', '/favicon.ico', '/.well-known/security.txt']

    for (const path of extraPaths) {
      try {
        const extraUrl = `${baseUrl.protocol}//${baseUrl.hostname}${path}`
        const extraResponse = await fetchWithTimeout(extraUrl, 5000)
        if (extraResponse.ok) {
          const extraText = await extraResponse.text()
          pageData.html += `\n<!-- ${path} content -->\n${extraText.substring(0, 2000)}`
          pageData.extraPathsChecked.push(path)
        }
      } catch {
        // Silently ignore errors for extra paths
      }
    }
  }

  return pageData
}

// ─── Regex-Based Technology Detection Engine ────────────────────────────────

function getSearchContent(patternType: DetectionPattern['type'], pageData: PageData): { content: string; label: string } {
  switch (patternType) {
    case 'html':
      return { content: pageData.html, label: 'html' }
    case 'script':
      return { content: pageData.scripts.join('\n'), label: 'script' }
    case 'meta':
      return { content: Object.entries(pageData.meta).map(([k, v]) => `${k}: ${v}`).join('\n'), label: 'meta' }
    case 'header':
      return { content: Object.entries(pageData.headers).map(([k, v]) => `${k}: ${v}`).join('\n'), label: 'header' }
    case 'cookie':
      return { content: pageData.cookies.join('\n'), label: 'cookie' }
    case 'css':
      return { content: pageData.css.join('\n'), label: 'css' }
    case 'url':
      return { content: pageData.url, label: 'url' }
    case 'js-global':
      // js-global patterns are checked against inline scripts (best we can do server-side)
      return { content: pageData.scripts.filter(s => s.startsWith('inline:')).join('\n'), label: 'js-global' }
    default:
      return { content: '', label: '' }
  }
}

function matchPattern(pattern: DetectionPattern, pageData: PageData, ruleVersionRegex?: string): { matched: boolean; version: string | null; matchDetail: string } {
  const { content, label } = getSearchContent(pattern.type, pageData)

  if (!content) {
    return { matched: false, version: null, matchDetail: '' }
  }

  try {
    const regex = new RegExp(pattern.regex, 'i')
    const match = regex.exec(content)

    if (!match) {
      return { matched: false, version: null, matchDetail: '' }
    }

    // Try to extract version - first from pattern-level versionRegex, then from rule-level
    let version: string | null = null
    const versionRegexStr = pattern.versionRegex || ruleVersionRegex
    if (versionRegexStr) {
      try {
        const versionRegex = new RegExp(versionRegexStr, 'i')
        const versionMatch = versionRegex.exec(content)
        if (versionMatch && versionMatch[1]) {
          version = versionMatch[1]
        }
      } catch {
        // Invalid version regex, ignore
      }
    }

    const matchSnippet = match[0].substring(0, 100)
    const matchDetail = `${label}: ${matchSnippet}`

    return { matched: true, version, matchDetail }
  } catch {
    // Invalid regex pattern, skip
    return { matched: false, version: null, matchDetail: '' }
  }
}

function detectTechnologies(pageData: PageData, scanMode: 'quick' | 'deep'): DetectedTech[] {
  const detected: DetectedTech[] = []
  const detectedIds = new Set<string>()

  for (const rule of TECH_RULES) {
    if (detectedIds.has(rule.id)) continue

    let bestConfidence: Confidence = 'low'
    let bestVersion: string | null = null
    const matchedPatterns: string[] = []

    // Get rule-level versionRegex if it exists
    const ruleVersionRegex = (rule as Record<string, unknown>).versionRegex as string | undefined

    for (const pattern of rule.patterns) {
      const result = matchPattern(pattern, pageData, ruleVersionRegex)

      if (result.matched) {
        matchedPatterns.push(result.matchDetail)

        // Upgrade confidence based on pattern's confidence level
        const patternConfidence = pattern.confidence
        if (patternConfidence === 'high') {
          bestConfidence = 'high'
        } else if (patternConfidence === 'medium' && bestConfidence !== 'high') {
          bestConfidence = 'medium'
        }

        if (result.version && !bestVersion) {
          bestVersion = result.version
        }
      }
    }

    if (matchedPatterns.length === 0) continue

    // Multiple pattern matches boost confidence
    if (matchedPatterns.length >= 2 && bestConfidence === 'low') {
      bestConfidence = 'medium'
    }
    if (matchedPatterns.length >= 3) {
      bestConfidence = 'high'
    }

    // ── Quick scan: cap confidence at 'medium' and skip low-confidence detections ──
    // Quick scan is regex-only and faster, so we lower certainty
    if (scanMode === 'quick') {
      // Cap confidence: 'high' → 'medium', 'medium' stays, 'low' is excluded
      if (bestConfidence === 'high') {
        bestConfidence = 'medium'
      }
      // Skip low-confidence detections entirely in quick scan
      if (bestConfidence === 'low') continue
    }

    detectedIds.add(rule.id)
    detected.push({
      id: rule.id,
      name: rule.name,
      category: rule.category,
      icon: rule.icon,
      confidence: bestConfidence,
      version: bestVersion,
      patterns: matchedPatterns,
      description: rule.description,
      source: 'regex',
    })
  }

  return detected
}

// ─── AI + Regex Merge Logic ────────────────────────────────────────────────

// Map AI category strings to our TechCategory type
function mapAICategory(aiCategory: string): TechCategory {
  const normalized = aiCategory.toLowerCase().trim()

  const categoryMap: Record<string, TechCategory> = {
    'frontend-language': 'frontend-language',
    'frontend-framework': 'frontend-framework',
    'css-framework': 'css-framework',
    'backend-language': 'backend-language',
    'backend-framework': 'backend-framework',
    'cms-ecommerce': 'cms-ecommerce',
    'database': 'database',
    'hosting-cloud': 'hosting-cloud',
    'js-library': 'js-library',
    'api-network': 'api-network',
    'build-tool': 'build-tool',
    'cicd': 'cicd',
    'analytics': 'analytics',
    'security': 'security',
    'seo': 'seo',
    'performance': 'performance',
    'ai-ml': 'ai-ml',
    'web3': 'web3',
    'realtime': 'realtime',
    'headless-cms': 'headless-cms',
    'auth': 'auth',
    'monitoring': 'monitoring',
    // Common variations from AI output
    'css': 'css-framework',
    'styling': 'css-framework',
    'ui-library': 'css-framework',
    'ui-framework': 'css-framework',
    'component-library': 'css-framework',
    'language': 'frontend-language',
    'framework': 'frontend-framework',
    'backend': 'backend-framework',
    'frontend': 'frontend-framework',
    'cdn': 'hosting-cloud',
    'hosting': 'hosting-cloud',
    'cloud': 'hosting-cloud',
    'library': 'js-library',
    'javascript-library': 'js-library',
    'cms': 'cms-ecommerce',
    'ecommerce': 'cms-ecommerce',
    'e-commerce': 'cms-ecommerce',
  }

  return categoryMap[normalized] || 'js-library'
}

// Get icon for an AI-detected technology
function getTechIcon(name: string, category: TechCategory): string {
  const nameLower = name.toLowerCase()

  // Check for exact name matches first
  const iconMap: Record<string, string> = {
    'html': '📄', 'css': '🎨', 'javascript': '🟨', 'typescript': '🔷', 'jsx': '⟐',
    'react': '⚛️', 'vue.js': '💚', 'vue': '💚', 'angular': '🅰️', 'svelte': '🔥',
    'next.js': '▲', 'nuxt.js': '💚', 'nuxt': '💚', 'gatsby': '💜', 'remix': '💿',
    'astro': '🚀', 'tailwind css': '🌊', 'tailwind': '🌊', 'bootstrap': '🅱️',
    'material ui': '🎨', 'mui': '🎨', 'chakra ui': '⚡', 'ant design': '🐜',
    'node.js': '🟩', 'node': '🟩', 'php': '🐘', 'python': '🐍', 'java': '☕',
    'ruby': '♦️', 'go': '🔵', 'golang': '🔵', 'c#': '🟣', 'csharp': '🟣',
    'rust': '🦀', 'elixir': '🧪', 'kotlin': '🟠', 'deno': '🦕', 'bun': '🍞',
    'express': '🚂', 'nestjs': '🐱', 'django': '🎸', 'flask': '🍶', 'fastapi': '🚀',
    'laravel': '🔴', 'rails': '🛤️', 'ruby on rails': '🛤️', 'spring boot': '🍃',
    'wordpress': '📝', 'shopify': '🛍️', 'webflow': '🌐', 'wix': '✨',
    'squarespace': '⬛', 'ghost': '👻', 'drupal': '💧', 'joomla': '🤖',
    'firebase': '🔥', 'supabase': '⚡', 'mongodb': '🍃', 'mysql': '🐬',
    'postgresql': '🐘', 'redis': '🔴', 'cloudflare': '☁️', 'vercel': '▲',
    'netlify': '🌐', 'aws': '☁️', 'google analytics': '📊', 'google tag manager': '📊',
    'facebook pixel': '📘', 'hotjar': '🌡️', 'jquery': '📊', 'three.js': '🎮',
    'd3.js': '📊', 'gsap': '🎬', 'webpack': '📦', 'vite': '⚡', 'esbuild': '⚡',
    'graphql': '◈', 'rest api': '🌐', 'stripe': '💳', 'auth0': '🔑',
    'firebase auth': '🔑', 'clerk': '🔑', 'nextauth': '🔑',
    'sass': '🎀', 'scss': '🎭', 'less': '📉', 'postcss': '🎨',
    'bulma': '🟢', 'foundation': '🔷', 'semantic ui': '💠',
    'prisma': '🔷', 'trpc': '📞', 'supabase': '⚡',
  }

  // Check exact match
  if (iconMap[nameLower]) return iconMap[nameLower]

  // Check partial match
  for (const [key, icon] of Object.entries(iconMap)) {
    if (nameLower.includes(key) || key.includes(nameLower)) return icon
  }

  // Fallback to category icon
  const catMeta = CATEGORY_META[category]
  return catMeta?.icon || '📦'
}

// Generate a slug ID from a technology name
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50)
}

// Merge AI-detected technologies with regex-detected ones
function mergeDetections(regexTechs: DetectedTech[], aiTechs: AIDetectedTech[]): DetectedTech[] {
  const merged: DetectedTech[] = []
  const seenIds = new Set<string>()
  const seenNames = new Map<string, DetectedTech>() // lowercase name → tech

  // Add all regex-detected techs first (they have more structured data)
  for (const tech of regexTechs) {
    merged.push(tech)
    seenIds.add(tech.id)
    seenNames.set(tech.name.toLowerCase(), tech)
  }

  // Add AI-detected techs that aren't already detected by regex
  for (const aiTech of aiTechs) {
    const aiNameLower = aiTech.name.toLowerCase()
    const aiId = slugify(aiTech.name)
    const category = mapAICategory(aiTech.category)

    // Skip if already detected by regex (same id or same name)
    if (seenIds.has(aiId)) continue
    if (seenNames.has(aiNameLower)) {
      // Already detected — but boost confidence if AI also detected it
      const existing = seenNames.get(aiNameLower)!
      if (existing.confidence === 'low' && aiTech.confidence !== 'low') {
        existing.confidence = aiTech.confidence as Confidence
      }
      if (aiTech.confidence === 'high' && existing.confidence !== 'high') {
        existing.confidence = 'high'
      }
      // Update version if AI has one and regex doesn't
      if (aiTech.version && !existing.version) {
        existing.version = aiTech.version
      }
      existing.source = 'merged'
      continue
    }

    // Also check for similar names (e.g., "Next.js" vs "NextJS")
    let foundSimilar = false
    for (const [existingName, existingTech] of seenNames.entries()) {
      if (
        existingName.includes(aiNameLower) ||
        aiNameLower.includes(existingName) ||
        existingName.replace(/[\s._-]/g, '') === aiNameLower.replace(/[\s._-]/g, '')
      ) {
        // Similar name found — boost confidence
        if (aiTech.confidence === 'high') {
          existingTech.confidence = 'high'
        }
        if (aiTech.version && !existingTech.version) {
          existingTech.version = aiTech.version
        }
        existingTech.source = 'merged'
        foundSimilar = true
        break
      }
    }

    if (foundSimilar) continue

    // New technology from AI — add it
    const newTech: DetectedTech = {
      id: aiId,
      name: aiTech.name,
      category,
      icon: getTechIcon(aiTech.name, category),
      confidence: aiTech.confidence as Confidence,
      version: aiTech.version || null,
      patterns: aiTech.evidence ? [`ai: ${aiTech.evidence}`] : ['ai: detected by AI analysis'],
      source: 'ai',
    }

    merged.push(newTech)
    seenIds.add(aiId)
    seenNames.set(aiNameLower, newTech)
  }

  return merged
}

// ─── Insights Generation ───────────────────────────────────────────────────

function generateInsights(techs: DetectedTech[], headers: Record<string, string>): Insight[] {
  const insights: Insight[] = []
  const techIds = new Set(techs.map(t => t.id))
  const techCategories = new Set(techs.map(t => t.category))

  // ── Security Insights ──────────────────────────────────────────────────

  if (!headers['strict-transport-security']) {
    insights.push({
      type: 'security',
      title: 'Missing HSTS Header',
      description: 'The Strict-Transport-Security header is not set. This makes the site vulnerable to protocol downgrade attacks and cookie hijacking. Add the HSTS header to enforce HTTPS connections.',
      severity: 'high',
    })
  }

  if (!headers['content-security-policy']) {
    insights.push({
      type: 'security',
      title: 'Missing Content Security Policy',
      description: 'No Content-Security-Policy header detected. CSP helps prevent XSS attacks by controlling which resources can be loaded. Implement a strict CSP to enhance security.',
      severity: 'high',
    })
  }

  if (!headers['x-frame-options']) {
    insights.push({
      type: 'security',
      title: 'Missing X-Frame-Options Header',
      description: 'The X-Frame-Options header is not set, making the site potentially vulnerable to clickjacking attacks. Set this header to DENY or SAMEORIGIN.',
      severity: 'medium',
    })
  }

  if (!headers['x-content-type-options']) {
    insights.push({
      type: 'security',
      title: 'Missing X-Content-Type-Options Header',
      description: 'The X-Content-Type-Options header is not set. Without "nosniff", browsers may MIME-type sniff responses, potentially executing malicious content.',
      severity: 'low',
    })
  }

  // Old jQuery version
  if (techIds.has('jquery')) {
    const jqueryTech = techs.find(t => t.id === 'jquery')
    if (jqueryTech?.version) {
      const majorVersion = parseInt(jqueryTech.version.split('.')[0], 10)
      if (majorVersion < 3) {
        insights.push({
          type: 'security',
          title: `Outdated jQuery ${jqueryTech.version}`,
          description: `jQuery ${jqueryTech.version} is outdated and has known security vulnerabilities. Upgrade to jQuery 3.x or later for security patches and performance improvements.`,
          severity: 'high',
        })
      } else if (majorVersion === 3) {
        const minorVersion = parseInt(jqueryTech.version.split('.')[1], 10)
        if (minorVersion < 7) {
          insights.push({
            type: 'security',
            title: `jQuery ${jqueryTech.version} could be updated`,
            description: `jQuery ${jqueryTech.version} is functional but may miss recent security patches. Consider updating to the latest 3.x version.`,
            severity: 'low',
          })
        }
      }
    }
  }

  // Server header exposing version
  const serverHeader = headers['server']
  if (serverHeader && /\d+\.\d+/.test(serverHeader)) {
    insights.push({
      type: 'security',
      title: 'Server Version Exposed',
      description: `The server header reveals version information: "${serverHeader}". This can help attackers identify vulnerabilities specific to that version. Consider hiding the server version.`,
      severity: 'medium',
    })
  }

  // X-Powered-By exposing tech
  if (headers['x-powered-by']) {
    insights.push({
      type: 'security',
      title: 'Technology Exposed via X-Powered-By',
      description: `The X-Powered-By header reveals: "${headers['x-powered-by']}". This header provides attackers with information about your technology stack. Remove it for better security through obscurity.`,
      severity: 'medium',
    })
  }

  // ── Performance Insights ───────────────────────────────────────────────

  const analyticsTechs = techs.filter(t => t.category === 'analytics')
  if (analyticsTechs.length > 3) {
    insights.push({
      type: 'performance',
      title: `${analyticsTechs.length} Analytics Tools Detected`,
      description: `The site uses ${analyticsTechs.length} analytics tools (${analyticsTechs.map(t => t.name).join(', ')}). Each adds page weight and latency. Consider consolidating to reduce overhead and improve page load times.`,
      severity: 'medium',
    })
  }

  // jQuery in modern stack
  if (techIds.has('jquery')) {
    const hasModernFramework = techIds.has('react') || techIds.has('vuejs') || techIds.has('angular') || techIds.has('svelte')
    if (hasModernFramework) {
      insights.push({
        type: 'performance',
        title: 'jQuery with Modern Framework',
        description: 'jQuery is used alongside a modern frontend framework. This adds unnecessary weight (~30KB gzipped) and can conflict with framework DOM management. Consider removing jQuery and using framework-native solutions.',
        severity: 'low',
      })
    }
  }

  // Old Bootstrap
  if (techIds.has('bootstrap')) {
    const bootstrapTech = techs.find(t => t.id === 'bootstrap')
    if (bootstrapTech?.version) {
      const majorVersion = parseInt(bootstrapTech.version.split('.')[0], 10)
      if (majorVersion < 5) {
        insights.push({
          type: 'performance',
          title: `Bootstrap ${bootstrapTech.version} is outdated`,
          description: `Bootstrap ${bootstrapTech.version} depends on jQuery and is no longer actively maintained. Consider upgrading to Bootstrap 5+ (no jQuery dependency) or switching to a utility-first CSS framework.`,
          severity: 'low',
        })
      }
    }
  }

  // ── Recommendations ────────────────────────────────────────────────────

  if (!techIds.has('pwa')) {
    insights.push({
      type: 'recommendation',
      title: 'Consider Adding PWA Support',
      description: 'No Progressive Web App features detected. Adding a service worker, web manifest, and offline support can significantly improve user experience and engagement, especially on mobile devices.',
      severity: 'low',
    })
  }

  if (!techIds.has('open-graph')) {
    insights.push({
      type: 'recommendation',
      title: 'Add Open Graph Meta Tags',
      description: 'No Open Graph metadata detected. OG tags control how your site appears when shared on social media (Facebook, LinkedIn, etc.). Add og:title, og:description, and og:image for better social sharing.',
      severity: 'low',
    })
  }

  if (!techIds.has('structured-data')) {
    insights.push({
      type: 'recommendation',
      title: 'Add Structured Data (Schema.org)',
      description: 'No structured data detected. Schema.org markup helps search engines understand your content and can enable rich snippets in search results, improving click-through rates.',
      severity: 'low',
    })
  }

  if (techIds.has('wordpress') && !techCategories.has('performance')) {
    insights.push({
      type: 'recommendation',
      title: 'Add a CDN for WordPress',
      description: 'WordPress is detected without a CDN. A content delivery network like Cloudflare can significantly improve page load times, reduce server load, and add DDoS protection.',
      severity: 'medium',
    })
  }

  // ── Info Insights ──────────────────────────────────────────────────────

  const hasModernFrontend = techIds.has('react') || techIds.has('vuejs') || techIds.has('angular') || techIds.has('svelte')
  const hasMetaFramework = techIds.has('nextjs') || techIds.has('nuxtjs') || techIds.has('astro') || techIds.has('remix')

  if (hasModernFrontend && !hasMetaFramework) {
    insights.push({
      type: 'info',
      title: 'Modern Frontend Without Meta-Framework',
      description: 'A modern frontend framework is used without a meta-framework (Next.js, Nuxt, etc.). Consider adopting one for server-side rendering, routing, and better performance out of the box.',
      severity: 'low',
    })
  }

  if (hasMetaFramework) {
    const metaFramework = techs.find(t => ['nextjs', 'nuxtjs', 'astro', 'remix', 'gatsby'].includes(t.id))
    if (metaFramework) {
      insights.push({
        type: 'info',
        title: `Using ${metaFramework.name}`,
        description: `${metaFramework.name} provides server-side rendering, optimized routing, and built-in performance features. This is a modern approach to web development.`,
        severity: 'low',
      })
    }
  }

  const cdnTechs = techs.filter(t => t.category === 'performance')
  if (cdnTechs.length > 0) {
    insights.push({
      type: 'info',
      title: `CDN in Use: ${cdnTechs.map(t => t.name).join(', ')}`,
      description: 'A content delivery network is active, which helps deliver content faster to users worldwide and provides additional security features.',
      severity: 'low',
    })
  }

  if (techs.length > 20) {
    insights.push({
      type: 'info',
      title: 'Heavy Technology Stack',
      description: `${techs.length} technologies detected. A large number of third-party tools can impact page load performance and increase attack surface. Regularly audit and remove unused tools.`,
      severity: 'low',
    })
  }

  return insights
}

// ─── Modern Stack Score Calculation ─────────────────────────────────────────

function calculateModernScore(techs: DetectedTech[], headers: Record<string, string>, insights: Insight[]): number {
  let score = 50

  const techIds = new Set(techs.map(t => t.id))

  // ── Bonuses ──────────────────────────────────────────────────────────

  if (['react', 'vuejs', 'angular', 'svelte'].some(id => techIds.has(id))) score += 10
  if (['nextjs', 'nuxtjs', 'astro', 'remix', 'gatsby'].some(id => techIds.has(id))) score += 10
  if (techIds.has('vite') || techIds.has('esbuild') || techIds.has('turbopack')) score += 5
  if (techs.some(t => t.category === 'performance')) score += 5
  if (headers['strict-transport-security']) score += 5
  if (headers['content-security-policy']) score += 5
  if (headers['x-frame-options']) score += 2
  if (techIds.has('pwa')) score += 3
  if (techIds.has('tailwindcss')) score += 3
  if (techIds.has('typescript')) score += 3
  if (techIds.has('structured-data')) score += 2
  if (techIds.has('open-graph')) score += 2

  // ── Penalties ────────────────────────────────────────────────────────

  if (techIds.has('jquery')) {
    const jqueryTech = techs.find(t => t.id === 'jquery')
    if (jqueryTech?.version) {
      const major = parseInt(jqueryTech.version.split('.')[0], 10)
      if (major < 3) score -= 10
      else score -= 3
    } else {
      score -= 3
    }
  }

  if (techIds.has('bootstrap')) {
    const bootstrapTech = techs.find(t => t.id === 'bootstrap')
    if (bootstrapTech?.version) {
      const major = parseInt(bootstrapTech.version.split('.')[0], 10)
      if (major < 5) score -= 5
    }
  }

  if (!headers['strict-transport-security']) score -= 5
  if (!headers['content-security-policy']) score -= 5
  if (!headers['x-frame-options']) score -= 2
  if (headers['server'] && /\d+\.\d+/.test(headers['server'])) score -= 3
  if (headers['x-powered-by']) score -= 2

  const analyticsCount = techs.filter(t => t.category === 'analytics').length
  if (analyticsCount > 3) score -= 5

  const highSeverityInsights = insights.filter(i => i.severity === 'high').length
  score -= highSeverityInsights * 3

  const mediumSeverityInsights = insights.filter(i => i.severity === 'medium').length
  score -= mediumSeverityInsights

  return Math.max(0, Math.min(100, Math.round(score)))
}

// ─── AI-Enhanced Insights (Optional Enhancement) ──────────────────────────

async function generateAIInsights(techs: DetectedTech[], url: string): Promise<Insight[]> {
  try {
    const AI_TIMEOUT_MS = 8000

    const result = await Promise.race([
      (async () => {
        const techList = techs.map(t => `${t.name} (${t.category}${t.version ? ` v${t.version}` : ''}, confidence: ${t.confidence})`).join('\n')

        const systemPrompt = `You are a technology stack analyst. Analyze the detected technologies and provide additional insights. Return ONLY valid JSON, no markdown or code blocks.`

        const prompt = `Analyze this tech stack for ${url}:

${techList}

Provide 2-4 additional insights about this tech stack. Focus on:
1. Technology combinations that are particularly good or problematic
2. Missing technologies that would benefit the site
3. Architecture observations

Return JSON only:
{
  "insights": [
    {
      "type": "security" | "performance" | "recommendation" | "info",
      "title": "short title",
      "description": "1-2 sentence description",
      "severity": "high" | "medium" | "low"
    }
  ]
}`

        const completion = await createChatCompletion({
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
          temperature: 0.3,
          maxTokens: 1000,
        })

        const responseText = completion.content
        let cleanResponse = responseText.trim()
        if (cleanResponse.startsWith('```json')) cleanResponse = cleanResponse.slice(7)
        if (cleanResponse.startsWith('```')) cleanResponse = cleanResponse.slice(3)
        if (cleanResponse.endsWith('```')) cleanResponse = cleanResponse.slice(0, -3)
        cleanResponse = cleanResponse.trim()

        const parsed = JSON.parse(cleanResponse)
        if (Array.isArray(parsed.insights)) {
          return parsed.insights.filter(
            (i: { type?: string; title?: string; description?: string; severity?: string }) =>
              i.type && i.title && i.description && i.severity
          ).map((i: { type: string; title: string; description: string; severity: string }) => ({
            type: ['security', 'performance', 'recommendation', 'info'].includes(i.type) ? i.type as Insight['type'] : 'info',
            title: String(i.title).substring(0, 200),
            description: String(i.description).substring(0, 500),
            severity: ['high', 'medium', 'low'].includes(i.severity) ? i.severity as Insight['severity'] : 'low',
          }))
        }

        return [] as Insight[]
      })(),
      new Promise<Insight[]>(resolve => setTimeout(() => resolve([]), AI_TIMEOUT_MS)),
    ])

    return result
  } catch {
    return []
  }
}

// ─── Build Categorized Result ──────────────────────────────────────────────

function buildCategorizedResult(techs: DetectedTech[]): ScanResult['categories'] {
  const categories: ScanResult['categories'] = {}

  for (const tech of techs) {
    const catMeta = CATEGORY_META[tech.category]
    if (!catMeta) continue

    if (!categories[tech.category]) {
      categories[tech.category] = {
        label: catMeta.label,
        icon: catMeta.icon,
        color: catMeta.color,
        techs: [],
      }
    }
    categories[tech.category].techs.push(tech)
  }

  return categories
}

// ─── POST Handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // ── Rate Limiting ────────────────────────────────────────────────────
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    const session = await getServerSession(authOptions)
    const isAuthenticated = !!session?.user?.id
    const rateCheck = checkRateLimit(ip, isAuthenticated)

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment before trying again.', retryAfter: 60 },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }

    // ── Parse Request Body ───────────────────────────────────────────────
    let body: { url?: string; scanMode?: string; html?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body. Please provide a JSON object with "url" and optional "scanMode".' },
        { status: 400 }
      )
    }

    const { url, scanMode: rawScanMode, html: providedHtml } = body

    // ── Validate URL ─────────────────────────────────────────────────────
    const urlValidation = isValidUrl(url)
    if (!urlValidation.valid) {
      return NextResponse.json(
        { error: urlValidation.error },
        { status: 400 }
      )
    }

    const normalizedUrl = urlValidation.normalizedUrl!
    const domain = urlValidation.domain!

    // ── Validate Scan Mode ───────────────────────────────────────────────
    const scanMode: 'quick' | 'deep' = rawScanMode === 'deep' ? 'deep' : 'quick'

    // ── Check Cache ──────────────────────────────────────────────────────
    const cacheKey = `${normalizedUrl}::${scanMode}`
    const cachedResult = getCachedResult(cacheKey)
    if (cachedResult) {
      return NextResponse.json({
        success: true,
        data: cachedResult,
        cached: true,
      })
    }

    // ── Fetch Website Data ───────────────────────────────────────────────
    let pageData: PageData

    if (providedHtml && providedHtml.trim().length > 0) {
      // Use pre-fetched HTML (e.g. from page_reader cache) — skip the HTTP fetch entirely
      pageData = extractPageData(providedHtml, {}, normalizedUrl)
      // For deep scan, still check additional paths even with pre-fetched HTML
      if (scanMode === 'deep') {
        pageData.extraPathsChecked = []
        const baseUrl = new URL(normalizedUrl)
        const extraPaths = ['/robots.txt', '/sitemap.xml', '/favicon.ico', '/.well-known/security.txt']

        for (const path of extraPaths) {
          try {
            const extraUrl = `${baseUrl.protocol}//${baseUrl.hostname}${path}`
            const extraResponse = await fetchWithTimeout(extraUrl, 5000)
            if (extraResponse.ok) {
              const extraText = await extraResponse.text()
              pageData.html += `\n<!-- ${path} content -->\n${extraText.substring(0, 2000)}`
              pageData.extraPathsChecked.push(path)
            }
          } catch {
            // Silently ignore errors for extra paths
          }
        }
      }
    } else {
      try {
        pageData = await fetchWebsiteData(normalizedUrl, scanMode)
      } catch (fetchError) {
        // Direct HTTP fetch failed — try page_reader SDK as fallback
        // This handles sites that block bot-like User-Agent headers
        console.log(`Direct fetch failed for ${domain}, trying page_reader fallback...`)
        try {
          const readerResult = await fetchWebsiteContent(normalizedUrl)
          if (readerResult.html && readerResult.html.length > 100) {
            pageData = extractPageData(readerResult.html, {}, normalizedUrl)
            // For deep scan, also check additional paths
            if (scanMode === 'deep') {
              pageData.extraPathsChecked = []
              const baseUrl = new URL(normalizedUrl)
              const extraPaths = ['/robots.txt', '/sitemap.xml', '/favicon.ico', '/.well-known/security.txt']
              for (const path of extraPaths) {
                try {
                  const extraUrl = `${baseUrl.protocol}//${baseUrl.hostname}${path}`
                  const extraResponse = await fetchWithTimeout(extraUrl, 5000)
                  if (extraResponse.ok) {
                    const extraText = await extraResponse.text()
                    pageData.html += `\n<!-- ${path} content -->\n${extraText.substring(0, 2000)}`
                    pageData.extraPathsChecked.push(path)
                  }
                } catch {
                  // Silently ignore errors for extra paths
                }
              }
            }
          } else {
            throw fetchError // Throw original error — page_reader also failed
          }
        } catch {
          // Both direct fetch and page_reader failed — return the original error
          const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error'

          if (errorMessage.includes('abort') || errorMessage.includes('timeout') || errorMessage.includes('AbortError')) {
            return NextResponse.json(
              { error: `Request timed out while fetching "${domain}". The website may be slow or unresponsive. Try a quick scan instead.`, domain },
              { status: 408 }
            )
          }

          if (errorMessage.startsWith('HTTP 4')) {
            return NextResponse.json(
              { error: `The website "${domain}" returned an error (${errorMessage}). It may be blocking automated access.`, domain },
              { status: 400 }
            )
          }

          if (errorMessage.startsWith('HTTP 5')) {
            return NextResponse.json(
              { error: `The website "${domain}" is experiencing server issues (${errorMessage}). Please try again later.`, domain },
              { status: 502 }
            )
          }

          return NextResponse.json(
            { error: `Could not fetch "${domain}". The website may be down, blocking automated access, or doesn't exist.`, domain },
            { status: 400 }
          )
        }
      }
    }

    // Validate we got meaningful content
    if (!pageData.html || pageData.html.length < 100) {
      return NextResponse.json(
        { error: `"${domain}" returned empty or minimal content. The site may be under construction or require JavaScript to render.`, domain },
        { status: 400 }
      )
    }

    // ── Run Regex-Based Technology Detection ──────────────────────────────
    const regexTechs = detectTechnologies(pageData, scanMode)

    // ── AI Detection & Insights: only for deep scan ─────────────────────
    let detectionMethod: 'regex' | 'ai' | 'hybrid' = 'regex'
    let aiTechs: AIDetectedTech[] = []
    let aiInsights: Insight[] = []

    if (scanMode === 'deep') {
      // Deep scan: use AI-powered detection + AI-enhanced insights
      try {
        const titleMatch = pageData.html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
        const pageTitle = titleMatch ? titleMatch[1].trim() : domain

        aiTechs = await detectTechStackAI(
          normalizedUrl,
          pageData.html,
          pageTitle,
          pageData.headers,
          pageData.scripts,
          pageData.meta,
          scanMode
        )

        if (aiTechs.length > 0) {
          detectionMethod = 'hybrid'
        }
      } catch (error) {
        console.error('AI tech detection failed, continuing with regex only:', error)
      }

      // Also generate AI-enhanced insights for deep scan
      try {
        const mergedForInsights = aiTechs.length > 0
          ? mergeDetections(regexTechs, aiTechs)
          : regexTechs
        if (mergedForInsights.length > 0) {
          aiInsights = await generateAIInsights(mergedForInsights, normalizedUrl)
        }
      } catch {
        // AI enhancement is optional — continue without it
      }
    }
    // Quick scan: regex only, no AI detection, no AI insights — fast results

    // ── Merge Regex + AI Detections ──────────────────────────────────────
    const technologies = aiTechs.length > 0
      ? mergeDetections(regexTechs, aiTechs)
      : regexTechs

    // ── Generate Rule-Based Insights ─────────────────────────────────────
    let insights = generateInsights(technologies, pageData.headers)

    // ── Append AI Insights (deep scan only, already computed above) ──────
    if (aiInsights.length > 0) {
      insights = [...insights, ...aiInsights]
    }

    // ── Calculate Modern Score ───────────────────────────────────────────
    const modernScore = calculateModernScore(technologies, pageData.headers, insights)

    // ── Build Categorized Result ─────────────────────────────────────────
    const categories = buildCategorizedResult(technologies)

    const scanTime = Math.round((Date.now() - startTime) / 100) / 10

    const result: ScanResult = {
      url: normalizedUrl,
      domain,
      technologies,
      categories,
      insights,
      modernScore,
      scanMode,
      scanTime,
      totalTechnologies: technologies.length,
      detectionMethod,
    }

    setCachedResult(cacheKey, result)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Tech analyze error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred during the technology analysis. Please try again.' },
      { status: 500 }
    )
  }
}

// ─── GET Handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    const scanMode = searchParams.get('scanMode') === 'deep' ? 'deep' : 'quick'

    if (!url) {
      return NextResponse.json(
        { error: 'URL query parameter is required. Usage: /api/tech-analyze?url=https://example.com&scanMode=quick' },
        { status: 400 }
      )
    }

    const urlValidation = isValidUrl(url)
    if (!urlValidation.valid) {
      return NextResponse.json(
        { error: urlValidation.error },
        { status: 400 }
      )
    }

    const cacheKey = `${urlValidation.normalizedUrl}::${scanMode}`
    const cachedResult = getCachedResult(cacheKey)

    if (!cachedResult) {
      return NextResponse.json(
        { error: 'No cached scan results found for this URL. Run a POST scan first.', url: urlValidation.normalizedUrl },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: cachedResult,
      cached: true,
    })
  } catch (error) {
    console.error('Tech analyze GET error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve cached scan results.' },
      { status: 500 }
    )
  }
}
