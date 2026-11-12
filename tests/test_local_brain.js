// Roda com: node tests/test_local_brain.js
const assert = require("assert");
const { responder, calcular, createTaskStore } = require("../web/local_brain.js");

assert.strictEqual(calcular("15% de 200"), "O resultado é 30.");
assert.strictEqual(calcular("25 * 4 + 10"), "O resultado é 110.");
assert.strictEqual(calcular("raiz quadrada de 144"), "O resultado é 12.");
assert.ok(calcular("10 / 0").includes("zero"));
assert.ok(calcular("alert(1)").includes("Não consegui"));

const store = createTaskStore();
assert.ok(store.describe().includes("vazia"));
const rAdd = responder("Anota estudar inglês", {}, store);
assert.ok(rAdd.text.includes("estudar inglês"));
assert.strictEqual(rAdd.client_actions[0].type, "tasks_updated");
assert.ok(responder("Quais são meus lembretes?", {}, store).text.includes("estudar inglês"));
const rDone = responder("Concluir tarefa 1", {}, store);
assert.ok(rDone.text.includes("concluída"));

const rTimer = responder("Inicia um pomodoro", {}, store);
assert.strictEqual(rTimer.client_actions[0].type, "timer_start");
assert.strictEqual(rTimer.client_actions[0].seconds, 1500);

const rClima = responder("Como está o tempo em Curitiba?", {}, store);
assert.strictEqual(rClima.client_actions[0].type, "weather");
assert.strictEqual(rClima.client_actions[0].city, "Curitiba");

const rSite = responder("Abrir YouTube", {}, store);
assert.strictEqual(rSite.client_actions[0].type, "open_url");
assert.ok(rSite.client_actions[0].url.includes("youtube.com"));

const rPers = responder("Muda seu nome para Aurora", {}, store);
assert.strictEqual(rPers.client_actions[0].value, "Aurora");

const rOi = responder("Oi", { assistantName: "Aurora", userName: "Manu" }, store);
assert.ok(rOi.text.includes("Aurora"));
assert.ok(rOi.text.includes("Manu"));

console.log("local_brain: todos os testes passaram");
