'use client'

import { useMemo, useState } from 'react'
import {
  X,
  BookPlus,
  Loader2,
  CheckCircle2,
  UserCheck,
  CalendarDays,
  Layers3,
  Users,
} from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Lecturer = {
  id: string
  full_name: string | null
  staff_id?: string | null
}

type CourseOffering = {
  id: string
  level: string
  semester: string
  session: string
  status: string
  lecturer_id?: string | null
  created_at?: string | null
  course_id: string
  department_id: string
  registration_count: number
  courses?: {
    id: string
    code: string
    title: string
    unit: number
  } | null
}

type AssignmentModalProps = {
  lecturer: Lecturer
  availableOfferings: CourseOffering[]
  onClose: () => void
}

export default function AssignmentModal({
  lecturer,
  availableOfferings,
  onClose,
}: AssignmentModalProps) {
  const supabase = createSupabaseBrowserClient()
  const router = useRouter()

  const [loadingId, setLoadingId] = useState<string | null>(null)

  const lecturerOfferings = useMemo(
    () => availableOfferings.filter((offering) => offering.lecturer_id === lecturer.id),
    [availableOfferings, lecturer.id]
  )

  const toggleAssignment = async (offering: CourseOffering) => {
    const isAssignedToThisLecturer = offering.lecturer_id === lecturer.id
    const nextLecturerId = isAssignedToThisLecturer ? null : lecturer.id

    try {
      setLoadingId(offering.id)

      const { error } = await supabase
        .from('course_offerings')
        .update({
          lecturer_id: nextLecturerId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', offering.id)

      if (error) {
        alert(error.message)
        return
      }

      router.refresh()
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase italic">
              Manage Lecturer Allocation
            </h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
              Target: {lecturer.full_name || 'Unnamed Lecturer'}
            </p>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-2">
              {lecturerOfferings.length} offering{lecturerOfferings.length === 1 ? '' : 's'} currently assigned
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-3 hover:bg-white rounded-2xl text-slate-400 hover:text-red-500 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-3">
          {availableOfferings.length > 0 ? (
            availableOfferings.map((offering) => {
              const isAssignedToThisLecturer = offering.lecturer_id === lecturer.id
              const isAssignedToAnotherLecturer =
                !!offering.lecturer_id && offering.lecturer_id !== lecturer.id

              return (
                <div
                  key={offering.id}
                  className={`p-5 rounded-[2rem] border-2 transition-all flex items-center justify-between gap-4 ${
                    isAssignedToThisLecturer
                      ? 'border-blue-600 bg-blue-50/30'
                      : isAssignedToAnotherLecturer
                      ? 'border-amber-200 bg-amber-50/40'
                      : 'border-slate-50 bg-white'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-black text-slate-900 text-sm uppercase">
                      {offering.courses?.code || '—'}: {offering.courses?.title || 'Untitled Course'}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wide">
                      <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
                        {offering.courses?.unit ?? '—'} Units
                      </span>
                      <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <Layers3 size={12} />
                        {offering.level} Level
                      </span>
                      <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <BookPlus size={12} />
                        {offering.semester}
                      </span>
                      <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <CalendarDays size={12} />
                        {offering.session}
                      </span>
                      <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <Users size={12} />
                        {offering.registration_count} students
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-lg ${
                          offering.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700'
                            : offering.status === 'draft'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {offering.status}
                      </span>
                    </div>

                    <div className="mt-3">
                      {isAssignedToThisLecturer ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                          <UserCheck size={12} />
                          Assigned to this lecturer
                        </span>
                      ) : isAssignedToAnotherLecturer ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                          Already assigned elsewhere
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                          Unassigned offering
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    disabled={loadingId === offering.id}
                    onClick={() => toggleAssignment(offering)}
                    className={`shrink-0 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                      isAssignedToThisLecturer
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : isAssignedToAnotherLecturer
                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                        : 'bg-slate-100 text-slate-700 hover:bg-blue-600 hover:text-white'
                    }`}
                  >
                    {loadingId === offering.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : isAssignedToThisLecturer ? (
                      <>
                        <CheckCircle2 size={16} />
                        Unassign
                      </>
                    ) : isAssignedToAnotherLecturer ? (
                      <>
                        <BookPlus size={16} />
                        Reassign
                      </>
                    ) : (
                      <>
                        <BookPlus size={16} />
                        Assign
                      </>
                    )}
                  </button>
                </div>
              )
            })
          ) : (
            <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-[2rem]">
              <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">
                No course offerings available
              </p>
              <p className="text-slate-300 text-xs mt-2">
                Registry-created offerings will appear here for lecturer allocation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}