// Verificacoes que rodam no CI antes de publicar (sem dependencias; so Node).
//   1. Sintaxe de todos os arquivos .js
//   2. Arquivos .json validos
//   3. Links locais (href/src do HTML e url() do CSS) apontando para arquivos que existem,
//      com maiusculas e minusculas IGUAIS as do disco. No Windows "consultas/" abre
//      "Consultas/", mas na Vercel (Linux) isso da erro 404.
// Uso: node scripts/verificar.js

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const RAIZ = path.resolve(__dirname, "..");
const PASTAS = ["paginas", "midias"];
const IGNORAR = new Set(["node_modules", ".git", ".vercel"]);

const problemas = [];

function listar(pasta, lista) {
  for (const item of fs.readdirSync(pasta, { withFileTypes: true })) {
    if (IGNORAR.has(item.name)) continue;
    const caminho = path.join(pasta, item.name);
    if (item.isDirectory()) listar(caminho, lista);
    else lista.push(caminho);
  }
  return lista;
}

// confere o caminho pasta por pasta, comparando o nome exato que esta no disco
function existeComMesmaCaixa(caminho) {
  const partes = path.relative(RAIZ, caminho).split(path.sep);
  if (partes[0] === "..") return false; // saiu do projeto
  let atual = RAIZ;
  for (const parte of partes) {
    if (!parte) continue;
    let nomes;
    try { nomes = fs.readdirSync(atual); } catch (e) { return false; }
    if (!nomes.includes(parte)) return false;
    atual = path.join(atual, parte);
  }
  return true;
}

function ehLinkLocal(link) {
  return link && !/^(https?:|mailto:|tel:|data:|javascript:|#|\/\/)/i.test(link) && !link.includes("${");
}

function conferirLink(arquivo, link) {
  if (!ehLinkLocal(link)) return;
  const limpo = decodeURIComponent(link.split("#")[0].split("?")[0]);
  if (!limpo) return;
  const alvo = limpo.startsWith("/") ? path.join(RAIZ, limpo) : path.resolve(path.dirname(arquivo), limpo);
  if (!existeComMesmaCaixa(alvo)) {
    problemas.push(path.relative(RAIZ, arquivo) + ": link quebrado -> " + link);
  }
}

const arquivos = PASTAS.flatMap((p) => listar(path.join(RAIZ, p), []));
let contagem = { js: 0, json: 0, html: 0, css: 0 };

for (const arquivo of arquivos) {
  const ext = path.extname(arquivo).toLowerCase();

  if (ext === ".js") {
    contagem.js++;
    try {
      execFileSync(process.execPath, ["--check", arquivo], { stdio: "pipe" });
    } catch (e) {
      problemas.push(path.relative(RAIZ, arquivo) + ": erro de sintaxe\n" + String(e.stderr || e.message).trim());
    }
  }

  if (ext === ".json") {
    contagem.json++;
    try { JSON.parse(fs.readFileSync(arquivo, "utf8")); }
    catch (e) { problemas.push(path.relative(RAIZ, arquivo) + ": JSON invalido (" + e.message + ")"); }
  }

  if (ext === ".html") {
    contagem.html++;
    // comentarios nao contam: podem guardar trechos antigos
    const html = fs.readFileSync(arquivo, "utf8").replace(/<!--[\s\S]*?-->/g, "");
    for (const m of html.matchAll(/\s(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) conferirLink(arquivo, m[1] ?? m[2]);
  }

  if (ext === ".css") {
    contagem.css++;
    const css = fs.readFileSync(arquivo, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    for (const m of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) conferirLink(arquivo, m[1]);
  }
}

console.log("Verificados: " + contagem.html + " HTML, " + contagem.css + " CSS, " + contagem.js + " JS, " + contagem.json + " JSON.");

if (problemas.length) {
  console.error("\n" + problemas.length + " problema(s) encontrado(s):\n");
  for (const p of problemas) console.error(" - " + p);
  process.exit(1);
}
console.log("Tudo certo.");
