import { getAuthProfileOrRedirect, requireRole } from "@/lib/auth/guards"

export default async function LecturerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { profile } = await getAuthProfileOrRedirect()
  requireRole(profile, ["lecturer"])

  // ❌ remove routeGate(profile) from layout (it causes redirect loops)
  return <>{children}</>
}