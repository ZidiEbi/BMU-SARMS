'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { Camera, Loader2, Upload } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  async function uploadAvatar(userId: string, file: File) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    return publicUrl
  }

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

      // 1. Sign up the user
      const { data: authData, error: signUpErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
          data: {
            full_name,
            phone_number: phone_number || null,
          },
        },
      })

      if (signUpErr) throw signUpErr
      if (!authData.user) throw new Error('Signup failed')

      // 2. Upload avatar if provided
      let avatarUrl = null
      if (avatarFile) {
        try {
          avatarUrl = await uploadAvatar(authData.user.id, avatarFile)
        } catch (uploadErr) {
          console.error('Avatar upload failed:', uploadErr)
          // Continue with signup even if avatar fails
        }
      }

      // 3. Update profile with avatar URL
      if (avatarUrl) {
        await supabase
          .from('profiles')
          .update({ avatar_url: avatarUrl })
          .eq('id', authData.user.id)
      }

      router.push('/auth/pending')
      router.refresh()
    } catch (e: any) {
      setError(e?.message || 'Signup failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-50 to-white">
      <form onSubmit={handleSignup} className="space-y-6 w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl">
        <h1 className="text-2xl font-black text-center text-slate-900 uppercase tracking-tight">
          Create Account
        </h1>
        <p className="text-[10px] text-center text-slate-400 font-black uppercase tracking-widest">
          BMU Academic Records System
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-600 text-xs font-bold">{error}</p>
          </div>
        )}

        {/* Avatar Upload Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl overflow-hidden bg-slate-100 border-4 border-white shadow-xl">
              {avatarPreview ? (
                <img 
                  src={avatarPreview} 
                  alt="Avatar preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <Camera size={32} />
                </div>
              )}
            </div>
            <label 
              htmlFor="avatar-upload"
              className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-xl cursor-pointer hover:bg-blue-700 transition-all shadow-lg"
            >
              <Upload size={16} />
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            Click the upload button to add a profile photo
          </p>
        </div>

        <input
          type="text"
          placeholder="Full name (e.g. Dr. Jane Smith)"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full border border-slate-200 rounded-xl p-4 text-sm font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />

        <input
          type="tel"
          placeholder="Phone number (optional)"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="w-full border border-slate-200 rounded-xl p-4 text-sm font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />

        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-slate-200 rounded-xl p-4 text-sm font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />

        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-slate-200 rounded-xl p-4 text-sm font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />

        <button 
          disabled={loading} 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        <p className="text-center text-xs text-slate-400">
          Already have an account?{' '}
          <a href="/auth/login" className="text-blue-600 font-bold hover:underline">
            Sign in
          </a>
        </p>
      </form>
    </div>
  )
}