"""Habilidades locais da assistente: computador, clima, lembretes, matemática e mais."""
from __future__ import annotations

import ast
import datetime as dt
import json
import math
import operator
import os
import platform
import random
import re
import shutil
import subprocess
import threading
import urllib.error
import urllib.request
import webbrowser
from pathlib import Path
from typing import Any
from urllib.parse import quote_plus, urlparse

import psutil

RAIZ = Path(__file__).resolve().parent.parent

DIAS = [
    "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira",
    "sexta-feira", "sábado", "domingo",
]
MESES = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
]

# Atalhos: diga "abrir youtube" e a assistente sabe o endereço.
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
    "pinterest": "pinterest.com",
    "canva": "canva.com",
    "tiktok": "tiktok.com",
    "notion": "notion.so",
    "wikipedia": "pt.wikipedia.org",
    "duolingo": "duolingo.com",
    "classroom": "classroom.google.com",
    "meet": "meet.google.com",
    "shopee": "shopee.com.br",
    "shein": "shein.com",
}

WMO_CLIMA = {
    0: "céu limpo",
    1: "predominantemente limpo",
    2: "parcialmente nublado",
    3: "nublado",
    45: "com neblina",
    48: "com nevoeiro",
    51: "com garoa leve",
    53: "com garoa moderada",
    55: "com garoa intensa",
    61: "com chuva leve",
    63: "com chuva moderada",
    65: "com chuva forte",
    71: "com neve leve",
    73: "com neve moderada",
    75: "com neve forte",
    80: "com pancadas de chuva leves",
    81: "com pancadas de chuva",
    82: "com pancadas de chuva fortes",
    95: "com trovoadas",
    96: "com tempestade e granizo",
    99: "com tempestade forte",
}

PIADAS = [
    "Por que o computador foi ao médico? Porque estava com um vírus e não parava de espirrar arquivos!",
    "O que a impressora falou para a folha de papel? Essa história é minha ou é impressão minha?",
    "Qual é o café favorito do programador? O Java bem forte!",
    "Por que o livro de matemática ficou triste? Porque tinha muitos problemas.",
    "O que o zero disse para o oito? Adorei o seu cinto novo!",
    "Por que a Wi-Fi não gosta de fofoca? Porque sempre cai no meio da conversa.",
    "Qual é a tecla mais espaçosa do teclado? A barra de espaço, claro!",
    "O que uma estrela falou para a outra? Você brilha muito, amiga!",
]

CURIOSIDADES = [
    "Você sabia que Ada Lovelace escreveu o primeiro algoritmo da história para um computador ainda no século dezenove, muito antes de existir eletricidade nas casas?",
    "Você sabia que a atriz e inventora Hedy Lamarr criou a base da tecnologia usada hoje no Wi-Fi e no Bluetooth?",
    "Você sabia que as lontras marinhas dormem de mãos dadas para não se separarem com a correnteza?",
    "Você sabia que um dia em Vênus dura mais tempo do que um ano inteiro lá, porque o planeta gira bem devagarinho?",
    "Você sabia que Katherine Johnson fez os cálculos de trajetória que levaram a NASA até a Lua com segurança?",
    "Você sabia que o coração das baleias azuis é tão grande que daria para ouvir o batimento a mais de três quilômetros debaixo d'água?",
    "Você sabia que o polvo tem três corações e sangue azul?",
    "Você sabia que existem mais estrelas no universo observável do que grãos de areia em todas as praias da Terra?",
]

FRASES_MOTIVACIONAIS = [
    "Você não precisa ter tudo resolvido hoje; só precisa dar o próximo passo com confiança.",
    "Grandes conquistas começam com pequenos hábitos feitos todos os dias. Eu acredito no seu potencial!",
    "Se o plano A não deu certo, respira fundo: o alfabeto tem mais vinte e cinco letras esperando por você.",
    "Seu brilho não precisa apagar o de ninguém. Vai lá e mostra do que você é capaz!",
    "Cada minuto que você dedica a aprender algo novo é um superpoder que ninguém pode tirar de você.",
    "Lembra do Homem de Ferro: até a melhor armadura precisou de vários testes antes de voar perfeito.",
]

_NOME_APP_VALIDO = re.compile(r"^[\w .\-]{1,40}$", re.UNICODE)
_TASKS_LOCK = threading.Lock()


def _pode_abrir_navegador_local() -> bool:
    if os.getenv("PINK_NO_BROWSER", "").strip().lower() in ("1", "true", "yes"):
        return False
    sistema = platform.system()
    if sistema in ("Windows", "Darwin"):
        return True
    return bool(os.environ.get("DISPLAY") or os.environ.get("WAYLAND_DISPLAY"))


def get_time() -> str:
    agora = dt.datetime.now()
    return (
        f"Agora são {agora:%H:%M} de {DIAS[agora.weekday()]}, "
        f"{agora.day} de {MESES[agora.month - 1]} de {agora.year}."
    )


def build_website_url(url: str) -> tuple[str | None, str]:
    alvo_raw = url.strip()
    if not alvo_raw:
        return None, ""
    alvo = SITES.get(alvo_raw.lower(), alvo_raw)
    if not re.match(r"^https?://", alvo, re.I):
        alvo = "https://" + alvo
    analisado = urlparse(alvo)
    if not analisado.netloc or " " in alvo or "." not in analisado.netloc:
        return None, ""
    return alvo, analisado.netloc


def open_website(url: str) -> str:
    alvo, host = build_website_url(url)
    if not alvo:
        return "Esse endereço não parece válido."
    if _pode_abrir_navegador_local():
        try:
            webbrowser.open(alvo)
        except Exception:
            pass
    return f"Abri {host} no navegador."


def search_web(query: str) -> str:
    consulta = query.strip()
    if not consulta:
        return "Me diga o que você quer pesquisar."
    url = "https://www.google.com/search?q=" + quote_plus(consulta)
    if _pode_abrir_navegador_local():
        try:
            webbrowser.open(url)
        except Exception:
            pass
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
            if _pode_abrir_navegador_local():
                subprocess.Popen(
                    [executavel],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                )
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
    texto = (
        f"O processador está em {d['cpu']}%, a memória em {d['ram']}% "
        f"e o disco em {d['disco']}% de uso."
    )
    if d["bateria"] is not None:
        texto += f" A bateria está em {d['bateria']}%."
    return texto


# ---- Matemática segura --------------------------------------------------

_OPS_BIN = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
}
_OPS_UN = {
    ast.UAdd: operator.pos,
    ast.USub: operator.neg,
}


def _eval_ast(node: ast.AST) -> float:
    if isinstance(node, ast.Expression):
        return _eval_ast(node.body)
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
        return float(node.value)
    if isinstance(node, ast.Name):
        nomes = {"pi": math.pi, "e": math.e}
        if node.id.lower() in nomes:
            return nomes[node.id.lower()]
        raise ValueError("Símbolo não suportado")
    if isinstance(node, ast.UnaryOp) and type(node.op) in _OPS_UN:
        return _OPS_UN[type(node.op)](_eval_ast(node.operand))
    if isinstance(node, ast.BinOp):
        esq = _eval_ast(node.left)
        dir_ = _eval_ast(node.right)
        if isinstance(node.op, ast.Pow):
            if abs(dir_) > 100 or abs(esq) > 10000:
                raise ValueError("Potência muito grande")
            return esq ** dir_
        op = _OPS_BIN.get(type(node.op))
        if op is None:
            raise ValueError("Operação não suportada")
        if isinstance(node.op, (ast.Div, ast.FloorDiv, ast.Mod)) and dir_ == 0:
            raise ZeroDivisionError("Divisão por zero")
        return op(esq, dir_)
    if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
        fn = node.func.id.lower()
        args = [_eval_ast(a) for a in node.args]
        if fn in ("sqrt", "raiz") and len(args) == 1:
            if args[0] < 0:
                raise ValueError("Raiz negativa")
            return math.sqrt(args[0])
        if fn == "abs" and len(args) == 1:
            return abs(args[0])
    raise ValueError("Expressão inválida")


def _normalizar_expressao_pt(texto: str) -> str:
    s = texto.strip().lower()
    s = re.sub(r"^(?:a|o)\s+", "", s)
    s = re.sub(r"[?!.=]+$", "", s).strip()
    # "15% de 200" -> "(15/100)*200"
    s = re.sub(
        r"(\d+(?:[.,]\d+)?)\s*%\s*de\s*(\d+(?:[.,]\d+)?)",
        r"(\1/100)*(\2)",
        s,
    )
    # "raiz quadrada de 144" -> "sqrt(144)"
    s = re.sub(r"raiz\s+quadrada\s+de\s+(\d+(?:[.,]\d+)?)", r"sqrt(\1)", s)
    s = re.sub(r"raiz\s+de\s+(\d+(?:[.,]\d+)?)", r"sqrt(\1)", s)
    s = s.replace(",", ".")
    s = re.sub(r"\b(?:vezes|x)\b", "*", s)
    s = re.sub(r"\bdividido\s+por\b", "/", s)
    s = re.sub(r"\bmais\b", "+", s)
    s = re.sub(r"\bmenos\b", "-", s)
    s = re.sub(r"\belevado\s+a\b", "**", s)
    s = s.replace("^", "**").replace("×", "*").replace("÷", "/")
    return s.strip()


def _formatar_numero(valor: float) -> str:
    if abs(valor - round(valor)) < 1e-9:
        return str(int(round(valor)))
    arred = round(valor, 4)
    texto = f"{arred:.4f}".rstrip("0").rstrip(".")
    return texto.replace(".", ",")


def calculate(expression: str) -> str:
    expr = _normalizar_expressao_pt(expression)
    if not expr or len(expr) > 120:
        return "Não entendi essa conta. Pode falar os números de novo?"
    try:
        arvore = ast.parse(expr, mode="eval")
        resultado = _eval_ast(arvore)
    except ZeroDivisionError:
        return "Não dá para dividir por zero!"
    except Exception:
        return "Não consegui calcular essa expressão."
    return f"O resultado é {_formatar_numero(resultado)}."


# ---- Previsão do tempo (Open-Meteo, grátis e sem chave) -----------------

def _fetch_json(url: str, timeout: float = 2.5) -> dict:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "PinkAssistant/1.0"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def get_weather(city: str = "") -> tuple[str, dict | None]:
    cidade = city.strip() or os.getenv("PINK_CITY", "Curitiba").strip() or "Curitiba"
    try:
        geo_url = (
            "https://geocoding-api.open-meteo.com/v1/search?"
            f"name={quote_plus(cidade)}&count=1&language=pt&format=json"
        )
        geo = _fetch_json(geo_url)
        resultados = geo.get("results") or []
        if not resultados:
            return f"Não encontrei a cidade “{cidade}” na previsão do tempo.", None
        lugar = resultados[0]
        lat = lugar["latitude"]
        lon = lugar["longitude"]
        nome_local = lugar.get("name", cidade)
        estado = lugar.get("admin1", "")
        local_fmt = f"{nome_local}, {estado}" if estado else nome_local

        clima_url = (
            "https://api.open-meteo.com/v1/forecast?"
            f"latitude={lat}&longitude={lon}"
            "&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code"
            "&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max"
            "&timezone=auto"
        )
        dados = _fetch_json(clima_url)
        atual = dados.get("current", {})
        diario = dados.get("daily", {})

        temp = round(atual.get("temperature_2m", 0))
        sensacao = round(atual.get("apparent_temperature", temp))
        umidade = round(atual.get("relative_humidity_2m", 0))
        condicao = WMO_CLIMA.get(atual.get("weather_code", 0), "com tempo variável")
        tmax = round((diario.get("temperature_2m_max") or [temp])[0])
        tmin = round((diario.get("temperature_2m_min") or [temp])[0])
        chuva = (diario.get("precipitation_probability_max") or [0])[0]

        frase = (
            f"Em {local_fmt}, agora faz {temp} graus com {condicao} "
            f"e sensação de {sensacao} graus. "
            f"Hoje a mínima é de {tmin} e a máxima de {tmax} graus, "
            f"com umidade em {umidade}%."
        )
        if chuva and chuva >= 50:
            frase += f" A chance de chuva é de {chuva}%, melhor levar guarda-chuva!"
        return frase, None
    except (urllib.error.URLError, TimeoutError, OSError, ValueError):
        # Em ambientes isolados (ou quando o servidor está offline), o navegador pode consultar direto.
        return (
            f"Consultando a previsão do tempo para {cidade}...",
            {"type": "weather", "city": cidade},
        )


def get_weather_text(city: str = "") -> str:
    texto, _ = get_weather(city)
    return texto


# ---- Lembretes e Lista de Tarefas ---------------------------------------

def _tasks_file() -> Path:
    custom = os.getenv("PINK_TASKS_FILE", "").strip()
    if custom:
        return Path(custom)
    return RAIZ / "data" / "tasks.json"


def _load_tasks() -> list[dict[str, Any]]:
    caminho = _tasks_file()
    if not caminho.exists():
        return []
    try:
        dados = json.loads(caminho.read_text(encoding="utf-8"))
        return dados if isinstance(dados, list) else []
    except Exception:
        return []


def _save_tasks(tarefas: list[dict[str, Any]]) -> None:
    caminho = _tasks_file()
    caminho.parent.mkdir(parents=True, exist_ok=True)
    caminho.write_text(
        json.dumps(tarefas, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def get_tasks_list() -> list[dict[str, Any]]:
    with _TASKS_LOCK:
        return _load_tasks()


def add_task(text: str) -> tuple[str, dict]:
    limpo = text.strip()
    if not limpo:
        return "Me diga o que você quer anotar nos lembretes.", {}
    with _TASKS_LOCK:
        tarefas = _load_tasks()
        novo_id = max((t.get("id", 0) for t in tarefas), default=0) + 1
        tarefas.append({
            "id": novo_id,
            "text": limpo,
            "done": False,
            "created_at": dt.datetime.now().isoformat(timespec="seconds"),
        })
        _save_tasks(tarefas)
    return f"Anotei nos seus lembretes: {limpo}.", {"type": "tasks_updated"}


def list_tasks() -> str:
    tarefas = get_tasks_list()
    if not tarefas:
        return "Sua lista de lembretes está vazia no momento."
    pendentes = [t for t in tarefas if not t.get("done")]
    concluidas = len(tarefas) - len(pendentes)
    if not pendentes:
        return f"Você completou todas as {concluidas} tarefas da lista! Parabéns!"
    itens = "; ".join(f"{i}. {t['text']}" for i, t in enumerate(pendentes, 1))
    extra = f" Você também já concluiu {concluidas}." if concluidas else ""
    return f"Você tem {len(pendentes)} lembrete(s) pendente(s): {itens}.{extra}"


def toggle_task(task_id: int) -> list[dict[str, Any]]:
    with _TASKS_LOCK:
        tarefas = _load_tasks()
        for t in tarefas:
            if t.get("id") == task_id:
                t["done"] = not t.get("done", False)
                break
        _save_tasks(tarefas)
        return tarefas


def delete_task_by_id(task_id: int) -> list[dict[str, Any]]:
    with _TASKS_LOCK:
        tarefas = [t for t in _load_tasks() if t.get("id") != task_id]
        _save_tasks(tarefas)
        return tarefas


def complete_task(ref: str) -> tuple[str, dict]:
    alvo = ref.strip()
    if not alvo:
        return "Qual tarefa você quer marcar como concluída?", {}
    with _TASKS_LOCK:
        tarefas = _load_tasks()
        pendentes = [t for t in tarefas if not t.get("done")]
        escolhida = None
        if alvo.isdigit():
            idx = int(alvo) - 1
            if 0 <= idx < len(pendentes):
                escolhida = pendentes[idx]
        if escolhida is None:
            low = alvo.lower()
            for t in pendentes:
                if low in t.get("text", "").lower():
                    escolhida = t
                    break
        if escolhida is None:
            return f"Não encontrei nenhuma tarefa pendente parecida com “{alvo}”.", {}
        escolhida["done"] = True
        _save_tasks(tarefas)
    return f"Marquei como concluída: {escolhida['text']}. Mandou bem!", {"type": "tasks_updated"}


def delete_task(ref: str) -> tuple[str, dict]:
    alvo = ref.strip()
    if not alvo:
        return "Qual lembrete você quer apagar?", {}
    with _TASKS_LOCK:
        tarefas = _load_tasks()
        escolhida = None
        if alvo.isdigit():
            idx = int(alvo) - 1
            if 0 <= idx < len(tarefas):
                escolhida = tarefas[idx]
        if escolhida is None:
            low = alvo.lower()
            for t in tarefas:
                if low in t.get("text", "").lower():
                    escolhida = t
                    break
        if escolhida is None:
            return f"Não encontrei o lembrete “{alvo}”.", {}
        tarefas = [t for t in tarefas if t.get("id") != escolhida.get("id")]
        _save_tasks(tarefas)
    return f"Removi o lembrete: {escolhida['text']}.", {"type": "tasks_updated"}


def clear_tasks(only_done: bool = False) -> tuple[str, dict]:
    with _TASKS_LOCK:
        tarefas = _load_tasks()
        if only_done:
            restantes = [t for t in tarefas if not t.get("done")]
            removidas = len(tarefas) - len(restantes)
            _save_tasks(restantes)
            msg = (
                f"Limpei {removidas} tarefa(s) concluída(s)."
                if removidas
                else "Não havia tarefas concluídas para limpar."
            )
        else:
            _save_tasks([])
            msg = "Limpei todos os seus lembretes."
    return msg, {"type": "tasks_updated"}


# ---- Timer de estudos e entretenimento ----------------------------------

def start_timer(minutes: float = 25, label: str = "Estudos") -> tuple[str, dict]:
    try:
        mins = float(minutes)
    except (TypeError, ValueError):
        return "Não entendi o tempo do timer.", {}
    if mins <= 0 or mins > 240:
        return "O timer precisa ter entre alguns segundos e 4 horas.", {}
    segundos = max(5, int(round(mins * 60)))
    rotulo = (label or "Estudos").strip()[:30]
    if segundos < 60:
        tempo_str = f"{segundos} segundos"
    elif abs(mins - round(mins)) < 0.01:
        m = int(round(mins))
        tempo_str = "1 minuto" if m == 1 else f"{m} minutos"
    else:
        tempo_str = f"{segundos // 60} minutos e {segundos % 60} segundos"
    return (
        f"Iniciando timer de {tempo_str} para {rotulo}. Bom foco!",
        {"type": "timer_start", "seconds": segundos, "label": rotulo},
    )


def stop_timer() -> tuple[str, dict]:
    return "Timer parado.", {"type": "timer_stop"}


def tell_joke() -> str:
    return random.choice(PIADAS)


def tell_curiosity() -> str:
    return random.choice(CURIOSIDADES)


def motivate() -> str:
    return random.choice(FRASES_MOTIVACIONAIS)


def flip_coin() -> str:
    lado = random.choice(["Cara", "Coroa"])
    return f"Joguei a moeda e deu {lado}!"


def roll_dice(sides: int = 6) -> str:
    lados = max(2, min(100, int(sides or 6)))
    return f"Rolei um dado de {lados} lados e caiu {random.randint(1, lados)}!"


# ---- Ferramentas para o Claude ------------------------------------------

TOOLS = [
    {
        "name": "get_time",
        "description": "Informa a data e a hora atuais do computador do usuário.",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "get_weather",
        "description": "Consulta a previsão do tempo atual e de hoje para uma cidade.",
        "input_schema": {
            "type": "object",
            "properties": {"city": {"type": "string", "description": "Nome da cidade (opcional)"}},
        },
    },
    {
        "name": "calculate",
        "description": "Calcula expressões matemáticas ou porcentagens (ex: '15% de 200', '25*4').",
        "input_schema": {
            "type": "object",
            "properties": {"expression": {"type": "string"}},
            "required": ["expression"],
        },
    },
    {
        "name": "add_task",
        "description": "Adiciona um lembrete ou tarefa na lista do usuário.",
        "input_schema": {
            "type": "object",
            "properties": {"text": {"type": "string"}},
            "required": ["text"],
        },
    },
    {
        "name": "list_tasks",
        "description": "Lista os lembretes e tarefas atuais do usuário.",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "complete_task",
        "description": "Marca uma tarefa pendente como concluída pelo número ou nome.",
        "input_schema": {
            "type": "object",
            "properties": {"ref": {"type": "string"}},
            "required": ["ref"],
        },
    },
    {
        "name": "delete_task",
        "description": "Remove um lembrete da lista pelo número ou nome.",
        "input_schema": {
            "type": "object",
            "properties": {"ref": {"type": "string"}},
            "required": ["ref"],
        },
    },
    {
        "name": "start_timer",
        "description": "Inicia um timer de estudos ou Pomodoro na interface.",
        "input_schema": {
            "type": "object",
            "properties": {
                "minutes": {"type": "number", "description": "Duração em minutos (ex: 25)"},
                "label": {"type": "string", "description": "Rótulo (ex: Estudos, Pausa)"},
            },
            "required": ["minutes"],
        },
    },
    {
        "name": "stop_timer",
        "description": "Para o timer de estudos ativo.",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "open_website",
        "description": "Abre um site no navegador (ex: youtube, spotify, github.com).",
        "input_schema": {
            "type": "object",
            "properties": {"url": {"type": "string"}},
            "required": ["url"],
        },
    },
    {
        "name": "search_web",
        "description": "Pesquisa um assunto no Google.",
        "input_schema": {
            "type": "object",
            "properties": {"query": {"type": "string"}},
            "required": ["query"],
        },
    },
    {
        "name": "open_app",
        "description": "Abre um aplicativo instalado no computador.",
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
    {
        "name": "tell_joke",
        "description": "Conta uma piada leve e divertida.",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "tell_curiosity",
        "description": "Conta uma curiosidade interessante de ciência, espaço ou história.",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "motivate",
        "description": "Entrega uma frase motivacional positiva.",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "customize_assistant",
        "description": "Personaliza nome, tema visual (rosa-neon, rose-gold, lilas-galaxy, cereja-cyber), personalidade (carinhosa, jarvis, divertida, estudos) ou estilo do holograma (orbital, estelar, cristal).",
        "input_schema": {
            "type": "object",
            "properties": {
                "assistant_name": {"type": "string"},
                "user_name": {"type": "string"},
                "theme": {"type": "string"},
                "personality": {"type": "string"},
                "orb_style": {"type": "string"},
            },
        },
    },
]


def _customize_assistant(
    assistant_name: str = "",
    user_name: str = "",
    theme: str = "",
    personality: str = "",
    orb_style: str = "",
    **_: Any,
) -> tuple[str, list[dict]]:
    acoes: list[dict] = []
    mudancas: list[str] = []
    if assistant_name.strip():
        nome = assistant_name.strip()[:24]
        acoes.append({"type": "set_pref", "key": "assistantName", "value": nome})
        mudancas.append(f"meu nome para {nome}")
    if user_name.strip():
        unome = user_name.strip()[:24]
        acoes.append({"type": "set_pref", "key": "userName", "value": unome})
        mudancas.append(f"seu nome para {unome}")
    if theme.strip():
        acoes.append({"type": "set_pref", "key": "theme", "value": theme.strip()})
        mudancas.append(f"o visual para {theme.strip()}")
    if personality.strip():
        acoes.append({"type": "set_pref", "key": "personality", "value": personality.strip()})
        mudancas.append(f"minha personalidade para {personality.strip()}")
    if orb_style.strip():
        acoes.append({"type": "set_pref", "key": "orbStyle", "value": orb_style.strip()})
        mudancas.append(f"o holograma para {orb_style.strip()}")
    if not mudancas:
        return "Você pode personalizar tudo clicando em Personalizar ali no topo!", []
    return "Prontinho! Atualizei " + " e ".join(mudancas) + ".", acoes


def run_tool_rich(name: str, args: dict | None = None) -> tuple[str, list[dict]]:
    args = args or {}
    try:
        if name == "get_time":
            return get_time(), []
        if name == "system_status":
            return system_status(), []
        if name == "get_weather":
            texto, acao = get_weather(str(args.get("city", "")))
            return texto, ([acao] if acao else [])
        if name == "calculate":
            return calculate(str(args.get("expression", ""))), []
        if name == "add_task":
            texto, acao = add_task(str(args.get("text", "")))
            return texto, ([acao] if acao else [])
        if name == "list_tasks":
            return list_tasks(), []
        if name == "complete_task":
            texto, acao = complete_task(str(args.get("ref", "")))
            return texto, ([acao] if acao else [])
        if name == "delete_task":
            texto, acao = delete_task(str(args.get("ref", "")))
            return texto, ([acao] if acao else [])
        if name == "start_timer":
            texto, acao = start_timer(
                args.get("minutes", 25),
                str(args.get("label", "Estudos")),
            )
            return texto, ([acao] if acao else [])
        if name == "stop_timer":
            texto, acao = stop_timer()
            return texto, ([acao] if acao else [])
        if name == "open_website":
            url_str = str(args.get("url", ""))
            texto = open_website(url_str)
            alvo, host = build_website_url(url_str)
            acoes = [{"type": "open_url", "url": alvo, "label": f"Abrir {host}"}] if alvo else []
            return texto, acoes
        if name == "search_web":
            consulta = str(args.get("query", "")).strip()
            texto = search_web(consulta)
            acoes = (
                [{
                    "type": "open_url",
                    "url": "https://www.google.com/search?q=" + quote_plus(consulta),
                    "label": f"Ver busca: {consulta}",
                }]
                if consulta
                else []
            )
            return texto, acoes
        if name == "open_app":
            return open_app(str(args.get("name", ""))), []
        if name == "tell_joke":
            return tell_joke(), []
        if name == "tell_curiosity":
            return tell_curiosity(), []
        if name == "motivate":
            return motivate(), []
        if name == "customize_assistant":
            return _customize_assistant(**args)
        return "Ferramenta desconhecida.", []
    except TypeError:
        return "Parâmetros inválidos para essa ação.", []


def run_tool(name: str, args: dict) -> str:
    texto, _ = run_tool_rich(name, args)
    return texto
