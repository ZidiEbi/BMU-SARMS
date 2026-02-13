// src/app/dashboard/admin/audit-logs/page.tsx
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function AuditLogsPage() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // 🔐 Confirm SUPER_ADMIN
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'SUPER_ADMIN') {
    redirect('/dashboard')
  }

  // Fetch audit logs
  const { data: logs, error } = await supabase
    .from('role_audit_logs')
    .select(`
      id,
      old_role,
      new_role,
      created_at,
      actor_id,
      target_id
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    throw new Error('Failed to load audit logs')
  }

  return (
    <main className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">
          Role Change Audit Logs
        </h1>
        <p className="text-sm text-foreground/60">
          Immutable record of all role assignments and changes
        </p>
      </header>

      <div className="overflow-x-auto rounded-xl border border-bmu-border">
        <table className="min-w-full text-sm">
          <thead className="bg-bmu-surface">
            <tr className="text-left">
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Old Role</th>
              <th className="px-4 py-3">New Role</th>
            </tr>
          </thead>

          <tbody>
            {logs?.map((log) => (
              <tr
                key={log.id}
                className="border-t border-bmu-border hover:bg-bmu-surface/60 transition"
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  {log.actor_id}
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  {log.target_id}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-md bg-red-500/10 px-2 py-1 text-red-600">
                    {log.old_role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-md bg-green-500/10 px-2 py-1 text-green-600">
                    {log.new_role}
                  </span>
                </td>
              </tr>
            ))}

            {logs?.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-foreground/50"
                >
                  No audit events recorded yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}
