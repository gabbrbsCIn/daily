import Link from 'next/link'
import { dia, resultado, type JogoVisto, type Resultado } from '@/lib/estatisticas'
import { diaSemana } from '@/lib/formato'

const CLASSICOS: Record<string, string> = { Náutico: 'Clássico dos Clássicos', 'Santa Cruz': 'Clássico das Multidões' }

export const Res = ({ r }: { r: Resultado }) => (
  <span className={`res ${r}`} aria-label={{ V: 'vitória', E: 'empate', D: 'derrota' }[r]}>
    {r}
  </span>
)

export function tagsDoJogo(j: JogoVisto) {
  const classico = CLASSICOS[j.adversario.nome]
  return [...j.tags, ...(classico ? [classico] : [])]
}

export const Tag = ({ t }: { t: string }) => (
  <span className={`tag${/Título|Acesso/.test(t) ? ' t' : /Clássico/.test(t) ? ' c' : ''}`}>{t}</span>
)

/** Placar sempre com o Sport à esquerda. */
export const placar = (j: JogoVisto) => `${j.golsSport}x${j.golsAdversario}`

export function LinhaJogo({ j }: { j: JogoVisto }) {
  const [, m, d] = dia(j.data).split('-')
  const tags = tagsDoJogo(j)
  return (
    <Link className="g" href={`/jogos/${j.id}`}>
      <div className="dt">
        <b>
          {d}/{m}
        </b>
        <span>{diaSemana(j.data)}</span>
      </div>
      <div className="who">
        <strong>
          {j.sportMandante ? '' : 'em '}
          {j.adversario.nome}
        </strong>
        <div className="tags">
          <span className="tag">{j.competicao}</span>
          {tags.map(t => (
            <Tag key={t} t={t} />
          ))}
          {j.top5 && <Tag t="Top 5?" />}
        </div>
      </div>
      <div className="scr">
        <b className="n">{placar(j)}</b>
        <Res r={resultado(j)} />
      </div>
    </Link>
  )
}
