import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import HODOfferingWorkspace from '@/components/dashboard/hod/HODOfferingWorkspace'

type PageProps = {
  params: Promise<{ offeringId: string }>
}

export default async function HODOfferingDetailPage({ params }: PageProps) {
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
    .select('id, role, department_id, full_name')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/auth/login')
  }

  const normalizedRole = String(profile.role || '').trim().toLowerCase()
  const isAdmin =
    normalizedRole === 'admin' || normalizedRole === 'super_admin'
  const isHOD = normalizedRole === 'hod'

  if (!isHOD && !isAdmin) {
    redirect('/dashboard')
  }

  let offeringQuery = supabase
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
      courses (
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
      course_registrations (
        id,
        student_id,
        registration_status,
        students (
          id,
          full_name,
          matric_number
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

  if (isHOD && profile.department_id) {
    offeringQuery = offeringQuery.eq('department_id', profile.department_id)
  }

  const { data: offering, error: offeringError } = await offeringQuery.maybeSingle()

  if (offeringError) {
    throw new Error(`Offering fetch failed: ${offeringError.message}`)
  }

  if (!offering) {
    notFound()
  }

  const normalizedOffering = {
    ...offering,
    published: String(offering.status || '').trim().toLowerCase() === 'published',
  }

  const normalizedRegistrations = (offering.course_registrations ?? []).map((registration) => {
    const normalizedStudent = registration.students
      ? Array.isArray(registration.students)
        ? registration.students.map((student) => ({
            ...student,
            level: offering.level ?? null,
          }))
        : {
            ...registration.students,
            level: offering.level ?? null,
          }
      : null

    const normalizedResults = registration.results
      ? Array.isArray(registration.results)
        ? registration.results.map((result) => ({
            ...result,
            total_score: result.score,
          }))
        : [
            {
              ...registration.results,
              total_score: registration.results.score,
            },
          ]
      : []

    return {
      ...registration,
      offering_id: offering.id,
      created_at: offering.created_at ?? null,
      students: normalizedStudent,
      results: normalizedResults,
    }
  })

  return (
    <div className="space-y-6">
      <HODOfferingWorkspace
        profile={profile}
        offering={normalizedOffering}
        registrations={normalizedRegistrations}
      />
    </div>
  )
}