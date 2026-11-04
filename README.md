# Diário do Leão

App para torcedores do Sport registrarem os jogos que viram no estádio, com setor, anotações e estatísticas. Cada pessoa entra com a conta do Google e tem o próprio diário. Os dados das partidas vêm da API da ESPN; o Campeonato Pernambucano vem da API-Football ou é preenchido à mão.

- `src/`: o app (Next.js 16, Postgres com Drizzle, login do Google pelo Neon Auth).
- Publicado em https://diario-do-leao.vercel.app (Vercel, banco na Neon em São Paulo).
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

Crie o arquivo `.env.local` a partir do `.env.example`. O login usa o Neon Auth mesmo no computador: preencha `NEON_AUTH_BASE_URL` e `NEON_AUTH_COOKIE_SECRET`. Sem `DATABASE_URL`, os jogos ficam em `.pglite/`, dentro do projeto. `http://localhost:3000` já está entre os domínios confiáveis do Neon Auth.

Com `DONO_EMAIL` igual ao seu e-mail do Google, o Resumo vazio mostra o botão que carrega os 94 jogos da sua lista (busca 84 partidas na ESPN, leva cerca de 1 minuto).

Suba o app em http://localhost:3000:

```bash
npm run dev
```

O PGlite só aceita um processo por vez: pare o `npm run dev` antes de rodar o `importar`.

Outros comandos:

- `npm test`: testes das fontes de dados e das estatísticas.
- `npm run lint`: checagem de tipos.
- `npm run importar -- <id do usuário>`: carrega a lista inicial pelo terminal; com `--atualizar`, busca de novo as partidas da ESPN sem mexer no que foi preenchido. O id é o da tabela `neon_auth.user`.
- `npm run db:gerar`: gera a migração depois de mudar `src/db/schema.ts`. O banco aplica as migrações sozinho ao abrir.

## Publicar

O app fica no projeto `diario-do-leao` da Vercel, com o banco no projeto `diario-do-leao` da Neon (região de São Paulo). A Vercel precisa de `DATABASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET` e `DONO_EMAIL`; `API_FOOTBALL_KEY` é opcional. As tabelas são criadas sozinhas no primeiro acesso.

### Login com o Google

O Neon Auth usa, por enquanto, as credenciais compartilhadas da Neon: funciona sem configurar nada, mas a tela do Google mostra o nome da Neon. Para aparecer "Diário do Leão":

1. No Google Cloud Console, crie um cliente OAuth do tipo **Aplicativo da Web**, com o URI de redirecionamento `https://ep-steep-smoke-b6tr24wc.neonauth.c-2.sa-east-1.aws.neon.tech/neondb/auth/callback/google`.
2. Preencha a tela de consentimento (nome do app, e-mail de suporte) e publique o app.
3. No Console da Neon, em Branch → Auth → OAuth providers, troque o Google pelas suas credenciais.

O Neon Auth também vem com login por e-mail e senha ligado. O app não mostra essa opção; para desligar de vez, use o Console da Neon (Branch → Auth → Configuration).

## Fontes de dados

- **ESPN:** fonte principal, sem chave. Cobre 84 dos 94 jogos. Não é oficial e pode mudar sem aviso.
- **API-Football:** Campeonato Pernambucano, com a chave em `API_FOOTBALL_KEY`, nunca no código. O plano grátis só libera 2022 a 2024. Em 04/11/2026 a conta respondeu "Your account is suspended"; confira em dashboard.api-football.com.
- **À mão:** os jogos que nenhuma fonte tem (Pernambucano de 2017, 2019, 2025 e 2026, sub-17 de 2016). Na tela de edição do jogo dá para digitar placar, gols, escalação, técnico e árbitro.
