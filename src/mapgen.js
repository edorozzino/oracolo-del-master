// Terreni e generatori di mappe a griglia (1 casella = 5 piedi).
(function () {
  const TERRENI = [
    { key: "vuoto",   nome: "Vuoto",        col: "#0b1411", pass: false },
    { key: "pietra",  nome: "Pietra",       col: "#8b8473", pass: true },
    { key: "muro",    nome: "Muro",         col: "#3a332b", pass: false },
    { key: "erba",    nome: "Erba",         col: "#5c7a41", pass: true },
    { key: "alberi",  nome: "Alberi",       col: "#2c4d2e", pass: false },
    { key: "acqua",   nome: "Acqua",        col: "#2d5f77", pass: true, difficile: true },
    { key: "lava",    nome: "Fuoco / lava", col: "#b4471f", pass: true, danno: true },
    { key: "porta",   nome: "Porta",        col: "#8a5a2b", pass: true },
    { key: "sabbia",  nome: "Sentiero",     col: "#b89c69", pass: true },
    { key: "legno",   nome: "Assi di legno",col: "#9a7046", pass: true },
    { key: "mobili",  nome: "Mobili",       col: "#5a3a20", pass: false },
    { key: "roccia",  nome: "Roccia",       col: "#48443d", pass: false },
    { key: "macerie", nome: "Macerie",      col: "#7a7062", pass: true, difficile: true }
  ];
  const ID = Object.fromEntries(TERRENI.map((t, i) => [t.key, i]));

  const AMBIENTI = {
    dungeon: { nome: "Dungeon", titoli: ["Le segrete di Castel Malaspina", "La cripta del Re Senza Volto", "I sotterranei della Torre Mozza", "Le prigioni del Barone Grigio"] },
    caverna: { nome: "Caverna", titoli: ["La Grotta dei Cento Echi", "Le gallerie di Pietrascura", "La caverna dei funghi azzurri", "Il ventre della montagna"] },
    foresta: { nome: "Foresta", titoli: ["Il guado di Vetroverde", "Il ponte sul Fiume Nero", "La radura dei corvi", "Il sentiero dei taglialegna"] },
    taverna: { nome: "Taverna", titoli: ["La locanda del Drago Ubriaco", "Il Boccale Rotto", "La taverna dei Tre Incroci", "L'Oca d'Oro"] },
    rovine:  { nome: "Rovine",  titoli: ["Le rovine di Hrimgard", "Il tempio dimenticato", "La Valle dei Re Caduti", "Le mura dell'antica Sarnath"] }
  };

  // ---------- utilità ----------
  const ri = (rng, n) => Math.floor(rng() * n);
  function Grid(c, r, v) {
    const g = new Array(c * r).fill(v);
    g.c = c; g.r = r;
    g.get = (x, y) => (x < 0 || y < 0 || x >= c || y >= r ? -1 : g[y * c + x]);
    g.set = (x, y, t) => { if (x >= 0 && y >= 0 && x < c && y < r) g[y * c + x] = t; };
    g.rect = (x, y, w, h, t) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) g.set(i, j, t); };
    g.n8 = (x, y, t) => { let n = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if ((i || j) && g.get(x + i, y + j) === t) n++; return n; };
    return g;
  }
  const passabile = (t) => t >= 0 && TERRENI[t].pass && !TERRENI[t].danno;

  function blob(g, rng, cx, cy, size, t, onlyOn) {
    for (let k = 0; k < size; k++) {
      const x = cx + ri(rng, 5) - 2, y = cy + ri(rng, 5) - 2;
      if (onlyOn == null || onlyOn.includes(g.get(x, y))) g.set(x, y, t);
      cx = Math.max(1, Math.min(g.c - 2, cx + ri(rng, 3) - 1));
      cy = Math.max(1, Math.min(g.r - 2, cy + ri(rng, 3) - 1));
    }
  }

  function murareIntorno(g) {
    for (let y = 0; y < g.r; y++) for (let x = 0; x < g.c; x++) {
      if (g.get(x, y) !== ID.vuoto) continue;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
        const t = g.get(x + i, y + j);
        if (t >= 0 && t !== ID.vuoto && t !== ID.muro) { g.set(x, y, ID.muro); j = i = 2; }
      }
    }
  }

  // Tiene solo la zona percorribile più grande; il resto diventa `riempi`.
  function connettere(g, riempi) {
    const seen = new Array(g.length).fill(-1); let best = -1, bestN = 0, id = 0;
    for (let s = 0; s < g.length; s++) {
      if (seen[s] >= 0 || !passabile(g[s])) continue;
      let n = 0; const st = [s]; seen[s] = id;
      while (st.length) {
        const p = st.pop(); n++;
        const x = p % g.c, y = (p / g.c) | 0;
        for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
          const q = (y + dy) * g.c + (x + dx);
          if (x + dx < 0 || x + dx >= g.c || y + dy < 0 || y + dy >= g.r) continue;
          if (seen[q] < 0 && passabile(g[q])) { seen[q] = id; st.push(q); }
        }
      }
      if (n > bestN) { bestN = n; best = id; }
      id++;
    }
    for (let i = 0; i < g.length; i++) if (passabile(g[i]) && seen[i] !== best) g[i] = riempi;
    return best;
  }

  // Caselle libere ordinate per distanza da un punto.
  function vicino(g, px, py, n, occupate) {
    const libere = [];
    for (let y = 0; y < g.r; y++) for (let x = 0; x < g.c; x++) {
      if (passabile(g.get(x, y)) && !occupate.has(x + "," + y)) libere.push({ x, y, d: Math.hypot(x - px, y - py) });
    }
    libere.sort((a, b) => a.d - b.d);
    const out = libere.slice(0, n);
    out.forEach((p) => occupate.add(p.x + "," + p.y));
    return out;
  }

  // ---------- generatori ----------
  function dungeon(rng, c, r) {
    const g = Grid(c, r, ID.vuoto); const stanze = [];
    for (let k = 0; k < 300 && stanze.length < 8; k++) {
      const w = 4 + ri(rng, 5), h = 3 + ri(rng, 4);
      const x = 1 + ri(rng, c - w - 2), y = 1 + ri(rng, r - h - 2);
      if (stanze.some((o) => x < o.x + o.w + 2 && x + w + 2 > o.x && y < o.y + o.h + 2 && y + h + 2 > o.y)) continue;
      stanze.push({ x, y, w, h, cx: x + (w >> 1), cy: y + (h >> 1) });
    }
    stanze.sort((a, b) => a.cx - b.cx);
    stanze.forEach((o) => g.rect(o.x, o.y, o.w, o.h, ID.pietra));
    const corridoio = (a, b) => {
      let x = a.cx, y = a.cy; const orizzFirst = rng() < 0.5;
      const passo = () => { if (g.get(x, y) === ID.vuoto) g.set(x, y, ID.sabbia); };
      if (orizzFirst) { while (x !== b.cx) { passo(); x += Math.sign(b.cx - x); } while (y !== b.cy) { passo(); y += Math.sign(b.cy - y); } }
      else { while (y !== b.cy) { passo(); y += Math.sign(b.cy - y); } while (x !== b.cx) { passo(); x += Math.sign(b.cx - x); } }
    };
    for (let i = 1; i < stanze.length; i++) corridoio(stanze[i - 1], stanze[i]);
    if (stanze.length > 3) corridoio(stanze[0], stanze[2]);
    murareIntorno(g);
    // porte dove un corridoio entra in una stanza
    for (let y = 1; y < r - 1; y++) for (let x = 1; x < c - 1; x++) {
      if (g.get(x, y) !== ID.sabbia) continue;
      const vert = g.get(x - 1, y) === ID.muro && g.get(x + 1, y) === ID.muro;
      const orizz = g.get(x, y - 1) === ID.muro && g.get(x, y + 1) === ID.muro;
      const tocca = [[1,0],[-1,0],[0,1],[0,-1]].some(([dx, dy]) => g.get(x + dx, y + dy) === ID.pietra);
      if ((vert || orizz) && tocca && rng() < 0.6) g.set(x, y, ID.porta);
    }
    for (let i = 0; i < g.length; i++) if (g[i] === ID.sabbia) g[i] = ID.pietra;
    stanze.slice(1).forEach((o) => { if (rng() < 0.5) g.set(o.x + ri(rng, o.w), o.y + ri(rng, o.h), ID.macerie); });
    const s0 = stanze[0], sN = stanze[stanze.length - 1];
    return { g, pg: [s0.cx, s0.cy], mostri: [sN.cx, sN.cy], boss: [sN.cx, sN.cy] };
  }

  function caverna(rng, c, r) {
    let g = Grid(c, r, ID.roccia);
    for (let y = 1; y < r - 1; y++) for (let x = 1; x < c - 1; x++) g.set(x, y, rng() < 0.44 ? ID.roccia : ID.pietra);
    for (let it = 0; it < 4; it++) {
      const n = Grid(c, r, ID.roccia);
      for (let y = 1; y < r - 1; y++) for (let x = 1; x < c - 1; x++) {
        const k = g.n8(x, y, ID.roccia);
        n.set(x, y, k >= 5 || (it < 2 && k <= 1) ? ID.roccia : ID.pietra);
      }
      g = n;
    }
    for (let k = 0; k < 2; k++) blob(g, rng, 4 + ri(rng, c - 8), 3 + ri(rng, r - 6), 14, ID.acqua, [ID.pietra]);
    for (let k = 0; k < 4; k++) blob(g, rng, 2 + ri(rng, c - 4), 2 + ri(rng, r - 4), 4, ID.macerie, [ID.pietra]);
    connettere(g, ID.roccia);
    return { g, pg: [0, r / 2], mostri: [c, r / 2], boss: [c - 3, r / 2] };
  }

  function foresta(rng, c, r) {
    let g = Grid(c, r, ID.erba);
    for (let i = 0; i < g.length; i++) g[i] = rng() < 0.5 ? ID.alberi : ID.erba;
    for (let it = 0; it < 2; it++) {
      const n = Grid(c, r, ID.erba);
      for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) { const k = g.n8(x, y, ID.alberi); n.set(x, y, k >= 5 || (k >= 4 && g.get(x, y) === ID.alberi) ? ID.alberi : ID.erba); }
      g = n;
    }
    // sentiero da sinistra a destra
    let y = (r >> 1) + ri(rng, 5) - 2;
    for (let x = 0; x < c; x++) {
      g.set(x, y, ID.sabbia); g.set(x, y + 1, ID.sabbia);
      for (const d of [-1, 2]) if (g.get(x, y + d) === ID.alberi) g.set(x, y + d, ID.erba);
      if (rng() < 0.25) y = Math.max(2, Math.min(r - 4, y + (rng() < 0.5 ? -1 : 1)));
    }
    // fiume dall'alto in basso, con un ponte
    let x = Math.floor(c * 0.55) + ri(rng, 4);
    for (let yy = 0; yy < r; yy++) {
      for (const d of [-2, 2]) if (g.get(x + d, yy) !== ID.sabbia) g.set(x + d, yy, ID.sabbia);
      for (const d of [-1, 0, 1]) g.set(x + d, yy, ID.acqua);
      if (rng() < 0.3) x = Math.max(4, Math.min(c - 5, x + (rng() < 0.5 ? -1 : 1)));
    }
    for (let xx = 0; xx < c; xx++) for (const yy of [y, y + 1]) if (g.get(xx, yy) === ID.acqua) g.set(xx, yy, ID.legno);
    connettere(g, ID.alberi);
    return { g, pg: [0, y], mostri: [c - 4, y], boss: [c - 2, y] };
  }

  function taverna(rng, c, r) {
    const g = Grid(c, r, ID.erba);
    for (let i = 0; i < g.length; i++) if (rng() < 0.05) g[i] = ID.alberi;
    const x0 = 3, y0 = 2, w = c - 6, h = r - 4;
    g.rect(x0, y0, w, h, ID.muro);
    g.rect(x0 + 1, y0 + 1, w - 2, h - 2, ID.legno);
    const py = y0 + (h >> 1);
    g.set(x0, py, ID.porta);
    for (let x = 0; x < x0; x++) { g.set(x, py, ID.sabbia); }
    g.rect(x0 + 3, y0 + 2, Math.min(9, w - 8), 1, ID.mobili);           // bancone
    g.rect(x0 + w - 2, py - 1, 1, 2, ID.lava);                           // camino
    // tavoli
    for (let k = 0; k < 60; k++) {
      const tw = rng() < 0.5 ? 2 : 1, th = tw === 2 ? 1 : 2;
      const tx = x0 + 3 + ri(rng, w - 6), ty = y0 + 4 + ri(rng, h - 6);
      let ok = true;
      for (let j = ty - 1; j <= ty + th; j++) for (let i = tx - 1; i <= tx + tw; i++) if (g.get(i, j) !== ID.legno) ok = false;
      if (ok) g.rect(tx, ty, tw, th, ID.mobili);
    }
    // stanza sul retro
    const sx = x0 + w - 8;
    g.rect(sx, y0 + h - 5, 1, 4, ID.muro);
    g.rect(sx, y0 + h - 5, 7, 1, ID.muro);
    g.set(sx, y0 + h - 3, ID.porta);
    for (let i = sx + 1; i < sx + 7; i++) for (let j = y0 + h - 4; j < y0 + h - 1; j++) if (g.get(i, j) === ID.mobili) g.set(i, j, ID.legno);
    g.rect(sx + 2, y0 + h - 3, 2, 1, ID.mobili);
    return { g, pg: [x0 + 2, py], mostri: [c * 0.6, r / 2], boss: [sx + 4, y0 + h - 2] };
  }

  function rovine(rng, c, r) {
    const g = Grid(c, r, ID.erba);
    for (let k = 0; k < 6; k++) blob(g, rng, ri(rng, c), ri(rng, r), 25, ID.sabbia, [ID.erba]);
    for (let k = 0; k < 5; k++) {
      const w = 5 + ri(rng, 6), h = 4 + ri(rng, 4), x = 1 + ri(rng, c - w - 2), y = 1 + ri(rng, r - h - 2);
      for (let i = x; i < x + w; i++) for (const j of [y, y + h - 1]) g.set(i, j, rng() < 0.6 ? ID.muro : ID.macerie);
      for (let j = y; j < y + h; j++) for (const i of [x, x + w - 1]) g.set(i, j, rng() < 0.6 ? ID.muro : ID.macerie);
      for (let i = x + 1; i < x + w - 1; i++) for (let j = y + 1; j < y + h - 1; j++) if (rng() < 0.7) g.set(i, j, ID.pietra);
    }
    const cx = c >> 1, cy = r >> 1;
    for (let j = -3; j <= 3; j += 3) for (let i = -6; i <= 6; i += 4) if (rng() < 0.75) g.set(cx + i, cy + j, ID.roccia);
    g.rect(cx - 1, cy - 1, 3, 2, ID.acqua);
    for (let i = 0; i < 8; i++) if (rng() < 0.6) g.set(ri(rng, c), ri(rng, r), ID.alberi);
    connettere(g, ID.macerie);
    return { g, pg: [0, r / 2], mostri: [c - 4, r / 2], boss: [cx + 3, cy] };
  }

  const GENERATORI = { dungeon, caverna, foresta, taverna, rovine };

  function genera(tipo, seed, cols = 30, rows = 20) {
    const rng = window.Oracolo.mulberry32(seed);
    const res = GENERATORI[tipo](rng, cols, rows);
    return { celle: Array.from(res.g), cols, rows, punti: { pg: res.pg, mostri: res.mostri, boss: res.boss } };
  }

  // celle: array semplice; restituisce caselle libere vicino a (px,py)
  function posizioniLibere(celle, cols, rows, px, py, n, occupate) {
    const g = Grid(cols, rows, 0); for (let i = 0; i < celle.length; i++) g[i] = celle[i];
    return vicino(g, px, py, n, occupate);
  }

  window.Mappe = { TERRENI, ID, AMBIENTI, genera, posizioniLibere, passabile };
})();
