'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import Sidebar from '@/components/dashboard/Sidebar'

type LayoutRole =
  | 'lecturer'
  | 'hod'
  | 'dean'
  | 'admin'
  | 'SUPER_ADMIN'
  | 'pending'
  | 'student'

type LayoutProfile = {
  role: LayoutRole
}

export default function DashboardLayout({
  children,
  profile,
}: {
  children: React.ReactNode
  profile: LayoutProfile
}) {
  const router = useRouter()
  const supabase = useMemo(() => createBrowserClient(), [])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/auth/login')
        router.refresh()
      }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase])

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role={profile.role} />
      <main className="flex-1 h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  )
}