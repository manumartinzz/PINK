# Pink — Assistente Pessoal Estilo Jarvis

Uma assistente pessoal por voz inspirada no **Jarvis** do Homem de Ferro, com **HUD holográfico futurista**, **voz de amiga**, **pesquisa real na web** e funcionamento tanto **direto no navegador (GitHub Pages)** quanto **local no computador com Python** (com suporte opcional à API do Claude).

🌐 **Versão Web (GitHub Pages):** https://manumartinzz.github.io/PINK/

## O que ela faz

- **Acesso à Web e Pesquisas**: pergunte *"Pesquisa sobre buracos negros"*, *"Quem foi Ada Lovelace?"* ou qualquer assunto — ela busca na Wikipédia PT-BR e DuckDuckGo, lê a resposta em voz alta e entrega links diretos.
- **Voz de Amiga & Personalidade**: seleção inteligente de vozes naturais em português (dica: o Microsoft Edge traz vozes *Online Natural* bem humanas), presets de voz (*Voz de Amiga*, *Suave & Calma*, *Animada*), troca de nome (`Pink`, `Aurora`, `Luna`, `Vênus`, `Íris`, `Stella`), 4 paletas futuristas (*Rosa Futuro HUD*, *Rosa Neon*, *Rose Gold*, *Lilás Galáxia*) e holograma 3D (*Cristal Jarvis*, *Estelar*, *Orbital*).
- **Acordar com 2 Palmas (com sensibilidade ajustável)**: detector calibrado com feedback visual já na 1ª palma e recuperação automática se o notebook voltar da suspensão.
- **Previsão do tempo**: *"Como está o tempo?"* ou *"Vai chover em São Paulo?"*.
- **Lembretes & Tarefas**: *"Anota revisar biologia"*, *"Quais são meus lembretes?"*, *"Concluir tarefa 1"*.
- **Timer de Estudos / Pomodoro**: *"Inicia um pomodoro"* ou *"Timer de 15 minutos"*.
- **Calculadora segura**, **diagnóstico do computador** (CPU, RAM, disco e bateria), **piadas**, **curiosidades** e **abertura de sites**.

## Acordar com 2 palmas ao abrir o computador (Windows)

Por segurança, sites abertos em abas comuns de navegador precisam de um clique ou permissão prévia antes de tocar áudio. Para abrir o PC e já chamar a Pink **batendo 2 palmas sem clicar em nada**:

1. Baixe este projeto no seu computador (botão verde **Code → Download ZIP** no GitHub e extraia a pasta).
2. Dê dois cliques em **`instalar_autostart.bat`** (apenas na primeira vez).
3. Quando a janela abrir, clique em **Permitir ao visitar o site** no aviso do microfone (uma única vez).
4. Pronto! A partir daí, sempre que o Windows iniciar (ou se você deixar a janela aberta ao suspender o notebook), ela já estará pronta esperando suas **2 palmas** em modo aplicativo com áudio liberado.

## Como rodar manualmente

### Linux / macOS
```bash
./iniciar.sh
```

### Windows
Dê dois cliques em `iniciar.bat` (ou `instalar_autostart.bat` para iniciar junto com o Windows).

### Linha de comando
```bash
python -m venv .venv
source .venv/bin/activate  # No Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python app.py
```

Acesse no navegador o endereço exibido no terminal (padrão `http://127.0.0.1:8765`).

> A chave `ANTHROPIC_API_KEY` no arquivo `.env` é opcional: sem ela, a Pink funciona com pesquisa web e habilidades locais gratuitamente. Com a chave configurada, você também conversa livremente com o Claude usando todas as ferramentas da assistente.

## Testes

```bash
node tests/test_palmas.js
node tests/test_local_brain.js
python -m unittest discover -s tests -v
```
