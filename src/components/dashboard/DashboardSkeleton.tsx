export default function DashboardSkeleton() {
  return (
    <div className="p-8 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-end">
        <div className="space-y-3">
          <div className="h-8 w-64 bg-slate-200 rounded-xl"></div>
          <div className="h-4 w-48 bg-slate-100 rounded-lg"></div>
        </div>
        <div className="h-12 w-32 bg-slate-200 rounded-2xl"></div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-white border border-slate-100 rounded-[2rem] p-6 space-y-4">
            <div className="h-4 w-20 bg-slate-100 rounded"></div>
            <div className="h-8 w-16 bg-slate-200 rounded"></div>
          </div>
        ))}
      </div>

      {/* Content Area Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 h-[400px] bg-white border border-slate-100 rounded-[2.5rem]"></div>
        <div className="lg:col-span-2 h-[400px] bg-white border border-slate-100 rounded-[2.5rem]"></div>
      </div>
    </div>
  )
}