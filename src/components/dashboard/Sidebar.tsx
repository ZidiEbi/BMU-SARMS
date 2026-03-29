'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  LogOut,
  ChevronLeft,
  Menu,
  GraduationCap,
  ShieldCheck,
  Activity,
  BookOpen,
  FileCheck2,
  Files,
  Layers3,
  Clock,
} from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'

type SidebarRole =
  | 'lecturer'
  | 'hod'
  | 'dean'
  | 'admin'
  | 'SUPER_ADMIN'
  | 'pending'
  | 'student'

type NavItem = {
  name: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

function normalizeRole(role: unknown): SidebarRole {
  if (!role) return 'pending'
  const value = String(role).trim()
  return value === 'SUPER_ADMIN'
    ? 'SUPER_ADMIN'
    : (value.toLowerCase() as SidebarRole)
}

export default function Sidebar({
  role: initialRole,
}: {
  role: SidebarRole
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createBrowserClient()

  const role = normalizeRole(initialRole)
  const isAdmin = role === 'admin' || role === 'SUPER_ADMIN'
  const rolePath = isAdmin ? 'admin' : role

  const navLinks = useMemo<NavItem[]>(() => {
    const links: NavItem[] = [
      { name: 'Dashboard', href: `/dashboard/${rolePath}`, icon: LayoutDashboard },
    ]

    if (role === 'hod') {
      links.push(
        { name: 'Verifications', href: '/dashboard/hod/verifications', icon: Users },
        { name: 'Offerings', href: '/dashboard/hod/offerings', icon: BookOpen },
        { name: 'Results Review', href: '/dashboard/hod/results', icon: FileCheck2 },
        { name: 'Allocations', href: '/dashboard/hod/allocations', icon: Layers3 },
        { name: 'Reports', href: '/dashboard/hod/reports', icon: Files },
        { name: 'History', href: '/dashboard/hod/history', icon: Clock }
      )
    }

    if (isAdmin) {
      links.push(
        { name: 'HOD Overview', href: '/dashboard/hod', icon: BookOpen },
        { name: 'Verifications', href: '/dashboard/hod/verifications', icon: Users },
        { name: 'Offerings', href: '/dashboard/hod/offerings', icon: BookOpen },
        { name: 'Results Review', href: '/dashboard/hod/results', icon: FileCheck2 },
        { name: 'Allocations', href: '/dashboard/hod/allocations', icon: Layers3 },
        { name: 'Reports', href: '/dashboard/hod/reports', icon: Files },
        { name: 'Role Control', href: '/dashboard/admin/roles', icon: ShieldCheck },
        { name: 'System Logs', href: '/dashboard/admin/logs', icon: Activity }
      )
    }

    if (role === 'lecturer') {
      links.push(
        { name: 'My Offerings', href: '/dashboard/lecturer', icon: BookOpen }
      )
    }

    if (role === 'dean') {
      links.push(
        { name: 'Faculty Overview', href: '/dashboard/dean', icon: Files }
      )
    }

    return links
  }, [role, rolePath, isAdmin])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const isActiveLink = (href: string) => {
    if (href === '/dashboard/admin' && pathname.startsWith('/dashboard/admin')) {
      return true
    }

    if (href === '/dashboard/hod' && pathname === '/dashboard/hod') {
      return true
    }

    if (href !== '/dashboard/hod' && href.startsWith('/dashboard/hod') && pathname.startsWith(href)) {
      return true
    }

    if (href === '/dashboard/lecturer' && pathname.startsWith('/dashboard/lecturer')) {
      return true
    }

    if (href === '/dashboard/dean' && pathname.startsWith('/dashboard/dean')) {
      return true
    }

    if (href === '/dashboard/student' && pathname.startsWith('/dashboard/student')) {
      return true
    }

    return pathname === href
  }

  return (
    <motion.aside
  animate={{ width: isCollapsed ? 90 : 280 }}
  className="fixed left-0 top-0 h-screen bg-white border-r border-slate-200 flex flex-col z-50 shadow-sm"
>
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
                <GraduationCap size={22} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 leading-none tracking-tight">BMU SARMS</span>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter mt-1 opacity-70">
                  Global Standards
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-slate-50 rounded-lg border border-slate-100 transition-all text-slate-400"
        >
          {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 mt-6">
        {navLinks.map((link, index) => {
          const Icon = link.icon
          const isActive = isActiveLink(link.href)

          return (
            <Link
              key={`${link.name}-${index}`}
              href={link.href}
              prefetch={false}
            >
              <div
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 relative group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
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

      <div className="p-4 border-t border-slate-100">
        <div
          className={`p-3 rounded-2xl bg-slate-50 mb-4 transition-all ${
            isCollapsed ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest text-center">
            Identity Verified
          </p>
          <p className="text-[11px] text-center font-bold text-red-900 mt-1 truncate uppercase">
            {role ? role.replace('_', ' ') : 'PENDING'}
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