'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ABAS = [
  { href: '/', rotulo: 'Resumo' },
  { href: '/jogos', rotulo: 'Jogos' },
  { href: '/adversarios', rotulo: 'Adversários' },
]

export function Nav() {
  const atual = usePathname()
  const ativa = (href: string) => (href === '/' ? atual === '/' : atual.startsWith(href))
  return (
    <nav className="tabs" aria-label="Seções">
      {ABAS.map(a => (
        <Link key={a.href} href={a.href} aria-current={ativa(a.href) ? 'page' : undefined}>
          {a.rotulo}
        </Link>
      ))}
      <Link href="/registrar" className="cta" aria-current={ativa('/registrar') ? 'page' : undefined}>
        Registrar jogo
      </Link>
    </nav>
  )
}
