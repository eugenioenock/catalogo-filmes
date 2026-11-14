"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, retry }: { error: Error; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex max-w-7xl flex-col items-start gap-5 px-4 py-24 sm:px-8">
      <h1 className="font-display text-5xl leading-[0.85] font-black uppercase sm:text-7xl">
        A projeção parou
      </h1>
      <p className="max-w-[52ch] text-lg text-tela/85">
        Não conseguimos carregar os filmes do TMDB agora. Tente de novo em alguns segundos.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-full bg-projetor px-6 py-3 font-semibold text-sala transition-colors hover:bg-projetor-forte"
        >
          Tentar de novo
        </button>
        <Link
          href="/"
          className="rounded-full bg-poltrona px-6 py-3 font-semibold ring-1 ring-tela/10 transition-colors hover:bg-poltrona-clara"
        >
          Voltar ao catálogo
        </Link>
      </div>
    </main>
  );
}
