'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteAssignment(id: string) {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from('course_assignments')
    .delete()
    .eq('id', id)

  if (!error) {
    // This tells Next.js to refresh the HOD dashboard data immediately
    revalidatePath('/dashboard/hod')
  }
  
  return { error }
}