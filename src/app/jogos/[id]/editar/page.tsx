import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDb } from '@/lib/db'
import { dia, escalacaoSport, ladoSport } from '@/lib/estatisticas'
import { hora } from '@/lib/formato'
import { escreverGols } from '@/lib/manual'
import { listarJogos } from '@/lib/partidas'
import { excluirPresenca, salvarJogo } from '../acoes'
import { FormJogo, type ValoresJogo } from './form'

export const metadata = { title: 'Editar jogo · Diário do Leão' }

const COMPETICOES = ['Campeonato Pernambucano', 'Copa do Nordeste', 'Brasileirão Série A', 'Brasileirão Série B', 'Copa do Brasil', 'Amistoso']
const ESTADIOS = ['Ilha do Retiro', 'Arena de Pernambuco', 'Arruda', 'Aflitos']

export default async function Editar({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const js = await listarJogos(await getDb())
  const j = js.find(x => x.id === Number(id))
  if (!j) notFound()
  const unicos = (xs: (string | undefined)[]) => [...new Set(xs.filter((x): x is string => !!x))].sort()
  const esc = escalacaoSport(j)
  const nosso = ladoSport(j)
  const v: ValoresJogo = {
    manual: j.fonte === 'manual',
    data: dia(j.data),
    hora: hora(j.data) === '12:00' ? '' : hora(j.data),
    adversario: j.adversario.nome,
    mando: j.sportMandante ? 'casa' : 'fora',
    golsSport: j.golsSport,
    golsAdversario: j.golsAdversario,
    competicao: j.competicao,
    estadio: j.estadio ?? '',
    arbitro: j.arbitro ?? '',
    golsSportLista: escreverGols(j.detalhes, nosso),
    golsAdversarioLista: escreverGols(j.detalhes, nosso === 'mandante' ? 'visitante' : 'mandante'),
    titulares: esc?.titulares.map(t => t.nome).join('\n') ?? '',
    entraram: j.detalhes.eventos.flatMap(e => (e.tipo === 'substituicao' && e.lado === nosso ? [e.entra] : [])).join('\n'),
    tecnico: esc?.tecnico ?? '',
    publico: j.publico ?? null,
    publicoDaFonte: j.publicoDaFonte ?? null,
    setor: j.setor ?? '',
    comQuem: j.comQuem ?? '',
    tags: j.tags.join(', '),
    top5: j.top5,
    anotacao: j.anotacao ?? '',
    aviso: j.aviso ?? '',
  }
  return (
    <section className="view">
      <Link className="back" href={`/jogos/${j.id}`}>
        ← Voltar ao jogo
      </Link>
      <h2>
        {j.fonte === 'manual' ? 'Editar jogo' : 'Minha presença'} · Sport x {j.adversario.nome}
      </h2>
      <FormJogo
        acao={salvarJogo.bind(null, j.id)}
        valores={v}
        sugestoes={{
          setores: unicos(js.map(x => x.setor)),
          acompanhantes: unicos(js.map(x => x.comQuem)),
          competicoes: unicos([...COMPETICOES, ...js.map(x => x.competicao)]),
          estadios: unicos([...ESTADIOS, ...js.map(x => x.estadio)]),
        }}
      />
      <form action={excluirPresenca.bind(null, j.id)} className="actions">
        <button className="btn ghost">Excluir do diário</button>
        <span className="proto">Remove o jogo do seu diário. Não dá para desfazer.</span>
      </form>
    </section>
  )
}
