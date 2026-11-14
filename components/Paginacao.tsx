import Link from "next/link";
import { montarHref, type FiltrosCatalogo } from "@/lib/parametros";

type Props = { filtros: FiltrosCatalogo; totalPaginas: number };

const classe =
  "flex items-center gap-1.5 rounded-full bg-poltrona py-2.5 text-sm font-semibold ring-1 ring-tela/10 transition-colors hover:bg-projetor hover:text-sala hover:ring-projetor";

function Chevron({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export default function Paginacao({ filtros, totalPaginas }: Props) {
  const { pagina } = filtros;
  return (
    <nav aria-label="Paginação" className="mt-14 flex items-center justify-center gap-5">
      {pagina > 1 && (
        <Link href={montarHref(filtros, { pagina: pagina - 1 })} className={`${classe} pr-5 pl-4`}>
          <Chevron d="m14.5 6-6 6 6 6" />
          Anterior
        </Link>
      )}
      <span className="text-sm text-nevoa">
        Página <span className="font-display text-xl font-bold text-tela">{pagina}</span>
      </span>
      {pagina < totalPaginas && (
        <Link href={montarHref(filtros, { pagina: pagina + 1 })} className={`${classe} pr-4 pl-5`}>
          Próxima
          <Chevron d="m9.5 6 6 6-6 6" />
        </Link>
      )}
    </nav>
  );
}
