/* Pink — interface, voz e orbe animado */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const el = {
    status: $("status"), legenda: $("legenda"), log: $("log"), texto: $("texto"),
    form: $("composer"), mic: $("btnMic"), voz: $("btnVoz"), chamar: $("btnChamar"),
    limpar: $("btnLimpar"), palmas: $("btnPalmas"), medidor: $("medidorBarra"), chips: $("chips"), orb: $("orb"),
  };

  const estado = {
    fase: "idle",          // idle | listening | thinking | speaking
    vozLigada: true,
    modoChamar: false,
    microfoneLigado: false,
    ocupada: false,
    nome: "",
    online: false,
  };

  const rotulos = {
    idle: "Pronta", listening: "Ouvindo…", thinking: "Pensando…", speaking: "Falando…",
  };

  function definirFase(fase) {
    estado.fase = fase;
    el.status.textContent = rotulos[fase];
  }

  /* ---------- Conversa na tela ---------- */
  function adicionar(autor, texto, acoes = []) {
    const div = document.createElement("div");
    div.className = "msg " + autor;
    div.textContent = texto;
    acoes.forEach((a) => {
      const s = document.createElement("span");
      s.className = "acao";
      s.textContent = a;
      div.appendChild(s);
    });
    el.log.appendChild(div);
    el.log.scrollTop = el.log.scrollHeight;
  }

  /* ---------- Voz: falar ---------- */
  let vozPt = null;
  function escolherVoz() {
    const vozes = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    vozPt = vozes.find((v) => /pt[-_]BR/i.test(v.lang) && /female|feminin|maria|francisca|luciana|google/i.test(v.name))
         || vozes.find((v) => /pt[-_]BR/i.test(v.lang))
         || vozes.find((v) => /^pt/i.test(v.lang)) || null;
  }
  if (window.speechSynthesis) {
    escolherVoz();
    speechSynthesis.addEventListener("voiceschanged", escolherVoz);
  }

  function falar(texto) {
    return new Promise((resolve) => {
      if (!estado.vozLigada || !window.speechSynthesis) return resolve();
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(texto);
      u.lang = "pt-BR";
      if (vozPt) u.voice = vozPt;
      u.rate = 1.05;
      u.pitch = 1.15;
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
    rec.onstart = () => { recAtivo = true; if (!estado.ocupada) definirFase("listening"); };
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
        try { iniciarReconhecimento(); } catch (_) { /* já iniciando */ }
      } else if (!estado.ocupada) {
        definirFase("idle");
      }
    };
    try { rec.start(); } catch (_) { /* já iniciado */ }
  }

  function pararReconhecimento() {
    if (rec && recAtivo) { try { rec.stop(); } catch (_) {} }
  }

  function ligarMicrofone() {
    if (!SR) {
      el.legenda.textContent = "Seu navegador não reconhece voz. Use o Chrome ou o Edge, ou escreva abaixo.";
      return;
    }
    estado.microfoneLigado = true;
    el.mic.setAttribute("aria-pressed", "true");
    iniciarReconhecimento();
  }

  function desligarMicrofone() {
    estado.microfoneLigado = false;
    el.mic.setAttribute("aria-pressed", "false");
    pararReconhecimento();
    if (!estado.ocupada) definirFase("idle");
  }

  function tratarFala(frase) {
    if (estado.modoChamar) {
      const m = frase.toLowerCase().match(/\bpink\b[\s,.!?]*(.*)$/);
      if (!m) return;                       // ninguém chamou a Pink
      const pedido = m[1].trim();
      if (!pedido) { responderLocal("Pois não?"); return; }
      enviar(pedido);
    } else {
      enviar(frase);
      desligarMicrofone();                  // uma frase por toque
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

  /* ---------- Falar com o servidor ---------- */
  async function enviar(mensagem) {
    if (estado.ocupada && estado.fase === "thinking") return;
    estado.ocupada = true;
    pararReconhecimento();
    adicionar("voce", mensagem);
    el.legenda.textContent = "";
    definirFase("thinking");

    let dados;
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: mensagem }),
      });
      dados = await r.json();
    } catch (_) {
      dados = { text: "Não consegui falar com o servidor da Pink. Ele está rodando?", actions: [] };
    }

    adicionar("pink", dados.text, dados.actions || []);
    el.legenda.textContent = dados.text;
    definirFase("speaking");
    await falar(dados.text);
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
    estado.vozLigada = !estado.vozLigada;
    el.voz.setAttribute("aria-pressed", String(estado.vozLigada));
    if (!estado.vozLigada && window.speechSynthesis) speechSynthesis.cancel();
  });

  el.chamar.addEventListener("click", () => {
    estado.modoChamar = !estado.modoChamar;
    el.chamar.setAttribute("aria-pressed", String(estado.modoChamar));
    el.legenda.textContent = estado.modoChamar
      ? "Ligue o microfone e diga “Pink” antes do pedido."
      : "Toque no microfone ou escreva abaixo.";
    if (estado.microfoneLigado) { desligarMicrofone(); ligarMicrofone(); }
  });

  el.limpar.addEventListener("click", async () => {
    try { await fetch("/api/reset", { method: "POST" }); } catch (_) {}
    el.log.textContent = "";
    el.legenda.textContent = "Conversa nova. Sobre o que vamos falar?";
  });

  el.chips.addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (b) enviar(b.textContent);
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
    if (SR) {                                  // depois de falar, a Pink já fica ouvindo
      estado.microfoneLigado = true;
      el.mic.setAttribute("aria-pressed", "true");
    }
    responderLocal(estado.nome ? `Pois não, ${estado.nome}?` : "Pois não?");
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
        if (v === null || v === undefined) { g.hidden = true; return; }
        g.hidden = false;
        g.querySelector("b").textContent = v + "%";
        g.querySelector(".valor").style.strokeDashoffset = CIRC * (1 - v / 100);
      });
    } catch (_) { /* servidor fora do ar */ }
  }
  atualizarStatus();
  setInterval(atualizarStatus, 3000);

  /* ---------- Orbe ---------- */
  const ctx = el.orb.getContext("2d");
  const calmo = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let tamanho = 400, t = 0, nivel = 0.15, flash = 0;

  function ajustar() {
    const dpr = window.devicePixelRatio || 1;
    tamanho = el.orb.clientWidth || 400;
    el.orb.width = tamanho * dpr;
    el.orb.height = tamanho * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", ajustar);
  ajustar();

  function desenhar() {
    const s = tamanho, c = s / 2, R = s * 0.25;
    const vel = calmo ? 0.15 : 1;
    t += 0.016 * vel;

    const alvo = {
      idle: 0.12 + 0.04 * Math.sin(t * 1.6),
      listening: 0.45 + 0.18 * Math.sin(t * 5),
      thinking: 0.3,
      speaking: 0.5 + 0.3 * Math.abs(Math.sin(t * 7) * Math.cos(t * 3.1)),
    }[estado.fase];
    nivel += (alvo - nivel) * 0.08;

    ctx.clearRect(0, 0, s, s);

    // brilho de fundo
    const brilho = ctx.createRadialGradient(c, c, R * 0.6, c, c, s * 0.5);
    brilho.addColorStop(0, "rgba(255,255,255,.75)");
    brilho.addColorStop(0.5, "rgba(255,111,180,.28)");
    brilho.addColorStop(1, "rgba(255,111,180,0)");
    ctx.fillStyle = brilho;
    ctx.fillRect(0, 0, s, s);

    // anéis tracejados girando
    const aneis = [
      { r: R * 1.45, larg: 2, tracos: [18, 14], giro: 0.35, cor: "rgba(196,18,107,.55)" },
      { r: R * 1.7, larg: 3, tracos: [60, 30], giro: -0.22, cor: "rgba(255,61,154,.6)" },
      { r: R * 1.95, larg: 1.5, tracos: [4, 10], giro: 0.12, cor: "rgba(74,8,48,.35)" },
    ];
    aneis.forEach((a) => {
      ctx.save();
      ctx.translate(c, c);
      ctx.rotate(t * a.giro * (estado.fase === "thinking" ? 5 : 1));
      ctx.setLineDash(a.tracos);
      ctx.lineWidth = a.larg;
      ctx.strokeStyle = a.cor;
      ctx.beginPath();
      ctx.arc(0, 0, a.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
    ctx.setLineDash([]);

    // onda orgânica ao redor do núcleo
    const pontos = 120;
    ctx.beginPath();
    for (let i = 0; i <= pontos; i++) {
      const ang = (i / pontos) * Math.PI * 2;
      const ruido = Math.sin(ang * 5 + t * 2.4) * 0.5 + Math.sin(ang * 9 - t * 3.2) * 0.35;
      const r = R * (1.18 + nivel * 0.28 * ruido * (calmo ? 0.2 : 1)) + nivel * 6;
      const x = c + Math.cos(ang) * r, y = c + Math.sin(ang) * r;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(255,61,154,.22)";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "rgba(255,61,154,.85)";
    ctx.stroke();

    // onda de choque quando a Pink acorda
    if (flash > 0) {
      ctx.beginPath();
      ctx.arc(c, c, R * (1.2 + (1 - flash) * 1.5), 0, Math.PI * 2);
      ctx.lineWidth = 5 * flash;
      ctx.strokeStyle = `rgba(255,255,255,${flash})`;
      ctx.stroke();
      flash = Math.max(0, flash - 0.02);
    }

    // núcleo
    const pulso = 1 + nivel * 0.12;
    const nucleo = ctx.createRadialGradient(c - R * 0.35, c - R * 0.4, R * 0.1, c, c, R * pulso);
    nucleo.addColorStop(0, "#fff7fb");
    nucleo.addColorStop(0.35, "#ff9fd0");
    nucleo.addColorStop(1, "#e0136f");
    ctx.beginPath();
    ctx.arc(c, c, R * pulso, 0, Math.PI * 2);
    ctx.fillStyle = nucleo;
    ctx.shadowColor = "rgba(255,61,154,.7)";
    ctx.shadowBlur = 30 + nivel * 40;
    ctx.fill();
    ctx.shadowBlur = 0;

    // faísca de luz
    ctx.beginPath();
    ctx.ellipse(c - R * 0.32, c - R * 0.4, R * 0.22, R * 0.12, -0.6, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,.7)";
    ctx.fill();

    requestAnimationFrame(desenhar);
  }
  desenhar();

  /* ---------- Início ---------- */
  async function iniciar() {
    try {
      const cfg = await (await fetch("/api/config")).json();
      estado.nome = cfg.nome;
      estado.online = cfg.online;
    } catch (_) {}
    const oi = estado.nome ? `Oi, ${estado.nome}! Eu sou a Pink.` : "Oi! Eu sou a Pink.";
    const complemento = estado.online
      ? " Como posso ajudar?"
      : " Estou no modo básico. Para conversar livremente, coloque sua chave da API no arquivo .env.";
    adicionar("pink", oi + complemento);
    el.legenda.textContent = oi + complemento + " Bata duas palmas para me chamar.";
    let pref = "on";
    try { pref = localStorage.getItem("pink-palmas") || "on"; } catch (_) {}
    if (pref === "on") ligarPalmas();
  }
  iniciar();
})();
