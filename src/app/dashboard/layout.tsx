import { getAuthProfileOrRedirect, routeGate } from "@/lib/auth/guards"
import DashboardLayout from "@/components/dashboard/DashboardLayout"

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { profile } = await getAuthProfileOrRedirect()

  routeGate(profile, "/dashboard")

  return (
    <DashboardLayout profile={profile}>
      {children}
    </DashboardLayout>
  )
}