import { getAuthProfileOrRedirect } from "@/lib/auth/guards"
import DashboardLayout from "@/components/dashboard/DashboardLayout"

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { profile } = await getAuthProfileOrRedirect()
  
  return (
    <DashboardLayout profile={profile}>
      {children}
    </DashboardLayout>
  )
}