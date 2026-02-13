import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'

export default async function RoleLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // 🚨 IMPORTANT: Change 'dean' to 'hod', 'lecturer', or 'registry' 
  // depending on which folder this file is in!
  if (!profile || profile.role !== 'registry') {
    redirect('/pending')
  }

  return (
  <div className="flex min-h-screen bg-white">
    <Sidebar role={profile.role} />
    {/* Use a subtle gray background for the main area to make white cards pop */}
    <main className="flex-1 bg-[#F8FAFC] p-8 lg:p-12 overflow-y-auto">
      {children}
    </main>
  </div>
)
}