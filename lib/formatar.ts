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

export function anoDe(data: string | null | undefined): string | null {
  if (!data) return null;
  const ano = data.slice(0, 4);
  return ano || null;
}

/** Mensagem da grade vazia: explica o motivo certo conforme os filtros ativos. */
export function mensagemSemFilmes(filtros: {
  busca: boolean;
  nota: boolean;
  streaming: boolean;
}): string {
  if (filtros.busca) {
    return filtros.nota
      ? "Nenhum filme com esse nome e essa nota está no streaming agora."
      : "Nenhum filme com esse nome está no streaming agora.";
  }
  if (filtros.nota) {
    return filtros.streaming
      ? "Nenhum filme com essa nota neste streaming."
      : "Nenhum filme com essa nota nos streamings.";
  }
  return "Nenhum filme encontrado.";
}
