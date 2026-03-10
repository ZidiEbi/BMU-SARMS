import { getAuthProfileOrRedirect, routeGate } from "@/lib/auth/guards"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  console.log("🔥 ROOT DASHBOARD PAGE RENDERING")

  const { profile } = await getAuthProfileOrRedirect()
  routeGate(profile, "/dashboard")

  console.log("🔥 Root dashboard - profile role:", profile.role)

  const role = profile.role

  if (role === "hod") {
    console.log("🔥 Root dashboard - redirecting to /dashboard/hod")
    return redirect("/dashboard/hod")
  }

  if (role === "lecturer") {
    console.log("🔥 Root dashboard - redirecting to /dashboard/lecturer")
    return redirect("/dashboard/lecturer")
  }

  if (role === "admin" || role === "SUPER_ADMIN") {
    console.log("🔥 Root dashboard - redirecting to /dashboard/admin")
    return redirect("/dashboard/admin")
  }


  console.log("🔥 Root dashboard - no valid role, redirecting to /auth/pending")
  return redirect("/auth/pending")
}