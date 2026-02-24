'use client'

import { createSupabaseBrowserClient } from '@/lib/supabase/client'
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
  Plus
} from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
// import AssignmentModal from './AssignmentModal' // Ensure the path is correct

export default function StaffManagement({ 
  lecturers, 
  department, 
  assignments,
  allDepartmentCourses // Add this prop to receive all possible courses for the dept
}: { 
  lecturers: any[], 
  department: string,
  assignments: any[],
  allDepartmentCourses: any[]
}) {
  const supabase = createSupabaseBrowserClient()
  const router = useRouter()
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null)

  const pendingStaff = lecturers.filter(s => !s.is_verified)
  const confirmedStaff = lecturers.filter(s => s.is_verified)

  const handleAction = async (id: string, updates: any, actionName: string) => {
    if (actionName === 'remove' && !confirm("Are you sure? This will unverify the staff and clear their department status.")) {
      return
    }

    setProcessingId(id)
    const { error } = await supabase.from('profiles').update(updates).eq('id', id)
    
    if (error) {
      alert(`Error: ${error.message}`)
    } else {
      router.refresh()
    }
    setProcessingId(null)
  }

  return (
    <div className="space-y-8 mt-8">
      
      {/* MODAL OVERLAY */}
      {selectedStaff && (
        <AssignmentModal 
          lecturer={selectedStaff}
          availableCourses={allDepartmentCourses}
          currentAssignments={assignments}
          onClose={() => setSelectedStaff(null)}
        />
      )}

      {/* SECTION 1: VERIFICATION REQUESTS */}
      {pendingStaff.length > 0 && (
        <div className="bg-amber-50/40 p-8 rounded-[2.5rem] border border-amber-100 shadow-sm border-dashed no-print">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 uppercase">Staff Join Requests</h2>
              <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">Awaiting Departmental Confirmation</p>
            </div>
          </div>

          <div className="grid gap-4">
            {pendingStaff.map((staff) => (
              <StaffRow 
                key={staff.id} 
                staff={staff} 
                isPending={true} 
                onVerify={() => handleAction(staff.id, { is_verified: true }, 'verify')}
                onRemove={() => handleAction(staff.id, { department: null, faculty: null, is_verified: false, profile_completed: false }, 'remove')}
                loading={processingId === staff.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: VERIFIED STAFF LIST */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm print:border-none">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-xl text-blue-600 no-print">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Departmental Staff List</h2>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{department} Academic Faculty</p>
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
            confirmedStaff.map((staff) => (
              <StaffRow 
                key={staff.id} 
                staff={staff} 
                isPending={false} 
                assignments={assignments}
                onAssign={() => setSelectedStaff(staff)} // Trigger Modal
                onRemove={() => handleAction(staff.id, { is_verified: false, profile_completed: false }, 'remove')}
                loading={processingId === staff.id}
              />
            ))
          ) : (
            <div className="text-center py-20 border-2 border-dashed border-slate-50 rounded-[2rem]">
              <p className="text-slate-300 font-bold text-sm italic uppercase tracking-widest">No verified staff members found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StaffRow({ staff, isPending, onVerify, onRemove, onAssign, loading, assignments }: any) {
  const lecturerCourses = assignments?.filter((a: any) => a.lecturer_id === staff.id) || []

  return (
    <div className="group relative flex flex-col bg-white rounded-[2rem] border border-slate-100 hover:border-blue-400/40 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className={`w-16 h-16 rounded-[1.5rem] overflow-hidden border-2 ${isPending ? 'border-amber-200' : 'border-slate-50'}`}>
              {staff.avatar_url ? (
                <img src={staff.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-200">
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
              {staff.title} {staff.full_name}
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[9px] text-slate-400 font-black tracking-widest bg-slate-50 px-2 py-1 rounded-lg">
                ID: {staff.staff_id || '---'}
              </span>
              {!isPending && (
                <button 
                  onClick={onAssign}
                  className={`flex items-center gap-1 text-[9px] font-black uppercase px-2 py-1 rounded-lg transition-all ${
                    lecturerCourses.length === 0 ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                  }`}
                >
                  <BookOpen size={10} /> {lecturerCourses.length} Courses Assigned <Plus size={8} strokeWidth={4} className="ml-1" />
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
              className="bg-green-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <><Check size={14} strokeWidth={3} /> Verify</>}
            </button>
          ) : (
            <button 
              onClick={onRemove}
              disabled={loading}
              className="opacity-0 group-hover:opacity-100 bg-slate-50 text-slate-300 p-3 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <UserMinus size={18} />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}