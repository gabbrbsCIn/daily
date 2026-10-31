# Diário do Leão

App pessoal para registrar os jogos do Sport que eu fui ver no estádio, com fotos, setor e estatísticas. Os dados das partidas vêm da API da ESPN; o Campeonato Pernambucano deve vir da API-Football.

- `REQUISITOS.md`: requisitos, teste de viabilidade das fontes de dados, modelo de dados e perguntas em aberto.
- `design/prototipo.html`: protótipo navegável com os 94 jogos e os dados reais da ESPN para 84 deles (Resumo, Jogos, detalhe do jogo, Adversários, Montar diário e Registrar jogo). Abra o arquivo no navegador; o que for registrado nele some ao recarregar.
- `sync/`: lista dos meus jogos (`meus_jogos.txt`) e o script de sincronização com o SofaScore, que está fora do plano porque o SofaScore bloqueia o acesso.

## Próximo passo: testar a API-Football

A chave fica no ambiente da nuvem, como variável `API_FOOTBALL_KEY` ou segredo de rede para `v3.football.api-sports.io` (cabeçalho `x-apisports-key`). Nunca no código.

O teste:

1. `GET /leagues?search=Pernambucano`: achar o id do "Pernambucano - 1" e ver quais temporadas existem e o que cada uma cobre (`fixtures.events`, `fixtures.lineups`, `fixtures.statistics_fixtures`).
2. `GET /teams?search=Sport Recife`: id do Sport.
3. `GET /fixtures?team=<id>&league=<id>&season=<ano>` para 2017, 2019, 2023, 2025 e 2026, e conferir os 9 jogos do Pernambucano que a ESPN não tem:
   - 16/04/2017 Sport 3x2 Náutico
   - 28/02/2019 Sport 3x1 Afogados
   - 11/03/2023 Sport 2x0 Santa Cruz
   - 22/04/2023 Sport 2x0 Retrô
   - 09/03/2025 Sport 2x0 Santa Cruz
   - 02/04/2025 Sport 1x2 Retrô
   - 31/01/2026 Sport 2x1 Santa Cruz
   - 21/02/2026 Sport 3x2 Retrô
   - 01/03/2026 Sport 3x3 Náutico
4. Para os que aparecerem: `GET /fixtures/lineups?fixture=<id>` e `GET /fixtures/events?fixture=<id>`.

O plano grátis permite 100 consultas por dia e pode limitar as temporadas; anotar no `REQUISITOS.md` o que vier.
