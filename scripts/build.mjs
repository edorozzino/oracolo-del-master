// Crea dist/oracolo.html: un unico file con CSS e JS incorporati,
// da aprire offline o pubblicare dove si vuole.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

let html = read("index.html")
  .replace(/<link rel="stylesheet" href="src\/style\.css(\?v=\d+)?">/, () => `<style>\n${read("src/style.css")}\n</style>`)
  .replace(/<script src="(src\/[^"?]+)(\?v=\d+)?"><\/script>/g, (_, p) => `<script>\n${read(p)}\n</script>`);

// manifest e icona servono solo alla versione pubblicata dal repository
html = html.replace(/^.*(rel="manifest"|rel="apple-touch-icon").*\n/gm, "");

mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist/oracolo.html"), html);
console.log("Creato dist/oracolo.html (" + Math.round(html.length / 1024) + " KB)");
