'use client'
import { User, BookOpen, Settings2, ShieldCheck } from 'lucide-react';

export default function CourseAssignmentTable() {
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
            <th className="px-8 py-6">Course ID</th>
            <th className="px-8 py-6">Assigned Lecturer</th>
            <th className="px-8 py-6">Status</th>
            <th className="px-8 py-6 text-right">Config</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {/* Row Example */}
          <tr className="group hover:bg-slate-50/50 transition-colors">
            <td className="px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-teal-100 group-hover:text-teal-600 transition-colors">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 uppercase">CHM 101</p>
                  <p className="text-[10px] text-slate-400 font-medium tracking-tight">Intro to Chemistry</p>
                </div>
              </div>
            </td>
            <td className="px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-500 uppercase tracking-tighter">DR</div>
                <div>
                  <p className="text-sm font-bold text-slate-700">Dr. Amaechi Peters</p>
                  <p className="text-[10px] text-teal-600 font-bold uppercase tracking-tighter underline cursor-pointer">Reassign</p>
                </div>
              </div>
            </td>
            <td className="px-8 py-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                <ShieldCheck className="w-3 h-3" />
                Staffed
              </span>
            </td>
            <td className="px-8 py-6 text-right">
              <button className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                <Settings2 className="w-4 h-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}