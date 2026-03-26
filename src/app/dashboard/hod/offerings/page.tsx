import Link from 'next/link'
import { ArrowLeft, BookOpen } from 'lucide-react'
import CourseList from '@/components/dashboard/hod/CourseList'
import { getHODPageData } from '@/lib/hod/getHODPageData'

export default async function HODOfferingsPage() {
  const { isAdmin, departmentLabel, offerings } = await getHODPageData()

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {isAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-amber-800 font-medium">
            👑 You are viewing in Admin mode - showing all departments
          </p>
        </div>
      )}

      <section className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-bmu-blue">
              HOD Offerings Workspace
            </p>
            <h1 className="text-2xl font-black text-slate-900 mt-2">
              Department Offerings
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-2">
              Browse departmental offerings and open focused supervisory workspaces.
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <span className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-black text-slate-700">
              {departmentLabel}
            </span>
            <span className="px-4 py-3 rounded-2xl bg-blue-50 border border-blue-200 text-sm font-black text-blue-700">
              {offerings.length} offering(s)
            </span>
          </div>
        </div>

        <div className="p-6 flex items-center gap-3">
          <Link
            href="/dashboard/hod"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back to Overview
          </Link>

          <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
            <BookOpen size={16} />
            Open any offering below to review details, registrations, and results.
          </div>
        </div>
      </section>

      <CourseList offerings={offerings} />
    </div>
  )
}