'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'

function normalizeRole(role: string | null | undefined) {
  const value = String(role || '').trim()
  if (!value) return ''
  if (value === 'SUPER_ADMIN') return 'super_admin'
  return value.toLowerCase().replace(/\s+/g, '_')
}

export async function verifyLecturerForDepartmentAction(lecturerId: string) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized. Please log in again.')
  }

  const { data: actorProfile, error: actorError } = await supabase
    .from('profiles')
    .select('id, role, department_id')
    .eq('id', user.id)
    .maybeSingle()

  if (actorError || !actorProfile) {
    throw new Error('Unable to verify your profile.')
  }

  const actorRole = normalizeRole(actorProfile.role)
  const isSuperAdmin = actorRole === 'super_admin'
  const isHod = actorRole === 'hod'

  if (!isSuperAdmin && !isHod) {
    throw new Error('Only a HOD or SUPER_ADMIN can verify lecturers.')
  }

  const { data: targetProfile, error: targetError } = await supabase
    .from('profiles')
    .select('id, role, department_id, requested_department_id, is_verified')
    .eq('id', lecturerId)
    .maybeSingle()

  if (targetError || !targetProfile) {
    throw new Error('Target lecturer profile not found.')
  }

  const targetRole = normalizeRole(targetProfile.role)

  if (targetRole !== 'lecturer') {
    throw new Error('Only lecturer accounts can be verified here.')
  }

  if (targetProfile.is_verified) {
    throw new Error('This lecturer has already been verified.')
  }

  if (!targetProfile.requested_department_id) {
    throw new Error('This lecturer does not have a pending department request.')
  }

  if (isHod) {
    if (!actorProfile.department_id) {
      throw new Error('Your HOD profile is not linked to a department.')
    }

    if (actorProfile.department_id !== targetProfile.requested_department_id) {
      throw new Error('You can only verify lecturers requesting your own department.')
    }
  }

  const updates = {
    department_id: targetProfile.requested_department_id,
    requested_department_id: null,
    is_verified: true,
    profile_completed: true,
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', lecturerId)

  if (updateError) {
    throw new Error(updateError.message)
  }

  revalidatePath('/dashboard/hod')
  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/lecturer')
}

export async function removeLecturerFromDepartmentAction(
  lecturerId: string,
  mode: 'pending' | 'confirmed'
) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized. Please log in again.')
  }

  const { data: actorProfile, error: actorError } = await supabase
    .from('profiles')
    .select('id, role, department_id')
    .eq('id', user.id)
    .maybeSingle()

  if (actorError || !actorProfile) {
    throw new Error('Unable to verify your profile.')
  }

  const actorRole = normalizeRole(actorProfile.role)
  const isSuperAdmin = actorRole === 'super_admin'
  const isHod = actorRole === 'hod'

  if (!isSuperAdmin && !isHod) {
    throw new Error('Only a HOD or SUPER_ADMIN can remove lecturers from this workflow.')
  }

  const { data: targetProfile, error: targetError } = await supabase
    .from('profiles')
    .select('id, role, department_id, requested_department_id, is_verified')
    .eq('id', lecturerId)
    .maybeSingle()

  if (targetError || !targetProfile) {
    throw new Error('Target lecturer profile not found.')
  }

  const targetRole = normalizeRole(targetProfile.role)

  if (targetRole !== 'lecturer') {
    throw new Error('Only lecturer accounts can be managed here.')
  }

  if (mode === 'pending') {
    if (!targetProfile.requested_department_id) {
      throw new Error('This lecturer does not have a pending department request.')
    }

    if (isHod) {
      if (!actorProfile.department_id) {
        throw new Error('Your HOD profile is not linked to a department.')
      }

      if (actorProfile.department_id !== targetProfile.requested_department_id) {
        throw new Error('You can only manage pending lecturers requesting your own department.')
      }
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        requested_department_id: null,
        department_id: null,
        faculty_id: null,
        is_verified: false,
        profile_completed: false,
      })
      .eq('id', lecturerId)

    if (updateError) {
      throw new Error(updateError.message)
    }
  } else {
    if (!targetProfile.department_id) {
      throw new Error('This lecturer is not assigned to any confirmed department.')
    }

    if (isHod) {
      if (!actorProfile.department_id) {
        throw new Error('Your HOD profile is not linked to a department.')
      }

      if (actorProfile.department_id !== targetProfile.department_id) {
        throw new Error('You can only remove confirmed lecturers from your own department.')
      }
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        is_verified: false,
        requested_department_id: targetProfile.department_id,
        department_id: null,
      })
      .eq('id', lecturerId)

    if (updateError) {
      throw new Error(updateError.message)
    }
  }

  revalidatePath('/dashboard/hod')
  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/lecturer')
}