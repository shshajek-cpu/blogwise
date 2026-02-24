"use client"

import { useEffect } from 'react'

export default function PageViewTracker({ postSlug, path }: { postSlug?: string; path: string }) {
  useEffect(() => {
    // Generate or retrieve session ID from sessionStorage
    let sessionId = sessionStorage.getItem('bw_session')
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      sessionStorage.setItem('bw_session', sessionId)
    }

    // Fire tracking request (fire-and-forget)
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path,
        post_slug: postSlug,
        referrer: document.referrer || null,
        session_id: sessionId,
      }),
    }).catch(() => {}) // silently fail
  }, [postSlug, path])

  return null
}
