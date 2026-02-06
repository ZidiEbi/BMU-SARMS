import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function getUserWithRole() {
  const supabase = createSupabaseServerClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return {
    user,
    role: profile?.role ?? null
  }
}
