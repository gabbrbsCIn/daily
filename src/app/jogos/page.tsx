import Link from 'next/link'
import { getDb } from '@/lib/db'
import { registro, resultado, temporada } from '@/lib/estatisticas'
import { pct } from '@/lib/formato'
import { listarJogos } from '@/lib/partidas'
import { usuarioAtual } from '@/lib/sessao'
import { LinhaJogo, tagsDoJogo } from '../componentes'

export const metadata = { title: 'Jogos · Diário do Leão' }

type Filtros = { q?: string; r?: string; ano?: string; comp?: string; top5?: string }

export default async function Jogos({ searchParams }: { searchParams: Promise<Filtros> }) {
  const f = await searchParams
  const todos = await listarJogos(await getDb(), (await usuarioAtual()).id)
  const q = f.q?.trim().toLowerCase()
  const lista = todos
    .filter(
      j =>
        (!f.r || resultado(j) === f.r) &&
        (!f.ano || temporada(j) === Number(f.ano)) &&
        (!f.comp || j.competicao === f.comp) &&
        (!f.top5 || j.top5) &&
        (!q ||
          [j.adversario.nome, j.anotacao, j.competicao, j.setor, j.comQuem, j.estadio, ...tagsDoJogo(j)]
            .join(' ')
            .toLowerCase()
            .includes(q)),
    )
    .reverse()
  const anos = [...new Set(todos.map(temporada))].sort((a, b) => b - a)
  const comps = [...new Set(todos.map(j => j.competicao))].sort()
  const porAno = anos.map(a => [a, lista.filter(j => temporada(j) === a)] as const).filter(([, js]) => js.length)
  const filtrando = Object.values(f).some(Boolean)

  return (
    <section className="view">
      <form className="filters" role="search">
        <input type="search" name="q" defaultValue={f.q} placeholder="Adversário, setor, anotação…" aria-label="Buscar" />
        <select name="r" defaultValue={f.r ?? ''} aria-label="Resultado">
          <option value="">Todos os resultados</option>
          <option value="V">Vitórias</option>
          <option value="E">Empates</option>
          <option value="D">Derrotas</option>
        </select>
        <select name="ano" defaultValue={f.ano ?? ''} aria-label="Temporada">
          <option value="">Todas as temporadas</option>
          {anos.map(a => (
            <option key={a}>{a}</option>
          ))}
        </select>
        <select name="comp" defaultValue={f.comp ?? ''} aria-label="Competição">
          <option value="">Todas as competições</option>
          {comps.map(c => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <label className="chk">
          <input type="checkbox" name="top5" value="1" defaultChecked={!!f.top5} /> candidatos ao top 5
        </label>
        <button className="btn ghost">Filtrar</button>
        {filtrando && (
          <Link href="/jogos" className="back">
            Limpar
          </Link>
        )}
      </form>

      {porAno.length === 0 && <div className="empty">Nenhum jogo com esses filtros.</div>}
      {porAno.map(([ano, js]) => {
        const r = registro(js)
        return (
          <div className="season" key={ano}>
            <div className="season-h">
              <h3>{ano}</h3>
              <span>
                {r.J} {r.J === 1 ? 'jogo' : 'jogos'} · {r.V}V {r.E}E {r.D}D · {pct(r.apr)}
              </span>
            </div>
            <div className="games">
              {js.map(j => (
                <LinhaJogo key={j.id} j={j} />
              ))}
            </div>
          </div>
        )
      })}
    </section>
  )
}
