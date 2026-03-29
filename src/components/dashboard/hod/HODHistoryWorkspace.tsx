'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRightLeft,
  ClipboardList,
  History,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  FileCheck2,
  Users,
} from 'lucide-react'

export type AllocationHistoryItem = {
  id: string
  createdAt: string
  action: string
  note: string | null
  actorName: string
  actorRole: string
  courseCode: string
  courseTitle: string
  level: string
  semester: string
  session: string
  previousLecturerName: string | null
  newLecturerName: string | null
}

export type ResultHistoryItem = {
  id: string
  createdAt: string
  action: string
  note: string | null
  actorName: string
  actorRole: string
  previousStatus: string | null
  currentStatus: string | null
  courseCode: string
  courseTitle: string
  studentName: string
  matricNumber: string
}

type Props = {
  allocationHistory: AllocationHistoryItem[]
  resultHistory: ResultHistoryItem[]
}

type TabKey = 'allocation' | 'results'

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

function niceActionLabel(action: string) {
  return action
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function statusTone(status: string | null) {
  const normalized = String(status ?? '').toUpperCase()

  if (normalized === 'DEAN_APPROVED' || normalized === 'LOCKED') {
    return 'bg-green-50 text-green-700 border-green-200'
  }

  if (normalized === 'HOD_APPROVED') {
    return 'bg-blue-50 text-blue-700 border-blue-200'
  }

  if (normalized === 'SUBMITTED') {
    return 'bg-amber-50 text-amber-700 border-amber-200'
  }

  if (normalized === 'DRAFT') {
    return 'bg-slate-100 text-slate-700 border-slate-200'
  }

  return 'bg-slate-100 text-slate-700 border-slate-200'
}

export default function HODHistoryWorkspace({
  allocationHistory,
  resultHistory,
}: Props) {
  const [tab, setTab] = useState<TabKey>('allocation')
  const [query, setQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('all')

  const allocationActions = useMemo(
    () => Array.from(new Set(allocationHistory.map((item) => item.action))),
    [allocationHistory]
  )

  const resultActions = useMemo(
    () => Array.from(new Set(resultHistory.map((item) => item.action))),
    [resultHistory]
  )

  const visibleAllocationHistory = useMemo(() => {
    const q = query.trim().toLowerCase()

    return allocationHistory.filter((item) => {
      const matchesAction = actionFilter === 'all' || item.action === actionFilter
      const haystack = [
        item.courseCode,
        item.courseTitle,
        item.actorName,
        item.previousLecturerName,
        item.newLecturerName,
        item.note,
        item.level,
        item.semester,
        item.session,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesQuery = !q || haystack.includes(q)

      return matchesAction && matchesQuery
    })
  }, [allocationHistory, query, actionFilter])

  const visibleResultHistory = useMemo(() => {
    const q = query.trim().toLowerCase()

    return resultHistory.filter((item) => {
      const matchesAction = actionFilter === 'all' || item.action === actionFilter
      const haystack = [
        item.courseCode,
        item.courseTitle,
        item.studentName,
        item.matricNumber,
        item.actorName,
        item.note,
        item.previousStatus,
        item.currentStatus,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesQuery = !q || haystack.includes(q)

      return matchesAction && matchesQuery
    })
  }, [resultHistory, query, actionFilter])

  const currentActions = tab === 'allocation' ? allocationActions : resultActions

  const nextStepText =
    tab === 'allocation'
      ? 'Check recent allocation changes, then go to Allocations if you need to continue assigning or reassigning lecturers.'
      : 'Check the workflow trail, then go to Offerings or Results if you need to follow up on a submitted or approved batch.'

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<ArrowRightLeft size={18} />}
          label="Allocation History"
          value={allocationHistory.length}
          tone="blue"
        />
        <MetricCard
          icon={<ClipboardList size={18} />}
          label="Result Workflow History"
          value={resultHistory.length}
          tone="green"
        />
        <MetricCard
          icon={<Users size={18} />}
          label="Unique Allocation Actors"
          value={new Set(allocationHistory.map((item) => item.actorName)).size}
          tone="amber"
        />
        <MetricCard
          icon={<FileCheck2 size={18} />}
          label="Unique Result Actors"
          value={new Set(resultHistory.map((item) => item.actorName)).size}
          tone="slate"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-blue-100 bg-blue-50 p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-white p-2 text-blue-700 shadow-sm">
              <History size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-700">
                Smart Hint
              </p>
              <h2 className="mt-2 text-lg font-black text-slate-900">
                {nextStepText}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                This page is designed to help users understand what happened, who did it, and where to go next.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          <Link
            href="/dashboard/hod/allocations"
            className="rounded-[1.5rem] border border-slate-100 bg-white p-4 shadow-sm hover:bg-slate-50"
          >
            <p className="text-sm font-black text-slate-900">Continue allocation work</p>
            <p className="mt-1 text-sm text-slate-500">
              Go to Allocations for lecturer assignment, reassignment, and bulk allocation.
            </p>
          </Link>

          <Link
            href="/dashboard/hod/offerings"
            className="rounded-[1.5rem] border border-slate-100 bg-white p-4 shadow-sm hover:bg-slate-50"
          >
            <p className="text-sm font-black text-slate-900">Open offerings workspace</p>
            <p className="mt-1 text-sm text-slate-500">
              Review offering-level details and move through the next academic workflow step.
            </p>
          </Link>
        </div>
      </section>

      <section className="rounded-[2.5rem] border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setTab('allocation')
                  setActionFilter('all')
                }}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                  tab === 'allocation'
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Allocation History
              </button>

              <button
                type="button"
                onClick={() => {
                  setTab('results')
                  setActionFilter('all')
                }}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                  tab === 'results'
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Result Workflow History
              </button>
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              Showing {tab === 'allocation' ? visibleAllocationHistory.length : visibleResultHistory.length} item(s)
            </div>
          </div>
        </div>

        <div className="border-b border-slate-100 p-6">
          <div className="grid gap-3 lg:grid-cols-[1.2fr_0.7fr]">
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <Search size={16} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  tab === 'allocation'
                    ? 'Search by course, actor, lecturer, note, level, semester...'
                    : 'Search by course, student, matric number, actor, status...'
                }
                className="w-full bg-transparent outline-none placeholder:text-slate-400"
              />
            </label>

            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              <Filter size={16} />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full bg-transparent outline-none"
              >
                <option value="all">All actions</option>
                {currentActions.map((action) => (
                  <option key={action} value={action}>
                    {niceActionLabel(action)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="p-6">
          {tab === 'allocation' ? (
            visibleAllocationHistory.length === 0 ? (
              <EmptyState
                icon={<ArrowRightLeft size={18} />}
                title="No allocation history matched your filter"
                body="Try a broader search, or go to Allocations to create the next assignment event."
              />
            ) : (
              <div className="space-y-4">
                {visibleAllocationHistory.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-sm font-black text-slate-900">
                          {item.courseCode} — {item.courseTitle}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.level} Level • {item.semester} • {item.session}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                          {niceActionLabel(item.action)}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                          {item.actorName} ({item.actorRole})
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
                        <p className="font-semibold text-slate-700">Previous lecturer</p>
                        <p className="mt-1 text-slate-900">{item.previousLecturerName ?? 'Unassigned'}</p>
                      </div>

                      <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
                        <p className="font-semibold text-slate-700">New lecturer</p>
                        <p className="mt-1 text-slate-900">{item.newLecturerName ?? 'Unassigned'}</p>
                      </div>
                    </div>

                    {item.note ? (
                      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                        {item.note}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )
          ) : visibleResultHistory.length === 0 ? (
            <EmptyState
              icon={<ClipboardList size={18} />}
              title="No result workflow history matched your filter"
              body="Try a broader search, or go to Offerings and Results to continue the academic workflow."
            />
          ) : (
            <div className="space-y-4">
              {visibleResultHistory.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-900">
                        {item.courseCode} — {item.courseTitle}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {item.studentName} • {item.matricNumber}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                        {niceActionLabel(item.action)}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                        {item.actorName} ({item.actorRole})
                      </span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(item.previousStatus)}`}>
                      Previous: {item.previousStatus ?? '—'}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(item.currentStatus)}`}>
                      Current: {item.currentStatus ?? '—'}
                    </span>
                  </div>

                  {item.note ? (
                    <div className="mt-4 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-900">
                      {item.note}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function MetricCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: number
  tone: 'blue' | 'green' | 'amber' | 'slate'
}) {
  const toneMap = {
    blue: 'border-blue-100 bg-blue-50 text-blue-700',
    green: 'border-green-100 bg-green-50 text-green-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
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

function EmptyState({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
        {icon}
      </div>
      <p className="mt-4 text-sm font-black text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{body}</p>
      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
        <Clock3 size={14} />
        History updates as users continue working.
      </div>
    </div>
  )
}