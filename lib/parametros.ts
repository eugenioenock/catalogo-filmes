import { LISTAS, type ListaUrl, type Tipo } from "./listas";

export type FiltrosCatalogo = {
  /** Filmes ou séries no Catálogo (`?tipo=series`; sem o parâmetro, filmes). */
  tipo: Tipo;
  streaming: number | null;
  busca: string | null;
  nota: number | null;
  pagina: number;
  /** Lista pessoal aberta numa aba (null = Catálogo). */
  lista: ListaUrl | null;
};

export const NOTAS_FILTRO = [6, 7, 8, 9] as const;

const MAX_PAGINAS = 500;

function primeiro(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

function inteiroPositivo(valor: string | undefined): number | null {
  if (valor === undefined || !/^\d+$/.test(valor)) return null;
  const n = Number(valor);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

function notaDoFiltro(valor: string | undefined): number | null {
  return NOTAS_FILTRO.find((n) => String(n) === valor) ?? null;
}

/** Só `series` exato mostra séries; qualquer outro valor (ou nenhum) mostra filmes. */
function tipoDoFiltro(valor: string | undefined): Tipo {
  return valor === "series" ? "serie" : "filme";
}

function listaDoFiltro(valor: string | undefined): ListaUrl | null {
  return LISTAS.find((l) => l === valor) ?? null;
}

export function lerFiltros(params: Record<string, string | string[] | undefined>): FiltrosCatalogo {
  const pagina = inteiroPositivo(primeiro(params.pagina)) ?? 1;
  const busca = primeiro(params.busca)?.trim().slice(0, 100) || null;
  return {
    tipo: tipoDoFiltro(primeiro(params.tipo)),
    streaming: inteiroPositivo(primeiro(params.streaming)),
    busca,
    nota: notaDoFiltro(primeiro(params.nota)),
    pagina: Math.min(pagina, MAX_PAGINAS),
    lista: listaDoFiltro(primeiro(params.lista)),
  };
}

export function lerIdFilme(valor: string): number | null {
  return inteiroPositivo(valor);
}

export function montarHref(atual: FiltrosCatalogo, mudancas: Partial<FiltrosCatalogo>): string {
  const novo: FiltrosCatalogo = { ...atual, ...mudancas };
  const mudouFiltro = "tipo" in mudancas || "streaming" in mudancas || "busca" in mudancas || "nota" in mudancas;
  if (mudouFiltro && !("pagina" in mudancas)) {
    novo.pagina = 1;
  }
  const query = new URLSearchParams();
  if (novo.tipo === "serie") query.set("tipo", "series");
  if (novo.streaming !== null) query.set("streaming", String(novo.streaming));
  if (novo.busca !== null) query.set("busca", novo.busca);
  if (novo.nota !== null) query.set("nota", String(novo.nota));
  if (novo.pagina !== 1) query.set("pagina", String(novo.pagina));
  const texto = query.toString();
  return texto ? `/?${texto}` : "/";
}

/** Link de uma aba: Catálogo é a raiz; as listas pessoais vão em ?lista=. */
export function hrefDaLista(lista: ListaUrl | null): string {
  return lista === null ? "/" : `/?lista=${lista}`;
}

/** O Catálogo de um tipo, sem filtros: `/` (filmes) ou `/?tipo=series`. */
export function hrefDoCatalogo(tipo: Tipo): string {
  return tipo === "serie" ? "/?tipo=series" : "/";
}
