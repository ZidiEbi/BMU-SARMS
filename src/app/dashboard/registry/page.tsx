import Link from 'next/link'
import { getRegistryOverview } from '@/lib/data/stats'
import StatCard from '@/components/dashboard/StatCard'
import StudentRegistryTable from './components/StudentRegistryTable'
import {
  Users,
  ShieldCheck,
  Search,
  FileSpreadsheet,
  Building2,
  ScanLine,
  History,
  LockKeyhole,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

export default async function RegistryDashboard() {
  const staff = await getRegistryOverview()

  const verifiedStaffCount = staff.length
  const managementCount = staff.filter((s) => ['dean', 'hod'].includes(String(s.role).toLowerCase())).length
  const unassignedCount = staff.filter((s) => !s.department).length

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <div className="h-1.5 bg-gradient-to-r from-bmu-blue via-bmu-maroon to-bmu-green" />

      <header className="bg-white border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-8 py-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-bmu-blue">
              Registry Operations Terminal
            </p>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-2">
              University Registry
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Student intake, enrollment processing, staff lifecycle, and academic directory · Bayelsa Medical University
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/registry/scan"
              className="flex items-center gap-2 px-5 py-3 bg-bmu-blue text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-bmu-blue/20 hover:scale-[1.02] transition"
            >
              <ScanLine size={16} />
              Start Scan Intake
            </Link>

            <button className="flex items-center gap-2 px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-200 transition">
              <FileSpreadsheet size={16} />
              Export Staff List
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-8 py-10 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Verified Staff"
            value={verifiedStaffCount}
            icon={Users}
            trend="Total Active"
            color="blue"
          />
          <StatCard
            title="Management"
            value={managementCount}
            icon={ShieldCheck}
            trend="Deans & HODs"
            color="maroon"
          />
          <StatCard
            title="Unassigned"
            value={unassignedCount}
            icon={Building2}
            trend="Requires Action"
            color="green"
          />
        </div>

        {/* PRIMARY REGISTRY OPERATIONS */}
        <section className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
            <div className="absolute top-0 right-0 w-40 h-40 bg-bmu-blue/5 rounded-full blur-3xl" />

            <div className="relative z-10 flex flex-col gap-6">
              <div className="flex items-start justify-between gap-6 flex-wrap">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bmu-blue/5 text-bmu-blue text-[10px] font-black uppercase tracking-widest">
                    <Sparkles size={12} />
                    Primary Registry Workflow
                  </div>

                  <h2 className="mt-4 text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                    Smart Enrollment Intake
                  </h2>

                  <p className="mt-3 text-sm leading-relaxed text-slate-500 font-medium">
                    Upload scanned student course enrollment forms, extract structured academic data with AI,
                    review the result, and commit the registration into BMU-SARMS.
                  </p>
                </div>

                <div className="bg-bmu-blue/5 text-bmu-blue p-4 rounded-3xl">
                  <ScanLine size={34} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Step 1
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-800">Scan or upload form</p>
                  <p className="mt-1 text-xs text-slate-500 font-medium">
                    PDF or image intake for registry processing
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Step 2
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-800">Review extracted data</p>
                  <p className="mt-1 text-xs text-slate-500 font-medium">
                    Confirm student identity, session, level, and matched courses
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Step 3
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-800">Commit enrollment</p>
                  <p className="mt-1 text-xs text-slate-500 font-medium">
                    Save the student record and registration directly into the live system
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/dashboard/registry/scan"
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-bmu-blue text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-bmu-blue/20 hover:scale-[1.02] transition"
                >
                  Start Scan Intake
                  <ArrowRight size={14} />
                </Link>

                <Link
                  href="/dashboard/registry/history"
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border border-slate-200 bg-white text-slate-700 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition"
                >
                  View Intake History
                  <History size={14} />
                </Link>
              </div>
            </div>
          </div>

          {/* SECONDARY OPERATIONS */}
          <div className="grid gap-4">
            <Link
              href="/dashboard/registry/history"
              className="relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-6 group hover:shadow-xl transition-all"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <History size={72} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Processing History</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500 font-medium">
                Review past enrollment intake actions, processed forms, and registration outcomes.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 text-bmu-blue text-xs font-black uppercase tracking-widest">
                Open History
                <ArrowRight size={13} />
              </div>
            </Link>

            <Link
              href="/dashboard/registry/secure"
              className="relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-6 group hover:shadow-xl transition-all"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <LockKeyhole size={72} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Secure Review</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500 font-medium">
                Validate edge cases, suspicious form entries, duplicate submissions, and protected records.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 text-bmu-maroon text-xs font-black uppercase tracking-widest">
                Open Secure Queue
                <ArrowRight size={13} />
              </div>
            </Link>
          </div>
        </section>

        {/* ADMINISTRATIVE TOOLS */}
        <section className="space-y-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
              Registry Administration
            </p>
            <h2 className="mt-2 text-xl font-black text-slate-900">
              Staff & Institutional Controls
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Link
              href="/dashboard/registry/verify"
              className="relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-8 group hover:shadow-xl transition-all"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ShieldCheck size={80} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Verify Staff Credentials</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500 font-medium">
                Validate professional qualifications and commit new staff to the institutional directory.
              </p>
              <div className="mt-6 w-full rounded-xl bg-bmu-blue py-3 text-white text-center text-xs font-black uppercase tracking-widest shadow-lg shadow-bmu-blue/20">
                Verify Personnel
              </div>
            </Link>

            <Link
              href="/dashboard/registry/audit"
              className="relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-8 group hover:shadow-xl transition-all"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Building2 size={80} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Placement Audit</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500 font-medium">
                Review staff distribution across faculties and departments to detect incomplete placement data.
              </p>
              <div className="mt-6 w-full rounded-xl bg-bmu-maroon py-3 text-white text-center text-xs font-black uppercase tracking-widest shadow-lg shadow-bmu-maroon/20">
                Run Audit
              </div>
            </Link>

            <Link
              href="/dashboard/registry/directory"
              className="relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-8 group hover:shadow-xl transition-all"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Search size={80} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Staff Directory</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500 font-medium">
                Search the master list of academic and administrative personnel across the institution.
              </p>
              <div className="mt-6 w-full rounded-xl border-2 border-slate-100 bg-slate-50 py-3 text-slate-600 text-center text-xs font-black uppercase tracking-widest">
                Open Directory
              </div>
            </Link>
          </div>
        </section>

        {/* STUDENT REGISTRY TABLE */}
        <section className="space-y-5">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                Student Registry Records
              </p>
              <h2 className="mt-2 text-xl font-black text-slate-900">
                Recently Registered Students
              </h2>
            </div>

            <Link
              href="/dashboard/registry/scan"
              className="inline-flex items-center gap-2 text-bmu-blue text-xs font-black uppercase tracking-widest"
            >
              New Intake
              <ArrowRight size={13} />
            </Link>
          </div>

          <StudentRegistryTable />
        </section>

        {/* STAFF SNAPSHOT */}
        <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-medical overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Recently Verified Staff</h3>
            <span className="text-[10px] font-black text-bmu-blue bg-bmu-blue/5 px-3 py-1 rounded-full uppercase">
              Registry Live Data
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-8 py-4">Name</th>
                  <th className="px-8 py-4">Designation</th>
                  <th className="px-8 py-4">Department</th>
                  <th className="px-8 py-4">Account Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {staff.slice(0, 5).map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-8 py-4">
                      <span className="font-bold text-slate-900 text-sm">
                        {member.full_name}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <span className="px-2 py-1 rounded-md bg-white border border-slate-200 text-[10px] font-black text-slate-500 uppercase">
                        {member.role}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <span className="text-xs font-bold text-slate-700">
                        {member.department || 'Awaiting Placement'}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-bmu-green animate-pulse" />
                        <span className="text-[10px] font-black text-slate-400 uppercase">
                          Verified
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      <footer className="py-10 text-center">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
          Internal Administrative Terminal · BMU SARMS 2026
        </p>
      </footer>
    </main>
  )
}