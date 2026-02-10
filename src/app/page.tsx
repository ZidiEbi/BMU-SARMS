export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Top Accent */}
      <div className="h-1 bg-gradient-to-r from-bmu-purple via-bmu-green to-bmu-blue" />

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(94,220,58,0.08),transparent_60%)]" />

        <h1 className="relative z-10 text-4xl md:text-5xl font-bold tracking-tight">
          Bayelsa Medical University
        </h1>

        <p className="relative z-10 mt-4 max-w-2xl text-lg text-foreground/70">
          Secure Academic Records & Management System
          <span className="block mt-1 text-sm uppercase tracking-wider text-bmu-green">
            Registry · Lecturers · HODs · Deans
          </span>
        </p>

        <div className="relative z-10 mt-10 flex flex-wrap gap-4 justify-center">
          <a
            href="/dashboard/registry"
            className="rounded-xl bg-bmu-purple px-6 py-3 text-white font-medium shadow-lg shadow-bmu-purple/30 hover:scale-[1.02] hover:shadow-xl transition"
          >
            Go to Registry
          </a>

          <a
            href="/auth/login"
            className="rounded-xl border border-bmu-border bg-bmu-surface px-6 py-3 font-medium hover:bg-bmu-surface/80 transition"
          >
            Sign In
          </a>

          <a href="/auth/signup" className="underline">
            Create account
          </a>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Secure Enrollment",
              desc: "AI-assisted capture and verification of student enrollment data.",
              accent: "from-bmu-green/20 to-transparent",
            },
            {
              title: "Result Governance",
              desc: "Full audit trail from Lecturer → HOD → Dean → Senate.",
              accent: "from-bmu-purple/20 to-transparent",
            },
            {
              title: "Institutional Oversight",
              desc: "Role-based visibility and accountability at every stage.",
              accent: "from-bmu-blue/20 to-transparent",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="relative rounded-2xl border border-bmu-border bg-bmu-surface p-6 hover:translate-y-[-2px] transition"
            >
              <div
                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${item.accent}`}
              />
              <h3 className="relative text-xl font-semibold">{item.title}</h3>
              <p className="relative mt-2 text-sm text-foreground/70">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-bmu-border py-6 text-center text-sm text-foreground/50">
        © {new Date().getFullYear()} Bayelsa Medical University · Yenagoa,
        Bayelsa State
      </footer>
    </main>
  );
}
