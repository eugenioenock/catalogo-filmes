import Image from "next/image";
import Link from "next/link";
import pacote from "@/package.json";

export default function Rodape() {
  return (
    <footer className="border-t border-tela/8 px-4 py-10 text-sm text-nevoa sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className="font-display text-2xl leading-none font-black text-tela/30 uppercase">
            CineCatálogo
          </p>
          {/* A versão vem do package.json, que o `npm run versao` atualiza a cada lançamento. */}
          <p className="flex items-center gap-2">
            <span>v{pacote.version}</span>
            <span aria-hidden>·</span>
            <Link href="/novidades" className="rounded-sm underline-offset-4 transition-colors hover:text-projetor hover:underline">
              Novidades
            </Link>
          </p>
        </div>
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
