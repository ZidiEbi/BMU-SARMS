'use client'

import { useState } from 'react'
import { X, BookPlus, Loader2, CheckCircle2 } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AssignmentModal({ lecturer, availableCourses, currentAssignments, onClose }: any) {
  const supabase = createSupabaseBrowserClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Get IDs of courses already assigned to THIS lecturer
  const assignedCourseIds = currentAssignments
    .filter((a: any) => a.lecturer_id === lecturer.id)
    .map((a: any) => a.course_id)

  const toggleAssignment = async (courseId: string, isAssigned: boolean) => {
    setLoading(true)
    if (isAssigned) {
      // Remove Assignment
      await supabase.from('course_assignments').delete().eq('lecturer_id', lecturer.id).eq('course_id', courseId)
    } else {
      // Add Assignment
      await supabase.from('course_assignments').insert({ lecturer_id: lecturer.id, course_id: courseId })
    }
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase italic">Assign Courses</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Target: {lecturer.full_name}</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl text-slate-400 hover:text-red-500 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
          {availableCourses.map((course: any) => {
            const isAssigned = assignedCourseIds.includes(course.id)
            return (
              <div key={course.id} className={`p-5 rounded-[2rem] border-2 transition-all flex items-center justify-between ${isAssigned ? 'border-blue-600 bg-blue-50/30' : 'border-slate-50 bg-white'}`}>
                <div>
                  <p className="font-black text-slate-900 text-sm uppercase">{course.course_code}: {course.title}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{course.units} Units • Year {course.level}</p>
                </div>
                <button 
                  disabled={loading}
                  onClick={() => toggleAssignment(course.id, isAssigned)}
                  className={`p-3 rounded-2xl transition-all ${isAssigned ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-blue-600 hover:text-white'}`}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : isAssigned ? <CheckCircle2 size={18} /> : <BookPlus size={18} />}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}