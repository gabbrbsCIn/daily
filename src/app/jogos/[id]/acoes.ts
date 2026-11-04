'use server'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { partidas, presencas } from '@/db/schema'
import { getDb } from '@/lib/db'
import type { Fonte } from '@/lib/fontes/tipos'
import { detalhesManuais } from '@/lib/manual'
import { atualizarPartidaManual, fonteDados, partidaManual, salvarPartida } from '@/lib/partidas'
import { usuarioAtual } from '@/lib/sessao'

/** A partida da presença, só se a presença for do usuário logado. */
async function partidaDa(presencaId: number) {
  const usuario = await usuarioAtual()
  const db = await getDb()
  const [l] = await db
    .select({ id: partidas.id, fonte: partidas.fonte, fonteId: partidas.fonteId, liga: partidas.liga })
    .from(presencas)
    .innerJoin(partidas, eq(presencas.partidaId, partidas.id))
    .where(and(eq(presencas.id, presencaId), eq(presencas.usuarioId, usuario.id)))
  return { db, partida: l, usuario }
}

/** Busca de novo a partida na fonte (RF09): público e escalação às vezes chegam depois. */
export async function atualizarDaFonte(presencaId: number) {
  const { db, partida } = await partidaDa(presencaId)
  if (!partida || partida.fonte === 'manual') return
  const p = await fonteDados(db, partida.fonte as Fonte).buscarPartida(partida.fonteId, partida.liga ?? undefined)
  await salvarPartida(db, p)
  revalidatePath('/', 'layout')
}

const texto = (f: FormData, k: string) => String(f.get(k) ?? '').trim()
const numero = (f: FormData, k: string) => Number(texto(f, k).replace(/\D/g, '')) || null

export type EstadoForm = { erro?: string }

export async function salvarJogo(presencaId: number, _: EstadoForm, form: FormData): Promise<EstadoForm> {
  const { db, partida, usuario } = await partidaDa(presencaId)
  if (!partida) return { erro: 'Jogo não encontrado.' }
  const manual = partida.fonte === 'manual'

  if (manual) {
    const sportMandante = texto(form, 'mando') !== 'fora'
    const { detalhes, erros } = detalhesManuais({
      golsSport: texto(form, 'golsSportLista'),
      golsAdversario: texto(form, 'golsAdversarioLista'),
      sportMandante,
      titulares: texto(form, 'titulares'),
      entraram: texto(form, 'entraram'),
      tecnico: texto(form, 'tecnico'),
    })
    if (erros.length)
      return { erro: `Não entendi estas linhas de gol: ${erros.join('; ')}. Use "minuto Nome", ex.: 45+2 Fulano (pên).` }
    const data = texto(form, 'data'),
      adversario = texto(form, 'adversario')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || !adversario) return { erro: 'Preencha a data e o adversário.' }
    const p = partidaManual(
      {
        data,
        hora: texto(form, 'hora'),
        adversario,
        golsSport: Number(texto(form, 'golsSport')),
        golsAdversario: Number(texto(form, 'golsAdversario')),
        competicao: texto(form, 'competicao') || 'Outra',
        sportMandante,
        estadio: texto(form, 'estadio'),
        publico: numero(form, 'publico') ?? undefined,
        arbitro: texto(form, 'arbitro'),
        detalhes,
      },
      usuario.id,
    )
    await atualizarPartidaManual(db, partida.id, p)
  }

  await db
    .update(presencas)
    .set({
      setor: texto(form, 'setor') || null,
      comQuem: texto(form, 'comQuem') || null,
      anotacao: texto(form, 'anotacao') || null,
      tags: texto(form, 'tags')
        .split(',')
        .map(t => t.trim())
        .filter(Boolean),
      top5: form.get('top5') === 'on',
      publicoCorrigido: manual ? null : numero(form, 'publico'),
      aviso: form.get('manterAviso') === 'on' ? texto(form, 'aviso') || null : null,
    })
    .where(and(eq(presencas.id, presencaId), eq(presencas.usuarioId, usuario.id)))
  revalidatePath('/', 'layout')
  redirect(`/jogos/${presencaId}`)
}

export async function excluirPresenca(presencaId: number) {
  const { db, partida } = await partidaDa(presencaId)
  if (!partida) return
  await db.delete(presencas).where(eq(presencas.id, presencaId))
  // Partida manual só existe por causa da presença.
  if (partida.fonte === 'manual') await db.delete(partidas).where(eq(partidas.id, partida.id))
  revalidatePath('/', 'layout')
  redirect('/jogos')
}
