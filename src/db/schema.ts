import { boolean, date, integer, jsonb, pgTable, primaryKey, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import type { Detalhes, Time } from '../lib/fontes/tipos'

// Partida: dado público, vindo da fonte (ou digitado, quando nenhuma fonte tem o jogo).
export const partidas = pgTable(
  'partidas',
  {
    id: serial('id').primaryKey(),
    fonte: text('fonte').notNull(), // espn | api-football | manual
    fonteId: text('fonte_id').notNull(),
    liga: text('liga'),
    data: timestamp('data', { withTimezone: true }).notNull(),
    competicao: text('competicao').notNull(),
    fase: text('fase'),
    mandante: jsonb('mandante').$type<Time>().notNull(),
    visitante: jsonb('visitante').$type<Time>().notNull(),
    sportMandante: boolean('sport_mandante').notNull(),
    golsMandante: integer('gols_mandante'),
    golsVisitante: integer('gols_visitante'),
    estadio: text('estadio'),
    cidade: text('cidade'),
    publico: integer('publico'),
    arbitro: text('arbitro'),
    detalhes: jsonb('detalhes').$type<Detalhes>().notNull(),
    consultadaEm: timestamp('consultada_em', { withTimezone: true }),
    criadaEm: timestamp('criada_em', { withTimezone: true }).notNull().defaultNow(),
  },
  t => [uniqueIndex('partidas_fonte_idx').on(t.fonte, t.fonteId)],
)

// Presença: o meu registro de que fui à partida.
export const presencas = pgTable('presencas', {
  id: serial('id').primaryKey(),
  partidaId: integer('partida_id')
    .notNull()
    .unique()
    .references(() => partidas.id, { onDelete: 'cascade' }),
  setor: text('setor'),
  comQuem: text('com_quem'),
  anotacao: text('anotacao'),
  tags: text('tags').array().notNull().default([]),
  top5: boolean('top5').notNull().default(false),
  publicoCorrigido: integer('publico_corrigido'),
  aviso: text('aviso'),
  criadaEm: timestamp('criada_em', { withTimezone: true }).notNull().defaultNow(),
})

// Consultas que gastam cota, por fonte e dia (a API-Football grátis permite 100 por dia).
export const consultas = pgTable(
  'consultas',
  {
    fonte: text('fonte').notNull(),
    dia: date('dia').notNull(),
    total: integer('total').notNull().default(0),
  },
  t => [primaryKey({ columns: [t.fonte, t.dia] })],
)

export type Partida = typeof partidas.$inferSelect
export type NovaPartida = typeof partidas.$inferInsert
export type Presenca = typeof presencas.$inferSelect
