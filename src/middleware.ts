import { NextResponse, type NextRequest } from 'next/server'

// API paths that are publicly accessible without authentication
const PUBLIC_API_PATHS = [
  '/api/auth/',
  '/api/analytics/track',
  '/api/search',
  '/api/sidebar',
  '/api/cron/',       // Cron endpoints use CRON_SECRET for auth
  '/api/sitemap',
  '/api/rss',
]

function isPublicApiPath(pathname: string): boolean {
  return PUBLIC_API_PATHS.some(p => pathname.startsWith(p) || pathname === p)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip auth check if Supabase is not configured (development environment)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next()
  }

  const { updateSession } = await import('@/lib/supabase/middleware')
  const { supabaseResponse, user } = await updateSession(request)

  // Protect /admin routes
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      if (user) {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
      return supabaseResponse
    }

    if (!user) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Protect /api/* routes (except public ones)
  if (pathname.startsWith('/api/') && !isPublicApiPath(pathname)) {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
