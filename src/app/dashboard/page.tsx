// src/app/dashboard/page.tsx
import { redirect } from "next/navigation"
import { getAuthProfileOrRedirect } from "@/lib/auth/guards"

export default async function DashboardRouterPage() {
  const { profile } = await getAuthProfileOrRedirect()

  // profile.role is already normalized by your guards.ts:
  // lecturer | hod | dean | admin | SUPER_ADMIN | PENDING

  const role = profile.role

  if (role === "SUPER_ADMIN" || role === "admin") redirect("/dashboard/admin")
  if (role === "hod") redirect("/dashboard/hod")
  if (role === "dean") redirect("/dashboard/dean")
  if (role === "lecturer") redirect("/dashboard/lecturer")

  redirect("/auth/pending")
}