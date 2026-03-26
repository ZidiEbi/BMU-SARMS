'use client'

import { useEffect, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import Sidebar from '@/components/dashboard/Sidebar'
import Header from '@/components/dashboard/Header'

type LayoutRole =
  | 'lecturer'
  | 'hod'
  | 'dean'
  | 'admin'
  | 'SUPER_ADMIN'
  | 'pending'
  | 'student'

type LayoutProfile = {
  role: LayoutRole
  full_name?: string | null
}

function normalizeRoleLabel(role: LayoutRole) {
  if (role === 'SUPER_ADMIN') return 'Super Admin'
  return role.charAt(0).toUpperCase() + role.slice(1)
}

function getPageMeta(pathname: string, role: LayoutRole) {
  if (pathname === '/dashboard/hod') {
    return {
      eyebrow: 'HOD Overview',
      title: 'Department Command Center',
      description:
        'Monitor staff, offerings, registrations, and approval readiness from one supervisory workspace.',
    }
  }

  if (pathname.startsWith('/dashboard/hod/verifications')) {
    return {
      eyebrow: 'Staff & Verifications',
      title: 'Department Verification Queue',
      description:
        'Review lecturer onboarding, staff identity, and departmental verification decisions.',
    }
  }

  if (pathname === '/dashboard/hod/offerings') {
    return {
      eyebrow: 'Offerings',
      title: 'Department Offering Operations',
      description:
        'Browse offerings, inspect assignments, and open focused academic workspaces.',
    }
  }

  if (pathname.startsWith('/dashboard/hod/offerings/')) {
    return {
      eyebrow: 'Offering Review',
      title: 'Supervisory Offering Workspace',
      description:
        'Review registrations, saved results, workflow status, and approval readiness for a specific offering.',
    }
  }

  if (pathname === '/dashboard/hod/results') {
    return {
      eyebrow: 'Results Review',
      title: 'Department Results Supervision',
      description:
        'Track saved, submitted, and approved result rows across departmental offerings.',
    }
  }

  if (pathname === '/dashboard/hod/allocations') {
    return {
      eyebrow: 'Allocations',
      title: 'Lecturer Allocation Control',
      description:
        'Spot assignment gaps quickly and monitor staffing coverage across offerings.',
    }
  }

  if (pathname === '/dashboard/hod/reports') {
    return {
      eyebrow: 'Reports',
      title: 'Department Readiness Reports',
      description:
        'Review academic progress, approval movement, and operational readiness by level.',
    }
  }

  if (pathname === '/dashboard/admin') {
    return {
      eyebrow: 'Admin Overview',
      title: 'Institution Control Center',
      description:
        'Manage system access, departmental oversight, and platform-wide operational visibility.',
    }
  }

  if (pathname.startsWith('/dashboard/admin/roles')) {
    return {
      eyebrow: 'Role Control',
      title: 'Access and Role Administration',
      description:
        'Manage role assignments, administrative privileges, and institutional access structure.',
    }
  }

  if (pathname.startsWith('/dashboard/admin/logs')) {
    return {
      eyebrow: 'System Logs',
      title: 'Audit and Activity Monitoring',
      description:
        'Inspect platform activity and administrative actions for accountability and control.',
    }
  }

  if (pathname === '/dashboard/lecturer') {
    return {
      eyebrow: 'Lecturer Workspace',
      title: 'Assigned Teaching Offerings',
      description:
        'Open published offerings, enter results, and manage academic submission progress.',
    }
  }

  if (pathname.startsWith('/dashboard/lecturer/courses/')) {
    return {
      eyebrow: 'Result Entry',
      title: 'Offering Result Entry Workspace',
      description:
        'Work through student rows carefully, save results, and prepare submissions for review.',
    }
  }

  if (pathname === '/dashboard/dean') {
    return {
      eyebrow: 'Dean Overview',
      title: 'Faculty Academic Oversight',
      description:
        'Monitor faculty-wide result readiness, escalations, and higher-level academic control.',
    }
  }

  return {
    eyebrow: `${normalizeRoleLabel(role)} Workspace`,
    title: 'Academic Operations Workspace',
    description:
      'Manage role-specific academic operations through a structured, production-grade dashboard.',
  }
}

export default function DashboardLayout({
  children,
  profile,
}: {
  children: React.ReactNode
  profile: LayoutProfile
}) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = useMemo(() => createBrowserClient(), [])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/auth/login')
        router.refresh()
      }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase])

  const pageMeta = getPageMeta(pathname, profile.role)

  return (
  <div className="min-h-screen bg-slate-100">
    <Sidebar role={profile.role} />

    <main className="ml-[280px] min-h-screen">
      <div className="sticky top-0 z-30 border-b border-slate-200/80 bg-slate-100/95 backdrop-blur">
        <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
          <Header
            userName={profile.full_name || 'User'}
            roleLabel={normalizeRoleLabel(profile.role)}
            eyebrow={pageMeta.eyebrow}
            title={pageMeta.title}
            description={pageMeta.description}
          />
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  </div>
)
}