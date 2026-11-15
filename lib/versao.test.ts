import { describe, expect, it } from "vitest";
import { classificarCommits, problemaAntesDeLancar, proximaVersao } from "./versao";

describe("classificarCommits", () => {
  it("feat vira novidade; fix e perf viram correção; o resto são bastidores", () => {
    expect(
      classificarCommits([
        "feat: fileira Para você",
        "fix: pôster quebrado",
        "perf: conexão cedo",
        "test: mais testes",
        "docs: checklist",
        "chore: versão 1.0.0",
      ]),
    ).toEqual({ novidades: ["Fileira Para você"], correcoes: ["Pôster quebrado", "Conexão cedo"] });
  });

  it("tira o prefixo inteiro, com escopo", () => {
    expect(classificarCommits(["feat(tmdb): listar séries"]).novidades).toEqual(["Listar séries"]);
  });

  it("assunto sem prefixo é ignorado", () => {
    expect(classificarCommits(["Merge branch x", "texto livre"])).toEqual({ novidades: [], correcoes: [] });
  });
});

describe("proximaVersao", () => {
  it("uma novidade sobe o número do meio e zera o último", () => {
    expect(proximaVersao("1.0.3", { novidades: ["a"], correcoes: [] })).toBe("1.1.0");
  });

  it("só correções sobem o último número", () => {
    expect(proximaVersao("1.1.0", { novidades: [], correcoes: ["b"] })).toBe("1.1.1");
  });

  it("sem novidades nem correções, não há versão nova", () => {
    expect(proximaVersao("1.1.1", { novidades: [], correcoes: [] })).toBeNull();
  });

  it("--maior sobe o primeiro número e zera os outros", () => {
    expect(proximaVersao("1.4.2", { novidades: [], correcoes: ["b"] }, true)).toBe("2.0.0");
  });
});

// Revisão final: um commit ou uma tag que falhou deixava a versão pela metade, e a rodada
// seguinte propunha o número errado e repetia os itens.
describe("problemaAntesDeLancar", () => {
  const ok = { versaoAtual: "1.0.0", ultimaTag: "v1.0.0", nova: "1.1.0", tags: ["v1.0.0"] };

  it("tudo em ordem: nenhum problema", () => {
    expect(problemaAntesDeLancar(ok)).toBeNull();
  });

  it("package.json à frente da última tag (versão pela metade): recusa", () => {
    expect(problemaAntesDeLancar({ ...ok, versaoAtual: "1.1.0", nova: "1.2.0" })).toContain("não bate com a última tag");
  });

  it("a tag da versão nova já existe: recusa", () => {
    expect(problemaAntesDeLancar({ ...ok, tags: ["v1.0.0", "v1.1.0"] })).toContain("v1.1.0 já existe");
  });
});
