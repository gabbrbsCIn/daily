import Link from 'next/link'

export default function NaoEncontrado() {
  return (
    <section className="view">
      <div className="empty">
        Esse jogo não está no seu diário. <Link href="/jogos">Ver os seus jogos</Link>
      </div>
    </section>
  )
}
