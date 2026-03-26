'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCourseAction(formData: FormData) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized: Please log in again.')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, department_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile) {
    throw new Error('Profile not found for authenticated user.')
  }

  if (!profile.department_id) {
    throw new Error('Your profile is not linked to any department.')
  }

  if (profile.role !== 'hod') {
    throw new Error('Only HOD users can create courses.')
  }

  const code = formData.get('course_code')?.toString().trim().toUpperCase()
  const title = formData.get('title')?.toString().trim()
  const unitValue = formData.get('units')?.toString().trim()
  const level = formData.get('level')?.toString().trim()
  const semester = formData.get('semester')?.toString().trim()
  const session = formData.get('session')?.toString().trim()

  if (!code || !title || !unitValue || !level || !semester || !session) {
    throw new Error('All course and offering fields are required.')
  }

  const unit = Number(unitValue)

  if (!Number.isInteger(unit) || unit <= 0) {
    throw new Error('Units must be a valid positive integer.')
  }

  const normalizedTitle = title.replace(/\s+/g, ' ')
  const normalizedSemester = semester.replace(/\s+/g, ' ')
  const normalizedSession = session.replace(/\s+/g, '')

  const { data: existingCourse, error: existingCourseError } = await supabase
    .from('courses')
    .select('id')
    .eq('code', code)
    .eq('department_id', profile.department_id)
    .maybeSingle()

  if (existingCourseError) {
    throw new Error(existingCourseError.message)
  }

  let courseId: string

  if (existingCourse) {
    courseId = existingCourse.id
  } else {
    const { data: insertedCourse, error: courseInsertError } = await supabase
      .from('courses')
      .insert([
        {
          code,
          title: normalizedTitle,
          unit,
          department_id: profile.department_id,
        },
      ])
      .select('id')
      .single()

    if (courseInsertError || !insertedCourse) {
      throw new Error(courseInsertError?.message || 'Failed to create course.')
    }

    courseId = insertedCourse.id
  }

  const { error: offeringInsertError } = await supabase
    .from('course_offerings')
    .insert([
      {
        course_id: courseId,
        department_id: profile.department_id,
        level,
        semester: normalizedSemester,
        session: normalizedSession,
        created_by: profile.id,
        status: 'draft',
      },
    ])

  if (offeringInsertError) {
    throw new Error(offeringInsertError.message)
  }

  revalidatePath('/dashboard/hod')
}