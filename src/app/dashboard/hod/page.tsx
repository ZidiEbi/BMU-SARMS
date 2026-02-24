import StaffManagement from "@/components/dashboard/hod/StaffManagement"
import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export default async function HODDashboard() {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // 1. Get HOD Profile
  const { data: hodProfile, error: profileError } = await supabase
    .from("profiles")
    .select("department, faculty")
    .eq("id", user.id)
    .single()

  if (profileError || !hodProfile?.department) {
    redirect("/pending") // Security redirect if HOD has no dept or profile fetch fails
  }

  // 2, 3, 4 – Run in parallel
  const [lecturersRes, assignmentsRes, coursesRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, staff_id, department, is_verified, title, avatar_url")
      .eq("role", "lecturer")
      .eq("department", hodProfile.department)
      .order("full_name", { ascending: true }),

    supabase
      .from("course_assignments")
      .select(`
        *,
        profiles:lecturer_id (full_name)
      `),

    supabase
      .from("courses")
      .select("*")
      .eq("department", hodProfile.department),
  ])

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      <StaffManagement
        lecturers={lecturersRes.data || []}
        department={hodProfile.department}
        assignments={assignmentsRes.data || []}
        allDepartmentCourses={coursesRes.data || []}
      />
    </div>
  )
}
