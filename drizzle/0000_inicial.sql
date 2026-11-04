CREATE TABLE "consultas" (
	"fonte" text NOT NULL,
	"dia" date NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "consultas_fonte_dia_pk" PRIMARY KEY("fonte","dia")
);
--> statement-breakpoint
CREATE TABLE "partidas" (
	"id" serial PRIMARY KEY NOT NULL,
	"fonte" text NOT NULL,
	"fonte_id" text NOT NULL,
	"liga" text,
	"data" timestamp with time zone NOT NULL,
	"competicao" text NOT NULL,
	"fase" text,
	"mandante" jsonb NOT NULL,
	"visitante" jsonb NOT NULL,
	"sport_mandante" boolean NOT NULL,
	"gols_mandante" integer,
	"gols_visitante" integer,
	"estadio" text,
	"cidade" text,
	"publico" integer,
	"arbitro" text,
	"detalhes" jsonb NOT NULL,
	"consultada_em" timestamp with time zone,
	"criada_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "presencas" (
	"id" serial PRIMARY KEY NOT NULL,
	"partida_id" integer NOT NULL,
	"setor" text,
	"com_quem" text,
	"anotacao" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"top5" boolean DEFAULT false NOT NULL,
	"publico_corrigido" integer,
	"aviso" text,
	"criada_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "presencas_partida_id_unique" UNIQUE("partida_id")
);
--> statement-breakpoint
ALTER TABLE "presencas" ADD CONSTRAINT "presencas_partida_id_partidas_id_fk" FOREIGN KEY ("partida_id") REFERENCES "public"."partidas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "partidas_fonte_idx" ON "partidas" USING btree ("fonte","fonte_id");