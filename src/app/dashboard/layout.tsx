import { redirect } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createSupabaseBrowserClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // 🔒 No session → kick out
  if (!session) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  )
}
