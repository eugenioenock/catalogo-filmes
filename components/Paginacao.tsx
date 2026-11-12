import Link from "next/link";
import { montarHref, type FiltrosCatalogo } from "@/lib/parametros";

type Props = { filtros: FiltrosCatalogo; totalPaginas: number };

const classe =
  "rounded-full bg-neutral-800 px-4 py-2 text-sm font-medium hover:bg-neutral-700";

export default function Paginacao({ filtros, totalPaginas }: Props) {
  const { pagina } = filtros;
  return (
    <nav aria-label="Paginação" className="mt-8 flex items-center justify-center gap-4">
      {pagina > 1 && (
        <Link href={montarHref(filtros, { pagina: pagina - 1 })} className={classe}>
          ← Anterior
        </Link>
      )}
      <span className="text-sm text-neutral-400">Página {pagina}</span>
      {pagina < totalPaginas && (
        <Link href={montarHref(filtros, { pagina: pagina + 1 })} className={classe}>
          Próxima →
        </Link>
      )}
    </nav>
  );
}
