import { notFound, redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import HODOfferingWorkspace from '@/components/dashboard/hod/HODOfferingWorkspace'
import HODOfferingHistoryPanel, {
  type OfferingAllocationHistoryItem,
  type OfferingResultHistoryItem,
} from '@/components/dashboard/hod/HODOfferingHistoryPanel'

type PageProps = {
  params: Promise<{ offeringId: string }>
}

type AllocationAuditRow = {
  id: string
  offering_id: string
  previous_lecturer_id: string | null
  new_lecturer_id: string | null
  actor_id: string
  actor_role: string
  action: string
  note: string | null
  created_at: string
}

type ResultAuditRow = {
  id: string
  result_id: string
  actor_id: string
  actor_role: string
  action: string
  field_changed: string | null
  old_value: string | null
  new_value: string | null
  note: string | null
  created_at: string
}

type StudentRow = {
  id: string
  matric_number: string | null
  full_name: string | null
  level: string | null
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
  const isAdmin = normalizedRole === 'admin' || normalizedRole === 'super_admin'
  const isHod = normalizedRole === 'hod'

  if (!isAdmin && !isHod) {
    redirect('/dashboard')
  }

  if (isHod && !profile.department_id) {
    redirect('/auth/pending')
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
      courses!course_offerings_course_id_fkey (
        id,
        code,
        title,
        unit,
        department_id
      ),
      lecturer:profiles!course_offerings_lecturer_id_fkey (
        id,
        full_name,
        staff_id
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
    .eq('id', offeringId)

  if (isHod && profile.department_id) {
    offeringQuery = offeringQuery.eq('department_id', profile.department_id)
  }

  const { data: offering, error: offeringError } = await offeringQuery.maybeSingle()

  if (offeringError) {
    throw new Error(`HOD offering fetch failed: ${offeringError.message}`)
  }

  if (!offering) {
    notFound()
  }

  const studentIds = Array.from(
    new Set(
      (offering.course_registrations ?? [])
        .map((registration) => registration.student_id)
        .filter((id): id is string => Boolean(id))
    )
  )

  const { data: studentsRaw, error: studentsError } = studentIds.length
    ? await supabase
        .from('students')
        .select('id, matric_number, full_name, level')
        .in('id', studentIds)
    : { data: [] as StudentRow[], error: null }

  if (studentsError) {
    throw new Error(`Failed to load students for offering: ${studentsError.message}`)
  }

  const studentById = new Map<string, StudentRow>()
  for (const student of (studentsRaw ?? []) as StudentRow[]) {
    studentById.set(student.id, student)
  }

  const normalizedRegistrations = (offering.course_registrations ?? []).map((registration) => {
    const student = registration.student_id
      ? studentById.get(registration.student_id) ?? null
      : null

    const normalizedResults = registration.results
      ? Array.isArray(registration.results)
        ? registration.results.map((result) => ({
            ...result,
            total_score: result.ca_score !== null || result.exam_score !== null ? (result.ca_score ?? 0) + (result.exam_score ?? 0) : null,
          }))
        : registration.results
          ? [
              {
                ...(registration.results as any),
                total_score:
                  (registration.results as any).ca_score !== null || (registration.results as any).exam_score !== null
                    ? ((registration.results as any).ca_score ?? 0) + ((registration.results as any).exam_score ?? 0)
                    : null,
              },
            ]
          : []
      : []

    return {
      ...registration,
      offering_id: offering.id,
      created_at: offering.created_at,
      students: student,
      results: normalizedResults,
    }
  })

  const resultIds = normalizedRegistrations.flatMap((registration) =>
    (registration.results ?? [])
      .map((result) => result?.id)
      .filter((id): id is string => Boolean(id))
  )

  const [{ data: allocationLogs, error: allocationError }, { data: resultLogs, error: resultError }] =
    await Promise.all([
      supabase
        .from('allocation_audit_logs')
        .select(
          'id, offering_id, previous_lecturer_id, new_lecturer_id, actor_id, actor_role, action, note, created_at'
        )
        .eq('offering_id', offeringId)
        .order('created_at', { ascending: false })
        .limit(40),
      resultIds.length > 0
        ? supabase
            .from('result_audit_logs')
            .select(
              'id, result_id, actor_id, actor_role, action, field_changed, old_value, new_value, note, created_at'
            )
            .in('result_id', resultIds)
            .order('created_at', { ascending: false })
            .limit(100)
        : Promise.resolve({ data: [] as ResultAuditRow[], error: null }),
    ])

  if (allocationError) {
    throw new Error(`Failed to load offering allocation history: ${allocationError.message}`)
  }

  if (resultError) {
    throw new Error(`Failed to load offering result history: ${resultError.message}`)
  }

  const allocationRows = (allocationLogs ?? []) as AllocationAuditRow[]
  const resultRows = (resultLogs ?? []) as ResultAuditRow[]

  const peopleIds = Array.from(
    new Set(
      [
        ...allocationRows.flatMap((row) => [
          row.actor_id,
          row.previous_lecturer_id,
          row.new_lecturer_id,
        ]),
        ...resultRows.map((row) => row.actor_id),
      ].filter(Boolean)
    )
  ) as string[]

  const { data: people, error: peopleError } = peopleIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', peopleIds)
    : { data: [], error: null }

  if (peopleError) {
    throw new Error(`Failed to resolve offering history names: ${peopleError.message}`)
  }

  const personNameById = new Map<string, string>()
  for (const person of people ?? []) {
    personNameById.set(person.id, person.full_name ?? 'Unknown User')
  }

  const resultMetaById = new Map<
    string,
    {
      studentName: string
      matricNumber: string
      currentStatus: string | null
    }
  >()

  for (const registration of normalizedRegistrations) {
    for (const result of (registration.results as any[]) ?? []) {
      if (!result?.id) continue

      resultMetaById.set(result.id, {
        studentName: registration.students?.full_name ?? 'Unknown Student',
        matricNumber: registration.students?.matric_number ?? '—',
        currentStatus: result.status ?? null,
      })
    }
  }

  const allocationHistory: OfferingAllocationHistoryItem[] = allocationRows.map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    action: row.action,
    note: row.note,
    actorName: personNameById.get(row.actor_id) ?? 'Unknown User',
    actorRole: row.actor_role,
    previousLecturerName: row.previous_lecturer_id
      ? personNameById.get(row.previous_lecturer_id) ?? 'Unknown Lecturer'
      : null,
    newLecturerName: row.new_lecturer_id
      ? personNameById.get(row.new_lecturer_id) ?? 'Unknown Lecturer'
      : null,
  }))

  const resultHistory: OfferingResultHistoryItem[] = resultRows.map((row) => {
    const meta = resultMetaById.get(row.result_id)
    const isStatusChange = row.field_changed === 'status'
    const previousStatus = isStatusChange ? row.old_value : null
    const currentStatus = isStatusChange ? row.new_value : (meta?.currentStatus ?? null)

    return {
      id: row.id,
      createdAt: row.created_at,
      action: row.action,
      note: row.note,
      actorName: personNameById.get(row.actor_id) ?? 'Unknown User',
      actorRole: row.actor_role,
      previousStatus,
      currentStatus,
      studentName: meta?.studentName ?? 'Unknown Student',
      matricNumber: meta?.matricNumber ?? '—',
    }
  })

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <HODOfferingWorkspace
        profile={profile}
        offering={offering}
        registrations={normalizedRegistrations}
      />

      <HODOfferingHistoryPanel
        offeringId={offering.id}
        allocationHistory={allocationHistory}
        resultHistory={resultHistory}
      />
    </div>
  )
}