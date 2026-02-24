import { NextRequest, NextResponse } from 'next/server'
import { searchPublishedPosts } from '@/lib/supabase/queries'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? ''
  if (!q.trim()) {
    return NextResponse.json({ posts: [] })
  }
  const posts = await searchPublishedPosts(q)
  return NextResponse.json({ posts })
}
