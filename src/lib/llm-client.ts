import OpenAI from 'openai'

// ─── Singleton OpenAI Client ────────────────────────────────────────────────
// Supports any OpenAI-compatible API (NVIDIA NIM, OpenAI, Groq, Together, etc.)
// Configure via environment variables:
//   LLM_API_KEY  - API key (required)
//   LLM_BASE_URL - Base URL (default: https://integrate.api.nvidia.com/v1)
//   LLM_MODEL    - Model name (default: meta/llama-3.3-70b-instruct)

let openaiInstance: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiInstance) {
    const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || ''
    const baseURL = process.env.LLM_BASE_URL || process.env.OPENAI_BASE_URL || 'https://integrate.api.nvidia.com/v1'

    openaiInstance = new OpenAI({
      apiKey,
      baseURL,
    })
  }
  return openaiInstance
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionOptions {
  messages: ChatMessage[]
  temperature?: number
  maxTokens?: number
}

export interface ChatCompletionResult {
  content: string
}

export async function createChatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
  const client = getOpenAIClient()
  const model = process.env.LLM_MODEL || process.env.OPENAI_MODEL || 'meta/llama-3.3-70b-instruct'

  const completion = await client.chat.completions.create({
    model,
    messages: options.messages,
    temperature: options.temperature ?? 0,
    max_tokens: options.maxTokens || 4096,
  })

  const content = completion.choices[0]?.message?.content || ''
  return { content }
}

// ─── Native Fetch for Website Content ────────────────────────────────────────

export interface FetchedContent {
  title: string
  url: string
  html: string
  publishedTime: string | null
}

export async function fetchWebsiteContentNative(url: string): Promise<FetchedContent> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RoastMySiteAI/1.0; +https://roastmysite.dev)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()

    // Extract title from HTML
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : ''

    // Extract published time
    let publishedTime: string | null = null
    const timeMatch = html.match(/<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i)
    if (timeMatch) publishedTime = timeMatch[1]

    // Resolve final URL after redirects
    const finalUrl = response.url || url

    return {
      title: title || new URL(finalUrl).hostname,
      url: finalUrl,
      html,
      publishedTime,
    }
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}
