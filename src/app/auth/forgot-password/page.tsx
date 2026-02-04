'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) setError(error.message)
    else setMessage('Password reset link sent to your email.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-900">
      <form
        onSubmit={handleReset}
        className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md"
      >
        <h2 className="text-xl font-semibold text-blue-900 mb-4">
          Reset Password
        </h2>

        {error && <p className="text-red-600 mb-3">{error}</p>}
        {message && <p className="text-green-600 mb-3">{message}</p>}

        <input
          type="email"
          placeholder="Your email"
          className="w-full p-3 border rounded mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button className="w-full bg-blue-800 text-white py-3 rounded">
          Send reset link
        </button>
      </form>
    </div>
  )
}
