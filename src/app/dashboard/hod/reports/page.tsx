import Link from 'next/link'
import { ArrowLeft, Files } from 'lucide-react'
import { getHODPageData } from '@/lib/hod/getHODPageData'

export default async function HODReportsPage() {
  const { isAdmin, departmentLabel, offerings } = await getHODPageData()

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
  const totalSubmitted = rows.filter((row) => row.result?.status === 'SUBMITTED').length
  const totalApproved = rows.filter((row) => row.result?.status === 'HOD_APPROVED').length
  const totalDraft = rows.filter((row) => row.result?.status === 'DRAFT').length
  const totalNotSaved = rows.filter((row) => !row.result?.id).length

  const byLevel = Array.from(
    offerings.reduce((map, offering) => {
      const key = String(offering.level || 'Unknown')
      const current = map.get(key) ?? {
        level: key,
        offerings: 0,
        registrations: 0,
        saved: 0,
        submitted: 0,
        approved: 0,
      }

      const offeringRows = (offering.course_registrations ?? []).map((registration) => registration.results?.[0] ?? null)

      current.offerings += 1
      current.registrations += offering.course_registrations?.length ?? 0
      current.saved += offeringRows.filter((result) => Boolean(result?.id)).length
      current.submitted += offeringRows.filter((result) => result?.status === 'SUBMITTED').length
      current.approved += offeringRows.filter((result) => result?.status === 'HOD_APPROVED').length

      map.set(key, current)
      return map
    }, new Map<string, {
      level: string;
      offerings: number
      registrations: number
      saved: number
      submitted: number
      approved: number
    }>())
  ).map(([_, data]) => data).sort((a, b) => Number(a.level) - Number(b.level))

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
              HOD Reports
            </p>
            <h1 className="text-2xl font-black text-slate-900 mt-2">
              Department Readiness Reports
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-2">
              Monitor approval progress and departmental academic readiness by level.
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <span className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-black text-slate-700">
              {departmentLabel}
            </span>
            <span className="px-4 py-3 rounded-2xl bg-violet-50 border border-violet-200 text-sm font-black text-violet-700">
              {totalOfferings} offerings
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
            <Files size={16} />
            This is the early reporting layer for departmental progress and dean handoff readiness.
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Registrations" value={totalRegistrations} />
        <StatCard label="Saved Rows" value={totalSaved} />
        <StatCard label="Draft Rows" value={totalDraft} />
        <StatCard label="Submitted Rows" value={totalSubmitted} />
        <StatCard label="Approved Rows" value={totalApproved} />
      </section>

      <section className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">Readiness by Level</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Compare offering volume and results progression across levels.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-6 py-4">Level</th>
                <th className="px-6 py-4">Offerings</th>
                <th className="px-6 py-4">Registrations</th>
                <th className="px-6 py-4">Saved</th>
                <th className="px-6 py-4">Submitted</th>
                <th className="px-6 py-4">Approved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {byLevel.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm font-semibold text-slate-500">
                    No reportable departmental data found yet.
                  </td>
                </tr>
              ) : (
                byLevel.map((row) => (
                  <tr key={row.level}>
                    <td className="px-6 py-4 font-black text-slate-900">{row.level} Level</td>
                    <td className="px-6 py-4 text-slate-700 font-semibold">{row.offerings}</td>
                    <td className="px-6 py-4 text-slate-700 font-semibold">{row.registrations}</td>
                    <td className="px-6 py-4 text-emerald-700 font-bold">{row.saved}</td>
                    <td className="px-6 py-4 text-blue-700 font-bold">{row.submitted}</td>
                    <td className="px-6 py-4 text-green-700 font-bold">{row.approved}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm p-6">
        <h2 className="text-lg font-black text-slate-900">Attention Snapshot</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">
              Waiting for Lecturer Submission
            </p>
            <p className="mt-2 text-3xl font-black text-amber-900">
              {totalSaved - totalSubmitted}
            </p>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-700">
              Not Yet Saved
            </p>
            <p className="mt-2 text-3xl font-black text-red-900">
              {totalNotSaved}
            </p>
          </div>
        </div>
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