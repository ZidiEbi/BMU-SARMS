import { createSupabaseServerClient } from '@/lib/supabase/server'
import StaffManagement from '@/components/dashboard/hod/StaffManagement'
import CourseList from '@/components/dashboard/hod/CourseList'
import CourseCreator from '@/components/dashboard/hod/CourseCreator'
import HODResultsOverview from '@/components/dashboard/hod/HODResultsOverview'
import { redirect } from 'next/navigation'

type Lecturer = {
  id: string
  full_name: string | null
  staff_id: string | null
  department: string | null
  is_verified: boolean | null
  title?: string | null
  avatar_url?: string | null
  department_id?: string | null
  faculty_id?: string | null
  requested_department_id?: string | null
}

type OfferingRow = {
  id: string
  level: string
  semester: string
  session: string
  status: string
  created_at?: string | null
  updated_at?: string | null
  course_id: string
  department_id: string
  lecturer_id?: string | null
  courses:
    | {
        id: string
        code: string
        title: string
        unit: number
      }
    | {
        id: string
        code: string
        title: string
        unit: number
      }[]
    | null
  lecturer:
    | {
        id: string
        full_name: string | null
        staff_id: string | null
      }
    | {
        id: string
        full_name: string | null
        staff_id: string | null
      }[]
    | null
  course_registrations:
    | {
        id: string
        registration_status?: string | null
        students?: {
          matric_number: string
          full_name: string
        } | null
        results?: {
          id?: string
          ca_score: number | null
          exam_score: number | null
          score: number | null
          grade: string | null
          remark_code: string | null
          status: string
          updated_at?: string | null
        }[] | null
      }[]
    | null
}

export default async function HODDashboard() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: hodProfile, error: hodProfileError } = await supabase
    .from('profiles')
    .select('id, department, faculty, department_id')
    .eq('id', user.id)
    .single()

  if (hodProfileError || !hodProfile) {
    redirect('/auth/login')
  }

  if (!hodProfile.department || !hodProfile.department_id) {
    redirect('/setup-department')
  }

  const { data: lecturersRaw, error: lecturersError } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      staff_id,
      department,
      is_verified,
      title,
      avatar_url,
      department_id,
      faculty_id,
      requested_department_id
    `)
    .eq('role', 'lecturer')
    .or(`department_id.eq.${hodProfile.department_id},requested_department_id.eq.${hodProfile.department_id}`)
    .order('full_name', { ascending: true })

  if (lecturersError) {
    console.error('HOD lecturers error:', lecturersError.message)
  }

  const { data: offeringsRaw, error: offeringsError } = await supabase
    .from('course_offerings')
    .select(`
      id,
      level,
      semester,
      session,
      status,
      created_at,
      updated_at,
      course_id,
      department_id,
      lecturer_id,
      courses!course_offerings_course_id_fkey (
        id,
        code,
        title,
        unit
      ),
      lecturer:profiles!course_offerings_lecturer_id_fkey (
        id,
        full_name,
        staff_id
      ),
      course_registrations (
        id,
        registration_status,
        students:student_id (
          matric_number,
          full_name
        ),
        results (
          id,
          ca_score,
          exam_score,
          score,
          grade,
          remark_code,
          status,
          updated_at
        )
      )
    `)
    .eq('department_id', hodProfile.department_id)
    .order('session', { ascending: false })
    .order('semester', { ascending: true })
    .order('level', { ascending: true })
    .order('created_at', { ascending: false })

  if (offeringsError) {
    console.error('HOD offerings error:', offeringsError.message)
  }

  const lecturers = ((lecturersRaw ?? []) as Lecturer[]).map((lecturer) => ({
    ...lecturer,
  }))

  const offerings = ((offeringsRaw ?? []) as any[]).map((offering) => ({
    ...offering,
    courses: Array.isArray(offering.courses) ? offering.courses[0] ?? null : offering.courses,
    lecturer: Array.isArray(offering.lecturer) ? offering.lecturer[0] ?? null : offering.lecturer,
    course_registrations: (offering.course_registrations ?? []).map((reg: any) => ({
      ...reg,
      students: Array.isArray(reg.students) ? reg.students[0] ?? null : reg.students,
      results: reg.results ?? [],
    })),
  })) as any

  const normalizedOfferings = offerings.map((offering: any) => ({
    ...offering,
    courses:
      offering.courses && !Array.isArray(offering.courses)
        ? offering.courses
        : null,
    registration_count: offering.course_registrations?.length ?? 0,
  }))

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

      <section>
        <CourseCreator department={hodProfile.department} />
      </section>

      <section>
        <CourseList offerings={offerings} />
      </section>

      <section>
        <HODResultsOverview offerings={offerings} />
      </section>

      <section>
        <StaffManagement
          lecturers={lecturers}
          department={hodProfile.department}
          offerings={normalizedOfferings}
        />
      </section>
    </div>
  )
}