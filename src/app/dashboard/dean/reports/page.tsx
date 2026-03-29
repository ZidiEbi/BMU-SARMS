import Link from 'next/link'
import { ArrowLeft, Files } from 'lucide-react'
import { getDeanPageData } from '@/lib/dean/getDeanPageData'

export default async function DeanReportsPage() {
  const { facultyLabel, offerings } = await getDeanPageData()

  const rows = offerings.flatMap((offering) =>
    (offering.course_registrations ?? []).map((registration) => ({
      offering,
      registration,
      result: registration.results?.[0] ?? null,
    }))
  )

  const totalOfferings = offerings.length
  const totalRegistrations = rows.length
  const totalSaved = rows.filter((row) => row.result?.id).length
  const totalHodApproved = rows.filter((row) => row.result?.status === 'HOD_APPROVED').length
  const totalDeanApproved = rows.filter((row) => row.result?.status === 'DEAN_APPROVED').length
  const totalDraft = rows.filter((row) => row.result?.status === 'DRAFT').length
  const totalSubmitted = rows.filter((row) => row.result?.status === 'SUBMITTED').length

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <section className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-bmu-blue">
              Dean Reports
            </p>
            <h1 className="text-2xl font-black text-slate-900 mt-2">
              Faculty Workflow Reports
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-2">
              Monitor faculty result progress and readiness across the Dean supervision layer.
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <span className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-black text-slate-700">
              {facultyLabel}
            </span>
            <span className="px-4 py-3 rounded-2xl bg-violet-50 border border-violet-200 text-sm font-black text-violet-700">
              {totalOfferings} offerings
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
            <Files size={16} />
            This is the faculty-level reporting layer ahead of categorization and print output.
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Registrations" value={totalRegistrations} />
        <StatCard label="Saved Rows" value={totalSaved} />
        <StatCard label="Draft Rows" value={totalDraft} />
        <StatCard label="Submitted Rows" value={totalSubmitted} />
        <StatCard label="HOD Approved" value={totalHodApproved} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
        <StatCard label="Dean Approved Rows" value={totalDeanApproved} />
        <StatCard label="Awaiting Dean" value={totalHodApproved} />
      </section>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500 font-black">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
    </div>
  )
}