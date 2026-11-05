(function () {
  const { CARDS, draw, newSeed, toText } = window.Oracolo;
  const STORE_KEY = "oracolo-scene-salvate";

  let seeds = [];
  let locked = CARDS.map(() => false);
  let scene = [];

  const $table = document.getElementById("table");
  const $status = document.getElementById("status");
  const $saved = document.getElementById("saved-list");

  // ---------- stato da link ----------
  function readHash() {
    const parts = location.hash.replace(/^#/, "").split("-");
    if (parts.length !== CARDS.length) return null;
    const nums = parts.map((p) => parseInt(p, 36));
    return nums.every((n) => Number.isFinite(n) && n > 0) ? nums : null;
  }
  function writeHash() {
    const h = "#" + seeds.map((s) => s.toString(36)).join("-");
    try { history.replaceState(null, "", h); } catch (e) { /* ignorato */ }
  }

  // ---------- disegno ----------
  function cardHTML(card, r, i) {
    const meta = r.meta.map(([k, v]) => `<li><span>${k}</span>${v}</li>`).join("");
    return `
      <div class="card-inner">
        <div class="card-head">
          <span class="card-kind"><span class="glyph" aria-hidden="true">${card.glyph}</span>${card.label}</span>
          <span class="die" title="Tiro di d${card.die}">d${card.die} · <b>${r.roll}</b></span>
        </div>
        <h2>${r.title}</h2>
        <div style="display:grid;gap:10px;align-content:start">
          <p>${r.body}</p>
          ${meta ? `<ul class="meta">${meta}</ul>` : ""}
        </div>
        <div class="card-foot">
          <button type="button" id="lock-${card.id}" data-act="lock" data-i="${i}" aria-pressed="${locked[i]}">${locked[i] ? "Bloccata" : "Blocca"}</button>
          <button type="button" id="reroll-${card.id}" data-act="reroll" data-i="${i}">Rilancia</button>
        </div>
      </div>`;
  }

  function render(flipIdx) {
    scene = CARDS.map((c, i) => draw(c, seeds[i]));
    if (!$table.children.length) {
      $table.innerHTML = CARDS.map((c) => `<article class="card" id="card-${c.id}"></article>`).join("");
    }
    CARDS.forEach((c, i) => {
      const el = $table.children[i];
      el.innerHTML = cardHTML(c, scene[i], i);
      el.classList.toggle("locked", locked[i]);
      if (flipIdx && flipIdx.includes(i)) {
        el.classList.remove("flip"); void el.offsetWidth; el.classList.add("flip");
      }
    });
    writeHash();
  }

  function rollAll() {
    const changed = [];
    seeds = seeds.map((s, i) => (locked[i] ? s : (changed.push(i), newSeed())));
    render(changed);
    say(changed.length ? "Nuova scena pescata." : "Tutte le carte sono bloccate.");
  }

  function say(msg) {
    $status.textContent = msg;
    clearTimeout(say.t);
    say.t = setTimeout(() => ($status.textContent = ""), 2600);
  }

  // ---------- copia ----------
  async function copy(text, ok) {
    try { await navigator.clipboard.writeText(text); say(ok); }
    catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); say(ok); } catch (e2) { say("Copia non riuscita: seleziona il testo a mano."); }
      ta.remove();
    }
  }

  // ---------- scene salvate (solo su questo browser) ----------
  function loadSaved() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch (e) { return []; }
  }
  function storeSaved(list) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); return true; } catch (e) { return false; }
  }
  function renderSaved() {
    const list = loadSaved();
    if (!list.length) {
      $saved.innerHTML = `<li class="saved-empty">Nessuna scena salvata. Premi “Salva scena” per tenerla qui.</li>`;
      return;
    }
    $saved.innerHTML = list.map((s, i) => `
      <li>
        <div class="sname">${s.titolo}<small>${s.quando}</small></div>
        <div class="controls">
          <button class="btn-ghost" type="button" data-load="${i}">Apri</button>
          <button class="btn-ghost" type="button" data-del="${i}">Elimina</button>
        </div>
      </li>`).join("");
  }
  function saveScene() {
    const list = loadSaved();
    list.unshift({
      titolo: scene[0].title + " — " + scene[2].title,
      quando: new Date().toLocaleString("it-IT", { dateStyle: "medium", timeStyle: "short" }),
      seeds: seeds.slice()
    });
    if (storeSaved(list.slice(0, 20))) { renderSaved(); say("Scena salvata."); }
    else say("Il browser non permette di salvare: usa “Copia link”.");
  }

  // ---------- eventi ----------
  document.getElementById("roll").addEventListener("click", rollAll);
  document.getElementById("copy-text").addEventListener("click", () =>
    copy(toText(scene), "Scena copiata come testo."));
  document.getElementById("copy-link").addEventListener("click", () =>
    copy(location.href, "Link della scena copiato."));
  document.getElementById("save").addEventListener("click", saveScene);

  $table.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-act]");
    if (!b) return;
    const i = Number(b.dataset.i);
    if (b.dataset.act === "lock") { locked[i] = !locked[i]; render(); }
    else { seeds[i] = newSeed(); render([i]); }
  });
  $saved.addEventListener("click", (e) => {
    const l = e.target.closest("[data-load]"), d = e.target.closest("[data-del]");
    const list = loadSaved();
    if (l) { seeds = list[+l.dataset.load].seeds.slice(); render(CARDS.map((_, i) => i)); say("Scena riaperta."); window.scrollTo({ top: 0, behavior: "smooth" }); }
    if (d) { list.splice(+d.dataset.del, 1); storeSaved(list); renderSaved(); }
  });
  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && !/INPUT|TEXTAREA|BUTTON/.test(document.activeElement.tagName)) {
      e.preventDefault(); rollAll();
    }
  });
  window.addEventListener("hashchange", () => {
    const h = readHash();
    if (h && h.join() !== seeds.join()) { seeds = h; render(CARDS.map((_, i) => i)); }
  });

  // ---------- avvio ----------
  seeds = readHash() || CARDS.map(() => newSeed());
  render();
  renderSaved();
})();
