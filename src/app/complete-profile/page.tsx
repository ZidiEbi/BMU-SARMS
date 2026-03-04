// 'use client'

// import { useEffect, useMemo, useState } from 'react'
// import { useRouter } from 'next/navigation'
// import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

// type Profile = {
//   full_name: string | null
//   title: string | null
//   phone_number: string | null
//   profile_completed: boolean | null
// }

// export default function CompleteProfilePage() {
//   const router = useRouter()
//   const supabase = useMemo(() => createSupabaseBrowserClient(), [])

//   const [loading, setLoading] = useState(true)
//   const [saving, setSaving] = useState(false)
//   const [error, setError] = useState<string | null>(null)

//   const [fullName, setFullName] = useState('')
//   const [title, setTitle] = useState('')
//   const [phoneNumber, setPhoneNumber] = useState('')

//   useEffect(() => {
//     let cancelled = false

//     const load = async () => {
//       try {
//         setLoading(true)
//         setError(null)

//         const {
//           data: { user },
//           error: authErr,
//         } = await supabase.auth.getUser()

//         if (authErr) throw authErr
//         if (!user) {
//           router.push('/auth/login')
//           router.refresh()
//           return
//         }

//         const { data: profile, error: profErr } = await supabase
//           .from('profiles')
//           .select('full_name, title, phone_number, profile_completed')
//           .eq('id', user.id)
//           .maybeSingle<Profile>()

//         if (profErr) throw profErr

//         if (!cancelled && profile) {
//           // Prefill if they already have data
//           setFullName(profile.full_name ?? '')
//           setTitle(profile.title ?? '')
//           setPhoneNumber(profile.phone_number ?? '')

//           // If already completed, they shouldn't be here
//           if (profile.profile_completed === true) {
//             router.push('/auth/pending')
//             router.refresh()
//             return
//           }
//         }
//       } catch (e: any) {
//         if (!cancelled) setError(e?.message || 'Failed to load profile.')
//       } finally {
//         if (!cancelled) setLoading(false)
//       }
//     }

//     load()
//     return () => {
//       cancelled = true
//     }
//   }, [router, supabase])

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setSaving(true)
//     setError(null)

//     try {
//       const {
//         data: { user },
//         error: authErr,
//       } = await supabase.auth.getUser()

//       if (authErr) throw authErr
//       if (!user) {
//         router.push('/auth/login')
//         router.refresh()
//         return
//       }

//       // IMPORTANT:
//       // - Do NOT write role/faculty_id/department_id here.
//       // - Only biodata + profile_completed.
//       const updates = {
//         full_name: fullName.trim(),
//         title: title.trim() || null,
//         phone_number: phoneNumber.trim() || null,
//         profile_completed: true,
//         // updated_at is handled by your trigger, but harmless if you omit it
//       }

//       const { error: updErr } = await supabase.from('profiles').update(updates).eq('id', user.id)

//       if (updErr) throw updErr

//       // After profile submission -> they wait for assignment
//       router.push('/auth/pending')
//       router.refresh()
//     } catch (e: any) {
//       setError(e?.message || 'Failed to save profile.')
//     } finally {
//       setSaving(false)
//     }
//   }

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center text-slate-600">
//         Loading…
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center px-6">
//       <div className="w-full max-w-md bg-white/90 border border-slate-100 rounded-2xl p-8 shadow-xl">
//         <h1 className="text-2xl font-black text-slate-900 mb-2">Complete Your Profile</h1>
//         <p className="text-slate-600 mb-6">
//           Fill your basic details. After submitting, you’ll wait for an administrator to assign your role and department.
//         </p>

//         {error && (
//           <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
//             {error}
//           </div>
//         )}

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <label className="text-[10px] font-bold uppercase text-slate-400">
//               Full Name (with Title if applicable)
//             </label>
//             <input
//               value={fullName}
//               onChange={(e) => setFullName(e.target.value)}
//               name="full_name"
//               placeholder="e.g. Dr. Jane Smith"
//               required
//               className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300"
//             />
//           </div>

//           <div>
//             <label className="text-[10px] font-bold uppercase text-slate-400">Title</label>
//             <input
//               value={title}
//               onChange={(e) => setTitle(e.target.value)}
//               name="title"
//               placeholder="e.g. Lecturer II / Dr / Prof"
//               className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300"
//             />
//           </div>

//           <div>
//             <label className="text-[10px] font-bold uppercase text-slate-400">Phone Number</label>
//             <input
//               value={phoneNumber}
//               onChange={(e) => setPhoneNumber(e.target.value)}
//               name="phone_number"
//               placeholder="e.g. 08012345678"
//               className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300"
//             />
//           </div>

//           <button
//             type="submit"
//             disabled={saving}
//             className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest hover:opacity-90 transition disabled:opacity-60"
//           >
//             {saving ? 'Saving…' : 'Submit Profile'}
//           </button>

//           <button
//             type="button"
//             onClick={async () => {
//               await supabase.auth.signOut()
//               router.push('/auth/login')
//               router.refresh()
//             }}
//             className="w-full py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold hover:border-slate-300 transition"
//           >
//             Sign out
//           </button>
//         </form>
//       </div>
//     </div>
//   )
// }