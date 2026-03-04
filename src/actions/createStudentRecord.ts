'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'

type EnrollStudentInput = {
  matricNumber: string
  fullName: string
  departmentId: string
  admissionYear: number
  session: string
  semester: string
  courses: string[] // course codes, e.g. ["ANA101", "BCH203"]
}

export async function enrollStudent(input: EnrollStudentInput) {
  const supabase = await createSupabaseServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) throw new Error('Not authenticated')

  const matric = input.matricNumber.trim().toUpperCase()
  const fullName = input.fullName.trim()
  const session = input.session.trim()
  const semester = input.semester.trim()

  if (!matric) throw new Error('matricNumber is required')
  if (!fullName) throw new Error('fullName is required')
  if (!input.departmentId) throw new Error('departmentId is required')
  if (!session) throw new Error('session is required')
  if (!semester) throw new Error('semester is required')

  // 1) Upsert student by matric_number (your UNIQUE constraint)
  const { data: student, error: studentError } = await supabase
    .from('students')
    .upsert(
      {
        matric_number: matric,
        full_name: fullName,
        department_id: input.departmentId,
        admission_year: input.admissionYear,
        created_by: user.id,
      },
      { onConflict: 'matric_number' }
    )
    .select('id, matric_number, full_name, department_id')
    .single()

  if (studentError) {
    throw new Error(
      JSON.stringify(
        { message: studentError.message, code: studentError.code, details: studentError.details, hint: studentError.hint },
        null,
        2
      )
    )
  }

  // 2) Enroll courses (enrollments table)
  if (Array.isArray(input.courses) && input.courses.length > 0) {
    for (const rawCode of input.courses) {
      const code = String(rawCode || '').trim().toUpperCase()
      if (!code) continue

      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('id, code')
        .eq('code', code)
        .single()

      if (courseError || !course) {
        // don't crash the whole enrollment if one code is wrong
        console.error('COURSE LOOKUP ERROR:', courseError?.message, { code })
        continue
      }

      const { error: enrollErr } = await supabase
        .from('enrollments')
        .upsert(
          {
            student_id: student.id,
            course_id: course.id,
            session,
            semester,
          },
          { onConflict: 'student_id,course_id,session,semester' }
        )

      if (enrollErr) {
        throw new Error(
          JSON.stringify(
            { message: enrollErr.message, code: enrollErr.code, details: enrollErr.details, hint: enrollErr.hint },
            null,
            2
          )
        )
      }
    }
  }

  return { success: true, studentId: student.id }
}