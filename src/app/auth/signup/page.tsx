'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const full_name = fullName.trim()
      const phone_number = phoneNumber.trim()

      if (!full_name) {
        setError('Full name is required.')
        return
      }

      const { error: signUpErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          // Since you said email confirmation is OFF for now, this is okay to keep.
          emailRedirectTo: `${location.origin}/auth/callback`,

          // ✅ This becomes auth.users.raw_user_meta_data
          data: {
            full_name,
            phone_number: phone_number || null,
          },
        },
      })

      if (signUpErr) {
        setError(signUpErr.message)
        return
      }

      // ✅ Do NOT insert into public.profiles here.
      // Your DB trigger (handle_new_user) will create/update the profile row.

      router.push('/auth/pending')
      router.refresh()
    } catch (e: any) {
      setError(e?.message || 'Signup failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleSignup} className="space-y-4 w-full max-w-md">
        <h1 className="text-xl font-semibold text-center">Create account</h1>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <input
          type="text"
          placeholder="Full name (with title) e.g. Dr. Jane Smith"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <input
          type="tel"
          placeholder="Phone number (optional)"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <button disabled={loading} className="w-full bg-black text-white py-2 rounded">
          {loading ? 'Creating…' : 'Sign up'}
        </button>
      </form>
    </div>
  )
}