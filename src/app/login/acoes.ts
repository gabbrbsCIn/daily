'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { COOKIE, DURACAO_S, criarSessao, senhaCorreta } from '@/lib/auth'

export async function entrar(form: FormData) {
  const de = String(form.get('de') ?? '/')
  const destino = de.startsWith('/') && !de.startsWith('//') ? de : '/'
  if (!(await senhaCorreta(String(form.get('senha') ?? '')))) {
    redirect(`/login?erro=1&de=${encodeURIComponent(destino)}`)
  }
  ;(await cookies()).set(COOKIE, await criarSessao(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: DURACAO_S,
    path: '/',
  })
  redirect(destino)
}

export async function sair() {
  ;(await cookies()).delete(COOKIE)
  redirect('/login')
}
