'use client'

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Search, Filter, Eye, Inbox } from 'lucide-react';

interface Student {
  id: string;
  student_name: string; // Matched to SQL schema
  matric_no: string;    // Matched to SQL schema
  faculty: string;
  department: string;
  created_at: string;
  status: string;
}

export default function StudentRegistryTable() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Fetch real data from Supabase
  const fetchStudents = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      setStudents(data as Student[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchStudents();

    // 2. REAL-TIME: Listen for new enrollments automatically
    const channel = supabase
      .channel('realtime_students')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'students' }, (payload) => {
        setStudents((prev) => [payload.new as Student, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredStudents = students.filter(s => 
    s.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.matric_no?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search verified records..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-teal-50 rounded-full border border-teal-100">
           <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span>
           <span className="text-[10px] font-bold text-teal-700 uppercase">Live Database Connection</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-100 bg-slate-50/30">
              <th className="px-6 py-4 font-semibold">Student Identity</th>
              <th className="px-6 py-4 font-semibold">Departmental Data</th>
              <th className="px-6 py-4 font-semibold">Verification</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-100 rounded" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                  <td className="px-6 py-4"><div className="h-8 w-8 bg-slate-100 rounded-full ml-auto" /></td>
                </tr>
              ))
            ) : filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <tr key={student.id} className="group hover:bg-teal-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900 uppercase">{student.student_name}</p>
                    <p className="text-xs font-mono text-teal-600 font-medium">{student.matric_no}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-700 font-medium">{student.department}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{student.faculty}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      student.status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {student.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-teal-600 transition-all">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Inbox className="w-10 h-10 opacity-20 mb-4" />
                    <p className="text-sm font-bold uppercase tracking-widest">No Records Found</p>
                    <p className="text-xs mt-1">Start a scan to populate the registry.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

