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
  Building2,
  School,
  ArrowRightLeft,
  AlertTriangle,
} from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Lecturer = {
  id: string
  full_name: string | null
  staff_id?: string | null
  title?: string | null
  department_name?: string | null
  faculty_name?: string | null
  is_verified?: boolean | null
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
  lecturer?: {
    id: string
    full_name: string | null
    staff_id?: string | null
  } | null
}

type AssignmentModalProps = {
  lecturer: Lecturer
  availableOfferings: CourseOffering[]
  onClose: () => void
}

function formatLecturerName(lecturer: Lecturer) {
  const title = lecturer.title?.trim()
  const fullName = lecturer.full_name?.trim() || 'Unnamed Lecturer'
  return title ? `${title} ${fullName}` : fullName
}

function formatOfferingLabel(offering: CourseOffering) {
  const course = offering.courses
  return `${course?.code ?? 'COURSE'} • ${offering.level}L • ${offering.semester} • ${offering.session}`
}

export default function AssignmentModal({
  lecturer,
  availableOfferings,
  onClose,
}: AssignmentModalProps) {
  const supabase = createSupabaseBrowserClient()
  const router = useRouter()

  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')
  const [actionMessage, setActionMessage] = useState('')

  const lecturerOfferings = useMemo(
    () => availableOfferings.filter((offering) => offering.lecturer_id === lecturer.id),
    [availableOfferings, lecturer.id]
  )

  const assignedCount = lecturerOfferings.length
  const unassignedCount = availableOfferings.filter((offering) => !offering.lecturer_id).length
  const occupiedByOthersCount = availableOfferings.filter(
    (offering) => offering.lecturer_id && offering.lecturer_id !== lecturer.id
  ).length

  const toggleAssignment = async (offering: CourseOffering) => {
    const isAssignedToThisLecturer = offering.lecturer_id === lecturer.id
    const nextLecturerId = isAssignedToThisLecturer ? null : lecturer.id
    const course = offering.courses

    setActionError('')
    setActionMessage('')

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
        const readable =
          error.message ||
          error.details ||
          error.hint ||
          'Failed to update lecturer assignment.'
        setActionError(readable)
        console.error('ASSIGNMENT MODAL ERROR:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        return
      }

      setActionMessage(
        isAssignedToThisLecturer
          ? `${course?.code ?? 'This offering'} was unassigned from ${formatLecturerName(lecturer)}.`
          : `${formatLecturerName(lecturer)} was assigned to ${course?.code ?? 'this offering'}.`
      )

      router.refresh()
    } catch (error) {
      const readable =
        error instanceof Error ? error.message : 'Unexpected assignment error.'
      setActionError(readable)
      console.error('ASSIGNMENT MODAL UNEXPECTED ERROR:', error)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-5xl overflow-hidden rounded-[3rem] bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 p-8">
          <div>
            <h2 className="text-xl font-black uppercase italic text-slate-900">
              Manage Lecturer Allocation
            </h2>
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">
              HOD-controlled offering assignment
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white p-3 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close allocation modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-8 p-8 xl:grid-cols-[360px_1fr]">
          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <UserCheck size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                    Target Lecturer
                  </p>
                  <h3 className="text-lg font-black leading-tight text-slate-900">
                    {formatLecturerName(lecturer)}
                  </h3>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                  <Users size={16} className="mt-0.5 text-slate-500" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Staff ID
                    </p>
                    <p className="font-semibold text-slate-800">
                      {lecturer.staff_id || 'ID pending'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                  <Building2 size={16} className="mt-0.5 text-slate-500" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Home Department
                    </p>
                    <p className="font-semibold text-slate-800">
                      {lecturer.department_name || 'Department not loaded'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                  <School size={16} className="mt-0.5 text-slate-500" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Faculty
                    </p>
                    <p className="font-semibold text-slate-800">
                      {lecturer.faculty_name || 'Faculty not loaded'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                  <CheckCircle2 size={16} className="mt-0.5 text-slate-500" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Verification State
                    </p>
                    <p
                      className={`font-semibold ${
                        lecturer.is_verified ? 'text-green-700' : 'text-amber-700'
                      }`}
                    >
                      {lecturer.is_verified ? 'Verified lecturer' : 'Not verified'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
                <div className="flex items-start gap-3">
                  <ArrowRightLeft size={16} className="mt-0.5" />
                  <div>
                    <p className="font-black uppercase tracking-wide text-blue-900">
                      Cross-department teaching
                    </p>
                    <p className="mt-1">
                      Assigning this lecturer here does not change their home department. It only
                      sets teaching responsibility on the selected offering.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <StatCard
                icon={<BookPlus size={18} />}
                label="Assigned Here"
                value={assignedCount}
                tone="green"
              />
              <StatCard
                icon={<Layers3 size={18} />}
                label="Unassigned Offerings"
                value={unassignedCount}
                tone="amber"
              />
              <StatCard
                icon={<CalendarDays size={18} />}
                label="Held By Others"
                value={occupiedByOthersCount}
                tone="blue"
              />
            </div>
          </aside>

          <section className="space-y-5">
            <div>
              <h3 className="text-lg font-black text-slate-900">Departmental Offerings</h3>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Assign or unassign this lecturer across your department’s offerings.
              </p>
            </div>

            {actionError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {actionError}
              </div>
            ) : null}

            {actionMessage ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                {actionMessage}
              </div>
            ) : null}

            {!lecturer.is_verified ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                This lecturer is not verified yet. Assignment may be allowed by UI flow, but the
                recommended operational path is to allocate verified lecturers only.
              </div>
            ) : null}

            {availableOfferings.length === 0 ? (
              <div className="rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                  <BookPlus className="text-slate-300" size={24} />
                </div>
                <p className="text-sm font-bold text-slate-500">
                  No departmental offerings are available for assignment.
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Once offerings exist in this department, they will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <th className="px-6 py-4">Course</th>
                        <th className="px-6 py-4">Level</th>
                        <th className="px-6 py-4">Semester / Session</th>
                        <th className="px-6 py-4">Students</th>
                        <th className="px-6 py-4">Current Lecturer</th>
                        <th className="px-6 py-4">Action</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-50">
                      {availableOfferings.map((offering) => {
                        const isAssignedToThisLecturer = offering.lecturer_id === lecturer.id
                        const isAssignedToAnotherLecturer =
                          !!offering.lecturer_id && offering.lecturer_id !== lecturer.id
                        const isWorking = loadingId === offering.id
                        const course = offering.courses

                        return (
                          <tr key={offering.id} className="align-top">
                            <td className="px-6 py-5">
                              <p className="text-sm font-black text-slate-900">
                                {course?.code ?? 'COURSE'}
                              </p>
                              <p className="mt-1 text-sm font-medium text-slate-600">
                                {course?.title ?? 'Untitled Course'}
                              </p>
                              <p className="mt-1 text-xs font-semibold text-slate-400">
                                {course?.unit ?? 0} unit(s) • {formatOfferingLabel(offering)}
                              </p>
                            </td>

                            <td className="px-6 py-5 text-sm font-semibold text-slate-700">
                              {offering.level}L
                            </td>

                            <td className="px-6 py-5 text-sm font-semibold text-slate-700">
                              <div>{offering.semester}</div>
                              <div className="text-xs text-slate-400">{offering.session}</div>
                            </td>

                            <td className="px-6 py-5 text-sm font-semibold text-slate-700">
                              {offering.registration_count}
                            </td>

                            <td className="px-6 py-5">
                              {isAssignedToThisLecturer ? (
                                <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700">
                                  Assigned to this lecturer
                                </span>
                              ) : isAssignedToAnotherLecturer ? (
                                <div className="space-y-1">
                                  <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                                    Assigned elsewhere
                                  </span>
                                  <p className="text-xs font-medium text-slate-500">
                                    Reassigning will replace the current lecturer on this offering.
                                  </p>
                                </div>
                              ) : (
                                <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                                  Unassigned
                                </span>
                              )}
                            </td>

                            <td className="px-6 py-5">
                              <button
                                type="button"
                                onClick={() => void toggleAssignment(offering)}
                                disabled={isWorking}
                                className={`inline-flex min-w-[150px] items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.15em] transition ${
                                  isAssignedToThisLecturer
                                    ? 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                                    : 'bg-slate-900 text-white hover:bg-blue-700'
                                } ${isWorking ? 'cursor-not-allowed opacity-60' : ''}`}
                              >
                                {isWorking ? (
                                  <>
                                    <Loader2 size={14} className="animate-spin" />
                                    Processing
                                  </>
                                ) : isAssignedToThisLecturer ? (
                                  <>
                                    <X size={14} />
                                    Unassign
                                  </>
                                ) : (
                                  <>
                                    <BookPlus size={14} />
                                    {isAssignedToAnotherLecturer ? 'Reassign' : 'Assign'}
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <div className="flex items-start gap-3">
                <AlertTriangle size={16} className="mt-0.5" />
                <div>
                  <p className="font-black uppercase tracking-wide">Operational note</p>
                  <p className="mt-1">
                    Reassigning an offering changes the lecturer responsible for that offering. Do
                    this before active result-entry work begins, or deliberately as part of an
                    approved departmental correction.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: number
  tone: 'green' | 'amber' | 'blue'
}) {
  const toneMap = {
    green: 'border-green-100 bg-green-50 text-green-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    blue: 'border-blue-100 bg-blue-50 text-blue-700',
  }

  return (
    <div className={`rounded-[1.5rem] border p-4 ${toneMap[tone]}`}>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/80">
        {icon}
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  )
}