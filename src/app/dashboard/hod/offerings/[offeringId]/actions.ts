'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type ActionState = {
  ok: boolean
  message: string
}

type ApprovalRow = {
  registrationId: string
  resultId: string | null
  status: string | null
  caScore: number | null
  examScore: number | null
  totalScore: number | null
  grade: string | null
}

const FINALIZED_RESULT_STATUSES = new Set(['DEAN_APPROVED', 'LOCKED'])
const HOD_RETURNABLE_STATUSES = new Set(['SUBMITTED', 'HOD_APPROVED'])

function normalizeStatus(status: string | null | undefined) {
  return String(status ?? '').trim().toUpperCase()
}

function isFinalizedStatus(status: string | null | undefined) {
  return FINALIZED_RESULT_STATUSES.has(normalizeStatus(status))
}

function isReturnableByHod(status: string | null | undefined) {
  return HOD_RETURNABLE_STATUSES.has(normalizeStatus(status))
}

async function getAuthorizedContext(offeringId: string) {
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
    .select('id, role, department_id, full_name')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Profile not found')
  }

  const normalizedRole = String(profile.role || '').trim().toLowerCase()
  const isAdmin = normalizedRole === 'admin' || normalizedRole === 'super_admin'
  const isHOD = normalizedRole === 'hod'

  if (!isHOD && !isAdmin) {
    throw new Error('Forbidden')
  }

  let offeringQuery = supabase
    .from('course_offerings')
    .select(`
      id,
      department_id,
      lecturer_id,
      courses (
        id,
        code,
        title,
        department_id
      )
    `)
    .eq('id', offeringId)

  if (isHOD && profile.department_id) {
    offeringQuery = offeringQuery.eq('department_id', profile.department_id)
  }

  const { data: offering, error: offeringError } = await offeringQuery.maybeSingle()

  if (offeringError || !offering) {
    throw new Error('Offering not found')
  }

  return { supabase, user, profile, offering }
}

async function fetchOfferingResults(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  offeringId: string
): Promise<ApprovalRow[]> {
  const { data: offerings, error } = await supabase
    .from('course_offerings')
    .select(`
      id,
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
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  const registrations = offerings?.course_registrations ?? []

  return registrations.map((registration: any) => {
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

function validateRowsForApproval(rows: ApprovalRow[]) {
  const missingResults = rows.filter((row) => !row.resultId)
  if (missingResults.length > 0) {
    throw new Error(
      `Approval blocked: ${missingResults.length} registered student(s) have no saved result.`
    )
  }

  const finalizedRows = rows.filter((row) => isFinalizedStatus(row.status))
  if (finalizedRows.length > 0) {
    throw new Error(
      `Approval blocked: ${finalizedRows.length} row(s) have already been finalized by the Dean and can no longer be modified.`
    )
  }

  const nonSubmittedRows = rows.filter(
    (row) => normalizeStatus(row.status) !== 'SUBMITTED'
  )
  if (nonSubmittedRows.length > 0) {
    throw new Error(
      `Approval blocked: ${nonSubmittedRows.length} row(s) are not currently SUBMITTED. Only SUBMITTED rows can move to HOD approval.`
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
      `Approval blocked: ${invalidRows.length} row(s) still have incomplete, invalid, or inconsistent result data.`
    )
  }
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
    console.error('Audit log insert failed:', error.message)
  }
}

function revalidateHodWorkflowPaths(offeringId: string) {
  revalidatePath('/dashboard/hod')
  revalidatePath('/dashboard/hod/results')
  revalidatePath('/dashboard/hod/offerings')
  revalidatePath(`/dashboard/hod/offerings/${offeringId}`)
  revalidatePath('/dashboard/hod/reports')

  revalidatePath('/dashboard/lecturer')
  revalidatePath(`/dashboard/lecturer/courses/${offeringId}`)

  revalidatePath('/dashboard/dean')
  revalidatePath('/dashboard/dean/results')
  revalidatePath('/dashboard/dean/offerings')
  revalidatePath(`/dashboard/dean/offerings/${offeringId}`)
  revalidatePath('/dashboard/dean/reports')
}

export async function approveOfferingResultsAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const offeringId = String(formData.get('offeringId') || '').trim()

    if (!offeringId) {
      return { ok: false, message: 'Missing offering id.' }
    }

    const { supabase, profile } = await getAuthorizedContext(offeringId)
    const rows = await fetchOfferingResults(supabase, offeringId)

    if (rows.length === 0) {
      return {
        ok: false,
        message: 'This offering has no registered result rows to approve.',
      }
    }

    validateRowsForApproval(rows)

    const resultIds = rows
      .map((row) => row.resultId)
      .filter((id): id is string => Boolean(id))

    const { error: updateError } = await supabase
      .from('results')
      .update({
        status: 'HOD_APPROVED',
      })
      .in('id', resultIds)

    if (updateError) {
      throw new Error(updateError.message)
    }

    await insertAuditLogs(
      supabase,
      rows,
      profile.id,
      profile.role,
      'HOD_APPROVED_FOR_DEAN',
      'HOD approved all submitted and valid results for Dean review.'
    )

    revalidateHodWorkflowPaths(offeringId)

    return {
      ok: true,
      message: 'Results approved successfully and forwarded to Dean stage.',
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Failed to approve results.',
    }
  }
}

export async function returnOfferingResultsAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const offeringId = String(formData.get('offeringId') || '').trim()
    const note = String(formData.get('note') || '').trim()

    if (!offeringId) {
      return { ok: false, message: 'Missing offering id.' }
    }

    const { supabase, profile } = await getAuthorizedContext(offeringId)
    const rows = await fetchOfferingResults(supabase, offeringId)

    if (rows.length === 0) {
      return {
        ok: false,
        message: 'This offering has no registered result rows to return.',
      }
    }

    const finalizedRows = rows.filter((row) => isFinalizedStatus(row.status))
    if (finalizedRows.length > 0) {
      return {
        ok: false,
        message: `Return blocked: ${finalizedRows.length} row(s) have already been finalized by the Dean and can no longer be sent back to the lecturer.`,
      }
    }

    const returnableRows = rows.filter(
      (row) => row.resultId && isReturnableByHod(row.status)
    )

    if (returnableRows.length === 0) {
      return {
        ok: false,
        message: 'No returnable result rows were found for this offering.',
      }
    }

    const resultIds = returnableRows
      .map((row) => row.resultId)
      .filter((id): id is string => Boolean(id))

    const { error: updateError } = await supabase
      .from('results')
      .update({ status: 'DRAFT' })
      .in('id', resultIds)

    if (updateError) {
      throw new Error(updateError.message)
    }

    await insertAuditLogs(
      supabase,
      returnableRows,
      profile.id,
      profile.role,
      'HOD_RETURNED_TO_LECTURER',
      note || 'HOD returned this offering batch to lecturer for correction.'
    )

    revalidateHodWorkflowPaths(offeringId)

    return {
      ok: true,
      message: 'Results returned to lecturer.',
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Failed to return results.',
    }
  }
}

export async function rejectOfferingResultsAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const offeringId = String(formData.get('offeringId') || '').trim()
    const note = String(formData.get('note') || '').trim()

    if (!offeringId) {
      return { ok: false, message: 'Missing offering id.' }
    }

    const { supabase, profile } = await getAuthorizedContext(offeringId)
    const rows = await fetchOfferingResults(supabase, offeringId)

    if (rows.length === 0) {
      return {
        ok: false,
        message: 'This offering has no registered result rows to reject.',
      }
    }

    const finalizedRows = rows.filter((row) => isFinalizedStatus(row.status))
    if (finalizedRows.length > 0) {
      return {
        ok: false,
        message: `Rejection blocked: ${finalizedRows.length} row(s) have already been finalized by the Dean and can no longer be modified.`,
      }
    }

    const rejectableRows = rows.filter(
      (row) => row.resultId && isReturnableByHod(row.status)
    )

    if (rejectableRows.length === 0) {
      return {
        ok: false,
        message: 'No rejectable result rows were found for this offering.',
      }
    }

    const resultIds = rejectableRows
      .map((row) => row.resultId)
      .filter((id): id is string => Boolean(id))

    const { error: updateError } = await supabase
      .from('results')
      .update({ status: 'DRAFT' })
      .in('id', resultIds)

    if (updateError) {
      throw new Error(updateError.message)
    }

    await insertAuditLogs(
      supabase,
      rejectableRows,
      profile.id,
      profile.role,
      'HOD_REJECTED_TO_LECTURER',
      note || 'HOD rejected this offering batch and sent it back for rework.'
    )

    revalidateHodWorkflowPaths(offeringId)

    return {
      ok: true,
      message: 'Batch rejected and sent back as draft.',
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Failed to reject batch.',
    }
  }
}