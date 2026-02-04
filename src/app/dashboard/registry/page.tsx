export default function RegistryDashboard() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Top Accent Bar */}
      <div className="h-1 bg-gradient-to-r from-bmu-purple via-bmu-green to-bmu-blue" />

      {/* Header */}
      <header className="border-b border-bmu-border bg-bmu-surface">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            Registry Dashboard
          </h1>
          <p className="mt-1 text-sm text-foreground/60">
            Student Enrollment & Verification · Bayelsa Medical University
          </p>
        </div>
      </header>

      {/* Content */}
      <section className="mx-auto max-w-7xl px-6 py-10 grid gap-6 md:grid-cols-3">
        {/* Scan Enrollment */}
        <div className="relative rounded-2xl border border-bmu-border bg-bmu-surface p-6 hover:shadow-lg transition">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-bmu-green/15 to-transparent" />

          <h2 className="relative text-lg font-semibold">
            Scan Enrollment Form
          </h2>

          <p className="relative mt-2 text-sm text-foreground/70">
            Digitize handwritten enrollment forms using AI-assisted scanning.
          </p>

          <button
            className="relative mt-6 w-full rounded-xl bg-bmu-green px-4 py-2 text-white font-medium shadow hover:scale-[1.02] transition"
          >
            Start Scan
          </button>
        </div>

        {/* Secure Enrollment */}
        <div className="relative rounded-2xl border border-bmu-border bg-bmu-surface p-6 hover:shadow-lg transition">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-bmu-purple/15 to-transparent" />

          <h2 className="relative text-lg font-semibold">
            Secure Enrollment
          </h2>

          <p className="relative mt-2 text-sm text-foreground/70">
            Validate and commit scanned student data into the official registry.
          </p>

          <button
            className="relative mt-6 w-full rounded-xl bg-bmu-purple px-4 py-2 text-white font-medium shadow hover:scale-[1.02] transition"
          >
            Commit Records
          </button>
        </div>

        {/* Enrollment Status */}
        <div className="relative rounded-2xl border border-bmu-border bg-bmu-surface p-6 hover:shadow-lg transition">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-bmu-blue/15 to-transparent" />

          <h2 className="relative text-lg font-semibold">
            Enrollment Status
          </h2>

          <p className="relative mt-2 text-sm text-foreground/70">
            Monitor pending approvals and departmental handoff progress.
          </p>

          <button
            className="relative mt-6 w-full rounded-xl border border-bmu-border bg-bmu-surface px-4 py-2 font-medium hover:bg-bmu-surface/80 transition"
          >
            View Queue
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-bmu-border py-6 text-center text-xs text-foreground/50">
        Registry Operations · BMU SARMS
      </footer>
    </main>
  )
}
