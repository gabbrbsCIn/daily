'use server'
import { revalidatePath } from 'next/cache'
import { getDb } from '@/lib/db'
import { auth } from '@/lib/auth/server'
import { importarDiario } from '@/lib/importar'
import { ehDono, usuarioAtual } from '@/lib/sessao'
import { redirect } from 'next/navigation'

/** Só o dono: a lista em dados/diario_inicial.json é a dele. */
export async function importarDiarioInicial() {
  const usuario = await usuarioAtual()
  if (!ehDono(usuario)) return
  await importarDiario(await getDb(), usuario.id)
  revalidatePath('/', 'layout')
}

export async function sair() {
  await auth.signOut()
  redirect('/entrar')
}
