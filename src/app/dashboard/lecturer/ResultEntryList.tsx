"use client"

import { useMemo, useState } from "react"
import { Save, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

type StudentRow = {
  enrollment_id: string
  matric_number: string
  full_name: string
  existing?: {
    ca_score: number | null
    exam_score: number | null
    remark_code: string | null
  }
}

function clampScore(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min
  return Math.max(min, Math.min(max, n))
}

function absentToRemark(absent: "none" | "with_approval" | "without_approval") {
  if (absent === "with_approval") return "ABS_APPROVED"
  if (absent === "without_approval") return "ABS_UNAPPROVED"
  return null
}

export default function ResultEntryList({
  courseCode,
  students,
}: {
  courseCode: string
  students: StudentRow[]
}) {
  const [savingId, setSavingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null)

  const initialMap = useMemo(() => {
    const m = new Map<string, { ca: number; exam: number; absent: "none" | "with_approval" | "without_approval" }>()
    for (const s of students) {
      const existingRemark = s.existing?.remark_code?.toUpperCase() ?? null
      const absent =
        existingRemark === "ABS_APPROVED"
          ? "with_approval"
          : existingRemark === "ABS_UNAPPROVED"
          ? "without_approval"
          : "none"

      m.set(s.enrollment_id, {
        ca: s.existing?.ca_score ?? 0,
        exam: s.existing?.exam_score ?? 0,
        absent,
      })
    }
    return m
  }, [students])

  const [rows, setRows] = useState(initialMap)

  const updateRow = (enrollmentId: string, patch: Partial<{ ca: number; exam: number; absent: "none" | "with_approval" | "without_approval" }>) => {
    setRows(prev => {
      const next = new Map(prev)
      const cur = next.get(enrollmentId)
      if (!cur) return prev
      next.set(enrollmentId, { ...cur, ...patch })
      return next
    })
  }

  const saveOne = async (enrollmentId: string) => {
    const r = rows.get(enrollmentId)
    if (!r) return

    const ca = clampScore(r.ca, 0, 30)
    const exam = clampScore(r.exam, 0, 70)

    setSavingId(enrollmentId)
    setToast(null)

    const remark_code = absentToRemark(r.absent)

    const res = await fetch("/api/scan-form/lecturer/results/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enrollmentId,
        ca_score: ca,
        exam_score: exam,
        remark_code,
      }),
    })

    const json = await res.json()

    if (!res.ok || json?.error) {
      setToast({ type: "err", msg: json?.error || "Save failed" })
    } else {
      setToast({ type: "ok", msg: "Saved." })
      updateRow(enrollmentId, { ca, exam })
    }

    setSavingId(null)
    setTimeout(() => setToast(null), 2000)
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
          toast.type === "ok" ? "bg-green-50 border-green-100 text-green-700" : "bg-red-50 border-red-100 text-red-700"
        }`}>
          {toast.type === "ok" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <p className="text-sm font-bold">{toast.msg}</p>
        </div>
      )}

      {students.map((s) => {
        const r = rows.get(s.enrollment_id) || { ca: 0, exam: 0, absent: "none" as const }

        return (
          <div key={s.enrollment_id} className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase">{s.matric_number}</p>
              <h4 className="font-bold text-slate-900">{s.full_name}</h4>
            </div>

            <div className="flex gap-4 items-center flex-wrap justify-end">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-slate-400 uppercase px-1">CA (30)</label>
                <input
                  type="number"
                  className="w-20 bg-slate-50 border-none rounded-xl p-2 font-bold text-center"
                  value={r.ca}
                  onChange={(e) => updateRow(s.enrollment_id, { ca: Number(e.target.value) })}
                  disabled={r.absent !== "none"}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-slate-400 uppercase px-1">Exam (70)</label>
                <input
                  type="number"
                  className="w-20 bg-slate-50 border-none rounded-xl p-2 font-bold text-center"
                  value={r.exam}
                  onChange={(e) => updateRow(s.enrollment_id, { exam: Number(e.target.value) })}
                  disabled={r.absent !== "none"}
                />
              </div>

              <select
                className="bg-slate-50 border-none rounded-xl text-[10px] font-bold p-2"
                value={r.absent}
                onChange={(e) => updateRow(s.enrollment_id, { absent: e.target.value as any })}
              >
                <option value="none">Present</option>
                <option value="with_approval">ABS (Approved)</option>
                <option value="without_approval">ABS (Unapproved)</option>
              </select>

              <button
                onClick={() => saveOne(s.enrollment_id)}
                className="p-3 bg-bmu-blue text-white rounded-xl hover:bg-opacity-90 disabled:opacity-50"
                disabled={savingId === s.enrollment_id}
                title={`Save ${courseCode}`}
              >
                {savingId === s.enrollment_id ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}