import { createSupabaseServerClient } from "@/lib/supabase/server"

/**
 * Adjust these selects to match your actual schema.
 * Typical design:
 * - course_assignments: id, course_id, lecturer_id
 * - courses: id, course_code, course_name, units, semester
 */
export async function getLecturerCourses(lecturerId: string) {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("course_assignments")
    .select(`
      course_id,
      courses:course_id (
        id,
        course_code,
        course_name,
        units,
        semester
      )
    `)
    .eq("lecturer_id", lecturerId)

  if (error) {
    console.error("getLecturerCourses:", error.message)
    return []
  }

  return (data || [])
    .map((row: any) => row.courses)
    .filter(Boolean)
}

export async function getCourseWithRosterForLecturer({
  lecturerId,
  courseId,
}: {
  lecturerId: string
  courseId: string
}) {
  const supabase = await createSupabaseServerClient()

  // 1) Ensure lecturer owns the course assignment
  const { data: owns, error: ownsErr } = await supabase
    .from("course_assignments")
    .select("course_id")
    .eq("lecturer_id", lecturerId)
    .eq("course_id", courseId)
    .maybeSingle()

  if (ownsErr) {
    console.error("ownership check:", ownsErr.message)
    return null
  }
  if (!owns) return null

  // 2) Course details
  const { data: course, error: courseErr } = await supabase
    .from("courses")
    .select("id, course_code, course_name, units, semester")
    .eq("id", courseId)
    .maybeSingle()

  if (courseErr || !course) return null

  // 3) Roster (adjust to your actual schema)
  // Common: enrollments(student_id, course_id) join students(id, matric_no, full_name)
  const { data: roster, error: rosterErr } = await supabase
    .from("enrollments")
    .select(`
      student_id,
      students:student_id ( id, matric_no, full_name ),
      results:results!left(course_id,student_id) ( ca_score, exam_score, absent_status )
    `)
    .eq("course_id", courseId)

  if (rosterErr) {
    console.error("roster fetch:", rosterErr.message)
    return { course, students: [] }
  }

  const students = (roster || []).map((r: any) => ({
    student_id: r.student_id,
    matric_no: r.students?.matric_no ?? "—",
    full_name: r.students?.full_name ?? "—",
    existing: r.results?.[0]
      ? {
          ca_score: r.results[0].ca_score,
          exam_score: r.results[0].exam_score,
          absent_status: r.results[0].absent_status ?? "none",
        }
      : undefined,
  }))

  return { course, students }
}