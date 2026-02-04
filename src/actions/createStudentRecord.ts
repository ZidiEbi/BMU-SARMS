'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function enrollStudent(data: any) {
  const supabase = createSupabaseServerClient()

  // 🔐 Ensure user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (!user || authError) {
    throw new Error('Not authenticated')
  }

  try {
    // 1️⃣ Insert / update student
    const { data: student, error: studentError } = await supabase
      .from('students')
      .upsert(
        {
          surname: data.surname,
          first_name: data.firstName,
          other_names: data.otherNames,
          matric_no: data.matricNo,
          faculty: data.faculty,
          department: data.department,
          status: 'pending_approval',
          created_by: user.id,
        },
        { onConflict: 'matric_no' }
      )
      .select()
      .single()

    if (studentError) {
      console.error('STUDENT ERROR:', studentError)
      throw studentError
    }

    // 2️⃣ Link courses
    if (Array.isArray(data.courses)) {
      for (const code of data.courses) {
        const { data: course, error: courseError } = await supabase
          .from('courses')
          .select('id')
          .eq('course_code', code.toUpperCase().trim())
          .single()

        if (courseError) {
          console.error('COURSE LOOKUP ERROR:', courseError)
          continue
        }

        const { error: linkError } = await supabase
          .from('student_courses')
          .upsert({
            student_id: student.id,
            course_id: course.id,
            created_by: user.id,
          })

        if (linkError) {
          console.error('COURSE LINK ERROR:', linkError)
          throw linkError
        }
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error('ENROLLMENT FAILED:', error)

    throw new Error(
      JSON.stringify(
        {
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
        },
        null,
        2
      )
    )
  }
}
