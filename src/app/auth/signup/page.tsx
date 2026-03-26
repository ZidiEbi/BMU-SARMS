'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import {
  AlertCircle,
  Camera,
  GraduationCap,
  Loader2,
  ShieldCheck,
  Upload,
  UserRound,
  Users,
} from 'lucide-react'

type Faculty = {
  id: string
  name: string
}

type Department = {
  id: string
  name: string
  faculty_id: string
}

type SignupRole = 'lecturer' | 'hod' | 'dean' | 'registry'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const ROLE_META: Record<
  SignupRole,
  {
    label: string
    helper: string
    icon: React.ReactNode
  }
> = {
  lecturer: {
    label: 'Lecturer',
    helper: 'Teaching staff requesting department-linked academic access.',
    icon: <UserRound size={16} />,
  },
  hod: {
    label: 'HOD',
    helper: 'Department-level academic supervision and result oversight.',
    icon: <Users size={16} />,
  },
  dean: {
    label: 'Dean',
    helper: 'Faculty-wide result supervision and approval authority.',
    icon: <GraduationCap size={16} />,
  },
  registry: {
    label: 'Registry',
    helper: 'Records, registration, and academic operations support.',
    icon: <ShieldCheck size={16} />,
  },
}

export default function SignupPage() {
  const router = useRouter()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [staffId, setStaffId] = useState('')
  const [title, setTitle] = useState('')

  const [role, setRole] = useState<SignupRole>('lecturer')
  const [facultyId, setFacultyId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [requestedDepartmentId, setRequestedDepartmentId] = useState('')

  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loadingLookups, setLoadingLookups] = useState(true)

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadLookups = async () => {
      setLoadingLookups(true)

      const [{ data: facultyData, error: facultyError }, { data: departmentData, error: departmentError }] =
        await Promise.all([
          supabase.from('faculties').select('id, name').order('name', { ascending: true }),
          supabase
            .from('departments')
            .select('id, name, faculty_id')
            .order('name', { ascending: true }),
        ])

      if (facultyError) {
        console.error('Faculty load error:', facultyError.message, facultyError)
      } else {
        setFaculties((facultyData || []) as Faculty[])
      }

      if (departmentError) {
        console.error('Department load error:', departmentError.message, departmentError)
      } else {
        setDepartments((departmentData || []) as Department[])
      }

      setLoadingLookups(false)
    }

    loadLookups()
  }, [supabase])

  useEffect(() => {
    if (role === 'dean') {
      setDepartmentId('')
      setRequestedDepartmentId('')
      return
    }

    if (role === 'hod') {
      setRequestedDepartmentId('')
      return
    }

    if (role === 'lecturer') {
      setDepartmentId('')
      return
    }

    if (role === 'registry') {
      setDepartmentId('')
      setRequestedDepartmentId('')
    }
  }, [role])

  const selectedDepartmentForLecturer =
    departments.find((dept) => dept.id === requestedDepartmentId) ?? null
  const selectedDepartmentForHOD =
    departments.find((dept) => dept.id === departmentId) ?? null

  const effectiveFacultyId =
    role === 'dean'
      ? facultyId
      : role === 'hod'
      ? selectedDepartmentForHOD?.faculty_id ?? facultyId
      : role === 'lecturer'
      ? selectedDepartmentForLecturer?.faculty_id ?? facultyId
      : facultyId

  const filteredDepartments = useMemo(() => {
    if (!effectiveFacultyId) return departments
    return departments.filter((dept) => dept.faculty_id === effectiveFacultyId)
  }, [departments, effectiveFacultyId])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarFile(file)

    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  async function uploadAvatar(userId: string, file: File) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)

    if (uploadError) throw uploadError

    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(filePath)

    return publicUrl
  }

  async function persistProfileWithRetry(
    userId: string,
    profileUpdates: Record<string, unknown>
  ) {
    let lastError: unknown = null

    for (let attempt = 1; attempt <= 5; attempt++) {
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle()

      if (fetchError) {
        lastError = fetchError
      }

      if (existingProfile?.id) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', userId)

        if (!updateError) return
        lastError = updateError
      } else {
        const { error: upsertError } = await supabase.from('profiles').upsert(
          {
            id: userId,
            ...profileUpdates,
          },
          { onConflict: 'id' }
        )

        if (!upsertError) return
        lastError = upsertError
      }

      await sleep(400 * attempt)
    }

    if (lastError instanceof Error) {
      throw lastError
    }

    if (
      typeof lastError === 'object' &&
      lastError !== null &&
      'message' in lastError &&
      typeof (lastError as { message?: unknown }).message === 'string'
    ) {
      throw new Error((lastError as { message: string }).message)
    }

    throw new Error('Could not save your profile details. Please try again.')
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const full_name = fullName.trim()
      const phone_number = phoneNumber.trim()
      const cleanEmail = email.trim().toLowerCase()
      const cleanStaffId = staffId.trim()
      const cleanTitle = title.trim()

      if (!full_name) {
        throw new Error('Full name is required.')
      }

      if (!cleanEmail) {
        throw new Error('Email is required.')
      }

      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters.')
      }

      if (role === 'lecturer' && !requestedDepartmentId) {
        throw new Error('Lecturers must choose a home department.')
      }

      if (role === 'hod' && !departmentId) {
        throw new Error('HOD accounts must choose a department.')
      }

      if (role === 'dean' && !facultyId) {
        throw new Error('Dean accounts must choose a faculty.')
      }

      const metadata = {
        full_name,
        phone_number: phone_number || null,
        role,
        staff_id: cleanStaffId || null,
        title: cleanTitle || null,
        faculty_id: effectiveFacultyId || null,
        department_id: role === 'hod' ? departmentId : null,
        requested_department_id: role === 'lecturer' ? requestedDepartmentId : null,
      }

      const { data: authData, error: signUpErr } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: metadata,
        },
      })

      if (signUpErr) throw signUpErr
      if (!authData.user) throw new Error('Signup failed.')

      let avatarUrl: string | null = null

      if (avatarFile) {
        try {
          avatarUrl = await uploadAvatar(authData.user.id, avatarFile)
        } catch (uploadErr) {
          console.error('Avatar upload failed:', uploadErr)
        }
      }

      const profileUpdates: Record<string, unknown> = {
        role,
        full_name,
        phone_number: phone_number || null,
        staff_id: cleanStaffId || null,
        title: cleanTitle || null,
        avatar_url: avatarUrl,
        is_verified: false,
        faculty_id: effectiveFacultyId || null,
        department_id: role === 'hod' ? departmentId : null,
        requested_department_id: role === 'lecturer' ? requestedDepartmentId : null,
      }

      if (role === 'registry') {
        profileUpdates.department_id = null
        profileUpdates.requested_department_id = null
      }

      if (role === 'dean') {
        profileUpdates.department_id = null
        profileUpdates.requested_department_id = null
      }

      await persistProfileWithRetry(authData.user.id, profileUpdates)

      router.push('/auth/pending')
      router.refresh()
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message)
      } else {
        setError('Signup failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  const needsFaculty = role === 'dean' || role === 'registry'
  const needsDepartment = role === 'hod'
  const needsRequestedDepartment = role === 'lecturer'

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="hidden lg:flex flex-col justify-between rounded-[2.75rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div>
              <div className="inline-flex items-center gap-3 rounded-2xl bg-blue-50 px-4 py-3">
                <div className="relative h-10 w-10 overflow-hidden rounded-2xl bg-white">
                  <Image
                    src="/bmu-logo.png"
                    alt="BMU Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">BMU-SARMS</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-700">
                    Staff Onboarding
                  </p>
                </div>
              </div>

              <div className="mt-10 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-700">
                  Production-grade access flow
                </p>
                <h1 className="text-4xl font-black tracking-tight text-slate-900">
                  Create a staff account that matches your institutional role.
                </h1>
                <p className="max-w-xl text-sm font-medium leading-7 text-slate-500">
                  This onboarding flow now supports academic and administrative staff pathways,
                  including Lecturer, HOD, Dean, and Registry roles. Each account is linked to the
                  right faculty or department context before approval.
                </p>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {(['lecturer', 'hod', 'dean', 'registry'] as SignupRole[]).map((roleKey) => (
                  <div
                    key={roleKey}
                    className={`rounded-[1.75rem] border p-5 transition ${
                      role === roleKey
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
                      {ROLE_META[roleKey].icon}
                    </div>
                    <h3 className="mt-4 text-base font-black text-slate-900">
                      {ROLE_META[roleKey].label}
                    </h3>
                    <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                      {ROLE_META[roleKey].helper}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-700">
                Security note
              </p>
              <p className="mt-2 text-sm font-medium leading-6 text-amber-900">
                Self-signup is intentionally limited to operational staff roles. Higher-control
                platform roles such as Admin and Super Admin should continue to be provisioned
                through secured internal processes, not public signup.
              </p>
            </div>
          </section>

          <section className="rounded-[2.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
            <form onSubmit={handleSignup} className="space-y-8">
              <div className="text-center lg:text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-700">
                  Account creation
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                  Staff Signup
                </h2>
                <p className="mt-2 text-sm font-medium text-slate-500">
                  Complete your profile and request role-based access to the academic records system.
                </p>
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={18} className="mt-0.5 text-red-600" />
                    <p className="text-sm font-semibold text-red-700">{error}</p>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="h-28 w-28 overflow-hidden rounded-[2rem] border-4 border-white bg-slate-100 shadow-xl">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <Camera size={34} />
                      </div>
                    )}
                  </div>

                  <label
                    htmlFor="avatar-upload"
                    className="absolute -bottom-2 -right-2 cursor-pointer rounded-xl bg-blue-600 p-2 text-white shadow-lg transition-all hover:bg-blue-700"
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

                <p className="text-[11px] font-medium text-slate-400">
                  Optional profile photo
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                  Account Type
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  {(['lecturer', 'hod', 'dean', 'registry'] as SignupRole[]).map((roleKey) => {
                    const active = role === roleKey

                    return (
                      <button
                        key={roleKey}
                        type="button"
                        onClick={() => setRole(roleKey)}
                        className={`rounded-[1.75rem] border p-4 text-left transition-all ${
                          active
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <span className={active ? 'text-blue-600' : 'text-slate-400'}>
                            {ROLE_META[roleKey].icon}
                          </span>
                          <span className="text-sm font-black text-slate-900">
                            {ROLE_META[roleKey].label}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium leading-5 text-slate-500">
                          {ROLE_META[roleKey].helper}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Full name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-bold placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-blue-500 transition-all"
                />

                <input
                  type="text"
                  placeholder="Title (optional)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-bold placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-blue-500 transition-all"
                />

                <input
                  type="text"
                  placeholder="Staff ID (optional)"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-bold placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-blue-500 transition-all"
                />

                <input
                  type="tel"
                  placeholder="Phone number (optional)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-bold placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-blue-500 transition-all"
                />

                <input
                  type="email"
                  placeholder="Email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-bold placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-blue-500 transition-all sm:col-span-2"
                />

                <input
                  type="password"
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-bold placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-blue-500 transition-all sm:col-span-2"
                />
              </div>

              <div className="space-y-4 rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                    Institutional scope
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    Choose the faculty or department context required for your role.
                  </p>
                </div>

                {needsFaculty && (
                  <select
                    value={facultyId}
                    onChange={(e) => {
                      setFacultyId(e.target.value)
                      setDepartmentId('')
                      setRequestedDepartmentId('')
                    }}
                    disabled={loadingLookups}
                    className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold focus:border-transparent focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-60"
                  >
                    <option value="">Select faculty</option>
                    {faculties.map((faculty) => (
                      <option key={faculty.id} value={faculty.id}>
                        {faculty.name}
                      </option>
                    ))}
                  </select>
                )}

                {needsDepartment && (
                  <>
                    {!facultyId ? (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                        Select a faculty first to continue with department selection.
                      </div>
                    ) : null}

                    <select
                      required
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      disabled={loadingLookups || !facultyId}
                      className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold focus:border-transparent focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-60"
                    >
                      <option value="">Select department</option>
                      {filteredDepartments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </>
                )}

                {needsRequestedDepartment && (
                  <>
                    {!facultyId ? (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                        Select a faculty first to continue with department selection.
                      </div>
                    ) : null}

                    <select
                      required
                      value={requestedDepartmentId}
                      onChange={(e) => setRequestedDepartmentId(e.target.value)}
                      disabled={loadingLookups || !facultyId}
                      className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold focus:border-transparent focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-60"
                    >
                      <option value="">Select home department</option>
                      {filteredDepartments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </>
                )}

                {role === 'lecturer' ? (
                  <p className="text-[11px] font-medium leading-6 text-slate-500">
                    Lecturer accounts request a home department and remain pending until departmental approval is completed.
                  </p>
                ) : role === 'hod' ? (
                  <p className="text-[11px] font-medium leading-6 text-slate-500">
                    HOD signup is department-scoped and should still go through institutional verification before activation.
                  </p>
                ) : role === 'dean' ? (
                  <p className="text-[11px] font-medium leading-6 text-slate-500">
                    Dean accounts are faculty-scoped and should be approved before faculty-level access is granted.
                  </p>
                ) : (
                  <p className="text-[11px] font-medium leading-6 text-slate-500">
                    Registry accounts may be created without department assignment and can later be aligned administratively if needed.
                  </p>
                )}
              </div>

              <button
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-xs font-black uppercase tracking-[0.25em] text-white transition-all hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>

              <p className="text-center text-xs text-slate-400">
                Already have an account?{' '}
                <Link href="/auth/login" className="font-bold text-blue-600 hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}