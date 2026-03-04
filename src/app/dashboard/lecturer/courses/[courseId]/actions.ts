'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'

function computeGrade(total: number) {
  if (total >= 70) return { grade: 'A', points: 5 }
  if (total >= 60) return { grade: 'B', points: 4 }
  if (total >= 50) return { grade: 'C', points: 3 }
  return { grade: 'F', points: 0 }
}

export async function upsertResult(payload: {
  enrollment_id: string
  ca_score: number
  exam_score: number
  remark_code?: string | null // e.g. ABS_APPROVED, ABS_UNAPPROVED, etc.
}) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const ca = Number(payload.ca_score ?? 0)
  const exam = Number(payload.exam_score ?? 0)

  if (ca < 0 || ca > 30) throw new Error('CA must be between 0 and 30')
  if (exam < 0 || exam > 70) throw new Error('Exam must be between 0 and 70')

  const total = ca + exam

  let grade = null as string | null
  let points = null as number | null
  let score = total

  if (payload.remark_code) {
    // Example: absence or special handling
    grade = 'ABS'
    points = 0
    score = 0
  } else {
    const g = computeGrade(total)
    grade = g.grade
    points = g.points
  }

  // Upsert by unique enrollment_id
  const { error } = await supabase
    .from('results')
    .upsert({
      enrollment_id: payload.enrollment_id,
      ca_score: ca,
      exam_score: exam,
      score,
      grade,
      points,
      remark_code: payload.remark_code ?? null,
      status: 'DRAFT',
      entered_by: user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'enrollment_id' })

  if (error) throw new Error(error.message)
}