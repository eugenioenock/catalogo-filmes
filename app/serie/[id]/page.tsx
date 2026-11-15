import type { Metadata } from "next";
import PaginaDeTitulo, { metadadosDoTitulo } from "@/components/PaginaDeTitulo";
import { textoTemporadas } from "@/lib/formatar";
import { detalharSerie } from "@/lib/tmdb";

type Props = { params: Promise<{ id: string }> };

export function generateMetadata({ params }: Props): Promise<Metadata> {
  return metadadosDoTitulo(params, detalharSerie);
}

export default function PaginaSerie({ params }: Props) {
  return (
    <PaginaDeTitulo
      params={params}
      carregar={detalharSerie}
      // No lugar do ano e da duração do filme: "8 temporadas · 2011–2019".
      itens={(serie) => [textoTemporadas(serie)]}
    />
  );
}
