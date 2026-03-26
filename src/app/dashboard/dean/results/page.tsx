import Link from 'next/link'
import { ArrowLeft, FileCheck2 } from 'lucide-react'
import DeanResultsOverview from '@/components/dashboard/dean/DeanResultsOverview'
import { getDeanPageData } from '@/lib/dean/getDeanPageData'

export default async function DeanResultsPage() {
  const { facultyLabel, offerings } = await getDeanPageData()

  const hodApprovedCount = offerings.reduce((count, offering) => {
    return (
      count +
      (offering.course_registrations ?? []).filter((registration) => {
        const result = registration.results?.[0]
        return result?.status === 'HOD_APPROVED'
      }).length
    )
  }, 0)

  const deanApprovedCount = offerings.reduce((count, offering) => {
    return (
      count +
      (offering.course_registrations ?? []).filter((registration) => {
        const result = registration.results?.[0]
        return result?.status === 'DEAN_APPROVED'
      }).length
    )
  }, 0)

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <section className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-bmu-blue">
              Dean Results Review
            </p>
            <h1 className="text-2xl font-black text-slate-900 mt-2">
              Faculty Results Supervision
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-2">
              Review HOD-approved rows and complete Dean-level result approval.
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <span className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-black text-slate-700">
              {facultyLabel}
            </span>
            <span className="px-4 py-3 rounded-2xl bg-blue-50 border border-blue-200 text-sm font-black text-blue-700">
              {hodApprovedCount} HOD approved
            </span>
            <span className="px-4 py-3 rounded-2xl bg-green-50 border border-green-200 text-sm font-black text-green-700">
              {deanApprovedCount} Dean approved
            </span>
          </div>
        </div>

        <div className="p-6 flex items-center gap-3">
          <Link
            href="/dashboard/dean"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back to Overview
          </Link>

          <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
            <FileCheck2 size={16} />
            Open any offering below to perform Dean approval or return to HOD.
          </div>
        </div>
      </section>

      <DeanResultsOverview offerings={offerings} />
    </div>
  )
}