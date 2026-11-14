import Image from "next/image";
import Link from "next/link";
import type { FilmeResumo } from "@/lib/tmdb";
import Fileira from "./Fileira";

// Os 10 primeiros da lista, que já vem ordenada por popularidade.
// O número grande é a posição real no ranking.
export default function EmAlta({ filmes }: { filmes: FilmeResumo[] }) {
  return (
    <Fileira id="em-alta" titulo="Em alta agora">
      <ol className="flex w-max gap-3 px-(--margem) pt-5 pb-6 sm:gap-5">
        {filmes.map((filme, i) => (
          <li key={filme.id} className="shrink-0 snap-start">
            <Link
              href={`/filme/${filme.id}`}
              aria-label={`${i + 1}º lugar: ${filme.titulo}`}
              className="group flex items-end rounded-md"
            >
              <span
                aria-hidden
                className="numero-ranking font-display -mr-2.5 text-[9.5rem] leading-[0.74] font-black tracking-tighter select-none sm:-mr-4 sm:text-[14rem]"
              >
                {i + 1}
              </span>
              <div className="relative aspect-[2/3] w-28 overflow-hidden rounded-md bg-poltrona shadow-[0_20px_40px_-18px_rgb(0_0_0/0.9)] ring-1 ring-tela/10 transition duration-300 group-hover:ring-projetor/80 motion-safe:group-hover:-translate-y-1.5 sm:w-40">
                {filme.posterUrl ? (
                  <Image
                    src={filme.posterUrl}
                    alt=""
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                ) : (
                  <div className="font-display flex h-full items-center justify-center p-3 text-center text-xl leading-none font-extrabold uppercase">
                    {filme.titulo}
                  </div>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </Fileira>
  );
}
