'use client'

import Link from 'next/link'
import { BookOpen, ArrowRight } from 'lucide-react'

const mockCourses = [
  {
    id: '1',
    course_id: 'demo-course-1',
    session: '2024/2025',
    semester: 'First',
    units: 3,
    course_code: 'BCH 201',
    course_name: 'Biochemistry I',
  },
  {
    id: '2',
    course_id: 'demo-course-2',
    session: '2024/2025',
    semester: 'First',
    units: 2,
    course_code: 'ANA 101',
    course_name: 'Human Anatomy',
  },
]

export default function LecturerPreview() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Lecturer Dashboard (Preview)</h1>
        <p className="text-slate-500 font-medium">
          Welcome, <span className="text-bmu-blue font-bold">Dr. Demo Lecturer</span>
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="text-bmu-blue" size={20} />
          Assigned Courses
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {mockCourses.map((a) => (
            <Link
              key={a.id}
              href="#"
              className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-medical flex items-center justify-between group hover:border-bmu-blue/30 transition-all"
            >
              <div>
                <span className="text-[10px] font-black text-bmu-blue bg-bmu-blue/5 px-2 py-1 rounded-md uppercase tracking-widest">
                  {a.course_code}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">{a.course_name}</h3>
                <p className="text-xs text-slate-400 font-medium">
                  {a.session} • {a.semester} Semester • {a.units} Unit(s)
                </p>
              </div>

              <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-bmu-blue group-hover:text-white transition-all shadow-sm">
                <ArrowRight size={20} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}