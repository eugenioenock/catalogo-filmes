import Link from "next/link";
import { formatarNota } from "@/lib/formatar";
import type { FilmeResumo } from "@/lib/tmdb";

export default function Banner({ filme }: { filme: FilmeResumo }) {
  const meta = [filme.ano, ...filme.generos].filter(Boolean).join(" · ");
  return (
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
      <div className="mx-auto flex min-h-72 max-w-6xl flex-col justify-end gap-3 px-4 py-10 sm:min-h-96">
        <h2 className="text-3xl font-bold sm:text-4xl">{filme.titulo}</h2>
        <p className="text-sm text-neutral-300">
          {meta}
          {meta && " · "}
          <span className="font-semibold text-amber-500">★ {formatarNota(filme.nota)}</span>
        </p>
        {filme.sinopse && (
          <p className="line-clamp-2 max-w-2xl text-neutral-200">{filme.sinopse}</p>
        )}
        <Link
          href={`/filme/${filme.id}`}
          className="mt-1 w-fit rounded-full bg-amber-500 px-5 py-2 font-semibold text-neutral-950 hover:bg-amber-400"
        >
          Ver detalhes
        </Link>
      </div>
    </section>
  );
}
