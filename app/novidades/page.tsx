import type { Metadata } from "next";
import Cabecalho from "@/components/Cabecalho";
import ListaDeVersoes from "@/components/ListaDeVersoes";
import type { Versao } from "@/lib/versao";
import versoes from "@/lib/versoes.json";

export const metadata: Metadata = {
  title: "Novidades | CineCatálogo",
};

/** O histórico de versões do site. lib/versoes.json é gravado pelo `npm run versao`. */
export default function PaginaNovidades() {
  return (
    <>
      <Cabecalho busca={null} streaming={null} />
      <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-24 sm:px-8 sm:pt-10">
        <h1 className="font-display mb-10 text-5xl leading-[0.85] font-black uppercase sm:text-7xl">Novidades</h1>
        <ListaDeVersoes versoes={versoes as Versao[]} />
      </main>
    </>
  );
}
