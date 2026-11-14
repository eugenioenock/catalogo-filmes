import "server-only";

import { cache } from "react";
import { anoDe } from "./formatar";

const API = "https://api.themoviedb.org/3";
const IMAGENS = "https://image.tmdb.org/t/p";

// Lojas (aluguel/compra) e serviços gratuitos: não são assinatura.
const IDS_FORA_DA_ASSINATURA = [2, 3, 10, 68, 2791];

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
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new TmdbIndisponivelError("Não foi possível falar com o TMDB.");
  }
  if (resposta.status === 404) throw new FilmeNaoEncontradoError("Não encontrado no TMDB.");
  if (!resposta.ok) throw new TmdbIndisponivelError(`TMDB respondeu ${resposta.status}.`);
  try {
    return (await resposta.json()) as T;
  } catch {
    throw new TmdbIndisponivelError("O TMDB devolveu uma resposta inválida.");
  }
}

export async function listarStreamings(): Promise<Streaming[]> {
  const dados = await tmdbGet<{ results: TmdbProvider[] }>("/watch/providers/movie", {
    watch_region: "BR",
    language: "pt-BR",
  });
  return dados.results
    .filter(
      (p) =>
        p.display_priorities?.BR !== undefined &&
        p.logo_path &&
        !IDS_FORA_DA_ASSINATURA.includes(p.provider_id),
    )
    .sort((a, b) => a.display_priorities!.BR - b.display_priorities!.BR)
    .slice(0, 10)
    .map((p) => ({
      id: p.provider_id,
      nome: p.provider_name,
      logoUrl: imagemUrl(p.logo_path, "w92")!,
    }));
}

export type FilmeResumo = {
  id: number;
  titulo: string;
  ano: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  sinopse: string;
  nota: number;
  generos: string[];
};
export type PaginaDeFilmes = { filmes: FilmeResumo[]; pagina: number; totalPaginas: number };
export type FilmeDetalhe = FilmeResumo & { duracaoMin: number | null; streamings: Streaming[] };

type TmdbFilme = {
  id: number;
  title: string;
  release_date?: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  overview?: string | null;
  vote_average: number;
  vote_count: number;
};
type TmdbPagina = { page: number; total_pages: number; results: (TmdbFilme & { genre_ids: number[] })[] };
type TmdbProvidersBR = { results?: { BR?: { flatrate?: TmdbProvider[] } } };

const MAX_PAGINAS = 500;
// Com o filtro de nota ativo, evita filmes com nota alta dada por poucas pessoas.
const VOTOS_MINIMOS = 200;

function resumir(f: TmdbFilme, generos: string[]): FilmeResumo {
  return {
    id: f.id,
    titulo: f.title,
    ano: anoDe(f.release_date),
    posterUrl: imagemUrl(f.poster_path, "w342"),
    backdropUrl: imagemUrl(f.backdrop_path, "w1280"),
    sinopse: f.overview ?? "",
    nota: f.vote_average,
    generos,
  };
}

function streamingsDe(dados: TmdbProvidersBR | undefined): Streaming[] {
  return (dados?.results?.BR?.flatrate ?? []).map((p) => ({
    id: p.provider_id,
    nome: p.provider_name,
    logoUrl: imagemUrl(p.logo_path, "w92") ?? "",
  }));
}

async function montarPagina(dados: TmdbPagina): Promise<PaginaDeFilmes> {
  const { genres } = await tmdbGet<{ genres: { id: number; name: string }[] }>(
    "/genre/movie/list",
    { language: "pt-BR" },
  );
  const nomes = new Map(genres.map((g) => [g.id, g.name]));
  return {
    filmes: dados.results.map((f) =>
      resumir(
        f,
        f.genre_ids.flatMap((id) => nomes.get(id) ?? []),
      ),
    ),
    pagina: dados.page,
    totalPaginas: Math.min(dados.total_pages, MAX_PAGINAS),
  };
}

export async function listarFilmes(o: {
  streaming: number | null;
  nota: number | null;
  pagina: number;
}): Promise<PaginaDeFilmes> {
  const params: Record<string, string> = {
    watch_region: "BR",
    with_watch_monetization_types: "flatrate",
    language: "pt-BR",
    sort_by: "popularity.desc",
    page: String(o.pagina),
  };
  if (o.streaming !== null) params.with_watch_providers = String(o.streaming);
  if (o.nota !== null) {
    params["vote_average.gte"] = String(o.nota);
    params["vote_count.gte"] = String(VOTOS_MINIMOS);
  }
  return montarPagina(await tmdbGet<TmdbPagina>("/discover/movie", params));
}

export async function buscarFilmes(o: {
  texto: string;
  streaming: number | null;
  nota: number | null;
  pagina: number;
}): Promise<PaginaDeFilmes> {
  const dados = await tmdbGet<TmdbPagina>("/search/movie", {
    query: o.texto,
    language: "pt-BR",
    page: String(o.pagina),
  });
  const { nota } = o;
  const candidatos =
    nota === null
      ? dados.results
      : dados.results.filter((f) => f.vote_average >= nota && f.vote_count >= VOTOS_MINIMOS);
  const disponibilidade = await Promise.allSettled(
    candidatos.map((f) => tmdbGet<TmdbProvidersBR>(`/movie/${f.id}/watch/providers`)),
  );
  const results = candidatos.filter((_, i) => {
    const d = disponibilidade[i];
    if (d.status === "rejected") return false;
    const streamings = streamingsDe(d.value);
    return o.streaming === null
      ? streamings.length > 0
      : streamings.some((s) => s.id === o.streaming);
  });
  return montarPagina({ ...dados, results });
}

export const detalharFilme = cache(async (id: number): Promise<FilmeDetalhe> => {
  const d = await tmdbGet<
    TmdbFilme & {
      runtime?: number | null;
      genres: { id: number; name: string }[];
      "watch/providers"?: TmdbProvidersBR;
    }
  >(`/movie/${id}`, { language: "pt-BR", append_to_response: "watch/providers" });
  return {
    ...resumir(
      d,
      d.genres.map((g) => g.name),
    ),
    duracaoMin: d.runtime || null,
    streamings: streamingsDe(d["watch/providers"]),
  };
});
