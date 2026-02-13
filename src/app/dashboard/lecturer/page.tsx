import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getLecturerCourses } from '@/lib/data/stats'
import StatCard from '@/components/dashboard/StatCard'
import { BookOpen, Users, Clock, ArrowRight } from 'lucide-react'

export default async function LecturerDashboard() {
  const supabase = await createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, department')
    .eq('id', user?.id)
    .single()

  const courses = await getLecturerCourses(user?.id || '')

  return (
    <div className="space-y-8">
      {/* Lecturer Greeting */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Academic Portfolio
        </h1>
        <p className="text-slate-500 font-medium">
          Logged in as <span className="text-bmu-blue font-bold">{profile?.full_name}</span> • {profile?.department}
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Assigned Courses" 
          value={courses.length} 
          icon={BookOpen} 
          trend="Semester 1" 
          color="blue" 
        />
        <StatCard 
          title="Total Students" 
          value="-- " 
          icon={Users} 
          trend="Enrolled" 
          color="maroon" 
        />
        <StatCard 
          title="Next Lecture" 
          value="09:00 AM" 
          icon={Clock} 
          trend="Tomorrow" 
          color="green" 
        />
      </div>

      {/* Course Management Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="text-bmu-blue" size={20} />
          Active Course Modules
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {courses.length > 0 ? courses.map((course) => (
            <div key={course.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-medical flex items-center justify-between group hover:border-bmu-blue/30 transition-all">
              <div>
                <span className="text-[10px] font-black text-bmu-blue bg-bmu-blue/5 px-2 py-1 rounded-md uppercase tracking-widest">
                  {course.course_code}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">{course.course_name}</h3>
                <p className="text-xs text-slate-400 font-medium">{course.semester} Semester • {profile?.department}</p>
              </div>
              <button className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-bmu-blue group-hover:text-white transition-all shadow-sm">
                <ArrowRight size={20} />
              </button>
            </div>
          )) : (
            <div className="col-span-2 py-20 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50">
               <p className="text-slate-400 font-medium italic">No courses currently assigned by the HOD.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}