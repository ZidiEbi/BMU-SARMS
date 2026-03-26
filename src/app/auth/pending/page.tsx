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
  const [title, setTitle] = useState('Access pending')
  const [message, setMessage] = useState<string>('Checking your access…')

  useEffect(() => {
    let cancelled = false
    let intervalId: ReturnType<typeof setInterval> | null = null

    const check = async () => {
      try {
        if (cancelled) return

        setStatus('checking')
        setTitle('Access pending')
        setMessage('Checking your access…')

        const {
          data: { user },
          error: authErr,
        } = await supabase.auth.getUser()

        if (cancelled) return

        if (authErr) {
          setStatus('error')
          setTitle('Something went wrong')
          setMessage(authErr.message || 'Auth check failed.')
          return
        }

        if (!user) {
          setStatus('not_logged_in')
          setTitle('Session missing')
          setMessage('You are not logged in. Please sign in again.')
          return
        }

        const { data: profile, error: profErr } = await supabase
          .from('profiles')
          .select(
            'role, profile_completed, faculty_id, department_id, requested_department_id, is_verified, is_active'
          )
          .eq('id', user.id)
          .maybeSingle()

        if (cancelled) return

        if (profErr || !profile) {
          setStatus('error')
          setTitle('Something went wrong')
          setMessage(profErr?.message || 'Could not load your profile.')
          return
        }

        const role = normalizeRole(profile.role)

        if (profile.is_active === false) {
          setStatus('redirecting')
          setTitle('Redirecting…')
          setMessage('Your account has been disabled. Redirecting…')
          router.push('/disabled')
          router.refresh()
          return
        }

        // APPROVED / ACTIVE USERS SHOULD NOT STAY HERE
        if (role !== 'pending') {
          // Lecturer remains here until fully approved:
          // - must be verified
          // - must have confirmed department
          if (role === 'lecturer') {
            const lecturerStillPending =
              profile.is_verified !== true || !profile.department_id

            if (lecturerStillPending) {
              setStatus('waiting')
              setTitle('Lecturer approval pending')
              setMessage(
                profile.requested_department_id
                  ? 'Your lecturer account has been created successfully and your department request is awaiting Head of Department approval. Full lecturer access will be enabled once your request is approved.'
                  : 'Your lecturer account is not yet fully approved. Please wait while your access is being finalized.'
              )
              return
            }
          }

          setStatus('redirecting')
          setTitle('Redirecting…')
          setMessage('Your account is active. Redirecting to your dashboard…')
          router.push('/dashboard')
          router.refresh()
          return
        }

        // CLASSIC PENDING ROLE USERS
        if (profile.profile_completed !== true) {
          setStatus('redirecting')
          setTitle('Redirecting…')
          setMessage('You need to complete your profile. Redirecting…')
          router.push('/complete-profile')
          router.refresh()
          return
        }

        setStatus('waiting')
        setTitle('Access pending')
        setMessage(
          'Your profile has been submitted successfully. Please wait for an administrator to assign your role and complete the required academic placement details.'
        )
      } catch (e: any) {
        if (cancelled) return
        setStatus('error')
        setTitle('Something went wrong')
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

  return (
    <div className="min-h-screen flex items-center justify-center text-center px-6 bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-md w-full bg-white/90 border border-slate-100 rounded-3xl p-8 shadow-2xl">
        <h1 className="text-2xl font-black text-slate-900 mb-3">{title}</h1>

        <p className="text-slate-600 mb-6 leading-relaxed">{message}</p>

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