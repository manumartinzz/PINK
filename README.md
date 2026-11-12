# Pink — Assistente Pessoal Estilo Jarvis

Uma assistente pessoal por voz inspirada no **Jarvis** do Homem de Ferro, feita com visual feminino personalizável, holograma animado e funcionamento tanto **direto no navegador (GitHub Pages)** quanto **local no computador com Python** (com suporte opcional à API do Claude).

🌐 **Versão Web (GitHub Pages):** https://manumartinzz.github.io/PINK/

## O que ela faz

- **Identidade personalizável**: troque o nome dela (`Pink`, `Aurora`, `Luna`, `Vênus`, `Íris`, `Stella` ou o que quiser), escolha sua personalidade (*Doce & Amigável*, *Jarvis Elegante*, *Divertida*, *Foco & Estudos*), mude entre 4 paletas (*Rosa Neon*, *Rose Gold*, *Lilás Galáxia*, *Cereja Cyber*) e 3 estilos de holograma (*Orbital*, *Estelar*, *Cristal Jarvis*).
- **Voz, 2 Palmas & Sons futuristas**: reconhecimento de voz (Chrome/Edge), síntese de voz feminina em português, efeitos sonoros em Web Audio e despertar com **2 palmas**.
- **Previsão do tempo**: pergunte *"Como está o tempo?"* ou *"Vai chover em São Paulo?"*.
- **Lembretes & Tarefas**: diga *"Anota revisar biologia"*, *"Quais são meus lembretes?"*, *"Concluir tarefa 1"* ou gerencie direto no painel.
- **Timer de Estudos / Pomodoro**: diga *"Inicia um pomodoro"* ou *"Timer de 15 minutos"* com anel de progresso ao redor do holograma e alarme ao finalizar.
- **Calculadora segura**: *"Quanto é 15% de 200?"*, *"Raiz quadrada de 144"*.
- **Diagnóstico do computador**: CPU, memória, disco e bateria em tempo real.
- **Diversão e inspiração**: piadas, curiosidades (incluindo mulheres na ciência), frases motivacionais, cara ou coroa e abertura rápida de sites/pesquisas.

## Como rodar

### Linux / macOS
```bash
./iniciar.sh
```

### Windows
Dê dois cliques em `iniciar.bat`.

### Manualmente
```bash
python -m venv .venv
source .venv/bin/activate  # No Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python app.py
```

Acesse no navegador o endereço exibido no terminal (padrão `http://127.0.0.1:8765`).

> A chave `ANTHROPIC_API_KEY` no arquivo `.env` é opcional: sem ela, a Pink funciona com seu modo offline inteligente. Com a chave configurada, você conversa livremente com o Claude usando todas as ferramentas da assistente.

## Testes

```bash
node tests/test_palmas.js
python -m unittest discover -s tests -v
```
