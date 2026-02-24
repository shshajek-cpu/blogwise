import slugify from 'slugify'

/**
 * Generates a URL-safe slug from Korean or English text.
 * Korean characters are transliterated; special chars are removed.
 */
export function generateSlug(title: string): string {
  return slugify(title, {
    lower: true,
    strict: true,
    trim: true,
    locale: 'ko',
  })
}

/**
 * Generates a unique slug by appending a numeric suffix if needed.
 * Pass an `exists` function that returns true when a slug is already taken.
 */
export async function generateUniqueSlug(
  title: string,
  exists: (slug: string) => Promise<boolean>
): Promise<string> {
  const base = generateSlug(title)
  let slug = base
  let counter = 1

  while (await exists(slug)) {
    slug = `${base}-${counter}`
    counter++
  }

  return slug
}
