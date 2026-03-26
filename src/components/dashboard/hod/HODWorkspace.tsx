'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Files,
  Layers3,
  ShieldAlert,
  UserCheck,
  Users,
  AlertTriangle,
  GraduationCap,
} from 'lucide-react'

type Lecturer = {
  id: string
  full_name: string | null
  staff_id: string | null
  role?: string | null
  is_verified: boolean | null
  title?: string | null
  avatar_url?: string | null
  department_id?: string | null
  faculty_id?: string | null
  requested_department_id?: string | null
}

type ResultItem = {
  id?: string
  ca_score: number | null
  exam_score: number | null
  total_score: number | null
  grade: string | null
  remark_code: string | null
  status: 'DRAFT' | 'SUBMITTED' | 'HOD_APPROVED' | 'DEAN_APPROVED' | 'LOCKED' | null
  updated_at?: string | null
}

type RegistrationItem = {
  id: string
  registration_status?: string | null
  student_id?: string | null
  students?: {
    matric_number: string
    full_name: string
  } | null
  results?: ResultItem[] | null
}

type Offering = {
  id: string
  level: string
  semester: string
  session: string
  status: string
  lecturer_id: string | null
  created_at?: string
  course_id: string
  department_id: string
  courses: {
    id: string
    code: string
    title: string
    unit: number
  } | null
  lecturer?: {
    id: string
    full_name: string | null
    staff_id: string | null
  } | null
  course_registrations?: RegistrationItem[] | null
}

type Props = {
  departmentLabel: string
  lecturers: Lecturer[]
  offerings: Offering[]
}

type QueueItem = {
  id: string
  label: string
  sublabel: string
  href: string
  badge: string
  tone: 'amber' | 'blue' | 'green' | 'red' | 'slate'
}

export default function HODWorkspace({
  departmentLabel,
  lecturers,
  offerings,
}: Props) {
  const metrics = useMemo(() => {
    const uniqueStudentKeys = new Set<string>()
    let registrationCount = 0
    let savedResultsCount = 0
    let submittedResultsCount = 0
    let approvedResultsCount = 0
    let deanApprovedResultsCount = 0
    let lockedResultsCount = 0
    let draftResultsCount = 0
    let flaggedRowsCount = 0

    for (const offering of offerings) {
      for (const registration of offering.course_registrations ?? []) {
        registrationCount += 1

        const studentKey =
          registration.student_id ||
          registration.students?.matric_number ||
          ''

        if (studentKey) {
          uniqueStudentKeys.add(studentKey)
        }

        const result = registration.results?.[0]
        if (!result?.id) continue

        savedResultsCount += 1

        if (result.status === 'DRAFT') draftResultsCount += 1
        if (result.status === 'SUBMITTED') submittedResultsCount += 1
        if (result.status === 'HOD_APPROVED') approvedResultsCount += 1
        if (result.status === 'DEAN_APPROVED') deanApprovedResultsCount += 1
        if (result.status === 'LOCKED') lockedResultsCount += 1

        const ca = result.ca_score
        const exam = result.exam_score
        const total = result.total_score
        const grade = result.grade?.trim() ?? ''

        const invalid =
          ca === null ||
          exam === null ||
          total === null ||
          !grade ||
          ca < 0 ||
          ca > 40 ||
          exam < 0 ||
          exam > 60 ||
          total < 0 ||
          total > 100 ||
          ca + exam !== total

        if (invalid) flaggedRowsCount += 1
      }
    }

    const pendingVerifications = lecturers.filter((lecturer) => !lecturer.is_verified).length
    const verifiedLecturers = lecturers.filter((lecturer) => lecturer.is_verified).length
    const unassignedOfferings = offerings.filter((offering) => !offering.lecturer_id).length
    const assignedOfferings = offerings.filter((offering) => Boolean(offering.lecturer_id)).length
    const unpublishedOfferings = offerings.filter(
      (offering) => String(offering.status || '').toLowerCase() !== 'published'
    ).length
    const publishedOfferings = offerings.length - unpublishedOfferings
    const pendingApprovalOfferings = offerings.filter((offering) =>
      (offering.course_registrations ?? []).some(
        (registration) => registration.results?.[0]?.status === 'SUBMITTED'
      )
    ).length

    return {
      totalOfferings: offerings.length,
      uniqueStudentCount: uniqueStudentKeys.size,
      registrationCount,
      savedResultsCount,
      submittedResultsCount,
      approvedResultsCount,
      deanApprovedResultsCount,
      lockedResultsCount,
      draftResultsCount,
      flaggedRowsCount,
      pendingVerifications,
      verifiedLecturers,
      unassignedOfferings,
      assignedOfferings,
      unpublishedOfferings,
      publishedOfferings,
      pendingApprovalOfferings,
    }
  }, [lecturers, offerings])

  const priorityQueues = useMemo<QueueItem[]>(() => {
    const queues: QueueItem[] = []

    if (metrics.pendingVerifications > 0) {
      queues.push({
        id: 'verifications',
        label: 'Pending staff verifications',
        sublabel: 'Lecturers still waiting for departmental confirmation.',
        href: '/dashboard/hod/verifications',
        badge: `${metrics.pendingVerifications}`,
        tone: 'amber',
      })
    }

    if (metrics.unassignedOfferings > 0) {
      queues.push({
        id: 'allocations',
        label: 'Unassigned offerings',
        sublabel: 'Offerings without lecturer ownership need allocation attention.',
        href: '/dashboard/hod/allocations',
        badge: `${metrics.unassignedOfferings}`,
        tone: 'red',
      })
    }

    if (metrics.pendingApprovalOfferings > 0) {
      queues.push({
        id: 'approvals',
        label: 'Offerings awaiting HOD review',
        sublabel: 'Submitted rows are ready for supervisory inspection.',
        href: '/dashboard/hod/results',
        badge: `${metrics.pendingApprovalOfferings}`,
        tone: 'blue',
      })
    }

    if (metrics.flaggedRowsCount > 0) {
      queues.push({
        id: 'flags',
        label: 'Flagged result rows',
        sublabel: 'Some saved rows still contain invalid or incomplete data.',
        href: '/dashboard/hod/results',
        badge: `${metrics.flaggedRowsCount}`,
        tone: 'amber',
      })
    }

    if (queues.length === 0) {
      queues.push({
        id: 'clear',
        label: 'No urgent departmental blockers',
        sublabel: 'Your current HOD workspace has no immediate verification, allocation, or approval backlog.',
        href: '/dashboard/hod/reports',
        badge: 'Clear',
        tone: 'green',
      })
    }

    return queues
  }, [
    metrics.flaggedRowsCount,
    metrics.pendingApprovalOfferings,
    metrics.pendingVerifications,
    metrics.unassignedOfferings,
  ])

  const recentOfferings = useMemo(() => {
    return [...offerings]
      .sort((a, b) => {
        const da = a.created_at ? new Date(a.created_at).getTime() : 0
        const db = b.created_at ? new Date(b.created_at).getTime() : 0
        return db - da
      })
      .slice(0, 6)
  }, [offerings])

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-bmu-blue">
                HOD Command Center
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">
                {departmentLabel}
              </h2>
              <p className="mt-2 max-w-3xl text-sm font-medium text-slate-500">
                This overview is your supervisory control layer for staff readiness,
                offering operations, result workflow movement, and departmental academic progress.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[420px]">
              <QuickSummaryCard
                label="Lecturers"
                value={metrics.verifiedLecturers}
                sublabel={`${metrics.pendingVerifications} pending verification`}
                icon={<Users size={18} />}
              />
              <QuickSummaryCard
                label="Offerings"
                value={metrics.totalOfferings}
                sublabel={`${metrics.unassignedOfferings} unassigned`}
                icon={<BookOpen size={18} />}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Students"
            value={metrics.uniqueStudentCount}
            sublabel="Distinct students in current departmental registration footprint"
            icon={<GraduationCap size={18} />}
          />
          <MetricCard
            label="Registrations"
            value={metrics.registrationCount}
            sublabel="Total student-offering registration rows"
            icon={<Layers3 size={18} />}
          />
          <MetricCard
            label="Saved Results"
            value={metrics.savedResultsCount}
            sublabel={`${metrics.draftResultsCount} draft • ${metrics.submittedResultsCount} submitted`}
            icon={<FileCheck2 size={18} />}
          />
          <MetricCard
            label="Approved Rows"
            value={metrics.approvedResultsCount}
            sublabel={`${metrics.deanApprovedResultsCount} dean approved • ${metrics.lockedResultsCount} locked`}
            icon={<CheckCircle2 size={18} />}
          />
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                <ShieldAlert size={18} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Priority Queue</h3>
                <p className="text-sm font-medium text-slate-500">
                  Start here when deciding what needs immediate HOD attention.
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {priorityQueues.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="block p-5 transition hover:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={queueBadgeClass(item.tone)}>{item.badge}</span>
                      <p className="text-sm font-black text-slate-900">{item.label}</p>
                    </div>
                    <p className="text-sm font-medium leading-6 text-slate-500">
                      {item.sublabel}
                    </p>
                  </div>

                  <div className="mt-1 text-slate-400">
                    <ArrowRight size={18} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                <Clock3 size={18} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Operational Snapshot</h3>
                <p className="text-sm font-medium text-slate-500">
                  Current departmental movement across offerings, staffing, and result workflow.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-2">
            <OperationalCard
              label="Published Offerings"
              value={metrics.publishedOfferings}
              sublabel={`${metrics.unpublishedOfferings} still not published`}
              tone="blue"
            />
            <OperationalCard
              label="Assigned Offerings"
              value={metrics.assignedOfferings}
              sublabel={`${metrics.unassignedOfferings} still need lecturers`}
              tone="green"
            />
            <OperationalCard
              label="Pending HOD Review"
              value={metrics.pendingApprovalOfferings}
              sublabel="Offerings with submitted rows awaiting supervisory action"
              tone="amber"
            />
            <OperationalCard
              label="Flagged Result Rows"
              value={metrics.flaggedRowsCount}
              sublabel="Saved rows that still have incomplete or inconsistent data"
              tone="red"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <h3 className="text-lg font-black text-slate-900">Quick Access</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Jump straight into the major HOD work areas without relying only on the sidebar.
            </p>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-2">
            <QuickLinkCard
              href="/dashboard/hod/verifications"
              title="Staff & Verifications"
              description="Confirm lecturer identity, resolve join requests, and maintain department ownership."
              icon={<Users size={18} />}
            />
            <QuickLinkCard
              href="/dashboard/hod/offerings"
              title="Offering Operations"
              description="Browse offerings, inspect departmental structure, and open focused workspaces."
              icon={<BookOpen size={18} />}
            />
            <QuickLinkCard
              href="/dashboard/hod/results"
              title="Results Review"
              description="Review saved rows, submitted rows, and approval readiness across offerings."
              icon={<FileCheck2 size={18} />}
            />
            <QuickLinkCard
              href="/dashboard/hod/reports"
              title="Reports"
              description="Track readiness trends, academic movement, and departmental performance signals."
              icon={<Files size={18} />}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <h3 className="text-lg font-black text-slate-900">Recent Offerings</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Quickly reopen the most recent offerings in your departmental workspace.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {recentOfferings.length === 0 ? (
              <div className="p-8 text-sm font-semibold text-slate-500">
                No departmental offerings found yet.
              </div>
            ) : (
              recentOfferings.map((offering) => {
                const registrationCount = offering.course_registrations?.length ?? 0
                const submittedCount = (offering.course_registrations ?? []).filter(
                  (registration) => registration.results?.[0]?.status === 'SUBMITTED'
                ).length

                return (
                  <Link
                    key={offering.id}
                    href={`/dashboard/hod/offerings/${offering.id}`}
                    className="block p-5 transition hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {offering.courses?.code ?? 'COURSE'}
                        </p>
                        <h4 className="mt-1 text-base font-black text-slate-900">
                          {offering.courses?.title ?? 'Untitled Course'}
                        </h4>
                        <p className="mt-1 text-sm font-medium text-slate-500">
                          {offering.session} • {offering.semester} • {offering.level} Level
                        </p>
                        <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                          {registrationCount} registration(s) • {submittedCount} submitted row(s)
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                        Open
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function MetricCard({
  label,
  value,
  sublabel,
  icon,
}: {
  label: string
  value: number
  sublabel: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
        {icon}
      </div>
      <p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
        {sublabel}
      </p>
    </div>
  )
}

function QuickSummaryCard({
  label,
  value,
  sublabel,
  icon,
}: {
  label: string
  value: number
  sublabel: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{sublabel}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
          {icon}
        </div>
      </div>
    </div>
  )
}

function OperationalCard({
  label,
  value,
  sublabel,
  tone,
}: {
  label: string
  value: number
  sublabel: string
  tone: 'blue' | 'green' | 'amber' | 'red'
}) {
  const toneClass =
    tone === 'blue'
      ? 'border-blue-200 bg-blue-50 text-blue-800'
      : tone === 'green'
      ? 'border-green-200 bg-green-50 text-green-800'
      : tone === 'amber'
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : 'border-red-200 bg-red-50 text-red-800'

  return (
    <div className={`rounded-[1.75rem] border p-5 ${toneClass}`}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-80">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black">{value}</p>
      <p className="mt-2 text-sm font-medium leading-6 opacity-90">
        {sublabel}
      </p>
    </div>
  )
}

function QuickLinkCard({
  href,
  title,
  description,
  icon,
}: {
  href: string
  title: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="group rounded-[2rem] border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
        {icon}
      </div>
      <h4 className="mt-4 text-base font-black text-slate-900">{title}</h4>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
        {description}
      </p>
      <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
        Open workspace
        <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}

function queueBadgeClass(tone: 'amber' | 'blue' | 'green' | 'red' | 'slate') {
  switch (tone) {
    case 'amber':
      return 'inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700'
    case 'blue':
      return 'inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700'
    case 'green':
      return 'inline-flex items-center rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-black text-green-700'
    case 'red':
      return 'inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-black text-red-700'
    default:
      return 'inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700'
  }
}