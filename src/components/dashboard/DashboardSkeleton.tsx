export default function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-4 w-32 rounded-full bg-slate-100" />
          <div className="mt-4 h-10 w-3/4 rounded-2xl bg-slate-200" />
          <div className="mt-3 h-5 w-full rounded-xl bg-slate-100" />
          <div className="mt-2 h-5 w-5/6 rounded-xl bg-slate-100" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="h-3 w-20 rounded-full bg-slate-100" />
            <div className="mt-4 h-8 w-24 rounded-xl bg-slate-200" />
            <div className="mt-3 h-4 w-28 rounded-lg bg-slate-100" />
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="h-3 w-24 rounded-full bg-slate-100" />
            <div className="mt-4 h-8 w-28 rounded-xl bg-slate-200" />
            <div className="mt-3 h-4 w-32 rounded-lg bg-slate-100" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="h-10 w-10 rounded-2xl bg-slate-100" />
            <div className="mt-5 h-3 w-24 rounded-full bg-slate-100" />
            <div className="mt-3 h-9 w-20 rounded-xl bg-slate-200" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2.25rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-4 w-36 rounded-full bg-slate-100" />
          <div className="mt-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="h-4 w-40 rounded-lg bg-slate-200" />
                  <div className="h-3 w-28 rounded-lg bg-slate-100" />
                </div>
                <div className="h-9 w-20 rounded-2xl bg-slate-100" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2.25rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-4 w-40 rounded-full bg-slate-100" />
          <div className="mt-6 h-14 w-full rounded-2xl bg-slate-100" />
          <div className="mt-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 w-full rounded-2xl bg-slate-50" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}