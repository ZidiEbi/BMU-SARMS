'use client'

import {
  UserMinus,
  ShieldAlert,
  Loader2,
  Users,
  UserCircle,
  BookOpen,
  Check,
  Printer,
  UserCheck,
  Plus,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import AssignmentModal from './AssignmentModal'
import {
  verifyLecturerForDepartmentAction,
  removeLecturerFromDepartmentAction,
} from '@/lib/actions/staff-actions'

type Lecturer = {
  id: string
  full_name: string | null
  staff_id: string | null
  role?: string | null
  is_verified: boolean | null
  title?: string | null
  avatar_url?: string | null
  department_id?: string | null
  faculty_id?: string | null
  requested_department_id?: string | null
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

type StaffManagementProps = {
  lecturers: Lecturer[]
  department: string
  offerings: CourseOffering[]
}

export default function StaffManagement({
  lecturers,
  department,
  offerings,
}: StaffManagementProps) {
  const router = useRouter()
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<Lecturer | null>(null)

  const pendingStaff = useMemo(
    () =>
      lecturers.filter(
        (staff) =>
          !staff.is_verified &&
          !staff.department_id &&
          !!staff.requested_department_id
      ),
    [lecturers]
  )

  const confirmedStaff = useMemo(
    () => lecturers.filter((staff) => !!staff.is_verified && !!staff.department_id),
    [lecturers]
  )

  const handleVerify = async (id: string) => {
    try {
      setProcessingId(id)
      await verifyLecturerForDepartmentAction(id)
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Verification failed.'
      alert(`Error: ${message}`)
    } finally {
      setProcessingId(null)
    }
  }

  const handleRemove = async (id: string, mode: 'pending' | 'confirmed') => {
    if (
      mode === 'pending' &&
      !confirm('Are you sure? This will clear the pending department request for this lecturer.')
    ) {
      return
    }

    if (
      mode === 'confirmed' &&
      !confirm('Are you sure you want to remove this lecturer from the department? Their course allocations may need reassignment.')
    ) {
      return
    }

    try {
      setProcessingId(id)
      await removeLecturerFromDepartmentAction(id, mode)
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Removal failed.'
      alert(`Error: ${message}`)
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-8 mt-8">
      {selectedStaff && (
        <AssignmentModal
          lecturer={selectedStaff}
          availableOfferings={offerings}
          onClose={() => setSelectedStaff(null)}
        />
      )}

      {pendingStaff.length > 0 && (
        <div className="bg-amber-50/40 p-8 rounded-[2.5rem] border border-amber-100 shadow-sm border-dashed no-print animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 uppercase">
                Staff Join Requests
              </h2>
              <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">
                Awaiting Departmental Confirmation
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {pendingStaff.map((staff) => (
              <StaffRow
                key={staff.id}
                staff={staff}
                isPending={true}
                onVerify={() => handleVerify(staff.id)}
                onRemove={() => handleRemove(staff.id, 'pending')}
                loading={processingId === staff.id}
                lecturerOfferingsCount={0}
              />
            ))}
          </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm print:border-none transition-all">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-xl text-blue-600 no-print">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                Departmental Staff List
              </h2>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                {department} Academic Faculty
              </p>
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="no-print flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 transition-all shadow-lg"
          >
            <Printer size={14} /> Print Registry
          </button>
        </div>

        <div className="grid gap-4">
          {confirmedStaff.length > 0 ? (
            confirmedStaff.map((staff) => {
              const lecturerOfferings = offerings.filter(
                (offering) => offering.lecturer_id === staff.id
              )

              return (
                <StaffRow
                  key={staff.id}
                  staff={staff}
                  isPending={false}
                  onAssign={() => setSelectedStaff(staff)}
                  onRemove={() => handleRemove(staff.id, 'confirmed')}
                  loading={processingId === staff.id}
                  lecturerOfferingsCount={lecturerOfferings.length}
                />
              )
            })
          ) : (
            <div className="text-center py-20 border-2 border-dashed border-slate-50 rounded-[2rem]">
              <p className="text-slate-300 font-bold text-sm italic uppercase tracking-widest">
                No verified staff members found
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

type StaffRowProps = {
  staff: Lecturer
  isPending: boolean
  onVerify?: () => void
  onRemove?: () => void
  onAssign?: () => void
  loading?: boolean
  lecturerOfferingsCount: number
}

function StaffRow({
  staff,
  isPending,
  onVerify,
  onRemove,
  onAssign,
  loading = false,
  lecturerOfferingsCount,
}: StaffRowProps) {
  const [imageError, setImageError] = useState(false)

  const hasValidAvatar =
    !!staff.avatar_url &&
    staff.avatar_url !== 'null' &&
    staff.avatar_url !== 'undefined'

  return (
    <div className="group relative flex flex-col bg-white rounded-[2rem] border border-slate-100 hover:border-blue-400/40 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div
              className={`w-16 h-16 rounded-[1.5rem] overflow-hidden border-2 ${
                isPending ? 'border-amber-200' : 'border-slate-50'
              }`}
            >
              {hasValidAvatar && !imageError ? (
                <img
                  src={staff.avatar_url as string}
                  alt={`${staff.full_name || 'Lecturer'}'s avatar`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    setImageError(true)
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden border-2 bg-slate-50 flex items-center justify-center text-slate-200">
                  <UserCircle size={32} />
                </div>
              )}
            </div>

            {!isPending && (
              <div className="absolute -top-1 -right-1 bg-blue-600 border-2 border-white w-6 h-6 rounded-full flex items-center justify-center shadow-sm">
                <UserCheck size={12} className="text-white" strokeWidth={3} />
              </div>
            )}
          </div>

          <div>
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">
              {[staff.title, staff.full_name].filter(Boolean).join(' ')}
            </h3>

            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-[9px] text-slate-400 font-black tracking-widest bg-slate-50 px-2 py-1 rounded-lg">
                ID: {staff.staff_id || '---'}
              </span>

              {!isPending && (
                <button
                  onClick={onAssign}
                  className={`flex items-center gap-1 text-[9px] font-black uppercase px-2 py-1 rounded-lg transition-all ${
                    lecturerOfferingsCount === 0
                      ? 'text-amber-600 bg-amber-50 hover:bg-amber-100 animate-pulse'
                      : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                  }`}
                >
                  <BookOpen size={10} />
                  {lecturerOfferingsCount} Offering
                  {lecturerOfferingsCount === 1 ? '' : 's'} Assigned
                  <Plus size={8} strokeWidth={4} className="ml-1" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 no-print">
          {isPending ? (
            <button
              onClick={onVerify}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 shadow-md hover:shadow-green-200"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <Check size={14} strokeWidth={3} /> Verify
                </>
              )}
            </button>
          ) : (
            <button
              onClick={onRemove}
              disabled={loading}
              className="opacity-0 group-hover:opacity-100 bg-slate-50 text-slate-300 p-3 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all active:scale-95"
              title="Remove lecturer from department"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <UserMinus size={18} />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}