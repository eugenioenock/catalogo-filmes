import Link from "next/link";
import type { Tipo } from "@/lib/listas";
import { montarHref, type FiltrosCatalogo } from "@/lib/parametros";
import { classeFiltro } from "./classeFiltro";

const OPCOES: { tipo: Tipo; nome: string }[] = [
  { tipo: "filme", nome: "Filmes" },
  { tipo: "serie", nome: "Séries" },
];

/** Filmes | Séries, acima dos filtros. Trocar de tipo mantém streaming e nota e volta à página 1. */
export default function SeletorTipo({ filtros }: { filtros: FiltrosCatalogo }) {
  return (
    <nav aria-label="Filmes ou séries" className="flex items-center gap-2.5 py-1">
      {OPCOES.map(({ tipo, nome }) => {
        const ativo = filtros.tipo === tipo;
        return (
          <Link
            key={tipo}
            href={montarHref(filtros, { tipo })}
            aria-current={ativo ? "page" : undefined}
            className={classeFiltro(ativo, false)}
          >
            {nome}
          </Link>
        );
      })}
    </nav>
  );
}
