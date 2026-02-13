import { getRegistryOverview } from '@/lib/data/stats'
import StatCard from '@/components/dashboard/StatCard'
import { 
  Users, UserPlus, ShieldCheck, 
  Search, FileSpreadsheet, Building2 
} from 'lucide-react'

export default async function RegistryDashboard() {
  const staff = await getRegistryOverview()

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      {/* Top Accent Bar */}
      <div className="h-1.5 bg-gradient-to-r from-bmu-blue via-bmu-maroon to-bmu-green" />

      {/* Header */}
      <header className="bg-white border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-8 py-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              University Registry
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Staff Lifecycle & Academic Directory · Bayelsa Medical University
            </p>
          </div>
          <div className="hidden md:flex gap-3">
             <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition">
                <FileSpreadsheet size={16} />
                Export Staff List
             </button>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <section className="mx-auto max-w-7xl px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard 
            title="Verified Staff" 
            value={staff.length} 
            icon={Users} 
            trend="Total Active" 
            color="blue" 
          />
          <StatCard 
            title="Management" 
            value={staff.filter(s => ['dean', 'hod'].includes(s.role)).length} 
            icon={ShieldCheck} 
            trend="Deans & HODs" 
            color="maroon" 
          />
          <StatCard 
            title="Unassigned" 
            value={staff.filter(s => !s.department).length} 
            icon={Building2} 
            trend="Requires Action" 
            color="green" 
          />
        </div>

        {/* Action Grid (Replacing Student Scanning) */}
        <div className="grid gap-6 md:grid-cols-3 mb-10">
          {/* Staff Onboarding */}
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-8 group hover:shadow-xl transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <UserPlus size={80} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Verify Staff Credentials</h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 font-medium">
              Validate professional qualifications and commit new staff to the global directory.
            </p>
            <button className="mt-6 w-full rounded-xl bg-bmu-blue py-3 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-bmu-blue/20 hover:scale-[1.02] transition">
              Verify Personnel
            </button>
          </div>

          {/* Department Placement */}
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-8 group hover:shadow-xl transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <Building2 size={80} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Placement Audit</h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 font-medium">
              Review staff distribution across Faculties and Departments to ensure no gaps.
            </p>
            <button className="mt-6 w-full rounded-xl bg-bmu-maroon py-3 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-bmu-maroon/20 hover:scale-[1.02] transition">
              Run Audit
            </button>
          </div>

          {/* Global Directory Search */}
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-8 group hover:shadow-xl transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <Search size={80} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Staff Directory</h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 font-medium">
              Search the master list of all academic and administrative staff members.
            </p>
            <button className="mt-6 w-full rounded-xl border-2 border-slate-100 bg-slate-50 py-3 text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition">
              Open Directory
            </button>
          </div>
        </div>

        {/* Global Staff Directory Table */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-medical overflow-hidden">
           <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Recently Verified Staff</h3>
              <span className="text-[10px] font-black text-bmu-blue bg-bmu-blue/5 px-3 py-1 rounded-full uppercase">Registry Live Data</span>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-8 py-4">Name</th>
                    <th className="px-8 py-4">Designation</th>
                    <th className="px-8 py-4">Department</th>
                    <th className="px-8 py-4">Account Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {staff.slice(0, 5).map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-8 py-4">
                        <span className="font-bold text-slate-900 text-sm">{member.full_name}</span>
                      </td>
                      <td className="px-8 py-4">
                        <span className="px-2 py-1 rounded-md bg-white border border-slate-200 text-[10px] font-black text-slate-500 uppercase">
                          {member.role}
                        </span>
                      </td>
                      <td className="px-8 py-4">
                        <span className="text-xs font-bold text-slate-700">{member.department || 'Awaiting Placement'}</span>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-2">
                           <div className="h-1.5 w-1.5 rounded-full bg-bmu-green animate-pulse" />
                           <span className="text-[10px] font-black text-slate-400 uppercase">Verified</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 text-center">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
          Internal Administrative Terminal · BMU SARMS 2026
        </p>
      </footer>
    </main>
  )
}