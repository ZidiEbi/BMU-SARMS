'use client'

import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Trash2, BookOpen, User, Hash, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteAssignment({ assignments }: { assignments: any[] }) {
  const supabase = createSupabaseBrowserClient()
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this course assignment?")) return
    
    setDeletingId(id)
    const { error } = await supabase
      .from('course_assignments')
      .delete()
      .eq('id', id)

    if (error) {
      alert(error.message)
    } else {
      router.refresh()
    }
    setDeletingId(null)
  }

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm mt-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-red-50 p-2 rounded-xl text-red-500">
          <BookOpen size={20} />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase">Active Course Allocations</h2>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Current assignments for the session</p>
        </div>
      </div>

      <div className="overflow-hidden border border-slate-50 rounded-3xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50">
              <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Course</th>
              <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Units</th>
              <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lecturer</th>
              <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {assignments.length > 0 ? (
              assignments.map((course) => (
                <tr key={course.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-5">
                    <p className="font-black text-slate-900 text-xs">{course.course_code}</p>
                    <p className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">{course.course_name}</p>
                  </td>
                  <td className="p-5">
                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black">
                      {course.units} U
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2">
                      <div className="bg-slate-100 p-1.5 rounded-lg text-slate-400">
                        <User size={12} />
                      </div>
                      <p className="text-[10px] font-bold text-slate-600 uppercase">
                        {/* We use course_lecturer_name if you saved it, or fetch it via relation */}
                        Assignee ID: {course.lecturer_id.split('-')[0]}... 
                      </p>
                    </div>
                  </td>
                  <td className="p-5 text-right">
                    <button 
                      onClick={() => handleDelete(course.id)}
                      disabled={deletingId === course.id}
                      className="text-slate-300 hover:text-red-500 transition-colors p-2"
                    >
                      {deletingId === course.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={18} />}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-10 text-center text-slate-300 text-xs font-bold italic">
                  No courses assigned yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}