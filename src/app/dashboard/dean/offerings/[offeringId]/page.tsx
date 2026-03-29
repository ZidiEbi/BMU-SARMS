import { redirect, notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import DeanOfferingWorkspace from '@/components/dashboard/dean/DeanofferingWorkspace'

type PageProps = {
  params: Promise<{ offeringId: string }>
}

export default async function DeanOfferingDetailPage({ params }: PageProps) {
  const { offeringId } = await params
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/auth/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, faculty_id, full_name')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/auth/login')
  }

  const normalizedRole = String(profile.role || '').trim().toLowerCase()
  if (normalizedRole !== 'dean') {
    redirect('/dashboard')
  }

  if (!profile.faculty_id) {
    redirect('/auth/pending')
  }

  const { data: departments, error: deptError } = await supabase
    .from('departments')
    .select('id')
    .eq('faculty_id', profile.faculty_id)

  if (deptError) {
    throw new Error(`Failed to load faculty departments: ${deptError.message}`)
  }

  const departmentIds = (departments ?? []).map((department) => department.id)

  if (departmentIds.length === 0) {
    notFound()
  }

  const { data: offering, error: offeringError } = await supabase
    .from('course_offerings')
    .select(`
      id,
      level,
      session,
      semester,
      status,
      lecturer_id,
      department_id,
      created_at,
      courses!course_offerings_course_id_fkey (
        id,
        code,
        title,
        unit,
        department_id
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
    .eq('id', offeringId)
    .in('department_id', departmentIds)
    .maybeSingle()

  if (offeringError) {
    throw new Error(`Dean offering fetch failed: ${offeringError.message}`)
  }

  if (!offering) {
    notFound()
  }

  const normalizedRegistrations = (offering.course_registrations ?? []).map((registration) => {
    const normalizedStudent = registration.students
      ? Array.isArray(registration.students)
        ? registration.students.map((student) => ({
            id: student.id as string,
            matric_number: student.matric_number as string,
            full_name: student.full_name as string,
            level: offering.level ?? null,
          }))
        : {
            id: (registration.students as Record<string, unknown>).id as string,
            matric_number: (registration.students as Record<string, unknown>).matric_number as string,
            full_name: (registration.students as Record<string, unknown>).full_name as string,
            level: offering.level ?? null,
          }
      : null

    const normalizedResults = registration.results
      ? Array.isArray(registration.results)
        ? registration.results.map((result) => ({
            ...result,
            total_score: result.score ?? null,
          }))
        : [
            {
              id: (registration.results as any).id,
              ca_score: (registration.results as any).ca_score,
              exam_score: (registration.results as any).exam_score,
              total_score: (registration.results as any).score ?? null,
              grade: (registration.results as any).grade,
              status: (registration.results as any).status,
              updated_at: (registration.results as any).updated_at,
            },
          ]
      : []

    return {
      ...registration,
      students: normalizedStudent,
      results: normalizedResults,
      offering_id: offering.id,
      created_at: offering.created_at ?? null,
    }
  })

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <DeanOfferingWorkspace
        profile={profile}
        offering={offering}
        registrations={normalizedRegistrations}
      />
    </div>
  )
}