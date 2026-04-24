import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username')
  if (!username) return NextResponse.json({ available: false })

  const supabase = await createClient()
  const { data } = await (supabase.from('profiles') as any)
    .select('id')
    .eq('username', username)
    .maybeSingle()

  return NextResponse.json({ available: data === null })
}
