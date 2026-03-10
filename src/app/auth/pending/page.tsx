'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

type Status = 'checking' | 'waiting' | 'redirecting' | 'not_logged_in' | 'error'

function normalizeRole(role: unknown) {
  if (!role) return 'pending'
  const value = String(role).trim()
  return value === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : value.toLowerCase()
}

export default function PendingPage() {
  const router = useRouter()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  const [status, setStatus] = useState<Status>('checking')
  const [message, setMessage] = useState<string>('Checking your access…')

  useEffect(() => {
    let cancelled = false
    let intervalId: ReturnType<typeof setInterval> | null = null

    const check = async () => {
      try {
        if (cancelled) return

        setStatus('checking')
        setMessage('Checking your access…')

        const {
          data: { user },
          error: authErr,
        } = await supabase.auth.getUser()

        if (cancelled) return

        if (authErr) {
          setStatus('error')
          setMessage(authErr.message || 'Auth check failed.')
          return
        }

        if (!user) {
          setStatus('not_logged_in')
          setMessage('You are not logged in. Please sign in again.')
          return
        }

        const { data: profile, error: profErr } = await supabase
          .from('profiles')
          .select('role, profile_completed, faculty_id, department_id, is_verified, is_active')
          .eq('id', user.id)
          .maybeSingle()

        if (cancelled) return

        if (profErr || !profile) {
          setStatus('error')
          setMessage(profErr?.message || 'Could not load your profile.')
          return
        }

        const role = normalizeRole(profile.role)

        if (profile.is_active === false) {
          setStatus('redirecting')
          setMessage('Your account has been disabled. Redirecting…')
          router.push('/disabled')
          router.refresh()
          return
        }

        // Only truly pending users should remain on this page
        if (role !== 'pending') {
          // Lecturer-specific verification route
          if (role === 'lecturer' && !profile.is_verified) {
            setStatus('redirecting')
            setMessage('Your lecturer account is awaiting verification. Redirecting…')
            router.push('/dashboard/lecturer/verification-pending')
            router.refresh()
            return
          }

          setStatus('redirecting')
          setMessage('Your account is already assigned. Redirecting to your dashboard…')
          router.push('/dashboard')
          router.refresh()
          return
        }

        if (profile.profile_completed !== true) {
          setStatus('redirecting')
          setMessage('You need to complete your profile. Redirecting…')
          router.push('/complete-profile')
          router.refresh()
          return
        }

        setStatus('waiting')
        setMessage(
          'Your profile is submitted. Please wait for an administrator to assign your role, faculty, and department where required.'
        )
      } catch (e: any) {
        if (cancelled) return
        setStatus('error')
        setMessage(e?.message || 'Something went wrong while checking your access.')
      }
    }

    check()
    intervalId = setInterval(check, 5000)

    return () => {
      cancelled = true
      if (intervalId) clearInterval(intervalId)
    }
  }, [router, supabase])

  const title =
    status === 'redirecting'
      ? 'Redirecting…'
      : status === 'error'
        ? 'Something went wrong'
        : status === 'not_logged_in'
          ? 'Session missing'
          : 'Access pending'

  return (
    <div className="min-h-screen flex items-center justify-center text-center px-6">
      <div className="max-w-md w-full bg-white/80 border border-slate-100 rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-black text-slate-900 mb-3">{title}</h1>

        <p className="text-slate-600 mb-6">{message}</p>

        <div className="flex gap-3 justify-center">
          {status === 'not_logged_in' && (
            <button
              onClick={() => {
                router.push('/auth/login')
                router.refresh()
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-blue-600 transition"
            >
              Go to Login
            </button>
          )}

          {status === 'error' && (
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-blue-600 transition"
            >
              Retry
            </button>
          )}

          {status === 'waiting' && (
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:border-slate-400 transition"
            >
              Refresh now
            </button>
          )}
        </div>

        <p className="text-[11px] text-slate-400 mt-6">
          This page checks automatically every 5 seconds.
        </p>
      </div>
    </div>
  )
}