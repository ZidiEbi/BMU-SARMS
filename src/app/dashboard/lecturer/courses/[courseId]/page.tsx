import { redirect } from 'next/navigation'
import { getAuthProfileOrRedirect, routeGate, requireRole } from '@/lib/auth/guards'
import ResultsTable from '@/components/dashboard/lecturer/ResultsTable'

type Row = {
  id: string
  students?: { matric_number: string; full_name: string } | null
  results?: {
    id: string
    ca_score: number | null
    exam_score: number | null
    score: number | null
    grade: string | null
    status: string
    remark_code: string | null
    updated_at?: string | null
  }[] | null
}

type AuditRow = {
  result_id: string
  action: string
  note: string | null
}

export default async function LecturerCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { supabase, user, profile } = await getAuthProfileOrRedirect()
  requireRole(profile, ['lecturer'])
  routeGate(profile)

  const { courseId } = await params
  const offeringId = courseId

  if (!offeringId || offeringId === 'undefined') {
    console.error('Invalid offeringId route param:', offeringId)
    redirect('/dashboard/lecturer')
  }

  const { data: offering, error: offeringError } = await supabase
    .from('course_offerings')
    .select(`
      id,
      level,
      semester,
      session,
      status,
      lecturer_id,
      courses!course_offerings_course_id_fkey (
        id,
        code,
        title,
        unit
      )
    `)
    .eq('id', offeringId)
    .eq('lecturer_id', user.id)
    .eq('status', 'published')
    .maybeSingle()

  if (offeringError) {
    console.error('Offering error:', offeringError.message)
    redirect('/dashboard/lecturer')
  }

  if (!offering) {
    console.error('No offering found for lecturer:', offeringId)
    redirect('/dashboard/lecturer')
  }

  const course = Array.isArray(offering.courses) ? offering.courses[0] ?? null : offering.courses

  const { data: registrations, error: regErr } = await supabase
    .from('course_registrations')
    .select(`
      id,
      student_id,
      students:student_id (
        matric_number,
        full_name
      ),
      results:results (
        id,
        ca_score,
        exam_score,
        score,
        grade,
        status,
        remark_code,
        updated_at
      )
    `)
    .eq('course_offering_id', offeringId)
    .eq('registration_status', 'registered')
    .order('created_at', { ascending: true })

  if (regErr) {
    console.error('Registrations error:', regErr.message)
  }

  const resultIds = (registrations ?? [])
    .map((registration: any) => {
      const result = Array.isArray(registration.results)
        ? registration.results[0]
        : registration.results
      return result?.id ?? null
    })
    .filter((id: string | null): id is string => Boolean(id))

  let workflowNote: string | null = null

  if (resultIds.length > 0) {
    const { data: auditData, error: auditError } = await supabase
      .from('result_audit_logs')
      .select('result_id, action, note')
      .in('result_id', resultIds)
      .in('action', ['HOD_RETURNED_BATCH', 'HOD_REJECTED_BATCH'])

    if (auditError) {
      console.error('Audit note lookup error:', auditError.message)
    } else {
      const notes = (auditData ?? []) as AuditRow[]
      workflowNote = notes.find((row) => row.note)?.note ?? null
    }
  }

  return (
    <div className="space-y-8">
      <header className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Lecturer Offering Workspace
            </p>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 mt-2">
              {(course?.code ?? 'COURSE').toUpperCase()} — {course?.title ?? 'Untitled'}
            </h1>
            <p className="text-slate-500 font-medium mt-2">
              {offering.session} • {offering.semester} • {offering.level} Level • {course?.unit ?? 0} Unit(s)
            </p>
          </div>
        </div>
      </header>

      <ResultsTable
        courseId={offeringId}
        session={offering.session}
        semester={offering.semester}
        level={offering.level}
        workflowNote={workflowNote}
        rows={(registrations ?? []) as unknown as Row[]}
      />
    </div>
  )
}