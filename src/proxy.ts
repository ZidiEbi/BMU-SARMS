import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function normalizeRole(role: unknown) {
  if (!role) return 'pending'
  const value = String(role).trim()
  return value === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : value.toLowerCase()
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // 1. STATIC / INTERNAL BYPASS
  if (
    request.headers.get('x-nextjs-prefetch') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname === '/favicon.ico' ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  console.log('🛡️ Proxy processing:', pathname)

  // 2. ALWAYS ALLOW PUBLIC AUTH PAGES FIRST
  // This prevents stale/old sessions from interfering with opening the login UI.
  if (
    pathname.startsWith('/auth/login') ||
    pathname.startsWith('/auth/signup') ||
    pathname.startsWith('/auth/forgot-password') ||
    pathname.startsWith('/auth/callback')
  ) {
    console.log('🛡️ Allowing public auth route:', pathname)
    return NextResponse.next()
  }

  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 3. PUBLIC ROUTES
  const isDashboardRoute = pathname.startsWith('/dashboard')
  const isPendingRoute = pathname === '/auth/pending'
  const isDisabledRoute = pathname === '/disabled'

  if (!user) {
    if (isDashboardRoute || isPendingRoute) {
      console.log('🛡️ No user, redirecting to login')
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    return response
  }

  // 4. FETCH PROFILE FOR AUTHENTICATED USERS
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, is_verified, is_active, department_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('🛡️ Profile fetch error:', profileError.message)
  }

  if (!profile) {
    if (!isPendingRoute) {
      console.log('🛡️ No profile, redirecting to pending')
      return NextResponse.redirect(new URL('/auth/pending', request.url))
    }
    return response
  }

  const role = normalizeRole(profile.role)

  console.log('🛡️ User role:', role, 'path:', pathname)

  // 5. ACCOUNT DISABLED
  if (profile.is_active === false) {
    if (!isDisabledRoute) {
      console.log('🛡️ Account disabled, redirecting')
      return NextResponse.redirect(new URL('/disabled', request.url))
    }
    return response
  }

  // 6. PENDING USERS
  if (role === 'pending') {
    if (!isPendingRoute) {
      console.log('🛡️ Pending user, redirecting to pending')
      return NextResponse.redirect(new URL('/auth/pending', request.url))
    }
    return response
  }

  // 7. LECTURER NOT FULLY VERIFIED / DEPARTMENT NOT CONFIRMED
  if (role === 'lecturer' && (!profile.is_verified || !profile.department_id)) {
    if (!isPendingRoute) {
      console.log('🛡️ Lecturer not fully approved, redirecting to pending')
      return NextResponse.redirect(new URL('/auth/pending', request.url))
    }
    return response
  }

  // 8. ACTIVE USERS SHOULD NOT STAY ON PENDING
  if (isPendingRoute) {
    console.log('🛡️ Active user on pending page, redirecting to dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 9. DASHBOARD ROUTES ARE ALLOWED
  if (
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/hod') ||
    pathname.startsWith('/dashboard/admin') ||
    pathname.startsWith('/dashboard/lecturer') ||
    pathname.startsWith('/dashboard/student') ||
    pathname.startsWith('/dashboard/registry') ||
    pathname.startsWith('/dashboard/dean')
  ) {
    console.log('🛡️ Allowing dashboard route:', pathname)
    return response
  }

  // 10. EVERYTHING ELSE PASSES THROUGH
  return response
}