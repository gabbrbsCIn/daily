'use client'
import { useActionState } from 'react'
import type { EstadoForm } from '../acoes'

export interface ValoresJogo {
  manual: boolean
  data: string
  hora: string
  adversario: string
  mando: 'casa' | 'fora'
  golsSport: number
  golsAdversario: number
  competicao: string
  estadio: string
  arbitro: string
  golsSportLista: string
  golsAdversarioLista: string
  titulares: string
  entraram: string
  tecnico: string
  publico: number | null
  publicoDaFonte: number | null
  setor: string
  comQuem: string
  tags: string
  top5: boolean
  anotacao: string
  aviso: string
}

interface Sugestoes {
  setores: string[]
  acompanhantes: string[]
  competicoes: string[]
  estadios: string[]
}

const Lista = ({ id, itens }: { id: string; itens: string[] }) => (
  <datalist id={id}>
    {itens.map(i => (
      <option key={i} value={i} />
    ))}
  </datalist>
)

export function FormJogo({
  acao,
  valores: v,
  sugestoes: s,
}: {
  acao: (estado: EstadoForm, form: FormData) => Promise<EstadoForm>
  valores: ValoresJogo
  sugestoes: Sugestoes
}) {
  const [estado, enviar, enviando] = useActionState(acao, {})
  return (
    <form action={enviar} className="frm">
      {v.manual && (
        <fieldset className="fs">
          <legend>Partida</legend>
          <div className="grid">
            <label className="in">
              Data
              <input type="date" name="data" defaultValue={v.data} required />
            </label>
            <label className="in">
              Horário <small>opcional</small>
              <input type="time" name="hora" defaultValue={v.hora} />
            </label>
            <label className="in">
              Mando
              <select name="mando" defaultValue={v.mando}>
                <option value="casa">Sport em casa</option>
                <option value="fora">Sport fora</option>
              </select>
            </label>
          </div>
          <div className="scoreline">
            <div className="sport-fixed">Sport</div>
            <input type="number" name="golsSport" min={0} defaultValue={v.golsSport} aria-label="Gols do Sport" required />
            <span className="x">x</span>
            <input type="number" name="golsAdversario" min={0} defaultValue={v.golsAdversario} aria-label="Gols do adversário" required />
            <label className="in opp">
              Adversário
              <input name="adversario" defaultValue={v.adversario} required />
            </label>
          </div>
          <div className="grid">
            <label className="in">
              Competição
              <input name="competicao" list="competicoes" defaultValue={v.competicao} />
            </label>
            <label className="in">
              Estádio
              <input name="estadio" list="estadios" defaultValue={v.estadio} />
            </label>
            <label className="in">
              Público
              <input name="publico" inputMode="numeric" defaultValue={v.publico ?? ''} />
            </label>
            <label className="in">
              Árbitro
              <input name="arbitro" defaultValue={v.arbitro} />
            </label>
          </div>
          <div className="grid">
            <label className="in">
              Gols do Sport <small>um por linha: 45+2 Fulano (pên)</small>
              <textarea name="golsSportLista" defaultValue={v.golsSportLista} rows={3} />
            </label>
            <label className="in">
              Gols do adversário
              <textarea name="golsAdversarioLista" defaultValue={v.golsAdversarioLista} rows={3} />
            </label>
          </div>
          <div className="grid">
            <label className="in">
              Titulares do Sport <small>um por linha ou separados por vírgula</small>
              <textarea name="titulares" defaultValue={v.titulares} rows={6} />
            </label>
            <label className="in">
              Entraram
              <textarea name="entraram" defaultValue={v.entraram} rows={6} />
            </label>
            <label className="in">
              Técnico
              <input name="tecnico" defaultValue={v.tecnico} />
            </label>
          </div>
          <Lista id="competicoes" itens={s.competicoes} />
          <Lista id="estadios" itens={s.estadios} />
        </fieldset>
      )}

      <fieldset className="fs">
        <legend>Minha presença</legend>
        <div className="grid">
          <label className="in">
            Setor
            <input name="setor" list="setores" defaultValue={v.setor} />
          </label>
          <label className="in">
            Com quem
            <input name="comQuem" list="acompanhantes" defaultValue={v.comQuem} />
          </label>
          {!v.manual && (
            <label className="in">
              Público <small>corrige o da fonte{v.publicoDaFonte ? ` (${v.publicoDaFonte.toLocaleString('pt-BR')})` : ''}</small>
              <input
                name="publico"
                inputMode="numeric"
                defaultValue={v.publico && v.publico !== v.publicoDaFonte ? v.publico : ''}
              />
            </label>
          )}
          <label className="in">
            Tags <small>separadas por vírgula</small>
            <input name="tags" defaultValue={v.tags} placeholder="Título, Final" />
          </label>
        </div>
        <label className="in">
          Anotação
          <textarea name="anotacao" defaultValue={v.anotacao} />
        </label>
        <label className="chk">
          <input type="checkbox" name="top5" defaultChecked={v.top5} /> Candidato ao top 5
        </label>
        {v.aviso && (
          <label className="chk">
            <input type="hidden" name="aviso" value={v.aviso} />
            <input type="checkbox" name="manterAviso" defaultChecked /> Manter o aviso: {v.aviso}
          </label>
        )}
        <Lista id="setores" itens={s.setores} />
        <Lista id="acompanhantes" itens={s.acompanhantes} />
      </fieldset>

      {estado.erro && (
        <p className="warn" role="alert">
          {estado.erro}
        </p>
      )}
      <div className="actions">
        <button className="btn" disabled={enviando}>
          {enviando ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}
