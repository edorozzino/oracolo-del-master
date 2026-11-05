// Figure dei personaggi e dei mostri, disegnate in piedi su un punto a terra.
// Figure.disegna(ctx, pedina, cx, cy, u) -> y della cima (per la barra dei PF).
// u è l'unità di scala: un umano alto "1" è alto circa u pixel.
(function () {
  function sh(hex, f) {
    if (!hex || hex[0] !== "#") return hex;
    const n = parseInt(hex.slice(1), 16);
    const ch = (v) => Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f)));
    return "rgb(" + ch(n >> 16) + "," + ch((n >> 8) & 255) + "," + ch(n & 255) + ")";
  }
  // riempimento "in volume": luce da sinistra
  function vol(ctx, x0, x1, col, forza = 1) {
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, sh(col, .28 * forza)); g.addColorStop(.45, col); g.addColorStop(1, sh(col, -.42 * forza));
    return g;
  }
  const BORDO = "rgba(20,12,6,.55)";

  // ---------------- dati ----------------
  const RAZZE = {
    umano:     { nome: "Umano",     h: 1.0,  larg: 1.0,  pelle: ["#f0cfb0", "#d9a77f", "#b07a52", "#7a4e32"], capelli: ["#2b1d14", "#5a3a1e", "#a0672f", "#d9b25c", "#1a1a1a"] },
    elfo:      { nome: "Elfo",      h: 1.03, larg: .88,  pelle: ["#f3dcc4", "#e6c3a2", "#c9a88a", "#a9b8d0"], capelli: ["#f0e2a8", "#e8e8e8", "#3a2a1a", "#b8442a"], orecchie: "elfo", capelliLunghi: true },
    nano:      { nome: "Nano",      h: .78,  larg: 1.3,  pelle: ["#e4b08f", "#c98f6c", "#a8704f"], capelli: ["#8a3a1a", "#3a2a1a", "#c56a2a", "#9a9a9a"], barba: true },
    halfling:  { nome: "Halfling",  h: .64,  larg: 1.0,  pelle: ["#f0cfb0", "#d9a77f", "#b07a52"], capelli: ["#5a3a1e", "#a0672f", "#2b1d14"], ricci: true },
    gnomo:     { nome: "Gnomo",     h: .62,  larg: .95,  pelle: ["#f2d0b5", "#d9a77f"], capelli: ["#f0f0f0", "#e07a2a", "#8a5ac0"], naso: true, orecchie: "piccole", ricci: true },
    tiefling:  { nome: "Tiefling",  h: 1.0,  larg: 1.0,  pelle: ["#b8423a", "#8a3a7a", "#c25a4a", "#6a4a8a"], capelli: ["#1a1a2a", "#3a1a3a", "#5a1a1a"], corna: "ricurve", coda: true, occhi: "#ffd23a" },
    dragonide: { nome: "Dragonide", h: 1.06, larg: 1.18, pelle: ["#b8862a", "#3a6ab0", "#a83a2a", "#3a8a4a", "#b8b8c4"], muso: true },
    mezzorco:  { nome: "Mezzorco",  h: 1.05, larg: 1.22, pelle: ["#8a9a6a", "#7a8a5a", "#9aa07a"], capelli: ["#1a1a1a", "#3a2a1a"], zanne: true, orecchie: "punta" },
    aasimar:   { nome: "Aasimar",   h: 1.0,  larg: 1.0,  pelle: ["#f6e0c8", "#e8c8a0", "#c8a080"], capelli: ["#f6e6a0", "#ffffff", "#d8b060"], aureola: true, capelliLunghi: true, occhi: "#bfe8ff" },
    goliath:   { nome: "Goliath",   h: 1.14, larg: 1.32, pelle: ["#9a9a9a", "#8a8f96", "#a8a29a"], calvo: true, segni: true }
  };

  const CLASSI = {
    guerriero: { nome: "Guerriero", busto: "#8a929c", metallo: true, gambe: "#4a3a2a", testa: "elmo", arma: "spada", mano2: "scudo" },
    paladino:  { nome: "Paladino",  busto: "#c8ccd4", metallo: true, gambe: "#7a7e88", testa: "elmoPiuma", arma: "spadone", mano2: "scudoCroce", mantello: true },
    barbaro:   { nome: "Barbaro",   busto: null, pelliccia: "#7a5a3a", gambe: "#5a3a22", arma: "ascia" },
    ranger:    { nome: "Ranger",    busto: "#4a6a3a", gambe: "#5a4a32", testa: "cappuccio", cappuccio: "#3a5a2a", arma: "pugnale", mano2: "arco", faretra: true },
    ladro:     { nome: "Ladro",     busto: "#3a3a46", gambe: "#2a2a30", testa: "cappuccio", cappuccio: "#2a2a34", arma: "pugnale", mano2: "pugnale" },
    mago:      { nome: "Mago",      veste: "#3a4aa0", testa: "cappelloMago", arma: "bastoneMago" },
    stregone:  { nome: "Stregone",  veste: "#8a2a4a", arma: "fiamma", mano2: "fiamma" },
    warlock:   { nome: "Warlock",   veste: "#33243f", testa: "cappuccio", cappuccio: "#24182e", arma: "energia", mano2: "libro" },
    chierico:  { nome: "Chierico",  veste: "#e8e0c8", testa: "cerchietto", arma: "mazza", mano2: "scudo", simbolo: true },
    druido:    { nome: "Druido",    veste: "#5a6a3a", testa: "corona", arma: "bastoneDruido" },
    bardo:     { nome: "Bardo",     busto: "#a83a5a", gambe: "#3a2a4a", testa: "berretto", arma: "stocco", liuto: true },
    monaco:    { nome: "Monaco",    busto: "#d8862a", gambe: "#d8862a", testa: "fascia", calvo: true, cintura: "#3a2a1a" }
  };

  // Aspetto dei mostri: umanoidi con parametri, o disegni dedicati.
  const MOSTRI = {
    goblin:      { nome: "Goblin", h: .66, larg: 1, pelle: "#7f9e3c", occhi: "#ffd23a", orecchie: "goblin", calvo: true, naso: true, busto: "#6a4a2a", gambe: "#4a3a22", arma: "scimitarra", mano2: "scudoLegno" },
    orco:        { nome: "Orco", h: 1.06, larg: 1.32, pelle: "#6f8f45", zanne: true, orecchie: "punta", capelli: "#1a1a1a", busto: "#5a4030", gambe: "#3a2a1a", arma: "ascia", occhi: "#ff4a1a" },
    bandito:     { nome: "Bandito", pelle: "#d9a77f", capelli: "#3a2a1a", testa: "bandana", bandana: "#8a2a1a", busto: "#7a5a3a", gambe: "#4a3a2a", arma: "scimitarra" },
    capoBandito: { nome: "Capo dei banditi", pelle: "#c99470", capelli: "#1a1a1a", testa: "tricorno", busto: "#7a1a1a", gambe: "#2a2a2a", mantello: true, arma: "stocco", mano2: "pugnale", barbaCorta: true },
    cultista:    { nome: "Cultista", pelle: "#d9b8a0", veste: "#6a1a1a", testa: "cappuccio", cappuccio: "#4a0f0f", arma: "pugnale", ombraVolto: true, occhi: "#ff5a3a" },
    zombi:       { nome: "Zombi", pelle: "#8a9a7a", capelli: "#3a3a2a", busto: "#5a5a4a", gambe: "#4a4a3a", braccia: "avanti", occhi: "#f0f0c0", strappi: true },
    ghoul:       { nome: "Ghoul", h: .92, pelle: "#b8b0a0", calvo: true, busto: null, gambe: "#4a3a2a", artigli: true, occhi: "#ff3a2a", zanne: true, curvo: true },
    stregaVerde: { nome: "Megera verde", pelle: "#7aa05a", capelli: "#2a2a2a", capelliLunghi: true, veste: "#2a3a2a", naso: true, arma: "bastoneNodoso", occhi: "#ffd23a", artigli: true, curvo: true },
    ogre:        { nome: "Ogre", h: 1.0, larg: 1.5, pelle: "#c8a06a", calvo: true, zanne: true, ventre: true, busto: null, perizoma: "#6a4a2a", gambe: null, arma: "clava", occhi: "#2a1a0a" },
    scheletro:   { nome: "Scheletro", speciale: "scheletro" },
    lupo:        { nome: "Lupo", speciale: "lupo", col: "#8a8a8e" },
    lupoCrudele: { nome: "Lupo crudele", speciale: "lupo", col: "#4a4a52", grande: true },
    stirge:      { nome: "Stirge", speciale: "stirge" },
    orsogufo:    { nome: "Orsogufo", speciale: "orsogufo" },
    mimic:       { nome: "Mimic", speciale: "mimic" },
    dragoVerde:  { nome: "Drago verde", speciale: "drago" },
    generico:    { nome: "Creatura", pelle: "#8a5a6a", corna: "dritte", busto: "#4a3a3a", gambe: "#3a2a2a", arma: "scimitarra", occhi: "#ff4a1a" }
  };

  // ---------------- parti dell'umanoide ----------------
  function arma(ctx, tipo, hx, hy, u, H, acc, lato) {
    if (!tipo) return;
    const L = (v) => v * u;
    ctx.lineJoin = "round";
    switch (tipo) {
      case "spada": case "spadone": case "stocco": {
        const len = tipo === "spadone" ? H * .62 : tipo === "stocco" ? H * .55 : H * .46, w = tipo === "stocco" ? L(.016) : L(.034);
        ctx.fillStyle = vol(ctx, hx - w, hx + w, "#c8ccd4"); ctx.strokeStyle = BORDO; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(hx - w, hy - L(.04)); ctx.lineTo(hx - w, hy - len); ctx.lineTo(hx, hy - len - L(.05)); ctx.lineTo(hx + w, hy - len); ctx.lineTo(hx + w, hy - L(.04)); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = tipo === "stocco" ? "#d8b04a" : "#6a4a2a"; ctx.fillRect(hx - L(.08), hy - L(.06), L(.16), L(.03));
        ctx.fillStyle = "#4a3020"; ctx.fillRect(hx - L(.015), hy - L(.035), L(.03), L(.09));
        break;
      }
      case "pugnale": case "scimitarra": {
        const len = tipo === "pugnale" ? H * .2 : H * .38;
        ctx.fillStyle = "#cfd3da"; ctx.strokeStyle = BORDO; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(hx - L(.022), hy - L(.04));
        if (tipo === "scimitarra") { ctx.quadraticCurveTo(hx - L(.06), hy - len * .6, hx + L(.06), hy - len); ctx.quadraticCurveTo(hx + L(.02), hy - len * .5, hx + L(.022), hy - L(.04)); }
        else { ctx.lineTo(hx, hy - len); ctx.lineTo(hx + L(.022), hy - L(.04)); }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#5a3a1a"; ctx.fillRect(hx - L(.05), hy - L(.05), L(.1), L(.022));
        break;
      }
      case "ascia": {
        ctx.strokeStyle = "#5a3a1a"; ctx.lineWidth = L(.035); ctx.beginPath(); ctx.moveTo(hx, hy + L(.08)); ctx.lineTo(hx, hy - H * .55); ctx.stroke();
        const ty = hy - H * .5;
        ctx.fillStyle = vol(ctx, hx, hx + L(.17), "#b8bcc4"); ctx.strokeStyle = BORDO; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(hx, ty - L(.05)); ctx.quadraticCurveTo(hx + L(.2), ty - L(.12), hx + L(.17), ty + L(.04)); ctx.quadraticCurveTo(hx + L(.2), ty + L(.18), hx, ty + L(.09)); ctx.closePath(); ctx.fill(); ctx.stroke();
        break;
      }
      case "mazza": {
        ctx.strokeStyle = "#5a3a1a"; ctx.lineWidth = L(.03); ctx.beginPath(); ctx.moveTo(hx, hy + L(.04)); ctx.lineTo(hx, hy - H * .32); ctx.stroke();
        const g = ctx.createRadialGradient(hx - L(.02), hy - H * .34 - L(.02), 1, hx, hy - H * .34, L(.065));
        g.addColorStop(0, "#e8ecf2"); g.addColorStop(1, "#6a6e78"); ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(hx, hy - H * .34, L(.065), 0, 7); ctx.fill(); ctx.strokeStyle = BORDO; ctx.lineWidth = 1; ctx.stroke();
        break;
      }
      case "clava": {
        ctx.fillStyle = vol(ctx, hx - L(.08), hx + L(.08), "#7a5230"); ctx.strokeStyle = BORDO; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(hx - L(.025), hy + L(.05)); ctx.lineTo(hx - L(.08), hy - H * .5); ctx.quadraticCurveTo(hx, hy - H * .6, hx + L(.08), hy - H * .5); ctx.lineTo(hx + L(.025), hy + L(.05)); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#4a3018"; for (const f of [.3, .42]) { ctx.beginPath(); ctx.arc(hx + L(.02), hy - H * f, L(.015), 0, 7); ctx.fill(); }
        break;
      }
      case "bastoneMago": case "bastoneDruido": case "bastoneNodoso": {
        const top = hy - H * .62, bottom = hy + H * .4;
        ctx.strokeStyle = tipo === "bastoneNodoso" ? "#4a3a22" : "#6a4626"; ctx.lineWidth = L(.03);
        ctx.beginPath(); ctx.moveTo(hx, bottom);
        if (tipo === "bastoneNodoso") { ctx.quadraticCurveTo(hx - L(.05), hy - H * .1, hx + L(.02), hy - H * .3); ctx.quadraticCurveTo(hx + L(.06), hy - H * .5, hx - L(.02), top); }
        else ctx.lineTo(hx, top);
        ctx.stroke();
        if (tipo === "bastoneMago") {
          const g = ctx.createRadialGradient(hx, top - L(.05), 1, hx, top - L(.05), L(.11));
          g.addColorStop(0, "#ffffff"); g.addColorStop(.35, "#7fd8ff"); g.addColorStop(1, "rgba(60,140,255,0)");
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hx, top - L(.05), L(.11), 0, 7); ctx.fill();
        } else if (tipo === "bastoneDruido") {
          ctx.fillStyle = "#5aa040"; for (const [dx, dy] of [[-.05, -.02], [.05, -.04], [0, -.08], [.03, .02]]) { ctx.beginPath(); ctx.ellipse(hx + L(dx), top + L(dy), L(.04), L(.022), dx * 8, 0, 7); ctx.fill(); }
        } else { ctx.fillStyle = "#9ad04a"; ctx.beginPath(); ctx.arc(hx - L(.02), top, L(.03), 0, 7); ctx.fill(); }
        break;
      }
      case "arco": {
        ctx.strokeStyle = "#6a4626"; ctx.lineWidth = L(.028);
        ctx.beginPath(); ctx.moveTo(hx + L(.02), hy - H * .34); ctx.quadraticCurveTo(hx - L(.14) * lato, hy, hx + L(.02), hy + H * .3); ctx.stroke();
        ctx.strokeStyle = "rgba(240,235,220,.85)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hx + L(.02), hy - H * .34); ctx.lineTo(hx + L(.02), hy + H * .3); ctx.stroke();
        break;
      }
      case "fiamma": case "energia": {
        const c = tipo === "fiamma" ? ["#fff2b0", "#ff7a2a", "rgba(255,60,120,0)"] : ["#eaffd0", "#6ae04a", "rgba(80,255,120,0)"];
        const g = ctx.createRadialGradient(hx, hy - L(.06), 1, hx, hy - L(.06), L(.12));
        g.addColorStop(0, c[0]); g.addColorStop(.4, c[1]); g.addColorStop(1, c[2]);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hx, hy - L(.06), L(.12), 0, 7); ctx.fill();
        break;
      }
      case "libro": {
        ctx.fillStyle = "#5a2a6a"; ctx.strokeStyle = BORDO; ctx.lineWidth = 1;
        ctx.fillRect(hx - L(.07), hy - L(.1), L(.14), L(.11)); ctx.strokeRect(hx - L(.07), hy - L(.1), L(.14), L(.11));
        ctx.fillStyle = "#e8d8a0"; ctx.fillRect(hx - L(.07), hy - L(.1), L(.02), L(.11));
        ctx.fillStyle = "#9ae05a"; ctx.beginPath(); ctx.arc(hx + L(.01), hy - L(.045), L(.02), 0, 7); ctx.fill();
        break;
      }
      case "scudo": case "scudoLegno": {
        const r = L(.12), col = tipo === "scudoLegno" ? "#7a5230" : acc;
        const g = ctx.createRadialGradient(hx - r * .4, hy - r * .4 - L(.1), 1, hx, hy - L(.1), r);
        g.addColorStop(0, sh(col, .35)); g.addColorStop(1, sh(col, -.35));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hx, hy - L(.1), r, 0, 7); ctx.fill();
        ctx.strokeStyle = "#9aa0a8"; ctx.lineWidth = Math.max(1.5, L(.022)); ctx.stroke();
        ctx.fillStyle = "#d8dce2"; ctx.beginPath(); ctx.arc(hx, hy - L(.1), r * .22, 0, 7); ctx.fill();
        break;
      }
      case "scudoCroce": {
        const w = L(.13), top = hy - L(.26), bot = hy + L(.06);
        ctx.fillStyle = vol(ctx, hx - w, hx + w, acc); ctx.strokeStyle = "#c8ccd4"; ctx.lineWidth = Math.max(1.5, L(.02));
        ctx.beginPath(); ctx.moveTo(hx - w, top); ctx.lineTo(hx + w, top); ctx.lineTo(hx + w, top + L(.14)); ctx.quadraticCurveTo(hx + w, bot - L(.04), hx, bot); ctx.quadraticCurveTo(hx - w, bot - L(.04), hx - w, top + L(.14)); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#f2d27a"; ctx.fillRect(hx - L(.015), top + L(.03), L(.03), L(.22)); ctx.fillRect(hx - L(.07), top + L(.09), L(.14), L(.03));
        break;
      }
    }
  }

  function umanoide(ctx, cx, cy, u, P) {
    const H = u * (P.h || 1), w = P.larg || 1, k = Math.sqrt(P.h || 1);
    const yHip = cy - H * .42, ySh = cy - H * .74 + (P.curvo ? H * .05 : 0);
    const sw = .17 * u * k * w, hw = .12 * u * k * w;
    const r = .12 * u * k * (P.testa === "cappelloMago" ? 1 : 1);
    const yHead = ySh - r * .85 + (P.curvo ? H * .03 : 0);
    const hx = cx + (P.curvo ? sw * .25 : 0);
    const acc = P.accento || "#c9a24a";
    const pelle = P.pelle;
    ctx.lineJoin = "round"; ctx.lineCap = "round";

    // dietro: coda, mantello, faretra, capelli lunghi
    if (P.coda) {
      ctx.strokeStyle = sh(pelle, -.2); ctx.lineWidth = Math.max(1.5, u * .025);
      ctx.beginPath(); ctx.moveTo(cx + hw * .5, yHip); ctx.quadraticCurveTo(cx + sw * 2.2, yHip + H * .1, cx + sw * 1.9, cy - H * .12); ctx.stroke();
      ctx.fillStyle = sh(pelle, -.2); ctx.beginPath(); ctx.moveTo(cx + sw * 1.9, cy - H * .16); ctx.lineTo(cx + sw * 2.15, cy - H * .08); ctx.lineTo(cx + sw * 1.7, cy - H * .07); ctx.closePath(); ctx.fill();
    }
    if (P.mantello) {
      ctx.fillStyle = vol(ctx, cx - sw * 1.4, cx + sw * 1.4, sh(acc, -.15));
      ctx.beginPath(); ctx.moveTo(cx - sw, ySh); ctx.lineTo(cx + sw, ySh); ctx.lineTo(cx + sw * 1.45, cy - H * .04); ctx.quadraticCurveTo(cx, cy + H * .02, cx - sw * 1.45, cy - H * .04); ctx.closePath(); ctx.fill();
    }
    if (P.faretra) {
      ctx.fillStyle = "#6a4626"; ctx.save(); ctx.translate(cx + sw * .5, ySh + H * .1); ctx.rotate(.35); ctx.fillRect(-u * .04, -H * .26, u * .08, H * .32);
      ctx.fillStyle = "#e8e0c8"; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * u * .025, -H * .26); ctx.lineTo(i * u * .025 - u * .015, -H * .3); ctx.lineTo(i * u * .025 + u * .015, -H * .3); ctx.fill(); }
      ctx.restore();
    }
    const capelli = P.capelli;
    const copreTesta = ["elmo", "elmoPiuma", "cappuccio"].includes(P.testa);
    if (P.capelliLunghi && capelli && !copreTesta) {
      ctx.fillStyle = sh(capelli, -.1); ctx.beginPath(); ctx.ellipse(hx, yHead + r * .9, r * 1.1, r * 1.45, 0, 0, 7); ctx.fill();
    }
    if (P.testa === "cappuccio") {
      ctx.fillStyle = sh(P.cappuccio, -.15); ctx.beginPath(); ctx.ellipse(hx, yHead + r * .2, r * 1.32, r * 1.38, 0, 0, 7); ctx.fill();
    }

    // gambe o veste
    if (P.veste) {
      ctx.fillStyle = vol(ctx, cx - hw * 1.7, cx + hw * 1.7, P.veste); ctx.strokeStyle = BORDO; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx - sw * .95, ySh + H * .02); ctx.lineTo(cx + sw * .95, ySh + H * .02); ctx.lineTo(cx + hw * 1.75, cy - H * .02); ctx.quadraticCurveTo(cx, cy + H * .03, cx - hw * 1.75, cy - H * .02); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = acc; ctx.lineWidth = Math.max(1.5, u * .022); ctx.beginPath(); ctx.moveTo(cx - hw * 1.7, cy - H * .05); ctx.quadraticCurveTo(cx, cy, cx + hw * 1.7, cy - H * .05); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, ySh + H * .05); ctx.lineTo(cx, cy - H * .03); ctx.stroke();
    } else {
      const lw = .075 * u * k * w, lx = .065 * u * k * w, gamba = P.gambe || pelle;
      for (const d of [-1, 1]) {
        ctx.fillStyle = vol(ctx, cx + d * lx - lw, cx + d * lx + lw, gamba); ctx.fillRect(cx + d * lx - lw, yHip, lw * 2, cy - yHip - H * .02);
        ctx.fillStyle = "#3a2618"; ctx.fillRect(cx + d * lx - lw * 1.1, cy - H * .1, lw * 2.2, H * .09);
      }
      if (P.perizoma) { ctx.fillStyle = P.perizoma; ctx.beginPath(); ctx.moveTo(cx - hw * 1.2, yHip - H * .02); ctx.lineTo(cx + hw * 1.2, yHip - H * .02); ctx.lineTo(cx + hw * .6, yHip + H * .16); ctx.lineTo(cx - hw * .6, yHip + H * .16); ctx.closePath(); ctx.fill(); }
      // busto
      const bc = P.busto || pelle;
      ctx.fillStyle = vol(ctx, cx - sw, cx + sw, bc); ctx.strokeStyle = BORDO; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx - sw, ySh); ctx.lineTo(cx + sw, ySh); ctx.lineTo(cx + hw, yHip + H * .03); ctx.lineTo(cx - hw, yHip + H * .03); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (P.metallo) { ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.fillRect(cx - sw * .55, ySh + H * .03, sw * .18, (yHip - ySh) * .8); ctx.strokeStyle = "rgba(30,30,40,.4)"; ctx.beginPath(); ctx.moveTo(cx - hw, ySh + (yHip - ySh) * .55); ctx.lineTo(cx + hw, ySh + (yHip - ySh) * .55); ctx.stroke(); }
      if (P.pelliccia) { ctx.fillStyle = P.pelliccia; ctx.beginPath(); ctx.ellipse(cx, ySh + H * .01, sw * 1.05, H * .05, 0, 0, 7); ctx.fill(); ctx.strokeStyle = "#5a3a22"; ctx.lineWidth = Math.max(1.5, u * .03); ctx.beginPath(); ctx.moveTo(cx - sw * .8, ySh); ctx.lineTo(cx + hw * .8, yHip); ctx.stroke(); }
      if (P.ventre) { ctx.fillStyle = vol(ctx, cx - hw * 1.3, cx + hw * 1.3, sh(pelle, .05)); ctx.beginPath(); ctx.ellipse(cx, yHip - H * .08, hw * 1.25, H * .14, 0, 0, 7); ctx.fill(); }
      if (P.strappi) { ctx.fillStyle = "rgba(20,15,10,.45)"; ctx.beginPath(); ctx.moveTo(cx - hw, yHip); ctx.lineTo(cx - hw * .3, yHip - H * .08); ctx.lineTo(cx + hw * .2, yHip); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = P.cintura || acc; ctx.fillRect(cx - hw * 1.02, yHip - H * .015, hw * 2.04, Math.max(2, H * .04));
    }
    if (P.simbolo) { ctx.fillStyle = "#f2c84a"; ctx.beginPath(); ctx.arc(cx, ySh + H * .1, u * .035, 0, 7); ctx.fill(); ctx.strokeStyle = "#f2c84a"; ctx.lineWidth = 1; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * u * .045, ySh + H * .1 + Math.sin(a) * u * .045); ctx.lineTo(cx + Math.cos(a) * u * .065, ySh + H * .1 + Math.sin(a) * u * .065); ctx.stroke(); } }
    if (P.liuto) { ctx.save(); ctx.translate(cx, yHip - H * .06); ctx.rotate(-.6); ctx.fillStyle = vol(ctx, -u * .1, u * .1, "#b07a3a"); ctx.beginPath(); ctx.ellipse(0, 0, u * .09, u * .07, 0, 0, 7); ctx.fill(); ctx.fillStyle = "#3a2410"; ctx.beginPath(); ctx.arc(0, 0, u * .02, 0, 7); ctx.fill(); ctx.fillStyle = "#6a4626"; ctx.fillRect(u * .06, -u * .012, u * .17, u * .024); ctx.restore(); }

    // braccia
    const manica = P.veste || P.busto || pelle, aw = .065 * u * k * w;
    const mani = [];
    for (const d of [-1, 1]) {
      const ax = cx + d * (sw + aw * .2);
      if (P.braccia === "avanti") {
        ctx.fillStyle = vol(ctx, ax - aw, ax + aw, manica); ctx.beginPath(); ctx.ellipse(ax + d * aw * .3, ySh + H * .1, aw * 1.05, H * .1, d * .5, 0, 7); ctx.fill();
        mani.push([ax + d * aw * .9, ySh + H * .19]);
      } else {
        ctx.fillStyle = vol(ctx, ax - aw, ax + aw, manica); ctx.strokeStyle = BORDO; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(ax - aw, ySh + H * .01); ctx.lineTo(ax + aw, ySh + H * .01); ctx.lineTo(ax + aw * .8, yHip + H * .02); ctx.lineTo(ax - aw * .8, yHip + H * .02); ctx.closePath(); ctx.fill(); ctx.stroke();
        mani.push([ax, yHip + H * .05]);
      }
    }
    for (const [mx, my] of mani) {
      ctx.fillStyle = pelle; ctx.beginPath(); ctx.arc(mx, my, aw * .85, 0, 7); ctx.fill();
      if (P.artigli) { ctx.strokeStyle = "#f0e8d0"; ctx.lineWidth = 1.2; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(mx + i * aw * .5, my + aw * .6); ctx.lineTo(mx + i * aw * .7, my + aw * 1.6); ctx.stroke(); } }
    }
    // armi: principale nella mano destra (a destra di chi guarda), secondaria a sinistra
    arma(ctx, P.arma, mani[1][0], mani[1][1], u, H, acc, 1);
    arma(ctx, P.mano2, mani[0][0], mani[0][1], u, H, acc, -1);

    // collo e testa
    ctx.fillStyle = sh(pelle, -.15); ctx.fillRect(hx - r * .35, yHead + r * .6, r * .7, ySh - yHead - r * .5);
    if (P.orecchie) {
      ctx.fillStyle = sh(pelle, -.08);
      for (const d of [-1, 1]) {
        ctx.beginPath();
        if (P.orecchie === "elfo") { ctx.moveTo(hx + d * r * .85, yHead - r * .05); ctx.lineTo(hx + d * r * 1.65, yHead - r * .7); ctx.lineTo(hx + d * r * .9, yHead + r * .3); }
        else if (P.orecchie === "goblin") { ctx.moveTo(hx + d * r * .8, yHead - r * .2); ctx.lineTo(hx + d * r * 2.0, yHead - r * .35); ctx.lineTo(hx + d * r * .85, yHead + r * .35); }
        else if (P.orecchie === "punta") { ctx.moveTo(hx + d * r * .85, yHead - r * .1); ctx.lineTo(hx + d * r * 1.3, yHead - r * .45); ctx.lineTo(hx + d * r * .9, yHead + r * .3); }
        else { ctx.moveTo(hx + d * r * .85, yHead - r * .1); ctx.lineTo(hx + d * r * 1.25, yHead - r * .3); ctx.lineTo(hx + d * r * .9, yHead + r * .25); }
        ctx.closePath(); ctx.fill();
      }
    }
    if (P.muso) {
      const g = ctx.createRadialGradient(hx - r * .4, yHead - r * .4, 1, hx, yHead, r * 1.2);
      g.addColorStop(0, sh(pelle, .3)); g.addColorStop(1, sh(pelle, -.35));
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(hx, yHead, r * 1.05, r * .95, 0, 0, 7); ctx.fill(); ctx.strokeStyle = BORDO; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(hx, yHead + r * .55, r * .62, r * .45, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#1a1008"; for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(hx + d * r * .2, yHead + r * .55, r * .07, 0, 7); ctx.fill(); }
      ctx.fillStyle = sh(pelle, -.4); for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(hx + d * r * .5, yHead - r * .7); ctx.lineTo(hx + d * r * .85, yHead - r * 1.45); ctx.lineTo(hx + d * r * .8, yHead - r * .55); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = "#ffd23a"; for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(hx + d * r * .42, yHead - r * .05, r * .14, r * .1, 0, 0, 7); ctx.fill(); }
      ctx.fillStyle = "#1a1008"; for (const d of [-1, 1]) { ctx.fillRect(hx + d * r * .42 - r * .025, yHead - r * .12, r * .05, r * .14); }
    } else {
      const g = ctx.createRadialGradient(hx - r * .35, yHead - r * .35, r * .1, hx, yHead, r * 1.05);
      g.addColorStop(0, sh(pelle, .25)); g.addColorStop(.75, pelle); g.addColorStop(1, sh(pelle, -.3));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hx, yHead, r, 0, 7); ctx.fill(); ctx.strokeStyle = BORDO; ctx.lineWidth = 1; ctx.stroke();
      // occhi
      const occhi = P.occhi || "#1a1008", ey = yHead + r * .05;
      for (const d of [-1, 1]) {
        if (P.occhi) { ctx.fillStyle = occhi; ctx.beginPath(); ctx.arc(hx + d * r * .36, ey, r * .14, 0, 7); ctx.fill(); }
        else { ctx.fillStyle = occhi; ctx.beginPath(); ctx.arc(hx + d * r * .35, ey, Math.max(1, r * .1), 0, 7); ctx.fill(); }
      }
      if (P.naso) { ctx.fillStyle = sh(pelle, -.15); ctx.beginPath(); ctx.arc(hx, yHead + r * .32, r * .2, 0, 7); ctx.fill(); }
      if (P.zanne) { ctx.fillStyle = "#f4ecd8"; for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(hx + d * r * .32, yHead + r * .7); ctx.lineTo(hx + d * r * .42, yHead + r * .35); ctx.lineTo(hx + d * r * .2, yHead + r * .62); ctx.closePath(); ctx.fill(); } }
      if (P.segni) { ctx.strokeStyle = "rgba(30,30,40,.55)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(hx - r * .7, yHead - r * .3); ctx.lineTo(hx - r * .45, yHead + r * .4); ctx.moveTo(hx + r * .2, yHead - r * .85); ctx.lineTo(hx + r * .55, yHead - r * .35); ctx.stroke(); }
      if (P.ombraVolto) { ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.beginPath(); ctx.arc(hx, yHead, r, Math.PI, 0); ctx.fill(); ctx.fillStyle = P.occhi; for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(hx + d * r * .35, yHead + r * .05, r * .12, 0, 7); ctx.fill(); } }
    }
    // barba
    if ((P.barba || P.barbaCorta) && capelli) {
      const lung = P.barba ? H * .2 : r * .5;
      ctx.fillStyle = vol(ctx, hx - r, hx + r, capelli); ctx.strokeStyle = BORDO; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(hx - r * .95, yHead + r * .05); ctx.quadraticCurveTo(hx - r * .9, yHead + r * .6 + lung * .5, hx, yHead + r * .55 + lung); ctx.quadraticCurveTo(hx + r * .9, yHead + r * .6 + lung * .5, hx + r * .95, yHead + r * .05);
      ctx.quadraticCurveTo(hx, yHead + r * .55, hx - r * .95, yHead + r * .05); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (P.barba) { ctx.fillStyle = "#d8b04a"; ctx.fillRect(hx - r * .12, yHead + r * .4 + lung * .7, r * .24, r * .12); }
    }
    // capelli
    if (capelli && !P.calvo && !copreTesta && P.testa !== "fascia") {
      ctx.fillStyle = vol(ctx, hx - r, hx + r, capelli);
      ctx.beginPath(); ctx.arc(hx, yHead - r * .05, r * 1.04, Math.PI * 1.02, Math.PI * 1.98); ctx.quadraticCurveTo(hx, yHead - r * .55, hx - r * 1.03, yHead - r * .02); ctx.fill();
      if (P.ricci) for (const [dx, dy] of [[-.7, -.5], [0, -.95], [.7, -.5], [-.35, -.85], [.35, -.85]]) { ctx.beginPath(); ctx.arc(hx + dx * r, yHead + dy * r, r * .28, 0, 7); ctx.fill(); }
    }
    // corna
    if (P.corna) {
      ctx.fillStyle = P.corna === "ricurve" ? "#3a2a2a" : "#e8dcc0"; ctx.strokeStyle = BORDO; ctx.lineWidth = 1;
      for (const d of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(hx + d * r * .35, yHead - r * .78);
        if (P.corna === "ricurve") { ctx.quadraticCurveTo(hx + d * r * 1.25, yHead - r * 1.7, hx + d * r * 1.15, yHead - r * .6); ctx.lineTo(hx + d * r * .95, yHead - r * .85); ctx.quadraticCurveTo(hx + d * r * .95, yHead - r * 1.25, hx + d * r * .62, yHead - r * .62); }
        else { ctx.lineTo(hx + d * r * .7, yHead - r * 1.7); ctx.lineTo(hx + d * r * .7, yHead - r * .7); }
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    }
    // copricapo
    let cima = yHead - r;
    switch (P.testa) {
      case "elmo": case "elmoPiuma": {
        ctx.fillStyle = vol(ctx, hx - r, hx + r, "#9aa0aa"); ctx.strokeStyle = BORDO; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(hx, yHead, r * 1.08, Math.PI, 0); ctx.lineTo(hx + r * 1.08, yHead + r * .15); ctx.lineTo(hx - r * 1.08, yHead + r * .15); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#6a707a"; ctx.fillRect(hx - r * .1, yHead - r * .2, r * .2, r * .65);
        if (P.testa === "elmoPiuma") { ctx.fillStyle = acc; ctx.beginPath(); ctx.moveTo(hx, yHead - r); ctx.quadraticCurveTo(hx - r * .9, yHead - r * 2.1, hx + r * .7, yHead - r * 2.2); ctx.quadraticCurveTo(hx + r * .2, yHead - r * 1.5, hx + r * .3, yHead - r * .95); ctx.closePath(); ctx.fill(); cima = yHead - r * 2.2; }
        else cima = yHead - r * 1.08;
        break;
      }
      case "cappuccio": {
        ctx.fillStyle = vol(ctx, hx - r * 1.3, hx + r * 1.3, P.cappuccio);
        ctx.beginPath(); ctx.arc(hx, yHead - r * .05, r * 1.25, Math.PI * .95, Math.PI * 2.05); ctx.quadraticCurveTo(hx + r * .2, yHead - r * .55, hx - r * 1.24, yHead + r * .1); ctx.fill();
        ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.beginPath(); ctx.arc(hx, yHead, r * .98, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
        cima = yHead - r * 1.3;
        break;
      }
      case "cappelloMago": {
        const col = sh(P.veste || "#3a4aa0", -.1);
        ctx.fillStyle = vol(ctx, hx - r * 2, hx + r * 2, col); ctx.strokeStyle = BORDO; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(hx, yHead - r * .55, r * 1.85, r * .42, 0, 0, 7); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(hx - r * .95, yHead - r * .6); ctx.quadraticCurveTo(hx - r * .3, yHead - r * 2, hx + r * .9, yHead - r * 3); ctx.quadraticCurveTo(hx + r * .2, yHead - r * 1.8, hx + r * .95, yHead - r * .6); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = acc; ctx.lineWidth = Math.max(1.5, r * .22); ctx.beginPath(); ctx.moveTo(hx - r * .9, yHead - r * .78); ctx.quadraticCurveTo(hx, yHead - r * .62, hx + r * .9, yHead - r * .78); ctx.stroke();
        ctx.fillStyle = "#f6e27a"; ctx.beginPath(); ctx.arc(hx + r * .1, yHead - r * 1.5, r * .12, 0, 7); ctx.fill();
        cima = yHead - r * 3;
        break;
      }
      case "berretto": {
        ctx.fillStyle = vol(ctx, hx - r * 1.2, hx + r * 1.2, acc); ctx.beginPath(); ctx.ellipse(hx - r * .15, yHead - r * .78, r * 1.15, r * .45, -.15, 0, 7); ctx.fill();
        ctx.strokeStyle = "#f2efe6"; ctx.lineWidth = Math.max(1.5, r * .12); ctx.beginPath(); ctx.moveTo(hx + r * .5, yHead - r * .9); ctx.quadraticCurveTo(hx + r * 1.4, yHead - r * 1.6, hx + r * 1.7, yHead - r * 2.1); ctx.stroke();
        cima = yHead - r * 1.9;
        break;
      }
      case "cerchietto": ctx.strokeStyle = "#f2c84a"; ctx.lineWidth = Math.max(1.5, r * .16); ctx.beginPath(); ctx.arc(hx, yHead + r * .15, r * 1.0, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); break;
      case "corona": {
        ctx.strokeStyle = "#6a4626"; ctx.lineWidth = Math.max(1.2, r * .1);
        for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(hx + d * r * .5, yHead - r * .8); ctx.lineTo(hx + d * r * .9, yHead - r * 1.6); ctx.moveTo(hx + d * r * .75, yHead - r * 1.25); ctx.lineTo(hx + d * r * 1.15, yHead - r * 1.45); ctx.stroke(); }
        ctx.fillStyle = "#5aa040"; for (const dx of [-.6, -.2, .2, .6]) { ctx.beginPath(); ctx.ellipse(hx + dx * r, yHead - r * .85, r * .2, r * .12, dx, 0, 7); ctx.fill(); }
        cima = yHead - r * 1.6;
        break;
      }
      case "fascia": ctx.fillStyle = acc; ctx.fillRect(hx - r, yHead - r * .45, r * 2, r * .25); break;
      case "bandana": {
        ctx.fillStyle = P.bandana; ctx.beginPath(); ctx.arc(hx, yHead - r * .05, r * 1.04, Math.PI, 0); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(hx - r, yHead - r * .1); ctx.lineTo(hx - r * 1.6, yHead + r * .3); ctx.lineTo(hx - r * 1.3, yHead + r * .45); ctx.closePath(); ctx.fill();
        break;
      }
      case "tricorno": {
        ctx.fillStyle = vol(ctx, hx - r * 1.8, hx + r * 1.8, "#2a2228"); ctx.strokeStyle = BORDO; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(hx - r * 1.75, yHead - r * .55); ctx.quadraticCurveTo(hx, yHead - r * 2.3, hx + r * 1.75, yHead - r * .55); ctx.quadraticCurveTo(hx, yHead - r * .95, hx - r * 1.75, yHead - r * .55); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = "#d8b04a"; ctx.lineWidth = Math.max(1, r * .1); ctx.beginPath(); ctx.moveTo(hx - r * 1.6, yHead - r * .6); ctx.quadraticCurveTo(hx, yHead - r * 2.1, hx + r * 1.6, yHead - r * .6); ctx.stroke();
        cima = yHead - r * 1.7;
        break;
      }
    }
    if (P.aureola) {
      ctx.save(); ctx.strokeStyle = "rgba(255,226,120,.95)"; ctx.shadowColor = "#ffe27a"; ctx.shadowBlur = 8; ctx.lineWidth = Math.max(1.5, r * .16);
      ctx.beginPath(); ctx.ellipse(hx, cima - r * .45, r * .8, r * .25, 0, 0, 7); ctx.stroke(); ctx.restore();
      cima -= r * .7;
    }
    return Math.min(cima, cy - H);
  }

  // ---------------- mostri con disegno dedicato ----------------
  function scheletro(ctx, cx, cy, u) {
    const H = u, osso = "#ece4cc", yHip = cy - H * .42, ySh = cy - H * .73, r = .11 * u, yHead = ySh - r * .9;
    ctx.strokeStyle = osso; ctx.lineCap = "round"; ctx.lineWidth = Math.max(1.5, u * .035);
    const linea = (x1, y1, x2, y2) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
    for (const d of [-1, 1]) { linea(cx + d * u * .06, yHip, cx + d * u * .07, cy - H * .2); linea(cx + d * u * .07, cy - H * .2, cx + d * u * .07, cy - H * .03); }
    ctx.fillStyle = osso; ctx.beginPath(); ctx.ellipse(cx, yHip, u * .1, u * .045, 0, 0, 7); ctx.fill();
    linea(cx, yHip, cx, ySh);
    ctx.lineWidth = Math.max(1.2, u * .025);
    for (let i = 0; i < 4; i++) { const y = ySh + H * .05 + i * H * .055, wv = u * (.13 - i * .015); ctx.beginPath(); ctx.ellipse(cx, y, wv, u * .025, 0, Math.PI * .05, Math.PI * .95); ctx.stroke(); }
    ctx.lineWidth = Math.max(1.5, u * .035);
    linea(cx - u * .15, ySh, cx + u * .15, ySh);
    linea(cx - u * .16, ySh, cx - u * .19, yHip + H * .04);
    linea(cx + u * .16, ySh, cx + u * .2, yHip - H * .02);
    arma(ctx, "spada", cx + u * .2, yHip - H * .02, u, H, "#7a6a4a", 1);
    arma(ctx, "scudoLegno", cx - u * .19, yHip + H * .04, u, H, "#7a5230", -1);
    const g = ctx.createRadialGradient(cx - r * .3, yHead - r * .3, 1, cx, yHead, r); g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#c8bea0");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, yHead, r, 0, 7); ctx.fill();
    ctx.fillRect(cx - r * .55, yHead + r * .5, r * 1.1, r * .45);
    ctx.fillStyle = "#1a1008"; for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + d * r * .38, yHead, r * .25, 0, 7); ctx.fill(); }
    ctx.fillStyle = "#ff5a2a"; for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + d * r * .38, yHead, r * .08, 0, 7); ctx.fill(); }
    return yHead - r;
  }

  function lupo(ctx, cx, cy, u, col, grande) {
    const k = grande ? 1.15 : 1, by = cy - u * .3 * k;
    ctx.strokeStyle = sh(col, -.2); ctx.lineWidth = Math.max(2, u * .05 * k);
    ctx.beginPath(); ctx.moveTo(cx - u * .28 * k, by - u * .02); ctx.quadraticCurveTo(cx - u * .48 * k, by - u * .12, cx - u * .45 * k, by - u * .26 * k); ctx.stroke();
    ctx.fillStyle = sh(col, -.3);
    for (const [dx, back] of [[-.2, 1], [.16, 1]]) ctx.fillRect(cx + dx * u * k - u * .025, by, u * .05, cy - by - u * .02);
    ctx.fillStyle = vol(ctx, cx - u * .32 * k, cx + u * .32 * k, col);
    ctx.beginPath(); ctx.ellipse(cx, by, u * .32 * k, u * .14 * k, -.05, 0, 7); ctx.fill(); ctx.strokeStyle = BORDO; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = sh(col, .15); ctx.beginPath(); ctx.ellipse(cx + u * .03, by + u * .05 * k, u * .2 * k, u * .06 * k, 0, 0, 7); ctx.fill();
    ctx.fillStyle = col; for (const dx of [-.12, .24]) ctx.fillRect(cx + dx * u * k - u * .028, by + u * .04, u * .056, cy - by - u * .06);
    ctx.fillStyle = "#2a2a2a"; for (const dx of [-.2, .16, -.12, .24]) ctx.fillRect(cx + dx * u * k - u * .03, cy - u * .035, u * .06, u * .03);
    // testa
    const hx = cx + u * .3 * k, hy = by - u * .14 * k;
    ctx.fillStyle = vol(ctx, hx - u * .12, hx + u * .12, col); ctx.beginPath(); ctx.ellipse(hx - u * .04, hy + u * .06, u * .1 * k, u * .12 * k, .5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(hx, hy, u * .11 * k, u * .09 * k, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = sh(col, .1); ctx.beginPath(); ctx.ellipse(hx + u * .12 * k, hy + u * .03, u * .08 * k, u * .045 * k, .15, 0, 7); ctx.fill();
    ctx.fillStyle = "#1a1a1a"; ctx.beginPath(); ctx.arc(hx + u * .19 * k, hy + u * .02, u * .02, 0, 7); ctx.fill();
    ctx.fillStyle = sh(col, -.25); for (const dx of [-.06, .03]) { ctx.beginPath(); ctx.moveTo(hx + dx * u, hy - u * .06 * k); ctx.lineTo(hx + (dx + .02) * u, hy - u * .17 * k); ctx.lineTo(hx + (dx + .06) * u, hy - u * .05 * k); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = "#ffd23a"; ctx.beginPath(); ctx.arc(hx + u * .04, hy - u * .015, u * .02, 0, 7); ctx.fill();
    return hy - u * .2 * k;
  }

  function stirge(ctx, cx, cy, u) {
    const y = cy - u * .55;
    ctx.fillStyle = "rgba(10,20,10,.25)"; ctx.beginPath(); ctx.ellipse(cx, cy, u * .18, u * .07, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#5a2a2a";
    for (const d of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(cx + d * u * .05, y - u * .02); ctx.quadraticCurveTo(cx + d * u * .2, y - u * .22, cx + d * u * .36, y - u * .12);
      ctx.lineTo(cx + d * u * .3, y - u * .03); ctx.lineTo(cx + d * u * .24, y + u * .02); ctx.lineTo(cx + d * u * .16, y - u * .01); ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = "#3a1a1a"; ctx.lineWidth = 1; for (const d of [-1, 1]) for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(cx + d * u * .05, y + u * .04); ctx.lineTo(cx + d * u * (.08 + i * .03), y + u * .14); ctx.stroke(); }
    const g = ctx.createRadialGradient(cx - u * .03, y - u * .03, 1, cx, y, u * .1); g.addColorStop(0, "#c86a5a"); g.addColorStop(1, "#6a2a22");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, y, u * .09, 0, 7); ctx.fill();
    ctx.strokeStyle = "#2a1010"; ctx.lineWidth = Math.max(1.2, u * .02); ctx.beginPath(); ctx.moveTo(cx + u * .07, y + u * .02); ctx.lineTo(cx + u * .22, y + u * .12); ctx.stroke();
    ctx.fillStyle = "#ffd23a"; for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + d * u * .035 + u * .02, y - u * .02, u * .018, 0, 7); ctx.fill(); }
    return y - u * .2;
  }

  function orsogufo(ctx, cx, cy, u) {
    const col = "#7a5634", by = cy - u * .42;
    ctx.fillStyle = "#4a3220"; for (const d of [-1, 1]) ctx.fillRect(cx + d * u * .12 - u * .06, cy - u * .2, u * .12, u * .19);
    ctx.fillStyle = vol(ctx, cx - u * .3, cx + u * .3, col); ctx.beginPath(); ctx.ellipse(cx, by, u * .28, u * .3, 0, 0, 7); ctx.fill(); ctx.strokeStyle = BORDO; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = "#c8a878"; ctx.beginPath(); ctx.ellipse(cx, by + u * .05, u * .15, u * .2, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = "rgba(90,60,30,.6)"; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(cx, by - u * .05 + i * u * .07, u * .08, Math.PI * .2, Math.PI * .8); ctx.stroke(); }
    for (const d of [-1, 1]) {
      ctx.fillStyle = vol(ctx, cx + d * u * .3 - u * .07, cx + d * u * .3 + u * .07, col); ctx.beginPath(); ctx.ellipse(cx + d * u * .3, by + u * .02, u * .07, u * .17, d * .25, 0, 7); ctx.fill();
      ctx.strokeStyle = "#f0e8d0"; ctx.lineWidth = 1.5; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(cx + d * u * .33 + i * u * .02, by + u * .17); ctx.lineTo(cx + d * u * .35 + i * u * .03, by + u * .24); ctx.stroke(); }
    }
    const hy = by - u * .38, r = u * .16;
    ctx.fillStyle = vol(ctx, cx - r, cx + r, "#8a6640"); ctx.beginPath(); ctx.arc(cx, hy, r, 0, 7); ctx.fill(); ctx.strokeStyle = BORDO; ctx.stroke();
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + d * r * .5, hy - r * .8); ctx.lineTo(cx + d * r * 1.05, hy - r * 1.55); ctx.lineTo(cx + d * r * .95, hy - r * .55); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = "#e8dcc0"; ctx.beginPath(); ctx.ellipse(cx, hy + r * .1, r * .8, r * .6, 0, 0, 7); ctx.fill();
    for (const d of [-1, 1]) { ctx.fillStyle = "#ffcf3a"; ctx.beginPath(); ctx.arc(cx + d * r * .38, hy, r * .3, 0, 7); ctx.fill(); ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(cx + d * r * .38, hy, r * .15, 0, 7); ctx.fill(); }
    ctx.fillStyle = "#e0902a"; ctx.beginPath(); ctx.moveTo(cx - r * .14, hy + r * .25); ctx.lineTo(cx + r * .14, hy + r * .25); ctx.lineTo(cx, hy + r * .62); ctx.closePath(); ctx.fill();
    return hy - r * 1.55;
  }

  function mimic(ctx, cx, cy, u) {
    const w = u * .32, h = u * .3, top = cy - h;
    ctx.fillStyle = vol(ctx, cx - w, cx + w, "#8a5a2a"); ctx.strokeStyle = BORDO; ctx.lineWidth = 1;
    ctx.fillRect(cx - w, top, w * 2, h); ctx.strokeRect(cx - w, top, w * 2, h);
    ctx.fillStyle = "#5a1a1a"; ctx.fillRect(cx - w * .9, top - u * .02, w * 1.8, u * .06);
    // coperchio aperto
    const lt = top - u * .32;
    ctx.fillStyle = "#4a1010"; ctx.beginPath(); ctx.moveTo(cx - w, top); ctx.lineTo(cx - w * .95, lt); ctx.lineTo(cx + w * .95, lt); ctx.lineTo(cx + w, top); ctx.closePath(); ctx.fill();
    ctx.fillStyle = vol(ctx, cx - w, cx + w, "#9a6a34"); ctx.beginPath(); ctx.moveTo(cx - w * .98, lt + u * .04); ctx.quadraticCurveTo(cx, lt - u * .14, cx + w * .98, lt + u * .04); ctx.lineTo(cx + w * .95, lt - u * .03); ctx.quadraticCurveTo(cx, lt - u * .22, cx - w * .95, lt - u * .03); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#f4ecd8";
    for (let i = 0; i < 6; i++) {
      const x = cx - w * .85 + i * w * .34;
      ctx.beginPath(); ctx.moveTo(x, top - u * .01); ctx.lineTo(x + w * .08, top - u * .1); ctx.lineTo(x + w * .16, top - u * .01); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x, lt + u * .03); ctx.lineTo(x + w * .08, lt + u * .12); ctx.lineTo(x + w * .16, lt + u * .03); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = "#d85a7a"; ctx.beginPath(); ctx.moveTo(cx - u * .04, top - u * .1); ctx.quadraticCurveTo(cx + u * .2, top - u * .1, cx + u * .18, top + u * .14); ctx.quadraticCurveTo(cx + u * .1, top, cx + u * .04, top - u * .05); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#3a3a3a"; ctx.lineWidth = Math.max(1, u * .02); for (const f of [.3, .75]) { ctx.beginPath(); ctx.moveTo(cx - w, top + h * f); ctx.lineTo(cx + w, top + h * f); ctx.stroke(); }
    ctx.fillStyle = "#ffd23a"; ctx.beginPath(); ctx.arc(cx - w * .5, lt - u * .07, u * .03, 0, 7); ctx.fill(); ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(cx - w * .5, lt - u * .07, u * .012, 0, 7); ctx.fill();
    return lt - u * .15;
  }

  function drago(ctx, cx, cy, u) {
    const col = "#3f8a3a", by = cy - u * .28;
    // ali dietro
    for (const d of [-1, 1]) {
      ctx.fillStyle = d < 0 ? "#2f6a2c" : "#245524";
      ctx.beginPath(); ctx.moveTo(cx + d * u * .05, by - u * .12); ctx.lineTo(cx + d * u * .3, by - u * .75); ctx.lineTo(cx + d * u * .55, by - u * .55);
      ctx.lineTo(cx + d * u * .45, by - u * .4); ctx.lineTo(cx + d * u * .5, by - u * .25); ctx.lineTo(cx + d * u * .35, by - u * .18); ctx.lineTo(cx + d * u * .3, by - u * .05); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#1a3a1a"; ctx.lineWidth = Math.max(1.2, u * .015); ctx.beginPath(); ctx.moveTo(cx + d * u * .05, by - u * .12); ctx.lineTo(cx + d * u * .3, by - u * .75); ctx.stroke();
    }
    // coda
    ctx.strokeStyle = sh(col, -.15); ctx.lineWidth = Math.max(3, u * .07); ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(cx - u * .2, by + u * .05); ctx.quadraticCurveTo(cx - u * .5, cy, cx - u * .42, cy - u * .14); ctx.stroke();
    ctx.fillStyle = sh(col, -.4); for (const dx of [-.15, .15]) ctx.fillRect(cx + dx * u - u * .04, by + u * .05, u * .08, cy - by - u * .05);
    ctx.fillStyle = vol(ctx, cx - u * .3, cx + u * .3, col); ctx.beginPath(); ctx.ellipse(cx, by, u * .3, u * .17, 0, 0, 7); ctx.fill(); ctx.strokeStyle = BORDO; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = "#c8c070"; ctx.beginPath(); ctx.ellipse(cx + u * .04, by + u * .07, u * .18, u * .07, 0, 0, 7); ctx.fill();
    ctx.fillStyle = col; for (const dx of [-.08, .2]) ctx.fillRect(cx + dx * u - u * .045, by + u * .08, u * .09, cy - by - u * .09);
    // collo e testa
    ctx.strokeStyle = col; ctx.lineWidth = Math.max(4, u * .1); ctx.beginPath(); ctx.moveTo(cx + u * .18, by - u * .05); ctx.quadraticCurveTo(cx + u * .32, by - u * .3, cx + u * .22, by - u * .5); ctx.stroke();
    const hx = cx + u * .24, hy = by - u * .55;
    ctx.fillStyle = vol(ctx, hx - u * .1, hx + u * .16, col); ctx.beginPath(); ctx.ellipse(hx + u * .03, hy, u * .12, u * .075, .15, 0, 7); ctx.fill(); ctx.strokeStyle = BORDO; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(hx + u * .13, hy + u * .03, u * .08, u * .045, .2, 0, 7); ctx.fill();
    ctx.fillStyle = "#e8dcc0"; for (const dx of [-.04, .02]) { ctx.beginPath(); ctx.moveTo(hx + dx * u, hy - u * .05); ctx.lineTo(hx + (dx - .08) * u, hy - u * .17); ctx.lineTo(hx + (dx + .02) * u, hy - u * .06); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = "#ffd23a"; ctx.beginPath(); ctx.arc(hx + u * .06, hy - u * .015, u * .018, 0, 7); ctx.fill();
    ctx.fillStyle = "#1a3a1a"; for (let i = 0; i < 4; i++) { const x = cx - u * .18 + i * u * .1; ctx.beginPath(); ctx.moveTo(x, by - u * .15); ctx.lineTo(x + u * .03, by - u * .23); ctx.lineTo(x + u * .06, by - u * .15); ctx.closePath(); ctx.fill(); }
    return by - u * .78;
  }

  // ---------------- scelta dell'aspetto ----------------
  function parametri(t) {
    const rng = window.Oracolo.mulberry32(((t.id || 1) * 2654435761 + (t.variante || 0) * 97) >>> 0);
    const pick = (a) => a[Math.floor(rng() * a.length)];
    if (t.tipo === "pg") {
      const R = RAZZE[t.stirpe] || RAZZE.umano, C = CLASSI[t.classe] || CLASSI.guerriero;
      return Object.assign({}, R, C, {
        pelle: pick(R.pelle), capelli: R.capelli ? pick(R.capelli) : null,
        calvo: R.calvo || C.calvo, accento: t.colore,
        // il nano guerriero porta l'elmo sopra la barba; il monaco è rasato
      });
    }
    const M = MOSTRI[t.razza] || MOSTRI.generico;
    return Object.assign({}, M, { accento: t.colore });
  }

  function disegna(ctx, t, cx, cy, u) {
    const P = parametri(t);
    ctx.save();
    let cima;
    switch (P.speciale) {
      case "scheletro": cima = scheletro(ctx, cx, cy, u); break;
      case "lupo": cima = lupo(ctx, cx, cy, u, P.col, P.grande); break;
      case "stirge": cima = stirge(ctx, cx, cy, u); break;
      case "orsogufo": cima = orsogufo(ctx, cx, cy, u); break;
      case "mimic": cima = mimic(ctx, cx, cy, u); break;
      case "drago": cima = drago(ctx, cx, cy, u); break;
      default: cima = umanoide(ctx, cx, cy, u, P);
    }
    ctx.restore();
    return cima;
  }

  // Ritratto per liste e scheda: figura su una piccola basetta colorata.
  function ritratto(canvas, t) {
    const dpr = window.devicePixelRatio || 1, W = canvas.clientWidth || canvas.width, Hh = canvas.clientHeight || canvas.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(Hh * dpr);
    const ctx = canvas.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, Hh);
    const P = parametri(t), cy = Hh * .9, cx = W / 2;
    let u = Hh * .72;
    if (P.testa === "cappelloMago" || P.speciale === "drago") u = Hh * .6;
    if (P.speciale === "lupo") u = W * 1.1;
    ctx.fillStyle = t.pf <= 0 ? "#6a6560" : t.colore; ctx.beginPath(); ctx.ellipse(cx, cy, W * .38, W * .14, 0, 0, 7); ctx.fill();
    if (t.pf <= 0) ctx.globalAlpha = .45;
    disegna(ctx, t, cx, cy - 1, u);
  }

  window.Figure = { RAZZE, CLASSI, MOSTRI, disegna, ritratto };
})();
