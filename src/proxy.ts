import { auth } from './lib/auth/server'

export const proxy = auth.middleware({ loginUrl: '/entrar', publicRoutes: ['/entrar'] })

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg).*)'],
}
