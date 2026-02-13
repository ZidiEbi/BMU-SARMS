'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Check, ChevronDown, UserCog, Building2 } from 'lucide-react'

// Constants to match your official BMU academic structure
const FACULTIES = ["Basic Medical Sciences", "Clinical Sciences", "Dental Sciences", "Health Sciences"]
const DEPARTMENTS = ["Anatomy", "Physiology", "Nursing", "Surgery", "Public Health"]

export default function UserAssignment({ user }: { user: any }) {
  const [loading, setLoading] = useState(false)
  const supabase = createSupabaseBrowserClient()

  const handleUpdate = async (field: string, value: string) => {
    setLoading(true)
    const { error } = await supabase
      .from('profiles')
      .update({ [field]: value })
      .eq('id', user.id)
    
    setLoading(false)
    if (!error) window.location.reload() // Refresh to sync data
  }

  return (
    <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex-1">
        <p className="text-sm font-bold text-slate-900">{user.full_name || user.email}</p>
        <p className="text-[10px] text-bmu-blue font-black uppercase tracking-tighter">{user.role}</p>
      </div>

      {/* Faculty Assignment (For Deans/HODs) */}
      <div className="relative group">
        <select 
          disabled={loading}
          onChange={(e) => handleUpdate('faculty', e.target.value)}
          value={user.faculty || ""}
          className="appearance-none bg-bmu-slate text-xs font-bold py-2 pl-4 pr-10 rounded-xl border-none focus:ring-2 focus:ring-bmu-blue cursor-pointer"
        >
          <option value="">Assign Faculty</option>
          {FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={14} />
      </div>

      {/* Department Assignment (Specific to HODs) */}
      {user.role === 'hod' && (
        <div className="relative group">
          <select 
            disabled={loading}
            onChange={(e) => handleUpdate('department', e.target.value)}
            value={user.department || ""}
            className="appearance-none bg-bmu-slate text-xs font-bold py-2 pl-4 pr-10 rounded-xl border-none focus:ring-2 focus:ring-bmu-blue cursor-pointer"
          >
            <option value="">Assign Dept</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={14} />
        </div>
      )}

      {loading && <div className="animate-spin h-4 w-4 border-2 border-bmu-blue border-t-transparent rounded-full" />}
    </div>
  )
}