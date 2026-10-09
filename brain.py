"""O cérebro da Pink: conversa com o Claude e usa as habilidades locais."""
from __future__ import annotations

import os
import re

from . import skills

MAX_HISTORICO = 24
MAX_VOLTAS_FERRAMENTAS = 5


def _prompt_sistema() -> str:
    nome = os.getenv("PINK_USER_NAME", "").strip()
    quem = f"O usuário se chama {nome}. " if nome else ""
    return (
        "Você é a Pink, uma assistente pessoal por voz que vive no computador do usuário, "
        "no estilo de uma IA de filmes de ficção científica, mas simpática e direta. "
        f"{quem}"
        "Responda sempre em português do Brasil. Suas respostas serão LIDAS EM VOZ ALTA: "
        "use frases curtas e naturais, sem markdown, sem listas, sem emojis e sem símbolos. "
        "Quando o usuário pedir para abrir um site ou aplicativo, pesquisar algo, saber a hora "
        "ou o estado do computador, use as ferramentas disponíveis em vez de apenas explicar. "
        "Depois de usar uma ferramenta, confirme em uma frase. "
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
    def responder(self, texto: str) -> dict:
        texto = texto.strip()
        if not texto:
            return {"text": "Não ouvi nada. Pode repetir?", "actions": []}
        if self.client is None:
            return self._modo_local(texto)
        try:
            return self._modo_claude(texto)
        except Exception as erro:  # rede, chave inválida, limite...
            return {
                "text": "Tive um problema para falar com meu cérebro online. "
                        "Confira sua chave e sua conexão.",
                "actions": [],
                "error": type(erro).__name__,
            }

    def _modo_claude(self, texto: str) -> dict:
        mensagens = self.historico[-MAX_HISTORICO:] + [{"role": "user", "content": texto}]
        acoes: list[str] = []
        resposta_final = ""

        for _ in range(MAX_VOLTAS_FERRAMENTAS):
            resp = self.client.messages.create(
                model=self.modelo,
                max_tokens=700,
                system=_prompt_sistema(),
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
                    saida = skills.run_tool(bloco.name, bloco.input)
                    if bloco.name not in ("get_time", "system_status"):
                        acoes.append(saida)
                    resultados.append({
                        "type": "tool_result",
                        "tool_use_id": bloco.id,
                        "content": saida,
                    })
            mensagens.append({"role": "user", "content": resultados})

        resposta_final = resposta_final or "Pronto!"
        # Só guardamos a conversa em texto; as ferramentas valem apenas na rodada.
        self.historico.append({"role": "user", "content": texto})
        self.historico.append({"role": "assistant", "content": resposta_final})
        self.historico = self.historico[-MAX_HISTORICO:]
        return {"text": resposta_final, "actions": acoes}

    # ---- modo sem internet / sem chave ------------------------------------
    def _modo_local(self, texto: str) -> dict:
        t = re.sub(r"^\s*pink[,!. ]*", "", texto.lower()).strip()

        if re.search(r"que horas|\bhora\b|\bdata\b|que dia", t):
            return {"text": skills.get_time(), "actions": []}

        if re.search(r"status|computador|bateria|mem[óo]ria|processador|\bcpu\b", t):
            return {"text": skills.system_status(), "actions": []}

        m = re.match(r"(?:pesquis[ae]r?|busc[ae]r?|procur[ae]r?)\s+(?:por\s+)?(.+)", t)
        if m:
            msg = skills.search_web(m.group(1))
            return {"text": msg, "actions": [msg]}

        m = re.match(r"(?:abr[ei]r?|abra)\s+(?:o |a |os |as )?(.+)", t)
        if m:
            alvo = m.group(1).strip()
            if alvo in skills.SITES or "." in alvo:
                msg = skills.open_website(alvo)
            else:
                msg = skills.open_app(alvo)
            return {"text": msg, "actions": [msg]}

        return {
            "text": "Para conversar livremente comigo, coloque sua chave da API no arquivo .env. "
                    "Por enquanto eu entendo: que horas são, abrir um site ou app, "
                    "pesquisar algo e como está o computador.",
            "actions": [],
        }
