import { entrar } from './acoes'

export const metadata = { title: 'Entrar · Diário do Leão' }

export default async function Login({ searchParams }: { searchParams: Promise<{ de?: string; erro?: string }> }) {
  const { de, erro } = await searchParams
  return (
    <section className="view" style={{ maxWidth: 380 }}>
      <h2>Entrar</h2>
      <form action={entrar} className="frm">
        <input type="hidden" name="de" value={de ?? '/'} />
        <label className="in">
          Senha
          <input type="password" name="senha" autoComplete="current-password" required autoFocus />
        </label>
        {erro && <p className="warn" role="alert">Senha errada.</p>}
        <div className="actions">
          <button className="btn">Entrar</button>
        </div>
      </form>
    </section>
  )
}
