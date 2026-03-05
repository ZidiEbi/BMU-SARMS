import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export type AppRole =
  | "lecturer"
  | "hod"
  | "dean"
  | "admin"
  | "SUPER_ADMIN"
  | "pending" // Changed to lowercase to match recovery rules

export type Profile = {
  id: string
  full_name: string | null
  role: AppRole
  is_verified: boolean | null
  is_active: boolean | null
  // ... other fields remain same
}

// UNIFIED NORMALIZATION: Matches proxy.ts exactly
export function normalizeRole(role: unknown): AppRole {
  if (!role) return "pending"
  const r = String(role).trim()
  return r === "SUPER_ADMIN" ? "SUPER_ADMIN" : r.toLowerCase() as AppRole
}

export async function getAuthProfileOrRedirect() {
  const supabase = await createSupabaseServerClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect("/auth/login")

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select('*')
    .eq("id", user.id)
    .maybeSingle()

  // Use /auth/pending to match the Middleware standard
  if (profileError || !profile) redirect("/auth/pending")

  const normalized: Profile = { ...profile, role: normalizeRole(profile.role) }
  return { supabase, user, profile: normalized }
}

/**
 * Institutional Gate: Handles Active Status and Lecturer Verification
 */
export function routeGate(profile: Profile, pathname = "") {
  const role = profile.role

  // 1) Disabled users
  if (profile.is_active === false) {
    if (pathname !== "/disabled") redirect("/disabled")
    return
  }

  // 2) Assignment Gate
  if (role === "pending") {
    if (pathname !== "/auth/pending") redirect("/auth/pending")
    return
  }

  // 3) Lecturer Verification - ONLY for lecturers!
  if (role === "lecturer") {
    if (!profile.is_verified) {
      if (pathname !== "/dashboard/lecturer/verification-pending") {
        redirect("/dashboard/lecturer/verification-pending")
      }
      return
    }
  }
  
  // 4) For all other roles (hod, admin, etc.), do nothing
  return
}

export function requireRole(profile: Profile, allowed: AppRole[]) {
  const role = profile.role
  
  // The Master Key: Admins and Super Admins can bypass specific role gates
  const hasMasterAccess = role === "SUPER_ADMIN" || role === "admin"
  const isExplicitlyAllowed = allowed.includes(role)

  if (!hasMasterAccess && !isExplicitlyAllowed) {
    console.log(`Access Denied: Role ${role} not in ${allowed}`)
    redirect("/dashboard")
  }
}