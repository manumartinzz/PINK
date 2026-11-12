/* Pink — interface futurista, voz de amiga, pesquisa web, palmas e holograma 3D */
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
    gaugesGrid: $("gaugesGrid"),
    pcHint: $("pcHint"),
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
    voicePresetGrid: $("voicePresetGrid"),
    clapSensGrid: $("clapSensGrid"),
  };

  const TEMAS_ORB = {
    "rosa-futuro": {
      glow: "rgba(255,46,147,.34)",
      ring1: "rgba(125,211,252,.65)",
      ring2: "rgba(255,46,147,.85)",
      ring3: "rgba(255,142,208,.48)",
      waveFill: "rgba(255,46,147,.24)",
      waveStroke: "rgba(255,121,198,.95)",
      core1: "#fff6fb",
      core2: "#ff66b8",
      core3: "#c90064",
      shadow: "rgba(255,46,147,.88)",
      particle: "rgba(125,211,252,.94)",
      gyro: "rgba(125,211,252,.42)",
    },
    "cereja-cyber": {
      glow: "rgba(255,46,147,.34)",
      ring1: "rgba(125,211,252,.65)",
      ring2: "rgba(255,46,147,.85)",
      ring3: "rgba(255,142,208,.48)",
      waveFill: "rgba(255,46,147,.24)",
      waveStroke: "rgba(255,121,198,.95)",
      core1: "#fff6fb",
      core2: "#ff66b8",
      core3: "#c90064",
      shadow: "rgba(255,46,147,.88)",
      particle: "rgba(125,211,252,.94)",
      gyro: "rgba(125,211,252,.42)",
    },
    "rosa-neon": {
      glow: "rgba(255,111,180,.30)",
      ring1: "rgba(196,18,107,.55)",
      ring2: "rgba(255,61,154,.68)",
      ring3: "rgba(74,8,48,.34)",
      waveFill: "rgba(255,61,154,.22)",
      waveStroke: "rgba(255,61,154,.85)",
      core1: "#fff7fb",
      core2: "#ff9fd0",
      core3: "#e0136f",
      shadow: "rgba(255,61,154,.72)",
      particle: "rgba(255,255,255,.9)",
      gyro: "rgba(196,18,107,.35)",
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
      gyro: "rgba(142,53,64,.35)",
    },
    "lilas-galaxy": {
      glow: "rgba(168,85,247,.34)",
      ring1: "rgba(103,232,249,.62)",
      ring2: "rgba(168,85,247,.84)",
      ring3: "rgba(233,213,255,.46)",
      waveFill: "rgba(168,85,247,.24)",
      waveStroke: "rgba(216,180,254,.92)",
      core1: "#fcf8ff",
      core2: "#c084fc",
      core3: "#7e22ce",
      shadow: "rgba(168,85,247,.86)",
      particle: "rgba(103,232,249,.95)",
      gyro: "rgba(103,232,249,.42)",
    },
  };

  const VOICE_PRESETS = {
    amiga: { pitch: 1.02, rate: 1.03 },
    suave: { pitch: 0.98, rate: 0.96 },
    animada: { pitch: 1.07, rate: 1.08 },
  };

  const prefs = {
    assistantName: "Pink",
    userName: "",
    city: "Curitiba",
    personality: "carinhosa",
    theme: "rosa-futuro",
    orbStyle: "cristal",
    voicePreset: "amiga",
    voiceName: "",
    clapSens: "normal",
    vozLigada: true,
    sonsLigados: true,
  };

  const estado = {
    fase: "idle", // idle | listening | thinking | speaking
    modoChamar: false,
    microfoneLigado: false,
    ocupada: false,
    online: false,
    hasServer: false,
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
    const tema = TEMAS_ORB[prefs.theme] ? prefs.theme : "rosa-futuro";
    prefs.theme = tema;
    document.documentElement.setAttribute("data-theme", tema);
    const nome = (prefs.assistantName || "Pink").trim() || "Pink";
    prefs.assistantName = nome;

    el.brand.textContent = nome;
    document.title = nome;
    el.texto.placeholder = `Converse ou pesquise qualquer assunto com a ${nome}…`;
    el.voz.setAttribute("aria-pressed", String(prefs.vozLigada));
    el.sons.setAttribute("aria-pressed", String(prefs.sonsLigados));
    if (window.PinkSFX) window.PinkSFX.setEnabled(prefs.sonsLigados);
    if (window.PinkPalmas && window.PinkPalmas.setSensibilidade) {
      window.PinkPalmas.setSensibilidade(prefs.clapSens);
    }

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
    if (el.voicePresetGrid) {
      el.voicePresetGrid.querySelectorAll("[data-vpreset]").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.vpreset === prefs.voicePreset);
      });
    }
    if (el.clapSensGrid) {
      el.clapSensGrid.querySelectorAll("[data-sens]").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.sens === prefs.clapSens);
      });
    }
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
        const existe = Array.from(container.querySelectorAll(".acao-link"))
          .some((a) => a.href === acao.url);
        if (existe) return;
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

  /* ---------- Voz de Amiga: seleção natural & fala ---------- */
  let vozPt = null;
  function pontuarVoz(v) {
    let pts = 0;
    if (/pt[-_]BR/i.test(v.lang)) pts += 100;
    else if (/^pt/i.test(v.lang)) pts += 40;
    if (/natural|online|neural|google/i.test(v.name)) pts += 60;
    if (/francisca|thalita|giovanna|leila|brenda|manuela|raquel|luciana|camila|vitoria/i.test(v.name)) pts += 50;
    if (/female|feminin|maria|joana/i.test(v.name)) pts += 25;
    if (/male|daniel|antonio|fabio|humberto|valerio|julio/i.test(v.name)) pts -= 80;
    return pts;
  }

  function listarVozes() {
    if (!window.speechSynthesis) return;
    const vozes = speechSynthesis.getVoices();
    const pts = vozes.filter((v) => /^pt/i.test(v.lang));
    const candidatas = (pts.length ? pts : vozes).slice().sort((a, b) => pontuarVoz(b) - pontuarVoz(a));

    if (el.prefVoz) {
      const atual = prefs.voiceName || el.prefVoz.value;
      el.prefVoz.innerHTML = "";
      const optAuto = document.createElement("option");
      optAuto.value = "";
      optAuto.textContent = "Automática (Voz de Amiga PT-BR)";
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
      candidatas[0] ||
      null;
  }
  if (window.speechSynthesis) {
    listarVozes();
    speechSynthesis.addEventListener("voiceschanged", listarVozes);
  }

  function prepararTextoFala(texto) {
    return String(texto || "")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/[*_`#]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function falar(texto) {
    return new Promise((resolve) => {
      const limpo = prepararTextoFala(texto);
      if (!prefs.vozLigada || !window.speechSynthesis || !limpo) return resolve();
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(limpo);
      u.lang = "pt-BR";
      if (vozPt) u.voice = vozPt;
      const preset = VOICE_PRESETS[prefs.voicePreset] || VOICE_PRESETS.amiga;
      u.rate = preset.rate;
      u.pitch = preset.pitch;
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
        responderLocal(prefs.userName ? `Oii, ${prefs.userName}! Tô aqui, pode falar.` : "Oii! Tô aqui, pode falar.");
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

  /* ---------- Pesquisa Web Ao Vivo no Navegador ---------- */
  function limparResumoWeb(texto, maxFrases = 3) {
    const limpo = String(texto || "").replace(/\[\d+\]/g, "").replace(/\s+/g, " ").trim();
    const frases = limpo.split(/(?<=[.!?])\s+/);
    let out = frases.slice(0, maxFrases).join(" ").trim();
    if (out.length > 420) out = out.slice(0, 417).replace(/\s+\S*$/, "") + "...";
    return out;
  }

  async function pesquisarNaWebNavegador(consulta) {
    const links = [];
    const googleUrl = "https://www.google.com/search?q=" + encodeURIComponent(consulta);

    // 1) Wikipédia em Português (CORS nativo com origin=*)
    try {
      const buscaUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(consulta)}&srlimit=1&utf8=1&format=json&origin=*`;
      const busca = await (await fetch(buscaUrl)).json();
      const item = busca && busca.query && busca.query.search && busca.query.search[0];
      if (item && item.title) {
        const resumoUrl = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(item.title.replace(/ /g, "_"))}`;
        const pag = await (await fetch(resumoUrl)).json();
        const extrato = (pag && pag.extract || "").trim();
        const wikiUrl = (pag && pag.content_urls && pag.content_urls.desktop && pag.content_urls.desktop.page) ||
          `https://pt.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, "_"))}`;
        links.push({ type: "open_url", url: wikiUrl, label: `Wikipédia: ${item.title}` });
        if (extrato) {
          links.push({ type: "open_url", url: googleUrl, label: "Ver no Google" });
          return { text: limparResumoWeb(extrato), links };
        }
      }
    } catch (_) {}

    // 2) DuckDuckGo Instant Answer
    try {
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(consulta)}&format=json&no_html=1&skip_disambig=1&kl=br-pt`;
      const ddg = await (await fetch(ddgUrl)).json();
      const resumo = (ddg && (ddg.AbstractText || ddg.Answer) || "").trim();
      if (resumo) {
        if (ddg.AbstractURL) links.push({ type: "open_url", url: ddg.AbstractURL, label: "Fonte" });
        links.push({ type: "open_url", url: googleUrl, label: "Ver no Google" });
        return { text: limparResumoWeb(resumo), links };
      }
    } catch (_) {}

    links.push({ type: "open_url", url: googleUrl, label: `Pesquisar “${consulta}” no Google` });
    return {
      text: `Pesquisei sobre “${consulta}” na web e deixei o link com todos os resultados aqui embaixo pra você!`,
      links,
    };
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
    if (!estado.hasServer && window.PinkLocalBrain) {
      renderizarTarefas(window.PinkLocalBrain.defaultStore.list());
      return;
    }
    try {
      const r = await fetch("/api/tasks");
      if (!r.ok) throw new Error("HTTP");
      const d = await r.json();
      renderizarTarefas(d.tasks || []);
    } catch (_) {
      if (window.PinkLocalBrain) renderizarTarefas(window.PinkLocalBrain.defaultStore.list());
    }
  }

  async function alternarTarefa(id) {
    if (!estado.hasServer && window.PinkLocalBrain) {
      renderizarTarefas(window.PinkLocalBrain.defaultStore.toggle(id));
      if (window.PinkSFX) window.PinkSFX.click();
      return;
    }
    try {
      const r = await fetch(`/api/tasks/${id}`, { method: "PATCH" });
      const d = await r.json();
      renderizarTarefas(d.tasks || []);
      if (window.PinkSFX) window.PinkSFX.click();
    } catch (_) {}
  }

  async function removerTarefa(id) {
    if (!estado.hasServer && window.PinkLocalBrain) {
      renderizarTarefas(window.PinkLocalBrain.defaultStore.removeById(id));
      return;
    }
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
    if (!estado.hasServer && window.PinkLocalBrain) {
      const res = window.PinkLocalBrain.defaultStore.add(txt);
      renderizarTarefas(res.tasks || []);
      if (window.PinkSFX) window.PinkSFX.click();
      return;
    }
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
    if (!estado.hasServer && window.PinkLocalBrain) {
      window.PinkLocalBrain.defaultStore.clear(true);
      renderizarTarefas(window.PinkLocalBrain.defaultStore.list());
      return;
    }
    try {
      const r = await fetch("/api/tasks?scope=done", { method: "DELETE" });
      const d = await r.json();
      renderizarTarefas(d.tasks || []);
    } catch (_) {}
  });

  /* ---------- Falar com o servidor / Modo Web ---------- */
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
      } else if (acao.type === "web_research" && acao.query) {
        const res = await pesquisarNaWebNavegador(acao.query);
        textoSubstituido = res.text;
        if (msgEl) {
          const body = msgEl.querySelector(".msg-body");
          if (body) body.textContent = res.text;
          renderizarLinks(msgEl, res.links);
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

    const cfgAtual = {
      assistantName: prefs.assistantName,
      userName: prefs.userName,
      personality: prefs.personality,
      city: prefs.city,
    };

    let dados;
    if (estado.hasServer) {
      try {
        const r = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: mensagem, config: cfgAtual }),
        });
        if (!r.ok) throw new Error("HTTP");
        dados = await r.json();
      } catch (_) {
        dados = window.PinkLocalBrain
          ? window.PinkLocalBrain.responder(mensagem, cfgAtual)
          : {
              text: `Não consegui falar com o servidor da ${prefs.assistantName}. Ele está rodando?`,
              actions: [],
              client_actions: [],
            };
      }
    } else if (window.PinkLocalBrain) {
      dados = window.PinkLocalBrain.responder(mensagem, cfgAtual);
    } else {
      dados = { text: "Modo Web inicializando...", actions: [], client_actions: [] };
    }

    const clientActions = dados.client_actions || [];
    const msgEl = adicionar("pink", dados.text, dados.actions || [], clientActions);
    let textoFinal = dados.text;

    const atualizado = await executarAcoesCliente(clientActions, msgEl);
    if (atualizado) textoFinal = atualizado;

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
    if (estado.hasServer) {
      try { await fetch("/api/reset", { method: "POST" }); } catch (_) {}
    }
    el.log.textContent = "";
    el.legenda.textContent = "Conversa nova! Sobre o que vamos falar agora?";
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

  if (el.voicePresetGrid) {
    el.voicePresetGrid.addEventListener("click", (e) => {
      const b = e.target.closest("[data-vpreset]");
      if (!b) return;
      prefs.voicePreset = b.dataset.vpreset;
      salvarPrefsLocal();
      aplicarPreferencias();
      if (window.PinkSFX) window.PinkSFX.click();
    });
  }

  if (el.clapSensGrid) {
    el.clapSensGrid.addEventListener("click", (e) => {
      const b = e.target.closest("[data-sens]");
      if (!b) return;
      prefs.clapSens = b.dataset.sens;
      salvarPrefsLocal();
      aplicarPreferencias();
      if (window.PinkSFX) window.PinkSFX.click();
    });
  }

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
      ? `Oii ${prefs.userName}! Eu sou a ${prefs.assistantName}, sua amiga e assistente. E aí, o que vamos fazer hoje?`
      : `Oii! Eu sou a ${prefs.assistantName}, sua amiga e assistente. Tô pronta pra tudo!`;
    falar(saud);
  });

  /* ---------- Duas palmas ---------- */
  let nivelUi = 0;
  let timerPrimeira = null;

  function mostrarNivel(pico) {
    nivelUi = Math.max(pico, nivelUi * 0.88);
    el.medidor.style.width = Math.min(100, Math.sqrt(nivelUi) * 145) + "%";
  }

  function sinalizarPrimeiraPalma() {
    flash = Math.max(flash, 0.45);
    el.palmas.classList.add("clap-prime");
    clearTimeout(timerPrimeira);
    timerPrimeira = setTimeout(() => el.palmas.classList.remove("clap-prime"), 1100);
    if (!estado.ocupada && estado.fase === "idle") {
      el.legenda.textContent = "1ª palma ouvida… bata a 2ª palma!";
    }
  }

  function acordarPorPalmas() {
    if (estado.ocupada) return;
    clearTimeout(timerPrimeira);
    el.palmas.classList.remove("clap-prime");
    flash = 1;
    if (window.PinkSFX) window.PinkSFX.wake();
    if (SR) {
      estado.microfoneLigado = true;
      el.mic.setAttribute("aria-pressed", "true");
    }
    const saud = prefs.userName
      ? `Oii, ${prefs.userName}! Tô aqui, pode falar.`
      : "Oii! Tô aqui, pode falar.";
    responderLocal(saud);
  }

  async function ligarPalmas(silencioso = false) {
    try {
      await PinkPalmas.iniciar({
        sensibilidade: prefs.clapSens,
        aoDetectar: acordarPorPalmas,
        aoPrimeira: sinalizarPrimeiraPalma,
        ocupado: () => estado.ocupada,
        aoNivel: mostrarNivel,
        aoSuspender: (suspenso) => {
          if (suspenso) {
            el.legenda.textContent = "2 Palmas ativas — clique uma vez na tela para o navegador liberar o áudio automático.";
          }
        },
      });
      el.palmas.setAttribute("aria-pressed", "true");
      try { localStorage.setItem("pink-palmas", "on"); } catch (_) {}
    } catch (_) {
      el.palmas.setAttribute("aria-pressed", "false");
      if (!silencioso) {
        el.legenda.textContent = "Não consegui usar o microfone para ouvir as palmas. Libere o acesso nas permissões do navegador.";
      }
    }
  }

  async function desligarPalmas() {
    await PinkPalmas.parar();
    el.medidor.style.width = "0";
    el.palmas.classList.remove("clap-prime");
    el.palmas.setAttribute("aria-pressed", "false");
    try { localStorage.setItem("pink-palmas", "off"); } catch (_) {}
  }

  el.palmas.addEventListener("click", () => {
    el.palmas.getAttribute("aria-pressed") === "true" ? desligarPalmas() : ligarPalmas(false);
  });

  /* ---------- Painel do computador ---------- */
  const CIRC = 264; // 2 * pi * 42
  function aplicarGauges(d) {
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
  }

  async function atualizarStatus() {
    if (!estado.hasServer) return;
    try {
      const r = await fetch("/api/status");
      if (!r.ok) return;
      aplicarGauges(await r.json());
    } catch (_) {}
  }

  async function atualizarBateriaWeb() {
    aplicarGauges({ cpu: null, ram: null, disco: null, bateria: null });
    if (el.pcHint) el.pcHint.hidden = false;
    if (navigator.getBattery) {
      try {
        const bat = await navigator.getBattery();
        const mostrar = () => aplicarGauges({
          cpu: null, ram: null, disco: null, bateria: Math.round(bat.level * 100),
        });
        mostrar();
        bat.addEventListener("levelchange", mostrar);
      } catch (_) {}
    }
  }

  /* ---------- Orbe Holográfico 3D ---------- */
  const ctx = el.orb.getContext("2d");
  const calmo = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let tamanho = 380, t = 0, nivel = 0.15, flash = 0;

  const estrelas = Array.from({ length: 30 }, (_, i) => ({
    ang: (i / 30) * Math.PI * 2,
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

  function desenharGiro3D(cx, cy, rx, ry, rot, cor) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = cor;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
  }

  function desenhar() {
    const s = tamanho, c = s / 2, R = s * 0.23;
    const vel = calmo ? 0.15 : 1;
    t += 0.016 * vel;

    const pal = TEMAS_ORB[prefs.theme] || TEMAS_ORB["rosa-futuro"];
    const alvoBase = {
      idle: 0.12 + 0.04 * Math.sin(t * 1.6),
      listening: 0.45 + 0.18 * Math.sin(t * 5),
      thinking: 0.36,
      speaking: 0.54 + 0.3 * Math.abs(Math.sin(t * 7) * Math.cos(t * 3.1)),
    }[estado.fase];
    const alvo = Math.min(1, alvoBase + Math.min(0.35, nivelUi * 0.9));
    nivel += (alvo - nivel) * 0.09;

    ctx.clearRect(0, 0, s, s);

    // brilho de fundo
    const brilho = ctx.createRadialGradient(c, c, R * 0.45, c, c, s * 0.5);
    brilho.addColorStop(0, "rgba(255,255,255,.55)");
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

    // Efeito conforme estilo do holograma
    if (prefs.orbStyle === "estelar") {
      desenharGiro3D(c, c, R * 1.65, R * 0.52, t * 0.45, pal.gyro);
      desenharGiro3D(c, c, R * 1.65, R * 0.52, -t * 0.35 + 1.05, pal.gyro);
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
      // Anéis 3D inclinados estilo Jarvis
      desenharGiro3D(c, c, R * 1.72, R * 0.56, 0.55 + Math.sin(t * 0.5) * 0.25, pal.gyro);
      desenharGiro3D(c, c, R * 1.72, R * 0.56, -0.55 - Math.cos(t * 0.4) * 0.25, pal.ring1);

      ctx.save();
      ctx.strokeStyle = pal.ring2;
      ctx.lineWidth = 1.8;
      desenharPoligono(c, c, R * (1.34 + nivel * 0.12), 6, t * 0.42 * mult);
      ctx.stroke();
      ctx.strokeStyle = pal.ring1;
      desenharPoligono(c, c, R * (1.58 - nivel * 0.05), 6, -t * 0.28 * mult + Math.PI / 6);
      ctx.stroke();

      // Barras radiais reativas à voz/som
      const barras = 32;
      for (let i = 0; i < barras; i++) {
        const a = (i / barras) * Math.PI * 2 + t * 0.16;
        const amp = (0.04 + nivel * 0.14 * (0.5 + 0.5 * Math.sin(i * 3 + t * 8))) * R;
        const rIn = R * 1.78;
        const rOut = rIn + amp + (i % 4 === 0 ? 5 : 2);
        ctx.beginPath();
        ctx.moveTo(c + Math.cos(a) * rIn, c + Math.sin(a) * rIn);
        ctx.lineTo(c + Math.cos(a) * rOut, c + Math.sin(a) * rOut);
        ctx.strokeStyle = i % 2 === 0 ? pal.ring1 : pal.ring3;
        ctx.lineWidth = i % 4 === 0 ? 2.2 : 1.2;
        ctx.stroke();
      }
      ctx.restore();
    }

    // Progresso do Timer no holograma
    if (timer.running || (timer.remaining > 0 && timer.remaining < timer.totalSeconds)) {
      const frac = Math.max(0, Math.min(1, timer.remaining / timer.totalSeconds));
      ctx.save();
      ctx.beginPath();
      ctx.arc(c, c, R * 1.54, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.strokeStyle = pal.ring1;
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
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = pal.waveStroke;
    ctx.stroke();

    // onda de choque ao acordar / palma
    if (flash > 0) {
      ctx.beginPath();
      ctx.arc(c, c, R * (1.2 + (1 - flash) * 1.5), 0, Math.PI * 2);
      ctx.lineWidth = 5 * flash;
      ctx.strokeStyle = `rgba(255,255,255,${flash})`;
      ctx.stroke();
      flash = Math.max(0, flash - 0.024);
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
    ctx.shadowBlur = 30 + nivel * 38;
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
    const provavelEstatico =
      window.location.hostname.endsWith(".github.io") ||
      window.location.protocol === "file:";

    if (!provavelEstatico) {
      try {
        const resp = await fetch("/api/config");
        const ct = resp.headers.get("content-type") || "";
        if (resp.ok && ct.includes("application/json")) {
          const cfg = await resp.json();
          estado.hasServer = true;
          if (!localStorage.getItem("pink-prefs")) {
            if (cfg.nome) prefs.userName = cfg.nome;
            if (cfg.assistente) prefs.assistantName = cfg.assistente;
            if (cfg.personalidade) prefs.personality = cfg.personalidade;
            if (cfg.cidade) prefs.city = cfg.cidade;
          }
          estado.online = Boolean(cfg.online);
        }
      } catch (_) {}
    }

    aplicarPreferencias();
    atualizarTimerUI();
    carregarTarefas();

    if (estado.hasServer) {
      if (el.pcHint) el.pcHint.hidden = true;
      atualizarStatus();
      setInterval(atualizarStatus, 3000);
      el.modoBadge.textContent = estado.online ? "Claude online" : "Modo offline";
    } else {
      atualizarBateriaWeb();
      el.modoBadge.textContent = "Modo Web";
    }

    const oi = prefs.userName
      ? `Oii, ${prefs.userName}! Eu sou a ${prefs.assistantName}.`
      : `Oii! Eu sou a ${prefs.assistantName}.`;
    const complemento = estado.online
      ? " Tô conectada e pronta pra pesquisar ou conversar sobre qualquer coisa!"
      : " Já tenho acesso à web para pesquisas, clima, timer, lembretes, contas e muito mais. Bora começar?";
    adicionar("pink", oi + complemento);
    el.legenda.textContent = oi + " Toque no microfone, escreva abaixo ou ative as 2 palmas.";

    // Ativa as 2 palmas automaticamente se veio com ?autopalmas=1, se já estava ligado, ou se o microfone já tem permissão concedida
    const params = new URLSearchParams(window.location.search);
    const autoParam = params.get("autopalmas") === "1";
    let prefPalmas = null;
    try { prefPalmas = localStorage.getItem("pink-palmas"); } catch (_) {}

    let permConcedida = false;
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const st = await navigator.permissions.query({ name: "microphone" });
        permConcedida = st.state === "granted";
      } catch (_) {}
    }

    if (autoParam || prefPalmas === "on" || (prefPalmas !== "off" && permConcedida)) {
      ligarPalmas(true);
    }
  }
  iniciar();
})();
