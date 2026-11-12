import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  FilmeNaoEncontradoError,
  TmdbIndisponivelError,
  imagemUrl,
  listarStreamings,
  tmdbGet,
} from "./tmdb";

const fetchMock = vi.fn();

function responder(json: unknown, status = 200) {
  return new Response(JSON.stringify(json), { status });
}

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
          { provider_id: 2, provider_name: "B", logo_path: "/b.png", display_priorities: { BR: 3 } },
        ],
      }),
    );
    expect((await listarStreamings()).map((s) => s.id)).toEqual([2]);
  });
});
