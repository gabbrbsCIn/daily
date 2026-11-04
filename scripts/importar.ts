// Carrega o diário inicial (dados/diario_inicial.json) no diário de um usuário.
//
//   npm run importar -- <id do usuário>               # só busca as partidas que ainda não estão no banco
//   npm run importar -- <id do usuário> --atualizar   # busca de novo todas as partidas da ESPN
//
// O id é o da tabela neon_auth.user. No app publicado, o dono usa o botão do Resumo.
import { getDb } from '../src/lib/db'
import { importarDiario } from '../src/lib/importar'

const usuarioId = process.argv.slice(2).find(a => !a.startsWith('--'))
if (!usuarioId) {
  console.error('Uso: npm run importar -- <id do usuário> [--atualizar]')
  process.exit(1)
}
const r = await importarDiario(await getDb(), usuarioId, {
  atualizar: process.argv.includes('--atualizar'),
  aoAvancar: (feitos, total) => process.stdout.write(`\r${feitos}/${total}`),
})
console.log(`\n${r.importados} de ${r.total} jogos importados.`)
if (r.alertas.length) console.log(`Alertas:\n- ${r.alertas.join('\n- ')}`)
process.exit(0)
