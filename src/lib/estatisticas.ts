// Estatísticas dos jogos em que eu estava (REQUISITOS.md, seção 7). Funções puras.
import type { Detalhes, Escalacao, Fonte, Lado, Time } from './fontes/tipos'
import { nomeJogador } from './time'

export interface JogoVisto {
  id: number // presença
  partidaId: number
  fonte: Fonte
  data: string // ISO
  competicao: string
  fase?: string
  adversario: Time
  sportMandante: boolean
  golsSport: number
  golsAdversario: number
  estadio?: string
  cidade?: string
  publico?: number
  publicoDaFonte?: number
  arbitro?: string
  detalhes: Detalhes
  setor?: string
  comQuem?: string
  anotacao?: string
  tags: string[]
  top5: boolean
  aviso?: string
}

export type Resultado = 'V' | 'E' | 'D'

export interface Registro {
  J: number
  V: number
  E: number
  D: number
  gp: number
  gc: number
  apr: number // 0 a 1
}

const FUSO = 'America/Recife'

/** Data local (Recife) no formato AAAA-MM-DD. */
export function dia(iso: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSO }).format(new Date(iso))
}

export const temporada = (j: JogoVisto) => Number(dia(j.data).slice(0, 4))

export const resultado = (j: JogoVisto): Resultado =>
  j.golsSport > j.golsAdversario ? 'V' : j.golsSport < j.golsAdversario ? 'D' : 'E'

export function registro(js: JogoVisto[]): Registro {
  const r = { J: js.length, V: 0, E: 0, D: 0, gp: 0, gc: 0, apr: 0 }
  for (const j of js) {
    r[resultado(j)]++
    r.gp += j.golsSport
    r.gc += j.golsAdversario
  }
  r.apr = r.J ? (3 * r.V + r.E) / (3 * r.J) : 0
  return r
}

export const ladoSport = (j: JogoVisto): Lado => (j.sportMandante ? 'mandante' : 'visitante')
export const escalacaoSport = (j: JogoVisto): Escalacao | null => j.detalhes.escalacoes[ladoSport(j)]

/** Jogadores do Sport que entraram em campo: titulares e quem entrou no decorrer. */
export function emCampo(j: JogoVisto): string[] {
  const esc = escalacaoSport(j)
  if (!esc) return []
  const lado = ladoSport(j)
  const entraram = j.detalhes.eventos.flatMap(e => (e.tipo === 'substituicao' && e.lado === lado ? [e.entra] : []))
  return [...new Set([...esc.titulares.map(t => t.nome), ...entraram].map(nomeJogador))]
}

export function golsDoSport(j: JogoVisto) {
  const lado = ladoSport(j)
  return j.detalhes.eventos.flatMap(e => (e.tipo === 'gol' && e.lado === lado ? [e] : []))
}

function contar<T>(itens: T[], chave: (t: T) => string | undefined) {
  const m = new Map<string, number>()
  for (const i of itens) {
    const k = chave(i)
    if (k) m.set(k, (m.get(k) ?? 0) + 1)
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'))
}

/** Maior sequência de jogos seguidos em que `cond` vale. */
function maiorSequencia(js: JogoVisto[], cond: (j: JogoVisto) => boolean) {
  let melhor: JogoVisto[] = [], atual: JogoVisto[] = []
  for (const j of js) {
    atual = cond(j) ? [...atual, j] : []
    if (atual.length > melhor.length) melhor = atual
  }
  return melhor
}

/** Jogos devem vir em ordem cronológica. */
export function resumo(js: JogoVisto[]) {
  const comEscalacao = js.filter(j => escalacaoSport(j))
  const gols = js.flatMap(golsDoSport)
  const faixas = [0, 0, 0, 0, 0, 0]
  for (const g of gols) {
    const n = parseInt(g.minuto)
    if (n) faixas[Math.min(Math.floor((n - 1) / 15), 5)]++
  }
  const saldo = (j: JogoVisto) => j.golsSport - j.golsAdversario
  const porSaldo = [...js].sort((a, b) => saldo(b) - saldo(a) || b.golsSport - a.golsSport)
  const comPublico = js.filter(j => j.publico)
  const temporadas = contar(js, j => String(temporada(j)))
    .map(([t]) => Number(t))
    .sort((a, b) => a - b)
    .map(t => ({ temporada: t, ...registro(js.filter(j => temporada(j) === t)) }))

  return {
    geral: registro(js),
    primeiro: js[0],
    ultimo: js.at(-1),
    temporadas,
    invencibilidade: maiorSequencia(js, j => resultado(j) !== 'D'),
    vitoriasSeguidas: maiorSequencia(js, j => resultado(j) === 'V'),
    maiorGoleada: porSaldo[0] && saldo(porSaldo[0]) > 0 ? porSaldo[0] : undefined,
    piorDerrota: porSaldo.at(-1) && saldo(porSaldo.at(-1)!) < 0 ? porSaldo.at(-1) : undefined,
    semSofrerGol: js.filter(j => j.golsAdversario === 0).length,
    estadios: contar(js, j => j.estadio).map(([e]) => ({ estadio: e, ...registro(js.filter(j => j.estadio === e)) })),
    competicoes: contar(js, j => j.competicao).map(([c]) => ({ competicao: c, ...registro(js.filter(j => j.competicao === c)) })),
    artilheiros: contar(gols.filter(g => !g.contra), g => nomeJogador(g.jogador)),
    golsComAutor: gols.length,
    maisVistos: contar(comEscalacao.flatMap(emCampo), n => n),
    comEscalacao: comEscalacao.length,
    faixas,
    maiorPublico: [...comPublico].sort((a, b) => b.publico! - a.publico!)[0],
    arbitros: contar(js, j => j.arbitro),
    placares: contar(js, j => `${j.golsSport}x${j.golsAdversario}`),
    momentos: js.filter(j => j.tags.some(t => /Título|Acesso|Final|Despedida/i.test(t))),
  }
}

export function adversarios(js: JogoVisto[]) {
  const nomes = contar(js, j => j.adversario.nome).map(([n]) => n)
  return nomes
    .map(nome => {
      const deste = js.filter(j => j.adversario.nome === nome)
      return { nome, escudo: deste.at(-1)?.adversario.escudo, ...registro(deste), ultimos: deste.slice(-5).map(resultado) }
    })
    .sort((a, b) => b.J - a.J || b.apr - a.apr || a.nome.localeCompare(b.nome, 'pt-BR'))
}

/** Contexto de um jogo na minha história (RF14). `js` em ordem cronológica. */
export function contexto(js: JogoVisto[], id: number) {
  const i = js.findIndex(j => j.id === id)
  if (i < 0) return null
  const j = js[i], antes = js.slice(0, i), ate = js.slice(0, i + 1)
  const anterior = antes.at(-1)
  let invicto = 0
  for (let k = i; k >= 0 && resultado(js[k]) !== 'D'; k--) invicto++
  const vistosAntes = new Set(antes.flatMap(emCampo))
  const estreias = antes.some(a => escalacaoSport(a)) ? emCampo(j).filter(n => !vistosAntes.has(n)) : []
  return {
    numero: i + 1,
    total: js.length,
    contraAdversario: registro(antes.filter(a => a.adversario.nome === j.adversario.nome)),
    invicto,
    diasDesdeAnterior: anterior ? Math.round((Date.parse(dia(j.data)) - Date.parse(dia(anterior.data))) / 864e5) : null,
    anterior,
    proximo: js[i + 1],
    acumulado: registro(ate),
    estreias,
  }
}
