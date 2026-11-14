import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  FilmeNaoEncontradoError,
  TmdbIndisponivelError,
  buscarFilmes,
  detalharFilme,
  imagemUrl,
  listarFilmes,
  listarStreamings,
  tmdbGet,
} from "./tmdb";

const fetchMock = vi.fn();

function responder(json: unknown, status = 200) {
  return new Response(JSON.stringify(json), { status });
}

function urlChamada(trecho: string): string {
  const chamada = fetchMock.mock.calls.find(([url]) => String(url).includes(trecho));
  if (!chamada) throw new Error(`Nenhuma chamada contendo ${trecho}`);
  return String(chamada[0]);
}

// Roteia o fetch por trecho da URL (a primeira regra que combina vence).
function rotear(rotas: Record<string, unknown | Response>) {
  fetchMock.mockImplementation(async (url: unknown) => {
    const alvo = String(url);
    for (const [trecho, corpo] of Object.entries(rotas)) {
      if (alvo.includes(trecho)) return corpo instanceof Response ? corpo : responder(corpo);
    }
    throw new Error(`Sem rota para ${alvo}`);
  });
}

function filme(id: number, extra: Record<string, unknown> = {}) {
  return {
    id,
    title: `Filme ${id}`,
    release_date: "2024-05-01",
    poster_path: `/p${id}.jpg`,
    backdrop_path: `/b${id}.jpg`,
    overview: `Sinopse ${id}`,
    vote_average: 7.5,
    vote_count: 500,
    genre_ids: [28],
    ...extra,
  };
}

const generos = { genres: [{ id: 28, name: "Ação" }] };
const provider = (id: number, nome = "S", logo = "/l.png") => ({
  provider_id: id,
  provider_name: nome,
  logo_path: logo,
});

describe("tmdb", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("TMDB_TOKEN", "tok");
  });

  it("sem TMDB_TOKEN dá a mensagem para o desenvolvedor", async () => {
    vi.stubEnv("TMDB_TOKEN", "");
    await expect(tmdbGet("/x")).rejects.toThrow(
      "Defina TMDB_TOKEN no .env.local (local) ou nas variáveis de ambiente da Vercel.",
    );
  });
  it("manda o token, usa https://api.themoviedb.org/3 e cache de 1 hora", async () => {
    fetchMock.mockResolvedValue(responder({}));
    await tmdbGet("/movie/1", { language: "pt-BR" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://api.themoviedb.org/3/movie/1?language=pt-BR");
    expect(init.headers.Authorization).toBe("Bearer tok");
    expect(init.next).toEqual({ revalidate: 3600 });
  });
  it("404 vira FilmeNaoEncontradoError", async () => {
    fetchMock.mockResolvedValue(responder({}, 404));
    await expect(tmdbGet("/movie/1")).rejects.toBeInstanceOf(FilmeNaoEncontradoError);
  });
  it.each([500, 401, 429])("status %i vira TmdbIndisponivelError", async (s) => {
    fetchMock.mockResolvedValue(responder({}, s));
    await expect(tmdbGet("/x")).rejects.toBeInstanceOf(TmdbIndisponivelError);
  });
  it("falha de rede vira TmdbIndisponivelError", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    await expect(tmdbGet("/x")).rejects.toBeInstanceOf(TmdbIndisponivelError);
  });
  it("imagemUrl monta a URL e aceita caminho nulo", () => {
    expect(imagemUrl("/a.jpg", "w342")).toBe("https://image.tmdb.org/t/p/w342/a.jpg");
    expect(imagemUrl(null, "w342")).toBeNull();
  });
  it("listarStreamings pede BR/pt-BR e devolve os 10 primeiros por display_priorities.BR", async () => {
    const results = Array.from({ length: 15 }, (_, i) => ({
      provider_id: i + 1,
      provider_name: `S${i + 1}`,
      logo_path: `/l${i + 1}.png`,
      display_priorities: { BR: 15 - i },
    }));
    fetchMock.mockResolvedValue(responder({ results }));
    const lista = await listarStreamings();
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      "/watch/providers/movie?watch_region=BR&language=pt-BR",
    );
    expect(lista).toHaveLength(10);
    expect(lista[0]).toEqual({ id: 15, nome: "S15", logoUrl: "https://image.tmdb.org/t/p/w92/l15.png" });
  });
  it("listarStreamings ignora serviços sem prioridade para o Brasil", async () => {
    fetchMock.mockResolvedValue(
      responder({
        results: [
          { provider_id: 1, provider_name: "A", logo_path: "/a.png", display_priorities: { US: 1 } },
          { provider_id: 20, provider_name: "B", logo_path: "/b.png", display_priorities: { BR: 3 } },
        ],
      }),
    );
    expect((await listarStreamings()).map((s) => s.id)).toEqual([20]);
  });
  it("listarStreamings exclui lojas/gratuitos e serviços sem logo, e completa os 10", async () => {
    const results = Array.from({ length: 14 }, (_, i) => ({
      provider_id: i + 100,
      provider_name: `S${i + 100}`,
      logo_path: `/l${i}.png`,
      display_priorities: { BR: i + 3 },
    }));
    results.push({ provider_id: 2, provider_name: "Apple TV Store", logo_path: "/a.png", display_priorities: { BR: 1 } });
    results.push({ provider_id: 2791, provider_name: "JustWatch TV", logo_path: "/j.png", display_priorities: { BR: 2 } });
    results.push({ provider_id: 555, provider_name: "SemLogo", logo_path: null as unknown as string, display_priorities: { BR: 0 } });
    fetchMock.mockResolvedValue(responder({ results }));
    const lista = await listarStreamings();
    const ids = lista.map((s) => s.id);
    expect(lista).toHaveLength(10);
    expect(ids).not.toContain(2);
    expect(ids).not.toContain(2791);
    expect(ids).not.toContain(555);
    expect(ids[0]).toBe(100);
  });
  it("timeout vira TmdbIndisponivelError e o fetch recebe um AbortSignal", async () => {
    fetchMock.mockRejectedValue(new DOMException("timeout", "TimeoutError"));
    await expect(tmdbGet("/x")).rejects.toBeInstanceOf(TmdbIndisponivelError);
    expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });
  it("200 com corpo que não é JSON vira TmdbIndisponivelError", async () => {
    fetchMock.mockResolvedValue(new Response("<html>oops</html>", { status: 200 }));
    await expect(tmdbGet("/x")).rejects.toBeInstanceOf(TmdbIndisponivelError);
  });

  it("listarFilmes chama discover com BR, flatrate, pt-BR, popularidade e página", async () => {
    rotear({
      "/genre/movie/list": generos,
      "/discover/movie": { page: 2, total_pages: 3, results: [filme(1)] },
    });
    const r = await listarFilmes({ streaming: null, nota: null, pagina: 2 });
    const url = new URL(urlChamada("/discover/movie"));
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      watch_region: "BR",
      with_watch_monetization_types: "flatrate",
      language: "pt-BR",
      sort_by: "popularity.desc",
      page: "2",
    });
    expect(url.searchParams.has("with_watch_providers")).toBe(false);
    expect(r).toMatchObject({ pagina: 2, totalPaginas: 3 });
    expect(r.filmes[0]).toMatchObject({
      tipo: "filme",
      id: 1,
      ano: "2024",
      generos: ["Ação"],
      posterUrl: "https://image.tmdb.org/t/p/w342/p1.jpg",
      backdropUrl: "https://image.tmdb.org/t/p/w1280/b1.jpg",
    });
  });
  it("listarFilmes descarta ids de gênero desconhecidos", async () => {
    rotear({
      "/genre/movie/list": generos,
      "/discover/movie": { page: 1, total_pages: 1, results: [filme(1, { genre_ids: [28, 999] })] },
    });
    expect((await listarFilmes({ streaming: null, nota: null, pagina: 1 })).filmes[0].generos).toEqual(["Ação"]);
  });
  it("listarFilmes com streaming envia with_watch_providers", async () => {
    rotear({
      "/genre/movie/list": generos,
      "/discover/movie": { page: 1, total_pages: 1, results: [] },
    });
    await listarFilmes({ streaming: 8, nota: null, pagina: 1 });
    expect(new URL(urlChamada("/discover/movie")).searchParams.get("with_watch_providers")).toBe("8");
  });
  it("listarFilmes sem nota não envia vote_average.gte nem vote_count.gte", async () => {
    rotear({ "/genre/movie/list": generos, "/discover/movie": { page: 1, total_pages: 1, results: [] } });
    await listarFilmes({ streaming: null, nota: null, pagina: 1 });
    const p = new URL(urlChamada("/discover/movie")).searchParams;
    expect(p.has("vote_average.gte")).toBe(false);
    expect(p.has("vote_count.gte")).toBe(false);
  });
  it("listarFilmes com nota 8 envia vote_average.gte=8 e vote_count.gte=200", async () => {
    rotear({ "/genre/movie/list": generos, "/discover/movie": { page: 1, total_pages: 1, results: [] } });
    await listarFilmes({ streaming: 8, nota: 8, pagina: 1 });
    const p = new URL(urlChamada("/discover/movie")).searchParams;
    expect(p.get("vote_average.gte")).toBe("8");
    expect(p.get("vote_count.gte")).toBe("200");
    expect(p.get("with_watch_providers")).toBe("8");
  });
  it("totalPaginas é limitado a 500", async () => {
    rotear({
      "/genre/movie/list": generos,
      "/discover/movie": { page: 1, total_pages: 38000, results: [filme(1)] },
    });
    expect((await listarFilmes({ streaming: null, nota: null, pagina: 1 })).totalPaginas).toBe(500);
  });
  it("filme sem pôster, backdrop, sinopse e data vira null/vazio", async () => {
    rotear({
      "/genre/movie/list": generos,
      "/discover/movie": {
        page: 1,
        total_pages: 1,
        results: [filme(1, { poster_path: null, backdrop_path: null, overview: "", release_date: "" })],
      },
    });
    expect((await listarFilmes({ streaming: null, nota: null, pagina: 1 })).filmes[0]).toMatchObject({
      posterUrl: null,
      backdropUrl: null,
      sinopse: "",
      ano: null,
    });
  });

  describe("buscarFilmes", () => {
    function rotasDeBusca(provedorDoFilme2: unknown) {
      rotear({
        "/genre/movie/list": generos,
        "/search/movie": { page: 1, total_pages: 1, results: [filme(1), filme(2), filme(3)] },
        "/movie/1/watch/providers": { results: { BR: { flatrate: [provider(8, "Netflix")] } } },
        "/movie/2/watch/providers": { results: { BR: provedorDoFilme2 } },
        "/movie/3/watch/providers": { results: {} },
      });
    }

    it("codifica o texto e mantém só quem tem flatrate no BR", async () => {
      rotasDeBusca({ rent: [provider(2)] });
      const r = await buscarFilmes({ texto: "Tom & Jerry", streaming: null, nota: null, pagina: 1 });
      expect(urlChamada("/search/movie")).toContain("query=Tom+%26+Jerry");
      expect(new URL(urlChamada("/search/movie")).searchParams.get("query")).toBe("Tom & Jerry");
      expect(r.filmes.map((f) => f.id)).toEqual([1]);
    });
    it("com streaming mantém só quem está naquele serviço", async () => {
      rotasDeBusca({ flatrate: [provider(337)] });
      const r = await buscarFilmes({ texto: "x", streaming: 337, nota: null, pagina: 1 });
      expect(r.filmes.map((f) => f.id)).toEqual([2]);
    });
    it("com nota mantém nota >= 8 com pelo menos 200 votos e não consulta os demais", async () => {
      rotear({
        "/genre/movie/list": generos,
        "/search/movie": {
          page: 1,
          total_pages: 1,
          results: [
            filme(1, { vote_average: 8.0, vote_count: 200 }),
            filme(2, { vote_average: 7.9, vote_count: 5000 }),
            filme(3, { vote_average: 9.5, vote_count: 12 }),
          ],
        },
        "/watch/providers": { results: { BR: { flatrate: [provider(8)] } } },
      });
      const r = await buscarFilmes({ texto: "x", streaming: null, nota: 8, pagina: 1 });
      expect(r.filmes.map((f) => f.id)).toEqual([1]);
      const consultados = fetchMock.mock.calls
        .map(([u]) => String(u))
        .filter((u) => u.includes("/watch/providers"));
      expect(consultados).toHaveLength(1);
      expect(consultados[0]).toContain("/movie/1/watch/providers");
    });
    it("uma consulta de disponibilidade que falha não derruba a busca", async () => {
      rotear({
        "/genre/movie/list": generos,
        "/search/movie": { page: 1, total_pages: 1, results: [filme(1), filme(2), filme(3)] },
        "/movie/1/watch/providers": { results: { BR: { flatrate: [provider(8)] } } },
        "/movie/2/watch/providers": responder({}, 500),
        "/movie/3/watch/providers": { results: { BR: { flatrate: [provider(9)] } } },
      });
      const r = await buscarFilmes({ texto: "x", streaming: null, nota: null, pagina: 1 });
      expect(r.filmes.map((f) => f.id)).toEqual([1, 3]);
    });
  });

  it("detalharFilme pede append_to_response=watch/providers e monta o detalhe", async () => {
    rotear({
      "/movie/10?": {
        ...filme(10, { title: "T" }),
        runtime: 135,
        genres: [{ id: 28, name: "Ação" }],
        "watch/providers": { results: { BR: { flatrate: [provider(8, "Netflix", "/n.png")] } } },
      },
    });
    const d = await detalharFilme(10);
    expect(new URL(urlChamada("/movie/10")).searchParams.get("append_to_response")).toBe(
      "watch/providers",
    );
    expect(fetchMock.mock.calls.some(([u]) => String(u).includes("/genre/movie/list"))).toBe(false);
    expect(d).toMatchObject({
      tipo: "filme",
      id: 10,
      titulo: "T",
      duracaoMin: 135,
      generos: ["Ação"],
      streamings: [{ id: 8, nome: "Netflix", logoUrl: "https://image.tmdb.org/t/p/w92/n.png" }],
    });
  });
  it("detalharFilme sem dados do BR devolve streamings vazio e duração null", async () => {
    rotear({
      "/movie/11?": {
        ...filme(11),
        runtime: 0,
        genres: [],
        "watch/providers": { results: { US: { flatrate: [provider(8)] } } },
      },
    });
    expect(await detalharFilme(11)).toMatchObject({ streamings: [], duracaoMin: null });
  });
  it("detalharFilme repassa 404 como FilmeNaoEncontradoError", async () => {
    rotear({ "/movie/999?": responder({}, 404) });
    await expect(detalharFilme(999)).rejects.toBeInstanceOf(FilmeNaoEncontradoError);
  });
});
