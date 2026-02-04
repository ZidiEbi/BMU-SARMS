'use client'

import React from 'react';
import { CheckCircle2, Printer, X, Share2, ArrowRight } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentData: {
    studentName: string;
    matricNo: string;
    faculty: string;
    department: string;
  } | null;
}

export default function SuccessModal({ isOpen, onClose, studentData }: SuccessModalProps) {
  if (!isOpen || !studentData) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Success Header */}
        <div className="bg-teal-600 p-8 text-center text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white/30">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Enrollment Success</h2>
          <p className="text-teal-100 text-sm mt-1 uppercase font-bold tracking-widest text-[10px]">Registry Record Created</p>
        </div>

        {/* Receipt Body */}
        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-start border-b border-dashed border-slate-200 pb-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Name</p>
                <p className="font-bold text-slate-800 uppercase">{studentData.studentName}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Matric No</p>
                <p className="font-mono font-bold text-teal-600">{studentData.matricNo}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</p>
                <p className="font-bold text-slate-800 text-sm">{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned Department</p>
              <p className="text-xs font-bold text-slate-700">{studentData.faculty}</p>
              <p className="text-[11px] text-slate-500 font-medium">{studentData.department}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => window.print()}
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all text-xs uppercase tracking-widest"
            >
              <Printer className="w-4 h-4" />
              Print Proof of Registration
            </button>
            
            <button 
              onClick={onClose}
              className="w-full bg-white border-2 border-slate-100 text-slate-500 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all text-xs uppercase tracking-widest"
            >
              Next Scan
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}