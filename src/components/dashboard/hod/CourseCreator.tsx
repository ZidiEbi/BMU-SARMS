'use client'

import { createCourseAction } from '@/lib/actions/course-actions'
import { Plus, BookOpenText, Loader2 } from 'lucide-react'
import { useFormStatus } from 'react-dom'

export default function CourseCreator({ department }: { department: string }) {
  return (
    <section className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />

      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-500/20 p-2 rounded-xl">
          <BookOpenText className="text-blue-400" size={20} />
        </div>
        <div>
          <h2 className="text-lg font-black uppercase tracking-tighter italic">
            Course Registry
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Add new curriculum for {department}
          </p>
        </div>
      </div>

      <form action={createCourseAction} className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <input
          name="course_code"
          placeholder="Code (e.g. CSC 101)"
          className="bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 transition-all"
          required
        />

        <input
          name="title"
          placeholder="Course Title"
          className="bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 transition-all md:col-span-2"
          required
        />

        <select
          name="units"
          defaultValue="3"
          className="bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
          required
        >
          <option value="1">1 Unit</option>
          <option value="2">2 Units</option>
          <option value="3">3 Units</option>
          <option value="4">4 Units</option>
          <option value="5">5 Units</option>
          <option value="6">6 Units</option>
        </select>

        <select
          name="level"
          defaultValue="100"
          className="bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
          required
        >
          <option value="100">100 Level</option>
          <option value="200">200 Level</option>
          <option value="300">300 Level</option>
          <option value="400">400 Level</option>
          <option value="500">500 Level</option>
          <option value="600">600 Level</option>
        </select>

        <select
          name="semester"
          defaultValue="First Semester"
          className="bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
          required
        >
          <option value="First Semester">First Semester</option>
          <option value="Second Semester">Second Semester</option>
        </select>

        <input
          name="session"
          placeholder="Session (e.g. 2025/2026)"
          className="bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 transition-all md:col-span-2"
          required
        />

        <div className="md:col-span-2">
          <SubmitButton />
        </div>
      </form>
    </section>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-2xl px-5 py-4 font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
    >
      {pending ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <>
          <Plus size={16} strokeWidth={3} />
          Add Course
        </>
      )}
    </button>
  )
}