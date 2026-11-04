'use client'
import { useActionState } from 'react'
import { registrarManual } from './acoes'

export function FormManual() {
  const [estado, enviar, enviando] = useActionState(registrarManual, {})
  return (
    <form action={enviar} className="frm">
      <div className="grid">
        <label className="in">
          Data
          <input type="date" name="data" required />
        </label>
        <label className="in">
          Mando
          <select name="mando">
            <option value="casa">Sport em casa</option>
            <option value="fora">Sport fora</option>
          </select>
        </label>
        <label className="in">
          Competição
          <input name="competicao" list="competicoes-manual" defaultValue="Campeonato Pernambucano" />
        </label>
        <label className="in">
          Estádio
          <input name="estadio" list="estadios-manual" defaultValue="Ilha do Retiro" />
        </label>
      </div>
      <div className="scoreline">
        <div className="sport-fixed">Sport</div>
        <input type="number" name="golsSport" min={0} defaultValue={0} aria-label="Gols do Sport" required />
        <span className="x">x</span>
        <input type="number" name="golsAdversario" min={0} defaultValue={0} aria-label="Gols do adversário" required />
        <label className="in opp">
          Adversário
          <input name="adversario" required />
        </label>
      </div>
      <datalist id="competicoes-manual">
        {['Campeonato Pernambucano', 'Copa do Nordeste', 'Amistoso', 'Base'].map(c => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <datalist id="estadios-manual">
        {['Ilha do Retiro', 'Arena de Pernambuco', 'Arruda', 'Aflitos'].map(c => (
          <option key={c} value={c} />
        ))}
      </datalist>
      {estado.erro && (
        <p className="warn" role="alert">
          {estado.erro}
        </p>
      )}
      <div className="actions">
        <button className="btn" disabled={enviando}>
          {enviando ? 'Salvando…' : 'Registrar e continuar'}
        </button>
        <span className="proto">Depois dá para preencher gols, escalação, setor e fotos.</span>
      </div>
    </form>
  )
}
