import { NextRequest, NextResponse } from 'next/server'

interface RateLimitOptions {
  max: number
  windowMs: number
}

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store: IP -> entry
const store = new Map<string, RateLimitEntry>()

function getIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}

/**
 * Check rate limit for the incoming request.
 * Returns a 429 NextResponse if the limit is exceeded, or null to allow the request.
 */
export function rateLimit(
  request: NextRequest,
  options: RateLimitOptions
): NextResponse | null {
  const { max, windowMs } = options
  const ip = getIp(request)
  const key = `${request.nextUrl.pathname}:${ip}`
  const now = Date.now()

  const entry = store.get(key)

  if (!entry || now >= entry.resetAt) {
    // New window
    store.set(key, { count: 1, resetAt: now + windowMs })
    return null
  }

  if (entry.count >= max) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return NextResponse.json(
      { error: 'Too Many Requests' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
        },
      }
    )
  }

  entry.count++
  return null
}
