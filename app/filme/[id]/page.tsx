import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import BotoesMarcar from "@/components/BotoesMarcar";
import Cabecalho from "@/components/Cabecalho";
import InfoFilme from "@/components/InfoFilme";
import LuzAmbiente from "@/components/LuzAmbiente";
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

const atraso = (s: number) => ({ animationDelay: `${s}s` });

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

  const comFoto = Boolean(filme.backdropUrl);
  const tituloLongo = filme.titulo.length > 24;

  return (
    <div className="relative isolate">
      <LuzAmbiente imagem={filme.backdropUrl} />
      <Cabecalho busca={null} streaming={null} sobreposto />

      <div
        aria-hidden
        className={`relative -z-10 overflow-hidden ${comFoto ? "h-[58svh] sm:h-[80svh]" : "h-[34svh]"}`}
      >
        {filme.backdropUrl && (
          <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black_45%,transparent_97%)]">
            <Image
              src={filme.backdropUrl}
              alt=""
              fill
              sizes="100vw"
              loading="eager"
              fetchPriority="high"
              className="object-cover object-[center_20%] motion-safe:animate-assentar"
            />
            <div className="absolute inset-0 bg-linear-to-r from-sala/70 via-sala/10 to-transparent" />
          </div>
        )}
      </div>

      <main
        className={`relative mx-auto max-w-7xl px-4 pb-20 sm:px-8 ${
          comFoto ? "-mt-[26svh] sm:-mt-[42svh]" : "-mt-[14svh]"
        }`}
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-10">
          <div
            className="relative aspect-[2/3] w-36 shrink-0 overflow-hidden rounded-xl bg-poltrona shadow-[0_40px_80px_-24px_rgb(0_0_0/0.95)] ring-1 ring-tela/15 motion-safe:animate-surgir sm:w-56 lg:w-64"
            style={atraso(0.4)}
          >
            {filme.posterUrl ? (
              <Image
                src={filme.posterUrl}
                alt={`Pôster de ${filme.titulo}`}
                fill
                sizes="(min-width: 1024px) 256px, (min-width: 640px) 224px, 144px"
                className="object-cover"
              />
            ) : (
              <div className="font-display flex h-full items-center justify-center bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--color-projetor)_18%,transparent),transparent_70%)] p-4 text-center text-2xl leading-none font-extrabold uppercase">
                {filme.titulo}
              </div>
            )}
          </div>

          <div className="min-w-0 [text-shadow:0_2px_24px_rgb(13_10_18/0.55)]">
            <h1
              className={`font-display leading-[0.84] font-black text-balance break-words uppercase motion-safe:animate-surgir ${
                tituloLongo
                  ? "text-[clamp(2.5rem,6.5vw,5.5rem)]"
                  : "text-[clamp(3rem,10vw,8rem)]"
              }`}
              style={atraso(0.55)}
            >
              {filme.titulo}
            </h1>
            <InfoFilme
              nota={filme.nota}
              itens={[filme.ano, formatarDuracao(filme.duracaoMin), ...filme.generos]}
              className="mt-5 text-sm motion-safe:animate-surgir sm:text-base"
              style={atraso(0.7)}
            />
            <div className="mt-6">
              <Suspense fallback={null}>
                <BotoesMarcar filmeId={filme.id} />
              </Suspense>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-16">
          <p className="max-w-[62ch] text-lg leading-relaxed text-tela/90 sm:text-xl sm:leading-relaxed">
            {filme.sinopse || "Sinopse não disponível em português."}
          </p>

          <section aria-labelledby="onde-assistir" className="scroll-mt-8">
            <h2
              id="onde-assistir"
              className="font-display mb-5 scroll-mt-8 text-3xl leading-none font-extrabold uppercase"
            >
              Onde assistir
            </h2>
            {filme.streamings.length > 0 ? (
              <ul className="grid gap-3">
                {filme.streamings.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center gap-4 rounded-2xl bg-poltrona/70 p-3 pr-5 ring-1 ring-tela/10 backdrop-blur-md"
                  >
                    <Image
                      src={s.logoUrl}
                      alt=""
                      width={56}
                      height={56}
                      className="size-14 rounded-xl"
                    />
                    <div>
                      <p className="font-semibold">{s.nome}</p>
                      <p className="text-sm text-nevoa">Incluído na assinatura</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-2xl bg-poltrona/70 p-5 text-nevoa ring-1 ring-tela/10 backdrop-blur-md">
                No momento, este filme não está em nenhum streaming por assinatura no Brasil.
              </p>
            )}
          </section>
        </div>

        <Link
          href="/"
          className="mt-16 inline-flex items-center gap-1.5 rounded-full bg-poltrona py-2.5 pr-5 pl-4 text-sm font-semibold ring-1 ring-tela/10 transition-colors hover:bg-projetor hover:text-sala hover:ring-projetor"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden>
            <path d="m14.5 6-6 6 6 6" />
          </svg>
          Voltar ao catálogo
        </Link>
      </main>
    </div>
  );
}

export default function PaginaFilme({ params }: { params: Params }) {
  return (
    <Suspense
      fallback={
        <p className="font-display p-16 text-center text-2xl font-bold text-nevoa uppercase motion-safe:animate-pulse">
          Apagando as luzes…
        </p>
      }
    >
      <Detalhes params={params} />
    </Suspense>
  );
}
