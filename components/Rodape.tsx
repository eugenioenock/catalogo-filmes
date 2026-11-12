import Image from "next/image";

export default function Rodape() {
  return (
    <footer className="border-t border-neutral-800 px-4 py-6 text-sm text-neutral-400">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <p>Dados de streaming fornecidos pelo JustWatch.</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Image
            src="/tmdb-logo.svg"
            alt="TMDB"
            width={137}
            height={18}
            className="h-[18px] w-[137px] shrink-0"
          />
          <p>
            Este produto usa a API do TMDB, mas não é endossado nem certificado
            pelo TMDB.
          </p>
        </div>
      </div>
    </footer>
  );
}
