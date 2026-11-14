import Image from "next/image";
import Link from "next/link";
import { formatarNota } from "@/lib/formatar";
import type { FilmeResumo } from "@/lib/tmdb";
import { Estrela } from "./InfoFilme";

export default function CartaoFilme({ filme }: { filme: FilmeResumo }) {
  return (
    <Link href={`/filme/${filme.id}`} className="group block rounded-lg">
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-poltrona shadow-[0_18px_36px_-20px_rgb(0_0_0/0.9)] ring-1 ring-tela/10 transition duration-300 group-hover:shadow-[0_28px_50px_-18px_rgb(0_0_0/0.95)] group-hover:ring-projetor/80 motion-safe:group-hover:-translate-y-1.5">
        {filme.posterUrl ? (
          <Image
            src={filme.posterUrl}
            alt={`Pôster de ${filme.titulo}`}
            fill
            sizes="(min-width: 1280px) 15vw, (min-width: 1024px) 19vw, (min-width: 768px) 24vw, (min-width: 640px) 32vw, 48vw"
            className="object-cover transition duration-500 motion-safe:group-hover:scale-105"
          />
        ) : (
          <div className="font-display flex h-full items-center justify-center bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--color-projetor)_18%,transparent),transparent_70%)] p-4 text-center text-2xl leading-none font-extrabold uppercase">
            {filme.titulo}
          </div>
        )}
      </div>
      <h3 className="mt-3 line-clamp-1 text-sm font-semibold transition-colors group-hover:text-projetor">
        {filme.titulo}
      </h3>
      <p className="mt-1 flex items-center gap-3 text-xs text-nevoa">
        <span className="flex items-center gap-1 font-medium text-projetor/90">
          <Estrela className="size-3" />
          {formatarNota(filme.nota)}
          <span className="sr-only">de 10</span>
        </span>
        {filme.ano}
      </p>
    </Link>
  );
}
