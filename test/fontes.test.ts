import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { normalizarPartida } from '@/lib/fontes/apiFootball'
import { normalizarResumo, resumoDoCalendario } from '@/lib/fontes/espn'
import { acertarGolsContra, type Evento } from '@/lib/fontes/tipos'

const json = (p: string) => JSON.parse(readFileSync(p, 'utf8'))

describe('ESPN', () => {
  // Sport 2x1 Santos, 24/11/2024, o jogo do acesso.
  const p = normalizarResumo(json('test/fixtures/espn_700280.json'))

  it('lê placar, estádio, público e árbitro', () => {
    expect(p).toMatchObject({
      fonteId: '700280',
      liga: 'bra.2',
      competicao: 'Brasileirão Série B',
      mandante: { id: '7635', nome: 'Sport' },
      visitante: { nome: 'Santos' },
      golsMandante: 2,
      golsVisitante: 1,
      estadio: 'Ilha do Retiro',
      publico: 24389,
      arbitro: 'Bruno Arleu de Araujo',
    })
  })

  it('lê os gols com minuto, autor e pênalti', () => {
    const gols = p.eventos.filter(e => e.tipo === 'gol')
    expect(gols).toEqual([
      { tipo: 'gol', minuto: "45'+5'", lado: 'mandante', jogador: 'Lucas Lima', penalti: true },
      { tipo: 'gol', minuto: "63'", lado: 'mandante', jogador: 'Fabinho' },
      { tipo: 'gol', minuto: "76'", lado: 'visitante', jogador: 'Wendel' },
    ])
  })

  it('lê a escalação e as substituições do Sport', () => {
    expect(p.escalacoes.mandante?.formacao).toBe('4-4-2')
    expect(p.escalacoes.mandante?.titulares).toHaveLength(11)
    expect(p.escalacoes.mandante?.titulares[0]).toMatchObject({ nome: 'Caíque', posicao: 'G' })
    expect(p.eventos).toContainEqual({ tipo: 'substituicao', minuto: "54'", lado: 'mandante', entra: 'Fabinho', sai: 'Fabricio Domínguez' })
  })

  it('traduz as estatísticas', () => {
    expect(p.estatisticas.find(s => s.nome === 'Posse de bola (%)')).toEqual({ nome: 'Posse de bola (%)', mandante: '45.3', visitante: '54.7' })
  })

  it('lê uma linha do calendário', () => {
    const r = resumoDoCalendario(json('test/fixtures/espn_calendario.json'))
    expect(r).toMatchObject({ fonte: 'espn', liga: 'bra.2', competicao: 'Brasileirão Série B', encerrada: true })
    expect(r.mandante.nome).toBe('Botafogo-SP')
  })
})

describe('API-Football', () => {
  const arq = json('dados/api-football/1021242.json')
  // Sport 2x0 Retrô, final do Pernambucano de 2023.
  const p = normalizarPartida({ ...arq.fixture, lineups: arq.lineups, events: arq.events })

  it('lê a partida e troca o nome oficial do estádio', () => {
    expect(p).toMatchObject({
      fonteId: '1021242',
      competicao: 'Campeonato Pernambucano',
      mandante: { id: '123', nome: 'Sport' },
      golsMandante: 2,
      golsVisitante: 0,
      estadio: 'Ilha do Retiro',
      arbitro: 'Rodrigo José Pereira de Lima',
      fase: 'Finals',
    })
  })

  it('usa o nome da escalação nos eventos e acerta quem entra na substituição', () => {
    expect(p.eventos.filter(e => e.tipo === 'gol').map(e => e.tipo === 'gol' && e.jogador)).toEqual(['Vágner Love', 'Gabriel Santos'])
    expect(p.eventos).toContainEqual({ tipo: 'substituicao', minuto: "12'", lado: 'mandante', entra: 'Edinho', sai: 'F. Labandeira' })
    expect(p.escalacoes.mandante?.tecnico).toBe('Enderson Moreira')
  })
})

describe('gol contra', () => {
  it('inverte o lado quando a conta não bate com o placar', () => {
    const eventos: Evento[] = [
      { tipo: 'gol', minuto: "10'", lado: 'mandante', jogador: 'A' },
      { tipo: 'gol', minuto: "20'", lado: 'mandante', jogador: 'B', contra: true },
    ]
    expect(acertarGolsContra(eventos, 1).map(e => e.lado)).toEqual(['mandante', 'visitante'])
    expect(acertarGolsContra(eventos, 2)).toBe(eventos)
  })
})
