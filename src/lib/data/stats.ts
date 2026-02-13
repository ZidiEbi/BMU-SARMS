import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * SUPER ADMIN STATS
 * Fetches global university metrics
 */
export async function getGlobalStats() {
  const supabase = await createSupabaseServerClient()

  const [students, lecturers, deans, hods] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'lecturer'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'dean'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'hod'),
  ])

  return {
    totalStudents: students.count || 0,
    totalLecturers: lecturers.count || 0,
    totalDeans: deans.count || 0,
    totalHods: hods.count || 0,
  }
}

/**
 * DEAN STATS
 * Scoped to a specific Faculty
 */
export async function getDeanStats(facultyName: string) {
  const supabase = await createSupabaseServerClient()

  const [students, lecturers] = await Promise.all([
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student')
      .eq('faculty', facultyName),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'lecturer')
      .eq('faculty', facultyName),
  ])

  return {
    studentCount: students.count || 0,
    lecturerCount: lecturers.count || 0,
    facultyName
  }
}

/**
 * HOD STATS
 * Scoped to a specific Department
 */
export async function getHODStats(deptName: string) {
  const supabase = await createSupabaseServerClient()

  const [students, lecturers] = await Promise.all([
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student')
      .eq('department', deptName),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'lecturer')
      .eq('department', deptName),
  ])

  return {
    studentCount: students.count || 0,
    lecturerCount: lecturers.count || 0,
    departmentName: deptName
  }
}

/**
 * LECTURER STATS
 * Fetches courses assigned to a specific lecturer
 */
export async function getLecturerCourses(lecturerId: string) {
const supabase = await createSupabaseServerClient()
const { data, error } = await supabase
.from('course_assignments')
.select('id, course_id, course_code, course_name, units, semester, session')
.eq('lecturer_id', lecturerId)
if (error) {
console.error('Error:', error.message)
return []
}
return data || []
}

export async function getRegistryOverview() {
  const supabase = await createSupabaseServerClient()

  const { data: staff, error } = await supabase
    .from('profiles')
    .select('*')
    .neq('role', 'student') // Only administrative/academic staff
    .order('created_at', { ascending: false })

  return staff || []
}

export async function getFacultyOverview(facultyName: string) {
  const supabase = await createSupabaseServerClient()

  // Fetch all staff members belonging to this faculty
  const { data: staff } = await supabase
    .from('profiles')
    .select('department, role')
    .eq('faculty', facultyName)

  // Group stats by department
  const deptStats = staff?.reduce((acc: any, curr) => {
    if (!curr.department) return acc
    if (!acc[curr.department]) acc[curr.department] = { lecturers: 0, hods: 0 }
    
    if (curr.role === 'lecturer') acc[curr.department].lecturers++
    if (curr.role === 'hod') acc[curr.department].hods++
    
    return acc
  }, {})

  return {
    totalStaff: staff?.length || 0,
    departments: Object.entries(deptStats || {}).map(([name, stats]: any) => ({
      name,
      ...stats
    }))
  }
}