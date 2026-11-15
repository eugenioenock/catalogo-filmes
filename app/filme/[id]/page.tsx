import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DetalheTitulo from "@/components/DetalheTitulo";
import TelaCarregando from "@/components/TelaCarregando";
import { formatarDuracao } from "@/lib/formatar";
import { lerIdFilme } from "@/lib/parametros";
import { detalharFilme, FilmeNaoEncontradoError } from "@/lib/tmdb";

type Params = Promise<{ id: string }>;

const NOME_SITE = "CineCatálogo";

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const id = lerIdFilme((await params).id);
  if (id === null) return { title: NOME_SITE };
  try {
    const filme = await detalharFilme(id);
    return { title: `${filme.titulo} | ${NOME_SITE}` };
  } catch {
    // A página trata o erro (not-found ou error.tsx); aqui basta um título neutro.
    return { title: NOME_SITE };
  }
}

async function Detalhes({ params }: { params: Params }) {
  const id = lerIdFilme((await params).id);
  if (id === null) notFound();

  let filme;
  try {
    filme = await detalharFilme(id);
  } catch (erro) {
    if (erro instanceof FilmeNaoEncontradoError) notFound();
    throw erro;
  }

  return <DetalheTitulo titulo={filme} itens={[filme.ano, formatarDuracao(filme.duracaoMin), ...filme.generos]} />;
}

export default function PaginaFilme({ params }: { params: Params }) {
  return (
    <Suspense
      fallback={<TelaCarregando />}
    >
      <Detalhes params={params} />
    </Suspense>
  );
}
