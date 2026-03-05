import { getAuthProfileOrRedirect, requireRole } from '@/lib/auth/guards'
import { verifyLecturerAction } from '@/lib/actions/verify-lecturer'
import { CheckCircle, UserX, UserCheck } from 'lucide-react'

export default async function HodVerificationPage() {
  const { supabase, profile } = await getAuthProfileOrRedirect()
  requireRole(profile, ['hod', 'admin', 'SUPER_ADMIN'])

  // Fetch pending lecturers in the same department as the HOD
  const { data: pendingLecturers } = await supabase
    .from('profiles')
    .select('id, full_name, staff_id, email, created_at')
    .eq('role', 'lecturer')
    .eq('is_verified', false)
    .eq('department_id', (profile as Record<string, unknown>).department_id) // Security: HODs only see their dept

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Verification Queue</h1>
        <p className="text-slate-500">Approve new staff access for the Department.</p>
      </header>

      <div className="grid gap-4">
        {pendingLecturers && pendingLecturers.length > 0 ? (
          pendingLecturers.map((lecturer) => (
            <div key={lecturer.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-bold">
                  {lecturer.full_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{lecturer.full_name}</h3>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">ID: {lecturer.staff_id || 'N/A'}</p>
                </div>
              </div>

              <form action={async () => {
                'use server'
                await verifyLecturerAction(lecturer.id)
              }}>
                <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2">
                  <UserCheck size={16} />
                  Approve Staff
                </button>
              </form>
            </div>
          ))
        ) : (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-[3rem] bg-slate-50">
            <CheckCircle className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500 font-bold">No pending verifications.</p>
          </div>
        )}
      </div>
    </div>
  )
}