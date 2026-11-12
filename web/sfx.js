/* Pink — efeitos sonoros futuristas gerados via Web Audio API */
(() => {
  "use strict";

  let ctx = null;
  let ligado = true;

  function obterCtx() {
    if (!ligado) return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!ctx) ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function nota(c, freq, inicio, duracao, tipo = "sine", volume = 0.08, freqFim = null) {
    const osc = c.createOscillator();
    const ganho = c.createGain();
    osc.type = tipo;
    osc.frequency.setValueAtTime(freq, inicio);
    if (freqFim) {
      osc.frequency.exponentialRampToValueAtTime(freqFim, inicio + duracao);
    }
    ganho.gain.setValueAtTime(0.0001, inicio);
    ganho.gain.exponentialRampToValueAtTime(volume, inicio + 0.018);
    ganho.gain.exponentialRampToValueAtTime(0.0001, inicio + duracao);
    osc.connect(ganho);
    ganho.connect(c.destination);
    osc.start(inicio);
    osc.stop(inicio + duracao + 0.02);
  }

  const PinkSFX = {
    setEnabled(valor) {
      ligado = Boolean(valor);
    },

    click() {
      const c = obterCtx();
      if (!c) return;
      const t = c.currentTime;
      nota(c, 740, t, 0.055, "sine", 0.04, 920);
    },

    wake() {
      const c = obterCtx();
      if (!c) return;
      const t = c.currentTime;
      nota(c, 587.33, t, 0.14, "triangle", 0.07);         // Ré5
      nota(c, 880.0, t + 0.09, 0.22, "sine", 0.08);      // Lá5
      nota(c, 1174.66, t + 0.17, 0.28, "sine", 0.055);   // Ré6
    },

    send() {
      const c = obterCtx();
      if (!c) return;
      const t = c.currentTime;
      nota(c, 520, t, 0.09, "sine", 0.05, 780);
    },

    receive() {
      const c = obterCtx();
      if (!c) return;
      const t = c.currentTime;
      nota(c, 659.25, t, 0.12, "sine", 0.045);           // Mi5
      nota(c, 987.77, t + 0.07, 0.18, "sine", 0.05);     // Si5
    },

    alarm() {
      const c = obterCtx();
      if (!c) return;
      const t = c.currentTime;
      [0, 0.32, 0.64].forEach((off) => {
        nota(c, 783.99, t + off, 0.15, "triangle", 0.09);     // Sol5
        nota(c, 1046.5, t + off + 0.11, 0.22, "sine", 0.085); // Dó6
      });
    },
  };

  window.PinkSFX = PinkSFX;
})();
