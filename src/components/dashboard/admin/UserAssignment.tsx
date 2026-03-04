"use client"

import { useEffect, useMemo, useState, Suspense } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, CheckCircle, Edit3 } from "lucide-react"

type ProfileRow = {
  id: string
  full_name: string | null
  role: string | null
  faculty_id: string | null
  department_id: string | null
}

type FacultyRow = { id: string; name: string }
type DeptRow = { id: string; name: string; faculty_id: string }

function normalizeRoleForDisplay(role: string | null) {
  if (!role) return "PENDING"
  return role === "SUPER_ADMIN" ? "SUPER_ADMIN" : role.toUpperCase()
}

function AssignmentForm() {
  const supabase = createSupabaseBrowserClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")

  // Data Lists
  const [users, setUsers] = useState<ProfileRow[]>([])
  const [faculties, setFaculties] = useState<FacultyRow[]>([])
  const [departments, setDepartments] = useState<DeptRow[]>([])

  // Form State
  const [selectedUser, setSelectedUser] = useState("")
  const [selectedRole, setSelectedRole] = useState("")
  const [selectedFaculty, setSelectedFaculty] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("")

  const [loading, setLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [okMsg, setOkMsg] = useState<string | null>(null)

  // Initial data fetch
  useEffect(() => {
    const fetchInstitutionalData = async () => {
      setIsFetching(true)
      setErrorMsg(null)
      setOkMsg(null)

      try {
        const { data: auth } = await supabase.auth.getUser()
        const admin = auth.user

        const { data: profiles, error: userError } = await supabase
          .from("profiles")
          .select("id, full_name, role, faculty_id, department_id")
          .neq("id", admin?.id ?? "")
          .order("full_name", { ascending: true })

        if (userError) throw userError

        const { data: facs, error: facErr } = await supabase
          .from("faculties")
          .select("id, name")
          .order("name", { ascending: true })
        if (facErr) throw facErr

        const { data: depts, error: deptErr } = await supabase
          .from("departments")
          .select("id, name, faculty_id")
          .order("name", { ascending: true })
        if (deptErr) throw deptErr

        setUsers((profiles ?? []) as ProfileRow[])
        setFaculties((facs ?? []) as FacultyRow[])
        setDepartments((depts ?? []) as DeptRow[])
      } catch (err: any) {
        setErrorMsg(err?.message ?? "Failed to load users/faculties/departments.")
      } finally {
        setIsFetching(false)
      }
    }

    fetchInstitutionalData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Edit mode (from URL ?edit=)
  useEffect(() => {
    if (!editId || users.length === 0) return
    const userToEdit = users.find((u) => u.id === editId)
    if (!userToEdit) return

    setSelectedUser(userToEdit.id)
    setSelectedRole(userToEdit.role ?? "")
    setSelectedFaculty(userToEdit.faculty_id ?? "")
    setSelectedDepartment(userToEdit.department_id ?? "")
  }, [editId, users])

  const filteredDepartments = useMemo(() => {
    if (!selectedFaculty) return []
    return departments.filter((d) => d.faculty_id === selectedFaculty)
  }, [departments, selectedFaculty])

  const roleNorm = selectedRole.trim()
  const isDean = roleNorm === "dean"
  const isAdminRole = roleNorm === "admin" || roleNorm === "SUPER_ADMIN"
  const requiresFaculty = !isAdminRole
  const requiresDept = !isAdminRole && !isDean

  // Keep form consistent when faculty/role changes
  useEffect(() => {
    // If admin/super admin: clear faculty + dept
    if (isAdminRole) {
      if (selectedFaculty) setSelectedFaculty("")
      if (selectedDepartment) setSelectedDepartment("")
      return
    }

    // If dean: dept should be empty
    if (isDean && selectedDepartment) {
      setSelectedDepartment("")
      return
    }

    // If faculty cleared: clear dept
    if (!selectedFaculty) {
      if (selectedDepartment) setSelectedDepartment("")
      return
    }

    // If faculty changed: ensure dept belongs to faculty
    if (selectedDepartment) {
      const ok = departments.some(
        (d) => d.id === selectedDepartment && d.faculty_id === selectedFaculty
      )
      if (!ok) setSelectedDepartment("")
    }
  }, [
    isAdminRole,
    isDean,
    selectedFaculty,
    selectedDepartment,
    departments,
    selectedRole,
  ])

  const handleAssign = async () => {
  // Normalize role
  const role = selectedRole.trim()
  const roleLower = role.toLowerCase()

  const isSuperAdmin = role.toUpperCase() === "SUPER_ADMIN"
  const isAdmin = roleLower === "admin"
  const isDean = roleLower === "dean"
  const requiresFaculty = !(isAdmin || isSuperAdmin)
  const requiresDept = !(isAdmin || isSuperAdmin || isDean)

  // Base checks
  if (!selectedUser || !role) {
    alert("Incomplete Assignment Data: select staff + role.")
    return
  }
  if (requiresFaculty && !selectedFaculty) {
    alert("Please select a Faculty (required for this role).")
    return
  }
  if (requiresDept && !selectedDepartment) {
    alert("Please select a Department (required for this role).")
    return
  }

  setLoading(true)
  try {
    const payload: any = {
      userId: selectedUser,
      role: role, // server normalizes it
    }

    if (requiresFaculty) payload.facultyId = selectedFaculty
    if (requiresDept) payload.departmentId = selectedDepartment

    console.log("ASSIGN STAFF PAYLOAD:", payload)

    const res = await fetch("/api/admin/assign-staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    })

    const raw = await res.text()
    let json: any = null
    try {
      json = raw ? JSON.parse(raw) : null
    } catch {
      json = { raw }
    }

    if (!res.ok) {
      console.error("ASSIGN STAFF ERROR:", {
        status: res.status,
        statusText: res.statusText,
        body: json,
      })
      alert(json?.error || json?.message || `Update Failed (${res.status})`)
      return
    }

    alert(editId ? "Staff Authority Updated." : "Staff Member Assigned.")

    setSelectedUser("")
    setSelectedRole("")
    setSelectedFaculty("")
    setSelectedDepartment("")
    router.push("/dashboard/admin/roles")
    router.refresh()
  } finally {
    setLoading(false)
  }
}

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <p className="text-[10px] font-black uppercase text-slate-400">Syncing Registry...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {editId && (
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2 mb-2">
          <Edit3 className="text-blue-600" size={14} />
          <p className="text-[10px] font-bold text-blue-700 uppercase">Edit Mode Active</p>
        </div>
      )}

      {/* Toast */}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
          <p className="text-[11px] font-bold text-red-700">{errorMsg}</p>
        </div>
      )}
      {okMsg && (
        <div className="p-3 bg-green-50 border border-green-100 rounded-xl">
          <p className="text-[11px] font-bold text-green-700">{okMsg}</p>
        </div>
      )}

      {/* Staff */}
      <div className="space-y-1">
        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">
          Staff Identity
        </label>
        <select
          className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500 outline-none font-bold text-slate-700 text-sm disabled:opacity-60"
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          disabled={!!editId}
        >
          <option value="">
            {users.length === 0 ? "No Users Found" : "Choose Staff..."}
          </option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name || "New Staff User"} ({normalizeRoleForDisplay(u.role)})
            </option>
          ))}
        </select>
      </div>

      {/* Role */}
      <div className="space-y-1">
        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">
          Authority Designation
        </label>
        <select
          className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500 outline-none font-bold text-slate-700 text-sm"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
        >
          <option value="">Select Designation...</option>
          <option value="lecturer">Lecturer</option>
          <option value="hod">HOD</option>
          <option value="dean">Dean</option>
          <option value="admin">Admin</option>
          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
        </select>
      </div>

      {/* Faculty */}
      <div className="space-y-1">
        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">
          Faculty
        </label>
        <select
          className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500 outline-none font-bold text-slate-700 text-sm disabled:opacity-40"
          value={selectedFaculty}
          onChange={(e) => setSelectedFaculty(e.target.value)}
          disabled={isAdminRole}
        >
          <option value="">
            {isAdminRole ? "Not required for this role" : "Select Faculty..."}
          </option>
          {faculties.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      {/* Department (hidden/disabled when not needed) */}
      {!isAdminRole && !isDean && (
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase text-slate-400 ml-1">
            Department
          </label>
          <select
            className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500 outline-none font-bold text-slate-700 text-sm disabled:opacity-40"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            disabled={!selectedFaculty}
          >
            <option value="">
              {selectedFaculty ? "Select Department..." : "Choose Faculty first..."}
            </option>
            {filteredDepartments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        onClick={handleAssign}
        disabled={loading || !selectedUser}
        className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-blue-600 transition-all flex justify-center items-center gap-2 mt-4 shadow-xl disabled:opacity-60"
      >
        {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
        {loading ? "COMMITTING..." : editId ? "UPDATE AUTHORITY" : "COMMIT ASSIGNMENT"}
      </button>

      {editId && (
        <button
          onClick={() => {
            router.push("/dashboard/admin/roles")
            setSelectedUser("")
          }}
          className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 hover:text-red-500 transition-colors"
        >
          Cancel Edit
        </button>
      )}
    </div>
  )
}

export default function UserAssignment() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs font-bold text-slate-400 uppercase animate-pulse">
          Initializing Terminal...
        </div>
      }
    >
      <AssignmentForm />
    </Suspense>
  )
}