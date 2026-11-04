import type { NextConfig } from 'next'

const config: NextConfig = {
  // PGlite carrega um arquivo WebAssembly e não pode passar pelo bundler.
  serverExternalPackages: ['@electric-sql/pglite'],
  // As migrações são lidas do disco quando o banco abre.
  outputFileTracingIncludes: { '/**': ['./drizzle/**'] },
}

export default config
