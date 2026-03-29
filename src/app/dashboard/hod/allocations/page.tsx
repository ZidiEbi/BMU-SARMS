import Link from 'next/link'
import { ArrowLeft, Layers3, UserCheck, UserX, History } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getHODPageData } from '@/lib/hod/getHODPageData'
import HODAllocationsBoard from '@/components/dashboard/hod/HODAllocationsBoard'

type AuditLogRow = {
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

type RecentAllocationActivity = {
  id: string
  created_at: string
  action: string
  note: string | null
  actor_name: string
  course_code: string
  course_title: string
  previous_lecturer_name: string | null
  new_lecturer_name: string | null
}

export default async function HODAllocationsPage() {
  const { isAdmin, departmentLabel, offerings, lecturers, profile } = await getHODPageData()
  const supabase = await createSupabaseServerClient()

  const assignedOfferings = offerings.filter((offering) => Boolean(offering.lecturer_id))
  const unassignedOfferings = offerings.filter((offering) => !offering.lecturer_id)

  const offeringIds = offerings.map((offering) => offering.id)

  let recentActivity: RecentAllocationActivity[] = []

  if (offeringIds.length > 0) {
    const { data: logs, error: logsError } = await supabase
      .from('allocation_audit_logs')
      .select(
        'id, offering_id, previous_lecturer_id, new_lecturer_id, actor_id, actor_role, action, note, created_at'
      )
      .in('offering_id', offeringIds)
      .order('created_at', { ascending: false })
      .limit(20)

    if (logsError) {
      throw new Error(`Failed to load allocation activity: ${logsError.message}`)
    }

    const auditRows = (logs ?? []) as AuditLogRow[]

    const profileIds = Array.from(
      new Set(
        auditRows.flatMap((row) => [
          row.actor_id,
          row.previous_lecturer_id,
          row.new_lecturer_id,
        ]).filter(Boolean)
      )
    ) as string[]

    const offeringIdSet = Array.from(new Set(auditRows.map((row) => row.offering_id)))

    const [{ data: people }, { data: offeringRows }] = await Promise.all([
      profileIds.length > 0
        ? supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', profileIds)
        : Promise.resolve({ data: [] as { id: string; full_name: string | null }[], error: null }),
      offeringIdSet.length > 0
        ? supabase
            .from('course_offerings')
            .select(`
              id,
              courses!course_offerings_course_id_fkey (
                code,
                title
              )
            `)
            .in('id', offeringIdSet)
        : Promise.resolve({ data: [] as any[], error: null }),
    ])

    const personNameById = new Map<string, string>()
    for (const person of people ?? []) {
      personNameById.set(person.id, person.full_name ?? 'Unknown User')
    }

    const offeringCourseById = new Map<string, { code: string; title: string }>()
    for (const offering of offeringRows ?? []) {
      const course = Array.isArray(offering.courses) ? offering.courses[0] : offering.courses
      offeringCourseById.set(offering.id, {
        code: course?.code ?? 'COURSE',
        title: course?.title ?? 'Untitled Course',
      })
    }

    recentActivity = auditRows.map((row) => {
      const course = offeringCourseById.get(row.offering_id)

      return {
        id: row.id,
        created_at: row.created_at,
        action: row.action,
        note: row.note,
        actor_name: personNameById.get(row.actor_id) ?? 'Unknown User',
        course_code: course?.code ?? 'COURSE',
        course_title: course?.title ?? 'Untitled Course',
        previous_lecturer_name: row.previous_lecturer_id
          ? personNameById.get(row.previous_lecturer_id) ?? 'Unknown Lecturer'
          : null,
        new_lecturer_name: row.new_lecturer_id
          ? personNameById.get(row.new_lecturer_id) ?? 'Unknown Lecturer'
          : null,
      }
    })
  }

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
              Allocate quickly, review recent changes, and move through the obvious next staffing actions for this session.
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
            <span className="px-4 py-3 rounded-2xl bg-blue-50 border border-blue-200 text-sm font-black text-blue-700">
              {lecturers.filter((lecturer) => lecturer.is_verified).length} verified lecturers
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

          <Link
            href="/dashboard/hod/offerings"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Layers3 size={16} />
            Review all offerings
          </Link>

          <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
            <History size={16} />
            Recent allocation activity now appears below.
          </div>
        </div>
      </section>

      <HODAllocationsBoard
        assignedOfferings={assignedOfferings}
        unassignedOfferings={unassignedOfferings}
        lecturers={lecturers}
        recentActivity={recentActivity}
        actorName={profile.full_name ?? 'HOD'}
      />
    </div>
  )
}