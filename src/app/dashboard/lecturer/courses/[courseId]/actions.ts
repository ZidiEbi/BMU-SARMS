'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type LecturerActionState = {
  ok: boolean
  message: string
}

type SubmissionRow = {
  registrationId: string
  resultId: string | null
  status: string | null
  caScore: number | null
  examScore: number | null
  totalScore: number | null
  grade: string | null
}

const FINALIZED_RESULT_STATUSES = new Set(['DEAN_APPROVED', 'LOCKED'])
const HIGHER_REVIEW_CONTROL_STATUSES = new Set([
  'HOD_APPROVED',
  'DEAN_APPROVED',
  'LOCKED',
])

function normalizeStatus(status: string | null | undefined) {
  return String(status ?? '').trim().toUpperCase()
}

function isFinalizedStatus(status: string | null | undefined) {
  return FINALIZED_RESULT_STATUSES.has(normalizeStatus(status))
}

function isUnderHigherReviewControl(status: string | null | undefined) {
  return HIGHER_REVIEW_CONTROL_STATUSES.has(normalizeStatus(status))
}

function computeGrade(total: number) {
  if (total >= 70) return 'A'
  if (total >= 60) return 'B'
  if (total >= 50) return 'C'
  return 'F'
}

async function getAuthorizedLecturerContext(offeringId: string) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Profile not found')
  }

  const normalizedRole = String(profile.role || '').trim().toLowerCase()
  if (normalizedRole !== 'lecturer') {
    throw new Error('Forbidden')
  }

  const { data: offering, error: offeringError } = await supabase
    .from('course_offerings')
    .select(`
      id,
      status,
      lecturer_id,
      course_registrations (
        id,
        results (
          id,
          status,
          ca_score,
          exam_score,
          score,
          grade
        )
      )
    `)
    .eq('id', offeringId)
    .eq('lecturer_id', user.id)
    .eq('status', 'published')
    .maybeSingle()

  if (offeringError || !offering) {
    throw new Error('Offering not found or not assigned to you')
  }

  return { supabase, user, profile, offering }
}

async function insertAuditLogs(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  rows: Array<{ resultId: string | null; status: string | null }>,
  actorId: string,
  actorRole: string,
  action: string,
  note: string
) {
  const auditRows = rows
    .filter((row) => row.resultId)
    .map((row) => ({
      result_id: row.resultId,
      actor_id: actorId,
      actor_role: actorRole,
      action,
      previous_status: row.status,
      note,
    }))

  if (auditRows.length === 0) return

  const { error } = await supabase.from('result_audit_logs').insert(auditRows)

  if (error) {
    console.error('Lecturer audit log insert failed:', error.message)
  }
}

function buildSubmissionRows(offering: any): SubmissionRow[] {
  return (offering.course_registrations ?? []).map((registration: any) => {
    const result = Array.isArray(registration.results)
      ? registration.results[0]
      : registration.results

    return {
      registrationId: registration.id,
      resultId: result?.id ?? null,
      status: result?.status ?? null,
      caScore: result?.ca_score ?? null,
      examScore: result?.exam_score ?? null,
      totalScore: result?.score ?? null,
      grade: result?.grade ?? null,
    }
  })
}

function validateRowsForSubmission(rows: SubmissionRow[]) {
  const missingResults = rows.filter((row) => !row.resultId)
  if (missingResults.length > 0) {
    throw new Error(
      `Submission blocked: ${missingResults.length} registered student(s) have no saved result.`
    )
  }

  const finalizedRows = rows.filter((row) => isFinalizedStatus(row.status))
  if (finalizedRows.length > 0) {
    throw new Error(
      `Submission blocked: ${finalizedRows.length} row(s) are already finalized and can no longer be modified from the lecturer workspace.`
    )
  }

  const blockedRows = rows.filter((row) => isUnderHigherReviewControl(row.status))
  if (blockedRows.length > 0) {
    throw new Error(
      `Submission blocked: ${blockedRows.length} row(s) are already under higher review control.`
    )
  }

  const invalidRows = rows.filter((row) => {
    const ca = row.caScore
    const exam = row.examScore
    const total = row.totalScore
    const grade = row.grade?.trim() ?? ''

    const missingField = ca === null || exam === null || total === null || !grade
    const invalidCA = ca !== null && (ca < 0 || ca > 40)
    const invalidExam = exam !== null && (exam < 0 || exam > 60)
    const invalidTotal = total !== null && (total < 0 || total > 100)
    const totalMismatch =
      ca !== null && exam !== null && total !== null && ca + exam !== total

    return missingField || invalidCA || invalidExam || invalidTotal || totalMismatch
  })

  if (invalidRows.length > 0) {
    throw new Error(
      `Submission blocked: ${invalidRows.length} row(s) still have incomplete or invalid scores.`
    )
  }
}

function revalidateLecturerWorkflowPaths(offeringId: string) {
  revalidatePath('/dashboard/lecturer')
  revalidatePath(`/dashboard/lecturer/courses/${offeringId}`)

  revalidatePath('/dashboard/hod')
  revalidatePath('/dashboard/hod/results')
  revalidatePath('/dashboard/hod/offerings')
  revalidatePath('/dashboard/hod/reports')
  revalidatePath(`/dashboard/hod/offerings/${offeringId}`)

  revalidatePath('/dashboard/dean')
  revalidatePath('/dashboard/dean/results')
  revalidatePath('/dashboard/dean/offerings')
  revalidatePath('/dashboard/dean/reports')
  revalidatePath(`/dashboard/dean/offerings/${offeringId}`)
}

export async function upsertResult(input: {
  offeringId: string
  courseRegistrationId: string
  caScore: number
  examScore: number
}): Promise<{ ok: boolean; message: string }> {
  try {
    const { offeringId, courseRegistrationId } = input
    const caScore = Number(input.caScore)
    const examScore = Number(input.examScore)

    if (!offeringId || !courseRegistrationId) {
      return { ok: false, message: 'Missing offering or registration id.' }
    }

    if (
      Number.isNaN(caScore) ||
      Number.isNaN(examScore) ||
      caScore < 0 ||
      caScore > 40 ||
      examScore < 0 ||
      examScore > 60
    ) {
      return { ok: false, message: 'Scores must be within CA 0–40 and Exam 0–60.' }
    }

    const total = caScore + examScore
    const grade = computeGrade(total)

    const { supabase, profile, offering } = await getAuthorizedLecturerContext(offeringId)

    const registrationIds = new Set(
      (offering.course_registrations ?? []).map((registration: any) => registration.id)
    )

    if (!registrationIds.has(courseRegistrationId)) {
      return {
        ok: false,
        message: 'This registration does not belong to the selected offering.',
      }
    }

    const { data: existingResult, error: existingError } = await supabase
      .from('results')
      .select('id, status')
      .eq('course_registration_id', courseRegistrationId)
      .maybeSingle()

    if (existingError) {
      throw new Error(existingError.message)
    }

    if (isUnderHigherReviewControl(existingResult?.status)) {
      return {
        ok: false,
        message: 'This result is no longer editable from the lecturer workspace.',
      }
    }

    const payload = {
      course_registration_id: courseRegistrationId,
      ca_score: caScore,
      exam_score: examScore,
      score: total,
      grade,
      status: 'DRAFT',
    }

    const { error: upsertError } = await supabase
      .from('results')
      .upsert(payload, { onConflict: 'course_registration_id' })

    if (upsertError) {
      throw new Error(upsertError.message)
    }

    const { data: savedResult, error: savedResultError } = await supabase
      .from('results')
      .select('id, status')
      .eq('course_registration_id', courseRegistrationId)
      .maybeSingle()

    if (savedResultError) {
      throw new Error(savedResultError.message)
    }

    await insertAuditLogs(
      supabase,
      [
        {
          resultId: savedResult?.id ?? existingResult?.id ?? null,
          status: existingResult?.status ?? null,
        },
      ],
      profile.id,
      profile.role,
      'LECTURER_SAVED_ROW',
      'Lecturer saved or updated a result row.'
    )

    revalidateLecturerWorkflowPaths(offeringId)

    return {
      ok: true,
      message: 'Result saved as draft.',
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Failed to save result.',
    }
  }
}

export async function submitOfferingResultsAction(
  _prevState: LecturerActionState,
  formData: FormData
): Promise<LecturerActionState> {
  try {
    const offeringId = String(formData.get('offeringId') || '').trim()

    if (!offeringId) {
      return { ok: false, message: 'Missing offering id.' }
    }

    const { supabase, profile, offering } = await getAuthorizedLecturerContext(offeringId)

    const rows = buildSubmissionRows(offering)

    if (rows.length === 0) {
      return {
        ok: false,
        message: 'This offering has no registered result rows to submit.',
      }
    }

    validateRowsForSubmission(rows)

    const resultIds = rows
      .map((row) => row.resultId)
      .filter((id): id is string => Boolean(id))

    const { error: updateError } = await supabase
      .from('results')
      .update({ status: 'SUBMITTED' })
      .in('id', resultIds)

    if (updateError) {
      throw new Error(updateError.message)
    }

    await insertAuditLogs(
      supabase,
      rows,
      profile.id,
      profile.role,
      'LECTURER_SUBMITTED_BATCH',
      'Lecturer submitted this offering batch for HOD review.'
    )

    revalidateLecturerWorkflowPaths(offeringId)

    return {
      ok: true,
      message: 'Results submitted to HOD successfully.',
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Failed to submit results.',
    }
  }
}