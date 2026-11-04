// Carrega o diário inicial (dados/diario_inicial.json) no banco.
//
//   npm run importar               # só busca as partidas que ainda não estão no banco
//   npm run importar -- --atualizar  # busca de novo todas as partidas da ESPN
//
// A ESPN é consultada ao vivo; a API-Football vem dos arquivos em dados/api-football/,
// para não gastar a cota. Presenças que já existem não são alteradas.
import { readFile } from 'node:fs/promises'
import { and, eq } from 'drizzle-orm'
import { partidas } from '../src/db/schema'
import { getDb } from '../src/lib/db'
import { normalizarPartida } from '../src/lib/fontes/apiFootball'
import { espn } from '../src/lib/fontes/espn'
import type { Fonte, PartidaCompleta } from '../src/lib/fontes/tipos'
import { criarPresenca, partidaManual, salvarPartida, sportEhMandante } from '../src/lib/partidas'

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

const atualizar = process.argv.includes('--atualizar')
const linhas: Linha[] = JSON.parse(await readFile('dados/diario_inicial.json', 'utf8'))
const db = await getDb()
const espera = (ms: number) => new Promise(r => setTimeout(r, ms))
const alertas: string[] = []
let falhas = 0

async function buscar(l: Linha): Promise<PartidaCompleta> {
  if (l.fonte === 'espn') {
    await espera(300)
    return espn.buscarPartida(l.fonteId!, l.liga)
  }
  if (l.fonte === 'api-football') {
    const arq = JSON.parse(await readFile(`dados/api-football/${l.fonteId}.json`, 'utf8'))
    return normalizarPartida({ ...arq.fixture, lineups: arq.lineups, events: arq.events, statistics: arq.statistics })
  }
  return partidaManual({
    data: l.data,
    adversario: l.adversario,
    golsSport: l.golsSport,
    golsAdversario: l.golsAdversario,
    competicao: l.competicao ?? 'Outra',
    sportMandante: true,
  })
}

for (const [i, l] of linhas.entries()) {
  const rotulo = `${l.data} Sport ${l.golsSport}x${l.golsAdversario} ${l.adversario}`
  let partidaId: number | undefined
  if (l.fonte !== 'manual' && !atualizar) {
    const [p] = await db
      .select({ id: partidas.id })
      .from(partidas)
      .where(and(eq(partidas.fonte, l.fonte), eq(partidas.fonteId, l.fonteId!)))
    partidaId = p?.id
  }
  if (!partidaId) {
    try {
      const p = await buscar(l)
      const placar = sportEhMandante(p) ? [p.golsMandante, p.golsVisitante] : [p.golsVisitante, p.golsMandante]
      if (placar[0] !== l.golsSport || placar[1] !== l.golsAdversario)
        alertas.push(`${rotulo}: placar na fonte ${placar.join('x')}`)
      partidaId = await salvarPartida(db, p)
    } catch (e) {
      alertas.push(`${rotulo}: ${(e as Error).message}`)
      falhas++
      continue
    }
  }
  await criarPresenca(db, partidaId, {
    top5: l.top5 ?? false,
    tags: l.tags ?? [],
    anotacao: l.anotacao ?? null,
    publicoCorrigido: l.publico ?? null,
    aviso: l.aviso ?? null,
  })
  process.stdout.write(`\r${i + 1}/${linhas.length}`)
}

console.log(`\n${linhas.length - falhas} jogos importados.`)
if (alertas.length) console.log(`Alertas:\n- ${alertas.join('\n- ')}`)
process.exit(0)
