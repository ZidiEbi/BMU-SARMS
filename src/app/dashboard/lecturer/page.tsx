import Link from "next/link"
import { ArrowRight, BookOpen, CheckCircle2, Clock3 } from "lucide-react"
import { getAuthProfileOrRedirect, requireRole, routeGate } from "@/lib/auth/guards"

type Assignment = {
  id: string
  course_id: string
  session: string
  semester: string
  units: number | null
  course_code: string | null
  course_name: string | null
}

export default async function LecturerDashboardPage() {
  const { supabase, user, profile } = await getAuthProfileOrRedirect()
  requireRole(profile, ["lecturer"])
  routeGate(profile)

  const { data: assignments, error } = await supabase
    .from("course_assignments")
    .select("id, course_id, session, semester, units, course_code, course_name")
    .eq("lecturer_id", user.id)
    .order("session", { ascending: false })
    .order("semester", { ascending: false })

  if (error) {
    console.error("Course assignments error:", error.message)
  }

  const list = (assignments ?? []) as Assignment[]

  return (
    <div className="space-y-10">
      <header className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden border-4 border-white shadow-lg bg-white flex items-center justify-center">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="text-slate-400 text-xs font-black">BMU</div>
            )}
          </div>

          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
              Lecturer Workspace
            </h1>
            <p className="text-slate-500 font-medium">
              {profile.title ? `${profile.title} ` : ""}
              {profile.full_name ?? "Lecturer"}
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="px-4 py-3 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span className="text-xs font-bold text-slate-700">Verified</span>
          </div>
          <div className="px-4 py-3 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-2">
            <Clock3 size={18} className="text-bmu-blue" />
            <span className="text-xs font-bold text-slate-700">Results: Draft → Submit</span>
          </div>
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <BookOpen size={20} className="text-bmu-blue" />
          My Courses
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {list.length > 0 ? (
            list.map((a) => (
              <Link
                key={a.id}
                href={`/dashboard/lecturer/courses/${a.course_id}?session=${encodeURIComponent(
                  a.session
                )}&semester=${encodeURIComponent(a.semester)}`}
                className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-medical flex items-center justify-between group hover:border-bmu-blue/30 transition-all"
              >
                <div>
                  <span className="text-[10px] font-black text-bmu-blue bg-bmu-blue/5 px-2 py-1 rounded-md uppercase tracking-widest">
                    {(a.course_code ?? "COURSE").toUpperCase()}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-2">
                    {a.course_name ?? "Untitled Course"}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {a.session} • {a.semester} Semester • {a.units ?? 0} unit(s)
                  </p>
                </div>

                <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-bmu-blue group-hover:text-white transition-all shadow-sm">
                  <ArrowRight size={20} />
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-2 py-20 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50">
              <p className="text-slate-500 font-bold">No courses assigned yet.</p>
              <p className="text-slate-400 font-medium text-sm mt-2">
                Your HOD will assign courses for the active session.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}