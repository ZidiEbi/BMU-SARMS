'use client'

import { useActionState, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  Loader2,
  RefreshCcw,
  Save,
  Search,
  Send,
  ShieldAlert,
} from 'lucide-react'
import { useFormStatus as useFormStatusFromReact } from 'react-dom'
import {
  submitOfferingResultsAction,
  upsertResult,
  type LecturerActionState,
} from '@/app/dashboard/lecturer/courses/[courseId]/actions'

type Row = {
  id: string
  students?: { matric_number: string; full_name: string } | null
  results?: {
    id: string
    ca_score: number | null
    exam_score: number | null
    score: number | null
    grade: string | null
    status: string
    remark_code: string | null
    updated_at?: string | null
  }[] | null
}

type LocalRowState = {
  courseRegistrationId: string
  matricNumber: string
  fullName: string
  resultId: string | null
  caScore: number | ''
  examScore: number | ''
  totalScore: number | null
  grade: string
  status: string | null
  isReturned: boolean
}

const INITIAL_SUBMIT_STATE: LecturerActionState = {
  ok: false,
  message: '',
}

function computeGrade(total: number) {
  if (total >= 70) return 'A'
  if (total >= 60) return 'B'
  if (total >= 50) return 'C'
  return 'F'
}

export default function ResultsTable({
  courseId,
  session,
  semester,
  level,
  workflowNote,
  rows,
}: {
  courseId: string
  session: string
  semester: string
  level: string
  workflowNote?: string | null
  rows: Row[]
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [rowFeedback, setRowFeedback] = useState<Record<string, { type: 'ok' | 'err'; message: string }>>({})
  const [savingRowId, setSavingRowId] = useState<string | null>(null)

  const [submitState, submitAction] = useActionState<LecturerActionState, FormData>(
    submitOfferingResultsAction,
    INITIAL_SUBMIT_STATE
  )

  useEffect(() => {
    if (submitState.ok) {
      router.refresh()
    }
  }, [submitState.ok, router])

  const normalizedRows = useMemo<LocalRowState[]>(() => {
    return rows.map((row) => {
      const result = Array.isArray(row.results) ? row.results[0] : row.results
      const status = result?.status ?? null
      const isReturned =
        Boolean(workflowNote) && status === 'DRAFT' && Boolean(result?.id)

      return {
        courseRegistrationId: row.id,
        matricNumber: row.students?.matric_number ?? '—',
        fullName: row.students?.full_name ?? 'Unknown Student',
        resultId: result?.id ?? null,
        caScore: result?.ca_score ?? '',
        examScore: result?.exam_score ?? '',
        totalScore: result?.score ?? null,
        grade: result?.grade ?? '—',
        status,
        isReturned,
      }
    })
  }, [rows, workflowNote])

  const [localRows, setLocalRows] = useState<LocalRowState[]>(normalizedRows)

  useEffect(() => {
    setLocalRows(normalizedRows)
  }, [normalizedRows])

  const metrics = useMemo(() => {
    const registered = localRows.length
    const saved = localRows.filter((row) => row.resultId).length
    const submitted = localRows.filter((row) => row.status === 'SUBMITTED').length
    const returned = localRows.filter((row) => row.isReturned).length
    const draft = localRows.filter((row) => row.status === 'DRAFT').length

    const invalid = localRows.filter((row) => {
      if (!row.resultId) return false
      const ca = Number(row.caScore)
      const exam = Number(row.examScore)
      const total = row.totalScore ?? null

      return (
        Number.isNaN(ca) ||
        Number.isNaN(exam) ||
        ca < 0 ||
        ca > 40 ||
        exam < 0 ||
        exam > 60 ||
        total === null ||
        ca + exam !== total
      )
    }).length

    return {
      registered,
      saved,
      submitted,
      returned,
      draft,
      invalid,
    }
  }, [localRows])

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase()

    const sorted = [...localRows].sort((a, b) => {
      if (a.isReturned !== b.isReturned) return a.isReturned ? -1 : 1
      if (a.status === 'DRAFT' && b.status !== 'DRAFT') return -1
      if (a.status !== 'DRAFT' && b.status === 'DRAFT') return 1
      return a.fullName.localeCompare(b.fullName)
    })

    return sorted.filter((row) => {
      const blob = `${row.fullName} ${row.matricNumber}`.toLowerCase()
      return !q || blob.includes(q)
    })
  }, [localRows, query])

  const canSubmit =
    metrics.registered > 0 &&
    metrics.saved === metrics.registered &&
    metrics.invalid === 0

  async function handleSaveRow(courseRegistrationId: string) {
    const row = localRows.find((item) => item.courseRegistrationId === courseRegistrationId)
    if (!row) return

    const caScore = Number(row.caScore)
    const examScore = Number(row.examScore)

    setSavingRowId(courseRegistrationId)
    setRowFeedback((prev) => {
      const next = { ...prev }
      delete next[courseRegistrationId]
      return next
    })

    const result = await upsertResult({
      offeringId: courseId,
      courseRegistrationId,
      caScore,
      examScore,
    })

    if (result.ok) {
      const total = caScore + examScore
      const grade = computeGrade(total)

      setLocalRows((prev) =>
        prev.map((item) =>
          item.courseRegistrationId === courseRegistrationId
            ? {
                ...item,
                totalScore: total,
                grade,
                status: 'DRAFT',
                resultId: item.resultId ?? 'saved-row',
                isReturned: false,
              }
            : item
        )
      )

      setRowFeedback((prev) => ({
        ...prev,
        [courseRegistrationId]: { type: 'ok', message: result.message },
      }))

      router.refresh()
    } else {
      setRowFeedback((prev) => ({
        ...prev,
        [courseRegistrationId]: { type: 'err', message: result.message },
      }))
    }

    setSavingRowId(null)
  }

  function handleLocalChange(
    courseRegistrationId: string,
    field: 'caScore' | 'examScore',
    value: string
  ) {
    setLocalRows((prev) =>
      prev.map((row) => {
        if (row.courseRegistrationId !== courseRegistrationId) return row

        const parsed = value === '' ? '' : Number(value)
        const ca = field === 'caScore' ? parsed : row.caScore
        const exam = field === 'examScore' ? parsed : row.examScore

        const bothNumbers =
          ca !== '' && exam !== '' && !Number.isNaN(Number(ca)) && !Number.isNaN(Number(exam))

        const total = bothNumbers ? Number(ca) + Number(exam) : null
        const grade = total !== null ? computeGrade(total) : '—'

        return {
          ...row,
          [field]: parsed,
          totalScore: total,
          grade,
        }
      })
    )
  }

  return (
    <div className="space-y-6">
      {workflowNote ? (
        <section className="rounded-[2rem] border border-red-200 bg-red-50 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-white p-2 text-red-700 shadow-sm">
              <RefreshCcw size={18} />
            </div>
            <div>
              <h2 className="text-lg font-black text-red-800">
                Returned by HOD
              </h2>
              <p className="mt-2 text-sm font-medium text-red-700">
                {workflowNote}
              </p>
              <p className="mt-2 text-sm text-red-700">
                Review the affected rows, save your corrections, and submit the offering again.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Registered" value={metrics.registered} icon={<FileCheck2 size={18} />} />
        <MetricCard label="Saved" value={metrics.saved} icon={<CheckCircle2 size={18} />} />
        <MetricCard label="Draft" value={metrics.draft} icon={<AlertTriangle size={18} />} />
        <MetricCard label="Submitted" value={metrics.submitted} icon={<Send size={18} />} />
        <MetricCard
          label="Returned"
          value={metrics.returned}
          icon={<RefreshCcw size={18} />}
          danger={metrics.returned > 0}
        />
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">Result Entry & Submission</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Session: {session} • {semester} • {level} Level • Save rows as draft, then submit the full batch for HOD review.
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

            <form action={submitAction}>
              <input type="hidden" name="offeringId" value={courseId} readOnly />
              <SubmitOfferingButton disabled={!canSubmit} />
            </form>
          </div>
        </div>

        {submitState.message ? (
          <div
            className={`mt-4 rounded-2xl px-4 py-3 text-sm font-medium ${
              submitState.ok
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {submitState.message}
          </div>
        ) : null}

        {!canSubmit ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <div className="flex items-start gap-3">
              <ShieldAlert size={18} className="mt-0.5" />
              <div>
                <p className="font-black">Submission is not ready yet.</p>
                <p className="mt-1">
                  Every registered row must be saved and valid before you can submit to HOD.
                  Lecturer scoring is now aligned to CA 0–40 and Exam 0–60.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-slate-600">
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="px-4 py-3 font-semibold">Matric No.</th>
                <th className="px-4 py-3 font-semibold">CA (40)</th>
                <th className="px-4 py-3 font-semibold">Exam (60)</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Grade</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                    No rows matched your search.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const feedback = rowFeedback[row.courseRegistrationId]
                  const total = row.totalScore
                  const invalid =
                    row.caScore === '' ||
                    row.examScore === '' ||
                    Number(row.caScore) < 0 ||
                    Number(row.caScore) > 40 ||
                    Number(row.examScore) < 0 ||
                    Number(row.examScore) > 60 ||
                    total === null ||
                    Number(row.caScore) + Number(row.examScore) !== total

                  return (
                    <tr key={row.courseRegistrationId} className="align-top">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-900">{row.fullName}</div>
                        {row.isReturned ? (
                          <div className="mt-2 inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[11px] font-black text-red-700">
                            Returned for correction
                          </div>
                        ) : null}
                      </td>

                      <td className="px-4 py-4 text-slate-700">{row.matricNumber}</td>

                      <td className="px-4 py-4">
                        <input
                          type="number"
                          min={0}
                          max={40}
                          value={row.caScore}
                          onChange={(e) =>
                            handleLocalChange(row.courseRegistrationId, 'caScore', e.target.value)
                          }
                          className="w-24 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-900 outline-none"
                        />
                      </td>

                      <td className="px-4 py-4">
                        <input
                          type="number"
                          min={0}
                          max={60}
                          value={row.examScore}
                          onChange={(e) =>
                            handleLocalChange(row.courseRegistrationId, 'examScore', e.target.value)
                          }
                          className="w-24 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-900 outline-none"
                        />
                      </td>

                      <td className="px-4 py-4 font-black text-slate-900">
                        {row.totalScore ?? '—'}
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                          {row.grade}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span className={statusPill(row.status, row.isReturned)}>
                          {row.isReturned ? 'RETURNED' : row.status ?? 'NOT_SAVED'}
                        </span>
                        {feedback ? (
                          <div
                            className={`mt-2 text-xs font-semibold ${
                              feedback.type === 'ok' ? 'text-green-700' : 'text-red-700'
                            }`}
                          >
                            {feedback.message}
                          </div>
                        ) : null}
                        {invalid ? (
                          <div className="mt-2 text-xs font-semibold text-amber-700">
                            Check CA/Exam range or total consistency.
                          </div>
                        ) : null}
                      </td>

                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => handleSaveRow(row.courseRegistrationId)}
                          disabled={savingRowId === row.courseRegistrationId}
                          className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold ${
                            savingRowId === row.courseRegistrationId
                              ? 'bg-slate-200 text-slate-500'
                              : 'bg-bmu-blue text-white hover:opacity-90'
                          }`}
                        >
                          {savingRowId === row.courseRegistrationId ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Save size={16} />
                          )}
                          {savingRowId === row.courseRegistrationId ? 'Saving...' : 'Save Row'}
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
    </div>
  )
}

function SubmitOfferingButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold ${
        !disabled && !pending
          ? 'bg-green-600 text-white hover:bg-green-700'
          : 'cursor-not-allowed bg-slate-200 text-slate-500'
      }`}
    >
      {pending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
      {pending ? 'Submitting...' : 'Submit to HOD'}
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

function statusPill(status: string | null, isReturned: boolean) {
  if (isReturned) {
    return 'rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 border border-red-200'
  }

  switch (status) {
    case 'DRAFT':
      return 'rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200'
    case 'SUBMITTED':
      return 'rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200'
    case 'HOD_APPROVED':
      return 'rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 border border-green-200'
    case 'DEAN_APPROVED':
      return 'rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 border border-violet-200'
    case 'LOCKED':
      return 'rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200'
    default:
      return 'rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 border border-red-200'
  }
}
function useFormStatus(): { pending: boolean } {
  return useFormStatusFromReact()
}
