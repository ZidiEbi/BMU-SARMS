import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getDeanStats, getFacultyOverview } from '@/lib/data/stats'
import StatCard from '@/components/dashboard/StatCard'
import { Users, Building2, ShieldCheck, LayoutGrid, ArrowUpRight } from 'lucide-react'

export default async function DeanDashboard() {
  const supabase = await createSupabaseServerClient()
  
  // 1. Get Dean's Profile
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('faculty, full_name')
    .eq('id', user?.id)
    .single()

  if (!profile?.faculty) {
    return <div className="p-12 text-center font-bold text-slate-400">Faculty Not Assigned. Contact Registry.</div>
  }

  // 2. Fetch Faculty Data
  const stats = await getDeanStats(profile.faculty)
  const overview = await getFacultyOverview(profile.faculty)

  return (
    <div className="space-y-8">
      {/* Faculty Header */}
      <div className="flex justify-between items-end">
        <div>
          <span className="text-[10px] font-black text-bmu-blue bg-bmu-blue/5 px-3 py-1 rounded-full uppercase tracking-widest">
            Executive Dean's Portal
          </span>
          <h1 className="text-4xl font-black text-slate-900 mt-2">
            Faculty of {profile.faculty}
          </h1>
        </div>
        <div className="text-right pb-1">
          <p className="text-xs font-bold text-slate-400 uppercase">Presiding Dean</p>
          <p className="text-sm font-black text-slate-700">{profile.full_name}</p>
        </div>
      </div>

      {/* Faculty Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Faculty Staff" 
          value={stats.lecturerCount} 
          icon={Users} 
          trend="Active" 
          color="blue" 
        />
        <StatCard 
          title="Departments" 
          value={overview.departments.length} 
          icon={LayoutGrid} 
          trend="Verified" 
          color="maroon" 
        />
        <StatCard 
          title="HODs Appointed" 
          value={overview.departments.filter(d => d.hods > 0).length} 
          icon={ShieldCheck} 
          trend="Operational" 
          color="green" 
        />
      </div>

      {/* Departmental Oversight Table */}
      <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-medical">
        <h3 className="font-bold text-slate-900 text-xl mb-8 flex items-center gap-3">
          <Building2 className="text-bmu-blue" />
          Departmental Oversight
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {overview.departments.map((dept: any) => (
            <div key={dept.name} className="group p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:border-bmu-blue/20 transition-all">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-black text-slate-800 uppercase tracking-tight">{dept.name}</h4>
                <div className="p-2 bg-white rounded-xl shadow-sm group-hover:text-bmu-blue">
                  <ArrowUpRight size={18} />
                </div>
              </div>
              
              <div className="flex gap-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Lecturers</p>
                  <p className="text-xl font-black text-slate-900">{dept.lecturers}</p>
                </div>
                <div className="h-10 w-[1px] bg-slate-200 self-end" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">HOD Status</p>
                  <p className={`text-xs font-black uppercase mt-1 ${dept.hods > 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                    {dept.hods > 0 ? '✓ Assigned' : '⚠ Vacant'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}