'use client'

import { useState } from 'react'
import { Save, AlertCircle } from 'lucide-react'

export default function ResultEntry({ student, courseCode, units }: any) {
  const [ca, setCa] = useState(0)
  const [exam, setExam] = useState(0)
  const [absentStatus, setAbsentStatus] = useState('none') // none, with_approval, without_approval

  const total = ca + exam
  
  // BMU 5-Point Grading Logic
  const getGrade = (score: number) => {
    if (absentStatus !== 'none') return 'ABS'
    if (score >= 70) return 'A'
    if (score >= 60) return 'B'
    if (score >= 50) return 'C'
    return 'F'
  }

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center justify-between gap-4">
      <div className="flex-1">
        <p className="text-[10px] font-black text-slate-400 uppercase">{student.matricNo}</p>
        <h4 className="font-bold text-slate-900">{student.name}</h4>
      </div>

      <div className="flex gap-4 items-center">
        {/* CA Input */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black text-slate-400 uppercase px-1">CA (30)</label>
          <input 
            type="number" 
            className="w-16 bg-slate-50 border-none rounded-xl p-2 font-bold text-center"
            value={ca}
            onChange={(e) => setCa(Number(e.target.value))}
          />
        </div>

        {/* Exam Input */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black text-slate-400 uppercase px-1">Exam (70)</label>
          <input 
            type="number" 
            className="w-16 bg-slate-50 border-none rounded-xl p-2 font-bold text-center"
            value={exam}
            onChange={(e) => setExam(Number(e.target.value))}
          />
        </div>

        {/* Automated Result Display */}
        <div className="flex flex-col items-center px-4">
          <span className="text-[9px] font-black text-bmu-blue uppercase">Total</span>
          <span className="text-lg font-black text-slate-900">{absentStatus !== 'none' ? '0' : total}</span>
        </div>

        <div className="flex flex-col items-center px-4 border-x border-slate-100">
          <span className="text-[9px] font-black text-bmu-maroon uppercase">Grade</span>
          <span className="text-lg font-black text-bmu-maroon">{getGrade(total)}</span>
        </div>

        {/* Absence/Special Status Select */}
        <select 
          className="bg-slate-50 border-none rounded-xl text-[10px] font-bold p-2"
          value={absentStatus}
          onChange={(e) => setAbsentStatus(e.target.value)}
        >
          <option value="none">Present</option>
          <option value="with_approval">ABS (Approved)</option>
          <option value="without_approval">ABS (Unapproved)</option>
        </select>

        <button className="p-3 bg-bmu-blue text-white rounded-xl hover:bg-opacity-90">
          <Save size={18} />
        </button>
      </div>
    </div>
  )
}