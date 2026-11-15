import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DetalheTitulo from "@/components/DetalheTitulo";
import TelaCarregando from "@/components/TelaCarregando";
import { textoTemporadas } from "@/lib/formatar";
import { lerIdFilme } from "@/lib/parametros";
import { detalharSerie, FilmeNaoEncontradoError } from "@/lib/tmdb";

type Params = Promise<{ id: string }>;

const NOME_SITE = "CineCatálogo";

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const id = lerIdFilme((await params).id);
  if (id === null) return { title: NOME_SITE };
  try {
    const serie = await detalharSerie(id);
    return { title: `${serie.titulo} | ${NOME_SITE}` };
  } catch {
    // A página trata o erro (not-found ou error.tsx); aqui basta um título neutro.
    return { title: NOME_SITE };
  }
}

async function Detalhes({ params }: { params: Params }) {
  const id = lerIdFilme((await params).id);
  if (id === null) notFound();

  let serie;
  try {
    serie = await detalharSerie(id);
  } catch (erro) {
    if (erro instanceof FilmeNaoEncontradoError) notFound();
    throw erro;
  }

  // No lugar do ano e da duração do filme: "8 temporadas · 2011–2019".
  return <DetalheTitulo titulo={serie} itens={[textoTemporadas(serie), ...serie.generos]} />;
}

export default function PaginaSerie({ params }: { params: Params }) {
  return (
    <Suspense
      fallback={<TelaCarregando />}
    >
      <Detalhes params={params} />
    </Suspense>
  );
}
