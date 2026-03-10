import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function normalizeRole(role: unknown) {
  if (!role) return 'pending'
  const value = String(role).trim()
  return value === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : value.toLowerCase()
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // 1. STATIC ASSETS - Immediate bypass
  if (
    request.headers.get('x-nextjs-prefetch') ||
    pathname.startsWith('/_next') ||
    pathname.includes('favicon.ico') ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next()
  }

  console.log('🛡️ Proxy processing:', pathname)

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
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 2. AUTH GATE
  if (!user) {
    if (pathname.startsWith('/dashboard')) {
      console.log('🛡️ No user, redirecting to login')
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    return response
  }

  // 3. FETCH PROFILE
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_verified, is_active')
    .eq('id', user.id)
    .single()

  if (!profile) {
    if (pathname !== '/auth/pending' && !pathname.startsWith('/auth/login')) {
      console.log('🛡️ No profile, redirecting to pending')
      return NextResponse.redirect(new URL('/auth/pending', request.url))
    }
    return response
  }

  // 4. ROLE NORMALIZATION
  const role = normalizeRole(profile.role)

  console.log('🛡️ User role:', role, 'path:', pathname)

  // 5. ACCOUNT STATUS CHECK
  if (profile.is_active === false) {
    console.log('🛡️ Account disabled')
    if (pathname !== '/disabled') {
      return NextResponse.redirect(new URL('/disabled', request.url))
    }
    return response
  }

  // 6. PENDING USER GATE
  if (role === 'pending') {
    if (pathname !== '/auth/pending') {
      console.log('🛡️ Pending user, redirecting to pending')
      return NextResponse.redirect(new URL('/auth/pending', request.url))
    }
    return response
  }

  // 7. LECTURER VERIFICATION GATE ONLY
  if (role === 'lecturer' && !profile.is_verified) {
    if (
      pathname !== '/dashboard/lecturer/verification-pending' &&
      !pathname.startsWith('/auth/login')
    ) {
      console.log('🛡️ Lecturer not verified, redirecting to verification-pending')
      return NextResponse.redirect(
        new URL('/dashboard/lecturer/verification-pending', request.url)
      )
    }
    return response
  }

  // 8. REDIRECT ASSIGNED USERS AWAY FROM PENDING
  if (pathname === '/auth/pending') {
    console.log('🛡️ User has role, redirecting from pending to dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 9. ALLOW ALL ROLE-SPECIFIC PAGES
  if (
    pathname.startsWith('/dashboard/hod') ||
    pathname.startsWith('/dashboard/admin') ||
    pathname.startsWith('/dashboard/lecturer') ||
    pathname.startsWith('/dashboard/student')
  ) {
    console.log('🛡️ Allowing role-specific page:', pathname)
    return response
  }

  // 10. ROOT DASHBOARD - Let page component handle role redirect
  if (pathname === '/dashboard') {
    console.log('🛡️ Root dashboard - letting page handle redirect')
    return response
  }

  return response
}