'use client'

import { Trash2, BookOpen, Hash, GraduationCap } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

export default function CourseList({ courses }: { courses: any[] }) {
  const supabase = createBrowserClient()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    console.log('📋 CourseList mounted on:', pathname)
  }, [pathname])

  const handleDelete = async (id: string) => {
    console.log('🗑️ Attempting to delete course:', id)
    if (!confirm("Remove this course from the registry? This will affect staff assignments.")) return
    
    const { error } = await supabase.from('courses').delete().eq('id', id)
    if (error) {
      console.error('❌ Delete error:', error)
      alert("System Error: " + error.message)
    } else {
      console.log('✅ Course deleted, refreshing...')
      router.refresh()
    }
  }

  if (!courses || courses.length === 0) {
    return (
      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center">
        <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
          <GraduationCap className="text-slate-300" size={24} />
        </div>
        <p className="text-slate-500 font-bold text-sm">No courses registered yet.</p>
        <p className="text-slate-400 text-xs mt-1">Use the registry bar above to add your curriculum.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
             <BookOpen size={16} />
          </div>
          <h3 className="font-black uppercase text-xs tracking-widest text-slate-700">Departmental Curriculum</h3>
        </div>
        <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full uppercase">
          {courses.length} Active Modules
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">
              <th className="px-8 py-5">Code</th>
              <th className="px-8 py-5">Course Title</th>
              <th className="px-8 py-5">Academic Level</th>
              <th className="px-8 py-5">Units</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {courses.map((course) => (
              <tr key={course.id} className="hover:bg-blue-50/20 transition-colors group">
                <td className="px-8 py-4">
                  <span className="font-black text-blue-600 font-mono text-sm tracking-tighter">{course.course_code}</span>
                </td>
                <td className="px-8 py-4 font-bold text-slate-700 text-sm italic">{course.title}</td>
                <td className="px-8 py-4">
                  <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2.5 py-1 rounded-lg border border-slate-200">
                    {course.level} LEVEL
                  </span>
                </td>
                <td className="px-8 py-4">
                  <div className="flex items-center gap-1.5 text-slate-500 font-black text-xs uppercase">
                    <Hash size={14} className="text-blue-400" /> {course.units} Units
                  </div>
                </td>
                <td className="px-8 py-4 text-right">
                  <button 
                    onClick={() => handleDelete(course.id)}
                    className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}