import { getAuthProfileOrRedirect } from "@/lib/auth/guards"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  console.log("🔥 ROOT DASHBOARD PAGE RENDERING")
  const { profile } = await getAuthProfileOrRedirect()
  console.log("🔥 Root dashboard - profile role:", profile.role)

  const role = profile.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : profile.role?.toLowerCase()
  console.log("🔥 Root dashboard - normalized role:", role)

  if (role === 'SUPER_ADMIN' || role === 'admin') {
    console.log("🔥 Root dashboard - redirecting to /dashboard/admin")
    return redirect('/dashboard/admin')
  }

  if (role === 'hod') {
    console.log("🔥 Root dashboard - redirecting to /dashboard/hod")
    return redirect('/dashboard/hod')
  }

  if (role === 'lecturer') {
    console.log("🔥 Root dashboard - redirecting to /dashboard/lecturer")
    return redirect('/dashboard/lecturer')
  }

  if (role === 'student') {
    console.log("🔥 Root dashboard - redirecting to /dashboard/student")
    return redirect('/dashboard/student')
  }

  console.log("🔥 Root dashboard - no role, redirecting to /auth/pending")
  return redirect('/auth/pending')
}