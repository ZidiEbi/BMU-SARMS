'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function verifyLecturerAction(lecturerId: string) {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from('profiles')
    .update({ is_verified: true, updated_at: new Date().toISOString() })
    .eq('id', lecturerId)

  if (error) throw new Error(error.message)

  // Clear the cache so the HOD sees the updated list immediately
  revalidatePath('/dashboard/hod/verifications')
}