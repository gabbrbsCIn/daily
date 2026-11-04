import Link from 'next/link'
import { and, eq, inArray } from 'drizzle-orm'
import { partidas, presencas } from '@/db/schema'
import { getDb } from '@/lib/db'
import { dia } from '@/lib/estatisticas'
import type { Fonte, ResumoPartida } from '@/lib/fontes/tipos'
import { dataCurta, diaSemana } from '@/lib/formato'
import { consultasHoje, fonteDados } from '@/lib/partidas'
import { usuarioAtual } from '@/lib/sessao'
import { TIME } from '@/lib/time'
import { registrarDaFonte } from './acoes'
import { FormManual } from './manual'

export const metadata = { title: 'Registrar jogo · Diário do Leão' }

const FONTES: { fonte: Fonte; rotulo: string }[] = [
  { fonte: 'espn', rotulo: 'Brasileirão e copas' },
  { fonte: 'api-football', rotulo: 'Pernambucano' },
]

export default async function Registrar({ searchParams }: { searchParams: Promise<{ ano?: string; fonte?: string }> }) {
  const f = await searchParams
  const anoAtual = Number(dia(new Date().toISOString()).slice(0, 4))
  const ano = Number(f.ano) || anoAtual
  const fonte: Fonte = f.fonte === 'api-football' ? 'api-football' : 'espn'
  const usuario = await usuarioAtual()
  const db = await getDb()

  let lista: ResumoPartida[] = [], erro = ''
  try {
    lista = (await fonteDados(db, fonte).buscarPartidasDoTime(TIME.ids[fonte], ano)).filter(p => p.encerrada)
  } catch (e) {
    erro = (e as Error).message
  }
  lista.sort((a, b) => b.data.localeCompare(a.data))

  const ids = lista.map(p => p.fonteId)
  const jaNoDiario = new Map<string, number>()
  if (ids.length) {
    const linhas = await db
      .select({ fonteId: partidas.fonteId, presenca: presencas.id })
      .from(presencas)
      .innerJoin(partidas, eq(presencas.partidaId, partidas.id))
      .where(and(eq(presencas.usuarioId, usuario.id), eq(partidas.fonte, fonte), inArray(partidas.fonteId, ids)))
    for (const l of linhas) jaNoDiario.set(l.fonteId, l.presenca)
  }
  const cota = fonte === 'api-football' ? await consultasHoje(db, 'api-football') : null
  const anos = Array.from({ length: anoAtual - 2008 }, (_, i) => anoAtual - i)
  const link = (mudar: { ano?: number; fonte?: Fonte }) => `/registrar?fonte=${mudar.fonte ?? fonte}&ano=${mudar.ano ?? ano}`

  return (
    <section className="view">
      <div className="steps">
        <div className="step">
          <h3>1. Escolha a partida</h3>
          <div className="filters">
            <div className="seg" role="group" aria-label="Fonte">
              {FONTES.map(x => (
                <Link key={x.fonte} href={link({ fonte: x.fonte })} aria-current={x.fonte === fonte ? 'true' : undefined}>
                  {x.rotulo}
                </Link>
              ))}
            </div>
            <form className="filters">
              <input type="hidden" name="fonte" value={fonte} />
              <select name="ano" defaultValue={ano} aria-label="Temporada">
                {anos.map(a => (
                  <option key={a}>{a}</option>
                ))}
              </select>
              <button className="btn ghost">Ver</button>
            </form>
          </div>
          {cota !== null && (
            <p className="proto">
              {cota} de 100 consultas da API-Football hoje. No plano grátis, só as temporadas de 2022 a 2024.
            </p>
          )}
          {erro && (
            <p className="warn" role="alert">
              {erro}
            </p>
          )}
          {!erro && lista.length === 0 && <div className="empty">Nenhuma partida encerrada do Sport em {ano} nessa fonte.</div>}
          <div className="pick">
            {lista.map(p => {
              const presenca = jaNoDiario.get(p.fonteId)
              return (
                <form key={p.fonteId} action={registrarDaFonte.bind(null, p.fonte, p.fonteId, p.liga)} className="linha">
                    <span className="mono">{diaSemana(p.data)}</span>
                    <span>{dataCurta(p.data)}</span>
                    <span>
                      {p.mandante.nome} {p.golsMandante}x{p.golsVisitante} {p.visitante.nome}
                      <span className="c">
                        {p.competicao}
                        {p.estadio ? ` · ${p.estadio}` : ''}
                      </span>
                    </span>
                    {presenca ? (
                      <Link href={`/jogos/${presenca}`} className="tag t">
                        no diário
                      </Link>
                    ) : (
                      <button className="btn ghost sm">
                        Fui
                      </button>
                    )}
                </form>
              )
            })}
          </div>
        </div>

        <div className="step">
          <h3>2. Não achou? Cadastre à mão</h3>
          <FormManual />
        </div>
      </div>
    </section>
  )
}
