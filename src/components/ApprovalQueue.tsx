'use client'
import { Check, X, FileText, ExternalLink } from 'lucide-react';

export default function ApprovalQueue() {
  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-3">
        <div className="bg-amber-100 p-2 rounded-lg text-amber-600"><FileText className="w-4 h-4" /></div>
        <p className="text-xs font-bold text-amber-800 uppercase tracking-tight">Attention Required: 12 Students awaiting departmental verification.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden">
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card Example */}
          <div className="bg-white border-2 border-slate-50 p-6 rounded-[2rem] hover:border-teal-500 transition-all shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Registry Scanned</div>
              <ExternalLink className="w-4 h-4 text-slate-300 cursor-pointer hover:text-teal-600" />
            </div>
            <div className="mb-6">
              <h4 className="text-lg font-black text-slate-900 uppercase">Awusu Godsgift</h4>
              <p className="font-mono text-xs text-teal-600 font-bold tracking-widest">202330111412IA</p>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-teal-100 hover:bg-teal-700 transition-all">
                <Check className="w-3 h-3" /> Approve
              </button>
              <button className="flex-1 bg-white border-2 border-slate-100 text-slate-400 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all">
                <X className="w-3 h-3" /> Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}