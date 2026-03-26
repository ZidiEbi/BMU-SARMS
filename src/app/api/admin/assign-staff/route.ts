import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createSupabaseServerClient } from "@/lib/supabase/server"

const allowedRoles = ["lecturer", "registry", "hod", "dean", "admin", "SUPER_ADMIN"] as const
type AllowedRole = (typeof allowedRoles)[number]

function jsonError(message: string, status = 400, extra?: Record<string, any>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status })
}

function normalizeIncomingRole(input: any): AllowedRole | null {
  const raw = String(input ?? "").trim()
  if (!raw) return null

  if (raw.toUpperCase() === "SUPER_ADMIN") return "SUPER_ADMIN"

  const lower = raw.toLowerCase()
  if (
    lower === "lecturer" ||
    lower === "registry" ||
    lower === "hod" ||
    lower === "dean" ||
    lower === "admin"
  ) {
    return lower as AllowedRole
  }

  return null
}

export async function POST(req: Request) {
  try {
    // 1) Cookie-session client (RLS applies) - who is calling?
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()

    if (authErr || !user) {
      return jsonError("Not authenticated", 401, { message: authErr?.message })
    }

    // 2) Load requester role (via session client)
    const { data: me, error: meErr } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle()

    if (meErr || !me) {
      return jsonError("Profile not found", 403, { message: meErr?.message })
    }

    const requesterRole = String(me.role ?? "").trim()
    const requesterRoleUpper = requesterRole.toUpperCase()
    const isAdmin = requesterRole.toLowerCase() === "admin"
    const isSuper = requesterRoleUpper === "SUPER_ADMIN"

    if (!isAdmin && !isSuper) {
      return jsonError("Not authorized", 403, { requesterRole })
    }

    // 3) Parse body
    let body: any
    try {
      body = await req.json()
    } catch {
      return jsonError("Invalid JSON", 400)
    }

    const userId = String(body.userId ?? "").trim()
    const role = normalizeIncomingRole(body.role)

    const facultyIdRaw = body.facultyId
    const departmentIdRaw = body.departmentId

    if (!userId || !role) {
      return jsonError("Missing or invalid fields", 400, {
        received: { userId: body.userId, role: body.role },
        required: ["userId", "role"],
        allowedRoles,
      })
    }

    if (role === "SUPER_ADMIN" && !isSuper) {
      return jsonError("Only SUPER_ADMIN can assign SUPER_ADMIN", 403)
    }

    if (userId === user.id) {
      return jsonError("You cannot assign yourself from this tool", 400)
    }

    // Role requirements
    // - registry: no faculty, no dept
    // - admin / SUPER_ADMIN: no faculty, no dept
    // - dean: faculty yes, dept no
    // - hod / lecturer: faculty yes, dept yes
    const requiresFaculty = role === "lecturer" || role === "hod" || role === "dean"
    const requiresDept = role === "lecturer" || role === "hod"

    const facultyId = requiresFaculty ? String(facultyIdRaw ?? "").trim() : ""
    const departmentId = requiresDept ? String(departmentIdRaw ?? "").trim() : ""

    if (requiresFaculty && !facultyId) {
      return jsonError("Missing facultyId for this role", 400, { role, required: ["facultyId"] })
    }

    if (requiresDept && !departmentId) {
      return jsonError("Missing departmentId for this role", 400, { role, required: ["departmentId"] })
    }

    // 4) Service role client (bypasses RLS) - do the update
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceKey) {
      return jsonError("Server misconfigured: missing SUPABASE_SERVICE_ROLE_KEY", 500)
    }

    const adminDb = createClient(url, serviceKey, { auth: { persistSession: false } })

    // 5) Validate department belongs to faculty only when department is required
    if (requiresDept) {
      const { data: dept, error: deptErr } = await adminDb
        .from("departments")
        .select("id, faculty_id")
        .eq("id", departmentId)
        .maybeSingle()

      if (deptErr || !dept) {
        return jsonError("Department not found", 400, {
          message: deptErr?.message,
          code: deptErr?.code,
          hint: deptErr?.hint,
          details: deptErr?.details,
        })
      }

      if (String(dept.faculty_id) !== facultyId) {
        return jsonError("Department does not belong to selected faculty", 400, {
          departmentId,
          facultyId,
          deptFacultyId: dept.faculty_id,
        })
      }
    }

    // 6) Load current target profile so updates can be workflow-aware
    const { data: targetProfile, error: targetErr } = await adminDb
      .from("profiles")
      .select("id, role, requested_department_id, department_id")
      .eq("id", userId)
      .maybeSingle()

    if (targetErr || !targetProfile) {
      return jsonError("Target profile not found", 404, { message: targetErr?.message })
    }

    // 7) Build update payload
    const updatePayload: any = {
      role, // store SUPER_ADMIN exactly, others lowercase
      updated_at: new Date().toISOString(),
      profile_completed: true,
    }

    if (requiresFaculty) {
      updatePayload.faculty_id = facultyId
    } else {
      updatePayload.faculty_id = null
    }

    if (role === "lecturer") {
      // Admin direct assignment = confirmed institutional assignment
      updatePayload.department_id = departmentId
      updatePayload.requested_department_id = null
      updatePayload.is_verified = true
    } else if (role === "hod") {
      updatePayload.department_id = departmentId
      updatePayload.requested_department_id = null
      updatePayload.is_verified = true
    } else if (role === "dean") {
      updatePayload.department_id = null
      updatePayload.requested_department_id = null
      updatePayload.is_verified = true
    } else if (role === "registry") {
      updatePayload.department_id = null
      updatePayload.requested_department_id = null
      updatePayload.faculty_id = null
      updatePayload.is_verified = true
    } else if (role === "admin" || role === "SUPER_ADMIN") {
      updatePayload.department_id = null
      updatePayload.requested_department_id = null
      updatePayload.faculty_id = null
      updatePayload.is_verified = true
    } else {
      updatePayload.department_id = requiresDept ? departmentId : null
      updatePayload.requested_department_id = null
    }

    const { data: updated, error: updErr } = await adminDb
      .from("profiles")
      .update(updatePayload)
      .eq("id", userId)
      .select(
        "id, role, faculty_id, department_id, requested_department_id, is_verified, profile_completed"
      )
      .maybeSingle()

    if (updErr) {
      return jsonError("Update failed", 400, {
        message: updErr.message,
        code: updErr.code,
        hint: updErr.hint,
        details: updErr.details,
        attempted: updatePayload,
      })
    }

    return NextResponse.json({ ok: true, updated })
  } catch (e: any) {
    return jsonError("Server error", 500, { message: e?.message, stack: e?.stack })
  }
}