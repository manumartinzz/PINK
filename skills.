"""Habilidades locais da Pink: tudo o que ela sabe fazer no seu computador."""
from __future__ import annotations

import datetime as dt
import os
import platform
import re
import shutil
import subprocess
import webbrowser
from urllib.parse import quote_plus, urlparse

import psutil

DIAS = ["segunda-feira", "terça-feira", "quarta-feira", "quinta-feira",
        "sexta-feira", "sábado", "domingo"]
MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho",
         "agosto", "setembro", "outubro", "novembro", "dezembro"]

# Atalhos: diga "abrir youtube" e a Pink sabe o endereço.
SITES = {
    "youtube": "youtube.com",
    "google": "google.com",
    "gmail": "mail.google.com",
    "github": "github.com",
    "whatsapp": "web.whatsapp.com",
    "spotify": "open.spotify.com",
    "netflix": "netflix.com",
    "instagram": "instagram.com",
    "linkedin": "linkedin.com",
    "maps": "maps.google.com",
    "mapas": "maps.google.com",
    "drive": "drive.google.com",
    "chatgpt": "chatgpt.com",
    "claude": "claude.ai",
}

_NOME_APP_VALIDO = re.compile(r"^[\w .\-]{1,40}$", re.UNICODE)


def get_time() -> str:
    agora = dt.datetime.now()
    return (f"Agora são {agora:%H:%M} de {DIAS[agora.weekday()]}, "
            f"{agora.day} de {MESES[agora.month - 1]} de {agora.year}.")


def open_website(url: str) -> str:
    alvo = url.strip().lower()
    alvo = SITES.get(alvo, url.strip())
    if not re.match(r"^https?://", alvo, re.I):
        alvo = "https://" + alvo
    analisado = urlparse(alvo)
    if not analisado.netloc or " " in alvo or "." not in analisado.netloc:
        return "Esse endereço não parece válido."
    webbrowser.open(alvo)
    return f"Abri {analisado.netloc} no navegador."


def search_web(query: str) -> str:
    consulta = query.strip()
    if not consulta:
        return "Me diga o que você quer pesquisar."
    webbrowser.open("https://www.google.com/search?q=" + quote_plus(consulta))
    return f"Pesquisei por “{consulta}” no Google."


def open_app(name: str) -> str:
    nome = name.strip()
    if not _NOME_APP_VALIDO.match(nome):
        return "Esse nome de aplicativo não parece válido."
    sistema = platform.system()
    try:
        if sistema == "Windows":
            os.startfile(nome)  # type: ignore[attr-defined]
        elif sistema == "Darwin":
            subprocess.Popen(["open", "-a", nome])
        else:
            executavel = shutil.which(nome.lower()) or shutil.which(nome)
            if not executavel:
                return f"Não encontrei o aplicativo “{nome}” neste computador."
            subprocess.Popen([executavel], stdout=subprocess.DEVNULL,
                             stderr=subprocess.DEVNULL)
    except Exception:
        return f"Não consegui abrir o aplicativo “{nome}”."
    return f"Abrindo {nome}."


def system_info() -> dict:
    """Números do computador para o painel e para o assistente."""
    bateria = None
    try:
        sensor = psutil.sensors_battery()
        if sensor is not None:
            bateria = round(sensor.percent)
    except Exception:
        pass
    try:
        disco = psutil.disk_usage(os.path.abspath(os.sep)).percent
    except Exception:
        disco = 0
    return {
        "cpu": round(psutil.cpu_percent(interval=None)),
        "ram": round(psutil.virtual_memory().percent),
        "disco": round(disco),
        "bateria": bateria,
    }


def system_status() -> str:
    d = system_info()
    texto = (f"O processador está em {d['cpu']}%, a memória em {d['ram']}% "
             f"e o disco em {d['disco']}% de uso.")
    if d["bateria"] is not None:
        texto += f" A bateria está em {d['bateria']}%."
    return texto


# ---- Ferramentas que o Claude pode chamar -------------------------------

TOOLS = [
    {
        "name": "get_time",
        "description": "Informa a data e a hora atuais do computador do usuário.",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "open_website",
        "description": "Abre um site no navegador. Aceita um endereço (ex: github.com) "
                       "ou um nome conhecido (youtube, gmail, spotify...).",
        "input_schema": {
            "type": "object",
            "properties": {"url": {"type": "string"}},
            "required": ["url"],
        },
    },
    {
        "name": "search_web",
        "description": "Pesquisa um assunto no Google, no navegador do usuário.",
        "input_schema": {
            "type": "object",
            "properties": {"query": {"type": "string"}},
            "required": ["query"],
        },
    },
    {
        "name": "open_app",
        "description": "Abre um aplicativo instalado no computador (ex: calculadora, notepad, spotify).",
        "input_schema": {
            "type": "object",
            "properties": {"name": {"type": "string"}},
            "required": ["name"],
        },
    },
    {
        "name": "system_status",
        "description": "Informa o uso de processador, memória, disco e bateria.",
        "input_schema": {"type": "object", "properties": {}},
    },
]

_FUNCOES = {
    "get_time": lambda **_: get_time(),
    "open_website": lambda url, **_: open_website(url),
    "search_web": lambda query, **_: search_web(query),
    "open_app": lambda name, **_: open_app(name),
    "system_status": lambda **_: system_status(),
}


def run_tool(name: str, args: dict) -> str:
    funcao = _FUNCOES.get(name)
    if funcao is None:
        return "Ferramenta desconhecida."
    try:
        return funcao(**(args or {}))
    except TypeError:
        return "Parâmetros inválidos para essa ação."
