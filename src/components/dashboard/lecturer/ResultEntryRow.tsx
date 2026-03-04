'use client'

import { useMemo, useState, useTransition } from 'react'
import { Save, Loader2, AlertCircle } from 'lucide-react'

type Student = { id: string; matric_number: string; full_name: string }

function computeGrade(total: number, remarkCode: string | null) {
  if (remarkCode === 'ABS') return 'ABS'
  if (total >= 70) return 'A'
  if (total >= 60) return 'B'
  if (total >= 50) return 'C'
  return 'F'
}

export default function ResultEntryRow({
  enrollmentId,
  student,
  initial,
}: {
  enrollmentId: string
  student: Student
  initial: {
    ca_score: number
    exam_score: number
    remark_code: string | null
    status: string
  }
}) {
  const [ca, setCa] = useState<number>(Number(initial.ca_score ?? 0))
  const [exam, setExam] = useState<number>(Number(initial.exam_score ?? 0))
  const [remark, setRemark] = useState<string>(initial.remark_code ?? 'NONE')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  const remarkCode = remark === 'NONE' ? null : remark
  const total = useMemo(() => (remarkCode === 'ABS' ? 0 : ca + exam), [ca, exam, remarkCode])
  const grade = useMemo(() => computeGrade(ca + exam, remarkCode), [ca, exam, remarkCode])

  const save = () => {
    setSaved(false)
    setError(null)

    startTransition(async () => {
      try {
        const res = await fetch('/api/lecturer/results/upsert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            enrollmentId,
            ca_score: ca,
            exam_score: exam,
            remark_code: remarkCode,
          }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to save')
        setSaved(true)
      } catch (e: any) {
        setError(e.message)
      }
    })
  }

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex-1">
        <p className="text-[10px] font-black text-slate-400 uppercase">{student.matric_number}</p>
        <h4 className="font-bold text-slate-900">{student.full_name}</h4>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black text-slate-400 uppercase px-1">CA (30)</label>
          <input
            type="number"
            min={0}
            max={30}
            className="w-20 bg-slate-50 border-none rounded-xl p-2 font-bold text-center"
            value={ca}
            onChange={(e) => setCa(Number(e.target.value))}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black text-slate-400 uppercase px-1">Exam (70)</label>
          <input
            type="number"
            min={0}
            max={70}
            className="w-20 bg-slate-50 border-none rounded-xl p-2 font-bold text-center"
            value={exam}
            onChange={(e) => setExam(Number(e.target.value))}
          />
        </div>

        <div className="flex flex-col items-center px-4">
          <span className="text-[9px] font-black text-bmu-blue uppercase">Total</span>
          <span className="text-lg font-black text-slate-900">{total}</span>
        </div>

        <div className="flex flex-col items-center px-4 border-x border-slate-100">
          <span className="text-[9px] font-black text-bmu-maroon uppercase">Grade</span>
          <span className="text-lg font-black text-bmu-maroon">{grade}</span>
        </div>

        <select
          className="bg-slate-50 border-none rounded-xl text-[10px] font-bold p-2"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
        >
          <option value="NONE">Present</option>
          <option value="ABS">ABS</option>
        </select>

        <button
          onClick={save}
          disabled={pending}
          className="px-4 py-3 bg-bmu-blue text-white rounded-xl hover:bg-opacity-90 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"
        >
          {pending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          Save
        </button>

        {saved && <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Saved</span>}
      </div>

      {error && (
        <div className="w-full mt-2 text-left text-xs text-red-600 font-bold flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
    </div>
  )
}