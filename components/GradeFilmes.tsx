import type { FilmeResumo } from "@/lib/tmdb";
import CartaoFilme from "./CartaoFilme";

export default function GradeFilmes({
  filmes,
  haMaisPaginas,
  comBusca,
}: {
  filmes: FilmeResumo[];
  haMaisPaginas: boolean;
  comBusca: boolean;
}) {
  if (filmes.length === 0) {
    return (
      <p className="py-16 text-center text-nevoa">
        {haMaisPaginas
          ? "Nenhum resultado nesta página. Veja a próxima."
          : comBusca
            ? "Nenhum filme com esse nome está no streaming agora."
            : "Nenhum filme com essa nota neste streaming."}
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {filmes.map((filme) => (
        <CartaoFilme key={filme.id} filme={filme} />
      ))}
    </div>
  );
}
