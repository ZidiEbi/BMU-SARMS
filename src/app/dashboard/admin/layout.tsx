import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import Header from '@/components/dashboard/Header'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    console.log("DEBUG: No user found in Auth, redirecting to login")
    redirect('/auth/login')
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    console.log("DEBUG: Profile fetch error or missing profile for ID:", user.id)
    redirect('/pending')
  }

  // Normalize role
  const rawRole = profile?.role || "NO_ROLE_FOUND"
  const role = rawRole.toUpperCase().trim()

  console.log("DEBUG: Database Role is:", rawRole)
  console.log("DEBUG: Normalized Role is:", role)

  const isAuthorized = role === 'ADMIN' || role === 'SUPER_ADMIN'

if (!isAuthorized) {
  console.log(`DEBUG: Blocked access. Reason: ${role} is not ADMIN or SUPER_ADMIN`)
  redirect('/pending')
}


  return (
    <div className="flex min-h-screen bg-white">
      {/* Ensure Sidebar gets the original casing for its internal logic */}
      <Sidebar role={profile.role} /> 
      <main className="flex-1 bg-[#F8FAFC] p-8 lg:p-12 overflow-y-auto">
        <Header userName={profile?.full_name || 'Administrator'} />
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}