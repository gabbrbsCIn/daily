// Carrega o diário inicial (dados/diario_inicial.json) no banco.
// A ESPN é consultada ao vivo; a API-Football vem dos arquivos em dados/api-football/,
// para não gastar a cota. Presenças que já existem não são alteradas.
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { and, eq } from 'drizzle-orm'
import { partidas } from '../db/schema'
import type { Db } from './db'
import { normalizarPartida } from './fontes/apiFootball'
import { espn } from './fontes/espn'
import type { Fonte, PartidaCompleta } from './fontes/tipos'
import { criarPresenca, partidaManual, salvarPartida, sportEhMandante } from './partidas'

interface Linha {
  data: string
  adversario: string
  golsSport: number
  golsAdversario: number
  fonte: Fonte
  fonteId?: string
  liga?: string
  competicao?: string
  top5?: boolean
  tags?: string[]
  anotacao?: string
  publico?: number
  aviso?: string
}

const DADOS = path.join(process.cwd(), 'dados')
const lerJson = async (arquivo: string) => JSON.parse(await readFile(path.join(DADOS, arquivo), 'utf8'))
const espera = (ms: number) => new Promise(r => setTimeout(r, ms))

async function buscar(l: Linha, usuarioId: string): Promise<PartidaCompleta> {
  if (l.fonte === 'espn') {
    await espera(300)
    return espn.buscarPartida(l.fonteId!, l.liga)
  }
  if (l.fonte === 'api-football') {
    const arq = await lerJson(`api-football/${l.fonteId}.json`)
    return normalizarPartida({ ...arq.fixture, lineups: arq.lineups, events: arq.events, statistics: arq.statistics })
  }
  return partidaManual(
    {
      data: l.data,
      adversario: l.adversario,
      golsSport: l.golsSport,
      golsAdversario: l.golsAdversario,
      competicao: l.competicao ?? 'Outra',
      sportMandante: true,
    },
    usuarioId,
  )
}

/** Importa no diário do usuário. `atualizar` busca de novo as partidas que já estão no banco. */
export async function importarDiario(
  db: Db,
  usuarioId: string,
  opcoes: { atualizar?: boolean; aoAvancar?: (feitos: number, total: number) => void } = {},
) {
  const linhas: Linha[] = await lerJson('diario_inicial.json')
  const alertas: string[] = []
  let importados = 0
  for (const [i, l] of linhas.entries()) {
    const rotulo = `${l.data} Sport ${l.golsSport}x${l.golsAdversario} ${l.adversario}`
    let partidaId: number | undefined
    if (l.fonte !== 'manual' && !opcoes.atualizar) {
      const [p] = await db
        .select({ id: partidas.id })
        .from(partidas)
        .where(and(eq(partidas.fonte, l.fonte), eq(partidas.fonteId, l.fonteId!)))
      partidaId = p?.id
    }
    if (!partidaId) {
      try {
        const p = await buscar(l, usuarioId)
        const placar = sportEhMandante(p) ? [p.golsMandante, p.golsVisitante] : [p.golsVisitante, p.golsMandante]
        if (placar[0] !== l.golsSport || placar[1] !== l.golsAdversario)
          alertas.push(`${rotulo}: placar na fonte ${placar.join('x')}`)
        partidaId = await salvarPartida(db, p)
      } catch (e) {
        alertas.push(`${rotulo}: ${(e as Error).message}`)
        continue
      }
    }
    await criarPresenca(db, usuarioId, partidaId, {
      top5: l.top5 ?? false,
      tags: l.tags ?? [],
      anotacao: l.anotacao ?? null,
      publicoCorrigido: l.publico ?? null,
      aviso: l.aviso ?? null,
    })
    importados++
    opcoes.aoAvancar?.(i + 1, linhas.length)
  }
  return { importados, total: linhas.length, alertas }
}
