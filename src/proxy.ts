import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  const isDashboardRoute = pathname.startsWith('/dashboard')
  const isAuthRoute = pathname.startsWith('/auth')
  const isCompleteProfileRoute = pathname === '/complete-profile'
  const isPendingRoute = pathname.startsWith('/auth/pending')
  const isAdminRoute = pathname.startsWith('/dashboard/admin')
  const isLecturerVerifyPendingRoute = pathname.startsWith('/dashboard/lecturer/verification-pending')

  // 1) Not logged in: block dashboard only
  if (!user) {
    if (isDashboardRoute) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    return response
  }

  // 2) Load profile
  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('role, profile_completed, faculty_id, department_id, is_verified')
    .eq('id', user.id)
    .maybeSingle()

  // If profile missing or blocked, safest UX is to push to complete-profile
  // (You can change this later once you're 100% sure profiles always exist.)
  if (profErr || !profile) {
    if (!isCompleteProfileRoute) {
      return NextResponse.redirect(new URL('/complete-profile', request.url))
    }
    return response
  }

  const roleRaw = String(profile.role ?? 'PENDING')
  const role = roleRaw.toUpperCase()

  const isAuthority = role === 'ADMIN' || role === 'SUPER_ADMIN'

  const profileCompleted = profile.profile_completed === true
  const hasFaculty = !!profile.faculty_id
  const hasDept = !!profile.department_id

  // Assignment rules:
  // - PENDING = not assigned
  // - DEAN needs faculty only
  // - Lecturer/HOD need both faculty + department
  const isAssigned =
    role !== 'PENDING' &&
    (
      (role === 'DEAN' && hasFaculty) ||
      ((role === 'LECTURER' || role === 'HOD') && hasFaculty && hasDept) ||
      // if you later add other roles, default to needing both:
      (!(role === 'DEAN' || role === 'LECTURER' || role === 'HOD') && hasFaculty && hasDept)
    )

  // 3) Admins bypass everything
  if (isAuthority) {
    if (isCompleteProfileRoute || isPendingRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return response
  }

  /**
   * 4) FIRST PRIORITY:
   * If profile is NOT completed, they must see /complete-profile
   * (regardless of whether they try /dashboard, /auth/pending, etc.)
   *
   * Allow only:
   * - /complete-profile
   * - /auth/*  (so they can logout, reset password, etc.)
   * Everything else can remain accessible if you want (home page), but
   * they should never enter dashboard/pending while incomplete.
   */
  if (!profileCompleted) {
    if (!isCompleteProfileRoute && (isDashboardRoute || isPendingRoute)) {
      return NextResponse.redirect(new URL('/complete-profile', request.url))
    }
    return response
  }

  /**
 * 5) After profile completed, but BEFORE assignment:
 * - If they try to enter /dashboard -> send them to /auth/pending
 * - If they are already assigned and they visit /auth/pending -> send them to /dashboard
 */
if (!isAssigned) {
  if (isDashboardRoute) {
    return NextResponse.redirect(new URL('/auth/pending', request.url))
  }
  return response
}

if (isAssigned && isPendingRoute) {
  return NextResponse.redirect(new URL('/dashboard', request.url))
}

  /**
   * 6) Optional: lecturer verification gate (ONLY AFTER assignment)
   */
  const isLecturer = role === 'LECTURER'
  const isVerified = profile.is_verified === true

  if (isLecturer && !isVerified && isDashboardRoute && !isLecturerVerifyPendingRoute) {
    return NextResponse.redirect(new URL('/dashboard/lecturer/verification-pending', request.url))
  }

  /**
   * 7) Security: non-admins cannot access admin routes
   */
  if (isAdminRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}