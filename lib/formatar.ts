import type { Tipo } from "./listas";

export function formatarDuracao(minutos: number | null): string | null {
  if (!minutos) return null;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export function formatarNota(nota: number): string {
  return nota.toFixed(1).replace(".", ",");
}

/** "2026-11-14" → "14/11/2026". Pelo texto, sem new Date: meia-noite UTC ainda é o dia anterior no Brasil. */
export function formatarDataBR(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function anoDe(data: string | null | undefined): string | null {
  if (!data) return null;
  const ano = data.slice(0, 4);
  return ano || null;
}

/** Mensagem da grade vazia: explica o motivo certo conforme os filtros ativos. */
export function mensagemSemFilmes(filtros: {
  tipo: Tipo;
  busca: boolean;
  nota: boolean;
  streaming: boolean;
}): string {
  // A busca traz filmes e séries juntos, então fala em "título".
  if (filtros.busca) {
    return filtros.nota
      ? "Nenhum título com esse nome e essa nota está no streaming agora."
      : "Nenhum título com esse nome está no streaming agora.";
  }
  const nenhum = filtros.tipo === "serie" ? "Nenhuma série" : "Nenhum filme";
  if (filtros.nota) {
    return filtros.streaming
      ? `${nenhum} com essa nota neste streaming.`
      : `${nenhum} com essa nota nos streamings.`;
  }
  return filtros.tipo === "serie" ? "Nenhuma série encontrada." : "Nenhum filme encontrado.";
}

/**
 * Linha de informações da série: "3 temporadas · 2019–2023", "1 temporada · 2024–" (no ar)
 * ou "1 temporada · 2020" (começou e terminou no mesmo ano). null se não houver nada a mostrar.
 */
export function textoTemporadas(s: {
  temporadas: number | null;
  ano: string | null;
  anoFim: string | null;
  terminou: boolean;
}): string | null {
  const temporadas = s.temporadas ? `${s.temporadas} ${s.temporadas === 1 ? "temporada" : "temporadas"}` : null;
  let anos: string | null = null;
  if (s.ano) {
    if (!s.terminou) anos = `${s.ano}–`;
    else if (!s.anoFim || s.anoFim === s.ano) anos = s.ano;
    else anos = `${s.ano}–${s.anoFim}`;
  }
  const partes = [temporadas, anos].filter((p): p is string => p !== null);
  return partes.length > 0 ? partes.join(" · ") : null;
}

/** Os títulos das seções do Catálogo: a grade e o Top 10. */
export function titulosDoCatalogo(
  tipo: Tipo,
  o: { busca: string | null; vitrine: boolean },
): { grade: string; emAlta: string } {
  const nome = tipo === "serie" ? "séries" : "filmes";
  const grade = o.busca
    ? `Resultados para “${o.busca}”`
    : o.vitrine
      ? `Mais ${nome} nos streamings`
      : `${nome[0].toUpperCase()}${nome.slice(1)} nos streamings`;
  return { grade, emAlta: tipo === "serie" ? "Séries em alta agora" : "Em alta agora" };
}
