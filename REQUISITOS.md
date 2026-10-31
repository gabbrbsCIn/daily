# Diário do Leão — requisitos (v0.3)

App para registrar os jogos que eu fui ver no estádio, guardar fotos e ver estatísticas de cada jogo e do conjunto. Os dados das partidas (estádio, público, árbitro, escalação, gols) vêm de uma API de futebol. Começa pessoal, para o Sport, mas o desenho já permite que qualquer torcedor monte o próprio diário. "Diário do Leão" é nome provisório.

Protótipo navegável: `design/prototipo.html`. Ele já usa os dados reais das APIs para 86 dos 94 jogos (84 da ESPN e 2 da API-Football).

## O que mudou desde a v0.2

- API-Football testada (seção 1.2): tem o Pernambucano de 2020 a 2026, mas o plano grátis só libera 2022 a 2024. Dos 9 jogos do estadual, vieram os 2 de 2023, com escalação, gols, árbitro e técnico.
- Os 2 jogos de 2023 entraram no protótipo. 7 jogos ainda estão sem dados.
- Script `sync/api_football.py` para buscar o Pernambucano com cache.

## O que mudou desde a v0.1

- Os dados das partidas passam a vir de API, com preenchimento à mão quando a API não tem o jogo.
- Vários usuários: cada um escolhe o time e o período e marca os jogos em que foi (seção 5).
- Estatísticas novas que só existem com dados da API (seção 7.3).
- Respostas às perguntas da v0.1 incorporadas: `*` = candidato ao top 5; nem todo jogo foi na Ilha; a data do São Paulo é 16/08/2025; o sub-17 conta nas estatísticas.

## 1. Viabilidade das APIs

Testei as fontes com os 94 jogos da lista.

| Fonte | Custo | Pernambucano | Série A/B, Copa do Brasil, Nordeste | O que traz | Situação |
|---|---|---|---|---|---|
| **ESPN** (`site.api.espn.com`) | Grátis, sem chave | Não tem | Sim, desde 2009 | Placar, data, estádio, público, árbitro, escalação, formação, substituições, gols com minuto e autor, cartões, estatísticas (posse, chutes) | **Testada.** 84 dos 94 jogos encontrados, todos com o placar igual ao da lista |
| **API-Football** (api-sports.io) | Grátis com 100 requisições/dia, só temporadas 2022–2024; pago a partir de US$ 19/mês | Sim, de 2020 a 2026 | Sim | Partidas, escalações, eventos, técnico e árbitro; não traz público nem formação no estadual | **Testada em 31/10/2026** (seção 1.2). 2 dos 9 jogos do estadual no plano grátis |
| SofaScore | Não tem API pública | Sim | Sim | Tudo, inclusive público | Bloqueia acesso automatizado (HTTP 403) e os termos proíbem uso. Descartada |
| Wrappers do SofaScore (seção 1.1) | Grátis | Sim | Sim | Igual ao SofaScore, e mais (notas, mapa de calor, momentum) | **Testados em 31/10/2026: 403 em todos os modos** (sofascore-wrapper e ScraperFC, com e sem janela do navegador), na nuvem e no meu computador. Descartados |
| Transfermarkt (`felipeall/transfermarkt-api`, código aberto) | Grátis, hospedar por conta própria | Sim (no site) | Sim | Escalação, gols, técnicos | Não tem rota de jogos por time; a instância pública devolveu 403. Só como apoio |
| apifootball.com | Pago, com teste | Lista "Pernambucano 1" | Sim | Partidas, escalações, eventos | Não testada |
| ogol.com.br (zerozero) | Sem API pública | Sim, inclusive base | Sim | Tudo, inclusive público | Protegido contra acesso automatizado. Útil para conferir à mão |
| football-data.org | Grátis | Não | Só Série A | Placar | Pouca cobertura do Sport. Descartada |
| TheSportsDB | Grátis limitado / pago | Incerto | Parcial | Placar | Não vale a pena frente à ESPN |

Nenhuma fonte testada cobre os 94 jogos sozinha.

### Resultado do teste com a ESPN

- **84 de 94 jogos encontrados** (89%). Os 10 que faltam: 9 do Campeonato Pernambucano e o jogo sub-17 de 2016.
- Ela também corrigiu datas da lista. Além do São Paulo (16/08/2025), três jogos estavam com data errada:
  - Palmeiras 1x3: 04/07/2016, não 04/06;
  - Vitória 1x3: 18/06/2017, não 12/06;
  - Avaí 2x2: 11/04/2026, não 13/04.
- **Estádio:** 62 jogos na Ilha do Retiro e 22 na Arena de Pernambuco.
- **Profundidade dos dados** nos 84 jogos:

| Dado | Jogos com o dado |
|---|---|
| Placar, data, competição, estádio | 84 |
| Escalação titular do Sport | 72 |
| Estatísticas (posse, chutes, escanteios…) | 69 |
| Público | 53 |
| Árbitro | 38 (quase todos de 2019 em diante) |

- Os jogos da Copa do Nordeste vêm só com placar e estádio. Escalação, gols e público vêm do Brasileirão e da Copa do Brasil.
- **Problema de qualidade:** três jogos aparecem com público exatamente 26.345, o que parece a capacidade do estádio, não o público pagante. O app precisa deixar corrigir o público à mão.
- **Risco:** a API da ESPN não é documentada nem oficial. Pode mudar ou ser bloqueada sem aviso, e não tem termos claros para uso num produto público.

### 1.1 Wrappers do SofaScore

Levantamento de 31/10/2026 (versões no PyPI e código de cada pacote). Não deu para rodar nenhum no ambiente de nuvem, que bloqueia contorno de proteção anti-robô.

| Pacote | Última versão | Como acessa | Serve para o Pernambucano? |
|---|---|---|---|
| `sofascore-wrapper` | 1.1.1, jun/2025 | Navegador Chromium (Playwright) | **Sim.** Busca por id de campeonato, temporada e rodada; tem escalação, eventos (gols, cartões) e estatísticas da partida. Sem versão nova há 16 meses e sem issues abertas |
| `ScraperFC` | 4.5.0, abr/2026 | botasaurus / cloudscraper | Só com ajuste: os campeonatos ficam numa lista fixa (`comps.yaml`). Tem issue aberta de jun/2026 sobre erro ao buscar temporadas |
| `soccerdata` | 2026.43.0, out/2026 | seleniumbase | Pouco útil: o leitor do SofaScore só traz calendário e tabela, e campeonatos fora da lista exigem configuração |
| `LanusStats` | 2.1.13, out/2026 | nodriver / curl_cffi | Não: lista fixa de ligas (tem Brasileirão, não tem Pernambucano) |
| `aiosofascore` | 0.1.2.0, jun/2026 | aiohttp + cookies do navegador | Pouco útil: só busca e últimos jogos do time |
| `pysofascore` | 0.3.0, abr/2026 | curl_cffi | Pacote novo com só 3 versões, todas no mesmo dia |
| `sofascrape` | 0.1.2, out/2025 | Playwright | Pacote pequeno, com 2 versões |
| `sofascore-api` (2023), `sofascore` (2021) | — | — | Abandonados |
| `@sindicuab/sofascore-api` (npm) | 0.1.7, nov/2025 | — | Para JavaScript; pouco usado |

**Resultado:** o SofaScore recusou o acesso (HTTP 403) com os dois wrappers, com o navegador escondido e visível, também a partir do meu computador. Ele está bloqueando acesso automatizado; não vale insistir com técnicas para driblar o bloqueio. O script `sync/sofascore_sync.py` fica guardado caso isso mude, mas não faz parte do plano.

### 1.2 Resultado do teste com a API-Football

Teste de 31/10/2026 com a chave gratuita (variável `API_FOOTBALL_KEY` do ambiente). Gastou 8 das 100 consultas do dia; as recusadas por falta de acesso à temporada não contam.

- **Ids:** Pernambucano - 1 = `622`; Sport Recife = `123` (há ids separados para feminino, sub-20, sub-23, sub-19 e sub-17).
- **Temporadas do Pernambucano na API:** 2020 a 2026, todas com eventos e escalação. Estatísticas da partida só em 2025. A de 2017 e a de 2019 não existem.
- **O plano grátis só libera 2022 a 2024.** As outras temporadas devolvem "Free plans do not have access to this season".

Os 9 jogos do estadual que a ESPN não tem:

| Jogo | Na API-Football |
|---|---|
| 16/04/2017 Sport 3x2 Náutico | Não existe (a API começa em 2020) |
| 28/02/2019 Sport 3x1 Afogados | Não existe |
| 11/03/2023 Sport 2x0 Santa Cruz | **Achado** (fixture 979101, 1ª fase, rodada 11) |
| 22/04/2023 Sport 2x0 Retrô | **Achado** (fixture 1021242, final, jogo de volta) |
| 09/03/2025 Sport 2x0 Santa Cruz | Só no plano pago |
| 02/04/2025 Sport 1x2 Retrô | Só no plano pago |
| 31/01/2026 Sport 2x1 Santa Cruz | Só no plano pago |
| 21/02/2026 Sport 3x2 Retrô | Só no plano pago |
| 01/03/2026 Sport 3x3 Náutico | Só no plano pago |

O que veio nos 2 jogos de 2023:

- Placar igual ao da lista, data, estádio (Ilha do Retiro nos dois), árbitro, fase.
- Escalação titular e reservas dos dois times, técnico (Enderson Moreira), gols com minuto e autor, cartões e substituições.
- Não veio: público, formação e estatísticas (posse, chutes).

Cuidados para a implementação:

- **Nomes diferentes entre fontes:** "F. Labandeira" na API-Football é "Facundo Labandeira" na ESPN; "Ewerthon" é "Ewerton". Sem juntar, o mesmo jogador conta como dois. Dentro da própria API-Football o nome muda entre escalação e eventos ("Vágner Love" e "Vagner Love"). O app precisa de uma tabela de jogadores com o id de cada fonte e apelidos para juntar.
- **Substituição:** no evento `subst`, `player` é quem sai e `assist` é quem entra.
- **Estádio pelo nome oficial:** "Estádio Adelmar da Costa Carvalho" é a Ilha do Retiro; "Itaipava Arena Pernambuco" é a Arena.
- O contador de consultas do `/status` atualiza com alguns minutos de atraso. O app deve contar as próprias consultas em vez de depender dele.

**Para os 5 jogos de 2025 e 2026:** o plano pago mais barato (US$ 19 por um mês) libera essas temporadas. Como cada partida é buscada uma vez e fica no banco, um mês basta; depois dá para cancelar. Os 2 jogos de 2017 e 2019 ficam para preenchimento à mão.

### Recomendação

1. **ESPN como fonte principal**, consultada pelo próprio servidor do app. Grátis, sem chave, cobre 84 dos 94 jogos.
2. **API-Football para o Pernambucano**, com chave gratuita para 2022 a 2024 e, se valer a pena, um mês do plano pago para 2025 e 2026 (seção 1.2).
3. **Preenchimento à mão sempre disponível** para o que nenhuma API tiver: base, amistosos e estaduais antigos.
4. **Guardar no banco tudo o que vier das fontes**, com a fonte e o id original. Cada partida é buscada uma vez; isso protege contra mudanças nas APIs e reduz consultas.
5. Para o que nenhuma tiver, conferir no site do SofaScore ou do ogol pelo navegador e preencher à mão.

## 2. Contexto de uso

- Usuário principal: eu, no celular (no estádio ou na volta) e no computador.
- Outros torcedores podem criar a conta e o diário deles (seção 5).
- Registrar um jogo leva menos de 1 minuto. Com a API, basta escolher a partida numa lista; o resto vem pronto.
- Interface em português, datas em dd/mm/aaaa, horários de Brasília.

## 3. Dados iniciais (meu diário)

94 jogos, de 12/07/2009 a 23/10/2026: 54V 23E 17D, 146 gols marcados e 86 sofridos.

| Na lista | Como fica |
|---|---|
| `*` (9 jogos) | Marcação **candidato ao top 5** |
| Grafias diferentes (`Inter`, `Nautico`, `Atlético MG`…) | Nome oficial do clube, vindo da API |
| `Botafogo` e `Botafogo SP` | Clubes diferentes |
| `29 e 30/03/2023` (ABC) | Data 29/03/2023 e anotação de que o jogo terminou no dia 30 |
| `público: 10.253` | Campo público; vale mais que o da API |
| Títulos, final, acesso, Magrão, sub-17 | Tags no jogo |
| 4 datas erradas (seção 1) | Corrigidas pela API, com aviso para eu confirmar |
| 9 jogos de estadual | Competição = Campeonato Pernambucano. Os 2 de 2023 já vêm da API-Football; os outros 7 ficam "a confirmar" até virem de uma API ou serem preenchidos à mão |

## 4. Modelo de dados

A partida (dado público, igual para todos) fica separada da presença (o que é meu).

**Partida** (vem da API, compartilhada entre usuários)
- fonte e id na fonte (ex.: ESPN 700280), data e hora, competição, fase/rodada
- mandante, visitante, placar, estádio, cidade, público, árbitro
- escalações (titulares, reservas, formação), substituições
- eventos: gols (minuto, autor, pênalti, contra), cartões
- estatísticas do jogo
- data da última atualização e da última consulta à API

**Presença** (o meu registro de que fui a uma partida)
- usuário, partida (ou dados manuais quando a partida não existe na API)
- setor, com quem fui, anotação, tags, candidato ao top 5
- correções minhas que valem mais que a API (ex.: público)
- fotos

**Foto**: presença, arquivo, miniatura, legenda, data da foto (EXIF), capa.

**Usuário**: nome, e-mail, time do coração (id na fonte), fuso.

**Time e jogador**: id na fonte, nome, escudo ou foto quando houver. Apelidos de digitação para o cadastro manual (`Inter` → Internacional).

**Listas que crescem com o uso** (por usuário): setores, estádios manuais, acompanhantes.

## 5. Montar o diário por período

O app é pessoal (resposta de 31/10/2026). Esta seção vale para eu montar o meu diário; o modelo com partida separada da presença continua, porque facilita o cache da API e não custa nada.


Fluxo para quem chega pela primeira vez:

1. **Escolher o time** (busca na API).
2. **Escolher o período**, ex.: de 2015 até hoje.
3. O app **lista todas as partidas do time no período**, separadas por temporada e competição, com filtros "só em casa" e por competição.
4. **Marcar as partidas em que foi.** Dá para marcar a temporada inteira de uma vez e desmarcar exceções.
5. Adicionar à mão o que não aparecer (estadual, base, amistoso).
6. Opcional: importar uma lista em texto, como a minha (`Sport 2x1 Santos 24/11/2024`). O app casa cada linha com uma partida da API e mostra as que não achou.

O protótipo tem esse fluxo na aba **Montar diário**, com os jogos reais do Sport em 2025 e 2026.

Implicações:
- Login com senha única.
- A API é consultada por time e temporada, uma vez, e o resultado fica no banco.

## 6. Funcionalidades

### Jogos
- RF01. Listar jogos por temporada, mais recentes primeiro, com resumo da temporada (J, V, E, D, aproveitamento).
- RF02. Filtrar por texto, resultado, ano, competição, estádio, setor, acompanhante, mando e candidatos ao top 5.
- RF03. Detalhe do jogo como ingresso: placar, data, competição, estádio, público, árbitro, setor, com quem, tags, anotação, gols, escalação, estatísticas, fotos e contexto (RF14).
- RF04. Registrar jogo escolhendo a partida na lista da API (por data ou pelos últimos jogos do time). Sem API: formulário manual com data, adversário e placar.
- RF05. Editar e excluir presença; corrigir dados da partida só para mim (ex.: público).
- RF06. Montar diário por período (seção 5).
- RF07. Importar lista em texto, casando com a API.
- RF08. Navegar entre o jogo anterior e o próximo.
- RF09. Atualizar dados da API de um jogo (botão) e atualização automática nos dias seguintes ao jogo, porque público e escalação às vezes chegam depois.
- RF10. Marcar e ordenar o **top 5**: os candidatos viram uma lista ordenável e o top 5 aparece no Resumo.

### Fotos
- RF11. Enviar várias fotos pelo celular, no detalhe e no registro do jogo.
- RF12. Gerar miniatura e reduzir o tamanho; manter o original.
- RF13. Ver em tela cheia, escolher a capa e ver uma galeria geral filtrável.

### Estatísticas por jogo (contexto)
- RF14. Número do jogo na minha história, retrospecto contra o adversário até aquele dia, sequência invicta no momento, dias desde o jogo anterior, aproveitamento acumulado, e se foi a primeira vez que vi algum jogador (estreia que eu vi).

### Estatísticas gerais
- RF15. Resumo: total, V/E/D, aproveitamento, gols, médias, primeiro e último jogo.
- RF16. Recordes: maior invencibilidade, vitórias seguidas, maior goleada, pior derrota, jogo com mais gols, jogos sem sofrer gol, clássicos.
- RF17. Adversários: tabela ordenável com J, V, E, D, gols, aproveitamento e últimos 5; freguês, carrasco e mais visto.
- RF18. Por temporada (gráfico e tabela), dia da semana, placares mais comuns, competição, estádio, setor e acompanhante.
- RF19. Momentos: linha do tempo de títulos, finais, acessos e despedidas.
- RF20. Estatísticas da API (seção 7.3).

### Dados
- RF21. Exportar em JSON e CSV e baixar as fotos num .zip.

## 7. Estatísticas

### 7.1 Definições
- **Aproveitamento** = (3 × V + E) / (3 × J).
- **Invencibilidade** = maior número de jogos seguidos sem derrota, por data.
- **Freguês / carrasco** = maior e menor aproveitamento entre adversários com 3 jogos ou mais.
- Todos os jogos contam, inclusive o sub-17, com filtro para tirar a base.
- As estatísticas são dos jogos em que eu estava, não do time no geral, salvo quando dito.

### 7.2 Só com os meus dados (já no protótipo)
Os itens das seções RF15 a RF19.

### 7.3 Novas, com dados da API
Resultados já calculados com os 86 jogos que têm dados de API (84 da ESPN e 2 da API-Football). O pé-quente usa só os 84 da ESPN, porque a comparação é com o Sport mandante nas competições que a ESPN cobre.

| Estatística | Resultado |
|---|---|
| **Pé-quente**: meu aproveitamento comparado ao do Sport como mandante, nas mesmas competições e no mesmo período | 64,3% comigo contra 58,9% no geral (+5,4 pontos) |
| **Ilha × Arena** | Ilha do Retiro 38V 13E 13D; Arena de Pernambuco 11V 8E 3D |
| **Artilheiros que vi** | Chrystian 8, André 6, Diego Souza 6 |
| **Jogadores que mais vi em campo** | Rafael Thyere 24; Diego Souza, Durval e Rithely, 23 cada |
| **Quando saem os gols do Sport** | 29 dos 111 gols entre os 76 minutos e o fim |
| **Maior público** | 37.430 no Sport 0x2 Palmeiras de 23/07/2017 |
| **Árbitro que mais vi** | Savio Pereira Sampaio, 5 jogos |

Outras para a v1 ou para depois:
- Aproveitamento por competição e por técnico (técnico vem da API-Football).
- Escalação mais usada, formação mais usada e o "time ideal" que eu vi (os 11 com mais jogos por posição).
- Estreias e despedidas de jogadores que eu vi.
- Cartões, pênaltis, viradas e gols de bola parada.
- Público médio por ano e meu jogo com mais público.
- Pé-quente por temporada: em quais anos ver o jogo ajudou mais.

## 8. Requisitos não funcionais

- Mobile first, funcionando bem em 375 px, com tema claro e escuro.
- Fotos e dados de cada usuário privados.
- Funciona com internet ruim no estádio: o rascunho fica salvo e é enviado quando a conexão volta.
- **Fontes de dados atrás de uma interface única** (`buscarPartidasDoTime`, `buscarPartida`, `buscarTime`), com implementações para ESPN, API-Football e cadastro manual.
- Cache das partidas no banco; limite de requisições por fonte (API-Football grátis: 100 por dia).
- Custo próximo de zero no início.
- Backup fácil (RF21).

## 9. Proposta técnica

- **Next.js** (App Router) com páginas renderizadas no servidor e PWA para instalar no celular.
- **Postgres** (Neon ou Supabase) em produção; PGlite no desenvolvimento.
- **Armazenamento de fotos:** Vercel Blob ou Supabase Storage.
- **Login:** senha única (app pessoal).
- **Rotina diária no servidor** que busca na ESPN as partidas recentes do Sport.
- **Repositório próprio** para o app (ver nota abaixo).

### Repositório

O app vive em `gabbrbsCIn/daily`, separado de qualquer outro projeto. O código do app não deve importar nada de outros repositórios; o que for parecido (login por senha, conexão com o banco) é reescrito aqui.

## 10. Perguntas em aberto

1. Vale pagar um mês da API-Football (US$ 19) para trazer os 5 jogos do Pernambucano de 2025 e 2026? A alternativa é preencher à mão, junto com os de 2017 e 2019.
2. As 4 datas corrigidas pela ESPN (Palmeiras 2016, Vitória 2017, Avaí 2026 e São Paulo 2025) estão certas?
3. Quais setores você costuma usar? Viram a lista inicial de sugestões.

## 11. Ideias para depois

- Mapa dos setores da Ilha e da Arena com quantas vezes fiquei em cada um.
- Foto do ingresso com leitura automática de data, setor e preço.
- Card do jogo para compartilhar (placar, foto e "meu 95º jogo").
- Comparar diários entre amigos: jogos em que estivemos juntos.
- Notificação no dia do jogo: "você vai? marque presença".
