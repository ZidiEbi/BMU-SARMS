'use client'

import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bmu-primary to-bmu-secondary">
      <form
        onSubmit={handleLogin}
        className="bg-white/95 p-8 rounded-2xl shadow-xl w-full max-w-md space-y-6"
      >
        <h1 className="text-2xl font-semibold text-center text-gray-900">
          BMU Portal Login
        </h1>

        {error && (
          <p className="text-red-600 text-sm text-center">{error}</p>
        )}

        <input
          type="email"
          placeholder="Email address"
          className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-bmu-primary"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-bmu-primary"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-bmu-primary text-white font-medium hover:opacity-90 transition"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <button
          type="button"
          onClick={() => router.push('/auth/forgot-password')}
          className="text-sm text-bmu-primary hover:underline block mx-auto"
        >
          Forgot password?
        </button>
      </form>
    </div>
  )
}
