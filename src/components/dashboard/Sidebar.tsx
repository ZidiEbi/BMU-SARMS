'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, Users, ClipboardList, 
  LogOut, ChevronLeft, Menu, GraduationCap,
  ShieldCheck, Activity, BookOpen
} from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'

export default function Sidebar({ role }: { role: string }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createBrowserClient()

  useEffect(() => {
    setMounted(true)
    console.log('📍 Sidebar mounted with role:', role, 'pathname:', pathname)
  }, [role, pathname])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const handleHashLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.includes('#')) {
      e.preventDefault()
      const [path, hash] = href.split('#')
      console.log('📍 Hash link clicked - navigating to:', path, 'hash:', hash)
      
      // First navigate to the path
      router.push(path)
      
      // Then scroll to the element after navigation
      setTimeout(() => {
        const element = document.getElementById(hash)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    }
  }

  const rolePath = (role === 'SUPER_ADMIN' || role === 'admin') 
    ? 'admin' 
    : role.toLowerCase()

  // Base Links
  const navLinks = [
    { name: 'Dashboard', href: `/dashboard/${rolePath}`, icon: LayoutDashboard },
  ]

  // HOD SPECIFIC TOOLS
  if (role === 'hod' || role === 'SUPER_ADMIN' || role === 'admin') {
    navLinks.push({ name: 'Staff Registry', href: '/dashboard/hod#staff', icon: Users })
    navLinks.push({ name: 'Course Catalog', href: '/dashboard/hod#courses', icon: BookOpen }) 
    navLinks.push({ name: 'Allocations', href: '/dashboard/hod#allocations', icon: ClipboardList })
  }

  // ADMIN TOOLS
  if (role === 'admin' || role === 'SUPER_ADMIN') {
    navLinks.push({ name: 'Role Control', href: '/dashboard/admin/roles', icon: ShieldCheck })
    navLinks.push({ name: 'System Logs', href: '/dashboard/admin/logs', icon: Activity })
  }

  const isActiveLink = (href: string) => {
    if (!mounted) return false
    if (href.includes('#')) {
      const [path] = href.split('#')
      return pathname === path
    }
    return pathname === href
  }

  return (
    <motion.aside 
      animate={{ width: isCollapsed ? 90 : 280 }}
      className="bg-white border-r border-slate-200 flex flex-col min-h-screen sticky top-0 z-50 shadow-sm"
    >
      {/* Brand Header */}
      <div className="p-6 flex items-center justify-between border-b border-slate-50">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-3"
            >
              <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-600/20">
                <GraduationCap size={22}/>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 leading-none tracking-tight">BMU SAMS</span>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter mt-1 opacity-70">Global Standards</span>
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
      <nav className="flex-1 px-4 space-y-1.5 mt-6">
        {navLinks.map((link, index) => {
          const Icon = link.icon
          const isActive = isActiveLink(link.href)
          
          return (
            <Link 
              key={`${link.name}-${index}`} 
              href={link.href} 
              prefetch={false}
              onClick={(e) => handleHashLinkClick(e, link.href)}
            >
              <div className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 relative group ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}>
                <Icon size={20} className={isActive ? 'text-white' : 'group-hover:text-blue-600'} />
                
                {!isCollapsed && (
                  <span className="font-semibold text-sm tracking-wide">
                    {link.name}
                  </span>
                )}
                
                {isCollapsed && (
                  <div className="absolute left-20 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-xl z-[60]">
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
        <div className={`p-3 rounded-2xl bg-slate-50 mb-4 transition-all ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest text-center">
              Identity Verified
            </p>
            <p className="text-[11px] text-center font-bold text-red-900 mt-1 truncate uppercase">
              {role ? role.replace('_', ' ') : 'LOADING'}
            </p>
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