import { BotaoGoogle } from './google'

export const metadata = { title: 'Entrar · Diário do Leão' }

export default function Entrar() {
  return (
    <section className="view" style={{ maxWidth: 420 }}>
      <h2>Entrar</h2>
      <p className="muted">
        Registre os jogos do Sport que você viu no estádio e acompanhe o seu aproveitamento, os artilheiros e os recordes do seu
        diário.
      </p>
      <BotaoGoogle />
    </section>
  )
}
