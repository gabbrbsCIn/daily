// Gols e escalação digitados à mão, para os jogos que nenhuma fonte tem.
import type { Detalhes, Evento, Lado } from './fontes/tipos'

const GOL = /^(\d{1,3})(?:\s*'?\s*\+\s*(\d{1,2}))?'?\s+(.+?)(?:\s*\((p[eê]n(?:alti)?|contra)\))?$/i

/** Uma linha por gol: "15 Jorginho", "45+2 Fulano (pên)", "80 Beltrano (contra)". */
export function lerGols(texto: string, lado: Lado): { gols: Evento[]; erros: string[] } {
  const gols: Evento[] = [], erros: string[] = []
  for (const linha of texto.split('\n').map(l => l.trim()).filter(Boolean)) {
    const m = GOL.exec(linha)
    if (!m) {
      erros.push(linha)
      continue
    }
    const [, min, acr, jogador, tipo] = m
    gols.push({
      tipo: 'gol',
      minuto: `${min}'` + (acr ? `+${acr}'` : ''),
      lado,
      jogador: jogador.trim(),
      ...(tipo && /^p/i.test(tipo) ? { penalti: true } : {}),
      ...(tipo && /contra/i.test(tipo) ? { contra: true } : {}),
    })
  }
  return { gols, erros }
}

export function escreverGols(d: Detalhes, lado: Lado) {
  return d.eventos
    .flatMap(e => (e.tipo === 'gol' && e.lado === lado ? [e] : []))
    .map(g => `${g.minuto.replaceAll("'", '')} ${g.jogador}${g.penalti ? ' (pên)' : g.contra ? ' (contra)' : ''}`)
    .join('\n')
}

/** Nomes separados por vírgula ou por linha. */
export const lerNomes = (texto: string) =>
  texto
    .split(/[\n,]/)
    .map(n => n.trim())
    .filter(Boolean)

const minutoNum = (m: string) => m.split('+').reduce((s, x) => s + (parseInt(x) || 0), 0)

export function detalhesManuais(campos: {
  golsSport: string
  golsAdversario: string
  sportMandante: boolean
  titulares: string
  entraram: string
  tecnico: string
}): { detalhes: Detalhes; erros: string[] } {
  const nosso: Lado = campos.sportMandante ? 'mandante' : 'visitante'
  const deles: Lado = campos.sportMandante ? 'visitante' : 'mandante'
  const a = lerGols(campos.golsSport, nosso), b = lerGols(campos.golsAdversario, deles)
  const titulares = lerNomes(campos.titulares)
  const entraram = lerNomes(campos.entraram)
  const escalacao =
    titulares.length || campos.tecnico.trim()
      ? {
          tecnico: campos.tecnico.trim() || undefined,
          titulares: titulares.map(nome => ({ nome })),
          reservas: [],
        }
      : null
  // Digitado à mão, quem entrou fica sem o minuto e sem quem saiu.
  const substituicoes: Evento[] = entraram.map(entra => ({ tipo: 'substituicao', minuto: '', lado: nosso, entra, sai: '' }))
  return {
    detalhes: {
      escalacoes: { mandante: campos.sportMandante ? escalacao : null, visitante: campos.sportMandante ? null : escalacao },
      eventos: [...a.gols, ...b.gols].sort((x, y) => minutoNum(x.minuto) - minutoNum(y.minuto)).concat(substituicoes),
      estatisticas: [],
    },
    erros: [...a.erros, ...b.erros],
  }
}
