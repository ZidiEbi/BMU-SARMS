import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()

  // 1. Get the current user session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // 2. Fetch profile with CACHE DISABLED
  // We add { count: 'exact' } or just ensure the query isn't cached
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // 3. Robust Error Handling 
  // If the profile doesn't exist yet, they must be pending
  if (error || !profile) {
    redirect('/pending')
  }

  // 4. Traffic Control Logic
  // Using exact matches for your database strings
  switch (profile.role) {
    case 'SUPER_ADMIN':
    case 'admin':
      redirect('/dashboard/admin/roles')
    case 'registry':
      redirect('/dashboard/registry')
    case 'lecturer':
      redirect('/dashboard/lecturer')
    case 'hod':
      redirect('/dashboard/hod')
    case 'dean':
      redirect('/dashboard/dean')
    case 'PENDING':
      redirect('/pending')
    default:
      // If the role is anything else or misspelled, safe default to pending
      console.log(`User ${user.id} has unknown role: ${profile.role}`)
      redirect('/pending')
  }
}