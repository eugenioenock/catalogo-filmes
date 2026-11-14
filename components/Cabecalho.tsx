import Link from "next/link";
import CampoBusca from "./CampoBusca";

type Props = {
  busca: string | null;
  streaming: number | null;
  nota?: number | null;
  nomeComoTitulo?: boolean;
  /** Fica por cima da foto do destaque, sem fundo próprio. */
  sobreposto?: boolean;
};

export default function Cabecalho({
  busca,
  streaming,
  nota = null,
  nomeComoTitulo = false,
  sobreposto = false,
}: Props) {
  const Nome = nomeComoTitulo ? "h1" : "p";
  return (
    <header
      className={
        sobreposto
          ? "absolute inset-x-0 top-0 z-20 bg-linear-to-b from-sala/85 via-sala/40 to-transparent pb-10"
          : "relative z-20"
      }
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6">
        <Nome className="font-display text-3xl leading-none font-black tracking-tight text-projetor uppercase">
          <Link href="/" className="rounded-sm">
            CineCatálogo
          </Link>
        </Nome>
        <CampoBusca busca={busca} streaming={streaming} nota={nota} />
      </div>
    </header>
  );
}
