import Link from 'next/link'
import { getDb } from '@/lib/db'
import { adversarios } from '@/lib/estatisticas'
import { pct } from '@/lib/formato'
import { listarJogos } from '@/lib/partidas'
import { usuarioAtual } from '@/lib/sessao'
import { Res } from '../componentes'

export const metadata = { title: 'Adversários · Diário do Leão' }

export default async function Adversarios() {
  const lista = adversarios(await listarJogos(await getDb(), (await usuarioAtual()).id))
  // Freguês e carrasco só entre adversários com 3 jogos ou mais (REQUISITOS.md, 7.1).
  const comTres = lista.filter(a => a.J >= 3).sort((a, b) => b.apr - a.apr || b.J - a.J)
  const fregues = comTres[0], carrasco = comTres.at(-1)

  return (
    <section className="view">
      <div className="recs">
        {lista[0] && (
          <div className="rec">
            <span className="kick">Mais visto</span>
            <div className="v">{lista[0].nome}</div>
            <p>
              {lista[0].J} jogos: {lista[0].V}V {lista[0].E}E {lista[0].D}D.
            </p>
          </div>
        )}
        {fregues && (
          <div className="rec">
            <span className="kick">Freguês</span>
            <div className="v">{fregues.nome}</div>
            <p>
              {pct(fregues.apr)} em {fregues.J} jogos.
            </p>
          </div>
        )}
        {carrasco && carrasco !== fregues && (
          <div className="rec">
            <span className="kick">Carrasco</span>
            <div className="v">{carrasco.nome}</div>
            <p>
              {pct(carrasco.apr)} em {carrasco.J} jogos.
            </p>
          </div>
        )}
      </div>
      <div className="card scroll">
        <table>
          <thead>
            <tr>
              <th>Adversário</th>
              <th className="num">J</th>
              <th className="num">V</th>
              <th className="num">E</th>
              <th className="num">D</th>
              <th className="num">Gols</th>
              <th className="num">Aprov.</th>
              <th>Últimos</th>
            </tr>
          </thead>
          <tbody>
            {lista.map(a => (
              <tr key={a.nome}>
                <td>
                  <Link href={`/jogos?q=${encodeURIComponent(a.nome)}`}>{a.nome}</Link>
                </td>
                <td className="num">{a.J}</td>
                <td className="num">{a.V}</td>
                <td className="num">{a.E}</td>
                <td className="num">{a.D}</td>
                <td className="num">
                  {a.gp}:{a.gc}
                </td>
                <td className="num">{pct(a.apr)}</td>
                <td>
                  <span className="form">
                    {a.ultimos.map((r, i) => (
                      <Res key={i} r={r} />
                    ))}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
