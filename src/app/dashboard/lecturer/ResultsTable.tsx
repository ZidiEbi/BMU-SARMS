'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Users,
} from 'lucide-react'
import { upsertResult } from '@/app/dashboard/lecturer/courses/[courseId]/actions'

type Row = {
  id: string
  students?: { matric_number: string; full_name: string } | null
  results?: {
    id?: string
    ca_score: number | null
    exam_score: number | null
    score: number | null
    grade: string | null
    remark_code: string | null
    status: string
    updated_at?: string | null
  }[] | null
}

type EditableRowState = {
  ca: number | ''
  exam: number | ''
  remark: string
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function normalizeNumberInput(value: string) {
  if (value.trim() === '') return ''
  const parsed = Number(value)
  return Number.isNaN(parsed) ? '' : parsed
}

function calcRow(v: EditableRowState) {
  const ca = v.ca === '' ? 0 : clamp(Number(v.ca), 0, 30)
  const exam = v.exam === '' ? 0 : clamp(Number(v.exam), 0, 70)

  if (v.remark) {
    return {
      score: 0,
      grade: 'ABS',
      statusLabel: 'Absent',
    }
  }

  const total = ca + exam

  if (total >= 70) {
    return { score: total, grade: 'A', statusLabel: 'Pass' }
  }
  if (total >= 60) {
    return { score: total, grade: 'B', statusLabel: 'Pass' }
  }
  if (total >= 50) {
    return { score: total, grade: 'C', statusLabel: 'Pass' }
  }

  return {
    score: total,
    grade: 'F',
    statusLabel: 'Fail / Carryover',
  }
}

export default function ResultsTable(props: {
  courseId: string
  session: string
  semester: string
  rows: Row[]
}) {
  const rows = useMemo(() => props.rows ?? [], [props.rows])

  const initial = useMemo(() => {
    const map = new Map<string, EditableRowState>()

    rows.forEach((r) => {
      const res = r.results?.[0]
      map.set(r.id, {
        ca:
          res?.ca_score === null || res?.ca_score === undefined
            ? ''
            : Number(res.ca_score),
        exam:
          res?.exam_score === null || res?.exam_score === undefined
            ? ''
            : Number(res.exam_score),
        remark: res?.remark_code ?? '',
      })
    })

    return map
  }, [rows])

  const [state, setState] = useState<Map<string, EditableRowState>>(initial)
  const [savingRowId, setSavingRowId] = useState<string | null>(null)
  const [rowMessages, setRowMessages] = useState<Record<string, string>>({})

  useEffect(() => {
    setState(initial)
  }, [initial])

  const update = (
    courseRegistrationId: string,
    patch: Partial<EditableRowState>
  ) => {
    setState((prev) => {
      const next = new Map(prev)
      const cur = next.get(courseRegistrationId) ?? { ca: '', exam: '', remark: '' }
      next.set(courseRegistrationId, { ...cur, ...patch })
      return next
    })

    setRowMessages((prev) => {
      const next = { ...prev }
      delete next[courseRegistrationId]
      return next
    })
  }

  async function saveRow(courseRegistrationId: string) {
    const v = state.get(courseRegistrationId) ?? { ca: '', exam: '', remark: '' }

    try {
      setSavingRowId(courseRegistrationId)

      await upsertResult({
        course_registration_id: courseRegistrationId,
        ca_score: v.ca === '' ? 0 : clamp(Number(v.ca), 0, 30),
        exam_score: v.exam === '' ? 0 : clamp(Number(v.exam), 0, 70),
        remark_code: v.remark ? v.remark : null,
      })

      setRowMessages((prev) => ({
        ...prev,
        [courseRegistrationId]: 'Saved',
      }))
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Save failed'

      setRowMessages((prev) => ({
        ...prev,
        [courseRegistrationId]: message,
      }))
    } finally {
      setSavingRowId(null)
    }
  }

  const totalStudents = rows.length
  const savedRows = Object.values(rowMessages).filter((msg) => msg === 'Saved').length

  return (
    <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-bmu-blue" />
            Results Entry
          </h2>
          <p className="text-slate-500 text-sm font-medium">
            Session: {props.session} • Semester: {props.semester}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-4 py-2 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700 flex items-center gap-2">
            <Users size={14} className="text-bmu-blue" />
            {totalStudents} student{totalStudents === 1 ? '' : 's'}
          </div>

          <div className="px-4 py-2 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-600" />
            {savedRows} saved this session
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {rows.map((r) => {
          const v = state.get(r.id) ?? { ca: '', exam: '', remark: '' }
          const student = r.students
          const computed = calcRow(v)
          const isSaving = savingRowId === r.id
          const rowMessage = rowMessages[r.id]

          return (
            <div
              key={r.id}
              className="p-5 flex flex-col xl:flex-row xl:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {student?.matric_number ?? '—'}
                </p>
                <p className="font-bold text-slate-900 text-lg">
                  {student?.full_name ?? 'Student'}
                </p>

                {rowMessage && (
                  <div
                    className={`mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      rowMessage === 'Saved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {rowMessage === 'Saved' ? (
                      <CheckCircle2 size={12} />
                    ) : (
                      <AlertTriangle size={12} />
                    )}
                    {rowMessage}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">
                    CA (30)
                  </label>
                  <input
                    type="number"
                    value={v.ca}
                    onChange={(e) =>
                      update(r.id, { ca: normalizeNumberInput(e.target.value) })
                    }
                    className="w-24 bg-slate-50 border-none rounded-2xl px-4 py-3 text-center font-black text-slate-900"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">
                    Exam (70)
                  </label>
                  <input
                    type="number"
                    value={v.exam}
                    onChange={(e) =>
                      update(r.id, { exam: normalizeNumberInput(e.target.value) })
                    }
                    className="w-24 bg-slate-50 border-none rounded-2xl px-4 py-3 text-center font-black text-slate-900"
                  />
                </div>

                <div className="flex flex-col items-center px-4">
                  <span className="text-[10px] font-black text-bmu-blue uppercase">
                    Score
                  </span>
                  <span className="text-2xl font-black text-slate-900">
                    {computed.score}
                  </span>
                </div>

                <div className="flex flex-col items-center px-4 border-x border-slate-100">
                  <span className="text-[10px] font-black text-bmu-maroon uppercase">
                    Grade
                  </span>
                  <span className="text-2xl font-black text-bmu-maroon">
                    {computed.grade}
                  </span>
                </div>

                <select
                  className="bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold"
                  value={v.remark}
                  onChange={(e) => update(r.id, { remark: e.target.value })}
                >
                  <option value="">Present</option>
                  <option value="ABS_APPROVED">ABS (Approved)</option>
                  <option value="ABS_UNAPPROVED">ABS (Unapproved)</option>
                </select>

                <button
                  type="button"
                  onClick={() => saveRow(r.id)}
                  disabled={isSaving}
                  className="p-4 bg-bmu-blue text-white rounded-2xl hover:bg-opacity-90 disabled:bg-slate-300 flex items-center justify-center"
                >
                  {isSaving ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Save size={20} />
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}