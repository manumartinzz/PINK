/* Pink — cérebro local no navegador (usado quando roda no GitHub Pages / sem servidor Python) */
(() => {
  "use strict";

  const DIAS = [
    "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira",
    "sexta-feira", "sábado", "domingo",
  ];
  const MESES = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];

  const SITES = {
    youtube: "youtube.com",
    google: "google.com",
    gmail: "mail.google.com",
    github: "github.com",
    whatsapp: "web.whatsapp.com",
    spotify: "open.spotify.com",
    netflix: "netflix.com",
    instagram: "instagram.com",
    linkedin: "linkedin.com",
    maps: "maps.google.com",
    mapas: "maps.google.com",
    drive: "drive.google.com",
    chatgpt: "chatgpt.com",
    claude: "claude.ai",
    pinterest: "pinterest.com",
    canva: "canva.com",
    tiktok: "tiktok.com",
    notion: "notion.so",
    wikipedia: "pt.wikipedia.org",
    duolingo: "duolingo.com",
    classroom: "classroom.google.com",
    meet: "meet.google.com",
    shopee: "shopee.com.br",
    shein: "shein.com",
  };

  const PIADAS = [
    "Por que o computador foi ao médico? Porque estava com um vírus e não parava de espirrar arquivos!",
    "O que a impressora falou para a folha de papel? Essa história é minha ou é impressão minha?",
    "Qual é o café favorito do programador? O Java bem forte!",
    "Por que o livro de matemática ficou triste? Porque tinha muitos problemas.",
    "O que o zero disse para o oito? Adorei o seu cinto novo!",
    "Por que a Wi-Fi não gosta de fofoca? Porque sempre cai no meio da conversa.",
    "Qual é a tecla mais espaçosa do teclado? A barra de espaço, claro!",
    "O que uma estrela falou para a outra? Você brilha muito, amiga!",
  ];

  const CURIOSIDADES = [
    "Você sabia que Ada Lovelace escreveu o primeiro algoritmo da história para um computador ainda no século dezenove?",
    "Você sabia que a atriz e inventora Hedy Lamarr criou a base da tecnologia usada hoje no Wi-Fi e no Bluetooth?",
    "Você sabia que as lontras marinhas dormem de mãos dadas para não se separarem com a correnteza?",
    "Você sabia que um dia em Vênus dura mais tempo do que um ano inteiro lá?",
    "Você sabia que Katherine Johnson fez os cálculos de trajetória que levaram a NASA até a Lua com segurança?",
    "Você sabia que o polvo tem três corações e sangue azul?",
    "Você sabia que existem mais estrelas no universo observável do que grãos de areia em todas as praias da Terra?",
  ];

  const MOTIVACIONAIS = [
    "Você não precisa ter tudo resolvido hoje; só precisa dar o próximo passo com confiança.",
    "Grandes conquistas começam com pequenos hábitos feitos todos os dias. Eu acredito no seu potencial!",
    "Se o plano A não deu certo, respira fundo: o alfabeto tem mais vinte e cinco letras esperando por você.",
    "Seu brilho não precisa apagar o de ninguém. Vai lá e mostra do que você é capaz!",
    "Cada minuto que você dedica a aprender algo novo é um superpoder que ninguém pode tirar de você.",
  ];

  const PERSONALIDADES = {
    carinhosa: "Que bom falar com você! Tô aqui pra tudo que precisar.",
    jarvis: "Sistemas operacionais prontos às suas ordens.",
    divertida: "Eba, cheguei! Bora fazer acontecer!",
    estudos: "Modo foco ativado. Vamos organizar suas metas?",
  };

  function semAcentos(str) {
    return String(str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function escaparRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function escolherAleatorio(lista) {
    return lista[Math.floor(Math.random() * lista.length)];
  }

  /* ---- Calculadora segura (parser próprio, sem eval) ---- */
  function normalizarExpressao(texto) {
    let s = String(texto || "").trim().toLowerCase();
    s = s.replace(/^(?:a|o)\s+/, "");
    s = s.replace(/[?!.=]+$/, "").trim();
    s = s.replace(/(\d+(?:[.,]\d+)?)\s*%\s*de\s*(\d+(?:[.,]\d+)?)/g, "($1/100)*($2)");
    s = s.replace(/raiz\s+quadrada\s+de\s+(\d+(?:[.,]\d+)?)/g, "sqrt($1)");
    s = s.replace(/raiz\s+de\s+(\d+(?:[.,]\d+)?)/g, "sqrt($1)");
    s = s.replace(/,/g, ".");
    s = s.replace(/\b(?:vezes|x)\b/g, "*");
    s = s.replace(/\bdividido\s+por\b/g, "/");
    s = s.replace(/\bmais\b/g, "+");
    s = s.replace(/\bmenos\b/g, "-");
    s = s.replace(/\belevado\s+a\b/g, "^");
    s = s.replace(/\*\*/g, "^").replace(/×/g, "*").replace(/÷/g, "/");
    return s.trim();
  }

  function tokenizar(expr) {
    const tokens = [];
    let i = 0;
    while (i < expr.length) {
      const ch = expr[i];
      if (/\s/.test(ch)) { i++; continue; }
      if (/\d|\./.test(ch)) {
        let num = "";
        while (i < expr.length && /[\d.]/.test(expr[i])) {
          num += expr[i++];
        }
        if (num.split(".").length > 2) throw new Error("Número inválido");
        tokens.push({ tipo: "num", valor: parseFloat(num) });
        continue;
      }
      if (/[a-z]/i.test(ch)) {
        let id = "";
        while (i < expr.length && /[a-z]/i.test(expr[i])) {
          id += expr[i++];
        }
        tokens.push({ tipo: "id", valor: id.toLowerCase() });
        continue;
      }
      if ("+-*/%^()".includes(ch)) {
        tokens.push({ tipo: "op", valor: ch });
        i++;
        continue;
      }
      throw new Error("Símbolo inválido");
    }
    return tokens;
  }

  function avaliarTokens(tokens) {
    let pos = 0;
    const peek = () => tokens[pos];
    const next = () => tokens[pos++];

    function parseExpr() {
      let val = parseTerm();
      while (peek() && peek().tipo === "op" && (peek().valor === "+" || peek().valor === "-")) {
        const op = next().valor;
        const rhs = parseTerm();
        val = op === "+" ? val + rhs : val - rhs;
      }
      return val;
    }

    function parseTerm() {
      let val = parsePower();
      while (peek() && peek().tipo === "op" && "*/%".includes(peek().valor)) {
        const op = next().valor;
        const rhs = parsePower();
        if ((op === "/" || op === "%") && rhs === 0) {
          throw new Error("ZERO_DIV");
        }
        if (op === "*") val *= rhs;
        else if (op === "/") val /= rhs;
        else val %= rhs;
      }
      return val;
    }

    function parsePower() {
      const base = parseUnary();
      if (peek() && peek().tipo === "op" && peek().valor === "^") {
        next();
        const exp = parsePower();
        if (Math.abs(exp) > 100 || Math.abs(base) > 10000) throw new Error("Potência grande");
        return Math.pow(base, exp);
      }
      return base;
    }

    function parseUnary() {
      if (peek() && peek().tipo === "op" && (peek().valor === "+" || peek().valor === "-")) {
        const op = next().valor;
        return op === "-" ? -parseUnary() : parseUnary();
      }
      return parsePrimary();
    }

    function parsePrimary() {
      const tok = next();
      if (!tok) throw new Error("Fim inesperado");
      if (tok.tipo === "num") return tok.valor;
      if (tok.tipo === "id") {
        if (tok.valor === "pi") return Math.PI;
        if (tok.valor === "e") return Math.E;
        if (tok.valor === "sqrt" || tok.valor === "raiz" || tok.valor === "abs") {
          const abre = next();
          if (!abre || abre.valor !== "(") throw new Error("Parêntese esperado");
          const arg = parseExpr();
          const fecha = next();
          if (!fecha || fecha.valor !== ")") throw new Error("Parêntese esperado");
          if (tok.valor === "abs") return Math.abs(arg);
          if (arg < 0) throw new Error("Raiz negativa");
          return Math.sqrt(arg);
        }
        throw new Error("Identificador inválido");
      }
      if (tok.tipo === "op" && tok.valor === "(") {
        const val = parseExpr();
        const fecha = next();
        if (!fecha || fecha.valor !== ")") throw new Error("Parêntese não fechado");
        return val;
      }
      throw new Error("Token inesperado");
    }

    const res = parseExpr();
    if (pos !== tokens.length || !Number.isFinite(res)) {
      throw new Error("Expressão inválida");
    }
    return res;
  }

  function calcular(expressao) {
    const expr = normalizarExpressao(expressao);
    if (!expr || expr.length > 120) {
      return "Não entendi essa conta. Pode falar os números de novo?";
    }
    try {
      const val = avaliarTokens(tokenizar(expr));
      const fmt = Math.abs(val - Math.round(val)) < 1e-9
        ? String(Math.round(val))
        : String(Number(val.toFixed(4))).replace(".", ",");
      return `O resultado é ${fmt}.`;
    } catch (e) {
      if (e && e.message === "ZERO_DIV") return "Não dá para dividir por zero!";
      return "Não consegui calcular essa expressão.";
    }
  }

  /* ---- Tarefas em localStorage ---- */
  function createTaskStore(storageKey = "pink-tasks") {
    let mem = [];
    const temLS = typeof localStorage !== "undefined";

    function load() {
      if (!temLS) return mem.slice();
      try {
        const d = JSON.parse(localStorage.getItem(storageKey) || "[]");
        return Array.isArray(d) ? d : [];
      } catch (_) {
        return [];
      }
    }

    function save(lista) {
      mem = lista.slice();
      if (temLS) {
        try { localStorage.setItem(storageKey, JSON.stringify(lista)); } catch (_) {}
      }
    }

    return {
      list() {
        return load();
      },
      add(text) {
        const limpo = String(text || "").trim();
        if (!limpo) return { msg: "Me diga o que você quer anotar nos lembretes.", action: null, tasks: load() };
        const lista = load();
        const novoId = lista.reduce((m, t) => Math.max(m, t.id || 0), 0) + 1;
        lista.push({ id: novoId, text: limpo, done: false, created_at: new Date().toISOString() });
        save(lista);
        return { msg: `Anotei nos seus lembretes: ${limpo}.`, action: { type: "tasks_updated" }, tasks: lista };
      },
      toggle(id) {
        const lista = load().map((t) => (t.id === id ? { ...t, done: !t.done } : t));
        save(lista);
        return lista;
      },
      removeById(id) {
        const lista = load().filter((t) => t.id !== id);
        save(lista);
        return lista;
      },
      complete(ref) {
        const alvo = String(ref || "").trim();
        const lista = load();
        const pendentes = lista.filter((t) => !t.done);
        let escolhida = null;
        if (/^\d+$/.test(alvo)) {
          const idx = parseInt(alvo, 10) - 1;
          if (idx >= 0 && idx < pendentes.length) escolhida = pendentes[idx];
        }
        if (!escolhida && alvo) {
          const low = alvo.toLowerCase();
          escolhida = pendentes.find((t) => t.text.toLowerCase().includes(low)) || null;
        }
        if (!escolhida) {
          return { msg: `Não encontrei nenhuma tarefa pendente parecida com “${alvo}”.`, action: null };
        }
        escolhida.done = true;
        save(lista);
        return { msg: `Marquei como concluída: ${escolhida.text}. Mandou bem!`, action: { type: "tasks_updated" } };
      },
      del(ref) {
        const alvo = String(ref || "").trim();
        const lista = load();
        let escolhida = null;
        if (/^\d+$/.test(alvo)) {
          const idx = parseInt(alvo, 10) - 1;
          if (idx >= 0 && idx < lista.length) escolhida = lista[idx];
        }
        if (!escolhida && alvo) {
          const low = alvo.toLowerCase();
          escolhida = lista.find((t) => t.text.toLowerCase().includes(low)) || null;
        }
        if (!escolhida) {
          return { msg: `Não encontrei o lembrete “${alvo}”.`, action: null };
        }
        const nova = lista.filter((t) => t.id !== escolhida.id);
        save(nova);
        return { msg: `Removi o lembrete: ${escolhida.text}.`, action: { type: "tasks_updated" } };
      },
      clear(onlyDone = false) {
        const lista = load();
        if (onlyDone) {
          const restantes = lista.filter((t) => !t.done);
          const removidas = lista.length - restantes.length;
          save(restantes);
          return {
            msg: removidas ? `Limpei ${removidas} tarefa(s) concluída(s).` : "Não havia tarefas concluídas para limpar.",
            action: { type: "tasks_updated" },
          };
        }
        save([]);
        return { msg: "Limpei todos os seus lembretes.", action: { type: "tasks_updated" } };
      },
      describe() {
        const lista = load();
        if (!lista.length) return "Sua lista de lembretes está vazia no momento.";
        const pendentes = lista.filter((t) => !t.done);
        const concluidas = lista.length - pendentes.length;
        if (!pendentes.length) return `Você completou todas as ${concluidas} tarefas da lista! Parabéns!`;
        const itens = pendentes.map((t, i) => `${i + 1}. ${t.text}`).join("; ");
        const extra = concluidas ? ` Você também já concluiu ${concluidas}.` : "";
        return `Você tem ${pendentes.length} lembrete(s) pendente(s): ${itens}.${extra}`;
      },
    };
  }

  const defaultStore = createTaskStore();

  function getHoraTexto() {
    const agora = new Date();
    const hh = String(agora.getHours()).padStart(2, "0");
    const mm = String(agora.getMinutes()).padStart(2, "0");
    const weekday = (agora.getDay() + 6) % 7; // 0 = segunda
    return `Agora são ${hh}:${mm} de ${DIAS[weekday]}, ${agora.getDate()} de ${MESES[agora.getMonth()]} de ${agora.getFullYear()}.`;
  }

  function responder(texto, config = {}, store = defaultStore) {
    const bruto = String(texto || "").trim();
    if (!bruto) {
      return { text: "Não ouvi nada. Pode repetir?", actions: [], client_actions: [] };
    }

    const nomeIA = String(config.assistantName || "Pink").trim() || "Pink";
    const nomeUser = String(config.userName || "").trim();
    const personalidade = PERSONALIDADES[config.personality] ? config.personality : "carinhosa";
    const cidadePadrao = String(config.city || "Curitiba").trim() || "Curitiba";
    const chamado = nomeUser ? `, ${nomeUser}` : "";

    const wakeNames = Array.from(new Set([nomeIA.toLowerCase(), "pink"]))
      .sort((a, b) => b.length - a.length)
      .map(escaparRegex)
      .join("|");

    const low = bruto.toLowerCase();
    const rxOnlyWake = new RegExp(`^(?:ei|oi|olá|ola|ok|hey)?\\s*(?:${wakeNames})[!?. ]*$`, "i");
    if (rxOnlyWake.test(low)) {
      let resp = `Pois não${chamado}? Estou te ouvindo.`;
      if (personalidade === "jarvis") resp = `Às suas ordens${chamado}. Em que posso ajudar?`;
      else if (personalidade === "divertida") resp = `Oiê${chamado}! Tô aqui ligadíssima, manda ver!`;
      return { text: resp, actions: [], client_actions: [] };
    }

    const rxLeadWake = new RegExp(`^\\s*(?:(?:ei|ok|hey)\\s+)?(?:${wakeNames})[,!.: ]+\\s*`, "i");
    const rxOiWake = new RegExp(`^\\s*(?:oi|olá|ola)\\s+(?:${wakeNames})[,!.: ]+(.+)$`, "i");

    let t = low.replace(rxLeadWake, "").trim();
    let tOrig = bruto.replace(rxLeadWake, "").trim();
    const mOiWake = low.match(rxOiWake);
    if (mOiWake) {
      t = mOiWake[1].trim();
      tOrig = bruto.replace(new RegExp(`^\\s*(?:oi|olá|ola)\\s+(?:${wakeNames})[,!.: ]+`, "i"), "").trim();
    } else {
      const mOiCmd = t.match(/^\s*(?:oi+|ol[aá]|hey|oie+)[,!. ]+\s*(.+)$/);
      if (mOiCmd && mOiCmd[1].trim().length > 2) {
        t = mOiCmd[1].trim();
        tOrig = tOrig.replace(/^\s*(?:oi+|ol[aá]|hey|oie+)[,!. ]+\s*/i, "").trim();
      }
    }

    const tNorm = semAcentos(t);

    // 1) Personalização
    const mIA = tOrig.match(/(?:mud[ae]r?\s+(?:o\s+)?seu\s+nome\s+para|agora\s+voc[êe]\s+se\s+chama|seu\s+novo\s+nome\s+[eé]|te\s+chamar\s+de)\s+([a-zA-ZÀ-ÿ0-9_-]{2,24})/i);
    if (mIA) {
      const novo = mIA[1].trim();
      const cap = novo.charAt(0).toUpperCase() + novo.slice(1);
      return {
        text: `Adorei! A partir de agora pode me chamar de ${cap}.`,
        actions: [`Nome alterado para ${cap}`],
        client_actions: [{ type: "set_pref", key: "assistantName", value: cap }],
      };
    }

    const mUser = tOrig.match(/(?:meu\s+nome\s+[eé]|pode\s+me\s+chamar\s+de|me\s+chamo)\s+([a-zA-ZÀ-ÿ ]{2,24})/i);
    if (mUser) {
      const unome = mUser[1].trim().replace(/[.!?]+$/, "");
      return {
        text: `Prazer, ${unome}! Vou lembrar de te chamar assim.`,
        actions: [`Seu nome: ${unome}`],
        client_actions: [{ type: "set_pref", key: "userName", value: unome }],
      };
    }

    if (/tema|paleta|cor|modo\s+escuro|visual/.test(tNorm)) {
      const temas = [
        [/rosa\s*futuro|futurist|hologram/, "rosa-futuro", "Rosa Futuro HUD"],
        [/rose\s*gold|dourad|cobre/, "rose-gold", "Rose Gold"],
        [/lilas|roxo|lavanda|galax/, "lilas-galaxy", "Lilás Galáxia"],
        [/cereja|cyber|escuro|noturno|dark/, "cereja-cyber", "Cereja Cyber"],
        [/rosa\s*neon|rosa\s*classico|tema\s*rosa|cor\s*rosa/, "rosa-neon", "Rosa Neon"],
      ];
      for (const [rx, cod, titulo] of temas) {
        if (rx.test(tNorm)) {
          return {
            text: `Mudei o visual para ${titulo}. Ficou um arraso!`,
            actions: [`Tema: ${titulo}`],
            client_actions: [{ type: "set_pref", key: "theme", value: cod }],
          };
        }
      }
    }

    if (/personalidade|jeito|modo\s+(?:jarvis|divertida|estudos|carinhosa|elegante|doce)/.test(tNorm)) {
      const modos = [
        [/\bjarvis\b|elegante/, "jarvis", "Jarvis Elegante"],
        [/divertida|animada|engracada/, "divertida", "Divertida"],
        [/estudos?|foco|produtiv/, "estudos", "Foco & Estudos"],
        [/carinhosa|doce|amigavel/, "carinhosa", "Doce & Amigável"],
      ];
      for (const [rx, cod, titulo] of modos) {
        if (rx.test(tNorm)) {
          return {
            text: `Personalidade ajustada para ${titulo}.`,
            actions: [`Modo: ${titulo}`],
            client_actions: [{ type: "set_pref", key: "personality", value: cod }],
          };
        }
      }
    }

    if (/holograma|orbe/.test(tNorm)) {
      if (tNorm.includes("estelar") || tNorm.includes("estrela")) {
        return {
          text: "Ativei o holograma estelar com partículas brilhantes!",
          actions: ["Holograma: Estelar"],
          client_actions: [{ type: "set_pref", key: "orbStyle", value: "estelar" }],
        };
      }
      if (tNorm.includes("cristal") || tNorm.includes("hexag") || tNorm.includes("jarvis")) {
        return {
          text: "Ativei o holograma Cristal Jarvis!",
          actions: ["Holograma: Cristal Jarvis"],
          client_actions: [{ type: "set_pref", key: "orbStyle", value: "cristal" }],
        };
      }
      if (tNorm.includes("orbital") || tNorm.includes("classico")) {
        return {
          text: "Voltei para o holograma Orbital clássico.",
          actions: ["Holograma: Orbital"],
          client_actions: [{ type: "set_pref", key: "orbStyle", value: "orbital" }],
        };
      }
    }

    // 2) Timer / Pomodoro
    if (/(?:parar?|cancelar?|desligar?)\s+(?:o\s+)?(?:timer|cronometro|pomodoro)/.test(tNorm)) {
      return { text: "Timer parado.", actions: ["Timer parado."], client_actions: [{ type: "timer_stop" }] };
    }
    if (/\bpomodoro\b/.test(tNorm)) {
      const mMin = tNorm.match(/(\d+(?:[.,]\d+)?)\s*(?:min|minutos?)/);
      const mins = mMin ? parseFloat(mMin[1].replace(",", ".")) : 25;
      const segs = Math.max(5, Math.round(mins * 60));
      const msg = `Iniciando timer de ${Math.round(mins)} minutos para Pomodoro. Bom foco!`;
      return { text: msg, actions: [msg], client_actions: [{ type: "timer_start", seconds: segs, label: "Pomodoro" }] };
    }
    const mTimer = tNorm.match(/(?:timer|cronometro|temporizador|alarme|pausa|contagem(?:\s+regressiva)?)(?:\s+(?:de|para|em))?\s+(\d+(?:[.,]\d+)?)\s*(segundos?|seg|s|minutos?|min|m|horas?|h)\b(?:\s+(?:para|de)\s+(.+))?/) ||
      tNorm.match(/(?:marca|coloca|inicia|comeca|ativa)\s+(?:um\s+)?(?:timer|cronometro|pausa)?\s*(?:de\s+)?(\d+(?:[.,]\d+)?)\s*(segundos?|seg|minutos?|min|horas?|h)\b(?:\s+(?:para|de)\s+(.+))?/);
    if (mTimer) {
      const qtd = parseFloat(mTimer[1].replace(",", "."));
      const un = mTimer[2];
      let mins = qtd;
      if (un.startsWith("s")) mins = qtd / 60;
      else if (un.startsWith("h")) mins = qtd * 60;
      if (mins > 0 && mins <= 240) {
        const segs = Math.max(5, Math.round(mins * 60));
        const rot = tNorm.includes("pausa") ? "Pausa" : (mTimer[3] ? mTimer[3].trim() : "Estudos");
        const msg = `Iniciando timer para ${rot}. Bom foco!`;
        return { text: msg, actions: [msg], client_actions: [{ type: "timer_start", seconds: segs, label: rot }] };
      }
    }

    // 3) Tarefas / Lembretes
    if (/(?:limp[ae]r?|apag[ae]r?\s+todas?)\s+(?:as\s+|os\s+)?(?:tarefas?\s+concluid|concluid|lembretes|tarefas|lista)/.test(tNorm)) {
      const res = store.clear(tNorm.includes("concluid"));
      return { text: res.msg, actions: [res.msg], client_actions: res.action ? [res.action] : [] };
    }
    const mAdd = tOrig.match(/^(?:anot[ae]r?|lembr[ae]r?(?:\s+de)?|me\s+lembr[ae]r?(?:\s+de)?|adicion[ae]r?(?:\s+(?:tarefa|lembrete|na\s+lista))?|coloc[ae]r?\s+na\s+lista(?:\s+de\s+tarefas)?)\s*[:\-]?\s*(.+)/i);
    if (mAdd) {
      const res = store.add(mAdd[1].replace(/\.+$/, ""));
      return { text: res.msg, actions: res.action ? [res.msg] : [], client_actions: res.action ? [res.action] : [] };
    }
    if (/(?:quais\s+(?:sao\s+)?(?:os\s+|meus\s+)?(?:lembretes|tarefas)|minha\s+lista(?:\s+de\s+tarefas)?|ver\s+(?:lembretes|tarefas)|o\s+que\s+(?:eu\s+)?tenho\s+(?:para|pra)\s+fazer)/.test(tNorm)) {
      return { text: store.describe(), actions: [], client_actions: [] };
    }
    const mDone = tOrig.match(/^(?:conclu[ir]{1,2}|finaliz[ae]r?|complet[ae]r?|marc[ae]r?\s+como\s+(?:feita?|concluid[ao])|terminei(?:\s+a|\s+o)?)\s*(?:a\s+|o\s+)?(?:tarefa|lembrete)?\s*(.+)/i);
    if (mDone) {
      const res = store.complete(mDone[1].replace(/[.!?]+$/, ""));
      return { text: res.msg, actions: res.action ? [res.msg] : [], client_actions: res.action ? [res.action] : [] };
    }
    const mDel = tOrig.match(/^(?:apag[ae]r?|remov[ae]r?|exclu[ir]{1,2}|tir[ae]r?)\s*(?:o\s+|a\s+)?(?:tarefa|lembrete)\s+(.+)/i);
    if (mDel) {
      const res = store.del(mDel[1].replace(/[.!?]+$/, ""));
      return { text: res.msg, actions: res.action ? [res.msg] : [], client_actions: res.action ? [res.action] : [] };
    }

    // 4) Previsão do tempo
    if (/(?:previsao\s+do\s+tempo|como\s+esta\s+o\s+tempo|\bclima\b|\btemperatura\b|vai\s+chover|esta\s+chovendo|fazendo\s+calor|fazendo\s+frio)/.test(tNorm)) {
      const mCid = tOrig.match(/(?:\bem\b|\bno\b|\bna\b|\bde\b|\bpara\b)\s+([a-zA-ZÀ-ÿ][a-zA-ZÀ-ÿ\s-]{1,35})[?!.]*$/i);
      let cidade = mCid ? mCid[1].trim() : cidadePadrao;
      if (["hoje", "agora", "amanha", "tempo", "momento"].includes(semAcentos(cidade.toLowerCase()))) {
        cidade = cidadePadrao;
      }
      return {
        text: `Consultando a previsão do tempo para ${cidade}...`,
        actions: [],
        client_actions: [{ type: "weather", city: cidade }],
      };
    }

    // 5) Hora e Data
    if (/que horas|que hora\b|\bhoras sao\b|\bque dia e hoje\b|\bqual a data\b|\bdata de hoje\b/.test(tNorm)) {
      return { text: getHoraTexto(), actions: [], client_actions: [] };
    }

    // 6) Status do dispositivo no modo Web
    if (/\bstatus\b|computador|bateria|memoria|\bprocessador\b|\bcpu\b|\bdisco\b/.test(tNorm)) {
      return {
        text: "Estou rodando direto no navegador (modo Web). Para ver o uso completo de processador, memória e disco em tempo real, execute o app Python no seu computador!",
        actions: [],
        client_actions: [],
      };
    }

    // 7) Calculadora
    const mCalc = tNorm.match(/^(?:quanto\s+(?:e|da|sao|vale)|calcul[ae]r?(?:\s+quanto\s+e)?|fa[cz]a?\s+a\s+conta(?:\s+de)?)\s+(.+)/);
    if (mCalc) {
      return { text: calcular(mCalc[1]), actions: [], client_actions: [] };
    }
    if (/^[\d\s.,+\-*/()%^×÷]+$/.test(tOrig) && /[+\-*/%^×÷]/.test(tOrig)) {
      return { text: calcular(tOrig), actions: [], client_actions: [] };
    }
    const mPct = tNorm.match(/(\d+(?:[.,]\d+)?\s*%\s*de\s*\d+(?:[.,]\d+)?)/);
    if (mPct) {
      return { text: calcular(mPct[1]), actions: [], client_actions: [] };
    }
    const mRaiz = tNorm.match(/(raiz\s+(?:quadrada\s+)?de\s+\d+(?:[.,]\d+)?)/);
    if (mRaiz) {
      return { text: calcular(mRaiz[1]), actions: [], client_actions: [] };
    }

    // 8) Entretenimento
    if (/\bpiada\b|me faz rir|conta algo engracado/.test(tNorm)) {
      return { text: escolherAleatorio(PIADAS), actions: [], client_actions: [] };
    }
    if (/curiosidade|fato curioso|me surpreenda|sabia que/.test(tNorm)) {
      return { text: escolherAleatorio(CURIOSIDADES), actions: [], client_actions: [] };
    }
    if (/motivac|motiva|desanimad|conselho|elogio|me elogia|inspir/.test(tNorm)) {
      return { text: escolherAleatorio(MOTIVACIONAIS), actions: [], client_actions: [] };
    }
    if (/cara ou coroa|joga.*moeda|lanca.*moeda/.test(tNorm)) {
      return { text: `Joguei a moeda e deu ${Math.random() < 0.5 ? "Cara" : "Coroa"}!`, actions: [], client_actions: [] };
    }
    const mDado = tNorm.match(/(?:rola|joga).*dado(?:\s+de\s+(\d+))?/);
    if (mDado) {
      const lados = Math.max(2, Math.min(100, parseInt(mDado[1] || "6", 10)));
      const res = 1 + Math.floor(Math.random() * lados);
      return { text: `Rolei um dado de ${lados} lados e caiu ${res}!`, actions: [], client_actions: [] };
    }
    const mEscolha = tOrig.match(/^(?:escolhe|decide|prefere)\s+(?:entre\s+)?(.+?)\s+ou\s+(.+?)[?!.]*$/i);
    if (mEscolha) {
      const op1 = mEscolha[1].trim(), op2 = mEscolha[2].trim();
      return { text: `Entre ${op1} e ${op2}, eu escolheria ${Math.random() < 0.5 ? op1 : op2}!`, actions: [], client_actions: [] };
    }

    // 9) Pesquisa na web (consulta real + Google)
    const mBusca = tOrig.match(/^(?:pesquis[ae]r?|busc[ae]r?|procur[ae]r?|descubr[ae]|investig[ae]r?)\s+(?:por\s+|sobre\s+|no google\s+)?(.+)/i);
    if (mBusca) {
      const consulta = mBusca[1].trim().replace(/[?!.]+$/, "");
      const url = "https://www.google.com/search?q=" + encodeURIComponent(consulta);
      return {
        text: `Pesquisando na web sobre “${consulta}”...`,
        actions: [`Pesquisa web: ${consulta}`],
        client_actions: [
          { type: "web_research", query: consulta },
          { type: "open_url", url, label: "Ver no Google" },
        ],
      };
    }

    // 10) Abrir site
    const mAbrir = tOrig.match(/^(?:abr[ei]r?|abra)\s+(?:o\s+|a\s+|os\s+|as\s+)?(.+)/i);
    if (mAbrir) {
      const alvo = mAbrir[1].trim().replace(/[.!?]+$/, "");
      const chave = alvo.toLowerCase();
      const dominio = SITES[chave] || (chave.includes(".") && !chave.includes(" ") ? chave : "");
      if (dominio) {
        const url = /^https?:\/\//i.test(dominio) ? dominio : `https://${dominio}`;
        return {
          text: `Aqui está o atalho para abrir ${dominio}!`,
          actions: [`Site: ${dominio}`],
          client_actions: [{ type: "open_url", url, label: `Abrir ${dominio}` }],
        };
      }
      return {
        text: `No modo Web eu só consigo abrir sites (como YouTube, Spotify ou Canva). Para abrir aplicativos instalados, rode o app Python no seu computador.`,
        actions: [],
        client_actions: [],
      };
    }

    // 11) Conversa básica
    if (/o\s+que\s+(?:voce\s+)?(?:sabe|pode|consegue)\s+fazer|\bajuda\b|\bcomandos\b/.test(tNorm)) {
      return {
        text: "Você pode me pedir a hora, a previsão do tempo, contas matemáticas, lembretes, um timer Pomodoro, piadas, curiosidades ou abrir sites como YouTube e Spotify. Também dá para dizer: muda seu nome para Aurora, ou tema lilás!",
        actions: [],
        client_actions: [],
      };
    }
    if (/quem\s+e\s+voce|qual\s+(?:o\s+)?seu\s+nome|voce\s+e\s+(?:o\s+)?jarvis|o\s+que\s+voce\s+e/.test(tNorm)) {
      return {
        text: `Eu sou a ${nomeIA}, sua assistente pessoal inspirada no Jarvis! Posso cuidar dos seus lembretes, controlar timers de estudo, ver o clima e personalizar meu visual do seu jeitinho.`,
        actions: [],
        client_actions: [],
      };
    }
    if (/tudo\s+bem|como\s+(?:voce\s+)?esta|como\s+vai/.test(tNorm)) {
      return {
        text: personalidade === "jarvis"
          ? `Todos os meus sistemas estão em cem por cento${chamado}! E com você?`
          : `Estou ótima${chamado}, pronta para te ajudar no que precisar! E você?`,
        actions: [],
        client_actions: [],
      };
    }
    if (/^(?:oi+|ola+|e ai|hey|oie+|hello)\b/.test(tNorm)) {
      return { text: `Oi${chamado}! Eu sou a ${nomeIA}. ${PERSONALIDADES[personalidade]}`, actions: [], client_actions: [] };
    }
    if (/^bom\s+dia\b/.test(tNorm)) {
      return { text: `Bom dia${chamado}! ${PERSONALIDADES[personalidade]}`, actions: [], client_actions: [] };
    }
    if (/^boa\s+tarde\b/.test(tNorm)) {
      return { text: `Boa tarde${chamado}! ${PERSONALIDADES[personalidade]}`, actions: [], client_actions: [] };
    }
    if (/^boa\s+noite\b/.test(tNorm)) {
      return { text: `Boa noite${chamado}! Como posso deixar sua noite mais tranquila?`, actions: [], client_actions: [] };
    }
    if (/obrigad[ao]|valeu|brigad[ao]|agradecid[ao]/.test(tNorm)) {
      return { text: `De nada${chamado}! Sempre que precisar, é só me chamar.`, actions: [], client_actions: [] };
    }
    if (/\btchau\b|ate\s+logo|ate\s+mais|ate\s+amanha/.test(tNorm)) {
      return { text: `Até logo${chamado}! Conta comigo quando voltar.`, actions: [], client_actions: [] };
    }

    // 12) Perguntas abertas e assuntos gerais -> pesquisa automática na web
    const mPerg = tOrig.match(/^(?:quem\s+(?:foi|e|é|sao|são)|o\s+que\s+(?:e|é|sao|são|significa)|(?:me\s+)?(?:fala|conte|explica|diz)\s+(?:sobre|o\s+que\s+[eé]|quem\s+foi)?)\s+(.+)/i);
    const termo = (mPerg ? mPerg[1] : tOrig).trim().replace(/[?!.]+$/, "");
    if (termo.length >= 3) {
      const url = "https://www.google.com/search?q=" + encodeURIComponent(termo);
      return {
        text: `Pesquisando na web sobre “${termo}”...`,
        actions: [`Pesquisa web: ${termo}`],
        client_actions: [
          { type: "web_research", query: termo },
          { type: "open_url", url, label: "Ver no Google" },
        ],
      };
    }

    return {
      text: `Pode falar mais um pouquinho${chamado}? Posso pesquisar qualquer assunto na web, ver o tempo, abrir sites, anotar lembretes ou iniciar um timer de estudos.`,
      actions: [],
      client_actions: [],
    };
  }

  const api = { responder, calcular, createTaskStore, defaultStore };
  if (typeof window !== "undefined") window.PinkLocalBrain = api;
  if (typeof module !== "undefined") module.exports = api;
})();
