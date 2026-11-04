// API não oficial da ESPN (site.api.espn.com): grátis e sem chave. Pode mudar sem aviso.
import { nomeEstadio, nomeTime } from '../time'
import {
  acertarGolsContra,
  type Escalacao,
  type Estatistica,
  type Evento,
  type FonteDados,
  type Lado,
  type PartidaCompleta,
  type ResumoPartida,
  type Time,
} from './tipos'

const BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer'

const COMPETICOES: Record<string, string> = {
  'bra.1': 'Brasileirão Série A',
  'bra.2': 'Brasileirão Série B',
  'bra.copa_do_brazil': 'Copa do Brasil',
  'bra.copa_do_nordeste': 'Copa do Nordeste',
  'conmebol.sudamericana': 'Copa Sul-Americana',
  'conmebol.libertadores': 'Libertadores',
}

const ESTATISTICAS: Record<string, string> = {
  possessionPct: 'Posse de bola (%)',
  totalShots: 'Finalizações',
  shotsOnTarget: 'Finalizações no gol',
  wonCorners: 'Escanteios',
  foulsCommitted: 'Faltas',
  offsides: 'Impedimentos',
  saves: 'Defesas',
  yellowCards: 'Cartões amarelos',
  redCards: 'Cartões vermelhos',
}

// Respostas da ESPN sem tipo oficial.
type Json = any

// A ESPN devolve 502/504 de vez em quando; tenta de novo antes de desistir.
async function get(caminho: string, tentativas = 3): Promise<Json> {
  for (let t = 1; ; t++) {
    const r = await fetch(`${BASE}${caminho}`, { headers: { accept: 'application/json' }, cache: 'no-store' })
    const d = r.ok ? await r.json() : null
    if (d && !d.code) return d
    const erro = `ESPN ${caminho}: ${d ? (d.detail ?? d.code) : `HTTP ${r.status}`}`
    if (t >= tentativas || (r.status < 500 && !d?.code)) throw new Error(erro)
    await new Promise(ok => setTimeout(ok, 1000 * t))
  }
}

const competicao = (liga: Json) => COMPETICOES[liga?.slug] ?? liga?.name ?? ''

function time(c: Json): Time {
  return { id: String(c.team.id), nome: nomeTime(c.team.displayName), escudo: c.team.logos?.[0]?.href ?? c.team.logo }
}

function gols(c: Json): number | null {
  const s = typeof c.score === 'object' ? c.score?.displayValue : c.score
  return s === undefined || s === null || s === '' ? null : Number(s)
}

function lados(competidores: Json[]) {
  const casa = competidores.find(c => c.homeAway === 'home') ?? competidores[0]
  const fora = competidores.find(c => c.homeAway === 'away') ?? competidores[1]
  return { casa, fora }
}

export function resumoDoCalendario(e: Json): ResumoPartida {
  const c = e.competitions[0]
  const { casa, fora } = lados(c.competitors)
  return {
    fonte: 'espn',
    fonteId: String(e.id),
    liga: e.league?.slug,
    data: new Date(c.date ?? e.date).toISOString(),
    competicao: competicao(e.league),
    mandante: time(casa),
    visitante: time(fora),
    golsMandante: gols(casa),
    golsVisitante: gols(fora),
    estadio: nomeEstadio(c.venue?.fullName),
    encerrada: !!c.status?.type?.completed,
  }
}

export function normalizarResumo(d: Json, liga?: string): PartidaCompleta {
  const h = d.header
  const c = h.competitions[0]
  const { casa, fora } = lados(c.competitors)
  const lado = (timeId: unknown): Lado => (String(timeId) === String(casa.team.id) ? 'mandante' : 'visitante')

  const eventos: Evento[] = []
  for (const g of c.details ?? []) {
    if (!g.scoringPlay) continue
    eventos.push({
      tipo: 'gol',
      minuto: g.clock?.displayValue ?? '',
      lado: lado(g.team?.id),
      jogador: g.participants?.[0]?.athlete?.displayName ?? '',
      ...(g.penaltyKick ? { penalti: true } : {}),
      ...(g.ownGoal ? { contra: true } : {}),
    })
  }
  for (const k of d.keyEvents ?? []) {
    const tipo = k.type?.type ?? ''
    const nomes: string[] = (k.participants ?? []).map((p: Json) => p.athlete?.displayName ?? '')
    const base = { minuto: k.clock?.displayValue ?? '', lado: lado(k.team?.id) }
    if (tipo === 'yellow-card' || tipo === 'red-card') {
      eventos.push({ tipo: 'cartao', ...base, jogador: nomes[0] ?? '', cor: tipo === 'red-card' ? 'vermelho' : 'amarelo' })
    } else if (tipo === 'substitution' && nomes.length >= 2) {
      // Na ESPN, o primeiro participante entra e o segundo sai.
      eventos.push({ tipo: 'substituicao', ...base, entra: nomes[0], sai: nomes[1] })
    }
  }

  const escalacoes: PartidaCompleta['escalacoes'] = { mandante: null, visitante: null }
  for (const r of d.rosters ?? []) {
    if (!r.roster?.length) continue
    const jogadores = (filtro: (p: Json) => boolean) =>
      r.roster.filter(filtro).map((p: Json) => ({
        id: String(p.athlete.id),
        nome: p.athlete.displayName,
        posicao: p.position?.abbreviation === 'SUB' ? undefined : p.position?.abbreviation,
        numero: p.jersey,
      }))
    const e: Escalacao = {
      formacao: r.formation || undefined,
      titulares: jogadores(p => p.starter),
      reservas: jogadores(p => !p.starter),
    }
    // Jogos antigos às vezes trazem só um ou dois titulares: melhor tratar como sem escalação.
    if (e.titulares.length < 11) continue
    escalacoes[r.homeAway === 'home' ? 'mandante' : 'visitante'] = e
  }

  const estatisticas: Estatistica[] = []
  const box = d.boxscore?.teams ?? []
  const statsDe = (l: Lado) => box.find((t: Json) => lado(t.team?.id) === l)?.statistics ?? []
  const sm = statsDe('mandante'), sv = statsDe('visitante')
  for (const [chave, nome] of Object.entries(ESTATISTICAS)) {
    const a = sm.find((s: Json) => s.name === chave), b = sv.find((s: Json) => s.name === chave)
    if (a && b) estatisticas.push({ nome, mandante: a.displayValue, visitante: b.displayValue })
  }

  const golsMandante = gols(casa)
  const info = d.gameInfo ?? {}
  return {
    fonte: 'espn',
    fonteId: String(h.id),
    liga: h.league?.slug ?? liga,
    data: new Date(c.date).toISOString(),
    competicao: competicao(h.league),
    mandante: time(casa),
    visitante: time(fora),
    golsMandante,
    golsVisitante: gols(fora),
    estadio: nomeEstadio(info.venue?.fullName),
    cidade: info.venue?.address?.city,
    publico: info.attendance || undefined,
    arbitro: info.officials?.[0]?.displayName,
    encerrada: !!c.status?.type?.completed,
    escalacoes,
    eventos: acertarGolsContra(eventos, golsMandante),
    estatisticas,
  }
}

export const espn: FonteDados = {
  async buscarPartidasDoTime(timeId, temporada) {
    const d = await get(`/all/teams/${timeId}/schedule?season=${temporada}`)
    return (d.events ?? []).map(resumoDoCalendario)
  },
  async buscarPartida(fonteId, liga) {
    if (!liga) throw new Error('ESPN: a partida precisa da liga (ex.: bra.1)')
    return normalizarResumo(await get(`/${liga}/summary?event=${fonteId}`), liga)
  },
}
