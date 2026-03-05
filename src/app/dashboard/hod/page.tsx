import { redirect } from "next/navigation"
import StaffManagement from "@/components/dashboard/hod/StaffManagement"
import { getAuthProfileOrRedirect, requireRole } from "@/lib/auth/guards"
import CourseCreator from "@/components/dashboard/hod/CourseCreator"
import CourseList from "@/components/dashboard/hod/CourseList"

export default async function HODDashboard() {
  console.log("📊 HOD DASHBOARD PAGE RENDERING")
  const { supabase, profile } = await getAuthProfileOrRedirect()
  console.log("📊 HOD page - profile role:", profile.role)

  // Security & Role Guards
  requireRole(profile, ["hod", "admin", "SUPER_ADMIN"])

  // Fetch Department Name to avoid UUID "Mess"
  const { data: profileData } = await supabase
    .from("profiles")
    .select(`
      department_id,
      departments:department_id (
        name
      )
    `)
    .eq("id", profile.id)
    .single()

  const rawDeptId = profileData?.department_id
  const isAdmin = profile.role === "SUPER_ADMIN" || profile.role === "admin"
  
  const deptLabel = (profileData as any)?.departments?.name 
    || (isAdmin ? "University-Wide Oversight" : rawDeptId) 
    || "General Department"

  if (!rawDeptId && !isAdmin) return redirect("/auth/pending")

  let lecturerQuery = supabase
    .from("profiles")
    .select("id, full_name, staff_id, role, is_verified, title, avatar_url")
    .eq("role", "lecturer")

  if (rawDeptId) {
    lecturerQuery = lecturerQuery.eq("department_id", rawDeptId)
  }

  const [lecturersRes, assignmentsRes, coursesRes] = await Promise.all([
    lecturerQuery,
    supabase.from("course_assignments").select(`*, profiles:lecturer_id (full_name)`),
    supabase.from("courses")
      .select("*")
      .eq(rawDeptId ? "department_id" : "", rawDeptId || "")
  ])

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      {isAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-amber-800 font-medium">
            👑 You are viewing in Admin mode - showing all departments
          </p>
        </div>
      )}

      <div id="courses" className="space-y-6 scroll-mt-10">
        <CourseCreator department={rawDeptId || "GENERAL"} />
        <CourseList courses={coursesRes.data || []} />
      </div>

      <div id="staff" className="scroll-mt-10">
        <StaffManagement
          lecturers={lecturersRes.data || []}
          department={deptLabel} 
          assignments={assignmentsRes.data || []}
          allDepartmentCourses={coursesRes.data || []}
        />
      </div>

      <div id="allocations" className="scroll-mt-10">
        {/* Placeholder for Allocations component */}
      </div>
    </div>
  )
}