import { getAuthProfileOrRedirect, requireRole } from '@/lib/auth/guards'
import LecturerOnboarding from '@/components/dashboard/lecturer/LecturerOnboarding'

export default async function LecturerOnboardingPage() {
  const { supabase, user, profile } = await getAuthProfileOrRedirect()
  requireRole(profile, ['lecturer'])

  // If already completed, don’t show onboarding again
  if (profile.profile_completed) {
    // still might be unverified → handled by verification page
    // but let main lecturer page routeGate handle that
  }

  const { data: faculties } = await supabase
    .from('faculties')
    .select('id, name')
    .order('name', { ascending: true })

  const { data: departments } = await supabase
    .from('departments')
    .select('id, name, faculty_id')
    .order('name', { ascending: true })

  return (
    <LecturerOnboarding
      userId={user.id}
      initialProfile={{
        full_name: profile.full_name,
        phone_number: profile.phone_number,
        title: profile.title,
        staff_id: profile.staff_id,
        faculty_id: profile.faculty_id,
        department_id: profile.department_id,
        avatar_url: profile.avatar_url,
      }}
      faculties={faculties ?? []}
      departments={departments ?? []}
    />
  )
}