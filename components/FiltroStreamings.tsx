import Image from "next/image";
import Link from "next/link";
import { montarHref, type FiltrosCatalogo } from "@/lib/parametros";
import type { Streaming } from "@/lib/tmdb";
import { classeFiltro } from "./classeFiltro";

type Props = { streamings: Streaming[]; filtros: FiltrosCatalogo };

export default function FiltroStreamings({ streamings, filtros }: Props) {
  return (
    <nav
      aria-label="Filtrar por streaming"
      className="sem-barra-rolagem -mx-4 flex gap-2.5 overflow-x-auto px-4 py-1 sm:mx-0 sm:flex-wrap sm:px-0"
    >
      <Link
        href={montarHref(filtros, { streaming: null })}
        aria-current={filtros.streaming === null ? "page" : undefined}
        className={classeFiltro(filtros.streaming === null, false)}
      >
        Todos
      </Link>
      {streamings.map((s) => (
        <Link
          key={s.id}
          href={montarHref(filtros, { streaming: s.id })}
          aria-current={filtros.streaming === s.id ? "page" : undefined}
          className={classeFiltro(filtros.streaming === s.id, true)}
        >
          <Image src={s.logoUrl} alt="" width={28} height={28} className="size-7 rounded-full" />
          {s.nome}
        </Link>
      ))}
    </nav>
  );
}
