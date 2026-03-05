'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addCourseAction(formData: FormData) {
  const supabase = await createSupabaseServerClient()
  
  const courseData = {
    course_code: formData.get('course_code') as string,
    title: formData.get('title') as string,
    units: parseInt(formData.get('units') as string),
    level: formData.get('level') as string,
    department: formData.get('department') as string,
  }

  const { error } = await supabase.from('courses').insert(courseData)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/hod')
}