'use client'

import Link from 'next/link'
import { useActionState, useMemo, useState } from 'react'
import { useFormStatus } from 'react-dom'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileWarning,
  GraduationCap,
  Search,
  ShieldCheck,
  UserRound,
  XCircle,
} from 'lucide-react'
import {
  approveOfferingResultsAction,
  rejectOfferingResultsAction,
  returnOfferingResultsAction,
  type ActionState,
} from '@/app/dashboard/hod/offerings/[offeringId]/actions'

type ResultRecord = {
  id: string
  ca_score: number | null
  exam_score: number | null
  total_score: number | null
  grade: string | null
  status: 'DRAFT' | 'SUBMITTED' | 'HOD_APPROVED' | 'DEAN_APPROVED' | 'LOCKED' | null
  updated_at: string | null
}

type StudentRecord = {
  id: string
  full_name: string | null
  matric_number: string | null
  level: string | number | null
}

type RegistrationRecord = {
  id: string
  student_id: string
  offering_id: string
  created_at: string | null
  students: StudentRecord | StudentRecord[] | null
  results: ResultRecord[] | ResultRecord | null
}

type CourseRecord = {
  id: string
  code: string | null
  title: string | null
  unit: number | null
  department_id?: string | null
}

type LecturerRecord = {
  id: string
  full_name: string | null
}

type OfferingRecord = {
  id: string
  level?: string | number | null
  session: string | null
  semester: string | null
  status?: string | null
  published?: boolean | null
  lecturer_id?: string | null
  department_id?: string | null
  created_at?: string | null
  courses: CourseRecord | CourseRecord[] | null
  lecturer?: LecturerRecord | LecturerRecord[] | null
}

type ProfileRecord = {
  id: string
  role: string
  department_id?: string | null
  full_name?: string | null
}

type NormalizedRow = {
  registrationId: string
  studentId: string
  fullName: string
  matricNumber: string
  level: string | number
  resultId: string | null
  ca: number | null
  exam: number | null
  total: number | null
  grade: string
  status: ResultRecord['status']
  updatedAt: string | null
  hasIssues: boolean
  issueFlags: string[]
}

const INITIAL_ACTION_STATE: ActionState = {
  ok: false,
  message: '',
}

export default function HODOfferingWorkspace({
  profile,
  offering,
  registrations,
}: {
  profile: ProfileRecord
  offering: OfferingRecord
  registrations: RegistrationRecord[]
}) {
  const [query, setQuery] = useState('')
  const [showOnlyIssues, setShowOnlyIssues] = useState(false)
  const [reviewNote, setReviewNote] = useState('')

  const [approveState, approveAction] = useActionState<ActionState, FormData>(
    approveOfferingResultsAction,
    INITIAL_ACTION_STATE
  )
  const [returnState, returnAction] = useActionState<ActionState, FormData>(
    returnOfferingResultsAction,
    INITIAL_ACTION_STATE
  )
  const [rejectState, rejectAction] = useActionState<ActionState, FormData>(
    rejectOfferingResultsAction,
    INITIAL_ACTION_STATE
  )

  const course = Array.isArray(offering.courses) ? offering.courses[0] : offering.courses
  const lecturer = Array.isArray(offering.lecturer) ? offering.lecturer[0] : offering.lecturer

  const normalizedRows = useMemo<NormalizedRow[]>(() => {
    return registrations.map((registration) => {
      const student = Array.isArray(registration.students)
        ? registration.students[0]
        : registration.students

      const result = Array.isArray(registration.results)
        ? registration.results[0]
        : registration.results

      const ca = result?.ca_score ?? null
      const exam = result?.exam_score ?? null
      const total = result?.total_score ?? null
      const grade = result?.grade ?? '—'
      const rowLevel = student?.level ?? offering.level ?? '—'

      const hasResult = !!result
      const missingCA = hasResult && ca === null
      const missingExam = hasResult && exam === null
      const missingTotal = hasResult && total === null
      const missingGrade = hasResult && (!result?.grade || !result.grade.trim())
      const missingCompletely = !hasResult

      const outOfRangeCA = ca !== null && (ca < 0 || ca > 40)
      const outOfRangeExam = exam !== null && (exam < 0 || exam > 60)
      const outOfRangeTotal = total !== null && (total < 0 || total > 100)
      const totalMismatch =
        ca !== null && exam !== null && total !== null && ca + exam !== total
      const zeroTotal = total === 0

      const issueFlags = [
        missingCompletely ? 'No result' : null,
        missingCA ? 'Missing CA' : null,
        missingExam ? 'Missing Exam' : null,
        missingTotal ? 'Missing Total' : null,
        missingGrade ? 'Missing Grade' : null,
        outOfRangeCA ? 'CA out of range' : null,
        outOfRangeExam ? 'Exam out of range' : null,
        outOfRangeTotal ? 'Total out of range' : null,
        totalMismatch ? 'Total mismatch' : null,
        zeroTotal ? 'Total is zero' : null,
      ].filter(Boolean) as string[]

      return {
        registrationId: registration.id,
        studentId: student?.id ?? '',
        fullName: student?.full_name ?? 'Unknown Student',
        matricNumber: student?.matric_number ?? '—',
        level: rowLevel,
        resultId: result?.id ?? null,
        ca,
        exam,
        total,
        grade,
        status: result?.status ?? null,
        updatedAt: result?.updated_at ?? null,
        hasIssues: issueFlags.length > 0,
        issueFlags,
      }
    })
  }, [registrations, offering.level])

  const metrics = useMemo(() => {
    const totalStudents = normalizedRows.length
    const entered = normalizedRows.filter((row) => row.resultId).length
    const missing = normalizedRows.filter((row) => !row.resultId).length
    const withIssues = normalizedRows.filter((row) => row.hasIssues).length

    const draft = normalizedRows.filter((row) => row.status === 'DRAFT').length
    const submitted = normalizedRows.filter((row) => row.status === 'SUBMITTED').length
    const hodApproved = normalizedRows.filter((row) => row.status === 'HOD_APPROVED').length
    const deanApproved = normalizedRows.filter((row) => row.status === 'DEAN_APPROVED').length
    const locked = normalizedRows.filter((row) => row.status === 'LOCKED').length

    return {
      totalStudents,
      entered,
      missing,
      withIssues,
      draft,
      submitted,
      hodApproved,
      deanApproved,
      locked,
    }
  }, [normalizedRows])

  const issueSummary = useMemo(() => {
    const bucket: Record<string, number> = {}

    for (const row of normalizedRows) {
      for (const issue of row.issueFlags) {
        bucket[issue] = (bucket[issue] ?? 0) + 1
      }
    }

    return Object.entries(bucket)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count }))
  }, [normalizedRows])

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase()

    const sorted = [...normalizedRows].sort((a, b) => {
      if (a.hasIssues !== b.hasIssues) return a.hasIssues ? -1 : 1
      if (a.status === 'SUBMITTED' && b.status !== 'SUBMITTED') return -1
      if (a.status !== 'SUBMITTED' && b.status === 'SUBMITTED') return 1
      return a.fullName.localeCompare(b.fullName)
    })

    return sorted.filter((row) => {
      const matchesQuery =
        !q ||
        row.fullName.toLowerCase().includes(q) ||
        row.matricNumber.toLowerCase().includes(q)

      const matchesIssueFilter = !showOnlyIssues || row.hasIssues

      return matchesQuery && matchesIssueFilter
    })
  }, [normalizedRows, query, showOnlyIssues])

  const canApprove =
    metrics.totalStudents > 0 &&
    metrics.missing === 0 &&
    issueSummary.length === 0 &&
    metrics.entered === metrics.totalStudents &&
    metrics.submitted === metrics.totalStudents

  const statusBanner = useMemo<{
    tone: 'slate' | 'red' | 'amber' | 'blue' | 'green' | 'violet'
    title: string
    body: string
  }>(() => {
    if (metrics.totalStudents === 0) {
      return {
        tone: 'slate',
        title: 'No registrations found for this offering',
        body: 'There are no registered students to review yet.',
      }
    }

    if (metrics.locked > 0 || metrics.deanApproved > 0) {
      return {
        tone: 'violet',
        title: 'This offering contains dean-controlled or locked rows',
        body: 'Some results are already beyond normal HOD control and should be handled with caution.',
      }
    }

    if (metrics.missing > 0) {
      return {
        tone: 'red',
        title: 'Approval blocked by missing results',
        body: `${metrics.missing} registered student(s) do not yet have saved results.`,
      }
    }

    if (issueSummary.length > 0) {
      return {
        tone: 'amber',
        title: 'Approval blocked by flagged result issues',
        body: 'Resolve all flagged rows before approval can proceed.',
      }
    }

    if (metrics.submitted !== metrics.totalStudents) {
      return {
        tone: 'blue',
        title: 'Waiting for full lecturer submission',
        body: `Only ${metrics.submitted} of ${metrics.totalStudents} row(s) are currently SUBMITTED. HOD can approve only SUBMITTED rows.`,
      }
    }

    return {
      tone: 'green',
      title: 'This offering is ready for HOD approval',
      body: 'All rows are valid, complete, and already submitted by the lecturer.',
    }
  }, [issueSummary.length, metrics])

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <Link
              href="/dashboard/hod/offerings"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft size={16} />
              Back to HOD offerings
            </Link>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                <ShieldCheck size={14} />
                Supervisory Review Workspace
              </div>

              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                {course?.code ?? 'Course Code'} — {course?.title ?? 'Untitled Course'}
              </h1>

              <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                <span className="rounded-full bg-slate-100 px-3 py-1">
                  Session: {offering.session ?? '—'}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1">
                  Semester: {offering.semester ?? '—'}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1">
                  Level: {offering.level ?? '—'}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1">
                  Units: {course?.unit ?? '—'}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1">
                  Published: {offering.published ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid min-w-[280px] gap-3 rounded-[1.5rem] bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white p-2 shadow-sm">
                <GraduationCap size={18} className="text-slate-700" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Lecturer</p>
                <p className="font-semibold text-slate-900">
                  {lecturer?.full_name ?? 'Not assigned'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white p-2 shadow-sm">
                <ClipboardCheck size={18} className="text-slate-700" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Offering State</p>
                <p className="font-semibold text-slate-900">
                  {offering.status ?? '—'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white p-2 shadow-sm">
                <UserRound size={18} className="text-slate-700" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Reviewed By</p>
                <p className="font-semibold text-slate-900">
                  {profile.full_name ?? 'HOD'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`rounded-[2rem] border p-5 shadow-sm ${bannerTone(statusBanner.tone)}`}>
        <h2 className="text-lg font-bold">{statusBanner.title}</h2>
        <p className="mt-1 text-sm">{statusBanner.body}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          label="Registered Students"
          value={metrics.totalStudents}
          icon={<UserRound size={18} />}
        />
        <MetricCard
          label="Results Entered"
          value={metrics.entered}
          icon={<CheckCircle2 size={18} />}
        />
        <MetricCard
          label="Missing Results"
          value={metrics.missing}
          icon={<XCircle size={18} />}
          danger={metrics.missing > 0}
        />
        <MetricCard
          label="Rows With Issues"
          value={metrics.withIssues}
          icon={<AlertTriangle size={18} />}
          danger={metrics.withIssues > 0}
        />
        <MetricCard
          label="Submitted"
          value={metrics.submitted}
          icon={<ClipboardCheck size={18} />}
        />
        <MetricCard
          label="HOD Approved"
          value={metrics.hodApproved}
          icon={<ShieldCheck size={18} />}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Eye size={18} className="text-slate-700" />
            <h2 className="text-lg font-bold text-slate-900">Review Summary</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <StatusChip label="Draft" value={metrics.draft} tone="amber" />
            <StatusChip label="Submitted" value={metrics.submitted} tone="blue" />
            <StatusChip label="HOD Approved" value={metrics.hodApproved} tone="green" />
            <StatusChip label="Dean Approved" value={metrics.deanApproved} tone="violet" />
            <StatusChip label="Locked" value={metrics.locked} tone="slate" />
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            {canApprove ? (
              <p className="font-medium text-green-700">
                All registered rows are valid and already marked SUBMITTED. This offering is ready for HOD approval.
              </p>
            ) : (
              <p className="font-medium text-amber-700">
                Approval is blocked until every registered row is complete, issue-free, and already marked SUBMITTED.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FileWarning size={18} className="text-slate-700" />
            <h2 className="text-lg font-bold text-slate-900">Issue Panel</h2>
          </div>

          {issueSummary.length === 0 ? (
            <div className="rounded-2xl bg-green-50 p-4 text-sm font-medium text-green-700">
              No row-level issues detected.
            </div>
          ) : (
            <div className="space-y-3">
              {issueSummary.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3 text-sm"
                >
                  <span className="font-medium text-amber-900">{item.label}</span>
                  <span className="rounded-full bg-white px-3 py-1 font-semibold text-amber-700">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Registered Students & Saved Results</h2>
            <p className="text-sm text-slate-600">
              This table is for review, validation, and supervision. It is intentionally read-first.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <Search size={16} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by student or matric number"
                className="w-full bg-transparent outline-none placeholder:text-slate-400"
              />
            </label>

            <button
              type="button"
              onClick={() => setShowOnlyIssues((prev) => !prev)}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                showOnlyIssues
                  ? 'bg-amber-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-700'
              }`}
            >
              {showOnlyIssues ? 'Showing only flagged rows' : 'Show only flagged rows'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-slate-600">
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="px-4 py-3 font-semibold">Matric No.</th>
                <th className="px-4 py-3 font-semibold">CA</th>
                <th className="px-4 py-3 font-semibold">Exam</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Grade</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Flags</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                    No rows matched your current filter.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.registrationId} className="align-top">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-900">{row.fullName}</div>
                      <div className="mt-1 text-xs text-slate-500">Level: {row.level}</div>
                    </td>
                    <td className="px-4 py-4 text-slate-700">{row.matricNumber}</td>
                    <td className="px-4 py-4 text-slate-700">{row.ca ?? '—'}</td>
                    <td className="px-4 py-4 text-slate-700">{row.exam ?? '—'}</td>
                    <td className="px-4 py-4 font-semibold text-slate-900">{row.total ?? '—'}</td>
                    <td className="px-4 py-4 text-slate-700">{row.grade}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {row.status ?? 'NO_RESULT'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {row.issueFlags.length === 0 ? (
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                          Clear
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {row.issueFlags.map((flag) => (
                            <span
                              key={flag}
                              className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
                            >
                              {flag}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Supervisory Actions</h2>
              <p className="text-sm text-slate-600">
                HOD actions change workflow state for the whole offering batch, not individual score entry.
              </p>
            </div>

            <textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="Optional review note for lecturer / audit trail"
              className="min-h-[110px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none placeholder:text-slate-400"
            />

            <ActionMessage state={approveState} />
            <ActionMessage state={returnState} />
            <ActionMessage state={rejectState} />
          </div>

          <div className="flex flex-wrap gap-3">
            <form action={approveAction}>
              <input type="hidden" name="offeringId" value={offering.id} readOnly />
              <ApproveSubmitButton disabled={!canApprove} />
            </form>

            <form action={returnAction}>
              <input type="hidden" name="offeringId" value={offering.id} readOnly />
              <input type="hidden" name="note" value={reviewNote} readOnly />
              <ReturnSubmitButton />
            </form>

            <form action={rejectAction}>
              <input type="hidden" name="offeringId" value={offering.id} readOnly />
              <input type="hidden" name="note" value={reviewNote} readOnly />
              <RejectSubmitButton />
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}

function ActionMessage({ state }: { state: ActionState }) {
  if (!state.message) return null

  return (
    <div
      className={`rounded-2xl px-4 py-3 text-sm font-medium ${
        state.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
      }`}
    >
      {state.message}
    </div>
  )
}

function ApproveSubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={`rounded-2xl px-5 py-3 text-sm font-semibold ${
        !disabled && !pending
          ? 'bg-green-600 text-white hover:bg-green-700'
          : 'cursor-not-allowed bg-slate-200 text-slate-500'
      }`}
    >
      {pending ? 'Processing...' : 'Approve Results'}
    </button>
  )
}

function ReturnSubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-2xl border border-amber-300 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-800 ${
        pending ? 'cursor-not-allowed opacity-60' : ''
      }`}
    >
      {pending ? 'Processing...' : 'Return to Lecturer'}
    </button>
  )
}

function RejectSubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-2xl border border-red-300 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 ${
        pending ? 'cursor-not-allowed opacity-60' : ''
      }`}
    >
      {pending ? 'Processing...' : 'Reject Batch'}
    </button>
  )
}

function MetricCard({
  label,
  value,
  icon,
  danger = false,
}: {
  label: string
  value: number
  icon: React.ReactNode
  danger?: boolean
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
        {icon}
      </div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-black ${danger ? 'text-red-600' : 'text-slate-900'}`}>
        {value}
      </p>
    </div>
  )
}

function StatusChip({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'amber' | 'blue' | 'green' | 'violet' | 'slate'
}) {
  const toneMap = {
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    violet: 'bg-violet-50 text-violet-700',
    slate: 'bg-slate-100 text-slate-700',
  }

  return (
    <div className={`rounded-2xl px-4 py-3 ${toneMap[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-xl font-black">{value}</p>
    </div>
  )
}

function bannerTone(tone: 'slate' | 'red' | 'amber' | 'blue' | 'green' | 'violet') {
  switch (tone) {
    case 'red':
      return 'border-red-200 bg-red-50 text-red-800'
    case 'amber':
      return 'border-amber-200 bg-amber-50 text-amber-800'
    case 'blue':
      return 'border-blue-200 bg-blue-50 text-blue-800'
    case 'green':
      return 'border-green-200 bg-green-50 text-green-800'
    case 'violet':
      return 'border-violet-200 bg-violet-50 text-violet-800'
    default:
      return 'border-slate-200 bg-slate-50 text-slate-800'
  }
}