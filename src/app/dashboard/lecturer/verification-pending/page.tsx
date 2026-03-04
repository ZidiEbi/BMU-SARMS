import { redirect } from 'next/navigation'
import { ShieldAlert, Clock } from 'lucide-react'
import { getAuthProfileOrRedirect, requireRole } from '@/lib/auth/guards'

export default async function LecturerVerificationPendingPage() {
  const { profile } = await getAuthProfileOrRedirect()
  requireRole(profile, ['lecturer'])

  if (profile.is_active === false) redirect('/disabled')
  if (!profile.profile_completed) redirect('/dashboard/lecturer/onboarding')
  if (profile.is_verified) redirect('/dashboard/lecturer')

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="bg-white p-12 rounded-[3.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 max-w-xl w-full text-center">
        <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 animate-pulse">
          <ShieldAlert size={48} />
        </div>

        <h1 className="text-3xl font-black text-slate-900 uppercase leading-tight">Verification Pending</h1>
        <p className="mt-4 text-slate-500 font-medium leading-relaxed">
          Your biodata has been submitted. You will gain access once your HOD approves your staff ID.
        </p>

        <div className="mt-8 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center gap-4 text-left">
          <div className="bg-white p-3 rounded-xl shadow-sm text-bmu-blue">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Step</p>
            <p className="text-xs font-bold text-slate-700">Waiting for HOD verification.</p>
          </div>
        </div>

        <form action="/auth/signout" method="post" className="mt-10">
          <button className="mx-auto text-slate-400 hover:text-red-500 font-bold text-[10px] uppercase tracking-[0.2em] transition-colors">
            Sign Out & Check Later
          </button>
        </form>
      </div>
    </div>
  )
}