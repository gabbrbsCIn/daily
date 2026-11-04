import type { NextConfig } from 'next'

const config: NextConfig = {
  // PGlite carrega um arquivo WebAssembly e não pode passar pelo bundler.
  serverExternalPackages: ['@electric-sql/pglite'],
  // Lidos do disco: as migrações, quando o banco abre, e o diário inicial, no botão de carregar.
  outputFileTracingIncludes: { '/**': ['./drizzle/**', './dados/**'] },
}

export default config
