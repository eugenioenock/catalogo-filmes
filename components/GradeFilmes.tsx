import type { FilmeResumo } from "@/lib/tmdb";
import CartaoFilme from "./CartaoFilme";

export default function GradeFilmes({
  filmes,
  haMaisPaginas,
}: {
  filmes: FilmeResumo[];
  haMaisPaginas: boolean;
}) {
  if (filmes.length === 0) {
    return (
      <p className="py-16 text-center text-neutral-400">
        {haMaisPaginas
          ? "Nenhum resultado nesta página. Veja a próxima."
          : "Nenhum filme com esse nome está no streaming agora."}
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {filmes.map((filme) => (
        <CartaoFilme key={filme.id} filme={filme} />
      ))}
    </div>
  );
}
