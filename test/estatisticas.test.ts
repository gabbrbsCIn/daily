import { describe, expect, it } from 'vitest'
import { adversarios, contexto, emCampo, registro, resumo, type JogoVisto } from '@/lib/estatisticas'
import { detalhesManuais, lerGols } from '@/lib/manual'

let id = 0
function jogo(data: string, adversario: string, gs: number, ga: number, extra: Partial<JogoVisto> = {}): JogoVisto {
  id++
  return {
    id,
    partidaId: id,
    fonte: 'manual',
    data: `${data}T22:00:00.000Z`,
    competicao: 'Brasileirão Série A',
    adversario: { nome: adversario },
    sportMandante: true,
    golsSport: gs,
    golsAdversario: ga,
    detalhes: { escalacoes: { mandante: null, visitante: null }, eventos: [], estatisticas: [] },
    tags: [],
    top5: false,
    ...extra,
  }
}

const js = [
  jogo('2024-01-10', 'Náutico', 2, 0),
  jogo('2024-02-10', 'Santa Cruz', 1, 1),
  jogo('2024-03-10', 'Náutico', 3, 0),
  jogo('2024-04-10', 'Ceará', 0, 1),
  jogo('2025-05-10', 'Náutico', 1, 0),
]

describe('estatísticas', () => {
  it('calcula o registro e o aproveitamento', () => {
    expect(registro(js)).toEqual({ J: 5, V: 3, E: 1, D: 1, gp: 7, gc: 2, apr: 10 / 15 })
  })

  it('acha a maior invencibilidade e a maior goleada', () => {
    const r = resumo(js)
    expect(r.invencibilidade.map(j => j.id)).toEqual([js[0].id, js[1].id, js[2].id])
    expect(r.maiorGoleada?.id).toBe(js[2].id)
    expect(r.piorDerrota?.id).toBe(js[3].id)
    expect(r.temporadas.map(t => [t.temporada, t.J])).toEqual([[2024, 4], [2025, 1]])
  })

  it('monta a tabela de adversários', () => {
    expect(adversarios(js)[0]).toMatchObject({ nome: 'Náutico', J: 3, V: 3, ultimos: ['V', 'V', 'V'] })
  })

  it('dá o contexto do jogo', () => {
    const c = contexto(js, js[4].id)!
    expect(c).toMatchObject({ numero: 5, invicto: 1, contraAdversario: { J: 2, V: 2 } })
    expect(c.diasDesdeAnterior).toBe(395)
  })

  it('usa a data de Recife, não a de UTC', () => {
    // 00:30 UTC de 11/04 ainda é 10/04 em Recife.
    const tarde = jogo('2024-04-11', 'Bahia', 1, 0, { data: '2024-04-11T00:30:00.000Z' })
    expect(contexto([js[3], tarde], tarde.id)!.diasDesdeAnterior).toBe(0)
  })
})

describe('jogo preenchido à mão', () => {
  it('lê os gols digitados', () => {
    const { gols, erros } = lerGols("15 Jorginho\n45+2 Fulano (pên)\n80' Beltrano (contra)\nsem minuto", 'mandante')
    expect(erros).toEqual(['sem minuto'])
    expect(gols).toEqual([
      { tipo: 'gol', minuto: "15'", lado: 'mandante', jogador: 'Jorginho' },
      { tipo: 'gol', minuto: "45'+2'", lado: 'mandante', jogador: 'Fulano', penalti: true },
      { tipo: 'gol', minuto: "80'", lado: 'mandante', jogador: 'Beltrano', contra: true },
    ])
  })

  it('conta quem entrou como jogador visto', () => {
    const { detalhes } = detalhesManuais({
      golsSport: '10 A',
      golsAdversario: '',
      sportMandante: false,
      titulares: 'A, B\nC',
      entraram: 'D',
      tecnico: '',
    })
    const j = jogo('2017-04-16', 'Náutico', 1, 0, { sportMandante: false, detalhes })
    expect(emCampo(j)).toEqual(['A', 'B', 'C', 'D'])
    expect(resumo([j]).artilheiros).toEqual([['A', 1]])
  })
})
