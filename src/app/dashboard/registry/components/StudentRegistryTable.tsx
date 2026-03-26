'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Search, Eye, Inbox } from 'lucide-react'

interface Student {
  id: string
  full_name: string | null
  matric_number: string | null
  department_id: string | null
  admission_year: number | null
  created_at: string
  sex: 'M' | 'F' | null
}

interface DepartmentRow {
  id: string
  name: string
  faculty_id: string | null
  faculties?: {
    id: string
    name: string
  } | null
}

export default function StudentRegistryTable() {
  const supabase = useMemo(() => createBrowserClient(), [])

  const [students, setStudents] = useState<Student[]>([])
  const [departments, setDepartments] = useState<Record<string, DepartmentRow>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchRegistryData = async () => {
    setIsLoading(true)

    const [{ data: studentData, error: studentError }, { data: deptData, error: deptError }] =
      await Promise.all([
        supabase
          .from('students')
          .select('id, full_name, matric_number, department_id, admission_year, created_at, sex')
          .order('created_at', { ascending: false }),
        supabase
          .from('departments')
          .select(`
            id,
            name,
            faculty_id,
            faculties:faculty_id (
              id,
              name
            )
          `)
          .order('name', { ascending: true }),
      ])

    if (!studentError) {
      setStudents((studentData || []) as Student[])
    }

    if (!deptError && deptData) {
      const mapped = (deptData as unknown as DepartmentRow[]).reduce<Record<string, DepartmentRow>>(
        (acc, dept) => {
          acc[dept.id] = dept
          return acc
        },
        {}
      )
      setDepartments(mapped)
    }

    setIsLoading(false)
  }

  useEffect(() => {
    fetchRegistryData()

    const insertChannel = supabase
      .channel('realtime_students_insert')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'students' }, (payload) => {
        setStudents((prev) => [payload.new as Student, ...prev])
      })
      .subscribe()

    const updateChannel = supabase
      .channel('realtime_students_update')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'students' }, (payload) => {
        setStudents((prev) =>
          prev.map((student) =>
            student.id === payload.new.id ? (payload.new as Student) : student
          )
        )
      })
      .subscribe()

    return () => {
      supabase.removeChannel(insertChannel)
      supabase.removeChannel(updateChannel)
    }
  }, [supabase])

  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    if (!query) return students

    return students.filter((student) => {
      const name = student.full_name?.toLowerCase() || ''
      const matric = student.matric_number?.toLowerCase() || ''
      const deptName = departments[student.department_id || '']?.name?.toLowerCase() || ''
      const facultyName =
        departments[student.department_id || '']?.faculties?.name?.toLowerCase() || ''

      return (
        name.includes(query) ||
        matric.includes(query) ||
        deptName.includes(query) ||
        facultyName.includes(query)
      )
    })
  }, [students, searchTerm, departments])

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search registry records..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 px-3 py-1 bg-teal-50 rounded-full border border-teal-100">
          <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span>
          <span className="text-[10px] font-bold text-teal-700 uppercase">
            Live Database Connection
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-100 bg-slate-50/30">
              <th className="px-6 py-4 font-semibold">Student Identity</th>
              <th className="px-6 py-4 font-semibold">Academic Placement</th>
              <th className="px-6 py-4 font-semibold">Profile Summary</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4">
                    <div className="h-4 w-32 bg-slate-100 rounded" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-24 bg-slate-100 rounded" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-20 bg-slate-100 rounded" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-8 w-8 bg-slate-100 rounded-full ml-auto" />
                  </td>
                </tr>
              ))
            ) : filteredStudents.length > 0 ? (
              filteredStudents.map((student) => {
                const department = student.department_id
                  ? departments[student.department_id]
                  : undefined

                const departmentName = department?.name || 'Unassigned Department'
                const facultyName = department?.faculties?.name || 'Unknown Faculty'

                return (
                  <tr key={student.id} className="group hover:bg-teal-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900 uppercase">
                        {student.full_name || 'Unnamed Student'}
                      </p>
                      <p className="text-xs font-mono text-teal-600 font-medium">
                        {student.matric_number || 'NO MATRIC NUMBER'}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700 font-medium">{departmentName}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">
                        {facultyName}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-green-100 text-green-700">
                          Registered
                        </span>

                        <p className="text-[11px] text-slate-500 font-medium">
                          Admission Year: {student.admission_year || '—'}
                        </p>

                        <p className="text-[11px] text-slate-500 font-medium">
                          Sex: {student.sex || '—'}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-teal-600 transition-all">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })
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
  )
}