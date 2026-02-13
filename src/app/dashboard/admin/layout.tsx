import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import Header from '@/components/dashboard/Header'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
  .from('profiles')
  .select('role, full_name') // Add full_name or whatever your column is called
  .eq('id', user.id)
  .single()

  const allowedRoles = ['admin', 'SUPER_ADMIN'];
  if (!profile || !allowedRoles.includes(profile.role)) {
    redirect('/pending')
  }

  // --- THIS IS THE BLOCK YOU ASKED ABOUT ---
  return (
  <div className="flex min-h-screen bg-white">
    <Sidebar role={profile.role} />
    <main className="flex-1 bg-[#F8FAFC] p-8 lg:p-12 overflow-y-auto">
      {/* ADD THE HEADER HERE */}
      <Header userName={profile.full_name || 'Administrator'} />
      
      {children}
    </main>
  </div>
)
}