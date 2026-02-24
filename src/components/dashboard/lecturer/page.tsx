import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ShieldAlert, Clock, LogOut } from 'lucide-react'
import MyCourses from '@/components/dashboard/lecturer/MyCourses'

export default async function LecturerDashboard() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  // 1. Force Profile Completion (The Right of Passage)
  if (!profile?.profile_completed) {
    redirect('/complete-profile')
  }

  // 2. Handle Pending Verification (The Waiting Room)
  if (!profile?.is_verified) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-12 rounded-[3.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 max-w-xl w-full">
          <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 animate-pulse">
            <ShieldAlert size={48} />
          </div>
          
          <h1 className="text-3xl font-black text-slate-900 uppercase leading-tight">Verification Pending</h1>
          <p className="mt-4 text-slate-500 font-medium leading-relaxed">
            Great job, <span className="text-slate-900 font-bold">{profile.title} {profile.full_name}</span>! 
            Your biodata and passport have been submitted.
          </p>
          
          <div className="mt-8 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center gap-4 text-left">
            <div className="bg-white p-3 rounded-xl shadow-sm text-bmu-blue">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Step</p>
              <p className="text-xs font-bold text-slate-700">Waiting for HOD to approve your staff ID.</p>
            </div>
          </div>

          <form action="/auth/signout" method="post" className="mt-10">
            <button className="flex items-center justify-center gap-2 mx-auto text-slate-400 hover:text-red-500 font-bold text-[10px] uppercase tracking-[0.2em] transition-colors">
              <LogOut size={14} /> Sign Out & Check Later
            </button>
          </form>
        </div>
      </div>
    )
  }

  // 3. Authorized View (The Dashboard)
  const { data: myCourses } = await supabase
    .from('course_assignments')
    .select('*')
    .eq('lecturer_id', user?.id)

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      <header className="flex items-center gap-6">
        <div className="w-20 h-20 rounded-[2rem] overflow-hidden border-4 border-white shadow-lg">
          <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase">Faculty Dashboard</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{profile.department}</p>
        </div>
      </header>
      
      <MyCourses courses={myCourses || []} />
    </div>
  )
}