'use client'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, RefreshCw, LayoutDashboard } from 'lucide-react'

export default async function DashboardRootPage() {
  const supabase = await createSupabaseServerClient()

  // 1. Get Auth User
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return redirect('/auth/login')
  }

  // 2. Fetch Profile with "maybeSingle" to avoid crash on recursion/missing data
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, profile_completed, full_name')
    .eq('id', user.id)
    .maybeSingle()

  // 3. Handle Recursive or Database Errors gracefully
  if (profileError) {
    console.error("Dashboard Sync Error:", profileError.message)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-xl border border-red-100 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Syncing Conflict</h1>
          <p className="text-slate-500 text-sm mb-8">
            The database is reporting a policy recursion error. This usually happens while RLS settings are updating.
          </p>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.reload()} 
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
            >
              <RefreshCw size={18} />
              RETRY CONNECTION
            </button>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
              Error Code: {profileError.message.includes('recursion') ? 'RLS_RECURSION_LOOP' : 'DB_SYNC_ERR'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // 4. Handle "Pending Approval" state
  // If no profile exists yet, or they haven't been assigned a role
  if (!profile || !profile.role) {
    return redirect('/pending')
  }

  // 5. Handle Onboarding state
  if (profile.profile_completed === false) {
    return redirect('/onboarding')
  }

  // 6. Role-Based Redirection (The Smart Part)
  const role = profile.role.toUpperCase()

  if (role === 'admin' || role === 'SUPER_ADMIN') {
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

        {/* Placeholder for your actual Dashboard Metrics/Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="h-32 bg-slate-100 rounded-[2rem] border-2 border-dashed border-slate-200" />
           <div className="h-32 bg-slate-100 rounded-[2rem] border-2 border-dashed border-slate-200" />
           <div className="h-32 bg-slate-100 rounded-[2rem] border-2 border-dashed border-slate-200" />
        </div>
      </div>
    )
  }

  // 7. Default redirect for Faculty/Staff
  return redirect('/dashboard/staff')
}