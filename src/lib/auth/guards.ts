import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export type AppRole =
  | "lecturer"
  | "hod"
  | "dean"
  | "admin"
  | "SUPER_ADMIN"
  | "PENDING"
  | string

export type Profile = {
  id: string
  full_name: string | null
  phone_number: string | null
  title: string | null
  avatar_url: string | null
  staff_id: string | null
  role: AppRole
  department_id: string | null
  faculty_id: string | null
  profile_completed: boolean | null
  is_verified: boolean | null
  is_active: boolean | null
  updated_at: string | null
  created_at: string | null
}

function normalizeRole(role: unknown): AppRole {
  if (!role) return "PENDING"
  const r = String(role).trim()
  if (r === "SUPER_ADMIN") return "SUPER_ADMIN"
  return r.toLowerCase()
}

export async function getAuthProfileOrRedirect() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) redirect("/auth/login")

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      `
      id,
      full_name,
      phone_number,
      title,
      avatar_url,
      staff_id,
      role,
      department_id,
      faculty_id,
      profile_completed,
      is_verified,
      is_active,
      updated_at,
      created_at
    `
    )
    .eq("id", user.id)
    .maybeSingle()

  if (profileError) {
    console.error("Profile fetch error:", profileError.message)
    redirect("/pending")
  }

  if (!profile) redirect("/pending")

  const normalized: Profile = { ...profile, role: normalizeRole(profile.role) }
  return { supabase, user, profile: normalized }
}

/**
 * Gate access based on role + status.
 * Pass pathname to prevent redirect-to-self loops.
 */
export function routeGate(profile: Profile, pathname = "") {
  const role = normalizeRole(profile.role)

  // 1) Disabled users
  if (profile.is_active === false) {
    if (pathname !== "/disabled") redirect("/disabled")
    return
  }

  // 2) Pending / unassigned users
  if (!role || role === "PENDING") {
    if (pathname !== "/pending") redirect("/pending")
    return
  }

  // 3) Lecturer-only onboarding + verification flow
  if (role === "lecturer") {
    if (!profile.profile_completed) {
      if (pathname !== "/dashboard/lecturer/onboarding") {
        redirect("/dashboard/lecturer/onboarding")
      }
      return
    }

    // Treat null as not verified
    const verified = profile.is_verified === true
    if (!verified) {
      if (pathname !== "/dashboard/lecturer/verification-pending") {
        redirect("/dashboard/lecturer/verification-pending")
      }
      return
    }
  }

  // 4) Everyone else (hod/dean/admin/SUPER_ADMIN) passes without lecturer gating
}

export function requireRole(profile: Profile, allowed: AppRole[]) {
  const role = normalizeRole(profile.role)
  const allowedNorm = allowed.map(normalizeRole)

  if (!allowedNorm.includes(role)) {
    redirect("/pending")
  }
}