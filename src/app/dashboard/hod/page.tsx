'use client'
import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  BookPlus, 
  ClipboardCheck, 
  UserPlus,
  LayoutDashboard,
  Search,
  Filter
} from 'lucide-react';
import CourseAssignmentTable from '@/components/CourseAssignmentTable';
import ApprovalQueue from '@/components/ApprovalQueue';

export default function HODDashboard() {
  const [activeTab, setActiveTab] = useState<'approvals' | 'assignments'>('approvals');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header with Departmental Identity */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-teal-600 text-[10px] font-black text-white px-2 py-1 rounded-md uppercase tracking-tighter">HOD Terminal</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500 text-xs font-bold uppercase">Optometry Department</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight italic">Administrative Oversight</h1>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button className="bg-white border-2 border-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Add Lecturer
          </button>
          <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-teal-600 transition-all shadow-xl shadow-slate-200 flex items-center gap-2">
            <BookPlus className="w-4 h-4" />
            New Course
          </button>
        </div>
      </div>

      {/* Analytics Mini-Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-amber-50 rounded-2xl text-amber-600"><ClipboardCheck className="w-6 h-6" /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Approvals</p>
            <p className="text-2xl font-black text-slate-800">12</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-teal-50 rounded-2xl text-teal-600"><Users className="w-6 h-6" /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff Count</p>
            <p className="text-2xl font-black text-slate-800">08</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-8 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('approvals')}
          className={`pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'approvals' ? 'text-teal-600 border-b-4 border-teal-600' : 'text-slate-400 border-b-4 border-transparent hover:text-slate-600'}`}
        >
          Enrollment Approvals
        </button>
        <button 
          onClick={() => setActiveTab('assignments')}
          className={`pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'assignments' ? 'text-teal-600 border-b-4 border-teal-600' : 'text-slate-400 border-b-4 border-transparent hover:text-slate-600'}`}
        >
          Course Assignments
        </button>
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'approvals' ? <ApprovalQueue /> : <CourseAssignmentTable />}
      </div>
    </div>
  );
}