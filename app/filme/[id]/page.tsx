import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Cabecalho from "@/components/Cabecalho";
import { formatarDuracao, formatarNota } from "@/lib/formatar";
import { lerIdFilme } from "@/lib/parametros";
import { detalharFilme, FilmeNaoEncontradoError } from "@/lib/tmdb";

type Params = Promise<{ id: string }>;

const NOME_SITE = "CineCatálogo";

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const id = lerIdFilme((await params).id);
  if (id === null) return { title: NOME_SITE };
  try {
    const filme = await detalharFilme(id);
    return { title: `${filme.titulo} · ${NOME_SITE}` };
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

  const duracao = formatarDuracao(filme.duracaoMin);
  const meta = [filme.ano, duracao, ...filme.generos].filter(Boolean).join(" · ");

  return (
    <>
      <Cabecalho busca={null} streaming={null} />
      <section
        className="relative isolate overflow-hidden bg-gradient-to-br from-neutral-800 to-neutral-950"
        style={
          filme.backdropUrl
            ? {
                backgroundImage: `url(${filme.backdropUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-neutral-950/30" />
        <div className="mx-auto flex min-h-48 max-w-6xl items-end px-4 py-10 sm:min-h-72">
          <h1 className="text-3xl font-bold sm:text-4xl">{filme.titulo}</h1>
        </div>
      </section>
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-6">
        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="relative aspect-[2/3] w-48 shrink-0 overflow-hidden rounded-lg bg-neutral-900">
            {filme.posterUrl ? (
              <Image
                src={filme.posterUrl}
                alt={`Pôster de ${filme.titulo}`}
                fill
                sizes="192px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-neutral-800 p-3 text-center text-sm font-semibold text-neutral-200">
                {filme.titulo}
              </div>
            )}
          </div>
          <div className="space-y-3">
            <p className="text-sm text-neutral-300">
              {meta}
              {meta && " · "}
              <span className="font-semibold text-amber-500">★ {formatarNota(filme.nota)}</span>
            </p>
            <p className="max-w-2xl text-neutral-200">
              {filme.sinopse || "Sinopse não disponível em português."}
            </p>
          </div>
        </div>

        <section aria-labelledby="onde-assistir">
          <h2 id="onde-assistir" className="mb-3 text-xl font-semibold">
            Onde assistir
          </h2>
          {filme.streamings.length > 0 ? (
            <ul className="flex flex-wrap gap-4">
              {filme.streamings.map((s) => (
                <li key={s.id} className="flex items-center gap-2">
                  <Image
                    src={s.logoUrl}
                    alt=""
                    width={40}
                    height={40}
                    className="rounded-lg"
                  />
                  <span className="text-sm">{s.nome}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-neutral-400">
              No momento, este filme não está em nenhum streaming por assinatura no Brasil.
            </p>
          )}
        </section>

        <Link href="/" className="inline-block text-amber-500 hover:underline">
          ← Voltar ao catálogo
        </Link>
      </main>
    </>
  );
}

export default function PaginaFilme({ params }: { params: Params }) {
  return (
    <Suspense fallback={<p className="p-8 text-center text-neutral-400">Carregando...</p>}>
      <Detalhes params={params} />
    </Suspense>
  );
}
