import { Suspense } from "react";
import { redirect } from "next/navigation";
import Banner from "@/components/Banner";
import Cabecalho from "@/components/Cabecalho";
import EmAlta from "@/components/EmAlta";
import FiltroNota from "@/components/FiltroNota";
import FiltroStreamings from "@/components/FiltroStreamings";
import GradeFilmes from "@/components/GradeFilmes";
import ListaPessoal from "@/components/ListaPessoal";
import LuzAmbiente from "@/components/LuzAmbiente";
import Paginacao from "@/components/Paginacao";
import SeletorTipo from "@/components/SeletorTipo";
import { mensagemSemFilmes, titulosDoCatalogo } from "@/lib/formatar";
import { lerFiltros, montarHref } from "@/lib/parametros";
import { buscarTitulos, listarStreamings, listarTitulos } from "@/lib/tmdb";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const TAMANHO_RANKING = 10;

async function Catalogo({ searchParams }: { searchParams: SearchParams }) {
  const filtros = lerFiltros(await searchParams);
  const { tipo, streaming, busca, nota, pagina } = filtros;

  // Aba pessoal: os filmes vêm do Supabase, sem chamar o TMDB.
  if (filtros.lista !== null) {
    return (
      <div className="relative isolate">
        <LuzAmbiente imagem={null} />
        <Cabecalho busca={null} streaming={null} nomeComoTitulo listaAtiva={filtros.lista} />
        <main className="mx-auto max-w-7xl px-4 pt-6 pb-20 sm:px-8">
          <ListaPessoal lista={filtros.lista} />
        </main>
      </div>
    );
  }

  const [streamings, resultado] = await Promise.all([
    listarStreamings(),
    busca
      ? buscarTitulos({ texto: busca, streaming, nota, pagina })
      : listarTitulos({ tipo, streaming, nota, pagina }),
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

  const titulos = titulosDoCatalogo(tipo, { busca, vitrine });

  return (
    <div className="relative isolate">
      <LuzAmbiente imagem={vitrine ? filmes[0].backdropUrl : null} />
      <Cabecalho busca={busca} streaming={streaming} nota={nota} nomeComoTitulo sobreposto={vitrine} listaAtiva={null} />
      {vitrine && <Banner filme={filmes[0]} />}

      <main className={`relative space-y-14 pb-20 ${vitrine ? "-mt-6 sm:-mt-12" : "pt-6"}`}>
        <div className="mx-auto max-w-7xl space-y-3 px-4 sm:px-8">
          {/* A busca já traz filmes e séries juntos: o seletor só aparece fora dela. */}
          {!busca && <SeletorTipo filtros={filtros} />}
          <FiltroStreamings streamings={streamings} filtros={filtros} />
          <FiltroNota filtros={filtros} />
        </div>

        {ranking.length > 0 && <EmAlta filmes={ranking} titulo={titulos.emAlta} />}

        {mostrarGrade && (
          <section aria-labelledby="grade" className="mx-auto max-w-7xl px-4 sm:px-8">
            <h2
              id="grade"
              className="font-display mb-6 text-3xl leading-none font-extrabold break-words uppercase sm:text-4xl"
            >
              {titulos.grade}
            </h2>
            <GradeFilmes
              filmes={grade}
              haMaisPaginas={pagina < totalPaginas}
              mensagemVazia={mensagemSemFilmes({
                tipo: filtros.tipo,
                busca: busca !== null,
                nota: nota !== null,
                streaming: streaming !== null,
              })}
            />
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
