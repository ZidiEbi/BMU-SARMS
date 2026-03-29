import { History, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getHODPageData } from '@/lib/hod/getHODPageData'
import HODHistoryWorkspace, {
  type AllocationHistoryItem,
  type ResultHistoryItem,
} from '@/components/dashboard/hod/HODHistoryWorkspace'

type AllocationAuditRow = {
  id: string
  offering_id: string
  previous_lecturer_id: string | null
  new_lecturer_id: string | null
  actor_id: string
  actor_role: string
  action: string
  note: string | null
  created_at: string
}

type ResultAuditRow = {
  id: string
  result_id: string
  actor_id: string
  actor_role: string
  action: string
  field_changed: string | null
  old_value: string | null
  new_value: string | null
  note: string | null
  created_at: string
}

export default async function HODHistoryPage() {
  const { departmentLabel, offerings } = await getHODPageData()
  const supabase = await createSupabaseServerClient()

  const offeringIds = offerings.map((offering) => offering.id)

  const resultMetaById = new Map<
    string,
    {
      offeringId: string
      courseCode: string
      courseTitle: string
      studentName: string
      matricNumber: string
      currentStatus: string | null
    }
  >()

  for (const offering of offerings) {
    for (const registration of offering.course_registrations ?? []) {
      for (const result of registration.results ?? []) {
        if (!result.id) continue

        resultMetaById.set(result.id, {
          offeringId: offering.id,
          courseCode: offering.courses?.code ?? 'COURSE',
          courseTitle: offering.courses?.title ?? 'Untitled Course',
          studentName: registration.students?.full_name ?? 'Unknown Student',
          matricNumber: registration.students?.matric_number ?? '—',
          currentStatus: result.status ?? null,
        })
      }
    }
  }

  const resultIds = Array.from(resultMetaById.keys())

  let allocationHistory: AllocationHistoryItem[] = []
  let resultHistory: ResultHistoryItem[] = []

  if (offeringIds.length > 0) {
    const [{ data: allocationLogs, error: allocationError }, { data: resultLogs, error: resultError }] =
      await Promise.all([
        supabase
          .from('allocation_audit_logs')
          .select(
            'id, offering_id, previous_lecturer_id, new_lecturer_id, actor_id, actor_role, action, note, created_at'
          )
          .in('offering_id', offeringIds)
          .order('created_at', { ascending: false })
          .limit(100),
        resultIds.length > 0
          ? supabase
              .from('result_audit_logs')
              .select(
                'id, result_id, actor_id, actor_role, action, field_changed, old_value, new_value, note, created_at'
              )
              .in('result_id', resultIds)
              .order('created_at', { ascending: false })
              .limit(200)
          : Promise.resolve({ data: [] as ResultAuditRow[], error: null }),
      ])

    if (allocationError) {
      throw new Error(`Failed to load allocation history: ${allocationError.message}`)
    }

    if (resultError) {
      throw new Error(`Failed to load result workflow history: ${resultError.message}`)
    }

    const allocationRows = (allocationLogs ?? []) as AllocationAuditRow[]
    const resultRows = (resultLogs ?? []) as ResultAuditRow[]

    const peopleIds = Array.from(
      new Set(
        [
          ...allocationRows.flatMap((row) => [
            row.actor_id,
            row.previous_lecturer_id,
            row.new_lecturer_id,
          ]),
          ...resultRows.map((row) => row.actor_id),
        ].filter(Boolean)
      )
    ) as string[]

    const { data: people, error: peopleError } = peopleIds.length
      ? await supabase.from('profiles').select('id, full_name').in('id', peopleIds)
      : { data: [], error: null }

    if (peopleError) {
      throw new Error(`Failed to resolve actor names: ${peopleError.message}`)
    }

    const personNameById = new Map<string, string>()
    for (const person of people ?? []) {
      personNameById.set(person.id, person.full_name ?? 'Unknown User')
    }

    allocationHistory = allocationRows.map((row) => {
      const offering = offerings.find((item) => item.id === row.offering_id)

      return {
        id: row.id,
        createdAt: row.created_at,
        action: row.action,
        note: row.note,
        actorName: personNameById.get(row.actor_id) ?? 'Unknown User',
        actorRole: row.actor_role,
        courseCode: offering?.courses?.code ?? 'COURSE',
        courseTitle: offering?.courses?.title ?? 'Untitled Course',
        level: offering?.level ?? '—',
        semester: offering?.semester ?? '—',
        session: offering?.session ?? '—',
        previousLecturerName: row.previous_lecturer_id
          ? personNameById.get(row.previous_lecturer_id) ?? 'Unknown Lecturer'
          : null,
        newLecturerName: row.new_lecturer_id
          ? personNameById.get(row.new_lecturer_id) ?? 'Unknown Lecturer'
          : null,
      }
    })

    resultHistory = resultRows.map((row) => {
      const meta = resultMetaById.get(row.result_id)
      const previousStatus =
        row.field_changed === 'status' ? row.old_value : null
      const currentStatus =
        row.field_changed === 'status'
          ? row.new_value
          : (meta?.currentStatus ?? null)

      return {
        id: row.id,
        createdAt: row.created_at,
        action: row.action,
        note: row.note,
        actorName: personNameById.get(row.actor_id) ?? 'Unknown User',
        actorRole: row.actor_role,
        previousStatus,
        currentStatus,
        courseCode: meta?.courseCode ?? 'COURSE',
        courseTitle: meta?.courseTitle ?? 'Untitled Course',
        studentName: meta?.studentName ?? 'Unknown Student',
        matricNumber: meta?.matricNumber ?? '—',
      }
    })
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <section className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-bmu-blue">
              HOD Audit & History
            </p>
            <h1 className="text-2xl font-black text-slate-900 mt-2">
              Department History Console
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-2">
              Review allocation history and academic result workflow history from one dedicated place.
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <span className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-black text-slate-700">
              {departmentLabel}
            </span>
            <span className="px-4 py-3 rounded-2xl bg-blue-50 border border-blue-200 text-sm font-black text-blue-700">
              {allocationHistory.length} allocation entries
            </span>
            <span className="px-4 py-3 rounded-2xl bg-green-50 border border-green-200 text-sm font-black text-green-700">
              {resultHistory.length} result history entries
            </span>
          </div>
        </div>

        <div className="p-6 flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/hod"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back to Overview
          </Link>

          <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
            <History size={16} />
            Follow the history trail and act on the next obvious workflow step.
          </div>
        </div>
      </section>

      <HODHistoryWorkspace
        allocationHistory={allocationHistory}
        resultHistory={resultHistory}
      />
    </div>
  )
}