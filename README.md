# Diário do Leão

App pessoal para registrar os jogos do Sport que eu fui ver no estádio, com setor, anotações e estatísticas. Os dados das partidas vêm da API da ESPN; o Campeonato Pernambucano vem da API-Football ou é preenchido à mão.

- `src/`: o app (Next.js 16, Postgres com Drizzle).
- `dados/diario_inicial.json`: os 94 jogos da minha lista, com a fonte e o id de cada partida, tags e anotações.
- `dados/api-football/`: respostas da API-Football para os 2 jogos do Pernambucano de 2023.
- `REQUISITOS.md`: requisitos, teste das fontes de dados e o que o app já faz (seção 12).
- `design/prototipo.html`: o protótipo navegável que serviu de base para o visual.
- `sync/`: a lista original (`meus_jogos.txt`) e o script do SofaScore, fora do plano porque o SofaScore bloqueia o acesso.

## Rodar no computador

Precisa do Node 22 ou mais novo.

```bash
npm install
```

Crie o arquivo `.env.local` a partir do `.env.example` e preencha `APP_SENHA` e `SESSAO_SEGREDO` (gere com `openssl rand -hex 32`). Sem `DATABASE_URL`, o banco fica em `.pglite/`, dentro do projeto.

Carregue os 94 jogos (busca 84 partidas na ESPN, leva cerca de 1 minuto):

```bash
npm run importar
```

Suba o app em http://localhost:3000:

```bash
npm run dev
```

O PGlite só aceita um processo por vez: pare o `npm run dev` antes de rodar o `importar`.

Outros comandos:

- `npm test`: testes das fontes de dados e das estatísticas.
- `npm run lint`: checagem de tipos.
- `npm run importar -- --atualizar`: busca de novo todas as partidas da ESPN. Não mexe no que você preencheu.
- `npm run db:gerar`: gera a migração depois de mudar `src/db/schema.ts`. O banco aplica as migrações sozinho ao abrir.

## Publicar

O caminho proposto é a Vercel com um Postgres da Neon. No projeto da Vercel, defina `APP_SENHA`, `SESSAO_SEGREDO`, `DATABASE_URL` e, se for usar, `API_FOOTBALL_KEY`. Depois carregue o diário no banco de produção:

```bash
DATABASE_URL="postgres://..." npm run importar
```

## Fontes de dados

- **ESPN:** fonte principal, sem chave. Cobre 84 dos 94 jogos. Não é oficial e pode mudar sem aviso.
- **API-Football:** Campeonato Pernambucano, com a chave em `API_FOOTBALL_KEY`, nunca no código. O plano grátis só libera 2022 a 2024. Em 04/11/2026 a conta respondeu "Your account is suspended"; confira em dashboard.api-football.com.
- **À mão:** os jogos que nenhuma fonte tem (Pernambucano de 2017, 2019, 2025 e 2026, sub-17 de 2016). Na tela de edição do jogo dá para digitar placar, gols, escalação, técnico e árbitro.
