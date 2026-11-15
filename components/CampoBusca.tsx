import type { Tipo } from "@/lib/listas";

type Props = {
  busca: string | null;
  streaming: number | null;
  nota: number | null;
  /** A aba de onde se busca: Séries vai junto na URL para a pessoa voltar a ela depois. */
  tipo: Tipo;
};

export default function CampoBusca({ busca, streaming, nota, tipo }: Props) {
  return (
    <form
      method="get"
      action="/"
      role="search"
      className="group flex w-full items-center rounded-full border border-tela/15 bg-sala/50 pl-4 backdrop-blur-md transition-colors focus-within:border-projetor/70 focus-within:bg-sala/80 sm:w-80"
    >
      <input
        type="search"
        maxLength={100}
        name="busca"
        defaultValue={busca ?? ""}
        placeholder="Buscar filmes e séries"
        aria-label="Buscar filmes e séries"
        className="min-w-0 flex-1 bg-transparent py-2.5 text-tela placeholder:text-nevoa focus:outline-none"
      />
      {/* Os resultados trazem filmes e séries juntos; o tipo só guarda a aba para depois da busca. */}
      {tipo === "serie" && <input type="hidden" name="tipo" value="series" />}
      {streaming !== null && (
        <input type="hidden" name="streaming" value={streaming} />
      )}
      {nota !== null && <input type="hidden" name="nota" value={nota} />}
      <button
        type="submit"
        aria-label="Buscar"
        className="m-1 grid size-9 shrink-0 place-items-center rounded-full text-nevoa transition-colors hover:bg-projetor hover:text-sala focus-visible:bg-projetor focus-visible:text-sala"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="size-[18px]" aria-hidden>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m20 20-4.2-4.2" />
        </svg>
      </button>
    </form>
  );
}
