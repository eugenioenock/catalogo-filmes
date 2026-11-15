import "server-only";

import { cache } from "react";
import { anoDe } from "./formatar";
import type { Tipo } from "./listas";
import type { Candidato } from "./recomendacoes";

const API = "https://api.themoviedb.org/3";
const IMAGENS = "https://image.tmdb.org/t/p";

// Lojas (aluguel/compra) e serviços gratuitos: não são assinatura.
const IDS_FORA_DA_ASSINATURA = [2, 3, 10, 68, 2791];

/** `logoUrl` é null quando o TMDB não tem o logo: o streaming continua valendo, só sem imagem. */
export type Streaming = { id: number; nome: string; logoUrl: string | null };

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
      logoUrl: imagemUrl(p.logo_path, "w92"),
    }));
}

export type FilmeResumo = {
  tipo: Tipo;
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
export type FilmeDetalhe = FilmeResumo & { duracaoMin: number | null; generoIds: number[]; streamings: Streaming[] };
export type SerieDetalhe = FilmeResumo & {
  temporadas: number | null;
  anoFim: string | null;
  /** Encerrada ou cancelada: a série não terá mais temporadas. */
  terminou: boolean;
  generoIds: number[];
  streamings: Streaming[];
};

/** Um filme ou uma série como vêm do TMDB: filme tem title/release_date; série, name/first_air_date. */
type TmdbTitulo = {
  id: number;
  title?: string;
  release_date?: string | null;
  name?: string;
  first_air_date?: string | null;
  /**
   * O nome na língua original. Sem tradução para pt-BR, o TMDB hoje já põe o original em
   * title/name (conferido em 2026-11); usar estes campos é só a garantia de nunca ter cartão sem nome.
   */
  original_title?: string;
  original_name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview?: string | null;
  vote_average: number;
  vote_count: number;
};
type TmdbFilme = TmdbTitulo & { title: string };
type TmdbItem = TmdbTitulo & { genre_ids: number[] };
type TmdbPagina = { page: number; total_pages: number; results: TmdbItem[] };
type TmdbProvidersBR = { results?: { BR?: { flatrate?: TmdbProvider[] } } };

/** O caminho de cada tipo na API do TMDB. */
const CAMINHO: Record<Tipo, "movie" | "tv"> = { filme: "movie", serie: "tv" };

const MAX_PAGINAS = 500;
// Com o filtro de nota ativo, evita títulos com nota alta dada por poucas pessoas.
const VOTOS_MINIMOS = 200;

/** A conversão do formato do TMDB para o resumo do site, para filmes e séries. */
function resumir(tipo: Tipo, f: TmdbTitulo, generos: string[]): FilmeResumo {
  return {
    tipo,
    id: f.id,
    titulo: (tipo === "filme" ? f.title || f.original_title : f.name || f.original_name) ?? "",
    ano: anoDe(tipo === "filme" ? f.release_date : f.first_air_date),
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
    logoUrl: imagemUrl(p.logo_path, "w92"),
  }));
}

/** Gêneros de série que o TMDB devolve em inglês mesmo com language=pt-BR. */
const GENEROS_DE_SERIE_EM_PORTUGUES: Record<number, string> = {
  10759: "Ação e Aventura",
  10765: "Ficção científica e Fantasia",
  10768: "Guerra e Política",
};

function nomeDoGenero(tipo: Tipo, g: { id: number; name: string }): string {
  return (tipo === "serie" && GENEROS_DE_SERIE_EM_PORTUGUES[g.id]) || g.name;
}

/** id do gênero → nome, para um tipo (os de série já traduzidos). */
export async function nomesDosGeneros(tipo: Tipo): Promise<Map<number, string>> {
  const { genres } = await tmdbGet<{ genres: { id: number; name: string }[] }>(
    `/genre/${CAMINHO[tipo]}/list`,
    { language: "pt-BR" },
  );
  return new Map(genres.map((g) => [g.id, nomeDoGenero(tipo, g)]));
}

function nomesDosIds(ids: number[], nomes: Map<number, string>): string[] {
  return ids.flatMap((id) => nomes.get(id) ?? []);
}

export async function listarTitulos(o: {
  tipo: Tipo;
  streaming: number | null;
  nota: number | null;
  pagina: number;
  /** Só títulos destes gêneros (qualquer um deles). Usado pela reserva do "Para você". */
  generos?: number[];
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
  if (o.generos && o.generos.length > 0) {
    // "|" é OU no TMDB. Os votos mínimos evitam títulos obscuros mesmo sem filtro de nota.
    params.with_genres = o.generos.join("|");
    params["vote_count.gte"] = String(VOTOS_MINIMOS);
  }
  const [dados, nomes] = await Promise.all([
    tmdbGet<TmdbPagina>(`/discover/${CAMINHO[o.tipo]}`, params),
    nomesDosGeneros(o.tipo),
  ]);
  return {
    filmes: dados.results.map((f) => resumir(o.tipo, f, nomesDosIds(f.genre_ids, nomes))),
    pagina: dados.page,
    totalPaginas: Math.min(dados.total_pages, MAX_PAGINAS),
  };
}

/** Busca por texto: filmes e séries juntos, na ordem do TMDB, só o que está em algum streaming. */
export async function buscarTitulos(o: {
  texto: string;
  streaming: number | null;
  nota: number | null;
  pagina: number;
}): Promise<PaginaDeFilmes> {
  const [dados, generosFilme, generosSerie] = await Promise.all([
    tmdbGet<{ page: number; total_pages: number; results: (TmdbItem & { media_type: string })[] }>(
      "/search/multi",
      { query: o.texto, language: "pt-BR", page: String(o.pagina) },
    ),
    nomesDosGeneros("filme"),
    nomesDosGeneros("serie"),
  ]);
  const { nota } = o;
  // Pessoas também aparecem na busca do TMDB: ficam só filmes (movie) e séries (tv).
  const candidatos = dados.results.flatMap((f) => {
    const tipo: Tipo | null = f.media_type === "movie" ? "filme" : f.media_type === "tv" ? "serie" : null;
    if (tipo === null) return [];
    if (nota !== null && !(f.vote_average >= nota && f.vote_count >= VOTOS_MINIMOS)) return [];
    return [{ tipo, f }];
  });
  const disponibilidade = await Promise.allSettled(
    candidatos.map(({ tipo, f }) => tmdbGet<TmdbProvidersBR>(`/${CAMINHO[tipo]}/${f.id}/watch/providers`)),
  );
  const filmes = candidatos
    .filter((_, i) => {
      const d = disponibilidade[i];
      if (d.status === "rejected") return false;
      const streamings = streamingsDe(d.value);
      return o.streaming === null
        ? streamings.length > 0
        : streamings.some((s) => s.id === o.streaming);
    })
    .map(({ tipo, f }) =>
      resumir(tipo, f, nomesDosIds(f.genre_ids ?? [], tipo === "filme" ? generosFilme : generosSerie)),
    );
  return { filmes, pagina: dados.page, totalPaginas: Math.min(dados.total_pages, MAX_PAGINAS) };
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
      "filme",
      d,
      d.genres.map((g) => g.name),
    ),
    duracaoMin: d.runtime || null,
    generoIds: d.genres.map((g) => g.id),
    streamings: streamingsDe(d["watch/providers"]),
  };
});

export const detalharSerie = cache(async (id: number): Promise<SerieDetalhe> => {
  const d = await tmdbGet<
    TmdbTitulo & {
      number_of_seasons?: number | null;
      last_air_date?: string | null;
      status?: string;
      genres: { id: number; name: string }[];
      "watch/providers"?: TmdbProvidersBR;
    }
  >(`/tv/${id}`, { language: "pt-BR", append_to_response: "watch/providers" });
  return {
    ...resumir(
      "serie",
      d,
      d.genres.map((g) => nomeDoGenero("serie", g)),
    ),
    temporadas: d.number_of_seasons ?? null,
    anoFim: anoDe(d.last_air_date),
    terminou: d.status === "Ended" || d.status === "Canceled",
    generoIds: d.genres.map((g) => g.id),
    streamings: streamingsDe(d["watch/providers"]),
  };
});

/** "Quem gostou disto também gostou de…" do TMDB para um título (página 1). */
export async function recomendacoesDe(tipo: Tipo, id: number): Promise<Candidato[]> {
  const [dados, nomes] = await Promise.all([
    tmdbGet<TmdbPagina>(`/${CAMINHO[tipo]}/${id}/recommendations`, { language: "pt-BR", page: "1" }),
    nomesDosGeneros(tipo),
  ]);
  return dados.results.map((f) => ({
    titulo: resumir(tipo, f, nomesDosIds(f.genre_ids ?? [], nomes)),
    votos: f.vote_count,
  }));
}

/** Os streamings por assinatura no Brasil onde o título está. */
export async function streamingsDoTitulo(tipo: Tipo, id: number): Promise<Streaming[]> {
  return streamingsDe(await tmdbGet<TmdbProvidersBR>(`/${CAMINHO[tipo]}/${id}/watch/providers`));
}
