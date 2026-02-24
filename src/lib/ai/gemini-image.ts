// Gemini Image Generation for Blog Featured Images
// Uses Gemini's imagen model to generate blog post featured images

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'

interface ImageGenerationResult {
  imageUrl: string | null
  error?: string
}

/**
 * Generate a featured image for a blog post using Gemini's image generation.
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
    // Create a descriptive prompt for the image
    const imagePrompt = buildImagePrompt(keyword, title, excerpt)

    const response = await fetch(
      `${GEMINI_API_BASE}/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
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

    // Extract image from response
    const parts = data.candidates?.[0]?.content?.parts ?? []
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        const base64 = part.inlineData.data
        const mimeType = part.inlineData.mimeType
        return { imageUrl: `data:${mimeType};base64,${base64}` }
      }
    }

    return { imageUrl: null, error: 'No image in Gemini response' }
  } catch (err) {
    console.error('[gemini-image] Generation failed:', err instanceof Error ? err.message : err)
    return { imageUrl: null, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Upload a base64 image to Supabase Storage and return the public URL.
 */
export async function uploadImageToSupabase(
  base64DataUrl: string,
  slug: string
): Promise<string | null> {
  const isConfigured = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  if (!isConfigured) return null

  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient() as any

    // Parse base64 data URL
    const matches = base64DataUrl.match(/^data:(.+);base64,(.+)$/)
    if (!matches) return null

    const mimeType = matches[1]
    const base64Data = matches[2]
    const extension = mimeType.split('/')[1] || 'png'
    const buffer = Buffer.from(base64Data, 'base64')
    const fileName = `posts/${slug}-${Date.now()}.${extension}`

    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: true,
      })

    if (error) {
      console.error('[gemini-image] Upload error:', error.message)
      // Return the base64 data URL as fallback
      return base64DataUrl
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(data.path)

    return urlData?.publicUrl ?? base64DataUrl
  } catch (err) {
    console.error('[gemini-image] Upload failed:', err instanceof Error ? err.message : err)
    // Return base64 as fallback
    return base64DataUrl
  }
}

function buildImagePrompt(keyword: string, title: string, excerpt: string): string {
  return `Create a professional, clean blog featured image for a Korean blog post.

Topic: ${keyword}
Title: ${title}
Summary: ${excerpt}

Requirements:
- Modern, professional illustration style
- Clean and minimalist design
- Suitable as a blog header/featured image
- No text or letters in the image
- Warm, inviting color palette
- 16:9 aspect ratio composition
- Abstract or conceptual representation of the topic
- High quality, visually appealing`
}
