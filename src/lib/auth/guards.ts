import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export type AppRole =
  | "lecturer"
  | "hod"
  | "dean"
  | "admin"
  | "SUPER_ADMIN"
  | "pending"

export type Profile = {
  id: string
  full_name: string | null
  role: AppRole
  is_verified: boolean | null
  is_active: boolean | null
  profile_completed?: boolean | null
  faculty_id?: string | null
  department_id?: string | null
}

export function normalizeRole(role: unknown): AppRole {
  if (!role) return "pending"
  const r = String(role).trim()
  return r === "SUPER_ADMIN" ? "SUPER_ADMIN" : (r.toLowerCase() as AppRole)
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
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  if (profileError) throw profileError
if (!profile) redirect("/auth/pending")

  const normalized: Profile = {
    ...profile,
    role: normalizeRole(profile.role),
  }

  return { supabase, user, profile: normalized }
}

/**
 * Institutional Gate: Handles Active Status, Assignment, and Lecturer Verification
 */
export function routeGate(profile: Profile, pathname = "") {
  const role = profile.role

  // 1) Disabled users
  if (profile.is_active === false) {
    if (pathname !== "/disabled") redirect("/disabled")
    return
  }

  // 2) Assignment gate
  if (role === "pending") {
    if (pathname !== "/auth/pending") redirect("/auth/pending")
    return
  }

  // 3) Lecturer verification gate only
  if (role === "lecturer" && !profile.is_verified) {
    if (pathname !== "/dashboard/lecturer/verification-pending") {
      redirect("/dashboard/lecturer/verification-pending")
    }
    return
  }

  // 4) Non-pending users should not remain on pending page
  if (pathname === "/auth/pending") {
    redirect("/dashboard")
  }
}

export function requireRole(profile: Profile, allowed: AppRole[]) {
  const role = profile.role

  const hasMasterAccess = role === "SUPER_ADMIN" || role === "admin"
  const isExplicitlyAllowed = allowed.includes(role)

  if (!hasMasterAccess && !isExplicitlyAllowed) {
    console.log(`Access Denied: Role ${role} not in ${allowed.join(", ")}`)
    redirect("/dashboard")
  }
}