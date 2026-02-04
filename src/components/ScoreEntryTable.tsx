'use client'
import { useState } from 'react'

interface StudentRecord {
  id: string;
  name: string;
  ca1: number;
  ca2: number;
  exam: number;
}

export default function ScoreEntryTable({ initialData }: { initialData: StudentRecord[] }) {
  const [data, setData] = useState(initialData);

  const updateScore = (id: string, field: keyof StudentRecord, value: string) => {
    const numValue = Math.min(Math.max(parseFloat(value) || 0, 0), field === 'exam' ? 60 : 20);
    
    setData(prev => prev.map(row => 
      row.id === id ? { ...row, [field]: numValue } : row
    ));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b">
          <tr>
            <th className="p-4 font-semibold">Student Name</th>
            <th className="p-4 font-semibold text-center">CA 1 (20)</th>
            <th className="p-4 font-semibold text-center">CA 2 (20)</th>
            <th className="p-4 font-semibold text-center">Exam (60)</th>
            <th className="p-4 font-semibold text-center text-blue-600">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.map(student => (
            <tr key={student.id} className="hover:bg-slate-50/50 transition">
              <td className="p-4 font-medium">{student.name}</td>
              <td className="p-4"><input type="number" className="w-20 mx-auto block border rounded p-1 text-center" onChange={(e) => updateScore(student.id, 'ca1', e.target.value)} /></td>
              <td className="p-4"><input type="number" className="w-20 mx-auto block border rounded p-1 text-center" onChange={(e) => updateScore(student.id, 'ca2', e.target.value)} /></td>
              <td className="p-4"><input type="number" className="w-20 mx-auto block border rounded p-1 text-center" onChange={(e) => updateScore(student.id, 'exam', e.target.value)} /></td>
              <td className="p-4 text-center font-bold text-lg">{student.ca1 + student.ca2 + student.exam}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}