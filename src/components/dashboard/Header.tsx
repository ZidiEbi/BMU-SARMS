'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ShieldCheck, Sparkles } from 'lucide-react'

export default function Header({
  userName,
  roleLabel,
  eyebrow,
  title,
  description,
}: {
  userName: string
  roleLabel: string
  eyebrow: string
  title: string
  description: string
}) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const firstName = userName.trim().split(' ')[0] || 'User'

  return (
    <header
      className={`transition-all duration-300 ${
        scrolled ? 'py-2' : 'py-4'
      }`}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

        {/* LEFT */}
        <div className="min-w-0 space-y-2">
          {!scrolled && (
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-blue-700">
              <Sparkles size={13} />
              {eyebrow}
            </div>
          )}

          <h1
            className={`font-black tracking-tight text-slate-900 transition-all duration-300 ${
              scrolled ? 'text-lg' : 'text-2xl sm:text-3xl'
            }`}
          >
            {title}
          </h1>

          {!scrolled && (
            <p className="max-w-3xl text-sm font-medium text-slate-500">
              {description}
            </p>
          )}
        </div>

        {/* RIGHT */}
        <div
          className={`flex items-center gap-4 transition-all duration-300 ${
            scrolled ? 'scale-90 opacity-80' : 'scale-100 opacity-100'
          }`}
        >
          <div className="hidden sm:block text-right">
            <p className="text-sm font-black text-slate-900">
              {firstName}
            </p>
            <p className="text-[11px] uppercase font-bold text-blue-700">
              {roleLabel}
            </p>
            {!scrolled && (
              <p className="text-xs text-slate-400">{today}</p>
            )}
          </div>

          <div className="h-10 w-10 relative rounded-xl overflow-hidden border border-slate-200 bg-white">
            <Image
              src="/bmu-logo.png"
              fill
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </header>
  )
}