import Image from "next/image";
import Link from "next/link";
import type { FilmeResumo } from "@/lib/tmdb";
import InfoFilme from "./InfoFilme";

// Atraso de cada linha na abertura: a foto assenta, depois o texto surge.
const atraso = (s: number) => ({ animationDelay: `${s}s` });

export default function Banner({ filme }: { filme: FilmeResumo }) {
  const tituloLongo = filme.titulo.length > 24;
  return (
    <section aria-labelledby="destaque" className="relative isolate overflow-hidden">
      {filme.backdropUrl && (
        <div className="absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black_55%,transparent_98%)]">
          <Image
            src={filme.backdropUrl}
            alt=""
            fill
            sizes="100vw"
            loading="eager"
            fetchPriority="high"
            className="object-cover object-[center_20%] motion-safe:animate-assentar"
          />
          {/* Escurece a esquerda (e a base, no celular) para o texto ficar legível. */}
          <div className="absolute inset-0 bg-linear-to-t from-sala/90 via-sala/30 to-transparent sm:bg-linear-to-r sm:from-sala/90 sm:via-sala/40 sm:to-transparent" />
        </div>
      )}

      <div className="mx-auto flex min-h-[82svh] max-w-7xl flex-col justify-end px-4 pt-36 pb-14 sm:min-h-[90svh] sm:px-8 sm:pb-24">
        <div className="max-w-2xl [text-shadow:0_2px_24px_rgb(13_10_18/0.5)]">
          <p
            className="mb-3 text-sm font-medium text-tela/80 motion-safe:animate-surgir sm:text-base"
            style={atraso(0.5)}
          >
            O mais popular nos streamings agora
          </p>
          <h2
            id="destaque"
            className={`font-display leading-[0.82] font-black text-balance uppercase motion-safe:animate-surgir ${
              tituloLongo
                ? "text-[clamp(2.75rem,8vw,6.5rem)]"
                : "text-[clamp(3.5rem,12vw,9.5rem)]"
            }`}
            style={atraso(0.6)}
          >
            {filme.titulo}
          </h2>
          <InfoFilme
            nota={filme.nota}
            itens={[filme.ano, ...filme.generos.slice(0, 3)]}
            className="mt-5 text-sm motion-safe:animate-surgir sm:text-base"
            style={atraso(0.75)}
          />
          {filme.sinopse && (
            <p
              className="mt-4 line-clamp-3 max-w-[52ch] text-base text-tela/85 motion-safe:animate-surgir sm:text-lg sm:leading-relaxed"
              style={atraso(0.85)}
            >
              {filme.sinopse}
            </p>
          )}
          <div
            className="mt-7 flex flex-wrap gap-3 [text-shadow:none] motion-safe:animate-surgir"
            style={atraso(1)}
          >
            <Link
              href={`/filme/${filme.id}`}
              className="rounded-full bg-projetor px-7 py-3 font-semibold text-sala shadow-[0_8px_32px_-8px] shadow-projetor/60 transition-colors hover:bg-projetor-forte"
            >
              Ver detalhes
            </Link>
            <Link
              href={`/filme/${filme.id}#onde-assistir`}
              className="rounded-full bg-tela/12 px-7 py-3 font-semibold text-tela ring-1 ring-tela/25 backdrop-blur-md transition-colors hover:bg-tela/22"
            >
              Onde assistir
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
