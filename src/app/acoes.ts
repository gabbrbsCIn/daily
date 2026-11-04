'use server'
import { revalidatePath } from 'next/cache'
import { getDb } from '@/lib/db'
import { importarDiario } from '@/lib/importar'

export async function importarDiarioInicial() {
  await importarDiario(await getDb())
  revalidatePath('/', 'layout')
}
