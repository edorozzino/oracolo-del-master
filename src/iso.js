// Vista isometrica 2.5D: terreno a rombi con bordi in rilievo, muri, alberi,
// rocce e mobili in volume, pedine come figure in piedi.
// Coordinate: casella (x,y) -> vertice alto del rombo a
//   X = ox + (x - y) * s,  Y = oy + (x + y) * s / 2   (rombo largo 2s, alto s)
(function () {
  const { TERRENI, ID } = window.Mappe;
  const CS = 40; // scala della cache del terreno

  const rngCella = (x, y, k = 0) => window.Oracolo.mulberry32((((x + 1) * 73856093) ^ ((y + 1) * 19349663) ^ (k * 83492791)) >>> 0);
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const ch = (v) => Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f)));
    return "rgb(" + ch(n >> 16) + "," + ch((n >> 8) & 255) + "," + ch(n & 255) + ")";
  }

  const PAL = {
    [ID.erba]: ["#6a993b", "#66953a", "#6f9f3f", "#64923a"],
    [ID.sabbia]: ["#d4bb82", "#cbb078", "#dbc48e"],
    [ID.pietra]: ["#a39e91", "#9b9689", "#aba69a"],
    [ID.legno]: ["#ab763f", "#a06d39", "#b37e46"],
    [ID.acqua]: ["#3a83ab", "#367ca3"],
    [ID.lava]: ["#d4531e"],
    [ID.macerie]: ["#948e81", "#8b8578"],
    [ID.roccia]: ["#7a7468", "#736d61"]
  };
  function suolo(t) {
    if (t === ID.alberi) return ID.erba;
    if (t === ID.mobili) return ID.legno;
    if (t === ID.porta || t === ID.muro) return ID.pietra;
    return t;
  }
  const naturale = (t) => t === ID.erba || t === ID.sabbia;

  function rombo(c, X, Y, s) {
    c.beginPath(); c.moveTo(X, Y); c.lineTo(X + s, Y + s / 2); c.lineTo(X, Y + s); c.lineTo(X - s, Y + s / 2); c.closePath();
  }

  // ---------------- terreno (cache) ----------------
  function costruisci(st) {
    const { cols, rows } = st;
    const g = (x, y) => (x < 0 || y < 0 || x >= cols || y >= rows ? -1 : st.celle[y * cols + x]);
    const SL = 0.6 * CS;
    const cv = document.createElement("canvas");
    cv.width = (cols + rows) * CS; cv.height = (cols + rows) * CS / 2 + SL + 4;
    const c = cv.getContext("2d");
    const cox = rows * CS;
    const P = (x, y) => [cox + (x - y) * CS, (x + y) * CS / 2];

    // 1. rombi con texture
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const t = g(x, y); if (t === ID.vuoto) continue;
      const k = suolo(t), pal = PAL[k] || ["#888"], r = rngCella(x, y);
      const [X, Y] = P(x, y);
      c.save(); rombo(c, X, Y, CS); c.fillStyle = pal[Math.floor(r() * pal.length)]; c.fill(); c.clip();
      if (k === ID.erba) {
        for (let i = 0; i < 9; i++) {
          const gx = X + (r() - .5) * 1.8 * CS, gy = Y + r() * CS;
          c.strokeStyle = r() < .5 ? "rgba(40,70,20,.45)" : "rgba(170,210,110,.35)"; c.lineWidth = 1.4;
          c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx + (r() - .5) * 3, gy - 4 - r() * 4); c.stroke();
        }
        if (r() < .12) { c.fillStyle = r() < .5 ? "#f2e27a" : "#f5f1e6"; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(X + (r() - .5) * CS, Y + CS * (.3 + r() * .4), 1.6, 0, 7); c.fill(); } }
      } else if (k === ID.sabbia) {
        for (let i = 0; i < 10; i++) { c.fillStyle = r() < .5 ? "rgba(120,90,50,.3)" : "rgba(255,245,215,.35)"; c.fillRect(X + (r() - .5) * 1.8 * CS, Y + r() * CS, 2, 2); }
      } else if (k === ID.pietra || k === ID.macerie || k === ID.roccia) {
        // lastre: rombo diviso in quattro, toni leggermente diversi
        const q = [[0, 0], [.5, 0], [0, .5], [.5, .5]];
        for (const [a, b] of q) {
          const qx = X + (a - b) * CS, qy = Y + (a + b) * CS / 2;
          rombo(c, qx, qy, CS / 2); c.fillStyle = r() < .5 ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.07)"; c.fill();
          c.strokeStyle = "rgba(40,35,28,.35)"; c.lineWidth = 1; c.stroke();
        }
        if (k === ID.macerie) for (let i = 0; i < 6; i++) { c.fillStyle = "rgba(50,45,38,.45)"; c.fillRect(X + (r() - .5) * 1.4 * CS, Y + CS * (.2 + r() * .6), 3, 2); }
      } else if (k === ID.legno) {
        c.strokeStyle = "rgba(70,40,15,.45)"; c.lineWidth = 1.2;
        for (let i = 1; i < 4; i++) { const f = i / 4; c.beginPath(); c.moveTo(X - CS + f * CS, Y + CS / 2 + f * CS / 2); c.lineTo(X + f * CS, Y + f * CS / 2); c.stroke(); }
      } else if (k === ID.acqua) {
        c.strokeStyle = "rgba(210,240,255,.35)"; c.lineWidth = 1.5;
        for (let i = 0; i < 2; i++) { const wx = X + (r() - .5) * CS, wy = Y + CS * (.3 + r() * .4); c.beginPath(); c.moveTo(wx - 7, wy); c.quadraticCurveTo(wx - 3, wy - 3, wx, wy); c.quadraticCurveTo(wx + 3, wy + 3, wx + 7, wy); c.stroke(); }
      } else if (k === ID.lava) {
        const gr = c.createRadialGradient(X, Y + CS / 2, 2, X, Y + CS / 2, CS);
        gr.addColorStop(0, "#ffd36a"); gr.addColorStop(.5, "#f07a26"); gr.addColorStop(1, "#9c2f12");
        c.fillStyle = gr; c.fillRect(X - CS, Y, 2 * CS, CS);
      }
      c.restore();
    }

    // 2. sfumature tra erba e sentiero, così i bordi non sono a scacchiera
    const dirs = [[0, -1, .75, .25], [1, 0, .75, .75], [0, 1, .25, .75], [-1, 0, .25, .25]]; // vicino, punto medio del lato (frazioni)
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const t = g(x, y); if (!naturale(t)) continue;
      const r = rngCella(x, y, 2), [X, Y] = P(x, y);
      for (const [dx, dy] of dirs) {
        const n = g(x + dx, y + dy); if (!naturale(n) || n === t) continue;
        const mx = X + dx * CS * .5 - dy * CS * .5, my = Y + CS / 2 + dx * CS * .25 + dy * CS * .25;
        c.fillStyle = PAL[t][0];
        for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(mx + (r() - .5) * CS * .9, my + (r() - .5) * CS * .3, CS * (.18 + r() * .14), CS * (.1 + r() * .07), 0, 0, 7); c.fill(); }
      }
    }

    // 3. riva dell'acqua
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (g(x, y) !== ID.acqua) continue;
      const [X, Y] = P(x, y);
      const lati = [[0, -1, [X, Y], [X + CS, Y + CS / 2]], [1, 0, [X + CS, Y + CS / 2], [X, Y + CS]], [0, 1, [X, Y + CS], [X - CS, Y + CS / 2]], [-1, 0, [X - CS, Y + CS / 2], [X, Y]]];
      for (const [dx, dy, a, b] of lati) {
        const n = g(x + dx, y + dy); if (n === ID.acqua || n === -1 || n === ID.vuoto) continue;
        c.strokeStyle = "rgba(20,60,90,.55)"; c.lineWidth = 5; c.beginPath(); c.moveTo(a[0], a[1] + 2); c.lineTo(b[0], b[1] + 2); c.stroke();
        c.strokeStyle = "rgba(235,248,255,.75)"; c.lineWidth = 2; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
      }
    }

    // 4. griglia leggera
    c.strokeStyle = "rgba(0,0,0,.09)"; c.lineWidth = 1;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (g(x, y) === ID.vuoto) continue;
      const [X, Y] = P(x, y); rombo(c, X, Y, CS); c.stroke();
    }

    // 5. fianchi del plastico verso il vuoto
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const t = g(x, y); if (t === ID.vuoto) continue;
      const [X, Y] = P(x, y);
      const terra = t === ID.acqua ? "#2d5f7d" : "#6b4e33";
      const sotto = g(x, y + 1), destra = g(x + 1, y);
      if (sotto === -1 || sotto === ID.vuoto) {
        c.fillStyle = shade(terra, .08); c.beginPath(); c.moveTo(X - CS, Y + CS / 2); c.lineTo(X, Y + CS); c.lineTo(X, Y + CS + SL); c.lineTo(X - CS, Y + CS / 2 + SL); c.fill();
        c.fillStyle = "rgba(0,0,0,.18)"; c.fillRect(X - CS, Y + CS / 2 + SL * .45, CS, 2);
      }
      if (destra === -1 || destra === ID.vuoto) {
        c.fillStyle = shade(terra, -.3); c.beginPath(); c.moveTo(X, Y + CS); c.lineTo(X + CS, Y + CS / 2); c.lineTo(X + CS, Y + CS / 2 + SL); c.lineTo(X, Y + CS + SL); c.fill();
      }
    }

    // oggetti in rilievo, ordinati per profondità
    const oggetti = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const t = g(x, y), r = rngCella(x, y, 7);
      let k = null;
      if (t === ID.muro) k = "muro";
      else if (t === ID.roccia) k = "roccia";
      else if (t === ID.alberi) k = "albero";
      else if (t === ID.mobili) k = "mobile";
      else if (t === ID.porta) k = "porta";
      else if (t === ID.macerie) k = "macerie";
      else if (t === ID.lava) k = "fuoco";
      else if (t === ID.erba && r() < .07) k = "cespuglio";
      else if (t === ID.sabbia && r() < .05) k = "sasso";
      if (k) oggetti.push({ x, y, k, d: x + y });
    }
    oggetti.sort((a, b) => a.d - b.d || a.x - b.x);
    return { canvas: cv, oggetti, g };
  }

  // ---------------- primitive 3D ----------------
  // parallelepipedo con base a rombo centrata in (cx,cy), semilarghezza a, altezza h
  function blocco(ctx, cx, cy, a, h, col, facce = { sx: true, dx: true }) {
    const T = [cx, cy - a / 2], R = [cx + a, cy], B = [cx, cy + a / 2], L = [cx - a, cy];
    if (facce.sx) { ctx.fillStyle = shade(col, -.12); ctx.beginPath(); ctx.moveTo(L[0], L[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(B[0], B[1] - h); ctx.lineTo(L[0], L[1] - h); ctx.closePath(); ctx.fill(); }
    if (facce.dx) { ctx.fillStyle = shade(col, -.38); ctx.beginPath(); ctx.moveTo(B[0], B[1]); ctx.lineTo(R[0], R[1]); ctx.lineTo(R[0], R[1] - h); ctx.lineTo(B[0], B[1] - h); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = shade(col, .12); ctx.beginPath(); ctx.moveTo(T[0], T[1] - h); ctx.lineTo(R[0], R[1] - h); ctx.lineTo(B[0], B[1] - h); ctx.lineTo(L[0], L[1] - h); ctx.closePath(); ctx.fill();
    return { T, R, B, L };
  }
  function ombra(ctx, cx, cy, rx, ry) {
    ctx.fillStyle = "rgba(10,20,10,.28)"; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 7); ctx.fill();
  }

  function disegnaOggetto(ctx, o, view, g) {
    const s = view.s, X = view.ox + (o.x - o.y) * s, Y = view.oy + (o.x + o.y) * s / 2;
    const cx = X, cy = Y + s / 2, r = rngCella(o.x, o.y, 11);
    switch (o.k) {
      case "muro": {
        const H = s * 1.15, col = "#a39a88";
        const muro = (dx, dy) => g(o.x + dx, o.y + dy) === ID.muro;
        const { L, B, R } = blocco(ctx, cx, cy, s, H, col, { sx: !muro(0, 1), dx: !muro(1, 0) });
        // corsi di mattoni sulle facce visibili
        ctx.strokeStyle = "rgba(40,32,24,.45)"; ctx.lineWidth = 1;
        for (let i = 1; i < 3; i++) {
          const yy = -H * i / 3;
          if (!muro(0, 1)) { ctx.beginPath(); ctx.moveTo(L[0], L[1] + yy); ctx.lineTo(B[0], B[1] + yy); ctx.stroke(); const m = i % 2 ? .5 : .25; ctx.beginPath(); ctx.moveTo(L[0] + (B[0] - L[0]) * m, L[1] + (B[1] - L[1]) * m + yy); ctx.lineTo(L[0] + (B[0] - L[0]) * m, L[1] + (B[1] - L[1]) * m + yy + H / 3); ctx.stroke(); }
          if (!muro(1, 0)) { ctx.beginPath(); ctx.moveTo(B[0], B[1] + yy); ctx.lineTo(R[0], R[1] + yy); ctx.stroke(); const m = i % 2 ? .5 : .75; ctx.beginPath(); ctx.moveTo(B[0] + (R[0] - B[0]) * m, B[1] + (R[1] - B[1]) * m + yy); ctx.lineTo(B[0] + (R[0] - B[0]) * m, B[1] + (R[1] - B[1]) * m + yy + H / 3); ctx.stroke(); }
        }
        // merlatura
        blocco(ctx, cx - s * .45, cy - H, s * .3, s * .28, col);
        blocco(ctx, cx + s * .45, cy - H, s * .3, s * .28, col);
        break;
      }
      case "porta": {
        const asseX = g(o.x - 1, o.y) === ID.muro || g(o.x + 1, o.y) === ID.muro;
        const [vx, vy] = asseX ? [s * .5, s * .25] : [-s * .5, s * .25];
        const H = s * 1.15;
        // stipiti in pietra
        blocco(ctx, cx - vx * .9, cy - vy * .9, s * .2, H, "#a39a88");
        // battente in legno
        const a = [cx - vx * .75, cy - vy * .75], b = [cx + vx * .75, cy + vy * .75];
        ctx.fillStyle = asseX ? "#7a4a22" : "#6a3f1c";
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(b[0], b[1] - H * .85); ctx.quadraticCurveTo(cx, cy - H * 1.05, a[0], a[1] - H * .85); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "rgba(30,20,10,.7)"; ctx.lineWidth = Math.max(1, s * .05);
        for (const f of [.3, .62]) { ctx.beginPath(); ctx.moveTo(a[0], a[1] - H * f); ctx.lineTo(b[0], b[1] - H * f); ctx.stroke(); }
        blocco(ctx, cx + vx * .9, cy + vy * .9, s * .2, H, "#a39a88");
        break;
      }
      case "roccia": {
        const hr = .8 + r() * .5, w = s * (.85 + r() * .15);
        ombra(ctx, cx + s * .25, cy + s * .05, w, s * .32);
        const gr = ctx.createLinearGradient(cx - w, cy - s * hr, cx + w, cy + s * .3);
        gr.addColorStop(0, "#b5ae9f"); gr.addColorStop(.55, "#7c7568"); gr.addColorStop(1, "#4d483f");
        ctx.fillStyle = gr; ctx.beginPath();
        ctx.moveTo(cx - w, cy); ctx.lineTo(cx - w * .7, cy - s * .55 * hr); ctx.lineTo(cx + (r() - .5) * s * .4, cy - s * 1.05 * hr);
        ctx.lineTo(cx + w * .75, cy - s * .6 * hr); ctx.lineTo(cx + w, cy); ctx.lineTo(cx + w * .2, cy + s * .38); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "rgba(30,28,24,.35)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx - w * .1, cy - s * .9 * hr); ctx.lineTo(cx + w * .15, cy + s * .3); ctx.stroke();
        break;
      }
      case "albero": {
        const k = .85 + r() * .35, conifera = r() < .45;
        const jx = (r() - .5) * s * .3, jy = (r() - .5) * s * .15, bx = cx + jx, by = cy + jy;
        ombra(ctx, bx + s * .45 * k, by + s * .08, s * .75 * k, s * .3 * k);
        ctx.fillStyle = "#5b3a1e"; ctx.fillRect(bx - s * .08 * k, by - s * .75 * k, s * .16 * k, s * .78 * k);
        ctx.fillStyle = "#3e2712"; ctx.fillRect(bx, by - s * .75 * k, s * .08 * k, s * .78 * k);
        if (conifera) {
          const strati = [[.85, .45, 1.15], [.68, .95, 1.6], [.48, 1.4, 2.05]];
          for (const [lw, y0, y1] of strati) {
            const gr = ctx.createLinearGradient(bx - s * lw * k, 0, bx + s * lw * k, 0);
            gr.addColorStop(0, "#4f8a3a"); gr.addColorStop(.5, "#2f6a2c"); gr.addColorStop(1, "#1d4520");
            ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(bx - s * lw * k, by - s * y0 * k); ctx.lineTo(bx, by - s * y1 * k); ctx.lineTo(bx + s * lw * k, by - s * y0 * k); ctx.closePath(); ctx.fill();
          }
        } else {
          const cy2 = by - s * 1.3 * k, R = s * .48 * k;
          const pall = [[-.45, .15], [.45, .15], [0, -.35], [0, .2]];
          for (const [dx, dy] of pall) {
            const px = bx + dx * R * 1.2, py = cy2 + dy * R * 1.2;
            const gr = ctx.createRadialGradient(px - R * .4, py - R * .4, R * .1, px, py, R);
            gr.addColorStop(0, "#8cc455"); gr.addColorStop(.6, "#4e8a33"); gr.addColorStop(1, "#2c5a22");
            ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(px, py, R, 0, 7); ctx.fill();
          }
        }
        break;
      }
      case "cespuglio": {
        const bx = cx + (r() - .5) * s * .8, by = cy + (r() - .5) * s * .3;
        ombra(ctx, bx + s * .1, by + s * .03, s * .3, s * .1);
        for (const [dx, dy, rr] of [[-.12, 0, .17], [.12, 0, .16], [0, -.1, .18]]) {
          const gr = ctx.createRadialGradient(bx + dx * s - 2, by + dy * s - 3, 1, bx + dx * s, by + dy * s, rr * s);
          gr.addColorStop(0, "#8fc45a"); gr.addColorStop(1, "#3f7a2c");
          ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(bx + dx * s, by + dy * s - rr * s * .6, rr * s, 0, 7); ctx.fill();
        }
        break;
      }
      case "sasso": {
        const bx = cx + (r() - .5) * s * .8, by = cy + (r() - .5) * s * .3;
        ctx.fillStyle = "#8b8478"; ctx.beginPath(); ctx.ellipse(bx, by - s * .06, s * .16, s * .1, 0, 0, 7); ctx.fill();
        ctx.fillStyle = "#b0a99b"; ctx.beginPath(); ctx.ellipse(bx - s * .04, by - s * .1, s * .08, s * .05, 0, 0, 7); ctx.fill();
        break;
      }
      case "mobile": {
        if (r() < .3) { // botte
          const R = s * .32, H = s * .65;
          ombra(ctx, cx + s * .15, cy + s * .05, R * 1.1, R * .5);
          const gr = ctx.createLinearGradient(cx - R, 0, cx + R, 0);
          gr.addColorStop(0, "#a8733e"); gr.addColorStop(.5, "#8a5a2b"); gr.addColorStop(1, "#4f3116");
          ctx.fillStyle = gr; ctx.fillRect(cx - R, cy - H, 2 * R, H);
          ctx.beginPath(); ctx.ellipse(cx, cy, R, R * .5, 0, 0, Math.PI); ctx.fill();
          ctx.fillStyle = "#b9844a"; ctx.beginPath(); ctx.ellipse(cx, cy - H, R, R * .5, 0, 0, 7); ctx.fill();
          ctx.strokeStyle = "#3a3a3a"; ctx.lineWidth = Math.max(1, s * .05);
          for (const f of [.25, .7]) { ctx.beginPath(); ctx.ellipse(cx, cy - H * f, R, R * .5, 0, 0, Math.PI); ctx.stroke(); }
        } else { // tavolo / cassa
          ombra(ctx, cx + s * .2, cy + s * .05, s * .7, s * .3);
          const { L, R } = blocco(ctx, cx, cy, s * .78, s * .48, "#8f5e2e");
          ctx.strokeStyle = "rgba(60,35,12,.5)"; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(L[0] + s * .39, L[1] - s * .48 - s * .2); ctx.lineTo(R[0] - s * .39, R[1] - s * .48 + s * .2); ctx.stroke();
        }
        break;
      }
      case "macerie": {
        for (let i = 0; i < 3; i++) blocco(ctx, cx + (r() - .5) * s, cy + (r() - .5) * s * .4, s * (.12 + r() * .1), s * (.1 + r() * .15), "#8d8679");
        break;
      }
      case "fuoco": {
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        const gr = ctx.createRadialGradient(cx, cy, 2, cx, cy, s * 1.6);
        gr.addColorStop(0, "rgba(255,170,60,.55)"); gr.addColorStop(1, "rgba(255,120,30,0)");
        ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(cx, cy, s * 1.6, s * .9, 0, 0, 7); ctx.fill(); ctx.restore();
        for (let i = 0; i < 3; i++) {
          const fx = cx + (i - 1) * s * .28, h = s * (.45 + r() * .4), w = s * .16;
          const gf = ctx.createLinearGradient(0, cy, 0, cy - h);
          gf.addColorStop(0, "#d0401a"); gf.addColorStop(.5, "#f39a2a"); gf.addColorStop(1, "#ffe48a");
          ctx.fillStyle = gf; ctx.beginPath(); ctx.moveTo(fx - w, cy); ctx.quadraticCurveTo(fx - w, cy - h * .5, fx, cy - h); ctx.quadraticCurveTo(fx + w, cy - h * .5, fx + w, cy); ctx.closePath(); ctx.fill();
        }
        break;
      }
    }
  }

  // ---------------- pedine ----------------
  function baseDi(t, view, pos) {
    const p = pos || t, n = t.taglia, s = view.s;
    return { x: view.ox + (p.x - p.y) * s, y: view.oy + (p.x + p.y + n) * s / 2, u: s * 1.45 * Math.max(1, n * .8) };
  }

  function sagoma(ctx, cx, y0, u) {
    ctx.beginPath();
    ctx.moveTo(cx - .27 * u, y0);
    ctx.quadraticCurveTo(cx - .1 * u, y0 - .22 * u, cx - .1 * u, y0 - .5 * u);
    ctx.lineTo(cx + .1 * u, y0 - .5 * u);
    ctx.quadraticCurveTo(cx + .1 * u, y0 - .22 * u, cx + .27 * u, y0);
    ctx.closePath();
  }

  function disegnaPedina(ctx, t, b, o) {
    const { x: cx, y: cy, u } = b, morto = t.pf <= 0, col = morto ? "#77716a" : t.colore;
    ctx.save();
    if (o.fantasma) ctx.globalAlpha = .4;
    ombra(ctx, cx + u * .12, cy + u * .02, u * .48, u * .22);
    if (o.selezionata) { ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, cy, u * .6, u * .3, 0, 0, 7); ctx.stroke(); }
    if (o.turno) { ctx.strokeStyle = "#f4d27a"; ctx.lineWidth = 2.5; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.ellipse(cx, cy, u * .7, u * .35, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
    // basetta
    const bh = u * .09;
    ctx.fillStyle = shade(col, -.45); ctx.beginPath(); ctx.ellipse(cx, cy, u * .42, u * .21, 0, 0, Math.PI); ctx.lineTo(cx - u * .42, cy - bh); ctx.ellipse(cx, cy - bh, u * .42, u * .21, 0, Math.PI, 0, true); ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(col, -.15); ctx.beginPath(); ctx.ellipse(cx, cy - bh, u * .42, u * .21, 0, 0, 7); ctx.fill();
    const y0 = cy - bh;
    if (morto) {
      const gr = ctx.createLinearGradient(0, y0 - u * .25, 0, y0);
      gr.addColorStop(0, "#a49d93"); gr.addColorStop(1, "#5c5650");
      ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(cx - u * .05, y0 - u * .08, u * .3, u * .09, -.15, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + u * .3, y0 - u * .14, u * .12, 0, 7); ctx.fill();
      ctx.strokeStyle = "#c0392b"; ctx.lineWidth = Math.max(2, u * .06); ctx.beginPath();
      ctx.moveTo(cx - u * .15, y0 - u * .35); ctx.lineTo(cx + u * .05, y0 - u * .15); ctx.moveTo(cx + u * .05, y0 - u * .35); ctx.lineTo(cx - u * .15, y0 - u * .15); ctx.stroke();
      ctx.restore(); return;
    }
    // corpo a pedone, illuminato da sinistra
    const gr = ctx.createLinearGradient(cx - u * .3, 0, cx + u * .3, 0);
    gr.addColorStop(0, shade(col, .35)); gr.addColorStop(.45, col); gr.addColorStop(1, shade(col, -.45));
    ctx.fillStyle = gr; ctx.strokeStyle = "rgba(0,0,0,.55)"; ctx.lineWidth = 1;
    sagoma(ctx, cx, y0, u); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, y0 - .52 * u, .19 * u, .065 * u, 0, 0, 7); ctx.fill(); ctx.stroke();
    const hy = y0 - .73 * u, hr = .17 * u;
    const gh = ctx.createRadialGradient(cx - hr * .4, hy - hr * .4, hr * .1, cx, hy, hr);
    gh.addColorStop(0, shade(col, .5)); gh.addColorStop(.7, col); gh.addColorStop(1, shade(col, -.4));
    ctx.fillStyle = gh; ctx.beginPath(); ctx.arc(cx, hy, hr, 0, 7); ctx.fill(); ctx.stroke();
    if (t.tipo !== "pg") { // corna: i mostri si riconoscono al volo
      ctx.fillStyle = "#efe4cc"; ctx.strokeStyle = "rgba(0,0,0,.6)";
      for (const d of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(cx + d * hr * .5, hy - hr * .6); ctx.quadraticCurveTo(cx + d * hr * 1.4, hy - hr * 1.1, cx + d * hr * 1.2, hy - hr * 2); ctx.lineTo(cx + d * hr * .9, hy - hr * .7); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    }
    // sigla sul corpo
    if (u >= 16) {
      const lab = window.Tavolo.iniziali(t.nome);
      ctx.font = "700 " + Math.round(u * (lab.length > 2 ? .17 : .21)) + "px 'Alegreya Sans SC', 'Trebuchet MS', sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.lineWidth = Math.max(2, u * .05); ctx.strokeStyle = "rgba(0,0,0,.7)"; ctx.strokeText(lab, cx, y0 - .22 * u);
      ctx.fillStyle = "#fff"; ctx.fillText(lab, cx, y0 - .22 * u);
    }
    // barra dei PF sopra la testa
    const top = hy - hr - (t.tipo !== "pg" ? hr * 1.1 : 0) - 6;
    const bw = Math.max(22, u * .7), bhh = Math.max(4, u * .08), f = Math.max(0, Math.min(1, t.pf / t.pfMax));
    ctx.fillStyle = "rgba(0,0,0,.75)"; ctx.fillRect(cx - bw / 2 - 1, top - bhh - 1, bw + 2, bhh + 2);
    ctx.fillStyle = "#b8281c"; ctx.fillRect(cx - bw / 2, top - bhh, bw, bhh);
    ctx.fillStyle = f > .5 ? "#3fd34a" : f > .25 ? "#f0c330" : "#ff6a3a"; ctx.fillRect(cx - bw / 2, top - bhh, bw * f, bhh);
    let labelY = top - bhh - 4;
    if (t.condizioni && t.condizioni.length) {
      ctx.fillStyle = "#c9a24a"; ctx.beginPath(); ctx.arc(cx + bw / 2 + 7, top - bhh / 2, 6.5, 0, 7); ctx.fill();
      ctx.fillStyle = "#10211d"; ctx.font = "700 10px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(t.condizioni.length, cx + bw / 2 + 7, top - bhh / 2 + .5);
    }
    if (o.selezionata || o.turno || o.etichette) {
      ctx.font = "700 12px 'Alegreya Sans SC', 'Trebuchet MS', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "bottom";
      const tw = ctx.measureText(t.nome).width + 10;
      ctx.fillStyle = "rgba(10,22,19,.85)"; ctx.fillRect(cx - tw / 2, labelY - 16, tw, 16);
      ctx.fillStyle = o.turno ? "#f4d27a" : "#ece3cf"; ctx.fillText(t.nome, cx, labelY - 2);
      labelY -= 18;
    }
    if (o.turno) { // freccia d'oro sopra chi agisce
      ctx.fillStyle = "#f4d27a"; ctx.strokeStyle = "rgba(0,0,0,.6)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx - 7, labelY - 12); ctx.lineTo(cx + 7, labelY - 12); ctx.lineTo(cx, labelY - 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  function silhouette(ctx, t, b) { // vista "a raggi X" per chi è dietro un muro
    if (t.pf <= 0) return;
    const { x: cx, y: cy, u } = b, y0 = cy - u * .09;
    ctx.save(); ctx.globalAlpha = .3; ctx.fillStyle = t.colore;
    sagoma(ctx, cx, y0, u); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, y0 - .73 * u, .17 * u, 0, 7); ctx.fill();
    ctx.restore();
  }

  // ---------------- scena completa ----------------
  function disegna(ctx, w, h, st, view, cache, o) {
    const s = view.s, k = s / CS;
    ctx.drawImage(cache.canvas, view.ox - st.rows * s, view.oy, cache.canvas.width * k, cache.canvas.height * k);
    const pedine = st.pedine.map((t) => {
      const pos = o.drag && o.drag.id === t.id ? o.drag.a : t;
      return { t, pos, d: pos.x + pos.y + 2 * (t.taglia - 1) + .5 };
    }).sort((a, b) => a.d - b.d);

    // evidenzia la destinazione durante il trascinamento
    if (o.drag) {
      const t = st.pedine.find((p) => p.id === o.drag.id);
      if (t) {
        const troppo = o.drag.piedi > (t.vel || 30);
        ctx.fillStyle = troppo ? "rgba(214,73,58,.35)" : "rgba(244,210,122,.35)";
        ctx.strokeStyle = troppo ? "#ff8a7a" : "#f4d27a"; ctx.lineWidth = 1.5;
        for (let j = 0; j < t.taglia; j++) for (let i = 0; i < t.taglia; i++) {
          const x = o.drag.a.x + i, y = o.drag.a.y + j;
          rombo(ctx, view.ox + (x - y) * s, view.oy + (x + y) * s / 2, s); ctx.fill(); ctx.stroke();
        }
        disegnaPedina(ctx, t, baseDi(t, view, o.drag.da), { fantasma: true });
      }
    }

    // oggetti e pedine insieme, dal fondo verso chi guarda
    const ogg = cache.oggetti; let i = 0;
    const margine = 3 * s;
    for (const p of pedine) {
      while (i < ogg.length && ogg[i].d < p.d) { visibile(ogg[i]) && disegnaOggetto(ctx, ogg[i], view, cache.g); i++; }
      disegnaPedina(ctx, p.t, baseDi(p.t, view, p.pos), { selezionata: p.t.id === o.sel, turno: p.t.id === o.turno });
    }
    while (i < ogg.length) { visibile(ogg[i]) && disegnaOggetto(ctx, ogg[i], view, cache.g); i++; }
    for (const p of pedine) silhouette(ctx, p.t, baseDi(p.t, view, p.pos));

    function visibile(ob) {
      const X = view.ox + (ob.x - ob.y) * s, Y = view.oy + (ob.x + ob.y) * s / 2;
      return X > -margine && X < w + margine && Y > -margine && Y < h + margine;
    }

    if (o.drag) {
      const t = st.pedine.find((p) => p.id === o.drag.id);
      if (t) {
        const a = baseDi(t, view, o.drag.da), b = baseDi(t, view, o.drag.a), troppo = o.drag.piedi > (t.vel || 30);
        ctx.strokeStyle = troppo ? "#ff6a5a" : "#f4d27a"; ctx.lineWidth = 3; ctx.setLineDash([7, 5]);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.setLineDash([]);
        const label = o.drag.piedi + " ft" + (troppo ? " · oltre " + (t.vel || 30) : "");
        ctx.font = "700 14px 'Alegreya Sans SC', 'Trebuchet MS', sans-serif";
        const tw = ctx.measureText(label).width + 14;
        const lx = Math.min(w - tw - 4, Math.max(4, b.x - tw / 2)), ly = Math.min(h - 28, b.y + 10);
        ctx.fillStyle = "rgba(10,22,19,.9)"; ctx.fillRect(lx, ly, tw, 24);
        ctx.fillStyle = troppo ? "#ff9a8a" : "#f4d27a"; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText(label, lx + 7, ly + 12);
      }
    }
  }

  // ---------------- conversioni ----------------
  function casella(px, py, view) {
    const a = (px - view.ox) / view.s, b = (py - view.oy) / (view.s / 2);
    return { x: Math.floor((a + b) / 2), y: Math.floor((b - a) / 2) };
  }
  function pedinaIn(px, py, st, view) {
    const ord = st.pedine.slice().sort((a, b) => (b.x + b.y + 2 * b.taglia) - (a.x + a.y + 2 * a.taglia));
    for (const t of ord) {
      const b = baseDi(t, view);
      const inBase = ((px - b.x) / (b.u * .48)) ** 2 + ((py - b.y) / (b.u * .26)) ** 2 <= 1;
      const inCorpo = Math.abs(px - b.x) < b.u * .3 && py < b.y && py > b.y - b.u * .95;
      if (inBase || inCorpo) return t;
    }
    return null;
  }
  function adatta(w, h, st) {
    const n = st.cols + st.rows;
    const s = Math.min(w / n, (h - 10) / (n / 2 + 2.6));
    return { s, ox: (w - n * s) / 2 + st.rows * s, oy: (h - (n / 2 + 0.6) * s) / 2 + s };
  }
  function centra(view, w, h, x, y) { // porta la casella (x,y) al centro dello schermo
    view.ox = w / 2 - (x - y) * view.s; view.oy = h / 2 - (x + y) * view.s / 2;
  }

  window.Iso = { costruisci, disegna, casella, pedinaIn, adatta, centra };
})();
