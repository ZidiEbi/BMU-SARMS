'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  UserCheck,
  UserX,
  Search,
  X,
  Loader2,
  AlertTriangle,
  Briefcase,
  Building2,
  School,
  CheckCircle2,
  ShieldAlert,
  History,
  WandSparkles,
  ArrowRightLeft,
  MousePointerClick,
  Filter,
  CheckSquare,
  Square,
} from 'lucide-react'
import type { HODLecturer, HODOffering } from '@/lib/hod/getHODPageData'
import {
  assignLecturerToOfferingAction,
  bulkAssignLecturerToOfferingsAction,
  unassignLecturerFromOfferingAction,
} from '@/app/dashboard/hod/allocations/actions'

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

type Props = {
  assignedOfferings: HODOffering[]
  unassignedOfferings: HODOffering[]
  lecturers: HODLecturer[]
  recentActivity: RecentAllocationActivity[]
  actorName: string
}

type WorkloadTone = 'green' | 'amber' | 'red'

function hasWorkflowStarted(offering: HODOffering) {
  return (offering.course_registrations ?? []).some((registration) =>
    (registration.results ?? []).some(
      (result) =>
        Boolean(result.id) ||
        Boolean(result.status) ||
        result.ca_score !== null ||
        result.exam_score !== null ||
        result.total_score !== null
    )
  )
}

function getWorkloadTone(count: number): WorkloadTone {
  if (count >= 5) return 'red'
  if (count >= 3) return 'amber'
  return 'green'
}

function getWorkloadLabel(count: number) {
  if (count >= 5) return 'Heavy load'
  if (count >= 3) return 'Moderate load'
  return 'Light load'
}

function workloadToneClasses(tone: WorkloadTone) {
  switch (tone) {
    case 'red':
      return 'bg-red-50 border-red-200 text-red-700'
    case 'amber':
      return 'bg-amber-50 border-amber-200 text-amber-700'
    default:
      return 'bg-green-50 border-green-200 text-green-700'
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

function getSmartHint(params: {
  unassignedCount: number
  selectedCount: number
  levelFilter: string
  semesterFilter: string
}) {
  if (params.selectedCount > 0) {
    return `You have ${params.selectedCount} offering(s) selected. Choose one lecturer below and apply bulk allocation.`
  }

  if (params.levelFilter !== 'all' || params.semesterFilter !== 'all') {
    return 'Your filter is active. Review the visible rows and use bulk allocation to assign them faster.'
  }

  if (params.unassignedCount > 0) {
    return `You still have ${params.unassignedCount} unassigned offering(s). Start with one level or semester to make the work faster.`
  }

  return 'All offerings are currently allocated. Review recent activity or open an offering if you need detail.'
}

export default function HODAllocationsBoard({
  assignedOfferings,
  unassignedOfferings,
  lecturers,
  recentActivity,
  actorName,
}: Props) {
  const [query, setQuery] = useState('')
  const [selectedOffering, setSelectedOffering] = useState<HODOffering | null>(null)
  const [bulkLecturerId, setBulkLecturerId] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [semesterFilter, setSemesterFilter] = useState('all')
  const [offeringSearch, setOfferingSearch] = useState('')
  const [selectedOfferingIds, setSelectedOfferingIds] = useState<string[]>([])
  const [actionError, setActionError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const verifiedLecturers = useMemo(
    () =>
      lecturers.filter(
        (lecturer) =>
          lecturer.is_verified &&
          String(lecturer.role ?? '').trim().toLowerCase() === 'lecturer'
      ),
    [lecturers]
  )

  const lecturerLoadMap = useMemo(() => {
    const bucket = new Map<string, number>()

    for (const offering of assignedOfferings) {
      if (!offering.lecturer_id) continue
      bucket.set(offering.lecturer_id, (bucket.get(offering.lecturer_id) ?? 0) + 1)
    }

    return bucket
  }, [assignedOfferings])

  const enrichedLecturers = useMemo(() => {
    return verifiedLecturers.map((lecturer) => {
      const assignedCount = lecturerLoadMap.get(lecturer.id) ?? 0

      return {
        ...lecturer,
        assignedCount,
        workloadTone: getWorkloadTone(assignedCount),
        workloadLabel: getWorkloadLabel(assignedCount),
      }
    })
  }, [verifiedLecturers, lecturerLoadMap])

  const filteredLecturers = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return enrichedLecturers

    return enrichedLecturers.filter((lecturer) => {
      const name = lecturer.full_name?.toLowerCase() ?? ''
      const staffId = lecturer.staff_id?.toLowerCase() ?? ''
      const dept = lecturer.department_name?.toLowerCase() ?? ''
      const faculty = lecturer.faculty_name?.toLowerCase() ?? ''
      const title = lecturer.title?.toLowerCase() ?? ''

      return (
        name.includes(q) ||
        staffId.includes(q) ||
        dept.includes(q) ||
        faculty.includes(q) ||
        title.includes(q)
      )
    })
  }, [enrichedLecturers, query])

  const levels = useMemo(
    () =>
      Array.from(new Set(unassignedOfferings.map((offering) => offering.level).filter(Boolean))),
    [unassignedOfferings]
  )

  const semesters = useMemo(
    () =>
      Array.from(
        new Set(unassignedOfferings.map((offering) => offering.semester).filter(Boolean))
      ),
    [unassignedOfferings]
  )

  const visibleUnassignedOfferings = useMemo(() => {
    const q = offeringSearch.trim().toLowerCase()

    return unassignedOfferings.filter((offering) => {
      const matchesLevel = levelFilter === 'all' || offering.level === levelFilter
      const matchesSemester =
        semesterFilter === 'all' || offering.semester === semesterFilter

      const code = offering.courses?.code?.toLowerCase() ?? ''
      const title = offering.courses?.title?.toLowerCase() ?? ''
      const session = offering.session?.toLowerCase() ?? ''

      const matchesSearch =
        !q || code.includes(q) || title.includes(q) || session.includes(q)

      return matchesLevel && matchesSemester && matchesSearch
    })
  }, [unassignedOfferings, levelFilter, semesterFilter, offeringSearch])

  const selectedCount = selectedOfferingIds.length

  const smartHint = getSmartHint({
    unassignedCount: unassignedOfferings.length,
    selectedCount,
    levelFilter,
    semesterFilter,
  })

  function resetMessages() {
    setActionError('')
    setActionMessage('')
  }

  function clearSelections() {
    setSelectedOfferingIds([])
    setBulkLecturerId('')
  }

  function toggleOfferingSelection(offeringId: string) {
    resetMessages()

    setSelectedOfferingIds((current) =>
      current.includes(offeringId)
        ? current.filter((id) => id !== offeringId)
        : [...current, offeringId]
    )
  }

  function toggleSelectAllVisible() {
    resetMessages()

    const visibleIds = visibleUnassignedOfferings.map((offering) => offering.id)
    const allVisibleSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) => selectedOfferingIds.includes(id))

    if (allVisibleSelected) {
      setSelectedOfferingIds((current) =>
        current.filter((id) => !visibleIds.includes(id))
      )
      return
    }

    setSelectedOfferingIds((current) =>
      Array.from(new Set([...current, ...visibleIds]))
    )
  }

  function runSingleAssign(lecturerId: string) {
    if (!selectedOffering) return

    resetMessages()

    startTransition(async () => {
      const response = await assignLecturerToOfferingAction({
        offeringId: selectedOffering.id,
        lecturerId,
      })

      if (!response.ok) {
        setActionError(response.message)
        return
      }

      setActionMessage(response.message)
      setSelectedOffering(null)
      setQuery('')
    })
  }

  function runBulkAssign() {
    resetMessages()

    if (!bulkLecturerId) {
      setActionError('Select a lecturer first for bulk allocation.')
      return
    }

    if (selectedOfferingIds.length === 0) {
      setActionError('Select at least one offering for bulk allocation.')
      return
    }

    startTransition(async () => {
      const response = await bulkAssignLecturerToOfferingsAction({
        offeringIds: selectedOfferingIds,
        lecturerId: bulkLecturerId,
      })

      if (!response.ok) {
        setActionError(response.message)
        return
      }

      setActionMessage(response.message)
      clearSelections()
    })
  }

  function runUnassign(offering: HODOffering) {
    resetMessages()

    startTransition(async () => {
      const response = await unassignLecturerFromOfferingAction({
        offeringId: offering.id,
      })

      if (!response.ok) {
        setActionError(response.message)
        return
      }

      setActionMessage(response.message)
    })
  }

  const assignedWithWorkflowStarted = useMemo(
    () => assignedOfferings.filter((offering) => hasWorkflowStarted(offering)).length,
    [assignedOfferings]
  )

  const totalAssignedRegistrations = useMemo(
    () =>
      assignedOfferings.reduce(
        (sum, offering) => sum + (offering.course_registrations?.length ?? 0),
        0
      ),
    [assignedOfferings]
  )

  const nextStepCards = useMemo(() => {
    const cards: Array<{
      id: string
      title: string
      body: string
      cta: string
    }> = []

    if (unassignedOfferings.length > 0) {
      cards.push({
        id: 'bulk',
        title: 'Start with unassigned offerings',
        body: 'Filter by level or semester, tick the visible rows, then bulk-assign one lecturer to all selected offerings.',
        cta: 'Bulk allocate now',
      })
    }

    if (assignedWithWorkflowStarted > 0) {
      cards.push({
        id: 'protected',
        title: 'Protected assignments exist',
        body: 'Some offerings have already started result workflow. Those allocations are locked against casual changes here.',
        cta: 'Review protected rows',
      })
    }

    cards.push({
      id: 'history',
      title: 'Review recent activity',
      body: 'Check what was assigned, reassigned, or removed recently before continuing with the next batch.',
      cta: 'See activity below',
    })

    return cards
  }, [unassignedOfferings.length, assignedWithWorkflowStarted])

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SmartMetricCard
          icon={<UserCheck size={18} />}
          label="Assigned Offerings"
          value={assignedOfferings.length}
          tone="green"
        />
        <SmartMetricCard
          icon={<UserX size={18} />}
          label="Unassigned Offerings"
          value={unassignedOfferings.length}
          tone="amber"
        />
        <SmartMetricCard
          icon={<ShieldAlert size={18} />}
          label="Workflow Protected"
          value={assignedWithWorkflowStarted}
          tone="blue"
        />
        <SmartMetricCard
          icon={<Briefcase size={18} />}
          label="Assigned Registrations"
          value={totalAssignedRegistrations}
          tone="slate"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-blue-100 bg-blue-50 p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-white p-2 text-blue-700 shadow-sm">
              <WandSparkles size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-700">
                Next Best Step
              </p>
              <h2 className="mt-2 text-lg font-black text-slate-900">
                {smartHint}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Designed for faster session-wide allocation work with less clicking and clearer guidance.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          {nextStepCards.map((card) => (
            <div
              key={card.id}
              className="rounded-[1.5rem] border border-slate-100 bg-white p-4 shadow-sm"
            >
              <p className="text-sm font-black text-slate-900">{card.title}</p>
              <p className="mt-1 text-sm text-slate-500">{card.body}</p>
              <p className="mt-3 text-xs font-black uppercase tracking-widest text-bmu-blue">
                {card.cta}
              </p>
            </div>
          ))}
        </div>
      </section>

      {actionError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {actionError}
        </div>
      ) : null}

      {actionMessage ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {actionMessage}
        </div>
      ) : null}

      <section className="rounded-[2.5rem] border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-bmu-blue">
                Bulk Allocation Studio
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">
                Fast Session Allocation Workspace
              </h2>
              <p className="mt-2 text-sm text-slate-500 font-medium max-w-3xl">
                Filter offerings, select many rows, choose one lecturer, and apply bulk allocation in one flow.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                {selectedCount} selected
              </div>
              <button
                type="button"
                onClick={clearSelections}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Clear selection
              </button>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-100 p-6 space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1.2fr_0.5fr_0.6fr_1fr_auto]">
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <Search size={16} />
              <input
                value={offeringSearch}
                onChange={(e) => setOfferingSearch(e.target.value)}
                placeholder="Search offering by course code, title, or session"
                className="w-full bg-transparent outline-none placeholder:text-slate-400"
              />
            </label>

            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              <Filter size={16} />
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="w-full bg-transparent outline-none"
              >
                <option value="all">All levels</option>
                {levels.map((level) => (
                  <option key={level} value={level}>
                    {level} Level
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              <Filter size={16} />
              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="w-full bg-transparent outline-none"
              >
                <option value="all">All semesters</option>
                {semesters.map((semester) => (
                  <option key={semester} value={semester}>
                    {semester}
                  </option>
                ))}
              </select>
            </label>

            <select
              value={bulkLecturerId}
              onChange={(e) => setBulkLecturerId(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
            >
              <option value="">Choose lecturer for selected rows</option>
              {enrichedLecturers.map((lecturer) => (
                <option key={lecturer.id} value={lecturer.id}>
                  {lecturer.full_name} — {lecturer.department_name || 'Dept n/a'} — {lecturer.assignedCount} offering(s)
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={runBulkAssign}
              disabled={isPending || selectedCount === 0 || !bulkLecturerId}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold ${
                isPending || selectedCount === 0 || !bulkLecturerId
                  ? 'cursor-not-allowed bg-slate-200 text-slate-500'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isPending ? <Loader2 size={16} className="animate-spin" /> : <ArrowRightLeft size={16} />}
              Bulk assign
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <button
              type="button"
              onClick={toggleSelectAllVisible}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              {visibleUnassignedOfferings.length > 0 &&
              visibleUnassignedOfferings.every((offering) =>
                selectedOfferingIds.includes(offering.id)
              ) ? (
                <CheckSquare size={16} />
              ) : (
                <Square size={16} />
              )}
              Select all visible
            </button>

            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-slate-600">
              {visibleUnassignedOfferings.length} visible offering(s)
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-slate-600">
              Tip: filter by level first, then bulk assign.
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-6 py-4">Pick</th>
                <th className="px-6 py-4">Course</th>
                <th className="px-6 py-4">Level</th>
                <th className="px-6 py-4">Semester</th>
                <th className="px-6 py-4">Session</th>
                <th className="px-6 py-4">Registrations</th>
                <th className="px-6 py-4">Quick Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50 bg-white">
              {visibleUnassignedOfferings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm font-semibold text-slate-500">
                    No unassigned offerings matched your current filter.
                  </td>
                </tr>
              ) : (
                visibleUnassignedOfferings.map((offering) => {
                  const selected = selectedOfferingIds.includes(offering.id)

                  return (
                    <tr key={offering.id}>
                      <td className="px-6 py-5">
                        <button
                          type="button"
                          onClick={() => toggleOfferingSelection(offering.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        >
                          {selected ? <CheckSquare size={16} /> : <Square size={16} />}
                        </button>
                      </td>

                      <td className="px-6 py-5">
                        <p className="text-sm font-black text-slate-900">
                          {offering.courses?.code ?? 'COURSE'}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {offering.courses?.title ?? 'Untitled Course'}
                        </p>
                      </td>

                      <td className="px-6 py-5 text-sm font-semibold text-slate-700">
                        {offering.level}
                      </td>

                      <td className="px-6 py-5 text-sm font-semibold text-slate-700">
                        {offering.semester}
                      </td>

                      <td className="px-6 py-5 text-sm font-semibold text-slate-700">
                        {offering.session}
                      </td>

                      <td className="px-6 py-5">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {offering.course_registrations?.length ?? 0}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOffering(offering)
                            setQuery('')
                            resetMessages()
                          }}
                          className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          <MousePointerClick size={16} />
                          Assign now
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
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
              assignedOfferings.map((offering) => {
                const workflowStarted = hasWorkflowStarted(offering)

                return (
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
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {(offering.course_registrations?.length ?? 0)} registration(s)
                        </span>
                        {workflowStarted ? (
                          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                            Workflow started
                          </span>
                        ) : (
                          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                            Safe to unassign
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right space-y-3">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-slate-400 font-black">
                          Lecturer
                        </p>
                        <p className="text-sm font-bold text-slate-900 mt-1">
                          {offering.lecturer?.full_name ?? 'Assigned'}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={workflowStarted || isPending}
                        onClick={() => runUnassign(offering)}
                        className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold ${
                          workflowStarted || isPending
                            ? 'cursor-not-allowed bg-slate-200 text-slate-500'
                            : 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                        }`}
                      >
                        {isPending ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Processing
                          </>
                        ) : (
                          <>
                            <X size={16} />
                            Unassign
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-50 text-slate-700">
              <History size={18} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Recent Allocation Activity</h2>
              <p className="text-sm text-slate-500 font-medium">
                This is where you now find allocation audit history for this department.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {recentActivity.length === 0 ? (
              <div className="p-8 text-sm font-semibold text-slate-500">
                No allocation activity has been logged yet.
              </div>
            ) : (
              recentActivity.map((entry) => (
                <div key={entry.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-black text-slate-900">
                        {entry.course_code} — {entry.course_title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {entry.action} • {formatDate(entry.created_at)}
                      </p>
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-700">
                      {entry.actor_name || actorName}
                    </span>
                  </div>

                  <div className="mt-3 text-sm text-slate-600">
                    {entry.previous_lecturer_name || 'Unassigned'} → {entry.new_lecturer_name || 'Unassigned'}
                  </div>

                  {entry.note ? (
                    <p className="mt-2 text-xs text-slate-500">{entry.note}</p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {selectedOffering && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-[2.5rem] bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-bmu-blue">
                  Quick Assign
                </p>
                <h2 className="mt-2 text-xl font-black text-slate-900">
                  Assign Lecturer → {selectedOffering.courses?.code ?? 'Offering'}
                </h2>
                <p className="mt-1 text-sm text-slate-500 font-medium">
                  Choose any verified lecturer. Home department remains unchanged.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {selectedOffering.courses?.title ?? 'Untitled Course'}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {selectedOffering.level} Level
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {selectedOffering.semester}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {selectedOffering.session}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedOffering(null)
                  setQuery('')
                }}
                className="rounded-full border border-slate-200 bg-white p-3 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              >
                <X size={18} />
              </button>
            </div>

            <div className="border-b border-slate-100 p-6">
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <Search size={16} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by lecturer, staff ID, department, or faculty"
                  className="w-full bg-transparent outline-none placeholder:text-slate-400"
                />
              </label>
            </div>

            <div className="max-h-[520px] overflow-y-auto p-6">
              {filteredLecturers.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-sm font-semibold text-slate-500">
                  No verified lecturers matched your search.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredLecturers.map((lecturer) => {
                    const toneClasses = workloadToneClasses(lecturer.workloadTone)

                    return (
                      <div
                        key={lecturer.id}
                        className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-black text-slate-900">
                                {lecturer.title ? `${lecturer.title} ` : ''}
                                {lecturer.full_name ?? 'Unnamed Lecturer'}
                              </p>
                              <p className="mt-1 text-xs font-semibold text-slate-500">
                                Staff ID: {lecturer.staff_id || 'Pending'}
                              </p>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                              <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700">
                                <Building2 size={14} className="mt-0.5 text-slate-500" />
                                <div>
                                  <p className="font-semibold">Home Department</p>
                                  <p>{lecturer.department_name || 'Not available'}</p>
                                </div>
                              </div>

                              <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700">
                                <School size={14} className="mt-0.5 text-slate-500" />
                                <div>
                                  <p className="font-semibold">Faculty</p>
                                  <p>{lecturer.faculty_name || 'Not available'}</p>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneClasses}`}
                              >
                                {lecturer.workloadLabel}: {lecturer.assignedCount} offering(s)
                              </span>

                              {lecturer.assignedCount >= 5 ? (
                                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                                  Review before assigning
                                </span>
                              ) : null}

                              {lecturer.assignedCount === 0 ? (
                                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                                  Fully available
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex flex-col items-start gap-3 lg:items-end">
                            <button
                              type="button"
                              onClick={() => runSingleAssign(lecturer.id)}
                              disabled={isPending}
                              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold ${
                                isPending
                                  ? 'cursor-not-allowed bg-slate-200 text-slate-500'
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                            >
                              {isPending ? (
                                <>
                                  <Loader2 size={16} className="animate-spin" />
                                  Assigning
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 size={16} />
                                  Assign to this offering
                                </>
                              )}
                            </button>

                            <p className="max-w-[220px] text-right text-xs text-slate-500">
                              This action affects only the selected offering and does not alter the lecturer’s home department.
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 p-6">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={16} className="mt-0.5" />
                  <div>
                    <p className="font-black uppercase tracking-wide">Allocation guidance</p>
                    <p className="mt-1">
                      Assign before result work begins whenever possible. Once result workflow starts, reassignment and unassignment are blocked here.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SmartMetricCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: number
  tone: 'green' | 'amber' | 'blue' | 'slate'
}) {
  const toneMap = {
    green: 'border-green-100 bg-green-50 text-green-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    blue: 'border-blue-100 bg-blue-50 text-blue-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
  }

  return (
    <div className={`rounded-[1.5rem] border p-4 ${toneMap[tone]}`}>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/80">
        {icon}
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  )
}