import Link from 'next/link'
import { ArrowLeft, Layers3, UserCheck, UserX } from 'lucide-react'
import { getHODPageData } from '@/lib/hod/getHODPageData'

export default async function HODAllocationsPage() {
  const { isAdmin, departmentLabel, offerings } = await getHODPageData()

  const assignedOfferings = offerings.filter((offering) => Boolean(offering.lecturer_id))
  const unassignedOfferings = offerings.filter((offering) => !offering.lecturer_id)

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
              HOD Allocation Control
            </p>
            <h1 className="text-2xl font-black text-slate-900 mt-2">
              Lecturer Allocations
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-2">
              See which offerings already have lecturers and which still need assignment attention.
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <span className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-black text-slate-700">
              {departmentLabel}
            </span>
            <span className="px-4 py-3 rounded-2xl bg-green-50 border border-green-200 text-sm font-black text-green-700">
              {assignedOfferings.length} assigned
            </span>
            <span className="px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200 text-sm font-black text-amber-700">
              {unassignedOfferings.length} unassigned
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
            <Layers3 size={16} />
            Use this page to spot staffing gaps before publication and result entry.
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-green-50 text-green-700">
              <UserCheck size={18} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Assigned Offerings</h2>
              <p className="text-sm text-slate-500 font-medium">
                Offerings that already have lecturer ownership.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {assignedOfferings.length === 0 ? (
              <div className="p-8 text-sm font-semibold text-slate-500">
                No assigned offerings found.
              </div>
            ) : (
              assignedOfferings.map((offering) => (
                <div key={offering.id} className="p-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {offering.courses?.code ?? 'COURSE'}
                    </p>
                    <h3 className="text-base font-black text-slate-900 mt-1">
                      {offering.courses?.title ?? 'Untitled Course'}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium mt-1">
                      {offering.session} • {offering.semester} • {offering.level} Level
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs uppercase tracking-widest text-slate-400 font-black">
                      Lecturer
                    </p>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      {offering.lecturer?.full_name ?? 'Assigned'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <UserX size={18} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Unassigned Offerings</h2>
              <p className="text-sm text-slate-500 font-medium">
                These offerings still need lecturer allocation.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {unassignedOfferings.length === 0 ? (
              <div className="p-8 text-sm font-semibold text-slate-500">
                No unassigned offerings found.
              </div>
            ) : (
              unassignedOfferings.map((offering) => (
                <div key={offering.id} className="p-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {offering.courses?.code ?? 'COURSE'}
                    </p>
                    <h3 className="text-base font-black text-slate-900 mt-1">
                      {offering.courses?.title ?? 'Untitled Course'}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium mt-1">
                      {offering.session} • {offering.semester} • {offering.level} Level
                    </p>
                  </div>

                  <Link
                    href={`/dashboard/hod/offerings/${offering.id}`}
                    className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Open
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  )
}