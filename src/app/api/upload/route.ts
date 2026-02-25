import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rateLimit'

const isConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(request: NextRequest) {
  const rateLimitResponse = rateLimit(request, { max: 20, windowMs: 60_000 })
  if (rateLimitResponse) return rateLimitResponse

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
    }

    // Validate file type
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
    }
    if (!(file.type in mimeToExt)) {
      return NextResponse.json(
        { error: '허용되지 않는 파일 형식입니다.' },
        { status: 400 }
      )
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: '파일 크기는 5MB 이하여야 합니다.' },
        { status: 400 }
      )
    }

    const safeExt = mimeToExt[file.type] ?? 'jpg'

    if (!isConfigured) {
      // Mock mode - return a fake URL
      return NextResponse.json({
        url: `/placeholder-${Date.now()}.${safeExt}`,
        name: file.name,
        size: file.size,
      })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any

    // Generate unique filename using MIME-based extension and UUID
    const fileName = `${crypto.randomUUID()}.${safeExt}`
    const filePath = `posts/${fileName}`

    // Upload to Supabase Storage bucket "images"
    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: '파일 업로드 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('images').getPublicUrl(filePath)

    return NextResponse.json({
      url: publicUrl,
      name: file.name,
      size: file.size,
      path: filePath,
    })
  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '업로드 중 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}
