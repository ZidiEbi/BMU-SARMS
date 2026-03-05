// src/app/dashboard/admin/page.tsx
// REMOVED 'use client' - This is now a Server Component
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, LayoutDashboard } from 'lucide-react'

export default async function DashboardRootPage() {
  const supabase = await createSupabaseServerClient()

  // 1. Get Auth User
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // 2. Fetch Profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .maybeSingle()

  // 3. Handle Errors (Simplified for Server)
  if (profileError || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white rounded-[2.5rem] p-10 shadow-xl border border-red-100">
           <AlertCircle className="text-red-600 mx-auto mb-4" size={48} />
           <h1 className="text-2xl font-black mb-2">Access Error</h1>
           <p className="text-slate-500 mb-6">{profileError?.message || "Profile not found."}</p>
           <a href="/dashboard" className="text-blue-600 font-bold">Try Refreshing</a>
        </div>
      </div>
    )
  }

  // 4. Role Normalization (Strict Recovery Rule)
  const role = profile.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : profile.role?.toLowerCase()

  // 5. Security Check (If they bypassed middleware somehow)
  if (role !== 'admin' && role !== 'SUPER_ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="p-8 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Admin Command</h1>
          <p className="text-slate-500 text-sm">System-wide overview for {profile.full_name}</p>
        </div>
        <Link 
          href="/dashboard/admin/roles"
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all flex items-center gap-2"
        >
          <LayoutDashboard size={16} />
          Control Terminal
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="h-32 bg-slate-100 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 font-bold">Admin Metric A</div>
         <div className="h-32 bg-slate-100 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 font-bold">Admin Metric B</div>
         <div className="h-32 bg-slate-100 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 font-bold">Admin Metric C</div>
      </div>
    </div>
  )
}