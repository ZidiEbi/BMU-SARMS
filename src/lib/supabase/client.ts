// src/lib/supabase/client.ts
import { createBrowserClient as createSupabaseSSRClient } from '@supabase/ssr'

export function createBrowserClient() {
  return createSupabaseSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// ALIAS: This fixes the "Export doesn't exist" error for the Sidebar and other components
export const createSupabaseBrowserClient = createBrowserClient;