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
  const isAdmin =
    normalizedRole === 'admin' || normalizedRole === 'super_admin'
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

  const lockedOrDeanRows = rows.filter(
    (row) => row.status === 'DEAN_APPROVED' || row.status === 'LOCKED'
  )
  if (lockedOrDeanRows.length > 0) {
    throw new Error(
      `Approval blocked: ${lockedOrDeanRows.length} row(s) are already dean-controlled or locked.`
    )
  }

  const nonSubmittedRows = rows.filter((row) => row.status !== 'SUBMITTED')
  if (nonSubmittedRows.length > 0) {
    throw new Error(
      `Approval blocked: ${nonSubmittedRows.length} row(s) are not yet submitted by the lecturer. Only SUBMITTED rows can be approved.`
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
      'HOD_APPROVED_BATCH',
      'HOD approved all submitted and valid results for this offering.'
    )

    revalidatePath('/dashboard/hod')
    revalidatePath('/dashboard/hod/results')
    revalidatePath('/dashboard/hod/offerings')
    revalidatePath(`/dashboard/hod/offerings/${offeringId}`)
    revalidatePath('/dashboard/hod/reports')
    revalidatePath('/dashboard/lecturer')

    return {
      ok: true,
      message: 'Results approved successfully.',
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

    const returnableRows = rows.filter(
      (row) =>
        row.resultId &&
        row.status !== 'DEAN_APPROVED' &&
        row.status !== 'LOCKED'
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
      'HOD_RETURNED_BATCH',
      note || 'HOD returned this offering batch to lecturer for correction.'
    )

    revalidatePath('/dashboard/hod')
    revalidatePath('/dashboard/hod/results')
    revalidatePath('/dashboard/hod/offerings')
    revalidatePath(`/dashboard/hod/offerings/${offeringId}`)
    revalidatePath('/dashboard/hod/reports')
    revalidatePath('/dashboard/lecturer')

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

    const rejectableRows = rows.filter(
      (row) =>
        row.resultId &&
        row.status !== 'DEAN_APPROVED' &&
        row.status !== 'LOCKED'
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
      'HOD_REJECTED_BATCH',
      note || 'HOD rejected this offering batch and sent it back for rework.'
    )

    revalidatePath('/dashboard/hod')
    revalidatePath('/dashboard/hod/results')
    revalidatePath('/dashboard/hod/offerings')
    revalidatePath(`/dashboard/hod/offerings/${offeringId}`)
    revalidatePath('/dashboard/hod/reports')
    revalidatePath('/dashboard/lecturer')

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