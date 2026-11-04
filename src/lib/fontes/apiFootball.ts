// API-Football (v3.football.api-sports.io): usada para o Pernambucano, que a ESPN não tem.
// Plano grátis: 100 consultas por dia e só as temporadas de 2022 a 2024.
import { TIME, nomeEstadio, nomeTime } from '../time'
import {
  acertarGolsContra,
  type Escalacao,
  type Estatistica,
  type Evento,
  type FonteDados,
  type Lado,
  type PartidaCompleta,
  type ResumoPartida,
} from './tipos'

const BASE = 'https://v3.football.api-sports.io'

const ESTATISTICAS: Record<string, string> = {
  'Ball Possession': 'Posse de bola (%)',
  'Total Shots': 'Finalizações',
  'Shots on Goal': 'Finalizações no gol',
  'Corner Kicks': 'Escanteios',
  Fouls: 'Faltas',
  Offsides: 'Impedimentos',
  'Goalkeeper Saves': 'Defesas',
  'Yellow Cards': 'Cartões amarelos',
  'Red Cards': 'Cartões vermelhos',
}

// Respostas da API-Football sem tipo oficial.
type Json = any

const minuto = (t: Json) => `${t.elapsed}'` + (t.extra ? `+${t.extra}'` : '')
const ENCERRADA = new Set(['FT', 'AET', 'PEN'])

export function resumoDaPartida(p: Json): ResumoPartida {
  return {
    fonte: 'api-football',
    fonteId: String(p.fixture.id),
    data: new Date(p.fixture.date).toISOString(),
    competicao: p.league.id === TIME.pernambucanoApiFootball ? 'Campeonato Pernambucano' : p.league.name,
    mandante: { id: String(p.teams.home.id), nome: nomeTime(p.teams.home.name), escudo: p.teams.home.logo },
    visitante: { id: String(p.teams.away.id), nome: nomeTime(p.teams.away.name), escudo: p.teams.away.logo },
    golsMandante: p.goals.home,
    golsVisitante: p.goals.away,
    estadio: nomeEstadio(p.fixture.venue?.name),
    encerrada: ENCERRADA.has(p.fixture.status?.short),
  }
}

/** `p` é um item de /fixtures?id=..., que já traz events, lineups e statistics. */
export function normalizarPartida(p: Json): PartidaCompleta {
  const resumo = resumoDaPartida(p)
  const lado = (timeId: unknown): Lado => (String(timeId) === resumo.mandante.id ? 'mandante' : 'visitante')

  // Os eventos às vezes escrevem o nome diferente da escalação ("Vagner Love"); vale o da escalação.
  const nomes = new Map<number, string>()
  for (const t of p.lineups ?? [])
    for (const x of [...t.startXI, ...t.substitutes]) if (x.player.id) nomes.set(x.player.id, x.player.name)
  const nome = (j: Json) => (j?.id && nomes.get(j.id)) || j?.name || ''

  const eventos: Evento[] = []
  for (const e of p.events ?? []) {
    const base = { minuto: minuto(e.time), lado: lado(e.team.id) }
    if (e.type === 'Goal' && e.detail !== 'Missed Penalty') {
      eventos.push({
        tipo: 'gol',
        ...base,
        jogador: nome(e.player),
        ...(e.detail === 'Penalty' ? { penalti: true } : {}),
        ...(e.detail === 'Own Goal' ? { contra: true } : {}),
      })
    } else if (e.type === 'Card') {
      eventos.push({ tipo: 'cartao', ...base, jogador: nome(e.player), cor: /red/i.test(e.detail) ? 'vermelho' : 'amarelo' })
    } else if (e.type === 'subst') {
      // Na API-Football, "player" sai e "assist" entra.
      eventos.push({ tipo: 'substituicao', ...base, entra: nome(e.assist), sai: nome(e.player) })
    }
  }

  const escalacoes: PartidaCompleta['escalacoes'] = { mandante: null, visitante: null }
  for (const t of p.lineups ?? []) {
    const jog = (x: Json) => ({
      id: x.player.id ? String(x.player.id) : undefined,
      nome: x.player.name,
      posicao: x.player.pos ?? undefined,
      numero: x.player.number ? String(x.player.number) : undefined,
    })
    const e: Escalacao = {
      formacao: t.formation ?? undefined,
      tecnico: t.coach?.name ?? undefined,
      titulares: t.startXI.map(jog),
      reservas: t.substitutes.map(jog),
    }
    escalacoes[lado(t.team.id)] = e
  }

  const estatisticas: Estatistica[] = []
  const statsDe = (l: Lado) => (p.statistics ?? []).find((s: Json) => lado(s.team.id) === l)?.statistics ?? []
  const sm = statsDe('mandante'), sv = statsDe('visitante')
  const valor = (v: unknown) => String(v ?? 0).replace('%', '')
  for (const [chave, n] of Object.entries(ESTATISTICAS)) {
    const a = sm.find((s: Json) => s.type === chave), b = sv.find((s: Json) => s.type === chave)
    if (a && b) estatisticas.push({ nome: n, mandante: valor(a.value), visitante: valor(b.value) })
  }

  return {
    ...resumo,
    fase: p.league.round,
    cidade: p.fixture.venue?.city?.split(',')[0],
    arbitro: p.fixture.referee?.split(',')[0] || undefined,
    escalacoes,
    eventos: acertarGolsContra(eventos, resumo.golsMandante),
    estatisticas,
  }
}

/** `aoConsultar` é chamado a cada consulta que gasta cota, para o app contar as próprias consultas. */
export function apiFootball(chave: string, aoConsultar?: () => Promise<void>): FonteDados {
  async function get(caminho: string, params: Record<string, string | number>) {
    const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))
    const r = await fetch(`${BASE}${caminho}?${qs}`, { headers: { 'x-apisports-key': chave }, cache: 'no-store' })
    if (!r.ok) throw new Error(`API-Football ${caminho}: HTTP ${r.status}`)
    const d = await r.json()
    const erros = Array.isArray(d.errors) ? d.errors : Object.values(d.errors ?? {})
    if (erros.length) throw new Error(`API-Football ${caminho}: ${erros.join('; ')}`)
    await aoConsultar?.()
    return d.response as Json[]
  }
  return {
    async buscarPartidasDoTime(timeId, temporada) {
      const r = await get('/fixtures', { team: timeId, season: temporada, league: TIME.pernambucanoApiFootball })
      return r.map(resumoDaPartida)
    },
    async buscarPartida(fonteId) {
      const [p] = await get('/fixtures', { id: fonteId })
      if (!p) throw new Error(`API-Football: partida ${fonteId} não encontrada`)
      return normalizarPartida(p)
    },
  }
}
