import { getGlobalStats } from '@/lib/data/stats'
import StatCard from '@/components/dashboard/StatCard'
import { Users, ShieldCheck, Building2, Activity } from 'lucide-react'

export default async function AdminDashboardPage() {
  const stats = await getGlobalStats()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Institutional Overview</h1>
        <p className="text-slate-500 font-medium">Global system metrics for BMU SAMS</p>
      </div>

      {/* Global University Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Students" 
          value={stats.totalStudents} 
          icon={Users} 
          trend="Live" 
          color="blue" 
        />
        <StatCard 
          title="Academic Staff" 
          value={stats.totalLecturers} 
          icon={Building2} 
          trend="Verified" 
          color="maroon" 
        />
        <StatCard 
          title="Faculty Deans" 
          value={stats.totalDeans} 
          icon={ShieldCheck} 
          trend="Active" 
          color="blue" 
        />
        <StatCard 
          title="System Uptime" 
          value="100%" 
          icon={Activity} 
          trend="Stable" 
          color="green" 
        />
      </div>

      <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-medical">
        <h3 className="font-bold text-slate-900">System Notifications</h3>
        <p className="text-sm text-slate-400 mt-2 italic">No critical system alerts at this time.</p>
      </div>
    </div>
  )
}