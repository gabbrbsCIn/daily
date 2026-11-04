import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDb } from '@/lib/db'
import { contexto, escalacaoSport, ladoSport, resultado, type JogoVisto } from '@/lib/estatisticas'
import { dataCurta, dataLonga, hora, num, pct } from '@/lib/formato'
import { listarJogos } from '@/lib/partidas'
import { usuarioAtual } from '@/lib/sessao'
import { nomeJogador } from '@/lib/time'
import { Tag, placar, tagsDoJogo } from '../../componentes'
import { atualizarDaFonte } from './acoes'

const FONTES: Record<string, string> = { espn: 'ESPN', 'api-football': 'API-Football' }

function Campo({ rotulo, valor }: { rotulo: string; valor?: string | number | null }) {
  return (
    <div className="field">
      <span>{rotulo}</span>
      {valor ? <b>{valor}</b> : <b className="todo">a preencher</b>}
    </div>
  )
}

function semDados(j: JogoVisto, oQue: string) {
  return j.fonte === 'manual' ? 'Jogo preenchido à mão, sem dados de API.' : `A fonte não tem ${oQue} deste jogo.`
}

export default async function Jogo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const js = await listarJogos(await getDb(), (await usuarioAtual()).id)
  const ctx = contexto(js, Number(id))
  if (!ctx) notFound()
  const j = js[ctx.numero - 1]
  const r = resultado(j)
  const nosso = ladoSport(j)
  const esc = escalacaoSport(j)
  const eventos = j.detalhes.eventos
  const gols = eventos.filter(e => e.tipo === 'gol')
  const entraram = eventos.flatMap(e => (e.tipo === 'substituicao' && e.lado === nosso ? [e] : []))
  const cartoes = eventos.flatMap(e => (e.tipo === 'cartao' && e.lado === nosso ? [e] : []))
  const casa = j.sportMandante ? 'Sport' : j.adversario.nome
  const fora = j.sportMandante ? j.adversario.nome : 'Sport'
  const [gm, gv] = j.sportMandante ? [j.golsSport, j.golsAdversario] : [j.golsAdversario, j.golsSport]
  const tags = tagsDoJogo(j)
  const fonte = FONTES[j.fonte]

  return (
    <section className="view">
      <div className="pager">
        <Link className="back" href="/jogos">
          ← Jogos
        </Link>
        <span className="actions">
          <Link className="btn ghost" href={`/jogos/${j.id}/editar`}>
            Editar
          </Link>
          {fonte && (
            <form action={atualizarDaFonte.bind(null, j.id)}>
              <button className="btn ghost" title={`Buscar de novo na ${fonte}`}>
                Atualizar
              </button>
            </form>
          )}
        </span>
      </div>

      {j.aviso && (
        <div className="warn">
          <b>!</b>
          <span>{j.aviso}</span>
        </div>
      )}

      <article className="ticket">
        <div className="main">
          <div className="stripes" />
          <div className="hd">
            <span className="kick">
              Jogo nº {ctx.numero} de {ctx.total}
            </span>
            <span className="kick">
              {j.competicao}
              {j.fase ? ` · ${j.fase}` : ''}
            </span>
          </div>
          <div className="match">
            <div className="team">{casa}</div>
            <div className="score n">
              {gm}
              <i>x</i>
              {gv}
            </div>
            <div className="team away">{fora}</div>
          </div>
          <div className="when">
            {dataLonga(j.data)}
            {j.fonte !== 'manual' && `, ${hora(j.data)}`} · {{ V: 'vitória', E: 'empate', D: 'derrota' }[r]}
          </div>
          {(tags.length > 0 || j.top5) && (
            <div className="tags">
              {tags.map(t => (
                <Tag key={t} t={t} />
              ))}
              {j.top5 && <Tag t="Candidato ao top 5" />}
            </div>
          )}
        </div>
        <aside className="stub">
          <Campo rotulo="Estádio" valor={j.estadio} />
          <Campo rotulo="Público" valor={j.publico && num(j.publico)} />
          <Campo rotulo="Árbitro" valor={j.arbitro} />
          {esc?.tecnico && <Campo rotulo="Técnico" valor={esc.tecnico} />}
          <Campo rotulo="Setor" valor={j.setor} />
          <Campo rotulo="Com quem" valor={j.comQuem} />
          <span className="src">
            {fonte ? `Dados da partida: ${fonte}` : 'Jogo preenchido à mão'}
            {j.publico && j.publico !== j.publicoDaFonte ? '. Público corrigido por você' : ''}
          </span>
        </aside>
      </article>

      <div className="sec">
        <div className="sec-h">
          <h2>Contexto</h2>
          <p>Calculado com os jogos que você viu até este dia.</p>
        </div>
        <div className="ctx">
          <div className="rec">
            <span className="kick">Contra o {j.adversario.nome}</span>
            <div className="v">{ctx.contraAdversario.J ? `${ctx.contraAdversario.J + 1}º jogo` : 'Primeira vez'}</div>
            <p>
              {ctx.contraAdversario.J
                ? `Antes deste: ${ctx.contraAdversario.V}V ${ctx.contraAdversario.E}E ${ctx.contraAdversario.D}D.`
                : 'Você nunca tinha visto esse confronto.'}
            </p>
          </div>
          <div className="rec">
            <span className="kick">Sequência invicta</span>
            <div className="v n">
              {ctx.invicto}
              <em>{ctx.invicto === 1 ? 'jogo' : 'jogos'}</em>
            </div>
            <p>{r === 'D' ? 'A derrota encerrou a sequência.' : 'Sem ver o Sport perder, contando este jogo.'}</p>
          </div>
          <div className="rec">
            <span className="kick">Desde o jogo anterior</span>
            <div className="v n">
              {ctx.diasDesdeAnterior ?? '–'}
              <em>{ctx.diasDesdeAnterior === null ? '' : ctx.diasDesdeAnterior === 1 ? 'dia' : 'dias'}</em>
            </div>
            <p>
              {ctx.anterior
                ? `${dataCurta(ctx.anterior.data)}, ${placar(ctx.anterior)} ${ctx.anterior.adversario.nome}.`
                : 'Seu primeiro jogo registrado.'}
            </p>
          </div>
          <div className="rec">
            <span className="kick">Aproveitamento até aqui</span>
            <div className="v n">{pct(ctx.acumulado.apr)}</div>
            <p>
              {ctx.acumulado.V}V {ctx.acumulado.E}E {ctx.acumulado.D}D nos seus {ctx.acumulado.J} primeiros jogos.
            </p>
          </div>
          {ctx.estreias.length > 0 && (
            <div className="rec">
              <span className="kick">Primeira vez que você viu</span>
              <div className="v n">
                {ctx.estreias.length}
                <em>{ctx.estreias.length === 1 ? 'jogador' : 'jogadores'}</em>
              </div>
              <p>{ctx.estreias.join(', ')}.</p>
            </div>
          )}
        </div>
      </div>

      {j.anotacao && (
        <div className="sec">
          <div className="sec-h">
            <h2>Anotação</h2>
          </div>
          <p className="note">{j.anotacao}</p>
        </div>
      )}

      <div className="two">
        <div className="sec card">
          <div className="sec-h">
            <h2>Gols</h2>
          </div>
          {gols.length ? (
            <ol className="goals">
              {gols.map((g, i) => (
                <li key={i} className={g.lado === nosso ? 'us' : ''}>
                  <span className="mono">{g.minuto}</span>
                  <b>{nomeJogador(g.jogador)}</b>
                  <span>
                    {g.lado === nosso ? 'Sport' : j.adversario.nome}
                    {g.penalti ? ' · pênalti' : g.contra ? ' · contra' : ''}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">{j.golsSport + j.golsAdversario === 0 ? 'Jogo sem gols.' : semDados(j, 'os autores dos gols')}</p>
          )}
        </div>
        <div className="sec card">
          <div className="sec-h">
            <h2>Escalação do Sport</h2>
            {esc?.formacao && <span className="mono">{esc.formacao}</span>}
          </div>
          {esc ? (
            <>
              <ol className="xi">
                {esc.titulares.map(t => (
                  <li key={t.id ?? t.nome}>{nomeJogador(t.nome)}</li>
                ))}
              </ol>
              {entraram.length > 0 && (
                <p className="muted">
                  Entraram: {entraram.map(s => nomeJogador(s.entra) + (s.minuto ? ` (${s.minuto})` : '')).join(', ')}
                </p>
              )}
              {cartoes.length > 0 && (
                <p className="muted">
                  Cartões: {cartoes.map(c => `${nomeJogador(c.jogador)} ${c.cor === 'vermelho' ? '🟥' : '🟨'} ${c.minuto}`).join(', ')}
                </p>
              )}
            </>
          ) : (
            <p className="muted">{semDados(j, 'a escalação')}</p>
          )}
        </div>
      </div>

      {j.detalhes.estatisticas.length > 0 && (
        <div className="sec card">
          <div className="sec-h">
            <h2>Estatísticas</h2>
          </div>
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th className="num">{casa}</th>
                  <th />
                  <th>{fora}</th>
                </tr>
              </thead>
              <tbody>
                {j.detalhes.estatisticas.map(s => (
                  <tr key={s.nome}>
                    <td className="num">{s.mandante}</td>
                    <td style={{ textAlign: 'center', color: 'var(--ink-2)' }}>{s.nome}</td>
                    <td>{s.visitante}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="pager">
        {ctx.anterior ? (
          <Link href={`/jogos/${ctx.anterior.id}`}>
            ← {dataCurta(ctx.anterior.data)} {ctx.anterior.adversario.nome}
          </Link>
        ) : (
          <span />
        )}
        {ctx.proximo && (
          <Link href={`/jogos/${ctx.proximo.id}`}>
            {dataCurta(ctx.proximo.data)} {ctx.proximo.adversario.nome} →
          </Link>
        )}
      </div>
    </section>
  )
}
