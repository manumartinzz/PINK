"""Pink: assistente pessoal por voz estilo Jarvis com interface personalizável.

Execute com:  python app.py
"""
import argparse
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
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0
cerebro = Brain()
skills.system_info()  # aquece o medidor de CPU


@app.get("/")
def inicio():
    return send_from_directory(app.static_folder, "index.html")


@app.get("/api/config")
def config():
    return jsonify({
        "nome": os.getenv("PINK_USER_NAME", "").strip(),
        "assistente": os.getenv("PINK_ASSISTANT_NAME", "Pink").strip() or "Pink",
        "personalidade": os.getenv("PINK_PERSONALITY", "carinhosa").strip() or "carinhosa",
        "cidade": os.getenv("PINK_CITY", "Curitiba").strip() or "Curitiba",
        "online": cerebro.conectada,
    })


@app.get("/api/status")
def status():
    return jsonify(skills.system_info())


@app.post("/api/chat")
def chat():
    dados = request.get_json(silent=True) or {}
    mensagem = str(dados.get("message", ""))[:2000]
    cfg = dados.get("config") if isinstance(dados.get("config"), dict) else None
    return jsonify(cerebro.responder(mensagem, config=cfg))


@app.post("/api/reset")
def reset():
    cerebro.limpar()
    return jsonify({"ok": True})


@app.get("/api/tasks")
def listar_tarefas():
    return jsonify({"tasks": skills.get_tasks_list()})


@app.post("/api/tasks")
def adicionar_tarefa():
    dados = request.get_json(silent=True) or {}
    texto = str(dados.get("text", "")).strip()[:200]
    if not texto:
        return jsonify({"error": "Texto vazio", "tasks": skills.get_tasks_list()}), 400
    msg, _ = skills.add_task(texto)
    return jsonify({"message": msg, "tasks": skills.get_tasks_list()})


@app.patch("/api/tasks/<int:task_id>")
def alternar_tarefa(task_id: int):
    tarefas = skills.toggle_task(task_id)
    return jsonify({"tasks": tarefas})


@app.delete("/api/tasks/<int:task_id>")
def remover_tarefa(task_id: int):
    tarefas = skills.delete_task_by_id(task_id)
    return jsonify({"tasks": tarefas})


@app.delete("/api/tasks")
def limpar_tarefas():
    apenas_feitas = request.args.get("scope") == "done"
    msg, _ = skills.clear_tasks(only_done=apenas_feitas)
    return jsonify({"message": msg, "tasks": skills.get_tasks_list()})


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Inicia o servidor da assistente Pink.")
    parser.add_argument("--host", default=os.getenv("PINK_HOST", "127.0.0.1"))
    parser.add_argument("--port", type=int, default=int(os.getenv("PINK_PORT", "8765")))
    parser.add_argument(
        "--no-browser",
        action="store_true",
        default=os.getenv("PINK_NO_BROWSER", "").strip().lower() in ("1", "true", "yes"),
    )
    parser.add_argument(
        "--autopalmas",
        action="store_true",
        default=os.getenv("PINK_AUTOPALMAS", "").strip().lower() in ("1", "true", "yes"),
    )
    args = parser.parse_args()

    url = f"http://{args.host}:{args.port}"
    print(f"\n  Pink no ar em {url}")
    print("  Use o Chrome ou o Edge para ter reconhecimento de voz.\n")
    if not args.no_browser and args.host in ("127.0.0.1", "localhost"):
        destino = f"http://127.0.0.1:{args.port}/" + ("?autopalmas=1" if args.autopalmas else "")
        threading.Timer(1.0, lambda: webbrowser.open(destino)).start()
    app.run(host=args.host, port=args.port, debug=False)
