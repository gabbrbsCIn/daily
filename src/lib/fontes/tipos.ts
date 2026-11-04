// Formato comum das partidas, qualquer que seja a fonte (REQUISITOS.md, seção 8).

export type Fonte = 'espn' | 'api-football' | 'manual'
export type Lado = 'mandante' | 'visitante'

export interface Time {
  id?: string
  nome: string
  escudo?: string
}

export interface Jogador {
  id?: string
  nome: string
  posicao?: string
  numero?: string
}

export interface Escalacao {
  formacao?: string
  tecnico?: string
  titulares: Jogador[]
  reservas: Jogador[]
}

export type Evento =
  | { tipo: 'gol'; minuto: string; lado: Lado; jogador: string; penalti?: boolean; contra?: boolean }
  | { tipo: 'cartao'; minuto: string; lado: Lado; jogador: string; cor: 'amarelo' | 'vermelho' }
  | { tipo: 'substituicao'; minuto: string; lado: Lado; entra: string; sai: string }

export interface Estatistica {
  nome: string
  mandante: string
  visitante: string
}

export interface Detalhes {
  escalacoes: { mandante: Escalacao | null; visitante: Escalacao | null }
  eventos: Evento[]
  estatisticas: Estatistica[]
}

/** Linha do calendário de um time: o suficiente para escolher a partida. */
export interface ResumoPartida {
  fonte: Fonte
  fonteId: string
  liga?: string
  data: string // ISO 8601
  competicao: string
  mandante: Time
  visitante: Time
  golsMandante: number | null
  golsVisitante: number | null
  estadio?: string
  encerrada: boolean
}

export interface PartidaCompleta extends ResumoPartida, Detalhes {
  fase?: string
  cidade?: string
  publico?: number
  arbitro?: string
}

export interface FonteDados {
  buscarPartidasDoTime(timeId: string, temporada: number): Promise<ResumoPartida[]>
  buscarPartida(fonteId: string, liga?: string): Promise<PartidaCompleta>
}

/**
 * Gol contra: as fontes não deixam claro de que lado o gol entra. Se a conta
 * dos gols não bate com o placar, inverte o lado dos gols contra.
 */
export function acertarGolsContra(eventos: Evento[], golsMandante: number | null): Evento[] {
  const contra = eventos.filter(e => e.tipo === 'gol' && e.contra)
  if (!contra.length || golsMandante === null) return eventos
  const doMandante = eventos.filter(e => e.tipo === 'gol' && e.lado === 'mandante').length
  if (doMandante === golsMandante) return eventos
  return eventos.map(e =>
    e.tipo === 'gol' && e.contra ? { ...e, lado: e.lado === 'mandante' ? 'visitante' : 'mandante' } : e,
  )
}
