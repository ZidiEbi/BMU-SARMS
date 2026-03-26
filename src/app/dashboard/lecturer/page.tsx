import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileCheck2,
  RefreshCcw,
  Send,
} from 'lucide-react'
import { getAuthProfileOrRedirect, requireRole, routeGate } from '@/lib/auth/guards'

type ResultItem = {
  id?: string
  ca_score: number | null
  exam_score: number | null
  score: number | null
  grade: string | null
  status: 'DRAFT' | 'SUBMITTED' | 'HOD_APPROVED' | 'DEAN_APPROVED' | 'LOCKED' | null
  updated_at?: string | null
}

type RegistrationItem = {
  id: string
  student_id?: string | null
  students?:
    | {
        matric_number: string
        full_name: string
      }
    | {
        matric_number: string
        full_name: string
      }[]
    | null
  results?: ResultItem[] | ResultItem | null
}

type Offering = {
  id: string
  level: string
  semester: string
  session: string
  status: string
  lecturer_id: string | null
  created_at?: string | null
  courses:
    | {
        id: string
        code: string
        title: string
        unit: number
      }
    | {
        id: string
        code: string
        title: string
        unit: number
      }[]
    | null
  departments:
    | {
        id: string
        name: string
      }
    | {
        id: string
        name: string
      }[]
    | null
  course_registrations?: RegistrationItem[] | null
}

type AuditRow = {
  result_id: string
  action: string
  note: string | null
}

export default async function LecturerDashboardPage() {
  const { supabase, user, profile } = await getAuthProfileOrRedirect()
  requireRole(profile, ['lecturer'])
  routeGate(profile)

  const { data, error } = await supabase
    .from('course_offerings')
    .select(`
      id,
      level,
      semester,
      session,
      status,
      lecturer_id,
      created_at,
      courses!course_offerings_course_id_fkey (
        id,
        code,
        title,
        unit
      ),
      departments!course_offerings_department_id_fkey (
        id,
        name
      ),
      course_registrations (
        id,
        student_id,
        students:student_id (
          matric_number,
          full_name
        ),
        results (
          id,
          ca_score,
          exam_score,
          score,
          grade,
          status,
          updated_at
        )
      )
    `)
    .eq('lecturer_id', user.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Lecturer offerings error:', error.message)
  }

  const offerings = ((data ?? []) as Offering[]).map((item) => ({
    ...item,
    courses: Array.isArray(item.courses) ? item.courses[0] ?? null : item.courses,
    departments: Array.isArray(item.departments) ? item.departments[0] ?? null : item.departments,
    course_registrations: (item.course_registrations ?? []).map((registration) => ({
      ...registration,
      students: Array.isArray(registration.students)
        ? registration.students[0] ?? null
        : registration.students,
      results: registration.results
        ? Array.isArray(registration.results)
          ? registration.results
          : [registration.results]
        : [],
    })),
  }))

  const resultIds = offerings.flatMap((offering) =>
    (offering.course_registrations ?? [])
      .map((registration) => registration.results?.[0]?.id)
      .filter((id): id is string => Boolean(id))
  )

  let returnedAuditRows: AuditRow[] = []

  if (resultIds.length > 0) {
    const { data: auditData, error: auditError } = await supabase
      .from('result_audit_logs')
      .select('result_id, action, note')
      .in('result_id', resultIds)
      .in('action', ['HOD_RETURNED_BATCH', 'HOD_REJECTED_BATCH'])

    if (auditError) {
      console.error('Lecturer audit lookup error:', auditError.message)
    } else {
      returnedAuditRows = (auditData ?? []) as AuditRow[]
    }
  }

  const returnedResultIds = new Set(returnedAuditRows.map((row) => row.result_id))

  const decoratedOfferings = offerings.map((offering) => {
    const rows = offering.course_registrations ?? []
    const results = rows
      .map((registration) => registration.results?.[0] ?? null)
      .filter(Boolean) as ResultItem[]

    const savedCount = results.filter((result) => Boolean(result.id)).length
    const submittedCount = results.filter((result) => result.status === 'SUBMITTED').length
    const approvedCount = results.filter((result) => result.status === 'HOD_APPROVED').length
    const returnedCount = rows.filter((registration) => {
      const resultId = registration.results?.[0]?.id
      return resultId ? returnedResultIds.has(resultId) : false
    }).length

    return {
      ...offering,
      registrationCount: rows.length,
      savedCount,
      submittedCount,
      approvedCount,
      returnedCount,
      hasReturnedRows: returnedCount > 0,
      hasDraftRows: results.some((result) => result.status === 'DRAFT'),
      hasSubmittedRows: results.some((result) => result.status === 'SUBMITTED'),
    }
  })

  const totalOfferings = decoratedOfferings.length
  const totalRegistrations = decoratedOfferings.reduce(
    (sum, offering) => sum + offering.registrationCount,
    0
  )
  const totalSaved = decoratedOfferings.reduce(
    (sum, offering) => sum + offering.savedCount,
    0
  )
  const totalSubmitted = decoratedOfferings.reduce(
    (sum, offering) => sum + offering.submittedCount,
    0
  )
  const totalApproved = decoratedOfferings.reduce(
    (sum, offering) => sum + offering.approvedCount,
    0
  )

  const returnedOfferings = decoratedOfferings.filter((offering) => offering.hasReturnedRows)
  const draftOfferings = decoratedOfferings.filter(
    (offering) => offering.hasDraftRows && !offering.hasReturnedRows
  )
  const submittedOfferings = decoratedOfferings.filter(
    (offering) => offering.hasSubmittedRows && !offering.hasReturnedRows
  )

  return (
    <div className="space-y-8">
      <section className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-bmu-blue">
                Lecturer Command Center
              </p>
              <h2 className="text-2xl font-black text-slate-900 mt-2">
                {profile.full_name ?? 'Lecturer Workspace'}
              </h2>
              <p className="text-slate-500 text-sm font-medium mt-2">
                Manage draft rows, returned batches, submissions, and teaching offerings from one production-grade workspace.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[420px]">
              <QuickSummaryCard
                label="Offerings"
                value={totalOfferings}
                sublabel={`${returnedOfferings.length} returned • ${submittedOfferings.length} submitted`}
                icon={<BookOpen size={18} />}
              />
              <QuickSummaryCard
                label="Saved Rows"
                value={totalSaved}
                sublabel={`${totalSubmitted} submitted • ${totalApproved} approved`}
                icon={<FileCheck2 size={18} />}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Registrations"
            value={totalRegistrations}
            sublabel="Student-offering rows assigned to your teaching workspace"
            icon={<Clock3 size={18} />}
          />
          <MetricCard
            label="Returned Offerings"
            value={returnedOfferings.length}
            sublabel="Offerings sent back by HOD for correction or rework"
            icon={<RefreshCcw size={18} />}
            danger={returnedOfferings.length > 0}
          />
          <MetricCard
            label="Draft Work"
            value={draftOfferings.length}
            sublabel="Saved but not yet submitted offerings still under lecturer control"
            icon={<AlertTriangle size={18} />}
          />
          <MetricCard
            label="Submitted"
            value={submittedOfferings.length}
            sublabel="Offerings currently awaiting HOD supervisory review"
            icon={<Send size={18} />}
          />
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-black text-slate-900">Lecturer Action Queue</h3>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Start with the most urgent workflow items in your academic pipeline.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {returnedOfferings.length > 0 && (
              <QueueLink
                href={`/dashboard/lecturer/courses/${returnedOfferings[0].id}`}
                title="Returned by HOD"
                description="One or more offerings were returned for correction. Open the returned workspace and resubmit after fixing."
                badge={`${returnedOfferings.length}`}
                tone="red"
              />
            )}

            {draftOfferings.length > 0 && (
              <QueueLink
                href={`/dashboard/lecturer/courses/${draftOfferings[0].id}`}
                title="Draft rows waiting for submission"
                description="Saved result rows still need formal submission before HOD review can begin."
                badge={`${draftOfferings.length}`}
                tone="amber"
              />
            )}

            {submittedOfferings.length > 0 && (
              <QueueLink
                href={`/dashboard/lecturer/courses/${submittedOfferings[0].id}`}
                title="Submitted offerings"
                description="These offerings are currently with HOD for supervisory review."
                badge={`${submittedOfferings.length}`}
                tone="blue"
              />
            )}

            {returnedOfferings.length === 0 &&
              draftOfferings.length === 0 &&
              submittedOfferings.length === 0 && (
                <div className="p-6">
                  <div className="rounded-2xl bg-green-50 border border-green-200 p-5">
                    <p className="text-sm font-black text-green-800">
                      No urgent lecturer backlog right now.
                    </p>
                    <p className="text-sm text-green-700 mt-2">
                      Your current published offerings do not have returned or pending draft queues.
                    </p>
                  </div>
                </div>
              )}
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-black text-slate-900">My Teaching Offerings</h3>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Open any offering to save rows, review returned notes, and submit for HOD approval.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 p-6 lg:grid-cols-2">
            {decoratedOfferings.length > 0 ? (
              decoratedOfferings.map((offering) => {
                const course = offering.courses
                const department = offering.departments

                return (
                  <Link
                    key={offering.id}
                    href={`/dashboard/lecturer/courses/${offering.id}`}
                    className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 flex items-center justify-between group hover:border-bmu-blue/30 hover:bg-white transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="text-[10px] font-black text-bmu-blue bg-bmu-blue/5 px-2 py-1 rounded-md uppercase tracking-widest">
                          {(course?.code ?? 'COURSE').toUpperCase()}
                        </span>

                        {offering.hasReturnedRows ? (
                          <span className="text-[10px] font-black text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded-md uppercase tracking-widest">
                            Returned
                          </span>
                        ) : offering.hasSubmittedRows ? (
                          <span className="text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-md uppercase tracking-widest">
                            Submitted
                          </span>
                        ) : offering.hasDraftRows ? (
                          <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md uppercase tracking-widest">
                            Draft
                          </span>
                        ) : (
                          <span className="text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-1 rounded-md uppercase tracking-widest">
                            New
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {course?.title ?? 'Untitled Course'}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium mt-1">
                          {offering.session} • {offering.semester} • {course?.unit ?? 0} unit(s)
                        </p>
                        <p className="text-xs text-slate-500 font-semibold mt-1">
                          {department?.name ?? 'Unknown Department'} • {offering.level} Level
                        </p>
                      </div>

                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {offering.registrationCount} registration(s) • {offering.savedCount} saved • {offering.submittedCount} submitted
                      </p>
                    </div>

                    <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:bg-bmu-blue group-hover:text-white transition-all shadow-sm border border-slate-100">
                      <ArrowRight size={20} />
                    </div>
                  </Link>
                )
              })
            ) : (
              <div className="col-span-2 py-20 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50">
                <p className="text-slate-500 font-bold">No published offerings assigned yet.</p>
                <p className="text-slate-400 font-medium text-sm mt-2">
                  Your HOD will assign and publish offerings for the active session.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function MetricCard({
  label,
  value,
  sublabel,
  icon,
  danger = false,
}: {
  label: string
  value: number
  sublabel: string
  icon: React.ReactNode
  danger?: boolean
}) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
        {icon}
      </div>
      <p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className={`mt-2 text-3xl font-black ${danger ? 'text-red-700' : 'text-slate-900'}`}>
        {value}
      </p>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
        {sublabel}
      </p>
    </div>
  )
}

function QuickSummaryCard({
  label,
  value,
  sublabel,
  icon,
}: {
  label: string
  value: number
  sublabel: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{sublabel}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
          {icon}
        </div>
      </div>
    </div>
  )
}

function QueueLink({
  href,
  title,
  description,
  badge,
  tone,
}: {
  href: string
  title: string
  description: string
  badge: string
  tone: 'red' | 'amber' | 'blue'
}) {
  const toneClass =
    tone === 'red'
      ? 'border-red-200 bg-red-50 text-red-700'
      : tone === 'amber'
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : 'border-blue-200 bg-blue-50 text-blue-700'

  return (
    <Link href={href} className="block p-5 transition hover:bg-slate-50">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${toneClass}`}>
              {badge}
            </span>
            <p className="text-sm font-black text-slate-900">{title}</p>
          </div>
          <p className="text-sm font-medium leading-6 text-slate-500">
            {description}
          </p>
        </div>

        <div className="mt-1 text-slate-400">
          <ArrowRight size={18} />
        </div>
      </div>
    </Link>
  )
}
