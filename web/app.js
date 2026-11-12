/* Pink — interface, voz, holograma e poderes estilo Jarvis */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const el = {
    brand: $("brand"),
    status: $("status"),
    legenda: $("legenda"),
    log: $("log"),
    texto: $("texto"),
    form: $("composer"),
    mic: $("btnMic"),
    voz: $("btnVoz"),
    sons: $("btnSons"),
    chamar: $("btnChamar"),
    palmas: $("btnPalmas"),
    personalizar: $("btnPersonalizar"),
    limpar: $("btnLimpar"),
    medidor: $("medidorBarra"),
    chips: $("chips"),
    orb: $("orb"),
    modoBadge: $("modoBadge"),
    // Timer
    timerDisplay: $("timerDisplay"),
    timerLabel: $("timerLabel"),
    btnTimerToggle: $("btnTimerToggle"),
    btnTimerReset: $("btnTimerReset"),
    orbTimerBadge: $("orbTimerBadge"),
    orbTimerText: $("orbTimerText"),
    orbTimerSub: $("orbTimerSub"),
    // Tarefas
    formTarefa: $("formTarefa"),
    inputTarefa: $("inputTarefa"),
    listaTarefas: $("listaTarefas"),
    tarefasVazio: $("tarefasVazio"),
    btnLimparFeitas: $("btnLimparFeitas"),
    // Modal
    modal: $("modalPersonalizar"),
    btnFecharModal: $("btnFecharModal"),
    btnSalvarModal: $("btnSalvarModal"),
    prefAssistente: $("prefAssistente"),
    prefUsuario: $("prefUsuario"),
    prefCidade: $("prefCidade"),
    prefVoz: $("prefVoz"),
    btnTestarVoz: $("btnTestarVoz"),
    nameSuggestions: $("nameSuggestions"),
    personalityGrid: $("personalityGrid"),
    themeGrid: $("themeGrid"),
    orbGrid: $("orbGrid"),
  };

  const TEMAS_ORB = {
    "rosa-neon": {
      glow: "rgba(255,111,180,.30)",
      ring1: "rgba(196,18,107,.55)",
      ring2: "rgba(255,61,154,.65)",
      ring3: "rgba(74,8,48,.32)",
      waveFill: "rgba(255,61,154,.22)",
      waveStroke: "rgba(255,61,154,.85)",
      core1: "#fff7fb",
      core2: "#ff9fd0",
      core3: "#e0136f",
      shadow: "rgba(255,61,154,.72)",
      particle: "rgba(255,255,255,.9)",
    },
    "rose-gold": {
      glow: "rgba(223,142,130,.32)",
      ring1: "rgba(142,53,64,.52)",
      ring2: "rgba(199,98,108,.64)",
      ring3: "rgba(92,38,44,.32)",
      waveFill: "rgba(199,98,108,.20)",
      waveStroke: "rgba(199,98,108,.86)",
      core1: "#fffaf7",
      core2: "#f5c6b8",
      core3: "#b85460",
      shadow: "rgba(199,98,108,.68)",
      particle: "rgba(255,244,238,.92)",
    },
    "lilas-galaxy": {
      glow: "rgba(178,110,255,.32)",
      ring1: "rgba(107,33,168,.55)",
      ring2: "rgba(147,51,234,.65)",
      ring3: "rgba(59,17,104,.34)",
      waveFill: "rgba(147,51,234,.20)",
      waveStroke: "rgba(147,51,234,.85)",
      core1: "#fcf8ff",
      core2: "#d8b4fe",
      core3: "#7e22ce",
      shadow: "rgba(147,51,234,.72)",
      particle: "rgba(243,232,255,.95)",
    },
    "cereja-cyber": {
      glow: "rgba(255,46,147,.36)",
      ring1: "rgba(255,133,200,.65)",
      ring2: "rgba(255,46,147,.82)",
      ring3: "rgba(166,227,255,.45)",
      waveFill: "rgba(255,46,147,.26)",
      waveStroke: "rgba(255,121,198,.95)",
      core1: "#fff5fb",
      core2: "#ff66b8",
      core3: "#b8005c",
      shadow: "rgba(255,46,147,.88)",
      particle: "rgba(166,227,255,.92)",
    },
  };

  const prefs = {
    assistantName: "Pink",
    userName: "",
    city: "Curitiba",
    personality: "carinhosa",
    theme: "rosa-neon",
    orbStyle: "estelar",
    voiceName: "",
    vozLigada: true,
    sonsLigados: true,
  };

  const estado = {
    fase: "idle", // idle | listening | thinking | speaking
    modoChamar: false,
    microfoneLigado: false,
    ocupada: false,
    online: false,
  };

  const rotulos = {
    idle: "Pronta",
    listening: "Ouvindo…",
    thinking: "Pensando…",
    speaking: "Falando…",
  };

  function carregarPrefsLocal() {
    try {
      const salvo = JSON.parse(localStorage.getItem("pink-prefs") || "{}");
      if (salvo && typeof salvo === "object") {
        Object.assign(prefs, salvo);
      }
    } catch (_) {}
  }

  function salvarPrefsLocal() {
    try {
      localStorage.setItem("pink-prefs", JSON.stringify(prefs));
    } catch (_) {}
  }

  function aplicarPreferencias() {
    const tema = TEMAS_ORB[prefs.theme] ? prefs.theme : "rosa-neon";
    prefs.theme = tema;
    document.documentElement.setAttribute("data-theme", tema);
    const nome = (prefs.assistantName || "Pink").trim() || "Pink";
    prefs.assistantName = nome;

    el.brand.textContent = nome;
    document.title = nome;
    el.texto.placeholder = `Escreva para a ${nome}`;
    el.voz.setAttribute("aria-pressed", String(prefs.vozLigada));
    el.sons.setAttribute("aria-pressed", String(prefs.sonsLigados));
    if (window.PinkSFX) window.PinkSFX.setEnabled(prefs.sonsLigados);

    // Sincroniza campos do modal
    el.prefAssistente.value = prefs.assistantName;
    el.prefUsuario.value = prefs.userName || "";
    el.prefCidade.value = prefs.city || "Curitiba";

    el.personalityGrid.querySelectorAll("[data-personality]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.personality === prefs.personality);
    });
    el.themeGrid.querySelectorAll("[data-theme-pick]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.themePick === prefs.theme);
    });
    el.orbGrid.querySelectorAll("[data-orb]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.orb === prefs.orbStyle);
    });
    if (el.prefVoz && prefs.voiceName) {
      el.prefVoz.value = prefs.voiceName;
    }
  }

  function definirFase(fase) {
    estado.fase = fase;
    el.status.textContent = rotulos[fase];
  }

  /* ---------- Conversa na tela ---------- */
  function adicionar(autor, texto, acoes = [], clientActions = []) {
    const div = document.createElement("div");
    div.className = "msg " + autor;
    const p = document.createElement("div");
    p.className = "msg-body";
    p.textContent = texto;
    div.appendChild(p);

    acoes.forEach((a) => {
      const s = document.createElement("span");
      s.className = "acao";
      s.textContent = a;
      div.appendChild(s);
    });

    renderizarLinks(div, clientActions);
    el.log.appendChild(div);
    el.log.scrollTop = el.log.scrollHeight;
    return div;
  }

  function renderizarLinks(container, clientActions) {
    (clientActions || []).forEach((acao) => {
      if (acao && acao.type === "open_url" && acao.url) {
        const link = document.createElement("a");
        link.className = "acao-link";
        link.href = acao.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = (acao.label || "Abrir link") + " ↗";
        container.appendChild(link);
      }
    });
  }

  /* ---------- Voz: falar ---------- */
  let vozPt = null;
  function listarVozes() {
    if (!window.speechSynthesis) return;
    const vozes = speechSynthesis.getVoices();
    const pts = vozes.filter((v) => /^pt/i.test(v.lang));
    const candidatas = pts.length ? pts : vozes;

    if (el.prefVoz) {
      const atual = prefs.voiceName || el.prefVoz.value;
      el.prefVoz.innerHTML = "";
      const optAuto = document.createElement("option");
      optAuto.value = "";
      optAuto.textContent = "Automática (feminina PT-BR)";
      el.prefVoz.appendChild(optAuto);

      candidatas.forEach((v) => {
        const opt = document.createElement("option");
        opt.value = v.name;
        opt.textContent = `${v.name} (${v.lang})`;
        el.prefVoz.appendChild(opt);
      });
      if (atual) el.prefVoz.value = atual;
    }

    vozPt =
      (prefs.voiceName && vozes.find((v) => v.name === prefs.voiceName)) ||
      vozes.find((v) => /pt[-_]BR/i.test(v.lang) && /female|feminin|maria|francisca|thalita|luciana|raquel|google/i.test(v.name)) ||
      vozes.find((v) => /pt[-_]BR/i.test(v.lang)) ||
      vozes.find((v) => /^pt/i.test(v.lang)) ||
      null;
  }
  if (window.speechSynthesis) {
    listarVozes();
    speechSynthesis.addEventListener("voiceschanged", listarVozes);
  }

  function falar(texto) {
    return new Promise((resolve) => {
      if (!prefs.vozLigada || !window.speechSynthesis) return resolve();
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(texto);
      u.lang = "pt-BR";
      if (vozPt) u.voice = vozPt;
      u.rate = 1.04;
      u.pitch = 1.12;
      u.onend = u.onerror = () => resolve();
      speechSynthesis.speak(u);
    });
  }

  /* ---------- Voz: ouvir ---------- */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null;
  let recAtivo = false;

  function iniciarReconhecimento() {
    if (!SR || recAtivo || estado.ocupada) return;
    rec = new SR();
    rec.lang = "pt-BR";
    rec.continuous = estado.modoChamar;
    rec.interimResults = false;
    rec.onstart = () => {
      recAtivo = true;
      if (!estado.ocupada) definirFase("listening");
    };
    rec.onresult = (e) => {
      const frase = e.results[e.results.length - 1][0].transcript.trim();
      if (frase) tratarFala(frase);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        el.legenda.textContent = "Libere o microfone nas permissões do navegador para falar comigo.";
        desligarMicrofone();
      }
    };
    rec.onend = () => {
      recAtivo = false;
      if (estado.microfoneLigado && !estado.ocupada) {
        try { iniciarReconhecimento(); } catch (_) {}
      } else if (!estado.ocupada) {
        definirFase("idle");
      }
    };
    try { rec.start(); } catch (_) {}
  }

  function pararReconhecimento() {
    if (rec && recAtivo) {
      try { rec.stop(); } catch (_) {}
    }
  }

  function ligarMicrofone() {
    if (!SR) {
      el.legenda.textContent = "Seu navegador não reconhece voz. Use o Chrome ou o Edge, ou escreva abaixo.";
      return;
    }
    estado.microfoneLigado = true;
    el.mic.setAttribute("aria-pressed", "true");
    if (window.PinkSFX) window.PinkSFX.click();
    iniciarReconhecimento();
  }

  function desligarMicrofone() {
    estado.microfoneLigado = false;
    el.mic.setAttribute("aria-pressed", "false");
    pararReconhecimento();
    if (!estado.ocupada) definirFase("idle");
  }

  function escaparRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function tratarFala(frase) {
    if (estado.modoChamar) {
      const nomeEsc = escaparRegex(prefs.assistantName.toLowerCase());
      const rx = new RegExp(`\\b(?:${nomeEsc}|pink)\\b[\\s,.!?]*(.*)$`, "i");
      const m = frase.match(rx);
      if (!m) return;
      const pedido = (m[1] || "").trim();
      if (!pedido) {
        if (window.PinkSFX) window.PinkSFX.wake();
        responderLocal(prefs.userName ? `Pois não, ${prefs.userName}?` : "Pois não?");
        return;
      }
      enviar(pedido);
    } else {
      enviar(frase);
      desligarMicrofone();
    }
  }

  async function responderLocal(texto) {
    estado.ocupada = true;
    pararReconhecimento();
    adicionar("pink", texto);
    el.legenda.textContent = texto;
    definirFase("speaking");
    await falar(texto);
    terminarTurno();
  }

  /* ---------- Previsão do tempo via navegador (fallback Open-Meteo) ---------- */
  const WMO_CLIMA = {
    0: "céu limpo", 1: "predominantemente limpo", 2: "parcialmente nublado", 3: "nublado",
    45: "com neblina", 48: "com nevoeiro", 51: "com garoa leve", 53: "com garoa moderada",
    55: "com garoa intensa", 61: "com chuva leve", 63: "com chuva moderada", 65: "com chuva forte",
    71: "com neve leve", 80: "com pancadas de chuva", 81: "com pancadas de chuva",
    82: "com chuva forte", 95: "com trovoadas", 96: "com tempestade", 99: "com tempestade forte",
  };

  async function buscarClimaNavegador(cidade) {
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cidade)}&count=1&language=pt&format=json`;
      const geo = await (await fetch(geoUrl)).json();
      const lugar = geo && geo.results && geo.results[0];
      if (!lugar) return `Não encontrei a cidade “${cidade}” na previsão do tempo.`;

      const climaUrl =
        `https://api.open-meteo.com/v1/forecast?latitude=${lugar.latitude}&longitude=${lugar.longitude}` +
        "&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code" +
        "&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto";
      const dados = await (await fetch(climaUrl)).json();
      const atual = dados.current || {};
      const diario = dados.daily || {};
      const temp = Math.round(atual.temperature_2m ?? 0);
      const sens = Math.round(atual.apparent_temperature ?? temp);
      const umid = Math.round(atual.relative_humidity_2m ?? 0);
      const cond = WMO_CLIMA[atual.weather_code] || "com tempo variável";
      const tmax = Math.round((diario.temperature_2m_max || [temp])[0]);
      const tmin = Math.round((diario.temperature_2m_min || [temp])[0]);
      const chuva = (diario.precipitation_probability_max || [0])[0];
      const localFmt = lugar.admin1 ? `${lugar.name}, ${lugar.admin1}` : lugar.name;

      let frase =
        `Em ${localFmt}, agora faz ${temp} graus com ${cond} e sensação de ${sens} graus. ` +
        `Hoje a mínima é de ${tmin} e a máxima de ${tmax} graus, com umidade em ${umid}%.`;
      if (chuva >= 50) {
        frase += ` A chance de chuva é de ${chuva}%, melhor levar guarda-chuva!`;
      }
      return frase;
    } catch (_) {
      return `Não consegui consultar a previsão do tempo para ${cidade} agora. Verifique sua conexão.`;
    }
  }

  /* ---------- Timer de Estudos ---------- */
  const timer = {
    totalSeconds: 25 * 60,
    remaining: 25 * 60,
    label: "Pomodoro",
    running: false,
    endAt: 0,
    intervalId: null,
  };

  function fmtTempo(seg) {
    const s = Math.max(0, Math.ceil(seg));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  }

  function atualizarTimerUI() {
    const txt = fmtTempo(timer.remaining);
    el.timerDisplay.textContent = txt;
    el.timerLabel.textContent = timer.running ? timer.label : (timer.remaining < timer.totalSeconds ? "Pausado" : "Pronto");
    el.btnTimerToggle.textContent = timer.running ? "Pausar" : "Iniciar";

    const ativo = timer.running || (timer.remaining > 0 && timer.remaining < timer.totalSeconds);
    el.orbTimerBadge.hidden = !ativo;
    if (ativo) {
      el.orbTimerText.textContent = txt;
      el.orbTimerSub.textContent = timer.label;
    }
  }

  function tickTimer() {
    if (!timer.running) return;
    const restante = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
    timer.remaining = restante;
    atualizarTimerUI();
    if (restante <= 0) {
      concluirTimer();
    }
  }

  function iniciarTimer(segundos, label = "Estudos") {
    clearInterval(timer.intervalId);
    timer.totalSeconds = Math.max(5, Math.round(segundos));
    timer.remaining = timer.totalSeconds;
    timer.label = label || "Estudos";
    timer.running = true;
    timer.endAt = Date.now() + timer.remaining * 1000;
    timer.intervalId = setInterval(tickTimer, 250);
    atualizarTimerUI();
  }

  function alternarTimer() {
    if (timer.running) {
      timer.running = false;
      clearInterval(timer.intervalId);
      atualizarTimerUI();
    } else {
      if (timer.remaining <= 0) timer.remaining = timer.totalSeconds;
      timer.running = true;
      timer.endAt = Date.now() + timer.remaining * 1000;
      clearInterval(timer.intervalId);
      timer.intervalId = setInterval(tickTimer, 250);
      atualizarTimerUI();
    }
    if (window.PinkSFX) window.PinkSFX.click();
  }

  function pararTimer() {
    clearInterval(timer.intervalId);
    timer.running = false;
    timer.totalSeconds = 25 * 60;
    timer.remaining = 25 * 60;
    timer.label = "Pomodoro";
    atualizarTimerUI();
  }

  async function concluirTimer() {
    clearInterval(timer.intervalId);
    timer.running = false;
    timer.remaining = 0;
    atualizarTimerUI();
    flash = 1;
    if (window.PinkSFX) window.PinkSFX.alarm();
    const aviso = `Tempo esgotado! Sua sessão de ${timer.label} terminou.`;
    adicionar("pink", aviso, ["Timer finalizado"]);
    el.legenda.textContent = aviso;
    if (!estado.ocupada) {
      definirFase("speaking");
      await falar(aviso);
      definirFase("idle");
    }
    timer.remaining = timer.totalSeconds;
    atualizarTimerUI();
  }

  document.querySelectorAll(".timer-presets [data-mins]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mins = Number(btn.dataset.mins || 25);
      const label = btn.dataset.label || "Estudos";
      iniciarTimer(mins * 60, label);
      if (window.PinkSFX) window.PinkSFX.click();
    });
  });
  el.btnTimerToggle.addEventListener("click", alternarTimer);
  el.btnTimerReset.addEventListener("click", () => {
    pararTimer();
    if (window.PinkSFX) window.PinkSFX.click();
  });

  /* ---------- Lembretes / Tarefas ---------- */
  function renderizarTarefas(tarefas) {
    el.listaTarefas.innerHTML = "";
    const temFeitas = tarefas.some((t) => t.done);
    el.btnLimparFeitas.hidden = !temFeitas;
    el.tarefasVazio.hidden = tarefas.length > 0;

    tarefas.forEach((t) => {
      const li = document.createElement("li");
      li.className = "task-item" + (t.done ? " done" : "");

      const lbl = document.createElement("label");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = Boolean(t.done);
      cb.addEventListener("change", () => alternarTarefa(t.id));

      const span = document.createElement("span");
      span.textContent = t.text;
      span.title = t.text;

      lbl.appendChild(cb);
      lbl.appendChild(span);

      const del = document.createElement("button");
      del.type = "button";
      del.className = "task-del";
      del.setAttribute("aria-label", "Remover lembrete");
      del.textContent = "✕";
      del.addEventListener("click", () => removerTarefa(t.id));

      li.appendChild(lbl);
      li.appendChild(del);
      el.listaTarefas.appendChild(li);
    });
  }

  async function carregarTarefas() {
    try {
      const r = await fetch("/api/tasks");
      const d = await r.json();
      renderizarTarefas(d.tasks || []);
    } catch (_) {}
  }

  async function alternarTarefa(id) {
    try {
      const r = await fetch(`/api/tasks/${id}`, { method: "PATCH" });
      const d = await r.json();
      renderizarTarefas(d.tasks || []);
      if (window.PinkSFX) window.PinkSFX.click();
    } catch (_) {}
  }

  async function removerTarefa(id) {
    try {
      const r = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      const d = await r.json();
      renderizarTarefas(d.tasks || []);
    } catch (_) {}
  }

  el.formTarefa.addEventListener("submit", async (e) => {
    e.preventDefault();
    const txt = el.inputTarefa.value.trim();
    if (!txt) return;
    el.inputTarefa.value = "";
    try {
      const r = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: txt }),
      });
      const d = await r.json();
      renderizarTarefas(d.tasks || []);
      if (window.PinkSFX) window.PinkSFX.click();
    } catch (_) {}
  });

  el.btnLimparFeitas.addEventListener("click", async () => {
    try {
      const r = await fetch("/api/tasks?scope=done", { method: "DELETE" });
      const d = await r.json();
      renderizarTarefas(d.tasks || []);
    } catch (_) {}
  });

  /* ---------- Falar com o servidor ---------- */
  async function executarAcoesCliente(clientActions, msgEl) {
    let textoSubstituido = null;
    for (const acao of clientActions || []) {
      if (!acao || !acao.type) continue;
      if (acao.type === "tasks_updated") {
        carregarTarefas();
      } else if (acao.type === "timer_start") {
        iniciarTimer(acao.seconds || 1500, acao.label || "Estudos");
      } else if (acao.type === "timer_stop") {
        pararTimer();
      } else if (acao.type === "set_pref" && acao.key) {
        prefs[acao.key] = acao.value;
        salvarPrefsLocal();
        aplicarPreferencias();
        flash = 0.85;
      } else if (acao.type === "weather" && acao.city) {
        const climaTexto = await buscarClimaNavegador(acao.city);
        textoSubstituido = climaTexto;
        if (msgEl) {
          const body = msgEl.querySelector(".msg-body");
          if (body) body.textContent = climaTexto;
        }
      }
    }
    return textoSubstituido;
  }

  async function enviar(mensagem) {
    if (estado.ocupada && estado.fase === "thinking") return;
    estado.ocupada = true;
    pararReconhecimento();
    adicionar("voce", mensagem);
    el.legenda.textContent = "";
    definirFase("thinking");
    if (window.PinkSFX) window.PinkSFX.send();

    let dados;
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: mensagem,
          config: {
            assistantName: prefs.assistantName,
            userName: prefs.userName,
            personality: prefs.personality,
            city: prefs.city,
          },
        }),
      });
      dados = await r.json();
    } catch (_) {
      dados = {
        text: `Não consegui falar com o servidor da ${prefs.assistantName}. Ele está rodando?`,
        actions: [],
        client_actions: [],
      };
    }

    const clientActions = dados.client_actions || [];
    const msgEl = adicionar("pink", dados.text, dados.actions || [], clientActions);
    let textoFinal = dados.text;

    const climaAtualizado = await executarAcoesCliente(clientActions, msgEl);
    if (climaAtualizado) textoFinal = climaAtualizado;

    if (window.PinkSFX) window.PinkSFX.receive();
    el.legenda.textContent = textoFinal;
    definirFase("speaking");
    await falar(textoFinal);
    terminarTurno();
  }

  function terminarTurno() {
    estado.ocupada = false;
    definirFase("idle");
    if (estado.microfoneLigado) iniciarReconhecimento();
  }

  /* ---------- Controles ---------- */
  el.form.addEventListener("submit", (e) => {
    e.preventDefault();
    const t = el.texto.value.trim();
    if (!t) return;
    el.texto.value = "";
    enviar(t);
  });

  el.mic.addEventListener("click", () => {
    estado.microfoneLigado ? desligarMicrofone() : ligarMicrofone();
  });

  el.voz.addEventListener("click", () => {
    prefs.vozLigada = !prefs.vozLigada;
    salvarPrefsLocal();
    aplicarPreferencias();
    if (!prefs.vozLigada && window.speechSynthesis) speechSynthesis.cancel();
    if (window.PinkSFX) window.PinkSFX.click();
  });

  el.sons.addEventListener("click", () => {
    prefs.sonsLigados = !prefs.sonsLigados;
    salvarPrefsLocal();
    aplicarPreferencias();
    if (prefs.sonsLigados && window.PinkSFX) window.PinkSFX.click();
  });

  el.chamar.addEventListener("click", () => {
    estado.modoChamar = !estado.modoChamar;
    el.chamar.setAttribute("aria-pressed", String(estado.modoChamar));
    el.legenda.textContent = estado.modoChamar
      ? `Ligue o microfone e diga “${prefs.assistantName}” antes do pedido.`
      : "Toque no microfone ou escreva abaixo.";
    if (estado.microfoneLigado) {
      desligarMicrofone();
      ligarMicrofone();
    }
    if (window.PinkSFX) window.PinkSFX.click();
  });

  el.limpar.addEventListener("click", async () => {
    try { await fetch("/api/reset", { method: "POST" }); } catch (_) {}
    el.log.textContent = "";
    el.legenda.textContent = "Conversa nova. Sobre o que vamos falar?";
    if (window.PinkSFX) window.PinkSFX.click();
  });

  el.chips.addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (b) enviar(b.textContent);
  });

  /* ---------- Modal Personalizar ---------- */
  function abrirModal() {
    aplicarPreferencias();
    el.modal.hidden = false;
    el.prefAssistente.focus();
    if (window.PinkSFX) window.PinkSFX.click();
  }

  function fecharModal() {
    prefs.assistantName = el.prefAssistente.value.trim() || "Pink";
    prefs.userName = el.prefUsuario.value.trim();
    prefs.city = el.prefCidade.value.trim() || "Curitiba";
    salvarPrefsLocal();
    aplicarPreferencias();
    el.modal.hidden = true;
    flash = 0.8;
    if (window.PinkSFX) window.PinkSFX.receive();
  }

  el.personalizar.addEventListener("click", abrirModal);
  el.btnFecharModal.addEventListener("click", fecharModal);
  el.btnSalvarModal.addEventListener("click", fecharModal);
  el.modal.addEventListener("click", (e) => {
    if (e.target === el.modal) fecharModal();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !el.modal.hidden) fecharModal();
  });

  el.nameSuggestions.addEventListener("click", (e) => {
    const b = e.target.closest("[data-name]");
    if (!b) return;
    el.prefAssistente.value = b.dataset.name;
    prefs.assistantName = b.dataset.name;
    salvarPrefsLocal();
    aplicarPreferencias();
    if (window.PinkSFX) window.PinkSFX.click();
  });

  el.personalityGrid.addEventListener("click", (e) => {
    const b = e.target.closest("[data-personality]");
    if (!b) return;
    prefs.personality = b.dataset.personality;
    salvarPrefsLocal();
    aplicarPreferencias();
    if (window.PinkSFX) window.PinkSFX.click();
  });

  el.themeGrid.addEventListener("click", (e) => {
    const b = e.target.closest("[data-theme-pick]");
    if (!b) return;
    prefs.theme = b.dataset.themePick;
    salvarPrefsLocal();
    aplicarPreferencias();
    flash = 0.9;
    if (window.PinkSFX) window.PinkSFX.click();
  });

  el.orbGrid.addEventListener("click", (e) => {
    const b = e.target.closest("[data-orb]");
    if (!b) return;
    prefs.orbStyle = b.dataset.orb;
    salvarPrefsLocal();
    aplicarPreferencias();
    flash = 0.9;
    if (window.PinkSFX) window.PinkSFX.click();
  });

  el.prefVoz.addEventListener("change", () => {
    prefs.voiceName = el.prefVoz.value;
    salvarPrefsLocal();
    listarVozes();
  });

  el.btnTestarVoz.addEventListener("click", () => {
    prefs.assistantName = el.prefAssistente.value.trim() || "Pink";
    prefs.userName = el.prefUsuario.value.trim();
    listarVozes();
    const saud = prefs.userName
      ? `Olá ${prefs.userName}! Eu sou a ${prefs.assistantName}, sua assistente pessoal.`
      : `Olá! Eu sou a ${prefs.assistantName}, pronta para ajudar você.`;
    falar(saud);
  });

  /* ---------- Duas palmas ---------- */
  let nivelUi = 0;
  function mostrarNivel(pico) {
    nivelUi = Math.max(pico, nivelUi * 0.92);
    el.medidor.style.width = Math.min(100, nivelUi * 150) + "%";
  }

  function acordarPorPalmas() {
    if (estado.ocupada) return;
    flash = 1;
    if (window.PinkSFX) window.PinkSFX.wake();
    if (SR) {
      estado.microfoneLigado = true;
      el.mic.setAttribute("aria-pressed", "true");
    }
    responderLocal(prefs.userName ? `Pois não, ${prefs.userName}?` : "Pois não?");
  }

  async function ligarPalmas() {
    try {
      await PinkPalmas.iniciar({
        aoDetectar: acordarPorPalmas,
        ocupado: () => estado.ocupada,
        aoNivel: mostrarNivel,
      });
      el.palmas.setAttribute("aria-pressed", "true");
      try { localStorage.setItem("pink-palmas", "on"); } catch (_) {}
    } catch (_) {
      el.palmas.setAttribute("aria-pressed", "false");
      el.legenda.textContent = "Não consegui usar o microfone para ouvir as palmas. Libere o acesso nas permissões do navegador.";
    }
  }

  async function desligarPalmas() {
    await PinkPalmas.parar();
    el.medidor.style.width = "0";
    el.palmas.setAttribute("aria-pressed", "false");
    try { localStorage.setItem("pink-palmas", "off"); } catch (_) {}
  }

  el.palmas.addEventListener("click", () => {
    el.palmas.getAttribute("aria-pressed") === "true" ? desligarPalmas() : ligarPalmas();
  });

  /* ---------- Painel do computador ---------- */
  const CIRC = 264; // 2 * pi * 42
  async function atualizarStatus() {
    try {
      const d = await (await fetch("/api/status")).json();
      document.querySelectorAll(".gauge").forEach((g) => {
        const v = d[g.dataset.key];
        if (v === null || v === undefined) {
          g.hidden = true;
          return;
        }
        g.hidden = false;
        g.querySelector("b").textContent = v + "%";
        g.querySelector(".valor").style.strokeDashoffset = CIRC * (1 - v / 100);
      });
    } catch (_) {}
  }
  atualizarStatus();
  setInterval(atualizarStatus, 3000);

  /* ---------- Orbe Holográfico ---------- */
  const ctx = el.orb.getContext("2d");
  const calmo = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let tamanho = 380, t = 0, nivel = 0.15, flash = 0;

  const estrelas = Array.from({ length: 28 }, (_, i) => ({
    ang: (i / 28) * Math.PI * 2,
    dist: 1.32 + (i % 5) * 0.16,
    vel: (i % 2 === 0 ? 1 : -1) * (0.25 + (i % 4) * 0.12),
    raio: 1.4 + (i % 3) * 0.9,
    fase: i * 0.7,
  }));

  function ajustar() {
    const dpr = window.devicePixelRatio || 1;
    tamanho = el.orb.clientWidth || 380;
    el.orb.width = tamanho * dpr;
    el.orb.height = tamanho * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", ajustar);
  ajustar();

  function desenharPoligono(cx, cy, raio, lados, rotacao) {
    ctx.beginPath();
    for (let i = 0; i <= lados; i++) {
      const a = rotacao + (i / lados) * Math.PI * 2;
      const x = cx + Math.cos(a) * raio;
      const y = cy + Math.sin(a) * raio;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function desenhar() {
    const s = tamanho, c = s / 2, R = s * 0.24;
    const vel = calmo ? 0.15 : 1;
    t += 0.016 * vel;

    const pal = TEMAS_ORB[prefs.theme] || TEMAS_ORB["rosa-neon"];
    const alvo = {
      idle: 0.12 + 0.04 * Math.sin(t * 1.6),
      listening: 0.45 + 0.18 * Math.sin(t * 5),
      thinking: 0.34,
      speaking: 0.52 + 0.3 * Math.abs(Math.sin(t * 7) * Math.cos(t * 3.1)),
    }[estado.fase];
    nivel += (alvo - nivel) * 0.08;

    ctx.clearRect(0, 0, s, s);

    // brilho de fundo
    const brilho = ctx.createRadialGradient(c, c, R * 0.5, c, c, s * 0.5);
    brilho.addColorStop(0, "rgba(255,255,255,.65)");
    brilho.addColorStop(0.5, pal.glow);
    brilho.addColorStop(1, "rgba(255,111,180,0)");
    ctx.fillStyle = brilho;
    ctx.fillRect(0, 0, s, s);

    // anéis giratórios
    const mult = estado.fase === "thinking" ? 4.2 : 1;
    const aneis = [
      { r: R * 1.42, larg: 2, tracos: [18, 14], giro: 0.35, cor: pal.ring1 },
      { r: R * 1.68, larg: 3, tracos: [56, 26], giro: -0.22, cor: pal.ring2 },
      { r: R * 1.94, larg: 1.5, tracos: [4, 10], giro: 0.12, cor: pal.ring3 },
    ];
    aneis.forEach((a) => {
      ctx.save();
      ctx.translate(c, c);
      ctx.rotate(t * a.giro * mult);
      ctx.setLineDash(a.tracos);
      ctx.lineWidth = a.larg;
      ctx.strokeStyle = a.cor;
      ctx.beginPath();
      ctx.arc(0, 0, a.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
    ctx.setLineDash([]);

    // Efeito extra conforme estilo selecionado
    if (prefs.orbStyle === "estelar") {
      estrelas.forEach((st) => {
        const ang = st.ang + t * st.vel * (estado.fase === "thinking" ? 2.5 : 1);
        const dist = R * (st.dist + 0.05 * Math.sin(t * 2 + st.fase));
        const x = c + Math.cos(ang) * dist;
        const y = c + Math.sin(ang) * dist;
        const alfa = 0.45 + 0.55 * Math.abs(Math.sin(t * 2.3 + st.fase));
        ctx.save();
        ctx.globalAlpha = alfa;
        ctx.fillStyle = pal.particle;
        ctx.beginPath();
        ctx.arc(x, y, st.raio + nivel * 1.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    } else if (prefs.orbStyle === "cristal") {
      ctx.save();
      ctx.strokeStyle = pal.ring2;
      ctx.lineWidth = 1.6;
      desenharPoligono(c, c, R * (1.36 + nivel * 0.12), 6, t * 0.4 * mult);
      ctx.stroke();
      ctx.strokeStyle = pal.ring1;
      desenharPoligono(c, c, R * (1.62 - nivel * 0.06), 6, -t * 0.25 * mult + Math.PI / 6);
      ctx.stroke();
      // marcadores radiais tipo HUD Jarvis
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2 + t * 0.15;
        const rIn = R * 1.78;
        const rOut = R * (i % 3 === 0 ? 1.9 : 1.83);
        ctx.beginPath();
        ctx.moveTo(c + Math.cos(a) * rIn, c + Math.sin(a) * rIn);
        ctx.lineTo(c + Math.cos(a) * rOut, c + Math.sin(a) * rOut);
        ctx.strokeStyle = pal.ring3;
        ctx.lineWidth = i % 3 === 0 ? 2 : 1;
        ctx.stroke();
      }
      ctx.restore();
    }

    // Progresso do Timer no holograma
    if (timer.running || (timer.remaining > 0 && timer.remaining < timer.totalSeconds)) {
      const frac = Math.max(0, Math.min(1, timer.remaining / timer.totalSeconds));
      ctx.save();
      ctx.beginPath();
      ctx.arc(c, c, R * 1.55, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.strokeStyle = pal.core3;
      ctx.stroke();
      ctx.restore();
    }

    // onda orgânica ao redor do núcleo
    const pontos = 120;
    ctx.beginPath();
    for (let i = 0; i <= pontos; i++) {
      const ang = (i / pontos) * Math.PI * 2;
      const ruido = Math.sin(ang * 5 + t * 2.4) * 0.5 + Math.sin(ang * 9 - t * 3.2) * 0.35;
      const r = R * (1.16 + nivel * 0.28 * ruido * (calmo ? 0.2 : 1)) + nivel * 6;
      const x = c + Math.cos(ang) * r;
      const y = c + Math.sin(ang) * r;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = pal.waveFill;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = pal.waveStroke;
    ctx.stroke();

    // onda de choque ao acordar
    if (flash > 0) {
      ctx.beginPath();
      ctx.arc(c, c, R * (1.2 + (1 - flash) * 1.5), 0, Math.PI * 2);
      ctx.lineWidth = 5 * flash;
      ctx.strokeStyle = `rgba(255,255,255,${flash})`;
      ctx.stroke();
      flash = Math.max(0, flash - 0.02);
    }

    // núcleo luminoso
    const pulso = 1 + nivel * 0.12;
    const nucleo = ctx.createRadialGradient(c - R * 0.35, c - R * 0.4, R * 0.1, c, c, R * pulso);
    nucleo.addColorStop(0, pal.core1);
    nucleo.addColorStop(0.38, pal.core2);
    nucleo.addColorStop(1, pal.core3);
    ctx.beginPath();
    ctx.arc(c, c, R * pulso, 0, Math.PI * 2);
    ctx.fillStyle = nucleo;
    ctx.shadowColor = pal.shadow;
    ctx.shadowBlur = 28 + nivel * 36;
    ctx.fill();
    ctx.shadowBlur = 0;

    // reflexo especular
    ctx.beginPath();
    ctx.ellipse(c - R * 0.32, c - R * 0.4, R * 0.22, R * 0.12, -0.6, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,.72)";
    ctx.fill();

    requestAnimationFrame(desenhar);
  }
  desenhar();

  /* ---------- Início ---------- */
  async function iniciar() {
    carregarPrefsLocal();
    try {
      const cfg = await (await fetch("/api/config")).json();
      if (!localStorage.getItem("pink-prefs")) {
        if (cfg.nome) prefs.userName = cfg.nome;
        if (cfg.assistente) prefs.assistantName = cfg.assistente;
        if (cfg.personalidade) prefs.personality = cfg.personalidade;
        if (cfg.cidade) prefs.city = cfg.cidade;
      }
      estado.online = Boolean(cfg.online);
    } catch (_) {}

    aplicarPreferencias();
    atualizarTimerUI();
    carregarTarefas();

    el.modoBadge.textContent = estado.online ? "Claude online" : "Modo offline";

    const oi = prefs.userName
      ? `Oi, ${prefs.userName}! Eu sou a ${prefs.assistantName}.`
      : `Oi! Eu sou a ${prefs.assistantName}.`;
    const complemento = estado.online
      ? " Como posso ajudar hoje?"
      : " Já posso ver clima, horas, lembretes, timer de estudos, contas e curiosidades. Clique em Personalizar para deixar tudo do seu jeito!";
    adicionar("pink", oi + complemento);
    el.legenda.textContent = oi + " Toque no microfone, escreva abaixo ou bata 2 palmas.";

    let prefPalmas = "off";
    try {
      prefPalmas = localStorage.getItem("pink-palmas") || "off";
    } catch (_) {}
    if (prefPalmas === "on") ligarPalmas();
  }
  iniciar();
})();
