import { createSupabaseServerClient } from '@/lib/supabase/server'
import { AlertCircle, UserCheck, ArrowRight } from 'lucide-react'

export default async function RegistryAudit() {
  const supabase = await createSupabaseServerClient()

  // Find staff who are missing either a department or a faculty
  const { data: unassignedStaff } = await supabase
    .from('profiles')
    .select('*')
    .or('department.is.null,faculty.is.null')
    .neq('role', 'super_admin') // Filter out the master admin

  return (
    <main className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Placement Audit</h1>
        <p className="text-slate-500 font-medium italic">Resolving {unassignedStaff?.length || 0} incomplete staff profiles</p>
      </div>

      <div className="grid gap-4">
        {unassignedStaff && unassignedStaff.length > 0 ? (
          unassignedStaff.map((staff) => (
            <div key={staff.id} className="bg-white border-l-4 border-amber-400 p-6 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-amber-50 p-3 rounded-full text-amber-600">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{staff.full_name || 'Unnamed Account'}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{staff.role}</p>
                </div>
              </div>

              <div className="flex gap-8 items-center text-sm">
                <div className="text-center">
                   <p className="text-[10px] font-black text-slate-300 uppercase">Faculty</p>
                   <p className={staff.faculty ? "font-bold text-slate-700" : "font-bold text-red-400 italic"}>
                    {staff.faculty || 'Missing'}
                   </p>
                </div>
                <div className="text-center">
                   <p className="text-[10px] font-black text-slate-300 uppercase">Department</p>
                   <p className={staff.department ? "font-bold text-slate-700" : "font-bold text-red-400 italic"}>
                    {staff.department || 'Missing'}
                   </p>
                </div>
                
                {/* Button to go fix it on the Role Control page */}
                <button className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase hover:bg-bmu-blue transition-colors">
                  Assign Placement
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-emerald-50 border border-emerald-100 p-10 rounded-[2.5rem] text-center">
            <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
              <UserCheck size={32} />
            </div>
            <h3 className="text-emerald-900 font-black text-xl">Directory Clean</h3>
            <p className="text-emerald-700 font-medium">All staff members have been correctly assigned to their respective departments.</p>
          </div>
        )}
      </div>
    </main>
  )
}