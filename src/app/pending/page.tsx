'use client'

import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { useRouter } from 'next/navigation'

export default function PendingAccessPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="relative max-w-md w-full rounded-2xl border border-bmu-border bg-bmu-surface p-8 shadow-lg text-center">

        {/* Accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-bmu-purple via-bmu-green to-bmu-blue" />

        <h1 className="mt-4 text-2xl font-semibold text-foreground">
          Access Pending Approval
        </h1>

        <p className="mt-4 text-sm text-foreground/70 leading-relaxed">
          Your account has been successfully created, but it has not yet been
          assigned a system role.
        </p>

        <p className="mt-3 text-sm text-foreground/70 leading-relaxed">
          Please contact the <span className="font-medium">Registry or System Administrator</span> to
          activate your access.
        </p>

        <div className="mt-8">
          <button
            onClick={handleLogout}
            className="w-full rounded-xl border border-bmu-border bg-bmu-surface px-4 py-3 text-sm font-medium hover:bg-bmu-surface/80 transition"
          >
            Sign out
          </button>
        </div>

        <p className="mt-6 text-xs text-foreground/50">
          Bayelsa Medical University · Secure Academic Records System
        </p>
      </div>
    </main>
  )
}
