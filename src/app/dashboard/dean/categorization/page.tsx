import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getAuthProfileOrRedirect, requireRole } from '@/lib/auth/guards'

export default async function DeanCategorizationPage() {
  const { profile } = await getAuthProfileOrRedirect()
  requireRole(profile, ['dean'])

  const supabase = await createSupabaseServerClient()

  const { data: faculty } = await supabase
    .from('faculties')
    .select('id, name')
    .eq('id', profile.faculty_id)
    .maybeSingle()

  const { data: batches, error } = await supabase
    .from('result_categorization_batches')
    .select(`
      id,
      session,
      semester,
      level,
      status,
      title,
      notes,
      created_at
    `)
    .eq('faculty_id', profile.faculty_id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to load categorization batches: ${error.message}`)
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <section className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-bmu-blue">
              Dean Categorization
            </p>
            <h1 className="text-2xl font-black text-slate-900 mt-2">
              Faculty Categorization Workspace
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-2">
              This is the Dean-side storage and review layer for categorization batches. We will wire the full generation/editor/print pass on top of this foundation next.
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <span className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-black text-slate-700">
              {faculty?.name ?? 'Assigned Faculty'}
            </span>
            <span className="px-4 py-3 rounded-2xl bg-blue-50 border border-blue-200 text-sm font-black text-blue-700">
              {(batches ?? []).length} batch(es)
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
            <ShieldCheck size={16} />
            Categorization storage is now ready for the next generation/edit/print pass.
          </div>
        </div>
      </section>

      <section className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">Existing Batches</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Stored categorization batches under this faculty.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {(batches ?? []).length === 0 ? (
            <div className="p-8 text-sm font-semibold text-slate-500">
              No categorization batches found yet.
            </div>
          ) : (
            batches!.map((batch) => (
              <div key={batch.id} className="p-5">
                <p className="text-sm font-black text-slate-900">
                  {batch.title || `${batch.level} Level • ${batch.session} • ${batch.semester}`}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Status: {batch.status} • Created: {new Date(batch.created_at).toLocaleString()}
                </p>
                {batch.notes ? (
                  <p className="mt-2 text-sm text-slate-600">{batch.notes}</p>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}