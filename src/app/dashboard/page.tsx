import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function DashboardRootPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/auth/login')

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error("Database Error:", error.message)
    // If we can't find a profile, we have to send to pending
    return redirect('/pending')
  }

  // Normalize the role for comparison
  const role = profile?.role?.toUpperCase().trim() || 'NO_ROLE'

  console.log("--- ROUTER DEBUG ---")
  console.log("USER ID:", user.id)
  console.log("DETECTED ROLE:", role)

  // Redirect based on normalized role
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
    return redirect('/dashboard/admin')
  }
  
  if (role === 'HOD') {
    return redirect('/dashboard/hod')
  }
  
  if (role === 'DEAN') {
    return redirect('/dashboard/dean')
  }
  
  if (role === 'LECTURER') {
    return redirect('/dashboard/lecturer')
  }

  // If role is something else or null
  return redirect('/pending')
}