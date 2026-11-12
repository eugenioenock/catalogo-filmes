import "server-only";

const API = "https://api.themoviedb.org/3";
const IMAGENS = "https://image.tmdb.org/t/p";

export type Streaming = { id: number; nome: string; logoUrl: string };

export class FilmeNaoEncontradoError extends Error {}
export class TmdbIndisponivelError extends Error {}

type TmdbProvider = {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priorities?: Record<string, number>;
};

export function imagemUrl(
  caminho: string | null,
  tamanho: "w92" | "w342" | "w1280",
): string | null {
  return caminho ? `${IMAGENS}/${tamanho}${caminho}` : null;
}

export async function tmdbGet<T>(
  caminho: string,
  params: Record<string, string> = {},
): Promise<T> {
  const token = process.env.TMDB_TOKEN;
  if (!token) {
    throw new Error(
      "Defina TMDB_TOKEN no .env.local (local) ou nas variáveis de ambiente da Vercel.",
    );
  }
  const query = new URLSearchParams(params).toString();
  const url = `${API}${caminho}${query ? `?${query}` : ""}`;

  let resposta: Response;
  try {
    resposta = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      next: { revalidate: 3600 },
    });
  } catch {
    throw new TmdbIndisponivelError("Não foi possível falar com o TMDB.");
  }
  if (resposta.status === 404) throw new FilmeNaoEncontradoError("Não encontrado no TMDB.");
  if (!resposta.ok) throw new TmdbIndisponivelError(`TMDB respondeu ${resposta.status}.`);
  return (await resposta.json()) as T;
}

export async function listarStreamings(): Promise<Streaming[]> {
  const dados = await tmdbGet<{ results: TmdbProvider[] }>("/watch/providers/movie", {
    watch_region: "BR",
    language: "pt-BR",
  });
  return dados.results
    .filter((p) => p.display_priorities?.BR !== undefined && p.logo_path)
    .sort((a, b) => a.display_priorities!.BR - b.display_priorities!.BR)
    .slice(0, 10)
    .map((p) => ({
      id: p.provider_id,
      nome: p.provider_name,
      logoUrl: imagemUrl(p.logo_path, "w92")!,
    }));
}
