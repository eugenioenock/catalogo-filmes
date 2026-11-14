import { describe, expect, it } from "vitest";
import { LISTAS, SITUACAO_DA_LISTA, linhaParaFilme, mensagemListaVazia, proximaSituacao } from "./listas";

describe("proximaSituacao", () => {
  it("sem marcação, marca a clicada", () => expect(proximaSituacao(null, "quero_assistir")).toBe("quero_assistir"));
  it("clicar na mesma desmarca", () => expect(proximaSituacao("ja_assisti", "ja_assisti")).toBeNull());
  it("clicar na outra troca de lista", () => expect(proximaSituacao("quero_assistir", "ja_assisti")).toBe("ja_assisti"));
});

describe("linhaParaFilme", () => {
  const linha = { filme_id: 27205, titulo: "A Origem", poster_url: "https://image.tmdb.org/t/p/w342/x.jpg", ano: "2010", nota: "8.4" };
  it("converte a linha para o formato do cartão", () =>
    expect(linhaParaFilme(linha)).toEqual({
      id: 27205,
      titulo: "A Origem",
      ano: "2010",
      posterUrl: "https://image.tmdb.org/t/p/w342/x.jpg",
      backdropUrl: null,
      sinopse: "",
      nota: 8.4,
      generos: [],
    }));
  it("aceita filme sem pôster, ano e nota", () => {
    const f = linhaParaFilme({ ...linha, poster_url: null, ano: null, nota: null });
    expect([f.posterUrl, f.ano, f.nota]).toEqual([null, null, 0]);
  });
});

describe("mensagemListaVazia", () => {
  it("quero assistir", () => expect(mensagemListaVazia("quero-assistir")).toContain("como quero assistir"));
  it("já assisti", () => expect(mensagemListaVazia("ja-assisti")).toContain("como já assisti"));
});

it("cada lista da URL corresponde a uma situação", () =>
  expect(LISTAS.map((l) => SITUACAO_DA_LISTA[l])).toEqual(["quero_assistir", "ja_assisti"]));
