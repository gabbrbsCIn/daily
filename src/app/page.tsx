import Link from 'next/link'
import { getDb } from '@/lib/db'
import { resumo, type JogoVisto } from '@/lib/estatisticas'
import { dataCurta, num, pct, plural } from '@/lib/formato'
import { listarJogos } from '@/lib/partidas'
import { ehDono, usuarioAtual } from '@/lib/sessao'
import { importarDiarioInicial } from './acoes'
import { BotaoEnviar } from './botao'
import { placar } from './componentes'

const rotulo = (j: JogoVisto) => `${dataCurta(j.data)} · Sport ${placar(j)} ${j.adversario.nome}`

function Barras({ itens, max = 8 }: { itens: [string, number][]; max?: number }) {
  const lista = itens.slice(0, max)
  const topo = lista[0]?.[1] ?? 1
  return (
    <div className="hbars wide">
      {lista.map(([n, k]) => (
        <div className="hb" key={n}>
          <span>{n}</span>
          <div className="t">
            <i style={{ width: `${(k / topo) * 100}%` }} />
          </div>
          <b>{k}</b>
        </div>
      ))}
    </div>
  )
}

function Sequencia({ titulo, js }: { titulo: string; js: JogoVisto[] }) {
  return (
    <div className="rec">
      <span className="kick">{titulo}</span>
      <div className="v n">
        {js.length}
        <em>{js.length === 1 ? 'jogo' : 'jogos'}</em>
      </div>
      {js.length > 0 && (
        <p>
          De {dataCurta(js[0].data)} a {dataCurta(js.at(-1)!.data)}.
        </p>
      )}
    </div>
  )
}

// Carregar o diário inicial busca 84 partidas na ESPN.
export const maxDuration = 300

export default async function Resumo() {
  const usuario = await usuarioAtual()
  const js = await listarJogos(await getDb(), usuario.id)
  if (!js.length) {
    return (
      <section className="view">
        <div className="empty">
          <p>
            Nenhum jogo no seu diário ainda. <Link href="/registrar">Registre o primeiro jogo que você viu no estádio</Link>.
          </p>
          {ehDono(usuario) && (
            <form action={importarDiarioInicial}>
              <BotaoEnviar
                rotulo="Carregar os 94 jogos da minha lista"
                enviando="Buscando as partidas na ESPN, leva cerca de 1 minuto…"
              />
            </form>
          )}
        </div>
      </section>
    )
  }
  const r = resumo(js)
  const g = r.geral
  const faixas = ['1–15', '16–30', '31–45+', '46–60', '61–75', '76–90+'].map((f, i) => [f, r.faixas[i]] as [string, number])

  return (
    <section className="view">
      <div className="board">
        <div className="l">
          <span className="kick" style={{ color: '#a59c9e' }}>
            {dataCurta(r.primeiro!.data)} → {dataCurta(r.ultimo!.data)}
          </span>
          <div className="big n">
            {g.J}
            <small>jogos</small>
          </div>
          <p className="sub">{pct(g.apr)} de aproveitamento nos jogos em que você estava lá.</p>
        </div>
        <div className="r">
          <div className="vde">
            {(['V', 'E', 'D'] as const).map(k => (
              <div key={k}>
                <b className="n">{g[k]}</b>
                <span>
                  <i style={{ background: `var(--${k.toLowerCase()})` }} />
                  {{ V: 'vitórias', E: 'empates', D: 'derrotas' }[k]}
                </span>
              </div>
            ))}
          </div>
          <div className="rb" aria-hidden>
            {(['V', 'E', 'D'] as const).map(k => (
              <i key={k} style={{ width: `${(g[k] / g.J) * 100}%`, background: `var(--${k.toLowerCase()})` }} />
            ))}
          </div>
          <div className="facts">
            <div>
              <b className="n">{g.gp}</b>gols do Sport
            </div>
            <div>
              <b className="n">{g.gc}</b>gols sofridos
            </div>
            <div>
              <b className="n">{r.semSofrerGol}</b>sem sofrer gol
            </div>
          </div>
        </div>
      </div>

      <div className="sec">
        <div className="sec-h">
          <h2>Recordes</h2>
        </div>
        <div className="recs">
          <Sequencia titulo="Maior invencibilidade" js={r.invencibilidade} />
          <Sequencia titulo="Vitórias seguidas" js={r.vitoriasSeguidas} />
          {r.maiorGoleada && (
            <Link className="rec" href={`/jogos/${r.maiorGoleada.id}`}>
              <span className="kick">Maior goleada</span>
              <div className="v n">{placar(r.maiorGoleada)}</div>
              <p>{rotulo(r.maiorGoleada)}</p>
            </Link>
          )}
          {r.piorDerrota && (
            <Link className="rec" href={`/jogos/${r.piorDerrota.id}`}>
              <span className="kick">Pior derrota</span>
              <div className="v n">{placar(r.piorDerrota)}</div>
              <p>{rotulo(r.piorDerrota)}</p>
            </Link>
          )}
          {r.maiorPublico && (
            <Link className="rec" href={`/jogos/${r.maiorPublico.id}`}>
              <span className="kick">Maior público</span>
              <div className="v n">{num(r.maiorPublico.publico!)}</div>
              <p>{rotulo(r.maiorPublico)}</p>
            </Link>
          )}
          {r.estadios.slice(0, 2).map(e => (
            <div className="rec" key={e.estadio}>
              <span className="kick">{e.estadio}</span>
              <div className="v n">{pct(e.apr)}</div>
              <p>
                {plural(e.J, 'jogo', 'jogos')}: {e.V}V {e.E}E {e.D}D.
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="sec">
        <div className="sec-h">
          <h2>Por temporada</h2>
        </div>
        <div className="card scroll">
          <table>
            <thead>
              <tr>
                <th>Ano</th>
                <th className="num">J</th>
                <th className="num">V</th>
                <th className="num">E</th>
                <th className="num">D</th>
                <th className="num">Gols</th>
                <th className="num">Aprov.</th>
              </tr>
            </thead>
            <tbody>
              {[...r.temporadas].reverse().map(t => (
                <tr key={t.temporada}>
                  <td>
                    <Link href={`/jogos?ano=${t.temporada}`}>{t.temporada}</Link>
                  </td>
                  <td className="num">{t.J}</td>
                  <td className="num">{t.V}</td>
                  <td className="num">{t.E}</td>
                  <td className="num">{t.D}</td>
                  <td className="num">
                    {t.gp}:{t.gc}
                  </td>
                  <td className="num">{pct(t.apr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sec">
        <div className="sec-h">
          <h2>Em campo</h2>
          <p>
            Gols com autor em {r.golsComAutor} dos {g.gp} gols; escalação em {r.comEscalacao} dos {g.J} jogos.
          </p>
        </div>
        <div className="two">
          <div className="card sec">
            <h3>Artilheiros que você viu</h3>
            <Barras itens={r.artilheiros} />
          </div>
          <div className="card sec">
            <h3>Jogadores que você mais viu</h3>
            <Barras itens={r.maisVistos} />
          </div>
        </div>
        <div className="two">
          <div className="card sec">
            <h3>Quando saem os gols do Sport</h3>
            <Barras itens={faixas} />
          </div>
          <div className="card sec">
            <h3>Árbitros que você mais viu</h3>
            <Barras itens={r.arbitros} max={5} />
          </div>
        </div>
      </div>

      {r.momentos.length > 0 && (
        <div className="sec">
          <div className="sec-h">
            <h2>Momentos</h2>
          </div>
          <div className="moments">
            {r.momentos.map(j => (
              <Link key={j.id} className={`mo${j.tags.some(t => /Título|Acesso/.test(t)) ? ' t' : ''}`} href={`/jogos/${j.id}`}>
                <span className="when">{dataCurta(j.data)}</span>
                <b>{j.tags.join(' · ')}</b>
                <span>
                  Sport {placar(j)} {j.adversario.nome}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
