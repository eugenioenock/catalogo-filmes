import { Suspense } from "react";
import { redirect } from "next/navigation";
import Banner from "@/components/Banner";
import Cabecalho from "@/components/Cabecalho";
import EmAlta from "@/components/EmAlta";
import FiltroStreamings from "@/components/FiltroStreamings";
import GradeFilmes from "@/components/GradeFilmes";
import LuzAmbiente from "@/components/LuzAmbiente";
import Paginacao from "@/components/Paginacao";
import { lerFiltros, montarHref } from "@/lib/parametros";
import { buscarFilmes, listarFilmes, listarStreamings } from "@/lib/tmdb";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const TAMANHO_RANKING = 10;

async function Catalogo({ searchParams }: { searchParams: SearchParams }) {
  const filtros = lerFiltros(await searchParams);
  const { streaming, busca, nota, pagina } = filtros;

  const [streamings, resultado] = await Promise.all([
    listarStreamings(),
    busca
      ? buscarFilmes({ texto: busca, streaming, nota, pagina })
      : listarFilmes({ streaming, nota, pagina }),
  ]);
  const { filmes, totalPaginas } = resultado;

  if (pagina > Math.max(totalPaginas, 1)) {
    redirect(montarHref(filtros, { pagina: Math.max(totalPaginas, 1) }));
  }

  // Destaque e ranking só fazem sentido na lista por popularidade (página 1, sem busca).
  const vitrine = pagina === 1 && !busca && filmes.length > 0;
  const ranking = vitrine ? filmes.slice(0, TAMANHO_RANKING) : [];
  const grade = vitrine ? filmes.slice(TAMANHO_RANKING) : filmes;
  const mostrarGrade = !vitrine || grade.length > 0;

  const tituloGrade = busca
    ? `Resultados para “${busca}”`
    : vitrine
      ? "Mais filmes nos streamings"
      : "Filmes nos streamings";

  return (
    <div className="relative isolate">
      <LuzAmbiente imagem={vitrine ? filmes[0].backdropUrl : null} />
      <Cabecalho busca={busca} streaming={streaming} nomeComoTitulo sobreposto={vitrine} />
      {vitrine && <Banner filme={filmes[0]} />}

      <main className={`relative space-y-14 pb-20 ${vitrine ? "-mt-6 sm:-mt-12" : "pt-6"}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <FiltroStreamings streamings={streamings} filtros={filtros} />
        </div>

        {ranking.length > 0 && <EmAlta filmes={ranking} />}

        {mostrarGrade && (
          <section aria-labelledby="grade" className="mx-auto max-w-7xl px-4 sm:px-8">
            <h2
              id="grade"
              className="font-display mb-6 text-3xl leading-none font-extrabold break-words uppercase sm:text-4xl"
            >
              {tituloGrade}
            </h2>
            <GradeFilmes filmes={grade} haMaisPaginas={pagina < totalPaginas} />
          </section>
        )}

        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <Paginacao filtros={filtros} totalPaginas={totalPaginas} />
        </div>
      </main>
    </div>
  );
}

export default function Home({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense
      fallback={
        <p className="font-display p-16 text-center text-2xl font-bold text-nevoa uppercase motion-safe:animate-pulse">
          Apagando as luzes…
        </p>
      }
    >
      <Catalogo searchParams={searchParams} />
    </Suspense>
  );
}
