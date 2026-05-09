import createIntlMiddleware from 'next-intl/middleware'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from './i18n/routing'

const handleI18nRouting = createIntlMiddleware(routing)

const LOCALE_PATTERN = `(?:${routing.locales.join('|')})`
const ADMIN_RE = new RegExp(`^/${LOCALE_PATTERN}/admin(?:/|$)`)
const ADMIN_NEW_WORK_RE = new RegExp(`^/${LOCALE_PATTERN}/admin/nueva-obra/?$`)

function getLocaleFromPath(pathname: string): string {
  const seg = pathname.split('/')[1]
  return (routing.locales as readonly string[]).includes(seg) ? seg : routing.defaultLocale
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Para /api y /auth: saltar i18n. Solo refrescar sesión Supabase.
  const skipI18n = pathname.startsWith('/api') || pathname.startsWith('/auth')

  let response: NextResponse
  if (skipI18n) {
    response = NextResponse.next({ request })
  } else {
    response = handleI18nRouting(request)
    // Si next-intl decidió redirigir (sin prefijo → con prefijo, etc.), salir ya.
    if (response.headers.get('location')) {
      return response
    }
  }

  // 2. Adjuntar Supabase a la response que vayamos a devolver.
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

  // 3. Proteger /{locale}/admin.
  if (ADMIN_RE.test(pathname)) {
    const locale = getLocaleFromPath(pathname)

    if (!user) {
      const redirect = NextResponse.redirect(new URL(`/${locale}/login`, request.url))
      response.cookies.getAll().forEach((c) => redirect.cookies.set(c))
      return redirect
    }

    // /{locale}/admin/nueva-obra accesible a cualquier usuario autenticado.
    if (ADMIN_NEW_WORK_RE.test(pathname)) {
      return response
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!['admin', 'editor'].includes((profile as { role?: string } | null)?.role ?? '')) {
      const redirect = NextResponse.redirect(new URL(`/${locale}`, request.url))
      response.cookies.getAll().forEach((c) => redirect.cookies.set(c))
      return redirect
    }
  }

  return response
}

export const config = {
  matcher: [
    // Excluye assets internos y archivos de imagen estáticos. Incluye /api y /auth
    // (Supabase los necesita para refrescar la sesión).
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
