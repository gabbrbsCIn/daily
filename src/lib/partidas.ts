// Gravação e leitura de partidas e presenças.
import { and, asc, eq, sql } from 'drizzle-orm'
import { consultas, partidas, presencas, type Partida, type Presenca } from '../db/schema'
import type { Db } from './db'
import { apiFootball } from './fontes/apiFootball'
import { espn } from './fontes/espn'
import type { Detalhes, Fonte, FonteDados, PartidaCompleta, Time } from './fontes/tipos'
import type { JogoVisto } from './estatisticas'
import { TIME, nomeEstadio } from './time'

export function fonteDados(db: Db, fonte: Fonte): FonteDados {
  if (fonte === 'espn') return espn
  if (fonte === 'api-football') {
    const chave = process.env.API_FOOTBALL_KEY
    if (!chave) throw new Error('Defina API_FOOTBALL_KEY para usar a API-Football.')
    return apiFootball(chave, () => contarConsulta(db, 'api-football'))
  }
  throw new Error(`Fonte sem API: ${fonte}`)
}

async function contarConsulta(db: Db, fonte: string) {
  const dia = new Date().toISOString().slice(0, 10)
  await db
    .insert(consultas)
    .values({ fonte, dia, total: 1 })
    .onConflictDoUpdate({ target: [consultas.fonte, consultas.dia], set: { total: sql`${consultas.total} + 1` } })
}

export async function consultasHoje(db: Db, fonte: string) {
  const dia = new Date().toISOString().slice(0, 10)
  const [c] = await db.select().from(consultas).where(and(eq(consultas.fonte, fonte), eq(consultas.dia, dia)))
  return c?.total ?? 0
}

export function sportEhMandante(p: PartidaCompleta) {
  const idSport = TIME.ids[p.fonte]
  return idSport ? p.mandante.id === idSport : p.mandante.nome === TIME.nome
}

function valores(p: PartidaCompleta) {
  return {
    fonte: p.fonte,
    fonteId: p.fonteId,
    liga: p.liga ?? null,
    data: new Date(p.data),
    competicao: p.competicao,
    fase: p.fase ?? null,
    mandante: p.mandante,
    visitante: p.visitante,
    sportMandante: sportEhMandante(p),
    golsMandante: p.golsMandante,
    golsVisitante: p.golsVisitante,
    estadio: p.estadio ?? null,
    cidade: p.cidade ?? null,
    publico: p.publico ?? null,
    arbitro: p.arbitro ?? null,
    detalhes: { escalacoes: p.escalacoes, eventos: p.eventos, estatisticas: p.estatisticas },
    consultadaEm: p.fonte === 'manual' ? null : new Date(),
  }
}

/** Grava (ou atualiza) a partida vinda de uma fonte e devolve o id no banco. */
export async function salvarPartida(db: Db, p: PartidaCompleta): Promise<number> {
  const v = valores(p)
  const [r] = await db
    .insert(partidas)
    .values(v)
    .onConflictDoUpdate({ target: [partidas.fonte, partidas.fonteId], set: v })
    .returning({ id: partidas.id })
  return r.id
}

/** Reescreve uma partida manual (a data ou o adversário podem ter mudado, e com eles o id). */
export async function atualizarPartidaManual(db: Db, partidaId: number, p: PartidaCompleta) {
  await db.update(partidas).set(valores(p)).where(eq(partidas.id, partidaId))
}

export interface PartidaManual {
  data: string // AAAA-MM-DD
  hora?: string // HH:MM, horário de Brasília
  adversario: string
  golsSport: number
  golsAdversario: number
  competicao: string
  sportMandante: boolean
  estadio?: string
  publico?: number
  arbitro?: string
  detalhes?: Detalhes
}

/** Jogo que nenhuma fonte tem: o id na "fonte manual" é a data e o adversário. */
export function partidaManual(m: PartidaManual): PartidaCompleta {
  const sport: Time = { nome: TIME.nome }
  const adv: Time = { nome: m.adversario.trim() }
  return {
    fonte: 'manual',
    fonteId: `${m.data}-${adv.nome.toLowerCase().replace(/\s+/g, '-')}`,
    data: new Date(`${m.data}T${m.hora || '12:00'}:00-03:00`).toISOString(),
    competicao: m.competicao,
    mandante: m.sportMandante ? sport : adv,
    visitante: m.sportMandante ? adv : sport,
    golsMandante: m.sportMandante ? m.golsSport : m.golsAdversario,
    golsVisitante: m.sportMandante ? m.golsAdversario : m.golsSport,
    estadio: nomeEstadio(m.estadio) || undefined,
    publico: m.publico || undefined,
    arbitro: m.arbitro || undefined,
    encerrada: true,
    ...(m.detalhes ?? { escalacoes: { mandante: null, visitante: null }, eventos: [], estatisticas: [] }),
  }
}

export async function criarPresenca(db: Db, partidaId: number, dados: Partial<Omit<Presenca, 'id' | 'partidaId'>> = {}) {
  const [r] = await db
    .insert(presencas)
    .values({ partidaId, ...dados })
    .onConflictDoNothing({ target: presencas.partidaId })
    .returning({ id: presencas.id })
  if (r) return r.id
  const [existente] = await db.select({ id: presencas.id }).from(presencas).where(eq(presencas.partidaId, partidaId))
  return existente.id
}

export function jogoVisto(pa: Partida, pr: Presenca): JogoVisto {
  const m = pa.sportMandante
  return {
    id: pr.id,
    partidaId: pa.id,
    fonte: pa.fonte as Fonte,
    data: pa.data.toISOString(),
    competicao: pa.competicao,
    fase: pa.fase ?? undefined,
    adversario: m ? pa.visitante : pa.mandante,
    sportMandante: m,
    golsSport: (m ? pa.golsMandante : pa.golsVisitante) ?? 0,
    golsAdversario: (m ? pa.golsVisitante : pa.golsMandante) ?? 0,
    estadio: pa.estadio ?? undefined,
    cidade: pa.cidade ?? undefined,
    publico: pr.publicoCorrigido ?? pa.publico ?? undefined,
    publicoDaFonte: pa.publico ?? undefined,
    arbitro: pa.arbitro ?? undefined,
    detalhes: pa.detalhes,
    setor: pr.setor ?? undefined,
    comQuem: pr.comQuem ?? undefined,
    anotacao: pr.anotacao ?? undefined,
    tags: pr.tags,
    top5: pr.top5,
    aviso: pr.aviso ?? undefined,
  }
}

/** Todos os jogos em que fui, do mais antigo ao mais recente. */
export async function listarJogos(db: Db): Promise<JogoVisto[]> {
  const linhas = await db
    .select()
    .from(presencas)
    .innerJoin(partidas, eq(presencas.partidaId, partidas.id))
    .orderBy(asc(partidas.data))
  return linhas.map(l => jogoVisto(l.partidas, l.presencas))
}
