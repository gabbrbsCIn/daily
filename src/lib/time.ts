// O time do diário e os mapas de nomes que juntam as fontes.

export const TIME = {
  nome: 'Sport',
  ids: { espn: '7635', 'api-football': '123' } as Record<string, string>,
  // Pernambucano - 1 na API-Football (a ESPN não tem estaduais).
  pernambucanoApiFootball: 622,
}

export const ESTADIOS: Record<string, string> = {
  'Estádio Adelmar da Costa Carvalho': 'Ilha do Retiro',
  'Itaipava Arena Pernambuco': 'Arena de Pernambuco',
  'Arena Pernambuco': 'Arena de Pernambuco',
  'Estádio José do Rego Maciel': 'Arruda',
  'Estádio Eládio de Barros Carvalho': 'Aflitos',
}

const TIMES: Record<string, string> = {
  'Sport Recife': 'Sport',
  'Nautico Recife': 'Náutico',
}

// O mesmo jogador escrito de jeitos diferentes nas fontes (REQUISITOS.md, seção 1.2).
const JOGADORES: Record<string, string> = {
  'F. Labandeira': 'Facundo Labandeira',
  Ewerthon: 'Ewerton',
  'Vagner Love': 'Vágner Love',
}

export const nomeEstadio = (n?: string | null) => (n ? (ESTADIOS[n] ?? n) : undefined)
export const nomeTime = (n: string) => TIMES[n] ?? n
export const nomeJogador = (n: string) => JOGADORES[n] ?? n
