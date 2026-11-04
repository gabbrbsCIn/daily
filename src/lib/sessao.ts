// Quem está usando o app.
import { redirect } from 'next/navigation'
import { auth } from './auth/server'

export interface Usuario {
  id: string
  nome: string
  email: string
  imagem?: string
}

/** O usuário logado; sem sessão, manda para o login. */
export async function usuarioAtual(): Promise<Usuario> {
  const { data } = await auth.getSession()
  const u = data?.user
  if (!u) redirect('/entrar')
  return { id: u.id, nome: u.name || u.email, email: u.email, imagem: u.image ?? undefined }
}

/** O dono do app pode carregar a lista inicial de jogos (dados/diario_inicial.json). */
export const ehDono = (u: Usuario) => !!process.env.DONO_EMAIL && u.email.toLowerCase() === process.env.DONO_EMAIL.toLowerCase()
