'use client'
import { BookOpen, Users, Clock, ArrowRight } from 'lucide-react';

interface CourseProps {
  code: string;
  title: string;
  studentCount: number;
  nextLecture: string;
}

export default function LecturerCourseCard({ code, title, studentCount, nextLecture }: CourseProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-[2rem] p-6 hover:shadow-xl hover:border-teal-500 transition-all group cursor-pointer">
      <div className="flex justify-between items-start mb-6">
        <div className="bg-teal-50 p-3 rounded-2xl text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
          <BookOpen className="w-6 h-6" />
        </div>
        <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Active</span>
      </div>
      
      <div className="space-y-1 mb-6">
        <h3 className="text-xl font-black text-slate-800 tracking-tight">{code}</h3>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-6">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-600">{studentCount} Students</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-600">{nextLecture}</span>
        </div>
      </div>
    </div>
  );
}