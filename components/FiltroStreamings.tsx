import Link from "next/link";
import { montarHref, type FiltrosCatalogo } from "@/lib/parametros";
import type { Streaming } from "@/lib/tmdb";

type Props = { streamings: Streaming[]; filtros: FiltrosCatalogo };

function classe(ativa: boolean): string {
  return `shrink-0 rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap ${
    ativa
      ? "bg-amber-500 text-neutral-950"
      : "bg-neutral-800 text-neutral-200 hover:bg-neutral-700"
  }`;
}

export default function FiltroStreamings({ streamings, filtros }: Props) {
  return (
    <nav aria-label="Filtrar por streaming" className="flex gap-2 overflow-x-auto pb-2">
      <Link
        href={montarHref(filtros, { streaming: null })}
        aria-current={filtros.streaming === null ? "page" : undefined}
        className={classe(filtros.streaming === null)}
      >
        Todos
      </Link>
      {streamings.map((s) => (
        <Link
          key={s.id}
          href={montarHref(filtros, { streaming: s.id })}
          aria-current={filtros.streaming === s.id ? "page" : undefined}
          className={classe(filtros.streaming === s.id)}
        >
          {s.nome}
        </Link>
      ))}
    </nav>
  );
}
