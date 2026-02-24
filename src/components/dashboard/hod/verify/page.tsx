import { createSupabaseServerClient } from '@/lib/supabase/server'
import { CheckCircle, XCircle, UserCheck, ShieldCheck } from 'lucide-react'
import { revalidatePath } from 'next/cache'

export default async function VerifyLecturers() {
  const supabase = await createSupabaseServerClient()

  // 1. Fetch all completed but unverified profiles
  const { data: pendingLecturers } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'lecturer')
    .eq('profile_completed', true)
    .eq('is_verified', false)

  // 2. Server Action to Approve Lecturer
  async function approveLecturer(formData: FormData) {
    'use server'
    const lecturerId = formData.get('id')
    const supabase = await createSupabaseServerClient()

    const { error } = await supabase
      .from('profiles')
      .update({ is_verified: true })
      .eq('id', lecturerId)

    if (!error) {
      revalidatePath('/dashboard/hod/verify')
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 uppercase">Staff Verification Desk</h1>
        <p className="text-slate-500 font-medium">Review and approve lecturers who have completed their biodata.</p>
      </header>

      {pendingLecturers?.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-20 text-center">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32} />
          </div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No pending verifications</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingLecturers?.map((lecturer) => (
            <div key={lecturer.id} className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-3xl overflow-hidden mb-4 border-4 border-slate-50">
                <img 
                  src={lecturer.avatar_url || 'https://via.placeholder.com/150'} 
                  alt={lecturer.full_name} 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <h3 className="text-lg font-black text-slate-900 leading-tight">
                {lecturer.title} {lecturer.full_name}
              </h3>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">
                {lecturer.department}
              </p>
              
              <div className="mt-4 pt-4 border-t border-slate-50 w-full space-y-2">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-400 uppercase">Staff ID:</span>
                  <span className="text-slate-900">{lecturer.staff_id}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-400 uppercase">Faculty:</span>
                  <span className="text-slate-900">{lecturer.faculty}</span>
                </div>
              </div>

              <form action={approveLecturer} className="w-full mt-6">
                <input type="hidden" name="id" value={lecturer.id} />
                <button className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-green-600 transition-all flex items-center justify-center gap-2">
                  <UserCheck size={16} /> Approve Staff
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}