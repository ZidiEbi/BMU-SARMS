import LecturerCourseCard from '@/components/LecturerCourseCard';
import { Plus, Search, Calendar, GraduationCap } from 'lucide-react';

export default function LecturerPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Lecturer Portal</h1>
          <p className="text-slate-500 mt-1">Manage your courses, attendance, and student performance.</p>
        </div>
        <button className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-teal-600 transition-all shadow-lg shadow-slate-200">
          <Plus className="w-4 h-4" />
          Create New Session
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-6 rounded-[2rem]">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Semester</p>
          <p className="text-lg font-bold text-slate-800">2025/2026 First</p>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-[2rem]">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Courses</p>
          <p className="text-lg font-bold text-slate-800">4 Assigned</p>
        </div>
      </div>

      {/* Course Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-teal-600" />
            Assigned Courses
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 ring-teal-500/20" placeholder="Filter courses..." />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Your teammate will map through real course data here */}
          <LecturerCourseCard code="CHM 101" title="Introduction to Chemistry" studentCount={142} nextLecture="Mon 10:00 AM" />
          <LecturerCourseCard code="CHM 102" title="General Organic Chemistry" studentCount={128} nextLecture="Wed 02:00 PM" />
          <LecturerCourseCard code="BIO 101" title="General Biology I" studentCount={210} nextLecture="Fri 08:00 AM" />
        </div>
      </div>
    </div>
  );
}