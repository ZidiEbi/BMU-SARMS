import { NextResponse } from 'next/server'
import { requireLecturer } from '@/lib/auth/guards'

function computeGrade(total: number, remarkCode: string | null) {
  const rc = remarkCode ? remarkCode.toUpperCase() : null
  if (rc?.startsWith('ABS')) return { grade: 'ABS', points: null, score: 0 }
  if (total >= 70) return { grade: 'A', points: 5, score: total }
  if (total >= 60) return { grade: 'B', points: 4, score: total }
  if (total >= 50) return { grade: 'C', points: 3, score: total }
  return { grade: 'F', points: 0, score: total }
}

export async function POST(req: Request) {
  const { supabase, profile } = await requireLecturer()

  const body = await req.json()
  const enrollmentId = String(body.enrollmentId || '')
  const ca = Number(body.ca_score ?? 0)
  const exam = Number(body.exam_score ?? 0)

  // remark_code should be null OR ABS_APPROVED / ABS_UNAPPROVED
  const remarkCode = body.remark_code ? String(body.remark_code).toUpperCase() : null

  if (!enrollmentId) return NextResponse.json({ error: 'Missing enrollmentId' }, { status: 400 })
  if (ca < 0 || ca > 30 || exam < 0 || exam > 70) {
    return NextResponse.json({ error: 'Invalid score range' }, { status: 400 })
  }

  // Fetch enrollment (needed for authorization)
  const { data: enrollment, error: enrollmentErr } = await supabase
    .from('enrollments')
    .select('id, course_id, session, semester')
    .eq('id', enrollmentId)
    .maybeSingle()

  if (enrollmentErr || !enrollment) {
    return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
  }

  // Ensure lecturer is assigned to that course in that session/semester
  const { data: assignment } = await supabase
    .from('course_assignments')
    .select('id')
    .eq('lecturer_id', profile.id)
    .eq('course_id', enrollment.course_id)
    .eq('session', enrollment.session)
    .eq('semester', enrollment.semester)
    .maybeSingle()

  if (!assignment) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  }

  const total = ca + exam
  const computed = computeGrade(total, remarkCode)

  const { data, error } = await supabase
    .from('results')
    .upsert(
      {
        enrollment_id: enrollmentId,
        ca_score: remarkCode ? 0 : ca,
        exam_score: remarkCode ? 0 : exam,
        score: computed.score,
        grade: computed.grade,
        points: computed.points,
        remark_code: remarkCode,
        status: 'DRAFT',
        entered_by: profile.id,
      },
      { onConflict: 'enrollment_id' }
    )
    .select('id, enrollment_id, ca_score, exam_score, score, grade, points, remark_code, status, updated_at')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true, result: data })
}