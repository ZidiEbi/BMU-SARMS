import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getHODStats } from '@/lib/data/stats'
import StatCard from '@/components/dashboard/StatCard'
import AssignCourse from '@/components/dashboard/hod/AssignCourse'
import DeleteAssignmentBtn from '@/components/dashboard/hod/DeleteAssignmentBtn'
import { Users, BookOpen, Fingerprint, ShieldAlert, GraduationCap } from 'lucide-react'

export default async function HODDashboard() {
  const supabase = await createSupabaseServerClient()
  
  // 1. Identify the HOD's Identity & Department
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('department, full_name')
    .eq('id', user?.id)
    .single()

  // 2. Security Check: Block access if department isn't assigned
  if (!profile?.department) {
    return (
      <div className="bg-amber-50 p-10 rounded-[2.5rem] border border-amber-100 flex flex-col items-center text-center">
        <div className="bg-amber-100 p-4 rounded-full mb-4">
          <ShieldAlert className="text-amber-600" size={32} />
        </div>
        <h3 className="text-amber-900 font-black text-xl">Department Unassigned</h3>
        <p className="text-amber-700 max-w-md mt-2">
          Your account is verified as an HOD, but you haven't been assigned to a department yet. 
          Please contact the <strong>Super Admin</strong> to complete your setup.
        </p>
      </div>
    )
  }

  // 3. Parallel Data Fetching
  const [stats, lecturersRes, assignmentsRes] = await Promise.all([
    getHODStats(profile.department),
    
    // FETCH ALL LECTURERS: Allows inter-departmental assignments
    supabase
      .from('profiles')
      .select('id, full_name, department')
      .eq('role', 'lecturer')
      .order('full_name'),

    // FETCH ASSIGNMENTS: Only for THIS HOD's department
    supabase
      .from('course_assignments')
      .select('*, profiles(full_name, department)')
      .eq('department', profile.department)
      .order('created_at', { ascending: false })
  ])

  const lecturers = lecturersRes.data || []
  const assignments = assignmentsRes.data || []

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Fingerprint size={14} className="text-bmu-maroon" />
            <span className="text-[10px] font-black text-bmu-maroon uppercase tracking-widest">Academic Administration</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight lowercase first-letter:uppercase">
            Dept. of {profile.department}
          </h1>
        </div>
        
        <div className="hidden lg:block text-right">
           <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Authorized HOD</p>
           <p className="text-sm font-black text-bmu-blue uppercase">{profile.full_name}</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Student Population" 
          value={stats.studentCount} 
          icon={Users} 
          trend="Live" 
          color="blue" 
        />
        <StatCard 
          title="Department Faculty" 
          value={stats.lecturerCount} 
          icon={GraduationCap} 
          trend="Verified" 
          color="maroon" 
        />
        <StatCard 
          title="Active Modules" 
          value={assignments.length} 
          icon={BookOpen} 
          trend="Semester 1" 
          color="green" 
        />
      </div>

      {/* 1. Assignment Tool: Now receives the "Global" lecturer list */}
      <AssignCourse lecturers={lecturers} department={profile.department} />

      {/* 2. Course Assignment List */}
      <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-medical">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h4 className="font-bold text-slate-900 text-lg">Course Allocation Log</h4>
            <p className="text-xs text-slate-400 font-medium mt-1">Modules currently assigned to lecturers for this department</p>
          </div>
          <span className="px-4 py-2 bg-bmu-blue/5 text-bmu-blue text-[10px] font-black rounded-xl border border-bmu-blue/10 uppercase tracking-widest">
            {assignments.length} Active
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {assignments.length > 0 ? (
            assignments.map((asgn) => (
              <div key={asgn.id} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-3xl border border-slate-100 hover:border-bmu-blue/20 transition-all group">
                <div className="flex items-center gap-6">
                  {/* Course Code Identifier */}
                  <div className="h-12 w-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center font-black text-bmu-blue text-[10px] uppercase">
                    {asgn.course_code.split(' ')[0]}
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-bmu-blue uppercase tracking-tighter">{asgn.course_code}</span>
                    <h5 className="text-sm font-bold text-slate-900 uppercase">{asgn.course_name}</h5>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5 tracking-wide italic">{asgn.semester} Semester</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-10">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned Specialist</p>
                    <p className="text-sm font-black text-slate-700">{asgn.profiles?.full_name}</p>
                    {/* Visual indicator if lecturer is from another department */}
                    {asgn.profiles?.department !== profile.department && (
                      <span className="text-[9px] font-bold text-bmu-maroon bg-bmu-maroon/5 px-2 py-0.5 rounded-md mt-1 inline-block">
                        External: {asgn.profiles?.department}
                      </span>
                    )}
                  </div>
                  
                  {/* Client component for the delete action */}
                  <DeleteAssignmentBtn id={asgn.id} />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/30">
              <BookOpen className="mx-auto text-slate-200 mb-4" size={48} />
              <p className="text-slate-400 font-medium italic text-sm">No course assignments found for this department.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}