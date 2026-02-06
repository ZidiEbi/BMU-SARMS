import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login`)
  }

  const supabase = await createSupabaseServerClient()

  // Exchange code for session
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/auth/login`)
  }

  const userId = data.session.user.id

  // Fetch role from profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    return NextResponse.redirect(`${origin}/auth/login`)
  }

  // 🔁 Role-based redirect
  switch (profile.role) {
    case 'REGISTRY':
      return NextResponse.redirect(`${origin}/dashboard/registry`)
    case 'LECTURER':
      return NextResponse.redirect(`${origin}/dashboard/lecturer`)
    case 'HOD':
      return NextResponse.redirect(`${origin}/dashboard/hod`)
    case 'DEAN':
      return NextResponse.redirect(`${origin}/dashboard/dean`)
    default:
      return NextResponse.redirect(`${origin}/dashboard`)
  }
}
