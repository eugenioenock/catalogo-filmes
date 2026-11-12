import Link from "next/link";
import CampoBusca from "./CampoBusca";

type Props = {
  busca: string | null;
  streaming: number | null;
  nomeComoTitulo?: boolean;
};

export default function Cabecalho({ busca, streaming, nomeComoTitulo = false }: Props) {
  const Nome = nomeComoTitulo ? "h1" : "p";
  return (
    <header className="border-b border-neutral-800">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Nome className="text-2xl font-bold text-amber-500">
          <Link href="/">CineCatálogo</Link>
        </Nome>
        <CampoBusca busca={busca} streaming={streaming} />
      </div>
    </header>
  );
}
