import { describe, expect, it } from "vitest";
import { anoDe, formatarDuracao, formatarNota, mensagemSemFilmes } from "./formatar";

describe("formatarDuracao", () => {
  it("135 vira 2h 15min", () => expect(formatarDuracao(135)).toBe("2h 15min"));
  it("45 vira 45min", () => expect(formatarDuracao(45)).toBe("45min"));
  it("120 vira 2h", () => expect(formatarDuracao(120)).toBe("2h"));
  it("null e 0 viram null", () => {
    expect(formatarDuracao(null)).toBeNull();
    expect(formatarDuracao(0)).toBeNull();
  });
});

describe("formatarNota", () => {
  it("7.83 vira 7,8", () => expect(formatarNota(7.83)).toBe("7,8"));
  it("8 vira 8,0", () => expect(formatarNota(8)).toBe("8,0"));
});

describe("anoDe", () => {
  it("extrai o ano", () => expect(anoDe("2024-03-01")).toBe("2024"));
  it("vazio, null e undefined viram null", () => {
    expect(anoDe("")).toBeNull();
    expect(anoDe(null)).toBeNull();
    expect(anoDe(undefined)).toBeNull();
  });
});

describe("mensagemSemFilmes", () => {
  const nada = { busca: false, nota: false, streaming: false };
  it("busca com nota não diz que o filme está fora do streaming", () =>
    expect(mensagemSemFilmes({ ...nada, busca: true, nota: true })).toBe(
      "Nenhum filme com esse nome e essa nota está no streaming agora.",
    ));
  it("busca sem nota mantém a mensagem atual", () =>
    expect(mensagemSemFilmes({ ...nada, busca: true })).toBe(
      "Nenhum filme com esse nome está no streaming agora.",
    ));
  it("nota com streaming escolhido", () =>
    expect(mensagemSemFilmes({ ...nada, nota: true, streaming: true })).toBe(
      "Nenhum filme com essa nota neste streaming.",
    ));
  it("nota sem streaming escolhido fala dos streamings em geral", () =>
    expect(mensagemSemFilmes({ ...nada, nota: true })).toBe("Nenhum filme com essa nota nos streamings."));
  it("sem busca nem nota não culpa a nota", () =>
    expect(mensagemSemFilmes({ ...nada, streaming: true })).toBe("Nenhum filme encontrado."));
});
