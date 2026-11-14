import Link from "next/link";
import { montarHref, NOTAS_FILTRO, type FiltrosCatalogo } from "@/lib/parametros";
import { classeFiltro } from "./classeFiltro";

function Estrela() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5" aria-hidden>
      <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" />
    </svg>
  );
}

export default function FiltroNota({ filtros }: { filtros: FiltrosCatalogo }) {
  const opcoes = [null, ...NOTAS_FILTRO];
  return (
    <nav
      aria-label="Filtrar por nota"
      className="sem-barra-rolagem -mx-4 flex items-center gap-2.5 overflow-x-auto px-4 py-1 sm:mx-0 sm:flex-wrap sm:px-0"
    >
      <span className="shrink-0 pr-1 text-sm font-medium text-nevoa">Nota</span>
      {opcoes.map((nota) => {
        const ativa = filtros.nota === nota;
        return (
          <Link
            key={nota ?? "qualquer"}
            href={montarHref(filtros, { nota })}
            aria-current={ativa ? "page" : undefined}
            className={classeFiltro(ativa, false)}
          >
            {nota === null ? (
              "Qualquer"
            ) : (
              <>
                <Estrela />
                {nota}+
              </>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
