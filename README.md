# Oracolo del Master

Generatore di scene per Dungeons & Dragons (e qualsiasi gioco fantasy). Premi un pulsante e peschi sei carte:

| Carta | Dado | Cosa ti dà |
|---|---|---|
| ◈ Luogo | d20 | regione, tipo di luogo e un dettaglio strano |
| ☾ Atmosfera | d12 | meteo, momento della giornata, suono di sottofondo |
| ☉ PNG | d10 | nome, razza, mestiere, tic e segreto |
| ⚔ Minaccia | d8 | creatura, movente, difficoltà e numero |
| ✦ Tesoro | d6 | oggetto, rarità, monete e il suo prezzo nascosto |
| ❦ Gancio | d4 | lo spunto che mette in moto la scena |

## Come si gioca

- **Lancia l'Oracolo** (o barra spaziatrice) per una scena nuova.
- **Blocca** le carte che ti piacciono: restano ferme quando rilanci.
- **Rilancia** una singola carta per cambiare solo quella.
- **Copia link**: ogni scena è codificata nell'indirizzo (`#semi-delle-carte`), chi lo apre vede la stessa scena.
- **Copia testo**: incolla la scena negli appunti di sessione.
- **Salva scena**: tiene le ultime 20 scene nel browser.

## Avvio

Nessuna dipendenza. Apri `index.html` nel browser, oppure:

```bash
npx serve .          # o: python3 -m http.server
```

Per un unico file autonomo (CSS e JS incorporati):

```bash
node scripts/build.mjs   # → dist/oracolo.html
```

## Pubblicare su GitHub Pages

```bash
git remote add origin https://github.com/<utente>/oracolo-del-master.git
git push -u origin main
```

Poi su GitHub: *Settings → Pages → Deploy from branch → main / root*.

## Struttura

```
index.html          pagina del gioco
src/data.js         tabelle casuali (luoghi, PNG, mostri, tesori…)
src/generator.js    generatore con semi deterministici
src/app.js          interfaccia: lancio, blocco, link, salvataggi
src/style.css       stile "tavolo da gioco"
scripts/build.mjs   crea la versione a file singolo
```

## Aggiungere contenuti

Tutto il materiale sta in `src/data.js`: aggiungi voci agli elenchi e compariranno subito nelle pescate. Per una carta nuova, aggiungi un oggetto all'array `CARDS` in `src/generator.js` con `id`, `label`, `glyph`, `die` e una funzione `make(rng)`.

## Idee per il futuro

- Tabelle tematiche (horror, piratesco, urbano) selezionabili
- Modalità dungeon: una mappa a stanze generata con la stessa logica
- Generazione dei testi con un modello linguistico, partendo dalle carte
- Esportazione PDF delle scene salvate

## Licenza

MIT
