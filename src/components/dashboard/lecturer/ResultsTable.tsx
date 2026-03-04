'use client'

import { useMemo, useState, useTransition } from 'react'
import { Save, Loader2, AlertTriangle } from 'lucide-react'
import { upsertResult } from '@/app/dashboard/lecturer/courses/[courseId]/actions'

type Row = {
  id: string // enrollment id
  students?: { matric_number: string; full_name: string } | null
  results?: {
    ca_score: number | null
    exam_score: number | null
    score: number | null
    grade: string | null
    remark_code: string | null
    status: string
  }[] | null
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export default function ResultsTable(props: {
  courseId: string
  session: string
  semester: string
  rows: Row[]
}) {
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<string | null>(null)

  const rows = useMemo(() => props.rows ?? [], [props.rows])

  const initial = useMemo(() => {
    const map = new Map<string, { ca: number; exam: number; remark: string }>()
    rows.forEach((r) => {
      const res = r.results?.[0]
      map.set(r.id, {
        ca: Number(res?.ca_score ?? 0),
        exam: Number(res?.exam_score ?? 0),
        remark: res?.remark_code ?? '',
      })
    })
    return map
  }, [rows])

  const [state, setState] = useState(() => initial)

  const update = (enrollmentId: string, patch: Partial<{ ca: number; exam: number; remark: string }>) => {
    setState((prev) => {
      const next = new Map(prev)
      const cur = next.get(enrollmentId) ?? { ca: 0, exam: 0, remark: '' }
      next.set(enrollmentId, { ...cur, ...patch })
      return next
    })
  }

  const calc = (enrollmentId: string) => {
    const v = state.get(enrollmentId) ?? { ca: 0, exam: 0, remark: '' }
    const hasRemark = Boolean(v.remark)
    const total = clamp(Number(v.ca), 0, 30) + clamp(Number(v.exam), 0, 70)
    const score = hasRemark ? 0 : total
    const grade = hasRemark ? 'ABS' : (score >= 70 ? 'A' : score >= 60 ? 'B' : score >= 50 ? 'C' : 'F')
    return { total, score, grade }
  }

  const saveRow = (enrollmentId: string) => {
    const v = state.get(enrollmentId) ?? { ca: 0, exam: 0, remark: '' }

    startTransition(async () => {
      try {
        await upsertResult({
          enrollment_id: enrollmentId,
          ca_score: clamp(Number(v.ca), 0, 30),
          exam_score: clamp(Number(v.exam), 0, 70),
          remark_code: v.remark ? v.remark : null,
        })
        setToast('Saved.')
        setTimeout(() => setToast(null), 1500)
      } catch (e: any) {
        setToast(e?.message ?? 'Save failed')
        setTimeout(() => setToast(null), 2500)
      }
    })
  }

  return (
    <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900">Results Entry</h2>
          <p className="text-slate-500 text-sm font-medium">
            Session: {props.session} • Semester: {props.semester}
          </p>
        </div>

        {toast && (
          <div className="px-4 py-2 rounded-2xl bg-slate-900 text-white text-xs font-bold flex items-center gap-2">
            <AlertTriangle size={14} />
            {toast}
          </div>
        )}
      </div>

      <div className="divide-y divide-slate-100">
        {rows.map((r) => {
          const v = state.get(r.id) ?? { ca: 0, exam: 0, remark: '' }
          const student = r.students
          const { score, grade } = calc(r.id)

          return (
            <div key={r.id} className="p-5 flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {student?.matric_number ?? '—'}
                </p>
                <p className="font-bold text-slate-900">{student?.full_name ?? 'Student'}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase px-1">CA (30)</label>
                  <input
                    type="number"
                    className="w-20 bg-slate-50 border-none rounded-xl p-2 font-bold text-center"
                    value={v.ca}
                    onChange={(e) => update(r.id, { ca: Number(e.target.value) })}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase px-1">Exam (70)</label>
                  <input
                    type="number"
                    className="w-20 bg-slate-50 border-none rounded-xl p-2 font-bold text-center"
                    value={v.exam}
                    onChange={(e) => update(r.id, { exam: Number(e.target.value) })}
                  />
                </div>

                <div className="flex flex-col items-center px-4">
                  <span className="text-[9px] font-black text-bmu-blue uppercase">Score</span>
                  <span className="text-lg font-black text-slate-900">{score}</span>
                </div>

                <div className="flex flex-col items-center px-4 border-x border-slate-100">
                  <span className="text-[9px] font-black text-bmu-maroon uppercase">Grade</span>
                  <span className="text-lg font-black text-bmu-maroon">{grade}</span>
                </div>

                <select
                  className="bg-slate-50 border-none rounded-xl text-[10px] font-bold p-2"
                  value={v.remark}
                  onChange={(e) => update(r.id, { remark: e.target.value })}
                >
                  <option value="">Present</option>
                  <option value="ABS_APPROVED">ABS (Approved)</option>
                  <option value="ABS_UNAPPROVED">ABS (Unapproved)</option>
                </select>

                <button
                  onClick={() => saveRow(r.id)}
                  disabled={isPending}
                  className="p-3 bg-bmu-blue text-white rounded-xl hover:bg-opacity-90 disabled:bg-slate-300 flex items-center gap-2"
                >
                  {isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}