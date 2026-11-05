// Aggiunge un numero di versione ai file di stile e script in index.html,
// così i browser (soprattutto su telefono) scaricano sempre quelli nuovi.
// Da lanciare prima di ogni pubblicazione: node scripts/versione.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const file = join(dirname(fileURLToPath(import.meta.url)), "..", "index.html");
const v = new Date().toISOString().replace(/\D/g, "").slice(0, 12);
const html = readFileSync(file, "utf8").replace(/((?:src|href)="src\/[^"?]+)(\?v=\d+)?"/g, `$1?v=${v}"`);
writeFileSync(file, html);
console.log("Versione " + v);
