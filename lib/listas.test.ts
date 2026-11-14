import { describe, expect, it } from "vitest";
import {
  LISTAS,
  NOME_DA_SITUACAO,
  SITUACAO_DA_LISTA,
  SITUACOES,
  chaveDoTitulo,
  hrefDoTitulo,
  linhaParaFilme,
  mensagemListaVazia,
  proximaSituacao,
} from "./listas";

describe("proximaSituacao", () => {
  it("sem marcação, marca a clicada", () => expect(proximaSituacao(null, "quero_assistir")).toBe("quero_assistir"));
  it("clicar na mesma desmarca", () => expect(proximaSituacao("ja_assisti", "ja_assisti")).toBeNull());
  it("clicar na outra troca de lista", () => expect(proximaSituacao("quero_assistir", "ja_assisti")).toBe("ja_assisti"));
  it("Assistindo tira de Quero assistir", () => expect(proximaSituacao("quero_assistir", "assistindo")).toBe("assistindo"));
  it("clicar em Assistindo aceso desmarca", () => expect(proximaSituacao("assistindo", "assistindo")).toBeNull());
});

describe("linhaParaFilme", () => {
  const linha = { tipo: "filme" as const, filme_id: 27205, titulo: "A Origem", poster_url: "https://image.tmdb.org/t/p/w342/x.jpg", ano: "2010", nota: "8.4" };
  it("converte a linha para o formato do cartão", () =>
    expect(linhaParaFilme(linha)).toEqual({
      tipo: "filme",
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
  it("mantém o tipo série", () => expect(linhaParaFilme({ ...linha, tipo: "serie" }).tipo).toBe("serie"));
});

describe("mensagemListaVazia", () => {
  it("quero assistir", () => expect(mensagemListaVazia("quero-assistir")).toContain("como quero assistir"));
  it("já assisti", () => expect(mensagemListaVazia("ja-assisti")).toContain("como já assisti"));
  it("fala em título, não em filme", () =>
    expect(mensagemListaVazia("assistindo")).toBe(
      "Você ainda não marcou nenhum título como assistindo. Abra um filme no catálogo para marcar.",
    ));
});

it("cada lista da URL corresponde a uma situação, na ordem da tela", () =>
  expect(LISTAS.map((l) => SITUACAO_DA_LISTA[l])).toEqual(["quero_assistir", "assistindo", "ja_assisti"]));
it("SITUACOES segue a mesma ordem", () => expect(SITUACOES).toEqual(["quero_assistir", "assistindo", "ja_assisti"]));
it("nome da lista Assistindo", () => expect(NOME_DA_SITUACAO.assistindo).toBe("Assistindo"));

describe("hrefDoTitulo", () => {
  it("filme vai para /filme", () => expect(hrefDoTitulo({ tipo: "filme", id: 1399 })).toBe("/filme/1399"));
  it("série vai para /serie", () => expect(hrefDoTitulo({ tipo: "serie", id: 1399 })).toBe("/serie/1399"));
});

describe("chaveDoTitulo", () => {
  it("filme e série de mesmo id têm chaves diferentes", () =>
    expect(new Set([chaveDoTitulo({ tipo: "filme", id: 1399 }), chaveDoTitulo({ tipo: "serie", id: 1399 })]).size).toBe(2));
  it("formato tipo-id", () => expect(chaveDoTitulo({ tipo: "serie", id: 1399 })).toBe("serie-1399"));
});
