// Postgres em produção (DATABASE_URL); PGlite em arquivo no desenvolvimento.
import path from 'node:path'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import * as schema from '../db/schema'

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>

const PASTA_MIGRACOES = path.join(process.cwd(), 'drizzle')

async function abrir(url = process.env.DATABASE_URL): Promise<Db> {
  if (url) {
    const { default: postgres } = await import('postgres')
    const { drizzle } = await import('drizzle-orm/postgres-js')
    const { migrate } = await import('drizzle-orm/postgres-js/migrator')
    const db = drizzle(postgres(url, { max: 5 }), { schema })
    await migrate(db, { migrationsFolder: PASTA_MIGRACOES })
    return db as unknown as Db
  }
  const { PGlite } = await import('@electric-sql/pglite')
  const { drizzle } = await import('drizzle-orm/pglite')
  const { migrate } = await import('drizzle-orm/pglite/migrator')
  const db = drizzle(new PGlite(process.env.PGLITE_DIR ?? '.pglite'), { schema })
  await migrate(db, { migrationsFolder: PASTA_MIGRACOES })
  return db as unknown as Db
}

// Uma conexão por processo, que sobrevive ao recarregamento do `next dev`.
const g = globalThis as unknown as { __db?: Promise<Db> }

export function getDb(): Promise<Db> {
  g.__db ??= abrir().catch(e => {
    g.__db = undefined
    throw e
  })
  return g.__db
}
