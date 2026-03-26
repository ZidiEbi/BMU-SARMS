import Link from 'next/link'
import { ArrowLeft, FileCheck2 } from 'lucide-react'
import HODResultsOverview from '@/components/dashboard/hod/HODResultsOverview'
import { getHODPageData } from '@/lib/hod/getHODPageData'

export default async function HODResultsPage() {
  const { isAdmin, departmentLabel, offerings } = await getHODPageData()

  const savedCount = offerings.reduce((count, offering) => {
    return (
      count +
      (offering.course_registrations ?? []).filter((registration) => {
        const result = registration.results?.[0]
        return Boolean(result?.id)
      }).length
    )
  }, 0)

  const submittedCount = offerings.reduce((count, offering) => {
    return (
      count +
      (offering.course_registrations ?? []).filter((registration) => {
        const result = registration.results?.[0]
        return result?.status === 'SUBMITTED'
      }).length
    )
  }, 0)

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
              HOD Results Review
            </p>
            <h1 className="text-2xl font-black text-slate-900 mt-2">
              Results Supervision
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-2">
              Review saved, submitted, and approved results across departmental offerings.
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <span className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-black text-slate-700">
              {departmentLabel}
            </span>
            <span className="px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm font-black text-emerald-700">
              {savedCount} saved
            </span>
            <span className="px-4 py-3 rounded-2xl bg-blue-50 border border-blue-200 text-sm font-black text-blue-700">
              {submittedCount} submitted
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
            <FileCheck2 size={16} />
            Focus here on saved rows, workflow status, and approval readiness.
          </div>
        </div>
      </section>

      <HODResultsOverview offerings={offerings} />
    </div>
  )
}