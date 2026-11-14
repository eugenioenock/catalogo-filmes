import type { FilmeResumo } from "./tmdb";

/** Filme ou série: como o título fica gravado na coluna `tipo` da tabela `marcacoes`. */
export type Tipo = "filme" | "serie";

/** Como a marcação fica gravada na tabela `marcacoes`. */
export type Situacao = "quero_assistir" | "assistindo" | "ja_assisti";

/** Como a lista aparece na URL (`/?lista=quero-assistir`). */
export type ListaUrl = "quero-assistir" | "assistindo" | "ja-assisti";

/** As abas, na ordem da tela. */
export const LISTAS: readonly ListaUrl[] = ["quero-assistir", "assistindo", "ja-assisti"];

/** Os botões de marcar, na mesma ordem das abas. */
export const SITUACOES: readonly Situacao[] = ["quero_assistir", "assistindo", "ja_assisti"];

export const SITUACAO_DA_LISTA: Record<ListaUrl, Situacao> = {
  "quero-assistir": "quero_assistir",
  assistindo: "assistindo",
  "ja-assisti": "ja_assisti",
};

export const NOME_DA_SITUACAO: Record<Situacao, string> = {
  quero_assistir: "Quero assistir",
  assistindo: "Assistindo",
  ja_assisti: "Já assisti",
};

/** O que basta para saber de que título se trata: o mesmo id pode ser de um filme e de uma série. */
type Identidade = { tipo: Tipo; id: number };

/** A página do título: `/filme/{id}` ou `/serie/{id}`. */
export function hrefDoTitulo({ tipo, id }: Identidade): string {
  return `/${tipo}/${id}`;
}

/** Chave React de um cartão. Só o id repetiria quando filme e série têm o mesmo id. */
export function chaveDoTitulo({ tipo, id }: Identidade): string {
  return `${tipo}-${id}`;
}

/** Clicar no botão que já está aceso desmarca; clicar no outro troca de lista. */
export function proximaSituacao(atual: Situacao | null, clicada: Situacao): Situacao | null {
  return clicada === atual ? null : clicada;
}

/** Uma linha da tabela `marcacoes`. O Supabase pode devolver o `numeric` da nota como string. */
export type LinhaMarcacao = {
  tipo: Tipo;
  filme_id: number;
  titulo: string;
  poster_url: string | null;
  ano: string | null;
  nota: number | string | null;
};

/** Converte a cópia gravada na tabela para o formato que o cartão do filme usa. */
export function linhaParaFilme(linha: LinhaMarcacao): FilmeResumo {
  return {
    tipo: linha.tipo,
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
  return `Você ainda não marcou nenhum título como ${nome}. Abra um filme no catálogo para marcar.`;
}
