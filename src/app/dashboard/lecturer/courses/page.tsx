import { redirect } from "next/navigation"
import Link from "next/link"
import { BookOpen, ArrowRight } from "lucide-react"
import { requireProfile } from "@/lib/auth/require-profile"
import { getLecturerCourses } from "@/lib/data/lecturer"

export default async function LecturerCoursesPage() {
  const { user, profile, role } = await requireProfile()

  if (profile.is_active === false) redirect("/disabled")
  if (role !== "lecturer") redirect("/pending")
  if (!profile.department_id || !profile.faculty_id) redirect("/pending")
  if (!profile.profile_completed) redirect("/dashboard/lecturer/onboarding")
  if (!profile.is_verified) redirect("/dashboard/lecturer/verification-pending")

  const courses = await getLecturerCourses(user.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">My Courses</h1>
        <p className="text-slate-500 font-medium">Open a course to enter results and manage submissions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {courses.map((c) => (
          <Link
            key={c.id}
            href={`/dashboard/lecturer/courses/${c.id}`}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-bmu-blue/30 transition-all flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="text-bmu-blue" size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest text-bmu-blue">
                  {c.course_code}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-2">{c.course_name}</h3>
              <p className="text-xs text-slate-400 font-medium">{c.semester ?? "—"}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-bmu-blue hover:text-white transition-all">
              <ArrowRight size={18} />
            </div>
          </Link>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50">
          <p className="text-slate-400 font-medium italic">No course assignments yet.</p>
        </div>
      )}
    </div>
  )
}