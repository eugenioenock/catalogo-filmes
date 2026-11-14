import { chaveDoTitulo } from "@/lib/listas";
import type { FilmeResumo } from "@/lib/tmdb";
import CartaoFilme from "./CartaoFilme";

export default function GradeFilmes({
  filmes,
  haMaisPaginas,
  mensagemVazia,
}: {
  filmes: FilmeResumo[];
  haMaisPaginas: boolean;
  /** Usada quando não há filmes nem mais páginas. */
  mensagemVazia: string;
}) {
  if (filmes.length === 0) {
    return (
      <p className="py-16 text-center text-nevoa">
        {haMaisPaginas
          ? "Nenhum resultado nesta página. Veja a próxima."
          : mensagemVazia}
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {filmes.map((filme) => (
        <CartaoFilme key={chaveDoTitulo(filme)} filme={filme} />
      ))}
    </div>
  );
}
