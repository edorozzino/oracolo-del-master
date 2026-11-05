(function () {
  const { TERRENI, ID, AMBIENTI } = window.Mappe;
  const B = window.BESTIARIO, AB = window.ABITANTI, DIFF = window.DIFFICOLTA;
  const CHIAVE = "oracolo-tavolo-v1";
  const COLORI_PG = ["#3f7fbf", "#8a5cc2", "#2e9c8f", "#c79a2e", "#3b8f4a", "#b05a8f"];
  const COLORI_MOSTRI = ["#a8382c", "#7d2f2a", "#8a4b1f", "#5d6b2f", "#6b3f6e", "#4b4f57"];

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---------------- stato ----------------
  let stato = carica() || null;
  const ui = { vista: leggiVista(), dimensione: 1, pavimento: ID.pietra, vassoioTab: "mostri",
    posa: { tipo: "mostro", chiave: "goblin" }, ultimoMostro: "goblin", ultimoEroe: { stirpe: "elfo", classe: "ranger" }, modo: "muovi", pennello: ID.muro, selezionata: null, tab: "scena", adv: "normale" };

  function leggiVista() { try { return localStorage.getItem("oracolo-vista") === "pianta" ? "pianta" : "iso"; } catch (e) { return "iso"; } }
  function carica() {
    try {
      const s = JSON.parse(localStorage.getItem(CHIAVE));
      return s && Array.isArray(s.celle) && Array.isArray(s.pedine) ? s : null;
    } catch (e) { return null; }
  }
  let salvaTimer;
  function salva() {
    clearTimeout(salvaTimer);
    salvaTimer = setTimeout(() => { try { localStorage.setItem(CHIAVE, JSON.stringify(stato)); } catch (e) { /* nessun salvataggio */ } }, 300);
  }

  function registra(testo, tipo = "lotta") {
    stato.registro.unshift({ testo, tipo, ora: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) });
    stato.registro = stato.registro.slice(0, 60);
  }
  function toast(testo) {
    const t = $("toast"); t.textContent = testo; t.classList.add("on");
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("on"), 2200);
  }

  // ---------------- pedine ----------------
  function occupate(escludi) {
    const s = new Set();
    for (const t of stato.pedine) if (t.id !== escludi) for (let j = 0; j < t.taglia; j++) for (let i = 0; i < t.taglia; i++) s.add((t.x + i) + "," + (t.y + j));
    return s;
  }
  function posa(t, px, py, occ) {
    const cand = window.Mappe.posizioniLibere(stato.celle, stato.cols, stato.rows, px, py, 400, new Set(occ));
    const libera = (x, y) => occ.has(x + "," + y) === false && x < stato.cols && y < stato.rows &&
      window.Mappe.passabile(stato.celle[y * stato.cols + x]);
    const p = cand.find((c) => { for (let j = 0; j < t.taglia; j++) for (let i = 0; i < t.taglia; i++) if (!libera(c.x + i, c.y + j)) return false; return true; }) || cand[0];
    if (p) { t.x = Math.min(p.x, stato.cols - t.taglia); t.y = Math.min(p.y, stato.rows - t.taglia); }
    for (let j = 0; j < t.taglia; j++) for (let i = 0; i < t.taglia; i++) occ.add((t.x + i) + "," + (t.y + j));
  }
  function nuovaPedina(dati) {
    return Object.assign({ id: stato.prossimoId++, x: 0, y: 0, taglia: 1, condizioni: [], iniziativa: null, vel: 30 }, dati);
  }
  function nomeUnico(base) {
    const usati = new Set(stato.pedine.map((p) => p.nome));
    for (let n = 1; ; n++) { const nome = base + " " + n; if (!usati.has(nome)) return nome; }
  }
  function creaMostro(chiave) {
    const m = B[chiave];
    const colore = coloreMostro(chiave);
    return nuovaPedina({ tipo: "mostro", razza: chiave, nome: nomeUnico(m.nome), colore, pf: m.pf, pfMax: m.pf, ca: m.ca, init: m.init, vel: m.vel, taglia: m.taglia, gs: m.gs });
  }
  function coloreMostro(chiave) { return COLORI_MOSTRI[Math.max(0, Object.keys(B).indexOf(chiave)) % COLORI_MOSTRI.length]; }
  function creaPG(i) {
    const base = window.PG_BASE[i % window.PG_BASE.length];
    const nuovo = i >= window.PG_BASE.length || stato.pedine.some((p) => p.nome === base.nome);
    const razze = Object.keys(window.Figure.RAZZE), classi = Object.keys(window.Figure.CLASSI);
    const stirpe = nuovo ? razze[Math.floor(Math.random() * razze.length)] : base.stirpe;
    const classe = nuovo ? classi[Math.floor(Math.random() * classi.length)] : base.classe;
    const nome = nuovo ? nomeUnico("Eroe") : base.nome;
    return nuovaPedina({ tipo: "pg", nome, stirpe, classe, colore: COLORI_PG[i % COLORI_PG.length], pf: base.pf, pfMax: base.pf, ca: base.ca, init: base.init, vel: stirpe === "nano" || stirpe === "halfling" || stirpe === "gnomo" ? 25 : 30 });
  }
  // tavoli salvati prima delle razze: dai a tutti un aspetto
  const VECCHI = { Guerriera: ["nano", "guerriero"], Mago: ["elfo", "mago"], Ladra: ["halfling", "ladro"], Chierico: ["umano", "chierico"] };
  function migra() {
    for (const t of stato.pedine) {
      if (t.tipo === "pg" && !t.stirpe) { const v = VECCHI[t.nome] || ["umano", "guerriero"]; t.stirpe = v[0]; t.classe = v[1]; }
      if (t.tipo !== "pg" && !t.razza) t.razza = "generico";
    }
  }
  const trova = (id) => stato.pedine.find((p) => p.id === id);

  // ---------------- scena ----------------
  function generaScena(ambiente, diff) {
    const seed = window.Oracolo.newSeed();
    const m = window.Mappe.genera(ambiente, seed);
    const pg = stato ? stato.pedine.filter((p) => p.tipo === "pg") : [];
    const registro = stato ? stato.registro : [];
    stato = { cols: m.cols, rows: m.rows, celle: m.celle, pedine: [], registro, prossimoId: stato ? stato.prossimoId : 1,
      scena: null, lotta: { attiva: false, round: 1, indice: 0, ordine: [] } };
    const occ = new Set();
    const eroi = pg.length ? pg : window.PG_BASE.map((_, i) => creaPG(i));
    eroi.forEach((t) => { t.condizioni = []; t.iniziativa = null; posa(t, m.punti.pg[0], m.punti.pg[1], occ); stato.pedine.push(t); });

    const rng = window.Oracolo.mulberry32(seed ^ 0x5bd1e995);
    const d = DIFF[diff], ab = AB[ambiente];
    const capoKey = d.capo ? ab.capi[Math.floor(rng() * ab.capi.length)] : null;
    if (capoKey) { const c = creaMostro(capoKey); posa(c, m.punti.boss[0], m.punti.boss[1], occ); stato.pedine.push(c); }
    for (let k = 0; k < d.gregari; k++) {
      const key = ab.gregari[Math.floor(rng() * ab.gregari.length)];
      const t = creaMostro(key); posa(t, m.punti.mostri[0], m.punti.mostri[1], occ); stato.pedine.push(t);
    }

    const C = window.Oracolo.CARDS;
    const atm = window.Oracolo.draw(C[1], window.Oracolo.newSeed());
    const png = window.Oracolo.draw(C[2], window.Oracolo.newSeed());
    const gancio = window.Oracolo.draw(C[5], window.Oracolo.newSeed());
    const titoli = AMBIENTI[ambiente].titoli;
    stato.scena = {
      ambiente, diff,
      titolo: titoli[Math.floor(rng() * titoli.length)],
      atmosfera: atm.title + ". " + atm.body,
      gancio: gancio.body,
      png: png.title + ": " + png.body + " Segreto: " + png.meta[0][1] + "."
    };
    ui.selezionata = null;
    registra("Nuova scena: " + stato.scena.titolo + " (" + d.nome.toLowerCase() + ").", "scena");
    tavolo && tavolo.terrenoCambiato();
    tavolo && tavolo.adatta();
    aggiorna();
  }

  // ---------------- combattimento ----------------
  const vivo = (t) => t && (t.pf > 0 || t.tipo === "pg");
  function iniziaLotta() {
    const righe = [];
    for (const t of stato.pedine) {
      const r = window.Dadi.d20(t.init || 0);
      t.iniziativa = r.totale; righe.push(t.nome + " (" + r.totale + ")");
    }
    ordinaIniziativa();
    Object.assign(stato.lotta, { attiva: true, round: 1, indice: 0 });
    registra("Iniziativa: " + righe.join(", ") + ".");
    registra("Round 1 · tocca a " + trova(stato.lotta.ordine[0]).nome + ".");
    aggiorna();
  }
  function ordinaIniziativa() {
    const attuale = stato.lotta.attiva ? stato.lotta.ordine[stato.lotta.indice] : null;
    stato.lotta.ordine = stato.pedine.slice()
      .sort((a, b) => (b.iniziativa ?? -99) - (a.iniziativa ?? -99) || (b.init || 0) - (a.init || 0))
      .map((t) => t.id);
    if (attuale != null) stato.lotta.indice = Math.max(0, stato.lotta.ordine.indexOf(attuale));
  }
  function turnoCorrente() { return stato.lotta.attiva ? stato.lotta.ordine[stato.lotta.indice] : null; }
  function passaTurno(dir) {
    const L = stato.lotta; if (!L.attiva || !L.ordine.length) return;
    for (let k = 0; k < L.ordine.length; k++) {
      L.indice += dir;
      if (L.indice >= L.ordine.length) { L.indice = 0; L.round++; }
      if (L.indice < 0) { L.indice = L.ordine.length - 1; L.round = Math.max(1, L.round - 1); }
      if (vivo(trova(L.ordine[L.indice]))) break;
    }
    const t = trova(turnoCorrente());
    if (t) { registra("Round " + L.round + " · tocca a " + t.nome + "."); ui.selezionata = t.id; }
    aggiorna();
  }
  function fineLotta() {
    stato.lotta.attiva = false;
    stato.pedine.forEach((t) => (t.iniziativa = null));
    registra("Combattimento terminato.");
    aggiorna();
  }
  function modificaPF(t, delta) {
    if (!t) return;
    const prima = t.pf;
    t.pf = Math.max(t.tipo === "pg" ? -t.pfMax : 0, Math.min(t.pfMax, t.pf + delta));
    if (t.pf === prima) return;
    registra(t.nome + (delta < 0 ? " subisce " + (-delta) + " danni" : " recupera " + delta + " PF") + " (" + t.pf + "/" + t.pfMax + ")." +
      (t.pf <= 0 && prima > 0 ? (t.tipo === "pg" ? " È a terra!" : " Sconfitto.") : ""));
    aggiorna();
  }
  // Toglie una o più pedine; "Annulla" le rimette dov'erano, anche nell'iniziativa.
  let annullabile = null;
  function rimuovi(ids) {
    ids = [].concat(ids).filter((id) => trova(id));
    if (!ids.length) return;
    const copia = { pedine: stato.pedine.slice(), lotta: JSON.parse(JSON.stringify(stato.lotta)) };
    const nomi = ids.map((id) => trova(id).nome);
    const corrente = turnoCorrente();
    stato.pedine = stato.pedine.filter((p) => !ids.includes(p.id));
    if (stato.lotta.attiva) {
      stato.lotta.ordine = stato.lotta.ordine.filter((x) => !ids.includes(x));
      const i = stato.lotta.ordine.indexOf(corrente);
      stato.lotta.indice = i >= 0 ? i : Math.min(stato.lotta.indice, Math.max(0, stato.lotta.ordine.length - 1));
      if (!stato.lotta.ordine.length) stato.lotta.attiva = false;
    }
    if (ids.includes(ui.selezionata)) ui.selezionata = null;
    const testo = nomi.length === 1 ? nomi[0] + " tolto dal tavolo." : nomi.length + " pedine tolte dal tavolo.";
    registra(testo, "scena");
    annullabile = copia;
    avviso(testo, "Annulla", () => {
      if (!annullabile) return;
      stato.pedine = annullabile.pedine; stato.lotta = annullabile.lotta; annullabile = null;
      registra("Rimozione annullata.", "scena"); aggiorna();
    });
    aggiorna();
  }
  function avviso(testo, azione, fn) {
    const el = $("snack");
    el.innerHTML = `<span>${esc(testo)}</span>` + (azione ? `<button type="button" id="snack-act">${esc(azione)}</button>` : "");
    el.hidden = false;
    if (azione) $("snack-act").onclick = () => { el.hidden = true; fn(); };
    clearTimeout(avviso.t); avviso.t = setTimeout(() => { el.hidden = true; annullabile = null; }, 7000);
  }
  function aggiungi(t) {
    const occ = occupate();
    const c = { x: stato.cols / 2, y: stato.rows / 2 };
    const sel = trova(ui.selezionata); if (sel) { c.x = sel.x; c.y = sel.y; }
    posa(t, c.x, c.y, occ);
    stato.pedine.push(t);
    if (stato.lotta.attiva) { t.iniziativa = window.Dadi.d20(t.init || 0).totale; ordinaIniziativa(); registra(t.nome + " entra in combattimento (iniziativa " + t.iniziativa + ")."); }
    ui.selezionata = t.id;
    aggiorna();
  }

  // ---------------- disegno pannelli ----------------
  function barraPF(t) {
    const f = t.pfMax ? Math.max(0, Math.min(1, t.pf / t.pfMax)) : 0;
    const cls = t.pf <= 0 ? "ko" : f > .5 ? "ok" : f > .25 ? "warn" : "bad";
    return `<span class="hpbar ${cls}"><span style="width:${(f * 100).toFixed(0)}%"></span></span>`;
  }

  function renderIntestazione() {
    const s = stato.scena;
    $("scene-head").innerHTML = s ? `<span class="scene-kicker">${esc(AMBIENTI[s.ambiente].nome)} · ${esc(DIFF[s.diff].nome)}</span><span class="scene-title">${esc(s.titolo)}</span>` : "";
    $("scene-card").innerHTML = s ? `
      <h2>La scena</h2>
      <dl class="scene-dl">
        <div><dt>Atmosfera</dt><dd>${esc(s.atmosfera)}</dd></div>
        <div><dt>Chi c'è</dt><dd>${esc(s.png)}</dd></div>
        <div><dt>Spunto</dt><dd>${esc(s.gancio)}</dd></div>
      </dl>` : "";
  }

  function renderBanner() {
    const L = stato.lotta, b = $("turn-banner");
    b.hidden = !L.attiva;
    if (!L.attiva) return;
    const t = trova(turnoCorrente());
    $("turn-text").innerHTML = `<span class="round">Round ${L.round}</span> Turno di <b>${esc(t ? t.nome : "—")}</b>` +
      (t ? ` <span class="muted">· ${t.vel} ft di movimento</span>` : "");
  }

  function renderHud() {
    const t = trova(ui.selezionata), h = $("hud");
    h.hidden = !t;
    if (!t) return;
    h.innerHTML = `
      <div class="hud-head"><canvas class="ritratto big" data-rit="${t.id}"></canvas><span class="hud-who"><b>${esc(t.nome)}</b><small>${esc(descrivi(t))}</small></span>
        <button type="button" class="x" data-hud="chiudi" aria-label="Chiudi">×</button></div>
      <div class="hud-stats">${barraPF(t)}<span class="num">${t.pf}/${t.pfMax} PF</span><span class="num">CA ${t.ca}</span><span class="num">${t.vel} ft</span></div>
      ${t.condizioni.length ? `<div class="chips small">${t.condizioni.map((c) => `<span class="chip on">${esc(c)}</span>`).join("")}</div>` : ""}
      <div class="hud-btns">
        <button type="button" data-hud="-5">−5</button><button type="button" data-hud="-1">−1</button>
        <button type="button" data-hud="1">+1</button><button type="button" data-hud="5">+5</button>
        <button type="button" data-hud="scheda" class="wide">Scheda</button>
        <button type="button" data-hud="rimuovi" class="wide out">Togli</button>
      </div>`;
  }

  function renderPalette() {
    $("palette").innerHTML = TERRENI.map((t, i) => `
      <button type="button" class="swatch" data-terreno="${i}" aria-pressed="${ui.modo === "pennello" && ui.pennello === i}">
        <span class="sw" style="background:${t.col}"></span>${esc(t.nome)}</button>`).join("");
    document.querySelectorAll("[data-modo]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.modo === ui.modo));
    renderVassoio();
  }

  function renderLista() {
    const pg = stato.pedine.filter((t) => t.tipo === "pg"), mo = stato.pedine.filter((t) => t.tipo !== "pg");
    const riga = (t) => `
      <li class="token-li"><button type="button" class="token-row${t.id === ui.selezionata ? " sel" : ""}${t.pf <= 0 ? " down" : ""}" data-sel="${t.id}">
        <canvas class="ritratto" data-rit="${t.id}"></canvas>
        <span class="tname">${esc(t.nome)}<small>${esc(descrivi(t))}</small></span>
        ${barraPF(t)}<span class="num">${t.pf}/${t.pfMax}</span><span class="num muted">CA ${t.ca}</span>
      </button><button type="button" class="token-del" data-del="${t.id}" aria-label="Togli ${esc(t.nome)} dal tavolo">×</button></li>`;
    $("token-list").innerHTML =
      (pg.length ? `<li class="group">Giocatori</li>${pg.map(riga).join("")}` : "") +
      (mo.length ? `<li class="group">Mostri e PNG</li>${mo.map(riga).join("")}` : "") ||
      `<li class="empty">Il tavolo è vuoto. Aggiungi un giocatore o un mostro.</li>`;
  }

  function opzioni(tab, val) {
    return Object.entries(tab).map(([k, v]) => `<option value="${k}"${k === val ? " selected" : ""}>${esc(v.nome)}</option>`).join("");
  }
  function descrivi(t) {
    const F = window.Figure;
    if (t.tipo === "pg") return [F.RAZZE[t.stirpe], F.CLASSI[t.classe]].filter(Boolean).map((x) => x.nome.toLowerCase()).join(" · ");
    const m = F.MOSTRI[t.razza]; return m ? m.nome.toLowerCase() + (t.gs ? " · GS " + t.gs : "") : "";
  }
  function disegnaRitratti(root = document) {
    root.querySelectorAll("canvas[data-rit]").forEach((c) => { const t = trova(+c.dataset.rit); if (t) window.Figure.ritratto(c, t); });
  }
  function renderEditor() {
    const t = trova(ui.selezionata), el = $("editor");
    if (!t) { el.innerHTML = `<h2>Scheda</h2><p class="note">Tocca una pedina sulla mappa o nella lista per modificarla.</p>`; return; }
    const colori = t.tipo === "pg" ? COLORI_PG : COLORI_MOSTRI;
    el.innerHTML = `
      <div class="sheet-head">
        <canvas class="ritratto preview" data-rit="${t.id}"></canvas>
        <div class="sheet-id">
          <h2>Scheda</h2>
          <label class="field"><span>Nome</span><input id="ed-nome" type="text" value="${esc(t.nome)}" maxlength="28"></label>
          <button type="button" class="btn-ghost small" id="ed-var">Cambia aspetto</button>
        </div>
      </div>
      ${t.tipo === "pg" ? `
      <div class="field-row">
        <label class="field"><span>Razza</span><select id="ed-stirpe">${opzioni(window.Figure.RAZZE, t.stirpe)}</select></label>
        <label class="field"><span>Classe</span><select id="ed-classe">${opzioni(window.Figure.CLASSI, t.classe)}</select></label>
      </div>` : `
      <label class="field"><span>Aspetto</span><select id="ed-razza">${opzioni(window.Figure.MOSTRI, t.razza)}</select></label>`}
      <div class="field-row four">
        <label class="field"><span>PF</span><input id="ed-pf" type="number" value="${t.pf}" inputmode="numeric"></label>
        <label class="field"><span>PF max</span><input id="ed-pfMax" type="number" min="1" value="${t.pfMax}" inputmode="numeric"></label>
        <label class="field"><span>CA</span><input id="ed-ca" type="number" min="0" value="${t.ca}" inputmode="numeric"></label>
        <label class="field"><span>Iniz.</span><input id="ed-init" type="number" value="${t.init}" inputmode="numeric"></label>
      </div>
      <div class="field-row">
        <label class="field"><span>Velocità (ft)</span><input id="ed-vel" type="number" min="0" step="5" value="${t.vel}" inputmode="numeric"></label>
        <label class="field"><span>Taglia</span><select id="ed-taglia">
          <option value="1"${t.taglia === 1 ? " selected" : ""}>Media (1 casella)</option>
          <option value="2"${t.taglia === 2 ? " selected" : ""}>Grande (2×2)</option>
          <option value="3"${t.taglia === 3 ? " selected" : ""}>Enorme (3×3)</option></select></label>
      </div>
      <div class="field"><span>Tipo</span>
        <div class="seg" role="group">
          <button type="button" class="seg-btn" data-tipo="pg" aria-pressed="${t.tipo === "pg"}">Giocatore</button>
          <button type="button" class="seg-btn" data-tipo="mostro" aria-pressed="${t.tipo !== "pg"}">Mostro / PNG</button>
        </div></div>
      <div class="field"><span>Colore</span><div class="colors">${colori.map((c) =>
        `<button type="button" class="color${c === t.colore ? " on" : ""}" data-colore="${c}" style="background:${c}" aria-label="Colore ${c}"></button>`).join("")}</div></div>
      <div class="field"><span>Condizioni</span><div class="chips">${window.CONDIZIONI.map((c) =>
        `<button type="button" class="chip${t.condizioni.includes(c) ? " on" : ""}" data-cond="${esc(c)}">${esc(c)}</button>`).join("")}</div></div>
      <div class="row-btns">
        <button type="button" class="btn-ghost" id="ed-dup">Duplica</button>
        <button type="button" class="btn-ghost danger" id="ed-del">Rimuovi dal tavolo</button>
      </div>`;
  }

  function renderLotta() {
    const L = stato.lotta, el = $("combat");
    if (!L.attiva) {
      const nPg = stato.pedine.filter((t) => t.tipo === "pg").length, nMo = stato.pedine.length - nPg;
      el.innerHTML = `
        <h2>Combattimento</h2>
        <p class="note">${nPg} giocatori e ${nMo} mostri sul tavolo. L'iniziativa si tira per tutti (d20 + modificatore); puoi correggere i valori dei giocatori dopo.</p>
        <button type="button" class="btn-main" id="btn-inizia"${stato.pedine.length ? "" : " disabled"}>Tira iniziativa e inizia</button>`;
      return;
    }
    const corrente = turnoCorrente();
    el.innerHTML = `
      <div class="combat-head"><h2>Round ${L.round}</h2>
        <div class="row-btns">
          <button type="button" class="btn-ghost" id="btn-prev">Indietro</button>
          <button type="button" class="btn-main small" id="btn-next">Prossimo turno</button>
        </div></div>
      <ol class="init-list">${L.ordine.map((id) => {
        const t = trova(id); if (!t) return "";
        return `<li class="init-row${id === corrente ? " now" : ""}${t.pf <= 0 ? " down" : ""}">
          <input class="init-val" type="number" id="ini-${id}" data-ini="${id}" value="${t.iniziativa ?? ""}" aria-label="Iniziativa di ${esc(t.nome)}" inputmode="numeric">
          <button type="button" class="init-name" data-sel="${id}"><canvas class="ritratto" data-rit="${id}"></canvas>${esc(t.nome)}</button>
          <span class="init-hp">${barraPF(t)}<span class="num">${t.pf}/${t.pfMax}</span></span>
          <span class="init-act">
            <input type="number" min="1" id="amt-${id}" data-amt="${id}" placeholder="0" aria-label="Quantità" inputmode="numeric">
            <button type="button" data-danno="${id}">Danno</button>
            <button type="button" data-cura="${id}">Cura</button>
          </span>
          ${t.condizioni.length ? `<span class="chips small">${t.condizioni.map((c) => `<span class="chip on">${esc(c)}</span>`).join("")}</span>` : ""}
        </li>`;
      }).join("")}</ol>
      <div class="row-btns">
        <button type="button" class="btn-ghost" id="btn-reroll">Ritira iniziativa</button>
        <button type="button" class="btn-ghost danger" id="btn-fine">Termina combattimento</button>
      </div>`;
  }

  function renderLog() {
    const voci = (filtro) => stato.registro.filter(filtro).slice(0, 30)
      .map((r) => `<li><span class="t">${esc(r.ora)}</span>${esc(r.testo)}</li>`).join("") || `<li class="empty">Ancora niente.</li>`;
    $("log-combat").innerHTML = voci((r) => r.tipo !== "dadi");
    $("log-dadi").innerHTML = voci((r) => r.tipo === "dadi");
  }

  function renderTabs() {
    for (const k of ["scena", "pedine", "lotta", "dadi"]) {
      $("t-" + k).setAttribute("aria-selected", ui.tab === k);
      $("p-" + k).hidden = ui.tab !== k;
    }
  }

  function aggiorna(opz = {}) {
    renderIntestazione(); renderBanner(); renderHud(); renderPalette(); renderLista();
    if (!opz.tieniEditor) renderEditor();
    renderLotta(); renderLog(); renderTabs();
    disegnaRitratti();
    tavolo && tavolo.disegna();
    salva();
  }

  // Gomma: al posto di muri, alberi, mobili, acqua... mette il terreno più comune lì intorno.
  const SUOLI = [ID.erba, ID.pietra, ID.legno, ID.sabbia];

  // ---------------- strumenti sulla mappa ----------------
  function scegliModo(m) {
    ui.modo = m;
    renderPalette();
    tavolo && tavolo.disegna();
    if (m === "posa") toast("Scegli chi aggiungere, poi tocca la mappa.");
  }

  // Stanza: bordo di muri, pavimento dentro, una porta sul lato verso chi guarda.
  function disegnaStanza(da, a) {
    const x0 = Math.min(da.x, a.x), x1 = Math.max(da.x, a.x), y0 = Math.min(da.y, a.y), y1 = Math.max(da.y, a.y);
    const w = x1 - x0 + 1, h = y1 - y0 + 1;
    const prima = stato.celle.slice(), posPrima = stato.pedine.map((t) => [t.id, t.x, t.y]);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const bordo = x === x0 || x === x1 || y === y0 || y === y1;
      stato.celle[y * stato.cols + x] = bordo ? ID.muro : ui.pavimento;
    }
    if (w >= 3 && h >= 3) stato.celle[y1 * stato.cols + ((x0 + x1) >> 1)] = ID.porta;
    // chi è rimasto dentro un muro viene spostato nella casella libera più vicina
    for (const t of stato.pedine) {
      if (!window.Mappe.passabile(stato.celle[t.y * stato.cols + t.x])) posa(t, t.x, t.y, occupate(t.id));
    }
    tavolo.terrenoCambiato(); aggiorna();
    avviso("Stanza di " + w * 5 + " × " + h * 5 + " ft.", "Annulla", () => {
      stato.celle = prima;
      for (const [id, x, y] of posPrima) { const t = trova(id); if (t) { t.x = x; t.y = y; } }
      tavolo.terrenoCambiato(); aggiorna();
    });
  }

  // Aggiungi: posa l'eroe o il mostro scelto nella casella toccata (o la più vicina libera).
  function posaQui(c) {
    let t;
    if (ui.posa.tipo === "pg") {
      t = creaPG(stato.pedine.filter((p) => p.tipo === "pg").length);
      t.stirpe = ui.posa.stirpe; t.classe = ui.posa.classe;
      t.nome = nomeUnico(window.Figure.CLASSI[t.classe].nome);
      t.vel = ["nano", "halfling", "gnomo"].includes(t.stirpe) ? 25 : 30;
    } else t = creaMostro(ui.posa.chiave);
    posa(t, c.x, c.y, occupate());
    stato.pedine.push(t);
    if (stato.lotta.attiva) { t.iniziativa = window.Dadi.d20(t.init || 0).totale; ordinaIniziativa(); registra(t.nome + " entra in combattimento (iniziativa " + t.iniziativa + ")."); }
    else registra(t.nome + " entra in scena.", "scena");
    ui.selezionata = t.id;
    aggiorna();
    toast(t.nome + " aggiunto.");
  }

  // Vassoio: i comandi dello strumento attivo, sopra la mappa (anche a schermo intero).
  let chiaveVassoio = "";
  function renderVassoio(forza) {
    const v = $("vassoio"); if (!v) return;
    const m = ui.modo;
    const chiave = JSON.stringify([m, ui.dimensione, ui.pennello, ui.pavimento, ui.vassoioTab, ui.posa]);
    if (!forza && chiave === chiaveVassoio) return;
    chiaveVassoio = chiave;
    v.hidden = m === "muovi";
    if (m === "muovi") { v.innerHTML = ""; altezzaVassoio(); return; }
    const dim = `<div class="seg" role="group" aria-label="Dimensione">${[1, 2, 3].map((n) =>
      `<button type="button" class="seg-btn" data-size="${n}" aria-pressed="${ui.dimensione === n}">${n}×${n}</button>`).join("")}</div>`;
    let html = "";
    if (m === "pennello") {
      html = `<div class="v-row"><span class="v-label">Dipingi</span>${dim}</div>
        <div class="v-swatches">${TERRENI.map((t, i) => `<button type="button" class="v-sw" data-terreno="${i}" aria-pressed="${ui.pennello === i}"><span class="sw" style="background:${t.col}"></span>${esc(t.nome)}</button>`).join("")}</div>`;
    } else if (m === "gomma") {
      html = `<div class="v-row"><span class="v-label">Gomma</span>${dim}<span class="v-hint">Trascina: muri, alberi, mobili e acqua lasciano il posto al terreno intorno.</span></div>`;
    } else if (m === "stanza") {
      html = `<div class="v-row"><span class="v-label">Pavimento</span><div class="seg" role="group">${[ID.pietra, ID.legno, ID.erba, ID.sabbia].map((id) =>
        `<button type="button" class="seg-btn" data-pav="${id}" aria-pressed="${ui.pavimento === id}">${esc(TERRENI[id].nome)}</button>`).join("")}</div>
        <span class="v-hint">Trascina da un angolo all'altro: muri sul bordo, pavimento dentro, una porta.</span></div>`;
    } else if (m === "posa") {
      const tab = ui.vassoioTab;
      html = `<div class="v-row"><div class="seg" role="group">
          <button type="button" class="seg-btn" data-vtab="mostri" aria-pressed="${tab === "mostri"}">Mostri</button>
          <button type="button" class="seg-btn" data-vtab="eroi" aria-pressed="${tab === "eroi"}">Eroi</button></div>
        <span class="v-hint">Scegli, poi tocca la mappa dove metterlo. Trascina per spostare la vista.</span></div>`;
      if (tab === "mostri") html += `<div class="v-grid">${Object.entries(B).map(([k, mm]) =>
        `<button type="button" class="v-card" data-mostro="${k}" aria-pressed="${ui.posa.tipo === "mostro" && ui.posa.chiave === k}"><canvas class="ritratto" data-anteprima="mostro:${k}"></canvas><span>${esc(mm.nome)}</span><small>GS ${mm.gs}</small></button>`).join("")}</div>`;
      else html += `<div class="v-row eroe"><canvas class="ritratto big" data-anteprima="pg"></canvas>
        <label class="field"><span>Razza</span><select id="v-stirpe">${opzioni(window.Figure.RAZZE, ui.posa.stirpe)}</select></label>
        <label class="field"><span>Classe</span><select id="v-classe">${opzioni(window.Figure.CLASSI, ui.posa.classe)}</select></label></div>`;
    }
    const scroll = v.querySelector(".v-grid, .v-swatches"), sl = scroll ? scroll.scrollLeft : 0, st = scroll ? scroll.scrollTop : 0;
    v.innerHTML = html;
    const nuovo = v.querySelector(".v-grid, .v-swatches"); if (nuovo) { nuovo.scrollLeft = sl; nuovo.scrollTop = st; }
    v.querySelectorAll("canvas[data-anteprima]").forEach((c) => {
      const a = c.dataset.anteprima, nPg = stato.pedine.filter((p) => p.tipo === "pg").length;
      const t = a === "pg"
        ? { id: 4242, tipo: "pg", stirpe: ui.posa.stirpe, classe: ui.posa.classe, colore: COLORI_PG[nPg % COLORI_PG.length], pf: 1 }
        : { id: 4242, tipo: "mostro", razza: a.split(":")[1], colore: coloreMostro(a.split(":")[1]), pf: 1 };
      window.Figure.ritratto(c, t);
    });
    altezzaVassoio();
  }
  function altezzaVassoio() {
    const v = $("vassoio");
    document.querySelector(".board-wrap").style.setProperty("--vassoio-h", v.hidden ? "0px" : v.offsetHeight + "px");
  }
  function suoloSotto(x, y) {
    const t = stato.celle[y * stato.cols + x];
    if (SUOLI.includes(t)) return null; // già terreno libero
    for (const r of [1, 2, 4]) {
      const conta = new Map();
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= stato.cols || ny >= stato.rows) continue;
        const v = stato.celle[ny * stato.cols + nx];
        if (SUOLI.includes(v)) conta.set(v, (conta.get(v) || 0) + 1);
      }
      if (conta.size) return [...conta.entries()].sort((a, b) => b[1] - a[1])[0][0];
    }
    return ID.pietra;
  }

  // ---------------- tavolo ----------------
  let tavolo = null;
  if (!stato) { stato = null; generaScena("dungeon", "media"); }
  if (!stato.lotta) stato.lotta = { attiva: false, round: 1, indice: 0, ordine: [] };
  migra();
  tavolo = window.Tavolo.crea($("board"), {
    stato: () => stato,
    selezionata: () => ui.selezionata,
    turnoCorrente,
    modo: () => ui.modo,
    vista: () => ui.vista,
    pennello: () => ui.pennello,
    dimensione: () => ui.dimensione,
    suoloSotto,
    stanza: disegnaStanza,
    posa: posaQui,
    seleziona(id) { ui.selezionata = id; aggiorna(); },
    mossa(t, piedi) {
      if (stato.lotta.attiva) registra(t.nome + " si muove di " + piedi + " ft.");
      aggiorna();
    },
    dipinto() { salva(); }
  });

  // ---------------- eventi ----------------
  $("sel-ambiente").innerHTML = Object.entries(AMBIENTI).map(([k, a]) => `<option value="${k}">${a.nome}</option>`).join("");
  $("sel-diff").innerHTML = Object.entries(DIFF).map(([k, d]) => `<option value="${k}">${d.nome}</option>`).join("");
  if (stato.scena) { $("sel-ambiente").value = stato.scena.ambiente; $("sel-diff").value = stato.scena.diff; }
  $("sel-mostro").innerHTML = Object.entries(B).map(([k, m]) => `<option value="${k}">${m.nome} · GS ${m.gs}</option>`).join("");

  $("btn-genera").addEventListener("click", () => { generaScena($("sel-ambiente").value, $("sel-diff").value); toast("Scena generata."); });
  $("btn-vuota").addEventListener("click", () => {
    stato.celle = stato.celle.map(() => ID.pietra); tavolo.terrenoCambiato(); salva(); toast("Mappa svuotata: dipingi la tua.");
    ui.modo = "pennello"; ui.pennello = ID.muro; aggiorna();
  });

  function impostaVista(v) {
    ui.vista = v;
    try { localStorage.setItem("oracolo-vista", v); } catch (e) { /* ignorato */ }
    $("view-iso").setAttribute("aria-pressed", v === "iso");
    $("view-top").setAttribute("aria-pressed", v === "pianta");
    tavolo.adatta();
  }
  // ---------- schermo intero ----------
  // Dove il browser lo permette usa il vero schermo intero; su iPhone la mappa
  // occupa comunque tutta la pagina, e dalla Home si apre senza barre del browser.
  const fsNativo = () => document.fullscreenElement || document.webkitFullscreenElement;
  function modalitaGioco(on) {
    document.body.classList.toggle("gioco", on);
    document.body.classList.remove("pannello");
    $("btn-fs").setAttribute("aria-pressed", on);
    $("btn-fs").textContent = on ? "Esci" : "Schermo intero";
    $("btn-pannello").setAttribute("aria-pressed", "false");
    requestAnimationFrame(() => requestAnimationFrame(() => tavolo.adatta()));
  }
  $("btn-fs").addEventListener("click", async () => {
    const on = !document.body.classList.contains("gioco");
    if (on) {
      const el = document.documentElement, req = el.requestFullscreen || el.webkitRequestFullscreen;
      let ok = false;
      if (req) { try { await req.call(el); ok = true; } catch (e) { ok = false; } }
      modalitaGioco(true);
      const standalone = window.navigator.standalone || matchMedia("(display-mode: standalone), (display-mode: fullscreen)").matches;
      if (!ok && !standalone && /iPhone|iPod/.test(navigator.userAgent)) avviso("Per nascondere anche le barre di Safari: Condividi → Aggiungi alla schermata Home.");
    } else {
      if (fsNativo()) { try { await (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) { /* già uscito */ } }
      modalitaGioco(false);
    }
  });
  const suFs = () => { if (!fsNativo() && document.body.classList.contains("gioco")) modalitaGioco(false); };
  document.addEventListener("fullscreenchange", suFs);
  document.addEventListener("webkitfullscreenchange", suFs);
  function pannello(on) {
    document.body.classList.toggle("pannello", on);
    $("btn-pannello").setAttribute("aria-pressed", on);
  }
  $("btn-pannello").addEventListener("click", () => pannello(!document.body.classList.contains("pannello")));
  $("panel-close").addEventListener("click", () => pannello(false));

  // niente selezione del testo o menu "Copia" tenendo premuto sulla mappa
  for (const ev of ["contextmenu", "selectstart"]) $("board").addEventListener(ev, (e) => e.preventDefault());

  $("view-iso").addEventListener("click", () => impostaVista("iso"));
  $("view-top").addEventListener("click", () => impostaVista("pianta"));
  $("view-iso").setAttribute("aria-pressed", ui.vista === "iso");
  $("view-top").setAttribute("aria-pressed", ui.vista === "pianta");
  document.querySelectorAll("[data-modo]").forEach((b) => b.addEventListener("click", () => scegliModo(b.dataset.modo)));
  $("vassoio").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.size) ui.dimensione = +b.dataset.size;
    else if (b.dataset.terreno) ui.pennello = +b.dataset.terreno;
    else if (b.dataset.pav) ui.pavimento = +b.dataset.pav;
    else if (b.dataset.vtab) {
      ui.vassoioTab = b.dataset.vtab;
      ui.posa = ui.vassoioTab === "eroi" ? Object.assign({ tipo: "pg" }, ui.ultimoEroe) : { tipo: "mostro", chiave: ui.ultimoMostro };
    } else if (b.dataset.mostro) { ui.posa = { tipo: "mostro", chiave: b.dataset.mostro }; ui.ultimoMostro = b.dataset.mostro; }
    else return;
    renderPalette();
  });
  $("vassoio").addEventListener("change", (e) => {
    if (e.target.id === "v-stirpe") ui.ultimoEroe.stirpe = e.target.value;
    else if (e.target.id === "v-classe") ui.ultimoEroe.classe = e.target.value;
    else return;
    ui.posa = Object.assign({ tipo: "pg" }, ui.ultimoEroe);
    renderPalette();
  });
  window.addEventListener("resize", altezzaVassoio);
  $("palette").addEventListener("click", (e) => {
    const b = e.target.closest("[data-terreno]"); if (!b) return;
    ui.pennello = +b.dataset.terreno; ui.modo = "pennello"; renderPalette();
  });
  $("zoom-in").addEventListener("click", () => tavolo.zoom(1.25));
  $("zoom-out").addEventListener("click", () => tavolo.zoom(0.8));
  $("zoom-fit").addEventListener("click", () => tavolo.adatta());

  document.querySelector(".tabs").addEventListener("click", (e) => {
    const b = e.target.closest("[role=tab]"); if (!b) return;
    ui.tab = b.id.slice(2); renderTabs();
  });

  $("hud").addEventListener("click", (e) => {
    const b = e.target.closest("[data-hud]"); if (!b) return;
    const v = b.dataset.hud, t = trova(ui.selezionata);
    if (v === "chiudi") { ui.selezionata = null; aggiorna(); }
    else if (v === "rimuovi") rimuovi(t.id);
    else if (v === "scheda") { if (document.body.classList.contains("gioco")) pannello(true); ui.tab = "pedine"; renderTabs(); $("p-pedine").scrollIntoView({ behavior: "smooth", block: "start" }); }
    else modificaPF(t, +v);
  });

  $("btn-add-pg").addEventListener("click", () => {
    const n = stato.pedine.filter((p) => p.tipo === "pg").length;
    aggiungi(creaPG(n)); toast("Giocatore aggiunto: trascinalo dove vuoi.");
  });
  $("btn-via-mostri").addEventListener("click", () => rimuovi(stato.pedine.filter((p) => p.tipo !== "pg").map((p) => p.id)));
  $("btn-via-morti").addEventListener("click", () => rimuovi(stato.pedine.filter((p) => p.tipo !== "pg" && p.pf <= 0).map((p) => p.id)));
  $("btn-add-mostro").addEventListener("click", () => { aggiungi(creaMostro($("sel-mostro").value)); toast("Mostro aggiunto."); });

  $("token-list").addEventListener("click", (e) => {
    const d = e.target.closest("[data-del]"); if (d) { rimuovi(+d.dataset.del); return; }
    const b = e.target.closest("[data-sel]"); if (!b) return;
    ui.selezionata = +b.dataset.sel; aggiorna();
  });

  // scheda: modifiche dal vivo senza ridisegnare i campi mentre si scrive
  $("editor").addEventListener("input", (e) => {
    const t = trova(ui.selezionata); if (!t) return;
    const f = e.target.id.replace("ed-", "");
    if (f === "stirpe" || f === "classe" || f === "razza") { t[f] = e.target.value; aggiorna(); return; }
    if (f === "nome") t.nome = e.target.value || "Senza nome";
    else if (["pf", "pfMax", "ca", "init", "vel"].includes(f)) {
      const v = parseInt(e.target.value, 10); if (Number.isNaN(v)) return;
      t[f] = f === "pfMax" ? Math.max(1, v) : v;
    } else if (f === "taglia") {
      t.taglia = +e.target.value;
      t.x = Math.min(t.x, stato.cols - t.taglia); t.y = Math.min(t.y, stato.rows - t.taglia);
    }
    if (f === "init" && stato.lotta.attiva) ordinaIniziativa();
    aggiorna({ tieniEditor: true });
  });
  $("editor").addEventListener("click", (e) => {
    const t = trova(ui.selezionata); if (!t) return;
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.tipo) {
      t.tipo = b.dataset.tipo; t.colore = (t.tipo === "pg" ? COLORI_PG : COLORI_MOSTRI)[0];
      if (t.tipo === "pg" && !t.stirpe) { t.stirpe = "umano"; t.classe = "guerriero"; }
      if (t.tipo !== "pg" && !t.razza) t.razza = "generico";
    }
    else if (b.id === "ed-var") t.variante = (t.variante || 0) + 1;
    else if (b.dataset.colore) t.colore = b.dataset.colore;
    else if (b.dataset.cond) {
      const c = b.dataset.cond, i = t.condizioni.indexOf(c);
      if (i >= 0) t.condizioni.splice(i, 1); else { t.condizioni.push(c); if (stato.lotta.attiva) registra(t.nome + ": " + c.toLowerCase() + "."); }
    } else if (b.id === "ed-dup") {
      const { id, ...resto } = t;
      const copia = nuovaPedina(Object.assign(resto, { condizioni: [], iniziativa: null }));
      copia.nome = nomeUnico(t.nome.replace(/\s+\d+$/, ""));
      aggiungi(copia); return;
    } else if (b.id === "ed-del") { rimuovi(t.id); return; }
    else return;
    aggiorna();
  });

  $("combat").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.id === "btn-inizia" || b.id === "btn-reroll") { iniziaLotta(); toast("Iniziativa tirata."); }
    else if (b.id === "btn-next") passaTurno(1);
    else if (b.id === "btn-prev") passaTurno(-1);
    else if (b.id === "btn-fine") fineLotta();
    else if (b.dataset.sel) { ui.selezionata = +b.dataset.sel; aggiorna(); }
    else if (b.dataset.danno || b.dataset.cura) {
      const id = +(b.dataset.danno || b.dataset.cura), q = parseInt($("amt-" + id).value, 10);
      if (!q || q < 1) { $("amt-" + id).focus(); toast("Scrivi prima quanti punti."); return; }
      modificaPF(trova(id), b.dataset.danno ? -q : q);
    }
  });
  $("combat").addEventListener("change", (e) => {
    if (!e.target.dataset.ini) return;
    const t = trova(+e.target.dataset.ini), v = parseInt(e.target.value, 10);
    if (t && !Number.isNaN(v)) { t.iniziativa = v; ordinaIniziativa(); aggiorna(); }
  });
  $("banner-next").addEventListener("click", () => passaTurno(1));

  // dadi
  $("dice-grid").innerHTML = [4, 6, 8, 10, 12, 20, 100].map((f) => `<button type="button" class="die-btn" data-d="${f}"><span>d${f}</span></button>`).join("");
  function mostraTiro(titolo, dett, totale, cls = "") {
    $("dice-result").innerHTML = `<span class="big ${cls}">${totale}</span><span class="detail"><b>${esc(titolo)}</b> ${esc(dett)}</span>`;
    registra(titolo + " → " + totale + " " + dett, "dadi"); renderLog(); salva();
  }
  $("dice-grid").addEventListener("click", (e) => {
    const b = e.target.closest("[data-d]"); if (!b) return;
    const f = +b.dataset.d, n = Math.max(1, Math.min(50, parseInt($("dice-n").value, 10) || 1)), mod = parseInt($("dice-mod").value, 10) || 0;
    const sm = mod ? (mod > 0 ? " + " : " − ") + Math.abs(mod) : "";
    if (f === 20 && n === 1) {
      const r = window.Dadi.d20(mod, ui.adv);
      const cls = r.naturale === 20 ? "crit" : r.naturale === 1 ? "fumble" : "";
      const note = r.naturale === 20 ? " · 20 naturale!" : r.naturale === 1 ? " · 1 naturale" : "";
      mostraTiro("d20" + (ui.adv !== "normale" ? " " + ui.adv : "") + sm, "[" + r.tiri.join(", ") + "]" + note, r.totale, cls);
    } else {
      const r = window.Dadi.espressione(n + "d" + f + (mod ? (mod > 0 ? "+" : "") + mod : ""));
      mostraTiro(n + "d" + f + sm, "[" + r.tiri.join(", ") + "]", r.totale);
    }
  });
  document.querySelector("[data-adv]").parentElement.addEventListener("click", (e) => {
    const b = e.target.closest("[data-adv]"); if (!b) return;
    ui.adv = b.dataset.adv;
    document.querySelectorAll("[data-adv]").forEach((x) => x.setAttribute("aria-pressed", x === b));
  });
  $("dice-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const r = window.Dadi.espressione($("dice-expr").value);
    if (!r) { toast("Formula non valida: usa per esempio 2d6+3."); return; }
    mostraTiro(r.testo, "[" + r.tiri.join(", ") + "]", r.totale);
  });

  document.addEventListener("keydown", (e) => {
    if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    if (e.key === "Escape") { ui.selezionata = null; aggiorna(); }
    if ((e.key === "Delete" || e.key === "Backspace") && ui.selezionata != null) { e.preventDefault(); rimuovi(ui.selezionata); }
    if (e.key === "n" && stato.lotta.attiva) passaTurno(1);
  });

  aggiorna();
})();
