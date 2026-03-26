import { redirect } from 'next/navigation'
import { getAuthProfileOrRedirect, requireRole } from '@/lib/auth/guards'

export type DeanResultItem = {
  id?: string
  ca_score: number | null
  exam_score: number | null
  total_score: number | null
  grade: string | null
  status:
    | 'DRAFT'
    | 'SUBMITTED'
    | 'HOD_APPROVED'
    | 'DEAN_APPROVED'
    | 'LOCKED'
    | null
  updated_at?: string | null
}

export type DeanRegistrationItem = {
  id: string
  student_id?: string | null
  registration_status?: string | null
  students?: {
    id?: string
    matric_number: string
    full_name: string
    level?: string | number | null
  } | null
  results?: DeanResultItem[] | null
}

type RawResultItem = {
  id?: string
  ca_score: number | null
  exam_score: number | null
  score: number | null
  grade: string | null
  status:
    | 'DRAFT'
    | 'SUBMITTED'
    | 'HOD_APPROVED'
    | 'DEAN_APPROVED'
    | 'LOCKED'
    | null
  updated_at?: string | null
}

type RawRegistrationItem = {
  id: string
  student_id?: string | null
  registration_status?: string | null
  students?:
    | {
        id?: string
        matric_number: string
        full_name: string
      }
    | {
        id?: string
        matric_number: string
        full_name: string
      }[]
    | null
  results?: RawResultItem[] | RawResultItem | null
}

type RawOffering = {
  id: string
  level: string
  semester: string
  session: string
  status: string
  lecturer_id: string | null
  created_at: string | null
  course_id: string
  department_id: string
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
      }
    | {
        id: string
        full_name: string | null
      }[]
    | null
  departments:
    | {
        id: string
        name: string
        faculty_id: string
      }
    | {
        id: string
        name: string
        faculty_id: string
      }[]
    | null
  course_registrations: RawRegistrationItem[] | null
}

export type DeanOffering = {
  id: string
  level: string
  semester: string
  session: string
  status: string
  lecturer_id: string | null
  created_at?: string
  course_id: string
  department_id: string
  courses: {
    id: string
    code: string
    title: string
    unit: number
  } | null
  lecturer?: {
    id: string
    full_name: string | null
  } | null
  departments?: {
    id: string
    name: string
    faculty_id: string
  } | null
  course_registrations: DeanRegistrationItem[]
}

export type DeanDepartment = {
  id: string
  name: string
  faculty_id: string
}

export async function getDeanPageData() {
  const { supabase, profile } = await getAuthProfileOrRedirect()

  requireRole(profile, ['dean'])

  if (!profile.faculty_id) {
    redirect('/auth/pending')
  }

  const { data: faculty } = await supabase
    .from('faculties')
    .select('id, name')
    .eq('id', profile.faculty_id)
    .maybeSingle()

  const { data: departmentsRes, error: departmentsError } = await supabase
    .from('departments')
    .select('id, name, faculty_id')
    .eq('faculty_id', profile.faculty_id)
    .order('name', { ascending: true })

  if (departmentsError) {
    throw new Error(`Failed to load dean departments: ${departmentsError.message}`)
  }

  const departments = (departmentsRes ?? []) as DeanDepartment[]
  const departmentIds = departments.map((department) => department.id)

  let offerings: DeanOffering[] = []

  if (departmentIds.length > 0) {
    const { data: offeringsRes, error: offeringsError } = await supabase
      .from('course_offerings')
      .select(`
        id,
        level,
        semester,
        session,
        status,
        lecturer_id,
        created_at,
        course_id,
        department_id,
        courses!course_offerings_course_id_fkey (
          id,
          code,
          title,
          unit
        ),
        lecturer:profiles!course_offerings_lecturer_id_fkey (
          id,
          full_name
        ),
        departments!course_offerings_department_id_fkey (
          id,
          name,
          faculty_id
        ),
        course_registrations (
          id,
          student_id,
          registration_status,
          students:student_id (
            id,
            matric_number,
            full_name
          ),
          results (
            id,
            ca_score,
            exam_score,
            score,
            grade,
            status,
            updated_at
          )
        )
      `)
      .in('department_id', departmentIds)
      .order('created_at', { ascending: false })

    if (offeringsError) {
      throw new Error(`Failed to load dean offerings: ${offeringsError.message}`)
    }

    offerings = ((offeringsRes as RawOffering[] | null) ?? []).map((offering) => ({
      id: offering.id,
      level: offering.level,
      semester: offering.semester,
      session: offering.session,
      status: offering.status,
      lecturer_id: offering.lecturer_id,
      created_at: offering.created_at || undefined,
      course_id: offering.course_id,
      department_id: offering.department_id,
      courses: Array.isArray(offering.courses)
        ? offering.courses[0] || null
        : offering.courses,
      lecturer: Array.isArray(offering.lecturer)
        ? offering.lecturer[0] || null
        : offering.lecturer,
      departments: Array.isArray(offering.departments)
        ? offering.departments[0] || null
        : offering.departments,
      course_registrations: (offering.course_registrations ?? []).map((registration) => {
        const studentData = Array.isArray(registration.students)
          ? registration.students[0]
          : registration.students

        const rawResults = registration.results
          ? Array.isArray(registration.results)
            ? registration.results
            : [registration.results]
          : []

        const mappedResults: DeanResultItem[] = rawResults.map((result) => ({
          id: result.id,
          ca_score: result.ca_score,
          exam_score: result.exam_score,
          total_score: result.score,
          grade: result.grade,
          status: result.status,
          updated_at: result.updated_at,
        }))

        return {
          id: registration.id,
          student_id: registration.student_id ?? null,
          registration_status: registration.registration_status ?? null,
          students: studentData
            ? {
                id: studentData.id,
                matric_number: studentData.matric_number,
                full_name: studentData.full_name,
                level: offering.level ?? null,
              }
            : null,
          results: mappedResults,
        }
      }),
    }))
  }

  return {
    profile,
    facultyId: profile.faculty_id,
    facultyLabel: faculty?.name ?? 'Assigned Faculty',
    departments,
    offerings,
  }
}