# Diário do Leão

App pessoal para registrar os jogos do Sport que eu fui ver no estádio, com fotos, setor e estatísticas. Os dados das partidas vêm da API da ESPN; o Campeonato Pernambucano deve vir da API-Football.

- `REQUISITOS.md`: requisitos, teste de viabilidade das fontes de dados, modelo de dados e perguntas em aberto.
- `design/prototipo.html`: protótipo navegável com os 94 jogos e os dados reais das APIs para 86 deles (84 da ESPN, 2 da API-Football) (Resumo, Jogos, detalhe do jogo, Adversários, Montar diário e Registrar jogo). Abra o arquivo no navegador; o que for registrado nele some ao recarregar.
- `sync/`: lista dos meus jogos (`meus_jogos.txt`), o script da API-Football para o Pernambucano (`api_football.py`) e o script do SofaScore, que está fora do plano porque o SofaScore bloqueia o acesso.

## Situação das fontes

A API-Football foi testada em 31/10/2026 (`REQUISITOS.md`, seção 1.2). O plano grátis só libera as temporadas de 2022 a 2024, então dos 9 jogos do Pernambucano vieram os 2 de 2023. Faltam 8 jogos sem dados de API:

- 2016: o sub-17 (nenhuma API tem);
- 2017 e 2019: Pernambucano, antes da cobertura da API-Football (preencher à mão);
- 2025 e 2026: 5 jogos do Pernambucano, que vêm com um mês do plano pago (US$ 19).

## Próximo passo

1. Decidir sobre o mês pago da API-Football. Se for pagar, rodar:

   ```bash
   cd sync && python3 api_football.py --temporadas 2025 2026
   ```

2. Começar o app (seção 9 do `REQUISITOS.md`): Next.js, Postgres e as fontes atrás da interface única (`buscarPartidasDoTime`, `buscarPartida`, `buscarTime`), começando pela ESPN.
