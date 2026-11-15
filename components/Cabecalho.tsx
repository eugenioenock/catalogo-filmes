import Link from "next/link";
import { Suspense } from "react";
import type { ListaUrl, Tipo } from "@/lib/listas";
import AbasListas from "./AbasListas";
import AreaConta from "./AreaConta";
import CampoBusca from "./CampoBusca";

type Props = {
  busca: string | null;
  streaming: number | null;
  nota?: number | null;
  /** Filmes ou séries: a busca guarda a aba de onde partiu. */
  tipo?: Tipo;
  nomeComoTitulo?: boolean;
  /** Fica por cima da foto do destaque, sem fundo próprio. */
  sobreposto?: boolean;
  /** Aba ativa (null = Catálogo). Sem esta prop, o cabeçalho não mostra as abas. */
  listaAtiva?: ListaUrl | null;
};

export default function Cabecalho({
  busca,
  streaming,
  nota = null,
  tipo = "filme",
  nomeComoTitulo = false,
  sobreposto = false,
  listaAtiva,
}: Props) {
  const Nome = nomeComoTitulo ? "h1" : "p";
  return (
    <header
      className={
        sobreposto
          ? "absolute inset-x-0 top-0 z-20 bg-linear-to-b from-sala/85 via-sala/40 to-transparent pb-10"
          : "relative z-20"
      }
    >
      {/* Celular: nome + conta na 1ª linha, busca na 2ª. Desktop: nome … busca + conta. */}
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4 sm:flex-nowrap sm:px-8 sm:py-6">
        <Nome className="order-1 font-display text-3xl leading-none font-black tracking-tight text-projetor uppercase">
          <Link href="/" className="rounded-sm">
            CineCatálogo
          </Link>
        </Nome>
        <div className="order-3 basis-full sm:order-2 sm:ml-auto sm:basis-auto">
          <CampoBusca busca={busca} streaming={streaming} nota={nota} tipo={tipo} />
        </div>
        <div className="order-2 ml-auto flex min-w-0 justify-end sm:order-3 sm:ml-0">
          <Suspense fallback={null}>
            <AreaConta />
          </Suspense>
        </div>
      </div>
      {listaAtiva !== undefined && (
        <div className="mx-auto max-w-7xl px-4 sm:-mt-2 sm:px-8">
          <AbasListas ativa={listaAtiva} />
        </div>
      )}
    </header>
  );
}
