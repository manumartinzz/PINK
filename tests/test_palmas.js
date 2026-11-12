// Roda com: node tests/test_palmas.js
const assert = require("assert");
const { criarDetector } = require("../web/palmas.js");

// Simula o microfone: um pico a cada 10 ms. "palmas" = instantes (ms) com som forte.
function simular(palmas, { duracao = 4000, ruido = 0.02, contínuo = false, ocupadoAte = 0 } = {}) {
  const det = criarDetector();
  let disparos = 0;
  for (let t = 0; t < duracao; t += 10) {
    let pico = ruido;
    if (contínuo) pico = 0.6;
    for (const p of palmas) {
      const d = t - p;
      if (d >= 0 && d < 60) pico = Math.max(pico, 0.9 * (1 - d / 60) + 0.1); // estalo que decai
    }
    if (det(pico, t, t < ocupadoAte)) disparos++;
  }
  return disparos;
}

assert.strictEqual(simular([1000]), 0, "uma palma não acorda");
assert.strictEqual(simular([1000, 1400]), 1, "duas palmas acordam");
assert.strictEqual(simular([1000, 1250]), 1, "duas palmas rápidas acordam");
assert.strictEqual(simular([1000, 2500]), 0, "palmas muito espaçadas não contam");
assert.strictEqual(simular([1000, 1400, 1800]), 1, "terceira palma logo depois é ignorada");
assert.strictEqual(simular([], { contínuo: true }), 0, "barulho contínuo não acorda");
assert.strictEqual(simular([1000, 1400], { ocupadoAte: 2000 }), 0, "ignora palmas enquanto a Pink fala");
assert.strictEqual(simular([1000, 1400, 5000, 5400], { duracao: 8000 }), 2, "acorda de novo depois da pausa");
console.log("palmas: todos os testes passaram");
