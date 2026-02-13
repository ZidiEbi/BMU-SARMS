import { createSupabaseServerClient } from '@/lib/supabase/server'
import ResultEntry from '@/components/dashboard/lecturer/ResultEntryForm'
import { BookOpen, Users, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default async function CourseDetailPage({ params }: { params: { courseId: string } }) {
  const supabase = await createSupabaseServerClient()

  // 1. Fetch Course Details (Units, Name, Code)
  const { data: course } = await supabase
    .from('course_assignments')
    .select('*')
    .eq('id', params.courseId)
    .single()

  // 2. Fetch Students registered for this specific course
  // In a real app, this would join with a 'registrations' table
  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name, matric_no')
    .eq('role', 'student') 
    // In your case, you'd filter by department/level matching the course

  if (!course) return <p>Course not found</p>

  return (
    <div className="space-y-8">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/lecturer" className="flex items-center gap-2 text-slate-400 hover:text-bmu-blue transition-colors">
          <ChevronLeft size={20} />
          <span className="text-xs font-bold uppercase">Back to Modules</span>
        </Link>
        <div className="text-right">
          <span className="text-[10px] font-black text-bmu-blue bg-bmu-blue/5 px-3 py-1 rounded-full uppercase">
            Active Grading Session
          </span>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {course.course_code}: {course.course_name}
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            {course.semester} Semester · {course.department}
          </p>
        </div>
        <div className="flex gap-4">
          <div className="text-center px-6 py-2 bg-slate-50 rounded-2xl border border-slate-100">
             <p className="text-[10px] font-black text-slate-400 uppercase">Units</p>
             <p className="text-lg font-black text-slate-900">3</p> {/* Example: NSC 302 [cite: 24] */}
          </div>
        </div>
      </div>

      {/* Student List for Result Entry */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-4">
          <Users size={18} className="text-slate-400" />
          <h3 className="font-bold text-slate-700">Enrolled Students</h3>
        </div>

        {students?.map((student) => (
          <ResultEntry 
            key={student.id}
            student={{
              name: student.full_name,
              matricNo: student.matric_no
            }}
            courseCode={course.course_code}
            units={3} // Units used for GPA points calculation [cite: 24]
          />
        ))}
      </div>
    </div>
  )
}