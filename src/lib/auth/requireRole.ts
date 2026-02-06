import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function requireRole(allowedRoles: string[]) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    redirect('/auth/login')
  }

  if (!allowedRoles.includes(profile.role)) {
    redirect('/unauthorized')
  }

  return {
    user,
    role: profile.role,
  }
}
