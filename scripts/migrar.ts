// Aplica as migrações (getDb já migra ao abrir).
import { getDb } from '../src/lib/db'

await getDb()
console.log('Banco migrado.')
process.exit(0)
