// Regras da versão do site, sem Git nem arquivos: quem lê os commits é scripts/versao.ts.
// Sem imports "@/": o script roda direto no Node e importa este arquivo por caminho relativo.

/** Uma versão no histórico (lib/versoes.json). `data` em ISO: "2026-11-14". */
export type Versao = { versao: string; data: string; novidades: string[]; correcoes: string[] };

type Mudancas = { novidades: string[]; correcoes: string[] };

/** "tipo: texto" ou "tipo(escopo): texto". */
const PREFIXO = /^(\w+)(\([^)]*\))?:\s*/;

/**
 * Separa os assuntos dos commits no que a pessoa vê no site: `feat` é novidade, `fix` e
 * `perf` são correções e melhorias. `test`, `docs`, `refactor`, `chore` e o resto são
 * bastidores e ficam de fora. O texto perde o prefixo e ganha a primeira letra maiúscula.
 */
export function classificarCommits(assuntos: string[]): Mudancas {
  const mudancas: Mudancas = { novidades: [], correcoes: [] };
  for (const assunto of assuntos) {
    const prefixo = assunto.match(PREFIXO);
    if (!prefixo) continue;
    const texto = assunto.slice(prefixo[0].length).trim();
    if (!texto) continue;
    const item = texto.charAt(0).toUpperCase() + texto.slice(1);
    if (prefixo[1] === "feat") mudancas.novidades.push(item);
    else if (prefixo[1] === "fix" || prefixo[1] === "perf") mudancas.correcoes.push(item);
  }
  return mudancas;
}

/**
 * O número da próxima versão (semântica: maior.menor.correção), ou null se não há o que lançar.
 * Novidade sobe o do meio; só correções sobem o último; `maior` sobe o primeiro.
 */
export function proximaVersao(atual: string, mudancas: Mudancas, maior = false): string | null {
  if (mudancas.novidades.length === 0 && mudancas.correcoes.length === 0) return null;
  const [ma, me, co] = atual.split(".").map(Number);
  if (maior) return `${ma + 1}.0.0`;
  if (mudancas.novidades.length > 0) return `${ma}.${me + 1}.0`;
  return `${ma}.${me}.${co + 1}`;
}
