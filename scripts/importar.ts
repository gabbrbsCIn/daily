// Carrega o diário inicial (dados/diario_inicial.json) no banco.
//
//   npm run importar                 # só busca as partidas que ainda não estão no banco
//   npm run importar -- --atualizar  # busca de novo todas as partidas da ESPN
import { getDb } from '../src/lib/db'
import { importarDiario } from '../src/lib/importar'

const r = await importarDiario(await getDb(), {
  atualizar: process.argv.includes('--atualizar'),
  aoAvancar: (feitos, total) => process.stdout.write(`\r${feitos}/${total}`),
})
console.log(`\n${r.importados} de ${r.total} jogos importados.`)
if (r.alertas.length) console.log(`Alertas:\n- ${r.alertas.join('\n- ')}`)
process.exit(0)
