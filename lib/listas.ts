import type { FilmeResumo } from "./tmdb";

/** Como a marcação fica gravada na tabela `marcacoes`. */
export type Situacao = "quero_assistir" | "ja_assisti";

/** Como a lista aparece na URL (`/?lista=quero-assistir`). */
export type ListaUrl = "quero-assistir" | "ja-assisti";

export const LISTAS: readonly ListaUrl[] = ["quero-assistir", "ja-assisti"];

export const SITUACAO_DA_LISTA: Record<ListaUrl, Situacao> = {
  "quero-assistir": "quero_assistir",
  "ja-assisti": "ja_assisti",
};

export const NOME_DA_SITUACAO: Record<Situacao, string> = {
  quero_assistir: "Quero assistir",
  ja_assisti: "Já assisti",
};

/** Clicar no botão que já está aceso desmarca; clicar no outro troca de lista. */
export function proximaSituacao(atual: Situacao | null, clicada: Situacao): Situacao | null {
  return clicada === atual ? null : clicada;
}

/** Uma linha da tabela `marcacoes`. O Supabase pode devolver o `numeric` da nota como string. */
export type LinhaMarcacao = {
  filme_id: number;
  titulo: string;
  poster_url: string | null;
  ano: string | null;
  nota: number | string | null;
};

/** Converte a cópia gravada na tabela para o formato que o cartão do filme usa. */
export function linhaParaFilme(linha: LinhaMarcacao): FilmeResumo {
  return {
    id: linha.filme_id,
    titulo: linha.titulo,
    ano: linha.ano,
    posterUrl: linha.poster_url,
    backdropUrl: null,
    sinopse: "",
    nota: Number(linha.nota ?? 0),
    generos: [],
  };
}

export function mensagemListaVazia(lista: ListaUrl): string {
  const nome = NOME_DA_SITUACAO[SITUACAO_DA_LISTA[lista]].toLowerCase();
  return `Você ainda não marcou nenhum filme como ${nome}. Abra um filme no catálogo para marcar.`;
}
