'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { ShieldCheck, UserCog, Building2, GraduationCap, Search, Loader2 } from 'lucide-react'

const ROLES = ['PENDING', 'registry', 'lecturer', 'hod', 'dean', 'admin', 'SUPER_ADMIN'] as const
const FACULTIES = ["Basic Medical Sciences", "Clinical Sciences", "Dental Sciences", "Health Sciences"]
const DEPARTMENTS = ["Anatomy", "Physiology", "Nursing", "Surgery", "Public Health"]

type Profile = {
  id: string
  email: string
  role: string
  faculty?: string
  department?: string
  full_name?: string
}

export default function AdminRoleManagementPage() {
  const supabase = createSupabaseBrowserClient()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { fetchProfiles() }, [])

  async function fetchProfiles() {
    setLoading(true)
    const { data, error } = await supabase
      .from('user_management_view') 
      .select('*') // Get everything: id, email, role, faculty, department
      .order('role')

    if (error) setError(error.message)
    else setProfiles(data || [])
    setLoading(false)
  }

  async function updateProfileField(userId: string, field: string, value: string) {
    setSavingId(`${userId}-${field}`)
    const { error } = await supabase
      .from('profiles')
      .update({ [field]: value })
      .eq('id', userId)

    if (error) {
      setError(error.message)
    } else {
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, [field]: value } : p))
    }
    setSavingId(null)
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Institutional Hierarchy</h1>
          <p className="text-sm text-slate-500 font-medium">Manage user permissions and faculty assignments</p>
        </div>
        <div className="bg-bmu-blue/5 px-4 py-2 rounded-2xl border border-bmu-blue/10 flex items-center gap-2">
            <ShieldCheck className="text-bmu-blue" size={18}/>
            <span className="text-[10px] font-black text-bmu-blue uppercase tracking-widest">Secure Admin Terminal</span>
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}

      {/* Main Management Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-medical overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">User Identity</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Institutional Role</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Assignment Scope</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={3} className="px-6 py-20 text-center text-slate-400 font-medium">Initialising Secure Feed...</td></tr>
            ) : (
              profiles.map((profile) => (
                <tr key={profile.id} className="hover:bg-bmu-slate transition-colors group">
                  <td className="px-6 py-5">
                    <p className="font-bold text-slate-900 text-sm">{profile.email}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">ID: {profile.id.slice(0,8)}</p>
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <select
                        value={profile.role}
                        onChange={(e) => updateProfileField(profile.id, 'role', e.target.value)}
                        disabled={savingId === `${profile.id}-role`}
                        className="text-xs font-bold rounded-xl border-slate-200 bg-white px-3 py-2 focus:ring-2 focus:ring-bmu-blue transition-all"
                      >
                        {ROLES.map((role) => <option key={role} value={role}>{role.toUpperCase()}</option>)}
                      </select>
                      {savingId === `${profile.id}-role` && <Loader2 size={14} className="animate-spin text-bmu-blue" />}
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      {/* Faculty Selector (For Deans & HODs) */}
                      {(profile.role === 'dean' || profile.role === 'hod') && (
                        <select
                          value={profile.faculty || ""}
                          onChange={(e) => updateProfileField(profile.id, 'faculty', e.target.value)}
                          className="text-[10px] font-black uppercase tracking-tight rounded-xl border-none bg-bmu-blue/5 text-bmu-blue px-3 py-2"
                        >
                          <option value="">Select Faculty</option>
                          {FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      )}

                      {/* Department Selector (For HODs only) */}
                      {profile.role === 'hod' && (
                        <select
                          value={profile.department || ""}
                          onChange={(e) => updateProfileField(profile.id, 'department', e.target.value)}
                          className="text-[10px] font-black uppercase tracking-tight rounded-xl border-none bg-bmu-maroon/5 text-bmu-maroon px-3 py-2"
                        >
                          <option value="">Select Dept</option>
                          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}