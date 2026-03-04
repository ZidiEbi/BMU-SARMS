import { redirect } from 'next/navigation'
import { getAuthProfileOrRedirect, routeGate, requireRole } from '@/lib/auth/guards'
import ResultsTable from '@/components/dashboard/lecturer/ResultsTable'

type SearchParams = { session?: string; semester?: string }

export default async function LecturerCoursePage({
  params,
  searchParams,
}: {
  params: { courseId: string }
  searchParams: SearchParams
}) {
  const { supabase, user, profile } = await getAuthProfileOrRedirect()
  requireRole(profile, ['lecturer'])
  routeGate(profile)

  const courseId = params.courseId
  const session = searchParams.session ?? null
  const semester = searchParams.semester ?? null

  // Safety: ensure lecturer is assigned this course (for session/semester if provided)
  let assignmentQuery = supabase
    .from('course_assignments')
    .select('id, course_id, session, semester, units, course_code, course_name')
    .eq('lecturer_id', user.id)
    .eq('course_id', courseId)

  if (session) assignmentQuery = assignmentQuery.eq('session', session)
  if (semester) assignmentQuery = assignmentQuery.eq('semester', semester)

  const { data: assignment, error: assignmentError } = await assignmentQuery.maybeSingle()

  if (assignmentError) {
    console.error('Assignment error:', assignmentError.message)
    redirect('/dashboard/lecturer')
  }

  if (!assignment) {
    // Not assigned → deny
    redirect('/dashboard/lecturer')
  }

  // Get enrollments + students + results (results are 1:1 with enrollment)
  // Note: select syntax may depend on how your relationships are named in Supabase.
  // If it errors, I’ll adjust once you paste the exact error message.
  const { data: enrollments, error: enrollErr } = await supabase
    .from('enrollments')
    .select(`
      id,
      student_id,
      session,
      semester,
      students:student_id ( id, matric_number, full_name ),
      results:results ( id, ca_score, exam_score, score, grade, status, remark_code, updated_at )
    `)
    .eq('course_id', courseId)
    .eq('session', assignment.session)
    .eq('semester', assignment.semester)
    .order('created_at', { ascending: true })

  if (enrollErr) {
    console.error('Enrollments error:', enrollErr.message)
  }

  return (
    <div className="space-y-8">
      <header className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Course Workspace</p>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 mt-2">
              {(assignment.course_code ?? 'COURSE').toUpperCase()} — {assignment.course_name ?? 'Untitled'}
            </h1>
            <p className="text-slate-500 font-medium mt-2">
              {assignment.session} • {assignment.semester} Semester • {assignment.units ?? 0} Unit(s)
            </p>
          </div>
        </div>
      </header>

      <ResultsTable
        courseId={courseId}
        session={assignment.session}
        semester={assignment.semester}
        rows={(enrollments ?? []) as any[]}
      />
    </div>
  )
}