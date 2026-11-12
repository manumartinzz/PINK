/* Pink — detector de duas palmas (alta precisão + fallback AnalyserNode + recuperação pós-suspensão) */
(() => {
  "use strict";

  const SENSIBILIDADES = {
    alta: { picoMinimo: 0.045, multiplicador: 2.8 },
    normal: { picoMinimo: 0.09, multiplicador: 3.5 },
    baixa: { picoMinimo: 0.20, multiplicador: 4.5 },
  };

  const CONFIG = {
    picoMinimo: 0.09,     // volume mínimo (0 a 1) para contar como palma. Menor = mais sensível
    multiplicador: 3.5,   // quantas vezes acima do barulho do ambiente
    intervaloMin: 140,    // ms mínimos entre as duas palmas
    intervaloMax: 1200,   // ms máximos entre as duas palmas
    recarga: 2500,        // ms de pausa depois de acordar a Pink
  };

  /* Lógica pura: recebe o pico de volume a cada ~10–16 ms e diz se houve 2 palmas. */
  function criarDetector(cfg = CONFIG, hooks = {}) {
    let piso = 0.015;       // barulho de fundo, aprendido aos poucos
    let ultimoPico = -1e9;
    let primeira = 0;
    let caiu = true;        // o som precisa silenciar entre uma palma e outra
    let bloqueadoAte = 0;

    return function processar(pico, agora, ocupado) {
      if (ocupado || agora < bloqueadoAte) { primeira = 0; return false; }
      const minPico = cfg.picoMinimo ?? CONFIG.picoMinimo;
      const mult = cfg.multiplicador ?? CONFIG.multiplicador;
      const limite = Math.max(minPico, piso * mult);

      if (pico < limite) {
        piso = Math.min(0.12, piso + (pico - piso) * 0.015);
      }
      if (pico < limite * 0.45) caiu = true;

      if (primeira && agora - primeira > (cfg.intervaloMax ?? CONFIG.intervaloMax)) {
        primeira = 0;
      }

      if (pico > limite && agora - ultimoPico > 110) {
        ultimoPico = agora;
        if (primeira && caiu && agora - primeira >= (cfg.intervaloMin ?? CONFIG.intervaloMin)) {
          primeira = 0;
          bloqueadoAte = agora + (cfg.recarga ?? CONFIG.recarga);
          return true;
        }
        primeira = agora;
        caiu = false;
        if (hooks.onPrimeira) hooks.onPrimeira();
      }
      return false;
    };
  }

  /* Ligação com o microfone */
  let ctx = null, stream = null, no = null, ganho = null, timerFallback = null;
  let ultimasOpcoes = null, sensAtual = "normal", ativo = false;

  const codigoWorklet = `
    class Pico extends AudioWorkletProcessor {
      constructor() { super(); this.n = 0; this.max = 0; }
      process(entradas) {
        const canal = entradas[0] && entradas[0][0];
        if (canal) {
          for (let i = 0; i < canal.length; i++) {
            const a = Math.abs(canal[i]);
            if (a > this.max) this.max = a;
          }
          if (++this.n >= 4) { this.port.postMessage(this.max); this.n = 0; this.max = 0; }
        }
        return true;
      }
    }
    registerProcessor("pico", Pico);`;

  function cfgAtiva() {
    const ajuste = SENSIBILIDADES[sensAtual] || SENSIBILIDADES.normal;
    return { ...CONFIG, ...ajuste };
  }

  function iniciarAnalyserFallback(fonte, detectar, aoNivel) {
    if (timerFallback) clearInterval(timerFallback);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    fonte.connect(analyser);
    const buf = new Float32Array(analyser.fftSize);
    timerFallback = setInterval(() => {
      if (!ctx || ctx.state !== "running") return;
      analyser.getFloatTimeDomainData(buf);
      let pico = 0;
      for (let i = 0; i < buf.length; i++) {
        const a = Math.abs(buf[i]);
        if (a > pico) pico = a;
      }
      if (aoNivel) aoNivel(pico);
      if (detectar(pico, performance.now(), ultimasOpcoes.ocupado())) {
        ultimasOpcoes.aoDetectar();
      }
    }, 16);
  }

  async function iniciar(opcoes) {
    ultimasOpcoes = opcoes;
    if (opcoes.sensibilidade && SENSIBILIDADES[opcoes.sensibilidade]) {
      sensAtual = opcoes.sensibilidade;
    }
    await parar(true);
    ativo = true;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
    } catch (_) {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    ctx = new AudioCtx();
    try { await ctx.resume(); } catch (_) {}

    const fonte = ctx.createMediaStreamSource(stream);
    const detectar = criarDetector(cfgAtiva(), {
      onPrimeira: () => {
        if (ultimasOpcoes && ultimasOpcoes.aoPrimeira) ultimasOpcoes.aoPrimeira();
      },
    });

    let recebeuWorklet = false;
    if (ctx.audioWorklet) {
      try {
        const url = URL.createObjectURL(new Blob([codigoWorklet], { type: "application/javascript" }));
        await ctx.audioWorklet.addModule(url);
        URL.revokeObjectURL(url);

        no = new AudioWorkletNode(ctx, "pico");
        ganho = ctx.createGain();
        ganho.gain.value = 0;
        fonte.connect(no);
        no.connect(ganho);
        ganho.connect(ctx.destination);

        no.port.onmessage = (e) => {
          recebeuWorklet = true;
          if (ultimasOpcoes.aoNivel) ultimasOpcoes.aoNivel(e.data);
          if (detectar(e.data, performance.now(), ultimasOpcoes.ocupado())) {
            ultimasOpcoes.aoDetectar();
          }
        };

        setTimeout(() => {
          if (ativo && ctx && !recebeuWorklet && !timerFallback) {
            iniciarAnalyserFallback(fonte, detectar, ultimasOpcoes.aoNivel);
          }
        }, 700);
      } catch (_) {
        iniciarAnalyserFallback(fonte, detectar, ultimasOpcoes.aoNivel);
      }
    } else {
      iniciarAnalyserFallback(fonte, detectar, ultimasOpcoes.aoNivel);
    }

    // Se o notebook entrar em suspensão e voltar, reativa automaticamente.
    const tracks = stream.getAudioTracks();
    if (tracks[0]) {
      tracks[0].addEventListener("ended", () => {
        if (ativo && ultimasOpcoes) {
          setTimeout(() => { if (ativo) iniciar(ultimasOpcoes).catch(() => {}); }, 500);
        }
      });
    }

    if (ctx.state === "suspended") {
      if (opcoes.aoSuspender) opcoes.aoSuspender(true);
      const acordar = async () => {
        if (ctx) {
          try { await ctx.resume(); } catch (_) {}
          if (ctx.state === "running" && opcoes.aoSuspender) opcoes.aoSuspender(false);
        }
      };
      window.addEventListener("pointerdown", acordar, { once: true });
      window.addEventListener("keydown", acordar, { once: true });
      window.addEventListener("touchstart", acordar, { once: true });
    } else if (opcoes.aoSuspender) {
      opcoes.aoSuspender(false);
    }

    return ctx.state;
  }

  async function parar(manterAtivo = false) {
    if (!manterAtivo) ativo = false;
    if (timerFallback) { clearInterval(timerFallback); timerFallback = null; }
    if (stream) stream.getTracks().forEach((t) => t.stop());
    if (ctx) { try { await ctx.close(); } catch (_) {} }
    ctx = stream = no = ganho = null;
  }

  function setSensibilidade(nivel) {
    if (SENSIBILIDADES[nivel]) {
      sensAtual = nivel;
      if (ativo && ultimasOpcoes) {
        iniciar({ ...ultimasOpcoes, sensibilidade: nivel }).catch(() => {});
      }
    }
  }

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && ativo) {
        if (ctx && ctx.state === "suspended") {
          ctx.resume().catch(() => {});
        } else if ((!stream || stream.getTracks().every((t) => t.readyState === "ended")) && ultimasOpcoes) {
          iniciar(ultimasOpcoes).catch(() => {});
        }
      }
    });
  }

  const api = { iniciar, parar, setSensibilidade, criarDetector, CONFIG, SENSIBILIDADES };
  if (typeof window !== "undefined") window.PinkPalmas = api;
  if (typeof module !== "undefined") module.exports = api;
})();
