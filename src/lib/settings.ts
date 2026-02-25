/**
 * Server-side utility for reading site_settings from Supabase.
 * Uses the admin client so it works in both API routes and Server Components.
 */

import { createAdminClient } from '@/lib/supabase/server'

const isConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export type SiteSettings = Record<string, unknown>

/**
 * Load all site_settings rows as a flat key->value map.
 * Returns an empty object if Supabase is not configured or on error.
 */
export async function loadSiteSettings(): Promise<SiteSettings> {
  if (!isConfigured) return {}
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any
    const { data, error } = await db
      .from('site_settings')
      .select('key, value')
    if (error) {
      console.error('[settings] Failed to load site_settings:', error.message)
      return {}
    }
    const result: SiteSettings = {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of (data ?? []) as any[]) {
      result[row.key] = row.value
    }
    return result
  } catch (err) {
    console.error('[settings] loadSiteSettings error:', err instanceof Error ? err.message : err)
    return {}
  }
}

/**
 * Read a single setting value.
 * Returns undefined if not found or on error.
 */
export async function getSetting(key: string): Promise<unknown> {
  const settings = await loadSiteSettings()
  return settings[key]
}

/**
 * Resolve an API key: prefer the environment variable, fall back to DB setting.
 */
export async function resolveApiKey(
  envVar: string,
  dbKey: string,
  settings?: SiteSettings
): Promise<string | undefined> {
  const fromEnv = process.env[envVar]
  if (fromEnv) return fromEnv
  const s = settings ?? (await loadSiteSettings())
  const fromDb = s[dbKey]
  return typeof fromDb === 'string' && fromDb ? fromDb : undefined
}
