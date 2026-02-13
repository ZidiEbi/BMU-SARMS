'use client'

import Image from 'next/image'
import { Bell, Search, Circle } from 'lucide-react'

export default function Header({ userName }: { userName: string }) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <header className="flex items-center justify-between mb-10">
      {/* Left: Greeting & Date */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Welcome back, <span className="text-bmu-blue">{userName}</span>
        </h2>
        <p className="text-sm text-slate-500 font-medium mt-1">{today}</p>
      </div>

      {/* Right: Actions & Status */}
      <div className="flex items-center gap-6">
        {/* System Status Badge */}
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-100 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bmu-green opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-bmu-green"></span>
          </span>
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">System Online</span>
        </div>

        {/* Logo/Identity */}
        <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-900 leading-none">Bayelsa Medical University</p>
            <p className="text-[10px] text-bmu-maroon font-bold uppercase mt-1">BMU-SAMS v2.0</p>
          </div>
          <div className="h-10 w-10 relative">
            <Image 
              src="/bmu-logo.png" 
              alt="BMU Logo" 
              fill 
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </header>
  )
}