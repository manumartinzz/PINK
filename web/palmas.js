/* Pink — detector de duas palmas
 * Escuta o microfone e avisa quando ouve duas palmas seguidas.
 * Ajuste a sensibilidade em CONFIG, se precisar.
 */
(() => {
  "use strict";

  const CONFIG = {
    picoMinimo: 0.30,     // volume mínimo (0 a 1) para contar como palma. Menor = mais sensível
    multiplicador: 5,     // quantas vezes acima do barulho do ambiente
    intervaloMin: 180,    // ms mínimos entre as duas palmas
    intervaloMax: 900,    // ms máximos entre as duas palmas
    recarga: 2500,        // ms de pausa depois de acordar a Pink
  };

  /* Lógica pura: recebe o pico de volume a cada ~10 ms e diz se houve 2 palmas. */
  function criarDetector(cfg = CONFIG) {
    let piso = 0.02;        // barulho de fundo, aprendido aos poucos
    let ultimoPico = -1e9;
    let primeira = 0;
    let caiu = true;        // o som precisa silenciar entre uma palma e outra
    let bloqueadoAte = 0;

    return function processar(pico, agora, ocupado) {
      if (ocupado || agora < bloqueadoAte) { primeira = 0; return false; }
      const limite = Math.max(cfg.picoMinimo, piso * cfg.multiplicador);

      if (pico < limite) piso += (pico - piso) * 0.01;
      if (pico < limite * 0.4) caiu = true;

      if (primeira && agora - primeira > cfg.intervaloMax) primeira = 0;

      if (pico > limite && agora - ultimoPico > 120) {
        ultimoPico = agora;
        if (primeira && caiu && agora - primeira >= cfg.intervaloMin) {
          primeira = 0;
          bloqueadoAte = agora + cfg.recarga;
          return true;
        }
        primeira = agora;
        caiu = false;
      }
      return false;
    };
  }

  /* Ligação com o microfone */
  let ctx = null, stream = null, no = null, ganho = null;

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

  async function iniciar({ aoDetectar, ocupado, aoNivel }) {
    await parar();
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const url = URL.createObjectURL(new Blob([codigoWorklet], { type: "application/javascript" }));
    await ctx.audioWorklet.addModule(url);
    URL.revokeObjectURL(url);

    const fonte = ctx.createMediaStreamSource(stream);
    no = new AudioWorkletNode(ctx, "pico");
    ganho = ctx.createGain();
    ganho.gain.value = 0;                       // silencioso: só serve para manter o nó ativo
    fonte.connect(no); no.connect(ganho); ganho.connect(ctx.destination);

    const detectar = criarDetector();
    no.port.onmessage = (e) => {
      if (aoNivel) aoNivel(e.data);
      if (detectar(e.data, performance.now(), ocupado())) aoDetectar();
    };

    // Navegadores podem deixar o áudio "dormindo" até o primeiro clique.
    if (ctx.state === "suspended") {
      const acordar = () => { ctx.resume(); };
      window.addEventListener("pointerdown", acordar, { once: true });
      window.addEventListener("keydown", acordar, { once: true });
    }
    return ctx.state;
  }

  async function parar() {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    if (ctx) { try { await ctx.close(); } catch (_) {} }
    ctx = stream = no = ganho = null;
  }

  const api = { iniciar, parar, criarDetector, CONFIG };
  if (typeof window !== "undefined") window.PinkPalmas = api;
  if (typeof module !== "undefined") module.exports = api;
})();
