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
