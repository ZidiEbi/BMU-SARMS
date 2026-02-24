import { createSupabaseServerClient } from '@/lib/supabase/server'
import AssignCourse from '@/components/dashboard/hod/AssignCourse'
import StaffManagement from '@/components/dashboard/hod/StaffManagement'
import DeleteAssignment from '@/components/dashboard/hod/DeleteAssignmentBtn'
import { redirect } from 'next/navigation'

export default async function HODDashboard() {
  const supabase = await createSupabaseServerClient()

  // 1. Get the current HOD's profile to know their department
  const { data: { user } } = await supabase.auth.getUser()
  const { data: hodProfile } = await supabase
    .from('profiles')
    .select('department, faculty')
    .eq('id', user?.id)
    .single()

  if (!hodProfile?.department) {
    redirect('/setup-department') // Security redirect if HOD has no dept
  }

  // 2. Fetch all lecturers who claim to be in this HOD's department
  // We include 'is_verified' and 'staff_id' for the Management component
  const { data: lecturers } = await supabase
    .from('profiles')
    .select('id, full_name, staff_id, department, is_verified, title')
    .eq('role', 'lecturer')
    .eq('department', hodProfile.department)
    .order('full_name', { ascending: true })

  // 3. Fetch existing course assignments for this department
  const { data: assignments } = await supabase
  .from('course_assignments')
  .select('*')
  .eq('role', 'lecturer')
  .eq('department', hodProfile.department) // This only works if BOTH are "Nursing"

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      <header className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
          {hodProfile.department} Dashboard
        </h1>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">
          Faculty of {hodProfile.faculty}
        </p>
      </header>

      {/* Course Allocation Tool */}
      <section>
        <AssignCourse 
          lecturers={lecturers || []} 
          department={hodProfile.department} 
        />
      </section>

      {/* Staff Management & Verification */}
      <section>
        <StaffManagement 
          lecturers={lecturers || []}
          department={hodProfile.department} assignments={[]} allDepartmentCourses={[]}        />
      </section>

      {/* List of current assignments with ability to delete */}
      <section>
        <DeleteAssignment assignments={assignments || []} />
      </section>
    </div>
  )
}