export type FiltrosCatalogo = { streaming: number | null; busca: string | null; pagina: number };

const MAX_PAGINAS = 500;

function primeiro(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

function inteiroPositivo(valor: string | undefined): number | null {
  if (valor === undefined || !/^\d+$/.test(valor)) return null;
  const n = Number(valor);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

export function lerFiltros(params: Record<string, string | string[] | undefined>): FiltrosCatalogo {
  const pagina = inteiroPositivo(primeiro(params.pagina)) ?? 1;
  const busca = primeiro(params.busca)?.trim() || null;
  return {
    streaming: inteiroPositivo(primeiro(params.streaming)),
    busca,
    pagina: Math.min(pagina, MAX_PAGINAS),
  };
}

export function lerIdFilme(valor: string): number | null {
  return inteiroPositivo(valor);
}

export function montarHref(atual: FiltrosCatalogo, mudancas: Partial<FiltrosCatalogo>): string {
  const novo: FiltrosCatalogo = { ...atual, ...mudancas };
  if (("streaming" in mudancas || "busca" in mudancas) && !("pagina" in mudancas)) {
    novo.pagina = 1;
  }
  const query = new URLSearchParams();
  if (novo.streaming !== null) query.set("streaming", String(novo.streaming));
  if (novo.busca !== null) query.set("busca", novo.busca);
  if (novo.pagina !== 1) query.set("pagina", String(novo.pagina));
  const texto = query.toString();
  return texto ? `/?${texto}` : "/";
}
