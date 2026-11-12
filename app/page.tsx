import { Suspense } from "react";
import { redirect } from "next/navigation";
import Banner from "@/components/Banner";
import Cabecalho from "@/components/Cabecalho";
import FiltroStreamings from "@/components/FiltroStreamings";
import GradeFilmes from "@/components/GradeFilmes";
import Paginacao from "@/components/Paginacao";
import { lerFiltros, montarHref } from "@/lib/parametros";
import { buscarFilmes, listarFilmes, listarStreamings } from "@/lib/tmdb";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function Catalogo({ searchParams }: { searchParams: SearchParams }) {
  const filtros = lerFiltros(await searchParams);
  const { streaming, busca, pagina } = filtros;

  const [streamings, resultado] = await Promise.all([
    listarStreamings(),
    busca
      ? buscarFilmes({ texto: busca, streaming, pagina })
      : listarFilmes({ streaming, pagina }),
  ]);
  const { filmes, totalPaginas } = resultado;

  if (pagina > totalPaginas && totalPaginas > 0) {
    redirect(montarHref(filtros, { pagina: totalPaginas }));
  }

  const mostrarBanner = pagina === 1 && !busca && filmes.length > 0;

  return (
    <>
      <Cabecalho busca={busca} streaming={streaming} />
      {mostrarBanner && <Banner filme={filmes[0]} />}
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <FiltroStreamings streamings={streamings} filtros={filtros} />
        <GradeFilmes filmes={filmes} />
        <Paginacao filtros={filtros} totalPaginas={totalPaginas} />
      </main>
    </>
  );
}

export default function Home({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<p className="p-8 text-center text-neutral-400">Carregando...</p>}>
      <Catalogo searchParams={searchParams} />
    </Suspense>
  );
}
