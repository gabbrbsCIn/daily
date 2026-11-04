'use server'
import { redirect } from 'next/navigation'
import { getDb } from '@/lib/db'
import type { Fonte } from '@/lib/fontes/tipos'
import { criarPresenca, fonteDados, partidaManual, salvarPartida } from '@/lib/partidas'

export async function registrarDaFonte(fonte: Fonte, fonteId: string, liga?: string) {
  const db = await getDb()
  const p = await fonteDados(db, fonte).buscarPartida(fonteId, liga)
  const id = await criarPresenca(db, await salvarPartida(db, p))
  redirect(`/jogos/${id}/editar`)
}

export type EstadoManual = { erro?: string }

export async function registrarManual(_: EstadoManual, form: FormData): Promise<EstadoManual> {
  const t = (k: string) => String(form.get(k) ?? '').trim()
  const data = t('data'), adversario = t('adversario')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || !adversario) return { erro: 'Preencha a data e o adversário.' }
  const db = await getDb()
  const p = partidaManual({
    data,
    adversario,
    golsSport: Number(t('golsSport')),
    golsAdversario: Number(t('golsAdversario')),
    competicao: t('competicao') || 'Outra',
    sportMandante: t('mando') !== 'fora',
    estadio: t('estadio'),
  })
  const id = await criarPresenca(db, await salvarPartida(db, p))
  redirect(`/jogos/${id}/editar`)
}
