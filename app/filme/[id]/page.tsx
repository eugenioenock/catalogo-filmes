import type { Metadata } from "next";
import PaginaDeTitulo, { metadadosDoTitulo } from "@/components/PaginaDeTitulo";
import { formatarDuracao } from "@/lib/formatar";
import { detalharFilme } from "@/lib/tmdb";

type Props = { params: Promise<{ id: string }> };

export function generateMetadata({ params }: Props): Promise<Metadata> {
  return metadadosDoTitulo(params, detalharFilme);
}

export default function PaginaFilme({ params }: Props) {
  return (
    <PaginaDeTitulo
      params={params}
      carregar={detalharFilme}
      itens={(filme) => [filme.ano, formatarDuracao(filme.duracaoMin)]}
    />
  );
}
