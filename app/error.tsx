"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, retry }: { error: Error; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-16">
      <p className="text-lg">Não conseguimos carregar os filmes agora.</p>
      <button
        type="button"
        onClick={() => retry()}
        className="rounded-md bg-amber-500 px-4 py-2 font-medium text-neutral-950 hover:bg-amber-400"
      >
        Tentar de novo
      </button>
      <Link href="/" className="text-amber-500 hover:underline">
        ← Voltar ao catálogo
      </Link>
    </main>
  );
}
