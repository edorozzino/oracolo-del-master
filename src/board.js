// Tavolo: disegno della mappa su canvas, pan/zoom, trascinamento pedine, pennello.
(function () {
  const { TERRENI, ID } = window.Mappe;
  const CS = 40; // risoluzione di una casella nella cache del terreno

  function hashRng(x, y) { return window.Oracolo.mulberry32(((x * 73856093) ^ (y * 19349663)) >>> 0); }

  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const ch = (v) => Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f)));
    return "rgb(" + ch(n >> 16) + "," + ch((n >> 8) & 255) + "," + ch(n & 255) + ")";
  }

  function disegnaCasella(ctx, t, x, y, S) {
    const T = TERRENI[t] || TERRENI[0], px = x * S, py = y * S, rnd = hashRng(x, y);
    const base = t === ID.porta ? TERRENI[ID.pietra].col : t === ID.mobili ? TERRENI[ID.legno].col : t === ID.alberi ? TERRENI[ID.erba].col : T.col;
    ctx.fillStyle = base; ctx.fillRect(px, py, S, S);
    // leggera variazione di tono per non avere un tappeto piatto
    ctx.fillStyle = rnd() < 0.5 ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.05)"; ctx.fillRect(px, py, S, S);
    switch (t) {
      case ID.erba: case ID.alberi:
        ctx.strokeStyle = "rgba(20,40,10,.35)"; ctx.lineWidth = S * 0.04;
        for (let k = 0; k < 3; k++) { const gx = px + rnd() * S, gy = py + rnd() * S; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + S * 0.05, gy - S * 0.12); ctx.stroke(); }
        if (t === ID.alberi) {
          const r = S * (0.42 + rnd() * 0.12), cx = px + S / 2 + (rnd() - .5) * S * .15, cy = py + S / 2 + (rnd() - .5) * S * .15;
          ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.beginPath(); ctx.arc(cx + S * .06, cy + S * .08, r, 0, 7); ctx.fill();
          ctx.fillStyle = T.col; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
          ctx.fillStyle = shade(T.col, 0.18); ctx.beginPath(); ctx.arc(cx - r * .3, cy - r * .3, r * .45, 0, 7); ctx.fill();
        }
        break;
      case ID.muro: case ID.roccia:
        ctx.fillStyle = shade(T.col, 0.14); ctx.fillRect(px, py, S, S * 0.18);
        ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = S * 0.03;
        if (t === ID.muro) { ctx.beginPath(); ctx.moveTo(px, py + S * .55); ctx.lineTo(px + S, py + S * .55); ctx.moveTo(px + S * .5, py + S * .18); ctx.lineTo(px + S * .5, py + S * .55); ctx.stroke(); }
        else { ctx.fillStyle = shade(T.col, 0.1); ctx.beginPath(); ctx.moveTo(px + S * .2, py + S * .8); ctx.lineTo(px + S * (.35 + rnd() * .2), py + S * .3); ctx.lineTo(px + S * .8, py + S * .75); ctx.fill(); }
        break;
      case ID.acqua:
        ctx.strokeStyle = "rgba(200,230,240,.35)"; ctx.lineWidth = S * 0.04;
        { const wy = py + S * (0.3 + rnd() * 0.4); ctx.beginPath(); ctx.moveTo(px + S * .15, wy); ctx.quadraticCurveTo(px + S * .35, wy - S * .1, px + S * .5, wy); ctx.quadraticCurveTo(px + S * .65, wy + S * .1, px + S * .85, wy); ctx.stroke(); }
        break;
      case ID.lava:
        ctx.fillStyle = "rgba(255,200,80,.55)"; ctx.beginPath(); ctx.arc(px + S * (.3 + rnd() * .4), py + S * (.3 + rnd() * .4), S * .2, 0, 7); ctx.fill();
        break;
      case ID.porta:
        ctx.fillStyle = T.col; ctx.fillRect(px + S * .12, py + S * .3, S * .76, S * .4);
        ctx.fillStyle = "#d9b45b"; ctx.beginPath(); ctx.arc(px + S * .72, py + S * .5, S * .05, 0, 7); ctx.fill();
        break;
      case ID.legno:
        ctx.strokeStyle = "rgba(60,35,15,.35)"; ctx.lineWidth = S * 0.025;
        ctx.beginPath(); ctx.moveTo(px, py + S / 3); ctx.lineTo(px + S, py + S / 3); ctx.moveTo(px, py + 2 * S / 3); ctx.lineTo(px + S, py + 2 * S / 3); ctx.stroke();
        break;
      case ID.mobili:
        ctx.fillStyle = T.col; ctx.fillRect(px + S * .08, py + S * .08, S * .84, S * .84);
        ctx.fillStyle = shade(T.col, 0.12); ctx.fillRect(px + S * .08, py + S * .08, S * .84, S * .14);
        break;
      case ID.macerie:
        ctx.fillStyle = "rgba(40,35,30,.45)";
        for (let k = 0; k < 4; k++) ctx.fillRect(px + rnd() * S * .8, py + rnd() * S * .8, S * (.1 + rnd() * .12), S * (.08 + rnd() * .1));
        break;
      case ID.sabbia:
        ctx.fillStyle = "rgba(90,70,40,.25)";
        for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(px + rnd() * S, py + rnd() * S, S * .03, 0, 7); ctx.fill(); }
        break;
    }
  }

  function iniziali(nome) {
    const parole = String(nome).trim().split(/\s+/);
    const num = parole.length > 1 && /^\d+$/.test(parole[parole.length - 1]) ? parole.pop() : "";
    const lettere = parole.length === 1
      ? parole[0].slice(0, 2).charAt(0).toUpperCase() + parole[0].slice(1, 2).toLowerCase()
      : parole.slice(0, 2).map((p) => (p[0] || "").toUpperCase()).join("");
    return lettere + num;
  }

  function crea(canvas, api) {
    const ctx = canvas.getContext("2d");
    const view = { s: 24, ox: 0, oy: 0 };
    let adattata = false, cache = null, cacheSporca = true, w = 0, h = 0;
    const puntatori = new Map();
    let azione = null; // {tipo:'pedina'|'pan'|'pennello'|'pinch', ...}

    function ridimensiona() {
      const r = canvas.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!adattata) adatta(); else disegna();
    }
    function adatta() {
      const st = api.stato();
      if (api.vista() === "iso") {
        Object.assign(view, window.Iso.adatta(w, h, st));
        if (w < 640 && view.s < 20) { // telefono: figure leggibili, centrate sui giocatori
          view.s = 20;
          const pg = st.pedine.filter((p) => p.tipo === "pg");
          const cx = pg.length ? pg.reduce((a, p) => a + p.x, 0) / pg.length + .5 : st.cols / 2;
          const cy = pg.length ? pg.reduce((a, p) => a + p.y, 0) / pg.length + .5 : st.rows / 2;
          window.Iso.centra(view, w, h, (cx + st.cols / 2) / 2, (cy + st.rows / 2) / 2);
        }
        adattata = true; disegna(); return;
      }
      view.s = Math.min(w / st.cols, h / st.rows);
      view.ox = (w - st.cols * view.s) / 2; view.oy = (h - st.rows * view.s) / 2;
      if (view.s < 22) { // telefono: casella leggibile, centrata sui giocatori
        view.s = Math.min(22, h / Math.min(st.rows, 14));
        const pg = st.pedine.filter((p) => p.tipo === "pg");
        const cx = pg.length ? pg.reduce((a, p) => a + p.x, 0) / pg.length + .5 : st.cols / 2;
        const cy = pg.length ? pg.reduce((a, p) => a + p.y, 0) / pg.length + .5 : st.rows / 2;
        view.ox = Math.min(0, Math.max(w - st.cols * view.s, w / 2 - cx * view.s));
        view.oy = Math.min(0, Math.max(h - st.rows * view.s, h / 2 - cy * view.s));
        if (st.rows * view.s < h) view.oy = (h - st.rows * view.s) / 2;
      }
      adattata = true; disegna();
    }
    function zoom(f, cx = w / 2, cy = h / 2) {
      const s2 = Math.max(8, Math.min(120, view.s * f)), k = s2 / view.s;
      view.ox = cx - (cx - view.ox) * k; view.oy = cy - (cy - view.oy) * k; view.s = s2; disegna();
    }

    function costruisciCache() {
      const st = api.stato();
      if (!cache) cache = document.createElement("canvas");
      cache.width = st.cols * CS; cache.height = st.rows * CS;
      const c = cache.getContext("2d");
      for (let y = 0; y < st.rows; y++) for (let x = 0; x < st.cols; x++) disegnaCasella(c, st.celle[y * st.cols + x], x, y, CS);
      c.strokeStyle = "rgba(0,0,0,.22)"; c.lineWidth = 1;
      c.beginPath();
      for (let x = 0; x <= st.cols; x++) { c.moveTo(x * CS + .5, 0); c.lineTo(x * CS + .5, st.rows * CS); }
      for (let y = 0; y <= st.rows; y++) { c.moveTo(0, y * CS + .5); c.lineTo(st.cols * CS, y * CS + .5); }
      c.stroke();
      cacheSporca = false;
    }
    function aggiornaCasella(x, y) {
      const st = api.stato(); if (!cache) return;
      const c = cache.getContext("2d");
      disegnaCasella(c, st.celle[y * st.cols + x], x, y, CS);
      c.strokeStyle = "rgba(0,0,0,.22)"; c.lineWidth = 1; c.strokeRect(x * CS + .5, y * CS + .5, CS, CS);
    }

    function disegnaPedina(t, cx, cy, rad, opz) {
      const morto = t.pf <= 0;
      ctx.save();
      if (opz.fantasma) ctx.globalAlpha = 0.55;
      ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.beginPath(); ctx.arc(cx + rad * .08, cy + rad * .14, rad, 0, 7); ctx.fill();
      ctx.fillStyle = morto ? "#5b5650" : t.colore; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, 7); ctx.fill();
      ctx.lineWidth = Math.max(1.5, rad * 0.12);
      ctx.strokeStyle = t.tipo === "pg" ? "#ece3cf" : "#2a0d0a"; ctx.stroke();
      if (t.tipo !== "pg") { // i mostri hanno una tacca: si riconoscono anche in bianco e nero
        ctx.fillStyle = "#2a0d0a"; ctx.beginPath(); ctx.moveTo(cx, cy - rad * 1.12); ctx.lineTo(cx - rad * .22, cy - rad * .78); ctx.lineTo(cx + rad * .22, cy - rad * .78); ctx.fill();
      }
      // arco dei PF
      if (t.pfMax > 0 && !morto) {
        const f = Math.max(0, Math.min(1, t.pf / t.pfMax));
        ctx.lineWidth = Math.max(2, rad * 0.16);
        ctx.strokeStyle = "rgba(0,0,0,.45)"; ctx.beginPath(); ctx.arc(cx, cy, rad * 1.22, Math.PI * .75, Math.PI * 2.25); ctx.stroke();
        ctx.strokeStyle = f > .5 ? "#7fbf5a" : f > .25 ? "#e0b13a" : "#d6493a";
        ctx.beginPath(); ctx.arc(cx, cy, rad * 1.22, Math.PI * .75, Math.PI * (.75 + 1.5 * f)); ctx.stroke();
      }
      ctx.fillStyle = "#fff8ea"; const lab = iniziali(t.nome); ctx.font = "700 " + Math.round(rad * (lab.length > 2 ? .58 : .72)) + "px 'Alegreya Sans SC', 'Trebuchet MS', sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(lab, cx, cy + rad * .04);
      if (morto) {
        ctx.strokeStyle = "#d6493a"; ctx.lineWidth = rad * .16; ctx.beginPath();
        ctx.moveTo(cx - rad * .6, cy - rad * .6); ctx.lineTo(cx + rad * .6, cy + rad * .6);
        ctx.moveTo(cx + rad * .6, cy - rad * .6); ctx.lineTo(cx - rad * .6, cy + rad * .6); ctx.stroke();
      }
      if (t.condizioni && t.condizioni.length) {
        ctx.fillStyle = "#c9a24a"; ctx.beginPath(); ctx.arc(cx + rad * .8, cy - rad * .8, rad * .3, 0, 7); ctx.fill();
        ctx.fillStyle = "#10211d"; ctx.font = "700 " + Math.round(rad * .4) + "px sans-serif"; ctx.fillText(t.condizioni.length, cx + rad * .8, cy - rad * .78);
      }
      if (opz.selezionata) { ctx.strokeStyle = "#c9a24a"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, rad * 1.45, 0, 7); ctx.stroke(); }
      if (opz.turno) {
        ctx.strokeStyle = "#f4d27a"; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.arc(cx, cy, rad * 1.65, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.restore();
    }

    let isoCache = null, isoSporca = true, raf = 0;
    function disegna() { if (api.vista() === "iso") disegnaIso(); else disegnaPianta(); }
    function richiedi() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; disegna(); }); }
    function disegnaIso() {
      const st = api.stato();
      if (isoSporca || !isoCache) { isoCache = window.Iso.costruisci(st); isoSporca = false; }
      ctx.clearRect(0, 0, w, h);
      const drag = azione && azione.tipo === "pedina"
        ? { id: azione.id, da: azione.da, a: azione.a, piedi: Math.max(Math.abs(azione.a.x - azione.da.x), Math.abs(azione.a.y - azione.da.y)) * 5 }
        : null;
      window.Iso.disegna(ctx, w, h, st, view, isoCache, { sel: api.selezionata(), turno: api.turnoCorrente(), drag });
    }
    function disegnaPianta() {
      const st = api.stato(), s = view.s;
      if (cacheSporca) costruisciCache();
      ctx.clearRect(0, 0, w, h);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(cache, view.ox, view.oy, st.cols * s, st.rows * s);
      ctx.strokeStyle = "rgba(201,162,74,.5)"; ctx.lineWidth = 1.5; ctx.strokeRect(view.ox, view.oy, st.cols * s, st.rows * s);

      const sel = api.selezionata(), turno = api.turnoCorrente();
      const ordine = st.pedine.slice().sort((a, b) => (a.pf <= 0) - (b.pf <= 0) || (a.id === sel) - (b.id === sel));
      for (const t of ordine) {
        if (azione && azione.tipo === "pedina" && azione.id === t.id) continue;
        const cx = view.ox + (t.x + t.taglia / 2) * s, cy = view.oy + (t.y + t.taglia / 2) * s;
        disegnaPedina(t, cx, cy, t.taglia * s * 0.38, { selezionata: t.id === sel, turno: t.id === turno });
      }
      if (azione && azione.tipo === "pedina") {
        const t = st.pedine.find((p) => p.id === azione.id);
        if (t) {
          const a = azione.da, b = azione.a;
          const ax = view.ox + (a.x + t.taglia / 2) * s, ay = view.oy + (a.y + t.taglia / 2) * s;
          const bx = view.ox + (b.x + t.taglia / 2) * s, by = view.oy + (b.y + t.taglia / 2) * s;
          disegnaPedina(t, ax, ay, t.taglia * s * 0.38, { fantasma: true });
          const piedi = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) * 5;
          const troppo = piedi > (t.vel || 30);
          ctx.strokeStyle = troppo ? "#d6493a" : "#f4d27a"; ctx.lineWidth = 2.5; ctx.setLineDash([6, 5]);
          ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = troppo ? "rgba(214,73,58,.25)" : "rgba(244,210,122,.22)";
          ctx.fillRect(view.ox + b.x * s, view.oy + b.y * s, t.taglia * s, t.taglia * s);
          disegnaPedina(t, bx, by, t.taglia * s * 0.38, { selezionata: true });
          const label = piedi + " ft" + (troppo ? " · oltre " + (t.vel || 30) : "");
          ctx.font = "700 13px 'Alegreya Sans SC', 'Trebuchet MS', sans-serif";
          const tw = ctx.measureText(label).width + 12;
          const lx = Math.min(w - tw - 4, Math.max(4, bx - tw / 2)), ly = Math.max(4, by - t.taglia * s * .5 - 30);
          ctx.fillStyle = "rgba(10,22,19,.88)"; ctx.fillRect(lx, ly, tw, 22);
          ctx.fillStyle = troppo ? "#ff9a8a" : "#f4d27a"; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText(label, lx + 6, ly + 11);
        }
      }
    }

    function aCasella(e) {
      const r = canvas.getBoundingClientRect();
      const px = e.clientX - r.left, py = e.clientY - r.top;
      if (api.vista() === "iso") return Object.assign({ px, py }, window.Iso.casella(px, py, view));
      return { px, py, x: Math.floor((px - view.ox) / view.s), y: Math.floor((py - view.oy) / view.s) };
    }
    function pedinaIn(p) {
      const st = api.stato();
      if (api.vista() === "iso") return window.Iso.pedinaIn(p.px, p.py, st, view);
      for (let i = st.pedine.length - 1; i >= 0; i--) {
        const t = st.pedine[i];
        const cx = view.ox + (t.x + t.taglia / 2) * view.s, cy = view.oy + (t.y + t.taglia / 2) * view.s;
        if (Math.hypot(p.px - cx, p.py - cy) <= t.taglia * view.s * 0.5) return t;
      }
      return null;
    }
    // Pennello e gomma: agiscono su un quadrato di 1, 2 o 3 caselle attorno al dito.
    function dipingi(p) {
      const st = api.stato(), n = api.dimensione ? api.dimensione() : 1, gomma = api.modo() === "gomma";
      const d0 = -Math.floor((n - 1) / 2);
      const celle = [];
      for (let dy = d0; dy < d0 + n; dy++) for (let dx = d0; dx < d0 + n; dx++) {
        const x = p.x + dx, y = p.y + dy;
        if (x >= 0 && y >= 0 && x < st.cols && y < st.rows) celle.push([x, y]);
      }
      // la gomma decide il terreno di tutte le caselle prima di cambiarle
      const nuovi = celle.map(([x, y]) => (gomma ? api.suoloSotto(x, y) : api.pennello()));
      let cambiato = false;
      celle.forEach(([x, y], k) => {
        const i = y * st.cols + x, b = nuovi[k];
        if (b == null || st.celle[i] === b) return;
        st.celle[i] = b; aggiornaCasella(x, y); cambiato = true;
      });
      if (cambiato) { isoSporca = true; richiedi(); }
    }

    canvas.addEventListener("pointerdown", (e) => {
      canvas.setPointerCapture(e.pointerId);
      puntatori.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (puntatori.size === 2) {
        const [a, b] = [...puntatori.values()];
        azione = { tipo: "pinch", d0: Math.hypot(a.x - b.x, a.y - b.y), s0: view.s, ox0: view.ox, oy0: view.oy,
          mx: (a.x + b.x) / 2 - canvas.getBoundingClientRect().left, my: (a.y + b.y) / 2 - canvas.getBoundingClientRect().top };
        disegna(); return;
      }
      const p = aCasella(e);
      if (api.modo() === "pennello" || api.modo() === "gomma") { azione = { tipo: "pennello" }; dipingi(p); return; }
      const t = pedinaIn(p);
      if (t) {
        azione = { tipo: "pedina", id: t.id, da: { x: t.x, y: t.y }, a: { x: t.x, y: t.y }, offX: p.x - t.x, offY: p.y - t.y, mosso: false };
        api.seleziona(t.id);
      } else {
        azione = { tipo: "pan", sx: e.clientX, sy: e.clientY, ox: view.ox, oy: view.oy, mosso: false };
      }
      disegna();
    });

    canvas.addEventListener("pointermove", (e) => {
      if (!puntatori.has(e.pointerId)) return;
      puntatori.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (!azione) return;
      if (azione.tipo === "pinch" && puntatori.size >= 2) {
        const [a, b] = [...puntatori.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        const s2 = Math.max(8, Math.min(120, azione.s0 * d / azione.d0)), k = s2 / azione.s0;
        view.s = s2; view.ox = azione.mx - (azione.mx - azione.ox0) * k; view.oy = azione.my - (azione.my - azione.oy0) * k;
        richiedi(); return;
      }
      const p = aCasella(e);
      if (azione.tipo === "pennello") dipingi(p);
      else if (azione.tipo === "pan") {
        const dx = e.clientX - azione.sx, dy = e.clientY - azione.sy;
        if (Math.abs(dx) + Math.abs(dy) > 4) azione.mosso = true;
        view.ox = azione.ox + dx; view.oy = azione.oy + dy; richiedi();
      } else if (azione.tipo === "pedina") {
        const st = api.stato(), t = st.pedine.find((q) => q.id === azione.id);
        const nx = Math.max(0, Math.min(st.cols - t.taglia, p.x - azione.offX));
        const ny = Math.max(0, Math.min(st.rows - t.taglia, p.y - azione.offY));
        if (nx !== azione.a.x || ny !== azione.a.y) { azione.a = { x: nx, y: ny }; azione.mosso = true; richiedi(); }
      }
    });

    function fine(e) {
      puntatori.delete(e.pointerId);
      if (!azione) return;
      if (azione.tipo === "pinch") { if (puntatori.size === 0) azione = null; return; }
      if (azione.tipo === "pedina") {
        const st = api.stato(), t = st.pedine.find((q) => q.id === azione.id);
        const { da, a } = azione; azione = null;
        if (t && (a.x !== da.x || a.y !== da.y)) {
          t.x = a.x; t.y = a.y;
          api.mossa(t, Math.max(Math.abs(a.x - da.x), Math.abs(a.y - da.y)) * 5);
        } else disegna();
      } else if (azione.tipo === "pan") {
        const fermo = !azione.mosso; azione = null;
        if (fermo) api.seleziona(null); else disegna();
      } else if (azione.tipo === "pennello") { azione = null; api.dipinto(); }
    }
    canvas.addEventListener("pointerup", fine);
    canvas.addEventListener("pointercancel", fine);
    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      zoom(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });

    new ResizeObserver(ridimensiona).observe(canvas);

    return {
      disegna,
      terrenoCambiato() { cacheSporca = true; isoSporca = true; disegna(); },
      adatta, zoom
    };
  }

  window.Tavolo = { crea, iniziali };
})();
