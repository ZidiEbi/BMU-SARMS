'use client'
import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function CompleteProfile() {
  const supabase = createSupabaseBrowserClient()
  const router = useRouter()
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(true)

  // 1. Get user role on load
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase.from('profiles').select('role').eq('id', user?.id).single()
      setRole(data?.role || '')
      setLoading(false)
    }
    checkUser()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const { data: { user } } = await supabase.auth.getUser()

    const updates = {
      full_name: formData.get('full_name'),
      faculty: formData.get('faculty'),
      department: role === 'dean' ? null : formData.get('department'), // Deans leave dept empty
      profile_completed: true,
    }

    const { error } = await supabase.from('profiles').update(updates).eq('id', user?.id)
    
    if (!error) router.push('/dashboard')
    else alert(error.message)
  }

  if (loading) return <p>Loading...</p>

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl shadow-xl border border-slate-100">
      <h1 className="text-2xl font-black uppercase mb-6 text-slate-900">Complete Your Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div>
          <label className="text-[10px] font-bold uppercase text-slate-400">Full Name (with Title)</label>
          <input name="full_name" placeholder="e.g. Dr. Jane Smith" required className="w-full p-3 rounded-xl border border-slate-200" />
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase text-slate-400">Faculty</label>
          <select name="faculty" required className="w-full p-3 rounded-xl border border-slate-200">
            <option value="Clinical Sciences">Clinical Sciences</option>
            <option value="Engineering">Engineering</option>
          </select>
        </div>

        {/* ONLY show Department if NOT a Dean */}
        {role !== 'dean' && (
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400">Department</label>
            <select name="department" required className="w-full p-3 rounded-xl border border-slate-200">
              <option value="Nursing">Nursing</option>
              <option value="Medicine">Medicine</option>
            </select>
          </div>
        )}

        <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest hover:bg-blue-700">
          Save & Enter Dashboard
        </button>
      </form>
    </div>
  )
}