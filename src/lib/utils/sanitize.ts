import DOMPurify from 'dompurify'

/**
 * Sanitizes an HTML string to prevent XSS attacks.
 * Safe to render with dangerouslySetInnerHTML.
 * Only works in browser environments (uses DOMPurify).
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof window === 'undefined') {
    // Server-side: return plain text stripped of tags as a fallback
    return dirty.replace(/<[^>]*>/g, '')
  }

  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'strong', 'em', 'u', 's', 'del', 'ins',
      'blockquote', 'pre', 'code',
      'ul', 'ol', 'li',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span',
      'figure', 'figcaption',
    ],
    ALLOWED_ATTR: [
      'href', 'title', 'target', 'rel',
      'src', 'alt', 'width', 'height', 'loading',
      'class', 'id',
      'colspan', 'rowspan',
    ],
    ALLOW_DATA_ATTR: false,
    FORCE_BODY: false,
  })
}

/**
 * Strips all HTML tags and returns plain text.
 */
export function stripHtml(html: string): string {
  if (typeof window !== 'undefined') {
    const div = document.createElement('div')
    div.innerHTML = DOMPurify.sanitize(html)
    return div.textContent ?? div.innerText ?? ''
  }
  return html.replace(/<[^>]*>/g, '')
}
