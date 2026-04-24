import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username')
  if (!username) return NextResponse.json({ error: 'Username requerido' }, { status: 400 })

  const supabase = await createClient()
  const { data: profile } = await (supabase.from('profiles') as any)
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (!profile) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const admin = createAdminClient()
  const { data: { user }, error } = await admin.auth.admin.getUserById(profile.id)

  if (error || !user?.email) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  return NextResponse.json({ email: user.email })
}
