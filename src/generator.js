// Generatore deterministico: ogni carta ha un proprio seme, così una scena
// si può ricostruire e condividere da un link.
(function () {
  const D = window.ORACOLO_DATA;

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
  const roll = (rng, sides) => 1 + Math.floor(rng() * sides);

  const CARDS = [
    {
      id: "luogo", label: "Luogo", glyph: "◈", die: 20,
      make(rng) {
        return {
          title: pick(rng, D.luoghi.biomi),
          body: cap(pick(rng, D.luoghi.tipi)) + " " + pick(rng, D.luoghi.dettagli) + ".",
          meta: []
        };
      }
    },
    {
      id: "atmosfera", label: "Atmosfera", glyph: "☾", die: 12,
      make(rng) {
        return {
          title: pick(rng, D.atmosfere.meteo),
          body: cap(pick(rng, D.atmosfere.momenti)) + ". Si sente " + pick(rng, D.atmosfere.suoni) + ".",
          meta: []
        };
      }
    },
    {
      id: "png", label: "PNG", glyph: "☉", die: 10,
      make(rng) {
        return {
          title: pick(rng, D.png.nomi),
          body: cap(pick(rng, D.png.razze)) + ", " + pick(rng, D.png.mestieri) + ". " +
            cap(pick(rng, D.png.tratti)) + ".",
          meta: [["Segreto", pick(rng, D.png.segreti)]]
        };
      }
    },
    {
      id: "minaccia", label: "Minaccia", glyph: "⚔", die: 8,
      make(rng) {
        return {
          title: cap(pick(rng, D.minacce.creature)),
          body: cap(pick(rng, D.minacce.moventi)) + ".",
          meta: [["Sfida", pick(rng, D.minacce.sfide)], ["Numero", String(roll(rng, 4))]]
        };
      }
    },
    {
      id: "tesoro", label: "Tesoro", glyph: "✦", die: 6,
      make(rng) {
        return {
          title: cap(pick(rng, D.tesori.oggetti)),
          body: cap(pick(rng, D.tesori.prezzi)) + ".",
          meta: [["Rarità", pick(rng, D.tesori.rarita)], ["Monete", roll(rng, 6) * 10 + " mo"]]
        };
      }
    },
    {
      id: "gancio", label: "Gancio", glyph: "❦", die: 4,
      make(rng) {
        return { title: "Lo spunto", body: pick(rng, D.ganci), meta: [] };
      }
    }
  ];

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function newSeed() { return Math.floor(Math.random() * 2176782335) + 1; } // fino a "zzzzzz"

  function draw(card, seed) {
    const rng = mulberry32(seed);
    return Object.assign({ seed, roll: roll(rng, card.die) }, card.make(rng));
  }

  function toText(scene) {
    return CARDS.map((c, i) => {
      const r = scene[i];
      const meta = r.meta.map(([k, v]) => k + ": " + v).join(" · ");
      return "【" + c.label + "】 " + r.title + "\n" + r.body + (meta ? "\n" + meta : "");
    }).join("\n\n");
  }

  window.Oracolo = { CARDS, draw, newSeed, toText, mulberry32 };
})();
