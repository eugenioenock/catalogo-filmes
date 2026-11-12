import { describe, expect, it } from "vitest";
import { lerFiltros, lerIdFilme, montarHref } from "./parametros";

describe("lerFiltros", () => {
  it("usa padrões quando a URL está vazia", () =>
    expect(lerFiltros({})).toEqual({ streaming: null, busca: null, pagina: 1 }));
  it.each(["abc", "0", "-3", "2.5", ""])("pagina inválida %s vira 1", (p) =>
    expect(lerFiltros({ pagina: p }).pagina).toBe(1));
  it("pagina acima de 500 vira 500", () => expect(lerFiltros({ pagina: "9999" }).pagina).toBe(500));
  it("lê streaming numérico", () => expect(lerFiltros({ streaming: "8" }).streaming).toBe(8));
  it.each(["netflix", "-1", "8abc", "0"])("streaming inválido %s vira null", (s) =>
    expect(lerFiltros({ streaming: s }).streaming).toBeNull());
  it("tira espaços da busca", () => expect(lerFiltros({ busca: "  Duna " }).busca).toBe("Duna"));
  it("busca só com espaços vira null", () => expect(lerFiltros({ busca: "   " }).busca).toBeNull());
  it("usa o primeiro valor quando o parâmetro se repete", () =>
    expect(lerFiltros({ pagina: ["3", "7"] }).pagina).toBe(3));
});

describe("lerIdFilme", () => {
  it("aceita inteiro positivo", () => expect(lerIdFilme("27205")).toBe(27205));
  it.each(["abc", "0", "-5", "1.5", ""])("rejeita %s", (v) => expect(lerIdFilme(v)).toBeNull());
});

describe("montarHref", () => {
  const atual = { streaming: 8, busca: "duna", pagina: 3 };
  it("trocar de streaming volta para a página 1 e mantém a busca", () =>
    expect(montarHref(atual, { streaming: 337 })).toBe("/?streaming=337&busca=duna"));
  it("nova busca volta para a página 1 e mantém o streaming", () =>
    expect(montarHref(atual, { busca: "batman" })).toBe("/?streaming=8&busca=batman"));
  it("mudar a página mantém o resto", () =>
    expect(montarHref(atual, { pagina: 4 })).toBe("/?streaming=8&busca=duna&pagina=4"));
  it("'Todos' remove o streaming e volta para a página 1", () =>
    expect(montarHref(atual, { streaming: null })).toBe("/?busca=duna"));
  it("omite os valores padrão", () =>
    expect(montarHref({ streaming: null, busca: null, pagina: 1 }, {})).toBe("/"));
  it("codifica a busca", () =>
    expect(montarHref({ streaming: null, busca: null, pagina: 1 }, { busca: "Tom & Jerry" }))
      .toBe("/?busca=Tom+%26+Jerry"));
});
