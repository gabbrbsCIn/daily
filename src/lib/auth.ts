// Login de senha única: o cookie guarda a validade assinada com HMAC.
export const COOKIE = 'sessao'
export const DURACAO_S = 90 * 24 * 3600

const enc = new TextEncoder()

async function assinar(texto: string) {
  const segredo = process.env.SESSAO_SEGREDO
  if (!segredo) throw new Error('Defina SESSAO_SEGREDO.')
  const chave = await crypto.subtle.importKey('raw', enc.encode(segredo), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', chave, enc.encode(texto))
  return Buffer.from(sig).toString('base64url')
}

async function iguais(a: string, b: string) {
  // Compara os hashes para o tempo não depender de onde as strings diferem.
  const [ha, hb] = await Promise.all([a, b].map(s => crypto.subtle.digest('SHA-256', enc.encode(s))))
  return Buffer.from(ha).equals(Buffer.from(hb))
}

export async function criarSessao() {
  const validade = Math.floor(Date.now() / 1000) + DURACAO_S
  return `${validade}.${await assinar(`sessao.${validade}`)}`
}

export async function sessaoValida(token?: string) {
  if (!token) return false
  const [validade, sig] = token.split('.')
  if (!sig || Number(validade) < Date.now() / 1000) return false
  return iguais(sig, await assinar(`sessao.${validade}`))
}

export async function senhaCorreta(senha: string) {
  const certa = process.env.APP_SENHA
  return !!certa && (await iguais(senha, certa))
}
