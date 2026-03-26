type ResultItem = {
  id?: string
  ca_score: number | null
  exam_score: number | null
  total_score: number | null
  grade: string | null
  remark_code: string | null
  status: 'DRAFT' | 'SUBMITTED' | 'HOD_APPROVED' | 'DEAN_APPROVED' | 'LOCKED' | null
  updated_at?: string | null
}

type RegistrationItem = {
  id: string
  registration_status?: string | null
  students?: {
    matric_number: string
    full_name: string
  } | null
  results?: ResultItem[] | null
}

type OfferingItem = {
  id: string
  level: string
  semester: string
  session: string
  status: string
  courses?: {
    id: string
    code: string
    title: string
    unit: number
  } | null
  course_registrations?: RegistrationItem[] | null
}

export default function HODResultsOverview({
  offerings,
}: {
  offerings: OfferingItem[]
}) {
  const populatedOfferings = offerings.filter(
    (offering) => (offering.course_registrations?.length ?? 0) > 0
  )

  return (
    <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
          Saved Results Overview
        </h2>
        <p className="text-slate-500 text-sm font-medium mt-1">
          Review results already entered by lecturers for departmental offerings.
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {populatedOfferings.length === 0 ? (
          <div className="p-10 text-center text-slate-400 font-semibold">
            No populated offerings available yet.
          </div>
        ) : (
          populatedOfferings.map((offering) => {
            const registrations = offering.course_registrations ?? []

            const savedCount = registrations.filter((registration) => {
              const result = registration.results?.[0]
              return Boolean(result?.id)
            }).length

            const submittedCount = registrations.filter((registration) => {
              const result = registration.results?.[0]
              return result?.status === 'SUBMITTED'
            }).length

            const approvedCount = registrations.filter((registration) => {
              const result = registration.results?.[0]
              return result?.status === 'HOD_APPROVED'
            }).length

            return (
              <div key={offering.id} className="p-6 space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {offering.courses?.code ?? 'COURSE'}
                    </p>
                    <h3 className="text-lg font-black text-slate-900">
                      {offering.courses?.title ?? 'Untitled Course'}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium">
                      {offering.session} • {offering.semester} • {offering.level} Level •{' '}
                      {offering.courses?.unit ?? 0} Unit(s)
                    </p>
                  </div>

                  <div className="flex gap-3 flex-wrap">
                    <span className="px-4 py-2 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-black text-slate-700">
                      {registrations.length} registered
                    </span>
                    <span className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-black text-emerald-700">
                      {savedCount} saved
                    </span>
                    <span className="px-4 py-2 rounded-2xl bg-blue-50 border border-blue-200 text-xs font-black text-blue-700">
                      {submittedCount} submitted
                    </span>
                    <span className="px-4 py-2 rounded-2xl bg-green-50 border border-green-200 text-xs font-black text-green-700">
                      {approvedCount} approved
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">
                        <th className="py-3 pr-4">Matric No.</th>
                        <th className="py-3 pr-4">Student</th>
                        <th className="py-3 pr-4">CA</th>
                        <th className="py-3 pr-4">Exam</th>
                        <th className="py-3 pr-4">Total</th>
                        <th className="py-3 pr-4">Grade</th>
                        <th className="py-3 pr-4">Remark</th>
                        <th className="py-3 pr-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {registrations.map((registration) => {
                        const result = registration.results?.[0]
                        const hasSavedResult = Boolean(result?.id)
                        const displayStatus = hasSavedResult
                          ? result?.status ?? 'DRAFT'
                          : 'NOT_SAVED'

                        return (
                          <tr key={registration.id}>
                            <td className="py-4 pr-4 font-mono text-sm font-black text-blue-700">
                              {registration.students?.matric_number ?? '—'}
                            </td>
                            <td className="py-4 pr-4 font-bold text-slate-900">
                              {registration.students?.full_name ?? 'Student'}
                            </td>
                            <td className="py-4 pr-4 text-slate-700 font-bold">
                              {result?.ca_score ?? '—'}
                            </td>
                            <td className="py-4 pr-4 text-slate-700 font-bold">
                              {result?.exam_score ?? '—'}
                            </td>
                            <td className="py-4 pr-4 text-slate-700 font-bold">
                              {result?.total_score ?? '—'}
                            </td>
                            <td className="py-4 pr-4">
                              <span className="px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-xs font-black text-slate-700">
                                {result?.grade ?? '—'}
                              </span>
                            </td>
                            <td className="py-4 pr-4 text-slate-700 font-bold">
                              {result?.remark_code ?? '—'}
                            </td>
                            <td className="py-4 pr-4">
                              <span className={statusClassName(displayStatus)}>
                                {displayStatus}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}

function statusClassName(status: string) {
  switch (status) {
    case 'DRAFT':
      return 'px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-black text-amber-700'
    case 'SUBMITTED':
      return 'px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-black text-blue-700'
    case 'HOD_APPROVED':
      return 'px-3 py-1 rounded-full bg-green-50 border border-green-200 text-xs font-black text-green-700'
    case 'DEAN_APPROVED':
      return 'px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-xs font-black text-violet-700'
    case 'LOCKED':
      return 'px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-black text-slate-700'
    default:
      return 'px-3 py-1 rounded-full bg-red-50 border border-red-200 text-xs font-black text-red-700'
  }
}