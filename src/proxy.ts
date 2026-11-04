import { NextResponse, type NextRequest } from 'next/server'
import { COOKIE, sessaoValida } from './lib/auth'

export async function proxy(req: NextRequest) {
  if (await sessaoValida(req.cookies.get(COOKIE)?.value)) return NextResponse.next()
  const login = new URL('/login', req.url)
  if (req.nextUrl.pathname !== '/') login.searchParams.set('de', req.nextUrl.pathname + req.nextUrl.search)
  return NextResponse.redirect(login)
}

export const config = {
  matcher: ['/((?!login|_next/|favicon.ico|icon.svg).*)'],
}
