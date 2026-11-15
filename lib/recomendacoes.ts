// Regras da fileira "Para você", sem rede nem banco: quem busca os dados é lib/paraVoce.ts.

import { chaveDoTitulo, type Situacao, type Tipo } from "./listas";
import type { FilmeResumo } from "./tmdb";

/** Até quantas marcações recentes do tipo da aba viram sementes. */
export const MAX_SEMENTES = 10;
/** Candidatos com menos votos que isto saem: evita recomendação obscura demais. */
export const VOTOS_MINIMOS_CANDIDATO = 50;
/** A nota só vale (no desempate e no filtro de nota) com pelo menos estes votos. */
export const VOTOS_PARA_NOTA = 200;
/** Quantos dos melhores candidatos têm o streaming checado. */
export const CANDIDATOS_CHECADOS = 30;
/** Tamanho máximo da fileira. */
export const MAX_CARTOES = 20;
/** Com menos cartões que isto, a reserva por gênero completa a fileira. */
export const MINIMO_ANTES_DA_RESERVA = 8;
/** Quantas marcações recentes (de qualquer tipo) formam o perfil de gêneros. */
export const MARCAS_DO_PERFIL = 20;
/** Quantos gêneros do perfil vão para a busca da reserva. */
export const GENEROS_DO_PERFIL = 2;

/** Uma marcação da pessoa. A lista vem da mais recente para a mais antiga. */
export type Marca = { tipo: Tipo; id: number; situacao: Situacao; titulo: string };
export type Semente = Marca & { peso: number };
export type Candidato = { titulo: FilmeResumo; votos: number };
export type Pontuado = Candidato & { pontos: number; semente: Semente };

/** Assistindo e Já assisti dizem mais sobre o gosto da pessoa do que Quero assistir. */
export function pesoDaSituacao(s: Situacao): number {
  return s === "quero_assistir" ? 1 : 2;
}

export function escolherSementes(marcas: Marca[], tipo: Tipo): Semente[] {
  return marcas
    .filter((m) => m.tipo === tipo)
    .slice(0, MAX_SEMENTES)
    .map((m) => ({ ...m, peso: pesoDaSituacao(m.situacao) }));
}

/** A nota que conta no desempate: só com votos suficientes. */
function notaConfiavel(c: Candidato): number {
  return c.votos >= VOTOS_PARA_NOTA ? c.titulo.nota : -1;
}

export function pontuarCandidatos(o: {
  porSemente: { semente: Semente; candidatos: Candidato[] }[];
  marcadas: Set<string>;
  nota: number | null;
}): Pontuado[] {
  const { nota } = o;
  const porChave = new Map<string, Pontuado>();
  for (const { semente, candidatos } of o.porSemente) {
    for (const c of candidatos) {
      const chave = chaveDoTitulo(c.titulo);
      if (o.marcadas.has(chave)) continue;
      if (c.votos < VOTOS_MINIMOS_CANDIDATO) continue;
      if (nota !== null && !(c.titulo.nota >= nota && c.votos >= VOTOS_PARA_NOTA)) continue;
      const atual = porChave.get(chave);
      if (!atual) {
        porChave.set(chave, { ...c, pontos: semente.peso, semente });
        continue;
      }
      atual.pontos += semente.peso;
      // A semente que vem antes é a mais recente: no empate de peso, ela fica.
      if (semente.peso > atual.semente.peso) atual.semente = semente;
    }
  }
  return [...porChave.values()].sort(
    (a, b) => b.pontos - a.pontos || notaConfiavel(b) - notaConfiavel(a) || b.votos - a.votos,
  );
}

export function textoDoMotivo(
  m: { tipo: "semente"; situacao: Situacao; titulo: string } | { tipo: "genero"; nome: string },
): string {
  if (m.tipo === "genero") return `Porque você gosta de ${m.nome}`;
  switch (m.situacao) {
    case "ja_assisti":
      return `Porque você assistiu ${m.titulo}`;
    case "assistindo":
      return `Porque você está assistindo ${m.titulo}`;
    case "quero_assistir":
      return `Porque você quer assistir ${m.titulo}`;
  }
}

// Gêneros de filme e de série com ids diferentes (tabela da spec).
const FILME_PARA_SERIE: Record<number, number> = { 28: 10759, 12: 10759, 878: 10765, 14: 10765, 10752: 10768 };
const SERIE_PARA_FILME: Record<number, number> = { 10759: 28, 10765: 878, 10768: 10752 };
/** Gêneros com o mesmo id nos dois tipos. */
const MESMO_ID = new Set([16, 35, 80, 99, 18, 10751, 9648, 37]);

/** O gênero equivalente no outro tipo, ou null se não houver. */
export function generoNoTipo(id: number, de: Tipo, para: Tipo): number | null {
  if (de === para) return id;
  if (MESMO_ID.has(id)) return id;
  const mapa = de === "filme" ? FILME_PARA_SERIE : SERIE_PARA_FILME;
  return mapa[id] ?? null;
}

/** Os gêneros mais fortes das marcações, já no tipo `para`. No empate, o que apareceu primeiro. */
export function perfilDeGeneros(itens: { tipo: Tipo; generoIds: number[]; peso: number }[], para: Tipo): number[] {
  const pontos = new Map<number, number>(); // Map mantém a ordem de chegada
  for (const item of itens) {
    // Um título com Ação e Aventura (ambos → 10759 em série) conta uma vez só para esse gênero.
    const convertidos = new Set(
      item.generoIds.map((g) => generoNoTipo(g, item.tipo, para)).filter((g): g is number => g !== null),
    );
    for (const g of convertidos) pontos.set(g, (pontos.get(g) ?? 0) + item.peso);
  }
  return [...pontos.entries()]
    .map(([id, total], ordem) => ({ id, total, ordem }))
    .sort((a, b) => b.total - a.total || a.ordem - b.ordem)
    .slice(0, GENEROS_DO_PERFIL)
    .map((g) => g.id);
}
