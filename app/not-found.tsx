import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-16">
      <h1 className="text-2xl font-bold">Filme não encontrado</h1>
      <Link href="/" className="text-amber-500 hover:underline">
        ← Voltar ao catálogo
      </Link>
    </main>
  );
}
