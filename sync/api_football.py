#!/usr/bin/env python3
"""Busca na API-Football os jogos do Pernambucano da minha lista.

A chave vem da variável de ambiente API_FOOTBALL_KEY. Cada resposta fica em
cache em dados_api_football/, então rodar de novo não gasta consultas.

    python api_football.py --temporadas 2023
    python api_football.py --temporadas 2023 2025 2026 --meus-jogos meus_jogos.txt

O plano grátis só libera as temporadas de 2022 a 2024 (teste de 31/10/2026).
"""
import argparse
import json
import os
import re
import sys
import unicodedata
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

BASE = "https://v3.football.api-sports.io"
SPORT = 123
PERNAMBUCANO = 622
ESTADIOS = {
    "Estádio Adelmar da Costa Carvalho": "Ilha do Retiro",
    "Itaipava Arena Pernambuco": "Arena de Pernambuco",
    "Estádio José do Rego Maciel": "Arruda",
    "Estádio Eládio de Barros Carvalho": "Aflitos",
}
# Nome na API-Football -> nome na ESPN, para somar os jogos do mesmo jogador.
APELIDOS = {"F. Labandeira": "Facundo Labandeira", "Ewerthon": "Ewerton"}
LINHA = re.compile(r"^\W*Sport (\d+)x(\d+) (.+?) (\d{2})(?: e \d{2})?/(\d{2})/(\d{4})(\*)?\s*(.*)$")


class ErroPlano(Exception):
    pass


def get(caminho, params, cache):
    arquivo = cache / (caminho.strip("/").replace("/", "_") + "_" + "_".join(f"{k}{v}" for k, v in params.items()) + ".json")
    if arquivo.exists():
        return json.loads(arquivo.read_text(encoding="utf-8"))
    chave = os.environ.get("API_FOOTBALL_KEY")
    if not chave:
        sys.exit("Defina a variável API_FOOTBALL_KEY.")
    req = urllib.request.Request(f"{BASE}{caminho}?{urllib.parse.urlencode(params)}", headers={"x-apisports-key": chave})
    with urllib.request.urlopen(req, timeout=30) as r:
        d = json.load(r)
    if d.get("errors"):
        raise ErroPlano(f"{caminho} {params}: {d['errors']}")
    arquivo.write_text(json.dumps(d, ensure_ascii=False), encoding="utf-8")
    return d


def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    return re.sub(r"[^a-z0-9 ]", " ", "".join(c for c in s if unicodedata.category(c) != "Mn")).split()


def meus_jogos(arquivo, anos):
    for linha in Path(arquivo).read_text(encoding="utf-8").splitlines():
        m = LINHA.match(linha.strip())
        if m and int(m.group(6)) in anos:
            gp, gc, adv, d, mes, ano = m.groups()[:6]
            yield linha.strip(), date(int(ano), int(mes), int(d)), adv, (int(gp), int(gc))


def casar(dia, adv, placar, partidas):
    for p in partidas:
        casa = p["teams"]["home"]["id"] == SPORT
        outro = p["teams"]["away" if casa else "home"]["name"]
        gols = (p["goals"]["home"], p["goals"]["away"])
        if not casa:
            gols = gols[::-1]
        dist = abs((date.fromisoformat(p["fixture"]["date"][:10]) - dia).days)
        a0 = norm(adv)[0]
        if dist <= 1 and (any(t.startswith(a0) or a0.startswith(t) for t in norm(outro)) or gols == placar):
            return p, gols != placar
    return None, False


def minuto(t):
    return f"{t['elapsed']}'" + (f"+{t['extra']}'" if t["extra"] else "")


def nome(n):
    return APELIDOS.get(n, n)


def compacto(p, escalacoes, eventos):
    """Converte para o formato do protótipo: {id, c, v, r, g, xi, f, sb, tec}."""
    sport = next((t for t in escalacoes if t["team"]["id"] == SPORT), None)
    gols, entraram = [], []
    for e in eventos:
        nosso = e["team"]["id"] == SPORT
        if e["type"] == "Goal" and e["detail"] != "Missed Penalty":
            tipo = {"Penalty": "pen", "Own Goal": "contra"}.get(e["detail"], "")
            gols.append([minuto(e["time"]), "S" if nosso else "A", nome(e["player"]["name"]), tipo])
        elif e["type"] == "subst" and nosso:
            # Na substituição, "player" é quem sai e "assist" é quem entra.
            entraram.append(nome(e["assist"]["name"]))
    lado = "home" if p["teams"]["home"]["id"] == SPORT else "away"
    nossos = sum(g[1] == "S" for g in gols)
    alerta = None if nossos == p["goals"][lado] else f"gols do Sport nos eventos ({nossos}) diferem do placar"
    estadio = p["fixture"]["venue"]["name"] or ""
    return {
        "id": str(p["fixture"]["id"]),
        "c": "Campeonato Pernambucano",
        "fase": p["league"]["round"],
        "v": ESTADIOS.get(estadio, estadio),
        "r": p["fixture"]["referee"] or "",
        "g": gols,
        "xi": [nome(x["player"]["name"]) for x in sport["startXI"]] if sport else [],
        "f": (sport or {}).get("formation") or "",
        "sb": entraram,
        "tec": sport["coach"]["name"] if sport else "",
    }, alerta


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--temporadas", type=int, nargs="+", required=True)
    ap.add_argument("--meus-jogos", default="meus_jogos.txt")
    ap.add_argument("--saida", default="dados_api_football")
    a = ap.parse_args()
    cache = Path(a.saida) / "cache"
    cache.mkdir(parents=True, exist_ok=True)

    partidas = {}
    for ano in a.temporadas:
        try:
            partidas[ano] = get("/fixtures", {"team": SPORT, "league": PERNAMBUCANO, "season": ano}, cache)["response"]
            print(f"{ano}: {len(partidas[ano])} jogos do Sport no Pernambucano")
        except ErroPlano as e:
            print(f"{ano}: sem acesso ({e})")

    saida = {}
    for linha, dia, adv, placar in meus_jogos(a.meus_jogos, set(partidas)):
        p, placar_diferente = casar(dia, adv, placar, partidas[dia.year])
        if not p:
            continue
        fid = p["fixture"]["id"]
        esc = get("/fixtures/lineups", {"fixture": fid}, cache)["response"]
        ev = get("/fixtures/events", {"fixture": fid}, cache)["response"]
        jogo, alerta = compacto(p, esc, ev)
        if placar_diferente:
            alerta = "; ".join(filter(None, [alerta, "placar diferente da lista"]))
        saida[p["fixture"]["date"][:10]] = jogo
        print(f"  {linha} -> fixture {fid}" + (f"  ALERTA: {alerta}" if alerta else ""))

    destino = Path(a.saida) / "pernambucano.json"
    destino.write_text(json.dumps(saida, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(saida)} jogos salvos em {destino}")


if __name__ == "__main__":
    main()
