'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Plus, BookPlus, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

// Updated type to include department from the profile
type Lecturer = {
  id: string
  full_name: string
  department: string | null
}

export default function AssignCourse({ lecturers, department }: { lecturers: Lecturer[], department: string }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ code: '', name: '', lecturerId: '', semester: 'First' })
  const supabase = createSupabaseBrowserClient()
  const router = useRouter()

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('course_assignments').insert({
      course_code: formData.code.toUpperCase().trim(),
      course_name: formData.name.trim(),
      lecturer_id: formData.lecturerId,
      department: department, // Always saves as the HOD's department
      semester: formData.semester
    })

    if (error) {
      alert(error.message)
    } else {
      setFormData({ code: '', name: '', lecturerId: '', semester: 'First' })
      // Refreshes the server component data without a full page reload
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-medical">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-bmu-blue/10 p-2 rounded-xl">
          <BookPlus className="text-bmu-blue" size={20} />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 tracking-tight text-sm">Assign Course Module</h3>
          <p className="text-[10px] text-slate-400 font-medium">Allocate lecturers to courses within {department}</p>
        </div>
      </div>

      <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Course Code */}
        <input 
          placeholder="Code (e.g. ANA 101)" 
          className="bg-slate-50 border-none rounded-xl text-xs font-bold p-3 focus:ring-2 focus:ring-bmu-blue placeholder:text-slate-300"
          value={formData.code}
          onChange={e => setFormData({...formData, code: e.target.value})}
          required
        />

        {/* Course Name */}
        <input 
          placeholder="Module Name" 
          className="bg-slate-50 border-none rounded-xl text-xs font-bold p-3 focus:ring-2 focus:ring-bmu-blue placeholder:text-slate-300"
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
          required
        />

        {/* Lecturer Selector with Home Department Badge */}
        <select 
          className="bg-slate-50 border-none rounded-xl text-xs font-bold p-3 text-slate-700 focus:ring-2 focus:ring-bmu-blue cursor-pointer"
          value={formData.lecturerId}
          onChange={e => setFormData({...formData, lecturerId: e.target.value})}
          required
        >
          <option value="">Select Specialist</option>
          {lecturers.map(l => (
            <option key={l.id} value={l.id}>
              {l.full_name} — ({l.department || 'No Dept'})
            </option>
          ))}
        </select>

        {/* Semester Selector */}
        <select 
          className="bg-slate-50 border-none rounded-xl text-xs font-bold p-3 text-slate-700 focus:ring-2 focus:ring-bmu-blue cursor-pointer"
          value={formData.semester}
          onChange={e => setFormData({...formData, semester: e.target.value})}
        >
          <option value="First">1st Semester</option>
          <option value="Second">2nd Semester</option>
        </select>

        {/* Submit Button */}
        <button 
          disabled={loading}
          type="submit"
          className="bg-bmu-blue text-white rounded-xl text-xs font-black py-3 hover:shadow-lg hover:shadow-bmu-blue/20 transition-all flex items-center justify-center gap-2 disabled:bg-slate-300 uppercase tracking-widest"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Assign
        </button>
      </form>
    </div>
  )
}