"""Pink: assistente pessoal por voz com interface rosa.

Execute com:  python app.py
"""
import os
import threading
import webbrowser
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory

load_dotenv()

from pink import skills  # noqa: E402
from pink.brain import Brain  # noqa: E402

RAIZ = Path(__file__).parent
app = Flask(__name__, static_folder=str(RAIZ / "web"), static_url_path="")
cerebro = Brain()
skills.system_info()  # aquece o medidor de CPU


@app.get("/")
def inicio():
    return send_from_directory(app.static_folder, "index.html")


@app.get("/api/config")
def config():
    return jsonify({
        "nome": os.getenv("PINK_USER_NAME", "").strip(),
        "online": cerebro.conectada,
    })


@app.get("/api/status")
def status():
    return jsonify(skills.system_info())


@app.post("/api/chat")
def chat():
    dados = request.get_json(silent=True) or {}
    mensagem = str(dados.get("message", ""))[:2000]
    return jsonify(cerebro.responder(mensagem))


@app.post("/api/reset")
def reset():
    cerebro.limpar()
    return jsonify({"ok": True})


if __name__ == "__main__":
    porta = int(os.getenv("PINK_PORT", "8765"))
    url = f"http://127.0.0.1:{porta}"
    print(f"\n  Pink no ar em {url}")
    print("  Use o Chrome ou o Edge para ter reconhecimento de voz.\n")
    threading.Timer(1.0, lambda: webbrowser.open(url)).start()
    # 127.0.0.1: só o seu computador consegue acessar a Pink.
    app.run(host="127.0.0.1", port=porta, debug=False)
