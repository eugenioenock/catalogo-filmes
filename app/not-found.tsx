import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-7xl flex-col items-start gap-5 px-4 py-24 sm:px-8">
      <h1 className="font-display text-5xl leading-[0.85] font-black uppercase sm:text-7xl">
        Filme não encontrado
      </h1>
      <p className="max-w-[52ch] text-lg text-tela/85">
        O endereço pode estar errado ou o filme saiu do TMDB. Volte ao catálogo para buscar outro.
      </p>
      <Link
        href="/"
        className="rounded-full bg-projetor px-6 py-3 font-semibold text-sala transition-colors hover:bg-projetor-forte"
      >
        Voltar ao catálogo
      </Link>
    </main>
  );
}
