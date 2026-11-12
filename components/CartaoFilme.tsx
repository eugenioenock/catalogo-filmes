import Image from "next/image";
import Link from "next/link";
import type { FilmeResumo } from "@/lib/tmdb";

export default function CartaoFilme({ filme }: { filme: FilmeResumo }) {
  return (
    <Link href={`/filme/${filme.id}`} className="group block">
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-neutral-900">
        {filme.posterUrl ? (
          <Image
            src={filme.posterUrl}
            alt={`Pôster de ${filme.titulo}`}
            fill
            sizes="(min-width: 1024px) 16vw, (min-width: 640px) 25vw, 50vw"
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-neutral-800 p-3 text-center text-sm font-semibold text-neutral-200">
            {filme.titulo}
          </div>
        )}
      </div>
      <h3 className="mt-2 line-clamp-2 text-sm font-medium group-hover:text-amber-500">
        {filme.titulo}
      </h3>
      {filme.ano && <p className="text-xs text-neutral-400">{filme.ano}</p>}
    </Link>
  );
}
