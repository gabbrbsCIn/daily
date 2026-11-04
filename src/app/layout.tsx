import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import { Nav } from './nav'
import './globals.css'

export const metadata: Metadata = {
  title: 'Diário do Leão',
  description: 'Os jogos do Sport que eu vi no estádio.',
}

export const viewport: Viewport = {
  viewportFit: 'cover',
  themeColor: '#151213',
}

// Tudo vem do banco a cada pedido.
export const dynamic = 'force-dynamic'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;800;900&family=Barlow:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>
        <header className="top">
          <div className="stripes" />
          <div className="wrap">
            <div className="bar">
              <Link className="brand" href="/">
                <b>Diário do Leão</b>
                <span>meus jogos do Sport</span>
              </Link>
            </div>
            <Nav />
          </div>
        </header>
        <main className="wrap">{children}</main>
      </body>
    </html>
  )
}
