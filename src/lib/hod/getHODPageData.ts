import { redirect } from 'next/navigation'
import { getAuthProfileOrRedirect, requireRole } from '@/lib/auth/guards'

export type HODResultItem = {
  id?: string
  ca_score: number | null
  exam_score: number | null
  total_score: number | null
  grade: string | null
  remark_code: string | null
  status:
    | 'DRAFT'
    | 'SUBMITTED'
    | 'HOD_APPROVED'
    | 'DEAN_APPROVED'
    | 'LOCKED'
    | null
  updated_at?: string | null
}

export type HODRegistrationItem = {
  id: string
  student_id?: string | null
  registration_status?: string | null
  students?: {
    matric_number: string
    full_name: string
  } | null
  results?: HODResultItem[] | null
}

type RawResultItem = {
  id?: string
  ca_score: number | null
  exam_score: number | null
  score: number | null
  grade: string | null
  remark_code: string | null
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
        matric_number: string
        full_name: string
      }
    | {
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
        staff_id: string | null
      }
    | {
        id: string
        full_name: string | null
        staff_id: string | null
      }[]
    | null
  course_registrations: RawRegistrationItem[] | null
}

type RawLecturer = {
  id: string
  full_name: string | null
  staff_id: string | null
  role?: string | null
  is_verified: boolean | null
  title?: string | null
  avatar_url?: string | null
  department_id?: string | null
  faculty_id?: string | null
  requested_department_id?: string | null
}

type DepartmentLookup = {
  id: string
  name: string
  faculty_id?: string | null
}

type FacultyLookup = {
  id: string
  name: string
}

export type HODOffering = {
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
    staff_id: string | null
  } | null
  course_registrations: HODRegistrationItem[]
}

export type HODLecturer = {
  id: string
  full_name: string | null
  staff_id: string | null
  role?: string | null
  is_verified: boolean | null
  title?: string | null
  avatar_url?: string | null
  department_id?: string | null
  faculty_id?: string | null
  requested_department_id?: string | null
  department_name?: string | null
  faculty_name?: string | null
  requested_department_name?: string | null
}

function normalizeRole(role: string | null | undefined) {
  return String(role ?? '').trim().toLowerCase()
}

function toSingle<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export async function getHODPageData() {
  const { supabase, profile } = await getAuthProfileOrRedirect()

  requireRole(profile, ['hod', 'admin', 'SUPER_ADMIN'])

  const normalizedRole = normalizeRole(profile.role)
  const isAdmin = normalizedRole === 'super_admin' || normalizedRole === 'admin'
  const rawDeptId = profile.department_id ?? null

  if (!rawDeptId && !isAdmin) {
    return redirect('/auth/pending')
  }

  let departmentLabel = isAdmin ? 'University-Wide Oversight' : 'General Department'

  if (rawDeptId) {
    const { data: departmentData, error: departmentError } = await supabase
      .from('departments')
      .select('id, name')
      .eq('id', rawDeptId)
      .maybeSingle()

    if (departmentError) {
      throw new Error(`Failed to load department label: ${departmentError.message}`)
    }

    departmentLabel = departmentData?.name || 'General Department'
  }

  const lecturersQuery = supabase
    .from('profiles')
    .select(
      'id, full_name, staff_id, role, is_verified, title, avatar_url, department_id, faculty_id, requested_department_id'
    )
    .eq('role', 'lecturer')
    .order('is_verified', { ascending: false })
    .order('full_name', { ascending: true })

  let offeringsQuery = supabase
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
        full_name,
        staff_id
      ),
      course_registrations (
        id,
        student_id,
        registration_status,
        students (
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
    .order('created_at', { ascending: false })

  if (rawDeptId && !isAdmin) {
    offeringsQuery = offeringsQuery.eq('department_id', rawDeptId)
  }

  const departmentsQuery = supabase
    .from('departments')
    .select('id, name, faculty_id')
    .order('name', { ascending: true })

  const facultiesQuery = supabase
    .from('faculties')
    .select('id, name')
    .order('name', { ascending: true })

  const [lecturersRes, offeringsRes, departmentsRes, facultiesRes] = await Promise.all([
    lecturersQuery,
    offeringsQuery,
    departmentsQuery,
    facultiesQuery,
  ])

  if (lecturersRes.error) {
    throw new Error(`Failed to load lecturers: ${lecturersRes.error.message}`)
  }

  if (offeringsRes.error) {
    throw new Error(`Failed to load offerings: ${offeringsRes.error.message}`)
  }

  if (departmentsRes.error) {
    throw new Error(`Failed to load departments: ${departmentsRes.error.message}`)
  }

  if (facultiesRes.error) {
    throw new Error(`Failed to load faculties: ${facultiesRes.error.message}`)
  }

  const departments = (departmentsRes.data ?? []) as DepartmentLookup[]
  const faculties = (facultiesRes.data ?? []) as FacultyLookup[]

  const departmentNameById = new Map<string, string>()
  const departmentFacultyIdById = new Map<string, string | null>()
  for (const department of departments) {
    departmentNameById.set(department.id, department.name)
    departmentFacultyIdById.set(department.id, department.faculty_id ?? null)
  }

  const facultyNameById = new Map<string, string>()
  for (const faculty of faculties) {
    facultyNameById.set(faculty.id, faculty.name)
  }

  const rawLecturers = (lecturersRes.data ?? []) as RawLecturer[]

  const lecturers = rawLecturers
    .filter((lecturer) => {
      if (isAdmin) return true

      if (lecturer.is_verified) return true

      return lecturer.requested_department_id === rawDeptId
    })
    .map((lecturer): HODLecturer => {
      const departmentId = lecturer.department_id ?? null
      const requestedDepartmentId = lecturer.requested_department_id ?? null

      const resolvedFacultyId =
        lecturer.faculty_id ??
        (departmentId ? departmentFacultyIdById.get(departmentId) ?? null : null) ??
        (requestedDepartmentId
          ? departmentFacultyIdById.get(requestedDepartmentId) ?? null
          : null)

      return {
        ...lecturer,
        department_name: departmentId
          ? departmentNameById.get(departmentId) ?? null
          : null,
        requested_department_name: requestedDepartmentId
          ? departmentNameById.get(requestedDepartmentId) ?? null
          : null,
        faculty_name: resolvedFacultyId
          ? facultyNameById.get(resolvedFacultyId) ?? null
          : null,
      }
    })

  const offerings: HODOffering[] = ((offeringsRes.data as RawOffering[] | null) || []).map(
    (offering) => ({
      id: offering.id,
      level: offering.level,
      semester: offering.semester,
      session: offering.session,
      status: offering.status,
      lecturer_id: offering.lecturer_id,
      created_at: offering.created_at || undefined,
      course_id: offering.course_id,
      department_id: offering.department_id,
      courses: toSingle(offering.courses),
      lecturer: toSingle(offering.lecturer),
      course_registrations: (offering.course_registrations ?? []).map((registration) => {
        const studentData = toSingle(registration.students)

        const rawResults = registration.results
          ? Array.isArray(registration.results)
            ? registration.results
            : [registration.results]
          : []

        const mappedResults: HODResultItem[] = rawResults.map((result) => ({
          id: result.id,
          ca_score: result.ca_score,
          exam_score: result.exam_score,
          total_score: result.score,
          grade: result.grade,
          remark_code: result.remark_code,
          status: result.status,
          updated_at: result.updated_at,
        }))

        return {
          id: registration.id,
          student_id: registration.student_id ?? null,
          registration_status: registration.registration_status ?? null,
          students: studentData
            ? {
                matric_number: studentData.matric_number,
                full_name: studentData.full_name,
              }
            : null,
          results: mappedResults,
        }
      }),
    })
  )

  return {
    profile,
    isAdmin,
    departmentLabel,
    lecturers,
    offerings,
  }
}