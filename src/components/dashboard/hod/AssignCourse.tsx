// 'use client'

// import { useState } from 'react'
// import { createSupabaseBrowserClient } from '@/lib/supabase/client'
// import { Plus, BookPlus, Loader2, Hash, ShieldCheck } from 'lucide-react'
// import { useRouter } from 'next/navigation'

// type Lecturer = {
//   id: string
//   full_name: string
//   department: string | null
//   staff_id: string | null
//   is_verified: boolean
// }

// export default function AssignCourse({ lecturers, department }: { lecturers: Lecturer[], department: string }) {
//   const [loading, setLoading] = useState(false)
//   const [formData, setFormData] = useState({ 
//     code: '', 
//     name: '', 
//     lecturerId: '', 
//     semester: 'First',
//     units: '3' 
//   })
  
//   const supabase = createSupabaseBrowserClient()
//   const router = useRouter()

//   // SAFETY LOCK: Only show lecturers the HOD has already confirmed/verified
//   const verifiedLecturers = lecturers.filter(l => l.is_verified)

//   const handleAssign = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setLoading(true)

//     const { error } = await supabase.from('course_assignments').insert({
//       course_code: formData.code.toUpperCase().trim(),
//       course_name: formData.name.trim(),
//       lecturer_id: formData.lecturerId,
//       department: department, 
//       semester: formData.semester,
//       units: parseInt(formData.units) // Saves units for automated GPA calculation
//     })

//     if (error) {
//       alert(error.message)
//     } else {
//       setFormData({ code: '', name: '', lecturerId: '', semester: 'First', units: '3' })
//       router.refresh()
//     }
//     setLoading(false)
//   }

//   return (
//     <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-medical">
//       <div className="flex items-center gap-3 mb-6">
//         <div className="bg-bmu-blue/10 p-2 rounded-xl">
//           <BookPlus className="text-bmu-blue" size={20} />
//         </div>
//         <div>
//           <h3 className="font-bold text-slate-900 tracking-tight text-sm uppercase">Course Allocation</h3>
//           <p className="text-[10px] text-slate-400 font-medium tracking-wide">Assign verified specialists to {department} modules</p>
//         </div>
//       </div>

//       <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
//         {/* Course Code */}
//         <input 
//           placeholder="Code (e.g. NSC 410)" 
//           className="bg-slate-50 border-none rounded-xl text-xs font-bold p-4 focus:ring-2 focus:ring-bmu-blue"
//           value={formData.code}
//           onChange={e => setFormData({...formData, code: e.target.value})}
//           required
//         />

//         {/* Course Name */}
//         <input 
//           placeholder="Module Name" 
//           className="bg-slate-50 border-none rounded-xl text-xs font-bold p-4 focus:ring-2 focus:ring-bmu-blue"
//           value={formData.name}
//           onChange={e => setFormData({...formData, name: e.target.value})}
//           required
//         />

//         {/* Credit Units Selector */}
//         <select 
//           className="bg-slate-50 border-none rounded-xl text-xs font-bold p-4 text-slate-700 cursor-pointer"
//           value={formData.units}
//           onChange={e => setFormData({...formData, units: e.target.value})}
//         >
//           {[1, 2, 3, 4, 5, 6].map(u => (
//             <option key={u} value={u}>{u} Units</option>
//           ))}
//         </select>

//         {/* Verified Lecturer Selector */}
//         <select 
//           className="bg-slate-50 border-none rounded-xl text-xs font-bold p-4 text-slate-700 cursor-pointer"
//           value={formData.lecturerId}
//           onChange={e => setFormData({...formData, lecturerId: e.target.value})}
//           required
//         >
//           <option value="">Select Lecturer</option>
//           {verifiedLecturers.length > 0 ? (
//             verifiedLecturers.map(l => (
//               <option key={l.id} value={l.id}>
//                 {l.full_name} ({l.staff_id || 'ID Pending'})
//               </option>
//             ))
//           ) : (
//             <option disabled>No verified staff available</option>
//           )}
//         </select>

//         {/* Semester */}
//         <select 
//           className="bg-slate-50 border-none rounded-xl text-xs font-bold p-4 text-slate-700 cursor-pointer"
//           value={formData.semester}
//           onChange={e => setFormData({...formData, semester: e.target.value})}
//         >
//           <option value="First">1st Semester</option>
//           <option value="Second">2nd Semester</option>
//         </select>

//         {/* Assign Button */}
//         <button 
//           disabled={loading || verifiedLecturers.length === 0}
//           type="submit"
//           className="bg-bmu-blue text-white rounded-xl text-[10px] font-black py-4 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:bg-slate-200 uppercase"
//         >
//           {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
//           Assign
//         </button>
//       </form>
      
//       {verifiedLecturers.length === 0 && (
//         <div className="mt-4 flex items-center gap-2 text-[10px] text-amber-600 font-bold bg-amber-50 p-3 rounded-xl border border-amber-100">
//           <ShieldCheck size={14} />
//           NOTE: You must verify lecturers in the "Staff Management" section before they appear here.
//         </div>
//       )}
//     </div>
//   )
// }