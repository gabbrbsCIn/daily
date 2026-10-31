# Diário do Leão

App pessoal para registrar os jogos do Sport que eu fui ver no estádio, com fotos, setor e estatísticas. Os dados das partidas vêm da API da ESPN; o Campeonato Pernambucano deve vir da API-Football.

- `REQUISITOS.md`: requisitos, teste de viabilidade das fontes de dados, modelo de dados e perguntas em aberto.
- `design/prototipo.html`: protótipo navegável com os 94 jogos e os dados reais da ESPN para 84 deles (Resumo, Jogos, detalhe do jogo, Adversários, Montar diário e Registrar jogo). Abra o arquivo no navegador; o que for registrado nele some ao recarregar.
- `sync/`: lista dos meus jogos (`meus_jogos.txt`) e o script de sincronização com o SofaScore, que está fora do plano porque o SofaScore bloqueia o acesso.

## Fontes de dados

- **ESPN:** fonte principal, sem chave. Cobre 84 dos 94 jogos.
- **API-Football:** Campeonato Pernambucano. A chave fica no ambiente da nuvem, como variável `API_FOOTBALL_KEY`, nunca no código. O plano grátis só libera 2022 a 2024; o resultado do teste está na seção 1.2 do `REQUISITOS.md`.
- **Cadastro à mão:** jogos de 2017 e 2019 do Pernambucano e o sub-17 de 2016.
