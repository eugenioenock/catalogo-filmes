import Image from "next/image";
import Link from "next/link";
import { montarHref, type FiltrosCatalogo } from "@/lib/parametros";
import type { Streaming } from "@/lib/tmdb";

type Props = { streamings: Streaming[]; filtros: FiltrosCatalogo };

function classe(ativa: boolean, comLogo: boolean): string {
  return `flex shrink-0 items-center gap-2.5 rounded-full py-1.5 text-sm font-medium whitespace-nowrap ring-1 backdrop-blur-md transition-colors ${
    comLogo ? "pr-4 pl-1.5" : "px-5"
  } ${
    ativa
      ? "bg-projetor text-sala ring-projetor"
      : "bg-poltrona/70 text-tela/90 ring-tela/10 hover:bg-poltrona-clara hover:ring-tela/30"
  }`;
}

export default function FiltroStreamings({ streamings, filtros }: Props) {
  return (
    <nav
      aria-label="Filtrar por streaming"
      className="sem-barra-rolagem -mx-4 flex gap-2.5 overflow-x-auto px-4 py-1 sm:mx-0 sm:flex-wrap sm:px-0"
    >
      <Link
        href={montarHref(filtros, { streaming: null })}
        aria-current={filtros.streaming === null ? "page" : undefined}
        className={classe(filtros.streaming === null, false)}
      >
        Todos
      </Link>
      {streamings.map((s) => (
        <Link
          key={s.id}
          href={montarHref(filtros, { streaming: s.id })}
          aria-current={filtros.streaming === s.id ? "page" : undefined}
          className={classe(filtros.streaming === s.id, true)}
        >
          <Image src={s.logoUrl} alt="" width={28} height={28} className="size-7 rounded-full" />
          {s.nome}
        </Link>
      ))}
    </nav>
  );
}
