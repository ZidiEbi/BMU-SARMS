'use client'

import Link from 'next/link'
import {
  Trash2,
  BookOpen,
  Hash,
  GraduationCap,
  CalendarDays,
  Layers3,
  UserCheck,
  Send,
  Archive,
  Loader2,
  Users,
  AlertTriangle,
  Undo2,
  ArrowRight,
} from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

type RelatedCourse = {
  id: string
  code: string
  title: string
  unit: number
}

type RelatedLecturer = {
  id: string
  full_name: string | null
  staff_id: string | null
}

type CourseOffering = {
  id: string
  level: string
  semester: string
  session: string
  status: string
  created_at?: string | null
  course_id: string
  department_id: string
  lecturer_id?: string | null
  courses: RelatedCourse | null
  lecturer?: RelatedLecturer | null
  course_registrations?: { id: string }[] | null
}

export default function CourseList({ offerings }: { offerings: CourseOffering[] }) {
  const supabase = createBrowserClient()
  const router = useRouter()
  const pathname = usePathname()
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [workingAction, setWorkingAction] = useState<
    'publish' | 'unpublish' | 'archive' | 'delete' | null
  >(null)

  useEffect(() => {
    console.log('📋 CourseList mounted on:', pathname)
    console.log('📋 HOD offerings payload:', offerings)
  }, [pathname, offerings])

  const handleDelete = async (offering: CourseOffering) => {
    const course = offering.courses
    const registrationCount = offering.course_registrations?.length ?? 0

    if (offering.status !== 'draft') {
      alert('Only draft offerings can be deleted. Unpublish first if needed.')
      return
    }

    if (registrationCount > 0) {
      alert('This offering already has registered students. Do not delete it.')
      return
    }

    const confirmed = confirm(
      `Delete ${course?.code || 'this offering'} permanently? This should only be done for empty draft/test offerings.`
    )

    if (!confirmed) return

    try {
      setWorkingId(offering.id)
      setWorkingAction('delete')

      const { error } = await supabase
        .from('course_offerings')
        .delete()
        .eq('id', offering.id)

      if (error) {
        alert(error.message)
        return
      }

      router.refresh()
    } finally {
      setWorkingId(null)
      setWorkingAction(null)
    }
  }

  const handlePublish = async (offering: CourseOffering) => {
    const course = offering.courses

    if (!offering.lecturer_id) {
      alert('Assign a lecturer before publishing this offering.')
      return
    }

    const confirmed = confirm(
      `Publish ${course?.code || 'this offering'} for ${offering.semester}, ${offering.session}?`
    )

    if (!confirmed) return

    try {
      setWorkingId(offering.id)
      setWorkingAction('publish')

      const { error } = await supabase
        .from('course_offerings')
        .update({
          status: 'published',
          updated_at: new Date().toISOString(),
        })
        .eq('id', offering.id)

      if (error) {
        alert(error.message)
        return
      }

      router.refresh()
    } finally {
      setWorkingId(null)
      setWorkingAction(null)
    }
  }

  const handleUnpublish = async (offering: CourseOffering) => {
    const course = offering.courses

    const confirmed = confirm(
      `Move ${course?.code || 'this offering'} back to draft so it can be modified?`
    )

    if (!confirmed) return

    try {
      setWorkingId(offering.id)
      setWorkingAction('unpublish')

      const { error } = await supabase
        .from('course_offerings')
        .update({
          status: 'draft',
          updated_at: new Date().toISOString(),
        })
        .eq('id', offering.id)

      if (error) {
        alert(error.message)
        return
      }

      router.refresh()
    } finally {
      setWorkingId(null)
      setWorkingAction(null)
    }
  }

  const handleArchive = async (offering: CourseOffering) => {
    const course = offering.courses

    const confirmed = confirm(
      `Archive ${course?.code || 'this offering'}? Archived offerings are treated as historical records.`
    )

    if (!confirmed) return

    try {
      setWorkingId(offering.id)
      setWorkingAction('archive')

      const { error } = await supabase
        .from('course_offerings')
        .update({
          status: 'archived',
          archived_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', offering.id)

      if (error) {
        alert(error.message)
        return
      }

      router.refresh()
    } finally {
      setWorkingId(null)
      setWorkingAction(null)
    }
  }

  if (!offerings || offerings.length === 0) {
    return (
      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center">
        <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
          <GraduationCap className="text-slate-300" size={24} />
        </div>
        <p className="text-slate-500 font-bold text-sm">No course offerings registered yet.</p>
        <p className="text-slate-400 text-xs mt-1">
          Registry-created offerings will appear here for lecturer assignment and publishing.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <BookOpen size={16} />
          </div>
          <h3 className="font-black uppercase text-xs tracking-widest text-slate-700">
            Departmental Offerings
          </h3>
        </div>

        <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full uppercase">
          {offerings.length} Offering{offerings.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">
              <th className="px-8 py-5">Code</th>
              <th className="px-8 py-5">Course Title</th>
              <th className="px-8 py-5">Level</th>
              <th className="px-8 py-5">Units</th>
              <th className="px-8 py-5">Semester / Session</th>
              <th className="px-8 py-5">Students</th>
              <th className="px-8 py-5">Lecturer</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-50">
            {offerings.map((offering) => {
              const course = offering.courses
              const lecturer = offering.lecturer
              const registrationCount = offering.course_registrations?.length ?? 0
              const isWorking = workingId === offering.id

              const canPublish = offering.status === 'draft' && !!offering.lecturer_id
              const canUnpublish = offering.status === 'published'
              const canArchive = offering.status === 'published'
              const canDelete = offering.status === 'draft' && registrationCount === 0
              const hasMissingMetadata = !course?.title || !course?.unit

              return (
                <tr key={offering.id} className="hover:bg-blue-50/20 transition-colors group align-top">
                  <td className="px-8 py-4">
                    <Link
                      href={`/dashboard/hod/offerings/${offering.id}`}
                      className="inline-flex items-center gap-2 font-black text-blue-600 font-mono text-sm tracking-tighter hover:text-blue-800"
                    >
                      {course?.code || '—'}
                      <ArrowRight size={14} />
                    </Link>
                  </td>

                  <td className="px-8 py-4">
                    <div className="space-y-2">
                      <Link
                        href={`/dashboard/hod/offerings/${offering.id}`}
                        className="font-bold text-slate-700 text-sm italic hover:text-slate-900"
                      >
                        {course?.title || 'Untitled Course'}
                      </Link>

                      {hasMissingMetadata && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded-lg">
                          <AlertTriangle size={11} />
                          Missing course metadata
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-8 py-4">
                    <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2.5 py-1 rounded-lg border border-slate-200">
                      {offering.level} LEVEL
                    </span>
                  </td>

                  <td className="px-8 py-4">
                    <div className="flex items-center gap-1.5 text-slate-500 font-black text-xs uppercase">
                      <Hash size={14} className="text-blue-400" />
                      {course?.unit ?? '—'} Units
                    </div>
                  </td>

                  <td className="px-8 py-4">
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                        <Layers3 size={13} className="text-blue-400" />
                        {offering.semester}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
                        <CalendarDays size={13} className="text-slate-400" />
                        {offering.session}
                      </div>
                    </div>
                  </td>

                  <td className="px-8 py-4">
                    <div className="flex flex-col gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <Users size={14} className="text-blue-500" />
                        {registrationCount} registered
                      </span>

                      {registrationCount === 0 ? (
                        <span className="text-[9px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg inline-flex w-fit">
                          Empty offering
                        </span>
                      ) : (
                        <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg inline-flex w-fit">
                          Registry populated
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-8 py-4">
                    {lecturer ? (
                      <div className="flex flex-col gap-1">
                        <div className="inline-flex items-center gap-1.5 text-blue-700 font-bold text-xs">
                          <UserCheck size={13} className="text-blue-500" />
                          {lecturer.full_name || 'Unnamed Lecturer'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
                          {lecturer.staff_id || 'Staff ID Pending'}
                        </div>
                      </div>
                    ) : (
                      <span className="bg-amber-50 text-amber-700 text-[10px] font-black px-2.5 py-1 rounded-lg border border-amber-200 uppercase">
                        Unassigned
                      </span>
                    )}
                  </td>

                  <td className="px-8 py-4">
                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase ${
                        offering.status === 'published'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : offering.status === 'draft'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {offering.status}
                    </span>
                  </td>

                  <td className="px-8 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      {canPublish && (
                        <button
                          onClick={() => handlePublish(offering)}
                          disabled={isWorking}
                          className="inline-flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50"
                        >
                          {isWorking && workingAction === 'publish' ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Send size={14} />
                          )}
                          Publish
                        </button>
                      )}

                      {canUnpublish && (
                        <button
                          onClick={() => handleUnpublish(offering)}
                          disabled={isWorking}
                          className="inline-flex items-center gap-1.5 bg-amber-500 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all disabled:opacity-50"
                        >
                          {isWorking && workingAction === 'unpublish' ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Undo2 size={14} />
                          )}
                          Unpublish
                        </button>
                      )}

                      {canArchive && (
                        <button
                          onClick={() => handleArchive(offering)}
                          disabled={isWorking}
                          className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all disabled:opacity-50"
                        >
                          {isWorking && workingAction === 'archive' ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Archive size={14} />
                          )}
                          Archive
                        </button>
                      )}

                      {canDelete && (
                        <button
                          onClick={() => handleDelete(offering)}
                          disabled={isWorking}
                          className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          {isWorking && workingAction === 'delete' ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      )}
                    </div>

                    {offering.status === 'draft' && !offering.lecturer_id && (
                      <p className="text-[9px] text-amber-600 font-bold uppercase tracking-wide mt-2">
                        Assign lecturer to publish
                      </p>
                    )}

                    {offering.status === 'published' && registrationCount === 0 && (
                      <p className="text-[9px] text-red-600 font-bold uppercase tracking-wide mt-2">
                        Published but empty
                      </p>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}