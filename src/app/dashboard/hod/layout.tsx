import { redirect } from 'next/navigation'
import { getAuthProfileOrRedirect, requireRole } from '@/lib/auth/guards'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

export default async function HODLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { profile } = await getAuthProfileOrRedirect()
  
  // Security check
  requireRole(profile, ["hod", "admin", "SUPER_ADMIN"])

  return (
    <DashboardLayout profile={profile}>
      {children}
    </DashboardLayout>
  )
}