import Link from "next/link";
import { Suspense } from "react";
import { LISTAS, NOME_DA_SITUACAO, SITUACAO_DA_LISTA, type ListaUrl } from "@/lib/listas";
import { contarMarcacoes } from "@/lib/marcacoes";
import { hrefDaLista } from "@/lib/parametros";
import { usuarioAtual } from "@/lib/usuario";

/** O número de títulos (filmes e séries) da lista, só para quem está logado. Se der erro, não mostra nada. */
async function Contagem({ lista }: { lista: ListaUrl }) {
  if (!(await usuarioAtual())) return null;
  let total: number;
  try {
    total = (await contarMarcacoes())[SITUACAO_DA_LISTA[lista]];
  } catch {
    return null;
  }
  return <span className="tabular-nums"> ({total})</span>;
}

function classeAba(ativa: boolean): string {
  return `shrink-0 border-b-2 pb-1.5 text-sm font-semibold whitespace-nowrap transition-colors sm:text-base ${
    ativa ? "border-projetor text-projetor" : "border-transparent text-tela/75 hover:text-tela"
  }`;
}

/** Catálogo | Quero assistir | Assistindo | Já assisti, abaixo do nome do site. */
export default function AbasListas({ ativa }: { ativa: ListaUrl | null }) {
  return (
    <nav aria-label="Listas" className="flex gap-6 overflow-x-auto [scrollbar-width:none]">
      <Link href={hrefDaLista(null)} aria-current={ativa === null ? "page" : undefined} className={classeAba(ativa === null)}>
        Catálogo
      </Link>
      {LISTAS.map((lista) => (
        <Link
          key={lista}
          href={hrefDaLista(lista)}
          aria-current={ativa === lista ? "page" : undefined}
          className={classeAba(ativa === lista)}
        >
          {NOME_DA_SITUACAO[SITUACAO_DA_LISTA[lista]]}
          <Suspense fallback={null}>
            <Contagem lista={lista} />
          </Suspense>
        </Link>
      ))}
    </nav>
  );
}
