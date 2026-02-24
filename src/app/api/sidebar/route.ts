import { NextResponse } from 'next/server'
import { getPopularPosts, getCategories, getTags } from '@/lib/supabase/queries'

export async function GET() {
  const [popularPosts, categories, tags] = await Promise.all([
    getPopularPosts(5),
    getCategories(),
    getTags(),
  ])
  return NextResponse.json({ popularPosts, categories, tags })
}
