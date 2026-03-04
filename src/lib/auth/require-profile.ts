import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export type NormalizedRole = "SUPER_ADMIN" | "admin" | "dean" | "hod" | "lecturer" | "pending"

function normalizeRole(role: unknown): NormalizedRole {
  if (!role) return "pending"
  if (role === "SUPER_ADMIN") return "SUPER_ADMIN"
  const r = String(role).trim()
  if (r === "PENDING") return "pending" // legacy
  // enforce your current standard
  if (r === "admin" || r === "dean" || r === "hod" || r === "lecturer") return r
  return "pending"
}

/**
 * Central gatekeeper for dashboard routing.
 * - If profile missing -> /pending
 * - If disabled -> /disabled
 * - If pending role -> /pending
 * - If profile not completed -> /dashboard/lecturer/onboarding (for lecturers)
 * - If not verified -> /dashboard/lecturer/verification-pending (for lecturers)
 */
export async function requireProfile() {
  const supabase = await createSupabaseServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect("/auth/login")

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      phone_number,
      title,
      avatar_url,
      role,
      faculty_id,
      department_id,
      staff_id,
      profile_completed,
      is_verified,
      is_active
    `)
    .eq("id", user.id)
    .maybeSingle()

  if (profileError) {
    // If you ever see recursion again, it will surface here — not scattered everywhere.
    console.error("Profile fetch error:", profileError.message)
    redirect("/pending")
  }

  if (!profile) redirect("/pending")

  const role = normalizeRole(profile.role)

  return { supabase, user, profile, role }
}

export function routeByRole(role: NormalizedRole) {
  if (role === "SUPER_ADMIN" || role === "admin") return "/dashboard/admin"
  if (role === "dean") return "/dashboard/dean"
  if (role === "hod") return "/dashboard/hod"
  if (role === "lecturer") return "/dashboard/lecturer"
  return "/pending"
}