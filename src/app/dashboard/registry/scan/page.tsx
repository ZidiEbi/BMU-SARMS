'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import {
  CheckCircle2,
  FileUp,
  GraduationCap,
  Loader2,
  Save,
  Search,
  ShieldCheck,
  UserRound,
  UploadCloud,
  X,
  Wand2,
  RefreshCcw,
  Info,
  AlertTriangle,
} from 'lucide-react'

type Department = {
  id: string
  name: string
}

type StudentRecord = {
  id: string
  matric_number: string
  full_name: string
  department_id: string
  admission_year: number | null
  sex: 'M' | 'F' | null
}

type ExtractedCourseRow = {
  course_code: string
  course_title: string
  course_status: string
  unit: number | null
}

type ExtractedPayload = {
  session: string
  admission_year: string
  student: {
    surname: string
    other_names: string
    full_name: string
    matric_number: string
    faculty: string
    department: string
    programme_of_study: string
    year_of_study: string
    sex: string
    registered_number_of_courses: number | null
    total_number_of_units: number | null
  }
  first_semester: ExtractedCourseRow[]
  second_semester: ExtractedCourseRow[]
  notes: string
}

type CommitCourseRow = ExtractedCourseRow & {
  row_id: string
  semester: 'First Semester' | 'Second Semester'
  inferred_level: string | null
  classification: 'current' | 'carryover_or_repeat' | 'needs_review'
  include: boolean
}

const LEVEL_OPTIONS = ['100', '200', '300', '400', '500', '600']

function normalizeSession(value: string) {
  return value.replace(/\s+/g, '')
}

function normalizeCourseCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, ' ')
}

function normalizeDepartmentName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function inferLevelFromCourseCode(courseCode: string): string | null {
  const normalized = normalizeCourseCode(courseCode)
  const match = normalized.match(/(\d{3})/)
  if (!match) return null

  const firstDigit = match[1][0]
  if (!['1', '2', '3', '4', '5', '6'].includes(firstDigit)) return null

  return `${firstDigit}00`
}

function deriveStudentLevelFromYearOfStudy(value: string): string | null {
  const numeric = value.replace(/[^0-9]/g, '')
  if (!numeric) return null
  const level = `${numeric}00`
  return LEVEL_OPTIONS.includes(level) ? level : null
}

function buildCommitRows(
  extracted: ExtractedPayload | null,
  studentCurrentLevel: string
): CommitCourseRow[] {
  if (!extracted) return []

  const buildOne = (
    row: ExtractedCourseRow,
    semester: 'First Semester' | 'Second Semester',
    index: number
  ): CommitCourseRow => {
    const inferredLevel = inferLevelFromCourseCode(row.course_code)
    let classification: CommitCourseRow['classification'] = 'needs_review'

    if (inferredLevel && studentCurrentLevel) {
      if (inferredLevel === studentCurrentLevel) {
        classification = 'current'
      } else {
        const inferredNum = Number(inferredLevel)
        const studentNum = Number(studentCurrentLevel)
        classification =
          inferredNum < studentNum ? 'carryover_or_repeat' : 'needs_review'
      }
    }

    return {
      ...row,
      row_id: `${semester}-${index}-${normalizeCourseCode(row.course_code)}`,
      semester,
      inferred_level: inferredLevel,
      classification,
      include: true,
    }
  }

  return [
    ...extracted.first_semester.map((row, index) =>
      buildOne(row, 'First Semester', index)
    ),
    ...extracted.second_semester.map((row, index) =>
      buildOne(row, 'Second Semester', index)
    ),
  ]
}

export default function RegistryScanPage() {
  const supabase = createBrowserClient()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [departments, setDepartments] = useState<Department[]>([])

  const [loadingDepartments, setLoadingDepartments] = useState(true)
  const [lookingUpStudent, setLookingUpStudent] = useState(false)
  const [saving, setSaving] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [existingStudentId, setExistingStudentId] = useState<string | null>(null)

  const [matricNumber, setMatricNumber] = useState('')
  const [fullName, setFullName] = useState('')
  const [sex, setSex] = useState<'M' | 'F' | ''>('')
  const [departmentId, setDepartmentId] = useState('')
  const [admissionYear, setAdmissionYear] = useState('')

  const [level, setLevel] = useState('100')
  const [session, setSession] = useState('2025/2026')

  const [scanFile, setScanFile] = useState<File | null>(null)
  const [extracted, setExtracted] = useState<ExtractedPayload | null>(null)
  const [commitRows, setCommitRows] = useState<CommitCourseRow[]>([])

  useEffect(() => {
    const loadDepartments = async () => {
      setLoadingDepartments(true)
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name', { ascending: true })

      if (error) {
        setErrorMessage(error.message)
      } else {
        setDepartments((data || []) as Department[])
      }

      setLoadingDepartments(false)
    }

    loadDepartments()
  }, [supabase])

  const selectedDepartmentName = useMemo(() => {
    return departments.find((d) => d.id === departmentId)?.name || 'No Department Selected'
  }, [departments, departmentId])

  const firstSemesterRows = useMemo(
    () => commitRows.filter((row) => row.semester === 'First Semester'),
    [commitRows]
  )

  const secondSemesterRows = useMemo(
    () => commitRows.filter((row) => row.semester === 'Second Semester'),
    [commitRows]
  )

  const includedRows = useMemo(
    () => commitRows.filter((row) => row.include),
    [commitRows]
  )

  const currentRowsCount = useMemo(
    () => commitRows.filter((row) => row.classification === 'current').length,
    [commitRows]
  )

  const carryRowsCount = useMemo(
    () => commitRows.filter((row) => row.classification === 'carryover_or_repeat').length,
    [commitRows]
  )

  const reviewRowsCount = useMemo(
    () => commitRows.filter((row) => row.classification === 'needs_review').length,
    [commitRows]
  )

  const handleFindStudent = async () => {
    setMessage(null)
    setErrorMessage(null)

    const cleanMatric = matricNumber.trim().toUpperCase()
    if (!cleanMatric) {
      setErrorMessage('Enter a matric number first.')
      return
    }

    setLookingUpStudent(true)

    const { data, error } = await supabase
      .from('students')
      .select('id, matric_number, full_name, department_id, admission_year, sex')
      .eq('matric_number', cleanMatric)
      .maybeSingle()

    setLookingUpStudent(false)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    if (!data) {
      setExistingStudentId(null)
      setMessage('No existing student found. You can create a new registry record.')
      return
    }

    const student = data as StudentRecord

    setExistingStudentId(student.id)
    setMatricNumber(student.matric_number || '')
    setFullName(student.full_name || '')
    setDepartmentId(student.department_id || '')
    setAdmissionYear(student.admission_year ? String(student.admission_year) : '')
    setSex(student.sex || '')
    setMessage('Existing student record loaded. Review and continue with course registration.')
  }

  const updateCommitRow = (
    rowId: string,
    patch: Partial<CommitCourseRow>
  ) => {
    setCommitRows((prev) =>
      prev.map((row) => (row.row_id === rowId ? { ...row, ...patch } : row))
    )
  }

  const toggleIncludeRow = (rowId: string) => {
    setCommitRows((prev) =>
      prev.map((row) =>
        row.row_id === rowId ? { ...row, include: !row.include } : row
      )
    )
  }

  const applyExtractedData = (payload: ExtractedPayload) => {
    const normalizedDept = normalizeDepartmentName(payload.student.department)
    const matchedDepartment = departments.find(
      (dept) => normalizeDepartmentName(dept.name) === normalizedDept
    )

    const yearFromStudent = payload.admission_year || ''
    const guessedSex =
      payload.student.sex === 'M' || payload.student.sex === 'F'
        ? (payload.student.sex as 'M' | 'F')
        : ''

    setMatricNumber(payload.student.matric_number || '')
    setFullName(payload.student.full_name || '')
    setAdmissionYear(yearFromStudent)
    setSex(guessedSex)

    if (matchedDepartment) {
      setDepartmentId(matchedDepartment.id)
    }

    if (payload.session) {
      setSession(payload.session)
    }

    const extractedLevel = deriveStudentLevelFromYearOfStudy(
      payload.student.year_of_study || ''
    )

    if (extractedLevel) {
      setLevel(extractedLevel)
      setCommitRows(buildCommitRows(payload, extractedLevel))
    } else {
      setCommitRows(buildCommitRows(payload, level))
    }

    setMessage(
      'Scan extracted successfully. Review the student record and extracted courses before committing.'
    )
  }

  const handleExtract = async () => {
    if (!scanFile) {
      setErrorMessage('Choose a PDF or image to scan first.')
      return
    }

    setExtracting(true)
    setMessage(null)
    setErrorMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', scanFile)

      const res = await fetch('/api/registry/scan-form', {
        method: 'POST',
        body: formData,
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json?.error || 'Scan failed.')
      }

      const payload = json.extracted as ExtractedPayload
      setExtracted(payload)
      applyExtractedData(payload)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Scan failed.')
    } finally {
      setExtracting(false)
    }
  }

  const resetForm = () => {
    setExistingStudentId(null)
    setMatricNumber('')
    setFullName('')
    setSex('')
    setDepartmentId('')
    setAdmissionYear('')
    setLevel('100')
    setSession('2025/2026')
    setMessage(null)
    setErrorMessage(null)
    setScanFile(null)
    setExtracted(null)
    setCommitRows([])
    setIsDragging(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    setErrorMessage(null)

    try {
      const cleanMatric = matricNumber.trim().toUpperCase()
      const cleanName = fullName.trim().replace(/\s+/g, ' ')
      const cleanSession = normalizeSession(session)

      if (!cleanMatric || !cleanName || !departmentId || !admissionYear || !sex) {
        throw new Error('Student identity fields are incomplete.')
      }

      const rowsToProcess = commitRows
        .filter((row) => row.include)
        .filter((row) => normalizeCourseCode(row.course_code))

      if (rowsToProcess.length === 0) {
        throw new Error('No extracted course rows are selected for commit.')
      }

      const admissionYearNumber = Number(admissionYear)
      if (!Number.isInteger(admissionYearNumber) || admissionYearNumber < 1900) {
        throw new Error('Admission year must be a valid year.')
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        throw new Error('You are not authenticated.')
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError || !profile) {
        throw new Error('Unable to verify your registry profile.')
      }

      const normalizedRole = String(profile.role || '').trim().toLowerCase()
      const allowedRoles = new Set(['registry', 'admin', 'super_admin', 'super admin'])

      if (!allowedRoles.has(normalizedRole)) {
        throw new Error('Only Registry or Admin users can commit enrollment records.')
      }

      // Always re-check by matric number before insert/update
      const { data: studentByMatric, error: studentByMatricError } = await supabase
        .from('students')
        .select('id')
        .eq('matric_number', cleanMatric)
        .maybeSingle()

      if (studentByMatricError) {
        throw new Error(studentByMatricError.message)
      }

      let studentId = existingStudentId || studentByMatric?.id || null

      if (studentId) {
        const { error: updateError } = await supabase
          .from('students')
          .update({
            matric_number: cleanMatric,
            full_name: cleanName,
            department_id: departmentId,
            admission_year: admissionYearNumber,
            sex,
          })
          .eq('id', studentId)

        if (updateError) {
          throw new Error(updateError.message)
        }
      } else {
        const { data: insertedStudent, error: insertError } = await supabase
          .from('students')
          .insert([
            {
              matric_number: cleanMatric,
              full_name: cleanName,
              department_id: departmentId,
              admission_year: admissionYearNumber,
              sex,
              created_by: profile.id,
            },
          ])
          .select('id')
          .single()

        if (insertError || !insertedStudent) {
          throw new Error(insertError?.message || 'Failed to create student record.')
        }

        studentId = insertedStudent.id
      }

      setExistingStudentId(studentId)

      let createdCoursesCount = 0
      let reusedCoursesCount = 0
      let createdOfferingsCount = 0
      let reusedOfferingsCount = 0
      let newRegistrationsCount = 0
      let skippedRegistrationsCount = 0

      for (const row of rowsToProcess) {
        const normalizedCode = normalizeCourseCode(row.course_code)
        const normalizedTitle = row.course_title?.trim() || 'Untitled Course'
        const inferredLevel = row.inferred_level || level

        // 1. Find or create course
        let { data: existingCourse, error: existingCourseError } = await supabase
          .from('courses')
          .select('id, code, title, unit, department_id')
          .eq('code', normalizedCode)
          .maybeSingle()

        if (existingCourseError) {
          throw new Error(existingCourseError.message)
        }

        let courseId: string

        if (existingCourse) {
          courseId = existingCourse.id
          reusedCoursesCount += 1

          const updates: Record<string, unknown> = {}

          if (!existingCourse.title && normalizedTitle) {
            updates.title = normalizedTitle
          }

          if ((existingCourse.unit ?? null) == null && row.unit != null) {
            updates.unit = row.unit
          }

          if (!existingCourse.department_id) {
            updates.department_id = departmentId
          }

          if (Object.keys(updates).length > 0) {
            const { error: updateCourseError } = await supabase
              .from('courses')
              .update(updates)
              .eq('id', existingCourse.id)

            if (updateCourseError) {
              throw new Error(updateCourseError.message)
            }
          }
        } else {
          const { data: insertedCourse, error: insertCourseError } = await supabase
            .from('courses')
            .insert([
              {
                code: normalizedCode,
                title: normalizedTitle,
                unit: row.unit ?? 0,
                department_id: departmentId,
              },
            ])
            .select('id')
            .single()

          if (insertCourseError || !insertedCourse) {
            throw new Error(
              insertCourseError?.message || `Failed to create course ${normalizedCode}.`
            )
          }

          courseId = insertedCourse.id
          createdCoursesCount += 1
        }

        // 2. Find or create offering
        let { data: existingOffering, error: existingOfferingError } = await supabase
          .from('course_offerings')
          .select('id')
          .eq('course_id', courseId)
          .eq('department_id', departmentId)
          .eq('level', inferredLevel)
          .eq('semester', row.semester)
          .eq('session', cleanSession)
          .maybeSingle()

        if (existingOfferingError) {
          throw new Error(existingOfferingError.message)
        }

        let offeringId: string

        if (existingOffering) {
          offeringId = existingOffering.id
          reusedOfferingsCount += 1
        } else {
          const { data: insertedOffering, error: insertOfferingError } = await supabase
            .from('course_offerings')
            .insert([
              {
                course_id: courseId,
                department_id: departmentId,
                level: inferredLevel,
                semester: row.semester,
                session: cleanSession,
                status: 'draft',
                created_by: profile.id,
              },
            ])
            .select('id')
            .single()

          if (insertOfferingError || !insertedOffering) {
            throw new Error(
              insertOfferingError?.message ||
                `Failed to create offering for ${normalizedCode}.`
            )
          }

          offeringId = insertedOffering.id
          createdOfferingsCount += 1
        }

        // 3. Prevent duplicate registration
        const { data: existingRegistration, error: existingRegistrationError } =
          await supabase
            .from('course_registrations')
            .select('id')
            .eq('student_id', studentId)
            .eq('course_offering_id', offeringId)
            .maybeSingle()

        if (existingRegistrationError) {
          throw new Error(existingRegistrationError.message)
        }

        if (existingRegistration) {
          skippedRegistrationsCount += 1
          continue
        }

        const { error: insertRegistrationError } = await supabase
          .from('course_registrations')
          .insert([
            {
              student_id: studentId,
              course_offering_id: offeringId,
              registered_by: profile.id,
              registration_status: 'registered',
            },
          ])

        if (insertRegistrationError) {
          throw new Error(insertRegistrationError.message)
        }

        newRegistrationsCount += 1
      }

      setMessage(
        `Enrollment committed successfully. ${newRegistrationsCount} new registration(s), ${createdCoursesCount} new course(s), ${createdOfferingsCount} new offering(s), and ${skippedRegistrationsCount} duplicate registration(s) skipped.`
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'An unexpected error occurred.'
      setErrorMessage(message)
    } finally {
      setSaving(false)
    }
  }

  const renderCourseGroup = (
    rows: CommitCourseRow[],
    title: 'First Semester' | 'Second Semester'
  ) => {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
            {title} Courses
          </p>
          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 uppercase">
            {rows.filter((r) => r.include).length} selected
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
            No extracted course rows for {title.toLowerCase()}.
          </div>
        ) : (
          rows.map((row) => (
            <label
              key={row.row_id}
              className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-teal-50/40 transition p-4"
            >
              <input
                type="checkbox"
                checked={row.include}
                onChange={() => toggleIncludeRow(row.row_id)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />

              <div className="flex-1 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <p className="font-black text-sm text-blue-700 font-mono">
                      {row.course_code || 'NO CODE'}
                    </p>
                    <p className="text-sm font-semibold text-slate-800">
                      {row.course_title || 'Untitled Course'}
                    </p>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <span className="px-2 py-1 rounded-full bg-white border border-slate-200 text-[10px] font-black uppercase text-slate-500">
                      {row.unit ?? '—'} Units
                    </span>

                    {row.course_status && (
                      <span className="px-2 py-1 rounded-full bg-white border border-slate-200 text-[10px] font-black uppercase text-slate-500">
                        {row.course_status}
                      </span>
                    )}

                    <span className="px-2 py-1 rounded-full bg-white border border-slate-200 text-[10px] font-black uppercase text-slate-500">
                      {row.inferred_level || 'UNKNOWN'} Level
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {row.classification === 'current' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-black uppercase text-emerald-700">
                      <CheckCircle2 size={12} />
                      Current
                    </span>
                  )}

                  {row.classification === 'carryover_or_repeat' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-black uppercase text-amber-700">
                      <AlertTriangle size={12} />
                      Carry-over / Repeat
                    </span>
                  )}

                  {row.classification === 'needs_review' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-[10px] font-black uppercase text-red-700">
                      <Info size={12} />
                      Needs Review
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                      Course Title
                    </label>
                    <input
                      value={row.course_title}
                      onChange={(e) =>
                        updateCommitRow(row.row_id, { course_title: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                        Units
                      </label>
                      <input
                        type="number"
                        value={row.unit ?? ''}
                        onChange={(e) =>
                          updateCommitRow(row.row_id, {
                            unit: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                        Offering Level
                      </label>
                      <select
                        value={row.inferred_level || ''}
                        onChange={(e) =>
                          updateCommitRow(row.row_id, {
                            inferred_level: e.target.value || null,
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="">Unknown</option>
                        {LEVEL_OPTIONS.map((item) => (
                          <option key={item} value={item}>
                            {item} Level
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </label>
          ))
        )}
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl p-6 md:p-8 space-y-8">
        <header className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
          <div className="flex items-start gap-4">
            <div className="bg-teal-100 text-teal-700 p-3 rounded-2xl">
              <ShieldCheck size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-teal-600">
                Smart Enrollment Intake
              </p>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mt-2">
                Registry Scan & Enrollment Intake
              </h1>
              <p className="text-sm text-slate-500 mt-2 max-w-3xl">
                Upload a student course enrollment form, extract structured academic data with AI,
                review it carefully, then commit the final registration into BMU-SARMS.
              </p>
            </div>
          </div>
        </header>

        {message && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl px-5 py-4 flex items-center gap-3">
            <CheckCircle2 size={18} />
            <span className="font-medium">{message}</span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4">
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        <section className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-6 xl:sticky xl:top-6 self-start">
            <div>
              <h2 className="text-lg font-black text-slate-900">Step 1 · Upload & Extract</h2>
              <p className="text-xs text-slate-500 mt-1">
                Drop a PDF or image of the course enrollment form, then run AI extraction.
              </p>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                const droppedFile = e.dataTransfer.files?.[0]
                if (droppedFile) setScanFile(droppedFile)
              }}
              className={`rounded-[1.75rem] border-2 border-dashed p-8 text-center transition-all ${
                isDragging ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="mx-auto w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 mb-4">
                <UploadCloud size={28} />
              </div>

              <h3 className="text-sm font-black text-slate-900">Drop form here</h3>
              <p className="text-xs text-slate-500 mt-2 font-medium">
                Or choose a PDF, JPG, PNG, or WEBP file
              </p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-5 inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition"
              >
                <FileUp size={14} />
                Choose File
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                onChange={(e) => setScanFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </div>

            {scanFile && (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Selected File
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-800 break-all">
                    {scanFile.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 font-medium">
                    {(scanFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setScanFile(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-white transition"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleExtract}
                disabled={extracting || !scanFile}
                className="rounded-xl bg-blue-600 text-white px-5 py-3 text-xs font-black uppercase tracking-widest hover:bg-blue-500 disabled:opacity-50 flex items-center gap-2 justify-center"
              >
                {extracting ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                {extracting ? 'Extracting...' : 'Scan Form'}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-200 bg-white text-slate-700 px-5 py-3 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition flex items-center gap-2 justify-center"
              >
                <RefreshCcw size={14} />
                Reset Intake
              </button>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                Workflow Status
              </p>

              <div className="flex items-center gap-3">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${
                    scanFile ? 'bg-blue-500' : 'bg-slate-300'
                  }`}
                />
                <p className="text-sm font-medium text-slate-700">Form uploaded</p>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${
                    extracted ? 'bg-blue-500' : 'bg-slate-300'
                  }`}
                />
                <p className="text-sm font-medium text-slate-700">AI extraction complete</p>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${
                    includedRows.length > 0 ? 'bg-teal-500' : 'bg-slate-300'
                  }`}
                />
                <p className="text-sm font-medium text-slate-700">Courses ready for commit</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {extracted && (
              <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Step 2 · Review Extraction</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Validate the extracted student and course data before final commit.
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-xl bg-teal-50 border border-teal-200 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-teal-700">
                    <CheckCircle2 size={13} />
                    Form-Driven Commit Mode
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Student
                    </p>
                    <p className="mt-2 text-sm font-bold text-slate-800">
                      {extracted.student.full_name || 'Unnamed Student'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Matric Number
                    </p>
                    <p className="mt-2 text-sm font-bold text-slate-800">
                      {extracted.student.matric_number || '—'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Session
                    </p>
                    <p className="mt-2 text-sm font-bold text-slate-800">
                      {extracted.session || '—'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Year of Study
                    </p>
                    <p className="mt-2 text-sm font-bold text-slate-800">
                      {extracted.student.year_of_study || '—'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                      Included Rows
                    </p>
                    <p className="mt-2 text-2xl font-black text-emerald-900">
                      {includedRows.length}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">
                      Current
                    </p>
                    <p className="mt-2 text-2xl font-black text-blue-900">
                      {currentRowsCount}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">
                      Carry-over / Repeat
                    </p>
                    <p className="mt-2 text-2xl font-black text-amber-900">
                      {carryRowsCount}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-700">
                      Needs Review
                    </p>
                    <p className="mt-2 text-2xl font-black text-red-900">
                      {reviewRowsCount}
                    </p>
                  </div>
                </div>

                {extracted.notes && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">
                      Extraction Notes
                    </p>
                    <p className="text-sm text-slate-600">{extracted.notes}</p>
                  </div>
                )}
              </section>
            )}

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-1 bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Step 3 · Student Identity</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Search an existing student first, then create or update as needed.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">
                      Matric Number
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={matricNumber}
                        onChange={(e) => setMatricNumber(e.target.value.toUpperCase())}
                        placeholder="UG/20/0029"
                        className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <button
                        type="button"
                        onClick={handleFindStudent}
                        disabled={lookingUpStudent}
                        className="rounded-xl bg-slate-900 text-white px-4 py-3 text-xs font-black uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
                      >
                        {lookingUpStudent ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Search size={14} />
                        )}
                        Find
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">
                      Full Name
                    </label>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="STUDENT FULL NAME"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">
                        Sex
                      </label>
                      <select
                        value={sex}
                        onChange={(e) => setSex(e.target.value as 'M' | 'F' | '')}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="">Select</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">
                        Admission Year
                      </label>
                      <input
                        type="number"
                        value={admissionYear}
                        onChange={(e) => setAdmissionYear(e.target.value)}
                        placeholder="2024"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">
                      Department
                    </label>
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      disabled={loadingDepartments}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">
                      Current Level
                    </label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {LEVEL_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {item} Level
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">
                      Session
                    </label>
                    <input
                      value={session}
                      onChange={(e) => setSession(e.target.value)}
                      placeholder="2025/2026"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <UserRound size={16} className="text-teal-600" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                      Student Record State
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    {existingStudentId ? 'Existing student loaded' : 'New student will be created'}
                  </p>
                </div>
              </div>

              <div className="xl:col-span-2 bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    Step 4 · Academic Review & Commit Plan
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Review the extracted courses. The system will create missing courses,
                    create missing offerings, and register the student automatically.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Current Intake Context
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-slate-400 text-xs font-bold uppercase">Department</p>
                      <p className="font-semibold text-slate-700">{selectedDepartmentName}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs font-bold uppercase">Student Level</p>
                      <p className="font-semibold text-slate-700">{level} Level</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs font-bold uppercase">Session</p>
                      <p className="font-semibold text-slate-700">{normalizeSession(session)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs font-bold uppercase">Commit Mode</p>
                      <p className="font-semibold text-slate-700">Create / Reuse Automatically</p>
                    </div>
                  </div>
                </div>

                {renderCourseGroup(firstSemesterRows, 'First Semester')}
                {renderCourseGroup(secondSemesterRows, 'Second Semester')}

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Commit Summary
                  </p>
                  {includedRows.length === 0 ? (
                    <p className="text-sm text-slate-500">No extracted courses selected yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {includedRows.map((row) => (
                        <li key={row.row_id} className="text-sm font-medium text-slate-700">
                          {row.course_code} — {row.course_title} · {row.semester} ·{' '}
                          {row.inferred_level || 'Unknown Level'}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex flex-col md:flex-row gap-3 justify-end">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-5 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition"
                  >
                    Reset
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="px-5 py-3 rounded-xl bg-teal-600 text-white text-xs font-black uppercase tracking-widest hover:bg-teal-500 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        Commit Enrollment
                      </>
                    )}
                  </button>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}