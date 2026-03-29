'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileCheck2,
  Files,
  Layers3,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Users,
} from 'lucide-react'
import type { DeanDepartment, DeanOffering } from '@/lib/dean/getDeanPageData'

type Props = {
  facultyLabel: string
  departments: DeanDepartment[]
  offerings: DeanOffering[]
}

type QueueItem = {
  id: string
  label: string
  sublabel: string
  href: string
  badge: string
  tone: 'amber' | 'blue' | 'green' | 'red'
}

export default function DeanWorkspace({
  facultyLabel,
  departments,
  offerings,
}: Props) {
  const metrics = useMemo(() => {
    let registrationCount = 0
    let hodApprovedRows = 0
    let deanApprovedRows = 0
    let submittedRows = 0
    let savedRows = 0

    const uniqueStudents = new Set<string>()

    for (const offering of offerings) {
      for (const registration of offering.course_registrations ?? []) {
        registrationCount += 1
        if (registration.student_id) uniqueStudents.add(registration.student_id)
        if (registration.students?.matric_number) uniqueStudents.add(registration.students.matric_number)

        const result = registration.results?.[0]
        if (!result?.id) continue

        savedRows += 1
        if (result.status === 'SUBMITTED') submittedRows += 1
        if (result.status === 'HOD_APPROVED') hodApprovedRows += 1
        if (result.status === 'DEAN_APPROVED') deanApprovedRows += 1
      }
    }

    const offeringsAwaitingDean = offerings.filter((offering) =>
      (offering.course_registrations ?? []).some(
        (registration) => registration.results?.[0]?.status === 'HOD_APPROVED'
      )
    ).length

    const fullyDeanApprovedOfferings = offerings.filter((offering) => {
      const rows = offering.course_registrations ?? []
      if (rows.length === 0) return false
      return rows.every((registration) => registration.results?.[0]?.status === 'DEAN_APPROVED')
    }).length

    return {
      departments: departments.length,
      offerings: offerings.length,
      students: uniqueStudents.size,
      registrations: registrationCount,
      savedRows,
      submittedRows,
      hodApprovedRows,
      deanApprovedRows,
      offeringsAwaitingDean,
      fullyDeanApprovedOfferings,
    }
  }, [departments, offerings])

  const queue = useMemo<QueueItem[]>(() => {
    const items: QueueItem[] = []

    if (metrics.offeringsAwaitingDean > 0) {
      items.push({
        id: 'awaiting-dean',
        label: 'Offerings awaiting Dean review',
        sublabel: 'These batches have already passed HOD approval and are ready for faculty-level review.',
        href: '/dashboard/dean/results',
        badge: `${metrics.offeringsAwaitingDean}`,
        tone: 'blue',
      })
    }

    if (metrics.submittedRows > 0) {
      items.push({
        id: 'still-with-hod',
        label: 'Rows still below Dean threshold',
        sublabel: 'Some saved rows are still at lower workflow states and have not yet reached Dean review.',
        href: '/dashboard/dean/reports',
        badge: `${metrics.submittedRows}`,
        tone: 'amber',
      })
    }

    if (items.length === 0) {
      items.push({
        id: 'clear',
        label: 'No immediate Dean backlog',
        sublabel: 'There are no faculty batches currently waiting for Dean intervention.',
        href: '/dashboard/dean/reports',
        badge: 'Clear',
        tone: 'green',
      })
    }

    return items
  }, [metrics])

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
                Dean Command Center
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">
                {facultyLabel}
              </h2>
              <p className="mt-2 max-w-3xl text-sm font-medium text-slate-500">
                Faculty-level oversight for departmental offerings, HOD-approved results, Dean review, and categorization readiness.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[420px]">
              <QuickSummaryCard
                label="Departments"
                value={metrics.departments}
                sublabel={`${metrics.offerings} offerings in faculty scope`}
                icon={<Building2 size={18} />}
              />
              <QuickSummaryCard
                label="Dean Queue"
                value={metrics.offeringsAwaitingDean}
                sublabel={`${metrics.fullyDeanApprovedOfferings} fully dean-approved`}
                icon={<ShieldCheck size={18} />}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Students"
            value={metrics.students}
            sublabel="Distinct students visible within this faculty workflow scope"
            icon={<Users size={18} />}
          />
          <MetricCard
            label="Registrations"
            value={metrics.registrations}
            sublabel="Total faculty registration rows"
            icon={<Layers3 size={18} />}
          />
          <MetricCard
            label="HOD Approved"
            value={metrics.hodApprovedRows}
            sublabel="Rows ready for Dean-level review"
            icon={<FileCheck2 size={18} />}
          />
          <MetricCard
            label="Dean Approved"
            value={metrics.deanApprovedRows}
            sublabel="Rows already approved at faculty supervisory stage"
            icon={<CheckCircle2 size={18} />}
          />
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                <ShieldAlert size={18} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Dean Action Queue</h3>
                <p className="text-sm font-medium text-slate-500">
                  Focus first on the batches that need faculty-level attention.
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {queue.map((item) => (
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
            <h3 className="text-lg font-black text-slate-900">Recent Faculty Offerings</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Open the most recent offerings in your faculty to review their HOD-approved batches.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {recentOfferings.length === 0 ? (
              <div className="p-8 text-sm font-semibold text-slate-500">
                No faculty offerings found yet.
              </div>
            ) : (
              recentOfferings.map((offering) => {
                const hodApproved = (offering.course_registrations ?? []).filter(
                  (registration) => registration.results?.[0]?.status === 'HOD_APPROVED'
                ).length

                const deanApproved = (offering.course_registrations ?? []).filter(
                  (registration) => registration.results?.[0]?.status === 'DEAN_APPROVED'
                ).length

                return (
                  <Link
                    key={offering.id}
                    href={`/dashboard/dean/offerings/${offering.id}`}
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
                          {offering.departments?.name ?? 'Department'} • {offering.session} • {offering.semester} • {offering.level} Level
                        </p>
                        <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                          {hodApproved} HOD-approved row(s) • {deanApproved} dean-approved row(s)
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

      <section className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <h3 className="text-lg font-black text-slate-900">Quick Access</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Jump directly into the main Dean work areas.
            </p>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-2">
            <QuickLinkCard
              href="/dashboard/dean/results"
              title="Faculty Results Review"
              description="Inspect HOD-approved rows, faculty readiness, and Dean-level approval workflow."
              icon={<FileCheck2 size={18} />}
            />
            <QuickLinkCard
              href="/dashboard/dean/offerings"
              title="Faculty Offerings"
              description="Browse faculty offerings and open any offering-specific Dean workspace."
              icon={<Layers3 size={18} />}
            />
            <QuickLinkCard
              href="/dashboard/dean/categorization"
              title="Categorization"
              description="Prepare and later edit faculty categorization batches using Dean oversight."
              icon={<ShieldCheck size={18} />}
            />
            <QuickLinkCard
              href="/dashboard/dean/reports"
              title="Faculty Reports"
              description="See approval movement and reporting readiness across the faculty."
              icon={<Files size={18} />}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <h3 className="text-lg font-black text-slate-900">Department Scope</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Departments currently mapped under this faculty.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {departments.length === 0 ? (
              <div className="p-8 text-sm font-semibold text-slate-500">
                No departments found under this faculty.
              </div>
            ) : (
              departments.map((department) => (
                <div key={department.id} className="p-5">
                  <p className="text-sm font-black text-slate-900">{department.name}</p>
                </div>
              ))
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

function queueBadgeClass(tone: 'amber' | 'blue' | 'green' | 'red') {
  switch (tone) {
    case 'amber':
      return 'inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700'
    case 'blue':
      return 'inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700'
    case 'green':
      return 'inline-flex items-center rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-black text-green-700'
    default:
      return 'inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-black text-red-700'
  }
}