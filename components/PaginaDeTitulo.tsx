import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { lerIdFilme } from "@/lib/parametros";
import { FilmeNaoEncontradoError, type FilmeResumo, type Streaming } from "@/lib/tmdb";
import DetalheTitulo from "./DetalheTitulo";
import TelaCarregando from "./TelaCarregando";

/** O que detalharFilme e detalharSerie devolvem em comum. */
type Detalhe = FilmeResumo & { streamings: Streaming[] };
type Params = Promise<{ id: string }>;

type Props<T extends Detalhe> = {
  params: Params;
  /** detalharFilme ou detalharSerie. */
  carregar: (id: number) => Promise<T>;
  /** A linha de informações, antes dos gêneros (filme: ano e duração; série: temporadas e anos). */
  itens: (titulo: T) => (string | null)[];
};

const NOME_SITE = "CineCatálogo";

/** O título da aba: "Nome do título | CineCatálogo". */
export async function metadadosDoTitulo(
  params: Params,
  carregar: (id: number) => Promise<{ titulo: string }>,
): Promise<Metadata> {
  const id = lerIdFilme((await params).id);
  if (id === null) return { title: NOME_SITE };
  try {
    return { title: `${(await carregar(id)).titulo} | ${NOME_SITE}` };
  } catch {
    // A página trata o erro (not-found ou error.tsx); aqui basta um título neutro.
    return { title: NOME_SITE };
  }
}

/** A página de um filme ou de uma série: o que muda entre os dois vem por `carregar` e `itens`. */
export default function PaginaDeTitulo<T extends Detalhe>(props: Props<T>) {
  return (
    <Suspense fallback={<TelaCarregando />}>
      <Detalhes {...props} />
    </Suspense>
  );
}

async function Detalhes<T extends Detalhe>({ params, carregar, itens }: Props<T>) {
  const id = lerIdFilme((await params).id);
  if (id === null) notFound();

  let titulo: T;
  try {
    titulo = await carregar(id);
  } catch (erro) {
    if (erro instanceof FilmeNaoEncontradoError) notFound();
    throw erro;
  }

  return <DetalheTitulo titulo={titulo} itens={[...itens(titulo), ...titulo.generos]} />;
}
