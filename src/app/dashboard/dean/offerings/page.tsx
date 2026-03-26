import Link from 'next/link'
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react'
import { getDeanPageData } from '@/lib/dean/getDeanPageData'

export default async function DeanOfferingsPage() {
  const { facultyLabel, offerings } = await getDeanPageData()

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <section className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-bmu-blue">
              Dean Offerings Workspace
            </p>
            <h1 className="text-2xl font-black text-slate-900 mt-2">
              Faculty Offerings
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-2">
              Browse faculty offerings and open Dean review workspaces.
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <span className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-black text-slate-700">
              {facultyLabel}
            </span>
            <span className="px-4 py-3 rounded-2xl bg-blue-50 border border-blue-200 text-sm font-black text-blue-700">
              {offerings.length} offering(s)
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
            <BookOpen size={16} />
            Open any offering below to inspect HOD-approved rows and Dean workflow status.
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {offerings.length > 0 ? (
          offerings.map((offering) => (
            <Link
              key={offering.id}
              href={`/dashboard/dean/offerings/${offering.id}`}
              className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-bmu-blue/30 transition-all"
            >
              <div>
                <span className="text-[10px] font-black text-bmu-blue bg-bmu-blue/5 px-2 py-1 rounded-md uppercase tracking-widest">
                  {(offering.courses?.code ?? 'COURSE').toUpperCase()}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">
                  {offering.courses?.title ?? 'Untitled Course'}
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {offering.session} • {offering.semester} • {offering.courses?.unit ?? 0} unit(s)
                </p>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  {offering.departments?.name ?? 'Department'} • {offering.level} Level
                </p>
              </div>

              <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-bmu-blue group-hover:text-white transition-all shadow-sm">
                <ArrowRight size={20} />
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-2 py-20 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50">
            <p className="text-slate-500 font-bold">No faculty offerings available yet.</p>
            <p className="text-slate-400 font-medium text-sm mt-2">
              Offerings will appear here when departments in your faculty begin result workflow.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}