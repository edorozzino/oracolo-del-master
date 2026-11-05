// Statistiche base dal System Reference Document 5.1 (PF medi, CA, mod. Destrezza).
window.BESTIARIO = {
  goblin:        { nome: "Goblin",            pf: 7,   ca: 15, init: 2,  vel: 30, taglia: 1, gs: "1/4" },
  scheletro:     { nome: "Scheletro",         pf: 13,  ca: 13, init: 2,  vel: 30, taglia: 1, gs: "1/4" },
  zombi:         { nome: "Zombi",             pf: 22,  ca: 8,  init: -2, vel: 20, taglia: 1, gs: "1/4" },
  lupo:          { nome: "Lupo",              pf: 11,  ca: 13, init: 2,  vel: 40, taglia: 1, gs: "1/4" },
  stirge:        { nome: "Stirge",            pf: 2,   ca: 14, init: 3,  vel: 40, taglia: 1, gs: "1/8" },
  bandito:       { nome: "Bandito",           pf: 11,  ca: 12, init: 1,  vel: 30, taglia: 1, gs: "1/8" },
  cultista:      { nome: "Cultista",          pf: 9,   ca: 12, init: 1,  vel: 30, taglia: 1, gs: "1/8" },
  orco:          { nome: "Orco",              pf: 15,  ca: 13, init: 1,  vel: 30, taglia: 1, gs: "1/2" },
  ghoul:         { nome: "Ghoul",             pf: 22,  ca: 12, init: 2,  vel: 30, taglia: 1, gs: "1" },
  lupoCrudele:   { nome: "Lupo crudele",      pf: 37,  ca: 14, init: 2,  vel: 50, taglia: 2, gs: "1" },
  capoBandito:   { nome: "Capo dei banditi",  pf: 65,  ca: 15, init: 3,  vel: 30, taglia: 1, gs: "2" },
  ogre:          { nome: "Ogre",              pf: 59,  ca: 11, init: -1, vel: 40, taglia: 2, gs: "2" },
  mimic:         { nome: "Mimic",             pf: 58,  ca: 12, init: 1,  vel: 15, taglia: 1, gs: "2" },
  orsogufo:      { nome: "Orsogufo",          pf: 59,  ca: 13, init: 1,  vel: 40, taglia: 2, gs: "3" },
  stregaVerde:   { nome: "Megera verde",      pf: 82,  ca: 17, init: 1,  vel: 30, taglia: 1, gs: "3" },
  dragoVerde:    { nome: "Giovane drago verde", pf: 136, ca: 18, init: 1, vel: 40, taglia: 2, gs: "8" }
};

// Chi abita ogni ambientazione: gregari e un possibile capo.
window.ABITANTI = {
  dungeon: { gregari: ["goblin", "scheletro", "cultista", "zombi"], capi: ["mimic", "ghoul", "capoBandito"] },
  caverna: { gregari: ["goblin", "stirge", "orco"],                  capi: ["orsogufo", "ogre"] },
  foresta: { gregari: ["lupo", "bandito", "lupoCrudele"],            capi: ["stregaVerde", "orsogufo"] },
  taverna: { gregari: ["bandito", "cultista"],                       capi: ["capoBandito"] },
  rovine:  { gregari: ["scheletro", "zombi", "ghoul"],               capi: ["dragoVerde", "ogre"] }
};

window.DIFFICOLTA = {
  facile:    { nome: "Facile",    gregari: 2, capo: false },
  media:     { nome: "Media",     gregari: 4, capo: false },
  difficile: { nome: "Difficile", gregari: 4, capo: true },
  mortale:   { nome: "Mortale",   gregari: 6, capo: true }
};

window.PG_BASE = [
  { nome: "Guerriera", pf: 28, ca: 18, init: 1, vel: 30, colore: "#3f7fbf" },
  { nome: "Mago",      pf: 16, ca: 12, init: 3, vel: 30, colore: "#8a5cc2" },
  { nome: "Ladra",     pf: 22, ca: 14, init: 4, vel: 30, colore: "#2e9c8f" },
  { nome: "Chierico",  pf: 24, ca: 16, init: 0, vel: 25, colore: "#c79a2e" }
];

window.CONDIZIONI = ["Prono", "Avvelenato", "Spaventato", "Stordito", "Afferrato",
  "Accecato", "Invisibile", "Paralizzato", "Concentrazione"];

window.Dadi = (function () {
  const r = (n) => 1 + Math.floor(Math.random() * n);
  function espressione(testo) {
    const m = String(testo).replace(/\s+/g, "").toLowerCase().match(/^(\d*)d(\d+)([+-]\d+)?$/);
    if (!m) return null;
    const n = Math.min(Math.max(+m[1] || 1, 1), 50), facce = +m[2], mod = +(m[3] || 0);
    if (facce < 2 || facce > 1000) return null;
    const tiri = Array.from({ length: n }, () => r(facce));
    return { testo: n + "d" + facce + (mod ? (mod > 0 ? "+" : "") + mod : ""), tiri, mod, totale: tiri.reduce((a, b) => a + b, 0) + mod };
  }
  function d20(mod = 0, modo = "normale") {
    const a = r(20), b = r(20);
    const nat = modo === "vantaggio" ? Math.max(a, b) : modo === "svantaggio" ? Math.min(a, b) : a;
    return { tiri: modo === "normale" ? [a] : [a, b], naturale: nat, mod, totale: nat + mod };
  }
  return { r, espressione, d20 };
})();
