// Gemini Image Generation for Blog Featured Images
// Uses Gemini 3 Pro Image (Nano Banana Pro) for card-news style thumbnails

import { createAdminClient } from '@/lib/supabase/server'

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'
const IMAGE_MODEL = 'gemini-3-pro-image-preview'

interface ImageGenerationResult {
  imageUrl: string | null
  error?: string
}

/**
 * Generate a card-news style thumbnail for a blog post using Gemini 3 Pro Image (Nano Banana Pro).
 * Returns a base64 data URL or null if generation fails.
 */
export async function generateFeaturedImage(
  keyword: string,
  title: string,
  excerpt: string
): Promise<ImageGenerationResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return { imageUrl: null, error: 'GEMINI_API_KEY not configured' }
  }

  try {
    const imagePrompt = buildImagePrompt(keyword, title, excerpt)

    const response = await fetch(
      `${GEMINI_API_BASE}/models/${IMAGE_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: imagePrompt,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[gemini-image] API error (${response.status}):`, errorText)
      return { imageUrl: null, error: `Gemini API error: ${response.status}` }
    }

    const data = await response.json()

    // Extract image from response - check both inline_data and inlineData formats
    const parts = data.candidates?.[0]?.content?.parts ?? []
    for (const part of parts) {
      const inlineData = part.inlineData ?? part.inline_data
      if (inlineData?.mimeType?.startsWith('image/') || inlineData?.mime_type?.startsWith('image/')) {
        const base64 = inlineData.data
        const mimeType = inlineData.mimeType ?? inlineData.mime_type
        return { imageUrl: `data:${mimeType};base64,${base64}` }
      }
    }

    console.error('[gemini-image] No image in response. Parts:', JSON.stringify(parts.map((p: any) => Object.keys(p))))
    return { imageUrl: null, error: 'No image in Gemini response' }
  } catch (err) {
    console.error('[gemini-image] Generation failed:', err instanceof Error ? err.message : err)
    return { imageUrl: null, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

interface UploadResult {
  url: string | null
  error?: string
}

/**
 * Upload a base64 image to Supabase Storage and return the public URL.
 * Uses admin client to bypass RLS for reliable uploads in API routes.
 */
export async function uploadImageToSupabase(
  base64DataUrl: string,
  slug: string
): Promise<UploadResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return { url: null, error: 'Missing SUPABASE env vars' }
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any

    // Parse base64 data URL
    const matches = base64DataUrl.match(/^data:(.+);base64,(.+)$/)
    if (!matches) {
      return { url: null, error: 'Invalid base64 data URL format' }
    }

    const mimeType = matches[1]
    const base64Data = matches[2]
    const extension = mimeType.split('/')[1] || 'png'
    const buffer = Buffer.from(base64Data, 'base64')
    const fileName = `posts/${slug}-${Date.now()}.${extension}`

    console.log(`[gemini-image] Uploading ${buffer.length} bytes as ${fileName}`)

    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: true,
      })

    if (error) {
      return { url: null, error: `Storage upload: ${error.message}` }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(data.path)

    const publicUrl = urlData?.publicUrl ?? null
    if (!publicUrl) {
      return { url: null, error: 'Failed to get public URL' }
    }

    console.log(`[gemini-image] Upload success: ${publicUrl}`)
    return { url: publicUrl }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[gemini-image] Upload exception:', msg)
    return { url: null, error: `Upload exception: ${msg}` }
  }
}

function buildImagePrompt(keyword: string, title: string, excerpt: string): string {
  return `Design a Korean-style card news thumbnail image for a blog post.

Topic: "${keyword}"
Title: "${title}"

Design requirements:
- Card news (카드뉴스) style: bold, eye-catching, information-rich visual
- Include the main keyword "${keyword}" as large Korean text overlay in the center
- Use a gradient or solid color background (professional blues, purples, or warm tones)
- Add subtle related icons or illustrations around the text
- Modern, clean typography layout like popular Korean blog thumbnails
- 16:9 aspect ratio (landscape orientation)
- High contrast between text and background for readability
- Professional and trustworthy design aesthetic
- Style similar to Naver blog or Korean news card thumbnails
- The text should be clearly legible and be the focal point`
}
