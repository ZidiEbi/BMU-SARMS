'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type DeanActionState = {
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

async function getAuthorizedDeanContext(offeringId: string) {
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
    .select('id, role, faculty_id, full_name')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Profile not found')
  }

  const normalizedRole = String(profile.role || '').trim().toLowerCase()
  if (normalizedRole !== 'dean') {
    throw new Error('Forbidden')
  }

  if (!profile.faculty_id) {
    throw new Error('Dean faculty assignment is missing.')
  }

  const { data: departments, error: deptError } = await supabase
    .from('departments')
    .select('id')
    .eq('faculty_id', profile.faculty_id)

  if (deptError) {
    throw new Error(deptError.message)
  }

  const departmentIds = (departments ?? []).map((department) => department.id)

  if (departmentIds.length === 0) {
    throw new Error('No departments found under your faculty.')
  }

  const { data: offering, error: offeringError } = await supabase
    .from('course_offerings')
    .select(`
      id,
      department_id,
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
    .in('department_id', departmentIds)
    .maybeSingle()

  if (offeringError || !offering) {
    throw new Error('Offering not found for this dean scope.')
  }

  return { supabase, user, profile, offering }
}

function hasFinalizedRows(rows: ApprovalRow[]) {
  return rows.some((row) => FINALIZED_RESULT_STATUSES.has(String(row.status ?? '').trim()))
}

function countFinalizedRows(rows: ApprovalRow[]) {
  return rows.filter((row) =>
    FINALIZED_RESULT_STATUSES.has(String(row.status ?? '').trim())
  ).length
}

function validateRowsForDeanApproval(rows: ApprovalRow[]) {
  const finalizedRows = countFinalizedRows(rows)
  if (finalizedRows > 0) {
    throw new Error(
      `Dean approval blocked: ${finalizedRows} row(s) are already finalized and can no longer be modified.`
    )
  }

  const missingResults = rows.filter((row) => !row.resultId)
  if (missingResults.length > 0) {
    throw new Error(
      `Dean approval blocked: ${missingResults.length} registered student(s) have no saved result.`
    )
  }

  const nonHodApprovedRows = rows.filter((row) => row.status !== 'HOD_APPROVED')
  if (nonHodApprovedRows.length > 0) {
    throw new Error(
      `Dean approval blocked: ${nonHodApprovedRows.length} row(s) are not yet HOD_APPROVED.`
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
      `Dean approval blocked: ${invalidRows.length} row(s) still have invalid or inconsistent data.`
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
    console.error('Dean audit log insert failed:', error.message)
  }
}

function buildApprovalRows(offering: any): ApprovalRow[] {
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

function revalidateDeanWorkflowPaths(offeringId: string) {
  revalidatePath('/dashboard/dean')
  revalidatePath('/dashboard/dean/results')
  revalidatePath('/dashboard/dean/offerings')
  revalidatePath(`/dashboard/dean/offerings/${offeringId}`)
  revalidatePath('/dashboard/dean/reports')

  revalidatePath('/dashboard/hod')
  revalidatePath('/dashboard/hod/results')
  revalidatePath('/dashboard/hod/offerings')
  revalidatePath(`/dashboard/hod/offerings/${offeringId}`)

  revalidatePath('/dashboard/lecturer')
}

export async function approveDeanOfferingResultsAction(
  _prevState: DeanActionState,
  formData: FormData
): Promise<DeanActionState> {
  try {
    const offeringId = String(formData.get('offeringId') || '').trim()

    if (!offeringId) {
      return { ok: false, message: 'Missing offering id.' }
    }

    const { supabase, profile, offering } = await getAuthorizedDeanContext(offeringId)

    const rows = buildApprovalRows(offering)

    if (rows.length === 0) {
      return {
        ok: false,
        message: 'This offering has no registered result rows to finalize.',
      }
    }

    validateRowsForDeanApproval(rows)

    const resultIds = rows
      .map((row) => row.resultId)
      .filter((id): id is string => Boolean(id))

    const { error: updateError } = await supabase
      .from('results')
      .update({ status: 'DEAN_APPROVED' })
      .in('id', resultIds)

    if (updateError) {
      throw new Error(updateError.message)
    }

    await insertAuditLogs(
      supabase,
      rows,
      profile.id,
      profile.role,
      'DEAN_FINALIZED_BATCH',
      'Dean finalized this offering batch. Dean-stage edits are now locked.'
    )

    revalidateDeanWorkflowPaths(offeringId)

    return {
      ok: true,
      message: 'Dean approval completed. This batch is now finalized and locked at Dean stage.',
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Failed to approve at Dean stage.',
    }
  }
}

export async function returnDeanOfferingResultsAction(
  _prevState: DeanActionState,
  formData: FormData
): Promise<DeanActionState> {
  try {
    const offeringId = String(formData.get('offeringId') || '').trim()
    const note = String(formData.get('note') || '').trim()

    if (!offeringId) {
      return { ok: false, message: 'Missing offering id.' }
    }

    const { supabase, profile, offering } = await getAuthorizedDeanContext(offeringId)

    const rows = buildApprovalRows(offering)

    if (rows.length === 0) {
      return {
        ok: false,
        message: 'This offering has no registered result rows to return.',
      }
    }

    if (hasFinalizedRows(rows)) {
      const finalizedRows = countFinalizedRows(rows)
      return {
        ok: false,
        message: `Return blocked: ${finalizedRows} row(s) are already finalized at Dean stage and can no longer be sent back to HOD.`,
      }
    }

    const returnableRows = rows.filter(
      (row) => row.resultId && row.status === 'HOD_APPROVED'
    )

    if (returnableRows.length === 0) {
      return {
        ok: false,
        message: 'No HOD_APPROVED rows were found to return to HOD.',
      }
    }

    const resultIds = returnableRows
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
      returnableRows,
      profile.id,
      profile.role,
      'DEAN_RETURNED_TO_HOD',
      note || 'Dean returned this offering batch to HOD for amendment.'
    )

    revalidateDeanWorkflowPaths(offeringId)

    return {
      ok: true,
      message: 'Dean returned this batch to HOD.',
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Failed to return batch to HOD.',
    }
  }
}