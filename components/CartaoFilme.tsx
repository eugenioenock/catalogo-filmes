import Image from "next/image";
import Link from "next/link";
import { formatarNota } from "@/lib/formatar";
import { hrefDoTitulo } from "@/lib/listas";
import type { FilmeResumo, Streaming } from "@/lib/tmdb";
import { Estrela } from "./InfoFilme";
import Poster from "./Poster";

type Props = {
  filme: FilmeResumo;
  // Só a fileira "Para você" passa estes dois: onde assistir e por que o título foi sugerido.
  streaming?: Streaming;
  motivo?: string;
};

export default function CartaoFilme({ filme, streaming, motivo }: Props) {
  return (
    <Link href={hrefDoTitulo(filme)} className="group block rounded-lg">
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-poltrona shadow-[0_18px_36px_-20px_rgb(0_0_0/0.9)] ring-1 ring-tela/10 transition duration-300 group-hover:shadow-[0_28px_50px_-18px_rgb(0_0_0/0.95)] group-hover:ring-projetor/80 motion-safe:group-hover:-translate-y-1.5">
        <Poster
          src={filme.posterUrl}
          alt={`Pôster de ${filme.titulo}`}
          sizes="(min-width: 1280px) 15vw, (min-width: 1024px) 19vw, (min-width: 768px) 24vw, (min-width: 640px) 32vw, 48vw"
          className="object-cover transition duration-500 motion-safe:group-hover:scale-105"
          semImagem={
            <div className="font-display flex h-full items-center justify-center bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--color-projetor)_18%,transparent),transparent_70%)] p-4 text-center text-2xl leading-none font-extrabold uppercase">
              {filme.titulo}
            </div>
          }
        />
        {filme.tipo === "serie" && (
          <span className="absolute top-2 left-2 rounded-full bg-sala/85 px-2.5 py-0.5 text-[0.7rem] font-semibold tracking-wider text-projetor uppercase ring-1 ring-projetor/40 backdrop-blur-sm">
            Série
          </span>
        )}
        {streaming?.logoUrl && (
          <Image
            src={streaming.logoUrl}
            alt={streaming.nome}
            title={streaming.nome}
            width={28}
            height={28}
            className="absolute right-2 bottom-2 size-7 rounded-full ring-1 ring-tela/20"
          />
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
      {motivo && <p className="mt-1 line-clamp-2 text-xs text-nevoa">{motivo}</p>}
    </Link>
  );
}
