import { describe, expect, it } from "vitest";
import { anoDe, formatarDataBR, formatarDuracao, formatarNota, mensagemSemFilmes, textoTemporadas, titulosDoCatalogo } from "./formatar";

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
  const nada = { tipo: "filme" as const, busca: false, nota: false, streaming: false };
  it("busca com nota fala em título e não diz que está fora do streaming", () =>
    expect(mensagemSemFilmes({ ...nada, busca: true, nota: true })).toBe(
      "Nenhum título com esse nome e essa nota está no streaming agora.",
    ));
  it("busca sem nota fala em título", () =>
    expect(mensagemSemFilmes({ ...nada, busca: true })).toBe("Nenhum título com esse nome está no streaming agora."));
  it("busca fala em título mesmo em séries", () =>
    expect(mensagemSemFilmes({ ...nada, tipo: "serie", busca: true })).toBe(
      "Nenhum título com esse nome está no streaming agora.",
    ));
  it("nota com streaming escolhido", () => {
    expect(mensagemSemFilmes({ ...nada, nota: true, streaming: true })).toBe("Nenhum filme com essa nota neste streaming.");
    expect(mensagemSemFilmes({ ...nada, tipo: "serie", nota: true, streaming: true })).toBe(
      "Nenhuma série com essa nota neste streaming.",
    );
  });
  it("nota sem streaming escolhido fala dos streamings em geral", () => {
    expect(mensagemSemFilmes({ ...nada, nota: true })).toBe("Nenhum filme com essa nota nos streamings.");
    expect(mensagemSemFilmes({ ...nada, tipo: "serie", nota: true })).toBe("Nenhuma série com essa nota nos streamings.");
  });
  it("sem busca nem nota não culpa a nota", () => {
    expect(mensagemSemFilmes({ ...nada, streaming: true })).toBe("Nenhum filme encontrado.");
    expect(mensagemSemFilmes({ ...nada, tipo: "serie", streaming: true })).toBe("Nenhuma série encontrada.");
  });
});

describe("textoTemporadas", () => {
  it("série terminada", () =>
    expect(textoTemporadas({ temporadas: 3, ano: "2019", anoFim: "2023", terminou: true })).toBe("3 temporadas · 2019–2023"));
  it("série no ar, uma temporada", () =>
    expect(textoTemporadas({ temporadas: 1, ano: "2024", anoFim: "2024", terminou: false })).toBe("1 temporada · 2024–"));
  it("terminou no mesmo ano: um ano só", () =>
    expect(textoTemporadas({ temporadas: 1, ano: "2020", anoFim: "2020", terminou: true })).toBe("1 temporada · 2020"));
  it("temporadas desconhecidas: só os anos", () =>
    expect(textoTemporadas({ temporadas: null, ano: "2019", anoFim: "2021", terminou: true })).toBe("2019–2021"));
  it("nada conhecido vira null", () =>
    expect(textoTemporadas({ temporadas: 0, ano: null, anoFim: null, terminou: false })).toBeNull());
  it("sem anos: só as temporadas", () =>
    expect(textoTemporadas({ temporadas: 2, ano: null, anoFim: null, terminou: false })).toBe("2 temporadas"));
});

describe("titulosDoCatalogo", () => {
  it("filmes na vitrine", () =>
    expect(titulosDoCatalogo("filme", { busca: null, vitrine: true })).toEqual({
      grade: "Mais filmes nos streamings",
      emAlta: "Em alta agora",
    }));
  it("séries na vitrine", () =>
    expect(titulosDoCatalogo("serie", { busca: null, vitrine: true })).toEqual({
      grade: "Mais séries nos streamings",
      emAlta: "Séries em alta agora",
    }));
  it("fora da vitrine", () => {
    expect(titulosDoCatalogo("serie", { busca: null, vitrine: false }).grade).toBe("Séries nos streamings");
    expect(titulosDoCatalogo("filme", { busca: null, vitrine: false }).grade).toBe("Filmes nos streamings");
  });
  it("busca", () => expect(titulosDoCatalogo("serie", { busca: "dark", vitrine: false }).grade).toBe("Resultados para “dark”"));
});

describe("formatarDataBR", () => {
  // Montada a partir do texto: new Date("2026-11-14") é meia-noite UTC, que no Brasil ainda é dia 13.
  it("2026-11-14 vira 14/11/2026", () => expect(formatarDataBR("2026-11-14")).toBe("14/11/2026"));
});
