import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UserAssignment from '@/components/dashboard/admin/UserAssignment'
import Link from 'next/link'
import { ShieldAlert, Users, Fingerprint, Edit3 } from 'lucide-react'

export default async function AdminRoleManagementPage() {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  if (profile?.role?.toUpperCase() !== 'SUPER_ADMIN' && profile?.role?.toUpperCase() !== 'ADMIN') {
    return redirect('/dashboard')
  }

  // REMOVED 'email' from select here as well
  const { data: profiles } = await supabase
    .from('profiles')
    .select(`
      id, full_name, role,
      faculties (name),
      departments (name)
    `)
    .order('full_name')

  return (
    <div className="flex flex-col gap-6">
      <header className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="text-red-500 animate-pulse" size={20} />
              <span className="text-[10px] font-black tracking-[0.3em] uppercase opacity-70">Security Level: High</span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Authority Terminal</h1>
            <p className="text-slate-400 font-medium text-sm mt-1">Manage staff roles and departmental hierarchy</p>
          </div>
          <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
            <p className="text-[9px] font-black uppercase text-slate-500">Total Registry</p>
            <p className="text-xl font-black">{profiles?.length || 0}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <div className="sticky top-8 bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <Fingerprint size={24} />
              </div>
              <h2 className="font-black text-slate-900 uppercase tracking-tight">Assignment Tool</h2>
            </div>
            <UserAssignment />
          </div>
        </div>

        <div className="lg:col-span-8 bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Global Staff Registry</h3>
            <Users size={16} className="text-slate-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="px-8 py-5">Staff Member</th>
                  <th className="px-8 py-5">Designation</th>
                  <th className="px-8 py-5 text-right">Unit Assignment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {/* ... inside your tbody mapping ... */}
                {profiles?.map((p) => (
                  <tr key={p.id} className="hover:bg-blue-50/30 transition-all group border-b border-slate-50 last:border-0">
                    <td className="px-8 py-5">
                      <p className="font-black text-slate-900 text-sm leading-none mb-1">{p.full_name || 'New User'}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter italic">ID: {p.id.slice(0, 8)}</p>
                    </td>

                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${p.role ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-amber-100 text-amber-600 animate-pulse border border-amber-200'
                        }`}>
                        {p.role || 'PENDING'}
                      </span>
                    </td>

                    <td className="px-8 py-5 text-right">
                      {/* This is the "Institutional Mapping" display. 
          We keep it clean and subtle.
      */}
                      <div className="mb-3">
                        <p className="text-[10px] font-black text-slate-900 uppercase leading-none">{Array.isArray(p.faculties) ? p.faculties[0]?.name : (p.faculties as any)?.name || '---'}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{Array.isArray(p.departments) ? p.departments[0]?.name : (p.departments as any)?.name || 'No Unit'}</p>
                      </div>

                      {/* THE MODIFY BUTTON */}
                      <Link
                        href={`?edit=${p.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all border border-slate-200 shadow-sm hover:shadow-blue-200 group-hover:border-blue-300"
                      >
                        <Edit3 size={12} />
                        Modify Authority
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}