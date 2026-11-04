// Formatação em português, no fuso de Recife.
import { dia } from './estatisticas'

const FUSO = 'America/Recife'
const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

export const dataCurta = (iso: string) => dia(iso).split('-').reverse().join('/')

export const dataLonga = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(iso),
  )

export const hora = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, hour: '2-digit', minute: '2-digit' }).format(new Date(iso))

export const diaSemana = (iso: string) => SEMANA[new Date(`${dia(iso)}T12:00:00Z`).getUTCDay()]

export const pct = (x: number) => `${(x * 100).toFixed(1).replace('.', ',')}%`

export const num = (n: number) => n.toLocaleString('pt-BR')

export const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`
