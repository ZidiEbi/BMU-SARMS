import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // 1. Check for the Auth Code
  if (!code) {
    console.error("AUTH ERROR: No code found in URL")
    return NextResponse.redirect(`${origin}/auth/login`)
  }

  const supabase = await createSupabaseServerClient()

  // 2. Exchange code for session
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session) {
    console.error("AUTH ERROR: Session exchange failed:", error?.message)
    return NextResponse.redirect(`${origin}/auth/login`)
  }

  const userId = data.session.user.id

  // 3. Fetch role from profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    console.error("DATABASE ERROR: Could not fetch profile role:", profileError?.message)
    return NextResponse.redirect(`${origin}/auth/login?error=profile_fetch_failed`)
  }

  console.log("LOGIN SUCCESS: User detected with role:", profile.role)

  // 4. Role-based redirect - FIXED: Admin goes to /dashboard/admin
  const userRole = profile.role?.trim();
  switch (userRole) {
    case 'SUPER_ADMIN':
    case 'admin':
      return NextResponse.redirect(`${origin}/dashboard/admin`) // FIXED
      
    case 'registry':
      return NextResponse.redirect(`${origin}/dashboard/registry`)
      
    case 'lecturer':
      return NextResponse.redirect(`${origin}/dashboard/lecturer`)
      
    case 'hod':
      return NextResponse.redirect(`${origin}/dashboard/hod`)
      
    case 'dean':
      return NextResponse.redirect(`${origin}/dashboard/dean`)
      
    default:
      console.warn("UNKNOWN ROLE:", userRole);
      return NextResponse.redirect(`${origin}/dashboard`)
  }
}