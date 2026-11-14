import { describe, expect, it } from "vitest";
import { lerFiltros, lerIdFilme, montarHref } from "./parametros";

describe("lerFiltros", () => {
  it("usa padrões quando a URL está vazia", () =>
    expect(lerFiltros({})).toEqual({ streaming: null, busca: null, nota: null, pagina: 1 }));
  it.each(["abc", "0", "-3", "2.5", ""])("pagina inválida %s vira 1", (p) =>
    expect(lerFiltros({ pagina: p }).pagina).toBe(1));
  it("pagina acima de 500 vira 500", () => expect(lerFiltros({ pagina: "9999" }).pagina).toBe(500));
  it("lê streaming numérico", () => expect(lerFiltros({ streaming: "8" }).streaming).toBe(8));
  it.each(["netflix", "-1", "8abc", "0"])("streaming inválido %s vira null", (s) =>
    expect(lerFiltros({ streaming: s }).streaming).toBeNull());
  it("tira espaços da busca", () => expect(lerFiltros({ busca: "  Duna " }).busca).toBe("Duna"));
  it("limita a busca a 100 caracteres", () =>
    expect(lerFiltros({ busca: "a".repeat(150) }).busca).toHaveLength(100));
  it("busca só com espaços vira null", () => expect(lerFiltros({ busca: "   " }).busca).toBeNull());
  it("usa o primeiro valor quando o parâmetro se repete", () =>
    expect(lerFiltros({ pagina: ["3", "7"] }).pagina).toBe(3));
  it.each(["6", "7", "8", "9"])("lê nota %s", (n) =>
    expect(lerFiltros({ nota: n }).nota).toBe(Number(n)));
  it.each(["5", "10", "8.5", "abc", "", "-8"])("nota inválida %s vira null", (n) =>
    expect(lerFiltros({ nota: n }).nota).toBeNull());
  it("nota repetida usa o primeiro valor", () =>
    expect(lerFiltros({ nota: ["7", "9"] }).nota).toBe(7));
});

describe("lerIdFilme", () => {
  it("aceita inteiro positivo", () => expect(lerIdFilme("27205")).toBe(27205));
  it.each(["abc", "0", "-5", "1.5", ""])("rejeita %s", (v) => expect(lerIdFilme(v)).toBeNull());
});

describe("montarHref", () => {
  const atual = { streaming: 8, busca: "duna", nota: null, pagina: 3 };
  it("trocar de streaming volta para a página 1 e mantém a busca", () =>
    expect(montarHref(atual, { streaming: 337 })).toBe("/?streaming=337&busca=duna"));
  it("nova busca volta para a página 1 e mantém o streaming", () =>
    expect(montarHref(atual, { busca: "batman" })).toBe("/?streaming=8&busca=batman"));
  it("mudar a página mantém o resto", () =>
    expect(montarHref(atual, { pagina: 4 })).toBe("/?streaming=8&busca=duna&pagina=4"));
  it("'Todos' remove o streaming e volta para a página 1", () =>
    expect(montarHref(atual, { streaming: null })).toBe("/?busca=duna"));
  it("omite os valores padrão", () =>
    expect(montarHref({ streaming: null, busca: null, nota: null, pagina: 1 }, {})).toBe("/"));
  it("codifica a busca", () =>
    expect(montarHref({ streaming: null, busca: null, nota: null, pagina: 1 }, { busca: "Tom & Jerry" }))
      .toBe("/?busca=Tom+%26+Jerry"));
  it("escolher uma nota volta para a página 1 e mantém o resto", () =>
    expect(montarHref(atual, { nota: 8 })).toBe("/?streaming=8&busca=duna&nota=8"));
  it("'Qualquer' remove a nota", () =>
    expect(montarHref({ ...atual, nota: 8 }, { nota: null })).toBe("/?streaming=8&busca=duna"));
  it("mudar a página mantém a nota", () =>
    expect(montarHref({ ...atual, nota: 7 }, { pagina: 4 })).toBe("/?streaming=8&busca=duna&nota=7&pagina=4"));
});
