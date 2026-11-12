"""O cérebro da assistente: conversa com o Claude e modo offline inteligente."""
from __future__ import annotations

import datetime as dt
import os
import random
import re
import unicodedata
from typing import Any
from urllib.parse import quote_plus

from . import skills

MAX_HISTORICO = 24
MAX_VOLTAS_FERRAMENTAS = 5

PERSONALIDADES = {
    "carinhosa": {
        "titulo": "Doce & Amigável",
        "instrucao": "Seja acolhedora, gentil, positiva e encorajadora como uma melhor amiga inteligente.",
        "saudacao": "Que bom falar com você!",
        "prefixo_ok": "Com carinho: ",
    },
    "jarvis": {
        "titulo": "Jarvis Elegante",
        "instrucao": (
            "Fale com elegância, sofisticação e precisão de uma IA futurista de laboratório "
            "estilo Jarvis, porém acolhedora e feminina."
        ),
        "saudacao": "Sistemas operacionais prontos às suas ordens.",
        "prefixo_ok": "À sua disposição. ",
    },
    "divertida": {
        "titulo": "Divertida & Espirituosa",
        "instrucao": "Tenha humor leve, energia contagiante, respostas criativas e animadas.",
        "saudacao": "Eba, cheguei! Bora fazer acontecer!",
        "prefixo_ok": "Missão cumprida! ",
    },
    "estudos": {
        "titulo": "Foco & Estudos",
        "instrucao": "Seja clara, organizada, motivadora para estudos e produtividade sem perder a simpatia.",
        "saudacao": "Modo foco ativado. Vamos organizar suas metas?",
        "prefixo_ok": "Anotado no plano: ",
    },
}


def _sem_acentos(texto: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", texto)
        if unicodedata.category(c) != "Mn"
    )


def _resolver_config(config: dict[str, Any] | None) -> dict[str, str]:
    cfg = config or {}
    assistente = str(
        cfg.get("assistantName") or os.getenv("PINK_ASSISTANT_NAME", "Pink")
    ).strip() or "Pink"
    usuario = str(
        cfg.get("userName") or os.getenv("PINK_USER_NAME", "")
    ).strip()
    personalidade = str(
        cfg.get("personality") or os.getenv("PINK_PERSONALITY", "carinhosa")
    ).strip().lower()
    if personalidade not in PERSONALIDADES:
        personalidade = "carinhosa"
    cidade = str(
        cfg.get("city") or os.getenv("PINK_CITY", "Curitiba")
    ).strip() or "Curitiba"
    return {
        "assistant_name": assistente[:24],
        "user_name": usuario[:30],
        "personality": personalidade,
        "city": cidade[:40],
    }


def _prompt_sistema(cfg: dict[str, str]) -> str:
    nome_ia = cfg["assistant_name"]
    nome_user = cfg["user_name"]
    pers = PERSONALIDADES[cfg["personality"]]
    quem = f"A usuária se chama {nome_user}. " if nome_user else ""
    return (
        f"Você é {nome_ia}, uma assistente pessoal por voz feminina estilo Jarvis, "
        "inspirada em ficção científica moderna. "
        f"{pers['instrucao']} "
        f"{quem}"
        f"A cidade padrão configurada é {cfg['city']}. "
        "Responda sempre em português do Brasil. Suas respostas serão LIDAS EM VOZ ALTA: "
        "use frases curtas e naturais, sem markdown, sem listas com asteriscos, sem emojis e sem símbolos. "
        "Quando pedirem previsão do tempo, lembretes, timer de estudos, cálculos, abrir sites/apps, "
        "hora, status do computador, piadas, curiosidades ou trocar nome/tema/personalidade, "
        "use as ferramentas disponíveis em vez de apenas explicar. "
        "Depois de usar uma ferramenta, confirme em uma frase natural. "
        "Se não souber algo, diga com sinceridade."
    )


class Brain:
    def __init__(self) -> None:
        self.historico: list[dict] = []
        self.modelo = os.getenv("PINK_MODEL", "claude-sonnet-5-5")
        self.client = None
        if os.getenv("ANTHROPIC_API_KEY", "").strip():
            import anthropic
            self.client = anthropic.Anthropic()

    @property
    def conectada(self) -> bool:
        return self.client is not None

    def limpar(self) -> None:
        self.historico.clear()

    # ---- resposta principal ---------------------------------------------
    def responder(self, texto: str, config: dict[str, Any] | None = None) -> dict:
        texto = texto.strip()
        if not texto:
            return {
                "text": "Não ouvi nada. Pode repetir?",
                "actions": [],
                "client_actions": [],
            }
        cfg = _resolver_config(config)
        if self.client is None:
            return self._modo_local(texto, cfg)
        try:
            return self._modo_claude(texto, cfg)
        except Exception as erro:  # rede, chave inválida, limite...
            return {
                "text": (
                    "Tive um problema para falar com meu cérebro online. "
                    "Confira sua chave e sua conexão."
                ),
                "actions": [],
                "client_actions": [],
                "error": type(erro).__name__,
            }

    def _modo_claude(self, texto: str, cfg: dict[str, str]) -> dict:
        mensagens = self.historico[-MAX_HISTORICO:] + [{"role": "user", "content": texto}]
        acoes: list[str] = []
        client_actions: list[dict] = []
        resposta_final = ""

        for _ in range(MAX_VOLTAS_FERRAMENTAS):
            resp = self.client.messages.create(
                model=self.modelo,
                max_tokens=700,
                system=_prompt_sistema(cfg),
                tools=skills.TOOLS,
                messages=mensagens,
            )
            resposta_final = "".join(b.text for b in resp.content if b.type == "text").strip()
            if resp.stop_reason != "tool_use":
                break
            mensagens.append({"role": "assistant", "content": resp.content})
            resultados = []
            for bloco in resp.content:
                if bloco.type == "tool_use":
                    saida, c_acoes = skills.run_tool_rich(bloco.name, bloco.input)
                    client_actions.extend(c_acoes)
                    if bloco.name not in (
                        "get_time", "system_status", "calculate",
                        "list_tasks", "tell_joke", "tell_curiosity", "motivate",
                    ):
                        acoes.append(saida)
                    resultados.append({
                        "type": "tool_result",
                        "tool_use_id": bloco.id,
                        "content": saida,
                    })
            mensagens.append({"role": "user", "content": resultados})

        resposta_final = resposta_final or "Pronto!"
        self.historico.append({"role": "user", "content": texto})
        self.historico.append({"role": "assistant", "content": resposta_final})
        self.historico = self.historico[-MAX_HISTORICO:]
        return {
            "text": resposta_final,
            "actions": acoes,
            "client_actions": client_actions,
        }

    # ---- modo offline inteligente ---------------------------------------
    def _modo_local(self, texto: str, cfg: dict[str, str]) -> dict:
        nome_ia = cfg["assistant_name"]
        nome_user = cfg["user_name"]
        pers = PERSONALIDADES[cfg["personality"]]
        chamado = f", {nome_user}" if nome_user else ""

        nomes_wake = {re.escape(nome_ia.lower()), "pink"}
        padrao_wake = "|".join(sorted(nomes_wake, key=len, reverse=True))

        bruto = texto.strip()
        low = bruto.lower()

        # Só chamou pelo nome
        if re.fullmatch(rf"(?:ei|oi|olá|ola|ok|hey)?\s*(?:{padrao_wake})[!?. ]*", low):
            if cfg["personality"] == "jarvis":
                resp = f"Às suas ordens{chamado}. Em que posso ajudar?"
            elif cfg["personality"] == "divertida":
                resp = f"Oiê{chamado}! Tô aqui ligadíssima, manda ver!"
            else:
                resp = f"Pois não{chamado}? Estou te ouvindo."
            return {"text": resp, "actions": [], "client_actions": []}

        # Remove vocativo inicial quando há comando depois (ex: "Pink, que horas são?")
        t = re.sub(
            rf"^\s*(?:(?:ei|ok|hey)\s+)?(?:{padrao_wake})[,!.: ]+\s*",
            "",
            low,
        ).strip()
        t_orig = re.sub(
            rf"^\s*(?:(?:ei|ok|hey)\s+)?(?:{padrao_wake})[,!.: ]+\s*",
            "",
            bruto,
            flags=re.IGNORECASE,
        ).strip()
        # Também remove "oi pink, ..." mantendo "oi" se não houver mais nada além de saudação
        m_oi_wake = re.match(
            rf"^\s*(?:oi|olá|ola)\s+(?:{padrao_wake})[,!.: ]+(.+)$",
            low,
        )
        if m_oi_wake:
            t = m_oi_wake.group(1).strip()
            t_orig = re.sub(
                rf"^\s*(?:oi|olá|ola)\s+(?:{padrao_wake})[,!.: ]+",
                "",
                bruto,
                flags=re.IGNORECASE,
            ).strip()
        else:
            # Remove saudação curta antes de outro pedido (ex: "Oi, que horas são?")
            m_oi_cmd = re.match(r"^\s*(?:oi+|ol[aá]|hey|oie+)[,!. ]+\s*(.+)$", t)
            if m_oi_cmd and len(m_oi_cmd.group(1).strip()) > 2:
                t = m_oi_cmd.group(1).strip()
                t_orig = re.sub(
                    r"^\s*(?:oi+|ol[aá]|hey|oie+)[,!. ]+\s*",
                    "",
                    t_orig,
                    flags=re.IGNORECASE,
                ).strip()

        t_norm = _sem_acentos(t)

        # 1) Personalização por voz ou texto
        resp_pers = self._tentar_personalizacao(t_norm, t_orig, cfg)
        if resp_pers is not None:
            return resp_pers

        # 2) Timer / Pomodoro
        resp_timer = self._tentar_timer(t_norm, t_orig)
        if resp_timer is not None:
            return resp_timer

        # 3) Lembretes e Tarefas
        resp_tarefas = self._tentar_tarefas(t_norm, t_orig)
        if resp_tarefas is not None:
            return resp_tarefas

        # 4) Previsão do tempo
        resp_clima = self._tentar_clima(t_norm, t_orig, cfg)
        if resp_clima is not None:
            return resp_clima

        # 5) Hora e Data
        if re.search(r"que horas|que hora\b|\bhoras sao\b|\bque dia e hoje\b|\bqual a data\b|\bdata de hoje\b", t_norm):
            return {"text": skills.get_time(), "actions": [], "client_actions": []}

        # 6) Diagnóstico do computador
        if re.search(r"\bstatus\b|computador|bateria|memoria|\bprocessador\b|\bcpu\b|\bdisco\b", t_norm):
            return {"text": skills.system_status(), "actions": [], "client_actions": []}

        # 7) Calculadora
        resp_calc = self._tentar_calculo(t_norm, t_orig)
        if resp_calc is not None:
            return resp_calc

        # 8) Piadas, curiosidades, motivação, sorteios
        if re.search(r"\bpiada\b|me faz rir|conta algo engracado", t_norm):
            return {"text": skills.tell_joke(), "actions": [], "client_actions": []}

        if re.search(r"curiosidade|fato curioso|me surpreenda|sabia que", t_norm):
            return {"text": skills.tell_curiosity(), "actions": [], "client_actions": []}

        if re.search(r"motivac|motiva|desanimad|conselho|elogio|me elogia|inspir", t_norm):
            return {"text": skills.motivate(), "actions": [], "client_actions": []}

        if re.search(r"cara ou coroa|joga.*moeda|lanca.*moeda", t_norm):
            return {"text": skills.flip_coin(), "actions": [], "client_actions": []}

        m_dado = re.search(r"(?:rola|joga).*dado(?:\s+de\s+(\d+))?", t_norm)
        if m_dado:
            lados = int(m_dado.group(1)) if m_dado.group(1) else 6
            return {"text": skills.roll_dice(lados), "actions": [], "client_actions": []}

        m_escolha = re.match(r"^(?:escolhe|decide|prefere)\s+(?:entre\s+)?(.+?)\s+ou\s+(.+?)[\?!.]*$", t_orig, re.I)
        if m_escolha:
            op1, op2 = m_escolha.group(1).strip(), m_escolha.group(2).strip()
            vencedora = random.choice([op1, op2])
            return {
                "text": f"Entre {op1} e {op2}, eu escolheria {vencedora}!",
                "actions": [],
                "client_actions": [],
            }

        # 9) Pesquisar na web
        m_busca = re.match(
            r"^(?:pesquis[ae]r?|busc[ae]r?|procur[ae]r?)\s+(?:por\s+|no google\s+)?(.+)",
            t_orig,
            re.I,
        )
        if m_busca:
            consulta = m_busca.group(1).strip()
            msg = skills.search_web(consulta)
            url = "https://www.google.com/search?q=" + quote_plus(consulta)
            return {
                "text": msg,
                "actions": [msg],
                "client_actions": [{"type": "open_url", "url": url, "label": f"Ver busca: {consulta}"}],
            }

        # 10) Abrir site ou aplicativo
        m_abrir = re.match(r"^(?:abr[ei]r?|abra)\s+(?:o\s+|a\s+|os\s+|as\s+)?(.+)", t_orig, re.I)
        if m_abrir:
            alvo = m_abrir.group(1).strip().rstrip(".!?")
            chave = alvo.lower()
            if chave in skills.SITES or "." in chave:
                msg = skills.open_website(alvo)
                url, host = skills.build_website_url(alvo)
                c_acoes = [{"type": "open_url", "url": url, "label": f"Abrir {host}"}] if url else []
                return {"text": msg, "actions": [msg], "client_actions": c_acoes}
            msg = skills.open_app(alvo)
            return {"text": msg, "actions": [msg], "client_actions": []}

        # 11) Conversa natural e ajuda
        resp_chat = self._conversa_basica(t_norm, cfg, pers)
        if resp_chat is not None:
            return {"text": resp_chat, "actions": [], "client_actions": []}

        return {
            "text": (
                f"Ainda não sei responder isso livremente sem uma chave da API no arquivo .env{chamado}, "
                "mas já posso ver a hora, previsão do tempo, seus lembretes, iniciar um timer de estudos, "
                "fazer contas, contar curiosidades ou abrir sites. Quer tentar um desses?"
            ),
            "actions": [],
            "client_actions": [],
        }

    # ---- sub-parsers do modo local --------------------------------------

    def _tentar_personalizacao(self, t_norm: str, t_orig: str, cfg: dict[str, str]) -> dict | None:
        m_ia = re.search(
            r"(?:mud[ae]r?\s+(?:o\s+)?seu\s+nome\s+para|agora\s+voce\s+se\s+chama|seu\s+novo\s+nome\s+e|te\s+chamar\s+de)\s+([a-zA-ZÀ-ÿ0-9_-]{2,24})",
            t_orig,
            re.I,
        )
        if m_ia:
            novo_nome = m_ia.group(1).strip().capitalize()
            return {
                "text": f"Adorei! A partir de agora pode me chamar de {novo_nome}.",
                "actions": [f"Nome alterado para {novo_nome}"],
                "client_actions": [{"type": "set_pref", "key": "assistantName", "value": novo_nome}],
            }

        m_user = re.search(
            r"(?:meu\s+nome\s+e|pode\s+me\s+chamar\s+de|me\s+chamo)\s+([a-zA-ZÀ-ÿ ]{2,24})",
            t_orig,
            re.I,
        )
        if m_user:
            unome = m_user.group(1).strip().rstrip(".!?").title()
            return {
                "text": f"Prazer, {unome}! Vou lembrar de te chamar assim.",
                "actions": [f"Seu nome: {unome}"],
                "client_actions": [{"type": "set_pref", "key": "userName", "value": unome}],
            }

        temas = [
            (r"rose\s*gold|dourad|cobre", "rose-gold", "Rose Gold"),
            (r"lilas|roxo|lavanda|galax", "lilas-galaxy", "Lilás Galáxia"),
            (r"cereja|cyber|escuro|noturno|dark", "cereja-cyber", "Cereja Cyber"),
            (r"rosa\s*neon|rosa\s*classico|tema\s*rosa|cor\s*rosa", "rosa-neon", "Rosa Neon"),
        ]
        if re.search(r"tema|paleta|cor|modo\s+escuro|visual", t_norm):
            for padrao, codigo, titulo in temas:
                if re.search(padrao, t_norm):
                    return {
                        "text": f"Mudei o visual para {titulo}. Ficou um arraso!",
                        "actions": [f"Tema: {titulo}"],
                        "client_actions": [{"type": "set_pref", "key": "theme", "value": codigo}],
                    }

        modos = [
            (r"\bjarvis\b|elegante", "jarvis", "Jarvis Elegante"),
            (r"divertida|animada|engracada", "divertida", "Divertida"),
            (r"estudos?|foco|produtiv", "estudos", "Foco & Estudos"),
            (r"carinhosa|doce|amigavel", "carinhosa", "Doce & Amigável"),
        ]
        if re.search(r"personalidade|jeito|modo\s+(?:jarvis|divertida|estudos|carinhosa|elegante|doce)", t_norm):
            for padrao, codigo, titulo in modos:
                if re.search(padrao, t_norm):
                    return {
                        "text": f"Personalidade ajustada para {titulo}.",
                        "actions": [f"Modo: {titulo}"],
                        "client_actions": [{"type": "set_pref", "key": "personality", "value": codigo}],
                    }

        if re.search(r"holograma|orbe", t_norm):
            if "estelar" in t_norm or "estrela" in t_norm:
                return {
                    "text": "Ativei o holograma estelar com partículas brilhantes!",
                    "actions": ["Holograma: Estelar"],
                    "client_actions": [{"type": "set_pref", "key": "orbStyle", "value": "estelar"}],
                }
            if "cristal" in t_norm or "hexag" in t_norm or "jarvis" in t_norm:
                return {
                    "text": "Ativei o holograma Cristal Jarvis!",
                    "actions": ["Holograma: Cristal Jarvis"],
                    "client_actions": [{"type": "set_pref", "key": "orbStyle", "value": "cristal"}],
                }
            if "orbital" in t_norm or "classico" in t_norm:
                return {
                    "text": "Voltei para o holograma Orbital clássico.",
                    "actions": ["Holograma: Orbital"],
                    "client_actions": [{"type": "set_pref", "key": "orbStyle", "value": "orbital"}],
                }

        return None

    def _tentar_timer(self, t_norm: str, t_orig: str) -> dict | None:
        if re.search(r"(?:parar?|cancelar?|desligar?)\s+(?:o\s+)?(?:timer|cronometro|pomodoro)", t_norm):
            msg, c_acao = skills.stop_timer()
            return {"text": msg, "actions": [msg], "client_actions": [c_acao]}

        if re.search(r"\bpomodoro\b", t_norm):
            m_min = re.search(r"(\d+(?:[.,]\d+)?)\s*(?:min|minutos?)", t_norm)
            mins = float(m_min.group(1).replace(",", ".")) if m_min else 25.0
            msg, c_acao = skills.start_timer(mins, "Pomodoro")
            return {"text": msg, "actions": [msg], "client_actions": [c_acao] if c_acao else []}

        m_timer = re.search(
            r"(?:timer|cronometro|temporizador|alarme|pausa|contagem(?:\s+regressiva)?)"
            r"(?:\s+(?:de|para|em))?\s+(\d+(?:[.,]\d+)?)\s*(segundos?|seg|s|minutos?|min|m|horas?|h)\b"
            r"(?:\s+(?:para|de)\s+(.+))?",
            t_norm,
        )
        if not m_timer:
            m_timer = re.search(
                r"(?:marca|coloca|inicia|comeca|ativa)\s+(?:um\s+)?(?:timer|cronometro|pausa)?\s*(?:de\s+)?"
                r"(\d+(?:[.,]\d+)?)\s*(segundos?|seg|minutos?|min|horas?|h)\b"
                r"(?:\s+(?:para|de)\s+(.+))?",
                t_norm,
            )
        if m_timer:
            qtd = float(m_timer.group(1).replace(",", "."))
            unidade = m_timer.group(2)
            if unidade.startswith(("s", "seg")):
                mins = qtd / 60.0
            elif unidade.startswith("h"):
                mins = qtd * 60.0
            else:
                mins = qtd
            rotulo = "Pausa" if "pausa" in t_norm else (m_timer.group(3) or "Estudos")
            rotulo = rotulo.strip().capitalize()[:30]
            msg, c_acao = skills.start_timer(mins, rotulo)
            return {
                "text": msg,
                "actions": [msg] if c_acao else [],
                "client_actions": [c_acao] if c_acao else [],
            }

        return None

    def _tentar_tarefas(self, t_norm: str, t_orig: str) -> dict | None:
        if re.search(r"(?:limp[ae]r?|apag[ae]r?\s+todas?)\s+(?:as\s+|os\s+)?(?:tarefas?\s+concluid|concluid|lembretes|tarefas|lista)", t_norm):
            apenas_feitas = "concluid" in t_norm
            msg, c_acao = skills.clear_tasks(only_done=apenas_feitas)
            return {"text": msg, "actions": [msg], "client_actions": [c_acao]}

        m_add = re.match(
            r"^(?:anot[ae]r?|lembr[ae]r?(?:\s+de)?|me\s+lembr[ae]r?(?:\s+de)?|"
            r"adicion[ae]r?(?:\s+(?:tarefa|lembrete|na\s+lista))?|"
            r"coloc[ae]r?\s+na\s+lista(?:\s+de\s+tarefas)?)\s*[:\-]?\s*(.+)",
            t_orig,
            re.I,
        )
        if m_add:
            item = m_add.group(1).strip().rstrip(".")
            msg, c_acao = skills.add_task(item)
            return {
                "text": msg,
                "actions": [msg] if c_acao else [],
                "client_actions": [c_acao] if c_acao else [],
            }

        if re.search(
            r"(?:quais\s+(?:sao\s+)?(?:os\s+|meus\s+)?(?:lembretes|tarefas)|"
            r"minha\s+lista(?:\s+de\s+tarefas)?|ver\s+(?:lembretes|tarefas)|"
            r"o\s+que\s+(?:eu\s+)?tenho\s+(?:para|pra)\s+fazer)",
            t_norm,
        ):
            return {"text": skills.list_tasks(), "actions": [], "client_actions": []}

        m_done = re.match(
            r"^(?:conclu[ir]{1,2}|finaliz[ae]r?|complet[ae]r?|marc[ae]r?\s+como\s+(?:feita?|concluid[ao])|terminei(?:\s+a|\s+o)?)\s*"
            r"(?:a\s+|o\s+)?(?:tarefa|lembrete)?\s*(.+)",
            t_orig,
            re.I,
        )
        if m_done:
            ref = m_done.group(1).strip().rstrip(".!?")
            msg, c_acao = skills.complete_task(ref)
            return {
                "text": msg,
                "actions": [msg] if c_acao else [],
                "client_actions": [c_acao] if c_acao else [],
            }

        m_del = re.match(
            r"^(?:apag[ae]r?|remov[ae]r?|exclu[ir]{1,2}|tir[ae]r?)\s*(?:o\s+|a\s+)?(?:tarefa|lembrete)\s+(.+)",
            t_orig,
            re.I,
        )
        if m_del:
            ref = m_del.group(1).strip().rstrip(".!?")
            msg, c_acao = skills.delete_task(ref)
            return {
                "text": msg,
                "actions": [msg] if c_acao else [],
                "client_actions": [c_acao] if c_acao else [],
            }

        return None

    def _tentar_clima(self, t_norm: str, t_orig: str, cfg: dict[str, str]) -> dict | None:
        if not re.search(
            r"(?:previsao\s+do\s+tempo|como\s+esta\s+o\s+tempo|\bclima\b|\btemperatura\b|vai\s+chover|esta\s+chovendo|fazendo\s+calor|fazendo\s+frio)",
            t_norm,
        ):
            return None
        m_cidade = re.search(
            r"(?:\bem\b|\bno\b|\bna\b|\bde\b|\bpara\b)\s+([a-zA-ZÀ-ÿ][a-zA-ZÀ-ÿ\s-]{1,35})[\?!.]*$",
            t_orig,
            re.I,
        )
        cidade = m_cidade.group(1).strip() if m_cidade else cfg["city"]
        # Evita capturar palavras como "hoje" ou "agora" como cidade
        if _sem_acentos(cidade.lower()) in ("hoje", "agora", "amanha", "tempo", "momento"):
            cidade = cfg["city"]
        texto, c_acao = skills.get_weather(cidade)
        return {
            "text": texto,
            "actions": [],
            "client_actions": [c_acao] if c_acao else [],
        }

    def _tentar_calculo(self, t_norm: str, t_orig: str) -> dict | None:
        m_calc = re.match(
            r"^(?:quanto\s+(?:[eé]|d[aá]|s[aã]o|vale)|calcul[ae]r?(?:\s+quanto\s+[eé])?|fa[cz]a?\s+a\s+conta(?:\s+de)?)\s+(.+)",
            t_norm,
            re.I,
        )
        if m_calc:
            msg = skills.calculate(m_calc.group(1))
            return {"text": msg, "actions": [], "client_actions": []}
        if re.fullmatch(r"[\d\s.,+\-*/()%^×÷]+", t_orig) and re.search(r"[+\-*/%^×÷]", t_orig):
            msg = skills.calculate(t_orig)
            return {"text": msg, "actions": [], "client_actions": []}
        m_pct = re.search(r"(\d+(?:[.,]\d+)?\s*%\s*de\s*\d+(?:[.,]\d+)?)", t_norm)
        if m_pct:
            msg = skills.calculate(m_pct.group(1))
            return {"text": msg, "actions": [], "client_actions": []}
        m_raiz = re.search(r"(raiz\s+(?:quadrada\s+)?de\s+\d+(?:[.,]\d+)?)", t_norm)
        if m_raiz:
            msg = skills.calculate(m_raiz.group(1))
            return {"text": msg, "actions": [], "client_actions": []}
        return None

    def _conversa_basica(
        self, t_norm: str, cfg: dict[str, str], pers: dict[str, str]
    ) -> str | None:
        nome_ia = cfg["assistant_name"]
        nome_user = cfg["user_name"]
        chamado = f", {nome_user}" if nome_user else ""
        hora = dt.datetime.now().hour

        if re.search(r"o\s+que\s+(?:voce\s+)?(?:sabe|pode|consegue)\s+fazer|\bajuda\b|\bcomandos\b", t_norm):
            return (
                "Você pode me pedir a hora, a previsão do tempo, o status do computador, "
                "contas matemáticas, lembretes e lista de tarefas, um timer Pomodoro, "
                "piadas, curiosidades, ou para abrir sites como YouTube e Spotify. "
                "Também dá para dizer: muda seu nome para Aurora, ou tema lilás!"
            )

        if re.search(r"quem\s+e\s+voce|qual\s+(?:o\s+)?seu\s+nome|voce\s+e\s+(?:o\s+)?jarvis|o\s+que\s+voce\s+e", t_norm):
            return (
                f"Eu sou a {nome_ia}, sua assistente pessoal por voz inspirada no Jarvis! "
                "Posso conferir seu computador, cuidar dos seus lembretes, controlar timers de estudo, "
                "ver o clima e personalizar meu visual do seu jeitinho."
            )

        if re.search(r"tudo\s+bem|como\s+(?:voce\s+)?esta|como\s+vai", t_norm):
            if cfg["personality"] == "jarvis":
                return f"Todos os meus sistemas estão em cem por cento{chamado}! E com você?"
            return f"Estou ótima{chamado}, pronta para te ajudar no que precisar! E você?"

        if re.search(r"^(?:oi+|ola+|e ai|hey|oie+|hello)\b", t_norm):
            return f"Oi{chamado}! Eu sou a {nome_ia}. {pers['saudacao']}"

        if re.search(r"^bom\s+dia\b", t_norm):
            return f"Bom dia{chamado}! {pers['saudacao']}"

        if re.search(r"^boa\s+tarde\b", t_norm):
            return f"Boa tarde{chamado}! {pers['saudacao']}"

        if re.search(r"^boa\s+noite\b", t_norm):
            return f"Boa noite{chamado}! Como posso deixar sua noite mais tranquila?"

        if re.search(r"obrigad[ao]|valeu|brigad[ao]|agradecid[ao]", t_norm):
            if cfg["personality"] == "jarvis":
                return f"Sempre às ordens{chamado}."
            if cfg["personality"] == "divertida":
                return f"Imagina{chamado}, tô aqui pra isso! Mandou bem!"
            return f"De nada{chamado}! Sempre que precisar, é só me chamar."

        if re.search(r"\btchau\b|ate\s+logo|ate\s+mais|ate\s+amanha", t_norm):
            sufixo = "boa noite" if hora >= 18 else "ótimo dia"
            return f"Até logo{chamado}! Tenha um {sufixo} e conta comigo quando voltar."

        return None
