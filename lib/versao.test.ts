import { describe, expect, it } from "vitest";
import { classificarCommits, proximaVersao } from "./versao";

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
