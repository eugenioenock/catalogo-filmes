// Lança uma versão do site: `npm run versao` (ou `-- --simular`, `-- --maior`).
// Lê os commits desde a última tag v*, decide o número (lib/versao.ts), grava package.json,
// package-lock.json e lib/versoes.json, faz o commit "chore: versão X.Y.Z" e a tag vX.Y.Z.
// Não faz push: publicar continua dependendo do OK de quem cuida do projeto.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { classificarCommits, problemaAntesDeLancar, proximaVersao, type Versao } from "../lib/versao.ts";

/** Git sem shell: os argumentos vão como lista, nunca montados num texto de comando. */
function git(...args: string[]): string {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function sair(mensagem: string, codigo: number): never {
  console.log(mensagem);
  process.exit(codigo);
}

function lerJson<T>(caminho: string): T {
  return JSON.parse(readFileSync(caminho, "utf8")) as T;
}

/** Mesmo formato que o npm usa: 2 espaços e quebra de linha no fim. */
function gravarJson(caminho: string, dados: unknown): void {
  writeFileSync(caminho, JSON.stringify(dados, null, 2) + "\n");
}

/** Hoje, na data local, em ISO: "2026-11-14". */
function hojeIso(): string {
  const d = new Date();
  const doisDigitos = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}`;
}

const simular = process.argv.includes("--simular");
const maior = process.argv.includes("--maior");

if (git("status", "--porcelain") !== "") {
  sair("Há mudanças não commitadas. Faça o commit antes de lançar a versão.", 1);
}

let tag: string;
try {
  tag = git("describe", "--tags", "--abbrev=0", "--match", "v*");
} catch {
  sair("Nenhuma versão lançada ainda: crie a v1.0.0 primeiro.", 1);
}

const assuntos = git("log", `${tag}..HEAD`, "--format=%s").split("\n").filter(Boolean);
const mudancas = classificarCommits(assuntos);
const pacote = lerJson<{ version: string }>("package.json");
const nova = proximaVersao(pacote.version, mudancas, maior);

if (nova === null) {
  sair(`Nada para lançar desde ${tag}: só bastidores (testes, documentação, organização).`, 0);
}

const problema = problemaAntesDeLancar({
  versaoAtual: pacote.version,
  ultimaTag: tag,
  nova,
  tags: git("tag", "--list", "v*").split("\n").filter(Boolean),
});
if (problema) sair(problema, 1);

const lista = (titulo: string, itens: string[]) =>
  itens.length ? `\n${titulo}:\n${itens.map((i) => `  - ${i}`).join("\n")}` : "";
console.log(`Versão ${pacote.version} → ${nova}${lista("Novidades", mudancas.novidades)}${lista("Correções e melhorias", mudancas.correcoes)}`);

if (simular) sair("\n(simulação: nada foi gravado)", 0);

// O que `npm version` faria, sem chamar o npm (no Windows ele é um .cmd, que exige shell).
gravarJson("package.json", { ...pacote, version: nova });
const trava = lerJson<{ version: string; packages: Record<string, { version?: string }> }>("package-lock.json");
trava.version = nova;
trava.packages[""].version = nova;
gravarJson("package-lock.json", trava);

const versoes = lerJson<Versao[]>("lib/versoes.json");
gravarJson("lib/versoes.json", [{ versao: nova, data: hojeIso(), ...mudancas }, ...versoes]);

const ARQUIVOS = ["package.json", "package-lock.json", "lib/versoes.json"];
try {
  git("add", ...ARQUIVOS);
  git("commit", "-m", `chore: versão ${nova}\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`, "--", ...ARQUIVOS);
} catch {
  // Sem commit, a versão não existe: devolve os três arquivos ao que eram, sem deixar a árvore suja.
  git("restore", "--staged", "--worktree", "--", ...ARQUIVOS);
  sair(`O commit da versão ${nova} falhou (veja a mensagem do git acima). Os arquivos voltaram ao que eram; nada foi lançado.`, 1);
}
try {
  git("tag", "-a", `v${nova}`, "-m", `Versão ${nova}`);
} catch {
  sair(`O commit "chore: versão ${nova}" foi feito, mas a tag falhou. Crie-a com:\n  git tag -a v${nova} -m "Versão ${nova}"`, 1);
}

console.log(`\nVersão ${nova} criada. Para publicar: git push origin main --follow-tags`);
