"use client";

export default function Error({ retry }: { error: Error; retry: () => void }) {
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
    </main>
  );
}
