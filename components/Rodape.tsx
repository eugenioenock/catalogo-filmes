import Image from "next/image";

export default function Rodape() {
  return (
    <footer className="border-t border-tela/8 px-4 py-10 text-sm text-nevoa sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <p className="font-display text-2xl leading-none font-black text-tela/30 uppercase">
          CineCatálogo
        </p>
        <div className="flex flex-col gap-3 sm:items-end sm:text-right">
          <p>Dados de streaming fornecidos pelo JustWatch.</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Image
              src="/tmdb-logo.svg"
              alt="TMDB"
              width={137}
              height={18}
              className="h-[18px] w-[137px] shrink-0"
            />
            <p className="max-w-md">
              Este produto usa a API do TMDB, mas não é endossado nem certificado
              pelo TMDB.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
