type Props = {
  busca: string | null;
  streaming: number | null;
};

export default function CampoBusca({ busca, streaming }: Props) {
  return (
    <form method="get" action="/" className="flex w-full gap-2 sm:w-auto">
      <input
        type="search"
        name="busca"
        defaultValue={busca ?? ""}
        placeholder="Buscar filmes"
        aria-label="Buscar filmes"
        className="min-w-0 flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 placeholder:text-neutral-500 focus:border-amber-500 focus:outline-none sm:w-72"
      />
      {streaming !== null && (
        <input type="hidden" name="streaming" value={streaming} />
      )}
      <button
        type="submit"
        className="rounded-md bg-amber-500 px-4 py-2 font-medium text-neutral-950 hover:bg-amber-400"
      >
        Buscar
      </button>
    </form>
  );
}
