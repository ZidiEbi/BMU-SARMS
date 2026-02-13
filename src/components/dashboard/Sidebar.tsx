'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, Users, ClipboardList, 
  LogOut, ChevronLeft, Menu, GraduationCap,
  ShieldCheck, Activity
} from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export default function Sidebar({ role }: { role: string }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  // Normalize the dashboard path to prevent 404s for SUPER_ADMIN
  const rolePath = (role === 'SUPER_ADMIN' || role === 'admin') 
    ? 'admin' 
    : role.toLowerCase()

  const navLinks = [
    { name: 'Dashboard', href: `/dashboard/${rolePath}`, icon: LayoutDashboard },
  ]

  // Add Administrative tools for higher roles
  if (role === 'admin' || role === 'SUPER_ADMIN') {
    navLinks.push({ name: 'Role Control', href: '/dashboard/admin/roles', icon: ShieldCheck })
    navLinks.push({ name: 'System Logs', href: '/dashboard/admin/logs', icon: Activity })
  }

  return (
    <motion.aside 
      animate={{ width: isCollapsed ? 90 : 280 }}
      className="bg-white border-r border-slate-200 flex flex-col min-h-screen sticky top-0 z-50 shadow-sm"
    >
      {/* Brand Header */}
      <div className="p-6 flex items-center justify-between">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-3"
            >
              <div className="bg-bmu-blue p-2 rounded-xl text-white shadow-lg shadow-bmu-blue/20">
                <GraduationCap size={22}/>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 leading-none tracking-tight">BMU SAMS</span>
                <span className="text-[10px] font-bold text-bmu-blue uppercase tracking-tighter mt-1 opacity-70">Global Standards</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-slate-50 rounded-lg border border-slate-100 transition-all text-slate-400"
        >
          {isCollapsed ? <Menu size={20}/> : <ChevronLeft size={20}/>}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 mt-4">
        {navLinks.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href
          return (
            <Link key={link.name} href={link.href}>
              <div className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 relative group ${
                isActive 
                  ? 'bg-bmu-blue text-white shadow-xl shadow-bmu-blue/20' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}>
                <Icon size={20} className={isActive ? 'text-bmu-green' : 'group-hover:text-bmu-blue'} />
                
                {!isCollapsed && (
                  <span className="font-semibold text-sm tracking-wide">
                    {link.name}
                  </span>
                )}
                
                {isCollapsed && (
                  <div className="absolute left-20 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-xl">
                    {link.name}
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Institutional Footer */}
      <div className="p-4 border-t border-slate-100">
        <div className={`p-3 rounded-2xl bg-slate-50 mb-4 transition-all ${isCollapsed ? 'hidden' : 'block'}`}>
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest text-center">Identity Verified</p>
            <p className="text-[11px] text-center font-bold text-bmu-maroon mt-1 truncate">{role.replace('_', ' ')}</p>
        </div>
        <button 
          onClick={handleSignOut}
          className="w-full flex items-center gap-4 px-4 py-3.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all group"
        >
          <LogOut size={20} />
          {!isCollapsed && <span className="text-sm font-bold">Terminal Logout</span>}
        </button>
      </div>
    </motion.aside>
  )
}