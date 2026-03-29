'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type AllocationActionState = {
  ok: boolean
  message: string
  affectedCount?: number
}

type AllocationOffering = {
  id: string
  department_id: string | null
  lecturer_id: string | null
  level: string | null
  semester: string | null
  session: string | null
  course_id: string | null
  courses:
    | {
        id: string
        code: string | null
        title: string | null
      }
    | {
        id: string
        code: string | null
        title: string | null
      }[]
    | null
  course_registrations:
    | {
        id: string
        results:
          | {
              id: string | null
              status: string | null
              ca_score: number | null
              exam_score: number | null
              score: number | null
            }[]
          | {
              id: string | null
              status: string | null
              ca_score: number | null
              exam_score: number | null
              score: number | null
            }
          | null
      }[]
    | null
}

type AllocationLecturer = {
  id: string
  role: string | null
  is_verified: boolean | null
  full_name: string | null
}

function normalizeRole(role: string | null | undefined) {
  return String(role ?? '').trim().toLowerCase()
}

function toSingle<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function hasWorkflowStarted(offering: AllocationOffering) {
  return (offering.course_registrations ?? []).some((registration) => {
    const result = toSingle(registration.results)

    return Boolean(
      result?.id ||
        result?.status ||
        result?.ca_score !== null ||
        result?.exam_score !== null ||
        result?.score !== null
    )
  })
}

async function getAuthorizedActor() {
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
    .select('id, role, department_id, faculty_id, full_name')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Profile not found')
  }

  const role = normalizeRole(profile.role)
  const isAdmin = role === 'admin' || role === 'super_admin'
  const isHod = role === 'hod'

  if (!isAdmin && !isHod) {
    throw new Error('Forbidden')
  }

  return { supabase, user, profile, isAdmin, isHod }
}

async function getLecturerOrThrow(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  lecturerId: string
) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, is_verified, full_name')
    .eq('id', lecturerId)
    .maybeSingle()

  if (error || !data) {
    throw new Error('Selected lecturer was not found.')
  }

  const lecturer = data as AllocationLecturer

  if (normalizeRole(lecturer.role) !== 'lecturer') {
    throw new Error('Selected staff is not a lecturer.')
  }

  if (!lecturer.is_verified) {
    throw new Error('Only verified lecturers can be allocated through this workspace.')
  }

  return lecturer
}

async function getOfferingsInScope(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  offeringIds: string[],
  actor: { isAdmin: boolean; profile: { department_id: string | null } }
) {
  let query = supabase
    .from('course_offerings')
    .select(`
      id,
      department_id,
      lecturer_id,
      level,
      semester,
      session,
      course_id,
      courses!course_offerings_course_id_fkey (
        id,
        code,
        title
      ),
      course_registrations (
        id,
        results (
          id,
          status,
          ca_score,
          exam_score,
          score
        )
      )
    `)
    .in('id', offeringIds)

  if (!actor.isAdmin && actor.profile.department_id) {
    query = query.eq('department_id', actor.profile.department_id)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as AllocationOffering[]
}

async function insertAllocationAuditLogs(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  params: {
    actorId: string
    actorRole: string
    action: string
    note: string
    rows: Array<{
      offeringId: string
      previousLecturerId: string | null
      newLecturerId: string | null
    }>
  }
) {
  if (params.rows.length === 0) return

  const payload = params.rows.map((row) => ({
    offering_id: row.offeringId,
    previous_lecturer_id: row.previousLecturerId,
    new_lecturer_id: row.newLecturerId,
    actor_id: params.actorId,
    actor_role: params.actorRole,
    action: params.action,
    note: params.note,
  }))

  const { error } = await supabase.from('allocation_audit_logs').insert(payload)

  if (error) {
    console.error('Allocation audit log insert failed:', error.message)
  }
}

function revalidateAllocationPaths() {
  revalidatePath('/dashboard/hod')
  revalidatePath('/dashboard/hod/allocations')
  revalidatePath('/dashboard/hod/offerings')
  revalidatePath('/dashboard/hod/reports')
}

export async function assignLecturerToOfferingAction(input: {
  offeringId: string
  lecturerId: string
  note?: string
}): Promise<AllocationActionState> {
  try {
    const offeringId = String(input.offeringId || '').trim()
    const lecturerId = String(input.lecturerId || '').trim()
    const note = String(input.note || '').trim()

    if (!offeringId || !lecturerId) {
      return { ok: false, message: 'Missing offering or lecturer id.' }
    }

    const actor = await getAuthorizedActor()
    await getLecturerOrThrow(actor.supabase, lecturerId)

    const offerings = await getOfferingsInScope(actor.supabase, [offeringId], actor)
    const offering = offerings[0]

    if (!offering) {
      return { ok: false, message: 'Offering not found in your allocation scope.' }
    }

    if (hasWorkflowStarted(offering)) {
      return {
        ok: false,
        message:
          'This offering already has result workflow activity. Reassignment is blocked to protect academic workflow integrity.',
      }
    }

    const previousLecturerId = offering.lecturer_id ?? null

    const { error } = await actor.supabase
      .from('course_offerings')
      .update({ lecturer_id: lecturerId })
      .eq('id', offeringId)

    if (error) {
      throw new Error(error.message)
    }

    await insertAllocationAuditLogs(actor.supabase, {
      actorId: actor.profile.id,
      actorRole: actor.profile.role,
      action: previousLecturerId ? 'OFFERING_REASSIGNED' : 'OFFERING_ASSIGNED',
      note:
        note ||
        (previousLecturerId
          ? 'HOD reassigned this offering to a different lecturer.'
          : 'HOD assigned this offering to a lecturer.'),
      rows: [
        {
          offeringId,
          previousLecturerId,
          newLecturerId: lecturerId,
        },
      ],
    })

    revalidateAllocationPaths()

    return {
      ok: true,
      message: previousLecturerId
        ? 'Offering reassigned successfully.'
        : 'Offering assigned successfully.',
      affectedCount: 1,
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Failed to assign lecturer.',
    }
  }
}

export async function unassignLecturerFromOfferingAction(input: {
  offeringId: string
  note?: string
}): Promise<AllocationActionState> {
  try {
    const offeringId = String(input.offeringId || '').trim()
    const note = String(input.note || '').trim()

    if (!offeringId) {
      return { ok: false, message: 'Missing offering id.' }
    }

    const actor = await getAuthorizedActor()
    const offerings = await getOfferingsInScope(actor.supabase, [offeringId], actor)
    const offering = offerings[0]

    if (!offering) {
      return { ok: false, message: 'Offering not found in your allocation scope.' }
    }

    if (!offering.lecturer_id) {
      return { ok: false, message: 'This offering is already unassigned.' }
    }

    if (hasWorkflowStarted(offering)) {
      return {
        ok: false,
        message:
          'This offering already has result workflow activity. Unassignment is blocked to prevent disrupting active academic work.',
      }
    }

    const previousLecturerId = offering.lecturer_id

    const { error } = await actor.supabase
      .from('course_offerings')
      .update({ lecturer_id: null })
      .eq('id', offeringId)

    if (error) {
      throw new Error(error.message)
    }

    await insertAllocationAuditLogs(actor.supabase, {
      actorId: actor.profile.id,
      actorRole: actor.profile.role,
      action: 'OFFERING_UNASSIGNED',
      note: note || 'HOD removed lecturer allocation from this offering.',
      rows: [
        {
          offeringId,
          previousLecturerId,
          newLecturerId: null,
        },
      ],
    })

    revalidateAllocationPaths()

    return {
      ok: true,
      message: 'Offering unassigned successfully.',
      affectedCount: 1,
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Failed to unassign lecturer.',
    }
  }
}

export async function bulkAssignLecturerToOfferingsAction(input: {
  offeringIds: string[]
  lecturerId: string
  note?: string
}): Promise<AllocationActionState> {
  try {
    const offeringIds = Array.from(
      new Set((input.offeringIds ?? []).map((id) => String(id).trim()).filter(Boolean))
    )
    const lecturerId = String(input.lecturerId || '').trim()
    const note = String(input.note || '').trim()

    if (offeringIds.length === 0) {
      return { ok: false, message: 'Select at least one offering for bulk allocation.' }
    }

    if (!lecturerId) {
      return { ok: false, message: 'Select a lecturer for bulk allocation.' }
    }

    const actor = await getAuthorizedActor()
    await getLecturerOrThrow(actor.supabase, lecturerId)

    const offerings = await getOfferingsInScope(actor.supabase, offeringIds, actor)

    if (offerings.length !== offeringIds.length) {
      return {
        ok: false,
        message:
          'Some selected offerings are outside your scope or no longer exist. Refresh and try again.',
      }
    }

    const blocked = offerings.filter((offering) => hasWorkflowStarted(offering))
    if (blocked.length > 0) {
      const labels = blocked
        .slice(0, 3)
        .map((offering) => {
          const course = toSingle(offering.courses)
          return course?.code ?? 'COURSE'
        })
        .join(', ')

      return {
        ok: false,
        message: `Bulk allocation blocked. ${blocked.length} selected offering(s) already have result workflow activity${labels ? ` (${labels})` : ''}.`,
      }
    }

    const { error } = await actor.supabase
      .from('course_offerings')
      .update({ lecturer_id: lecturerId })
      .in('id', offeringIds)

    if (error) {
      throw new Error(error.message)
    }

    await insertAllocationAuditLogs(actor.supabase, {
      actorId: actor.profile.id,
      actorRole: actor.profile.role,
      action: 'OFFERING_BULK_ASSIGNED',
      note:
        note ||
        `HOD performed bulk lecturer allocation across ${offeringIds.length} offering(s).`,
      rows: offerings.map((offering) => ({
        offeringId: offering.id,
        previousLecturerId: offering.lecturer_id ?? null,
        newLecturerId: lecturerId,
      })),
    })

    revalidateAllocationPaths()

    return {
      ok: true,
      message: `Bulk allocation completed for ${offeringIds.length} offering(s).`,
      affectedCount: offeringIds.length,
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Bulk allocation failed.',
    }
  }
}