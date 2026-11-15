import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Situacao, Tipo } from "./listas";
import type { Candidato, Marca } from "./recomendacoes";
import type { FilmeResumo, Streaming } from "./tmdb";

vi.mock("server-only", () => ({}));

// vi.hoisted: o vi.mock sobe para o topo do arquivo, então os falsos precisam existir antes dele.
const falsos = vi.hoisted(() => ({
  listarTodasMarcacoes: vi.fn(),
  recomendacoesDe: vi.fn(),
  streamingsDoTitulo: vi.fn(),
  listarTitulos: vi.fn(),
  detalharFilme: vi.fn(),
  detalharSerie: vi.fn(),
  nomesDosGeneros: vi.fn(),
  contarMarcacoes: vi.fn(),
  usuarioAtual: vi.fn(),
}));
vi.mock("./marcacoes", () => ({
  listarTodasMarcacoes: falsos.listarTodasMarcacoes,
  contarMarcacoes: falsos.contarMarcacoes,
}));
vi.mock("./usuario", () => ({ usuarioAtual: falsos.usuarioAtual }));
vi.mock("./tmdb", () => ({
  recomendacoesDe: falsos.recomendacoesDe,
  streamingsDoTitulo: falsos.streamingsDoTitulo,
  listarTitulos: falsos.listarTitulos,
  detalharFilme: falsos.detalharFilme,
  detalharSerie: falsos.detalharSerie,
  nomesDosGeneros: falsos.nomesDosGeneros,
}));

import { fileiraPodeAparecer, montarParaVoce } from "./paraVoce";

const NETFLIX: Streaming = { id: 8, nome: "Netflix", logoUrl: "n.png" };
const PRIME: Streaming = { id: 119, nome: "Prime Video", logoUrl: "p.png" };
const GLOBOPLAY: Streaming = { id: 307, nome: "Globoplay", logoUrl: "g.png" };

function resumo(id: number, tipo: Tipo = "filme", generos: string[] = []): FilmeResumo {
  return { tipo, id, titulo: `T${id}`, ano: null, posterUrl: null, backdropUrl: null, sinopse: "", nota: 7.5, generos };
}
const c = (id: number, tipo: Tipo = "filme"): Candidato => ({ titulo: resumo(id, tipo), votos: 800 });
const marca = (tipo: Tipo, id: number, situacao: Situacao, titulo = `M${id}`): Marca => ({ tipo, id, situacao, titulo });
const sem = { streaming: null, nota: null };

describe("montarParaVoce", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    falsos.listarTodasMarcacoes.mockResolvedValue([]);
    falsos.recomendacoesDe.mockResolvedValue([]);
    falsos.streamingsDoTitulo.mockResolvedValue([NETFLIX]);
    falsos.listarTitulos.mockResolvedValue({ filmes: [], pagina: 1, totalPaginas: 1 });
    falsos.detalharFilme.mockResolvedValue({ generoIds: [] });
    falsos.detalharSerie.mockResolvedValue({ generoIds: [] });
    falsos.nomesDosGeneros.mockResolvedValue(new Map());
  });

  it("sem marcações, devolve vazio e não chama o TMDB", async () => {
    expect(await montarParaVoce({ tipo: "serie", ...sem })).toEqual([]);
    expect(falsos.recomendacoesDe).not.toHaveBeenCalled();
    expect(falsos.listarTitulos).not.toHaveBeenCalled();
  });

  it("recomenda a partir das sementes, com motivo e logo", async () => {
    falsos.listarTodasMarcacoes.mockResolvedValue([marca("serie", 1399, "assistindo", "Game of Thrones")]);
    falsos.recomendacoesDe.mockResolvedValue([c(10, "serie"), c(11, "serie")]);
    const r = await montarParaVoce({ tipo: "serie", ...sem });
    expect(falsos.recomendacoesDe).toHaveBeenCalledWith("serie", 1399);
    expect(r).toEqual([
      { titulo: resumo(10, "serie"), streaming: NETFLIX, motivo: "Porque você está assistindo Game of Thrones" },
      { titulo: resumo(11, "serie"), streaming: NETFLIX, motivo: "Porque você está assistindo Game of Thrones" },
    ]);
  });

  it("tira quem não está em streaming", async () => {
    falsos.listarTodasMarcacoes.mockResolvedValue([marca("serie", 1399, "assistindo")]);
    falsos.recomendacoesDe.mockResolvedValue([c(10, "serie"), c(11, "serie")]);
    falsos.streamingsDoTitulo.mockImplementation(async (_tipo: Tipo, id: number) => (id === 11 ? [] : [NETFLIX]));
    expect((await montarParaVoce({ tipo: "serie", ...sem })).map((x) => x.titulo.id)).toEqual([10]);
  });

  it("com filtro de streaming, só quem está nele, e o logo é o dele", async () => {
    falsos.listarTodasMarcacoes.mockResolvedValue([marca("serie", 1399, "assistindo")]);
    falsos.recomendacoesDe.mockResolvedValue([c(10, "serie"), c(11, "serie")]);
    falsos.streamingsDoTitulo.mockImplementation(async (_tipo: Tipo, id: number) =>
      id === 10 ? [NETFLIX, GLOBOPLAY] : [NETFLIX],
    );
    const r = await montarParaVoce({ tipo: "serie", streaming: 307, nota: null });
    expect(r.map((x) => [x.titulo.id, x.streaming.id])).toEqual([[10, 307]]);
  });

  it("uma semente que falha não derruba as outras", async () => {
    falsos.listarTodasMarcacoes.mockResolvedValue([
      marca("serie", 27205, "quero_assistir", "Série de teste"),
      marca("serie", 1399, "assistindo", "Game of Thrones"),
    ]);
    falsos.recomendacoesDe.mockImplementation(async (_tipo: Tipo, id: number) => {
      if (id === 27205) throw new Error("404");
      return [c(10, "serie")];
    });
    const r = await montarParaVoce({ tipo: "serie", ...sem });
    expect(r.map((x) => [x.titulo.id, x.motivo])).toEqual([[10, "Porque você está assistindo Game of Thrones"]]);
  });

  it("uma checagem de streaming que falha só tira aquele título", async () => {
    falsos.listarTodasMarcacoes.mockResolvedValue([marca("serie", 1399, "assistindo")]);
    falsos.recomendacoesDe.mockResolvedValue([c(10, "serie"), c(11, "serie")]);
    falsos.streamingsDoTitulo.mockImplementation(async (_tipo: Tipo, id: number) => {
      if (id === 10) throw new Error("timeout");
      return [PRIME];
    });
    expect((await montarParaVoce({ tipo: "serie", ...sem })).map((x) => x.titulo.id)).toEqual([11]);
  });

  it("poucos cartões chamam a reserva por gênero, sem repetir nem trazer marcados", async () => {
    falsos.listarTodasMarcacoes.mockResolvedValue([
      marca("filme", 27205, "ja_assisti", "A Origem"),
      marca("serie", 1399, "assistindo", "Game of Thrones"),
    ]);
    falsos.recomendacoesDe.mockResolvedValue([c(10)]);
    falsos.detalharFilme.mockResolvedValue({ generoIds: [878] });
    falsos.detalharSerie.mockResolvedValue({ generoIds: [10765, 18] });
    falsos.nomesDosGeneros.mockResolvedValue(
      new Map([
        [878, "Ficção científica"],
        [18, "Drama"],
      ]),
    );
    falsos.listarTitulos.mockResolvedValue({
      filmes: [resumo(10, "filme", ["Ação"]), resumo(27205, "filme", ["Ação"]), resumo(52, "filme", ["Drama"])],
      pagina: 1,
      totalPaginas: 1,
    });
    const r = await montarParaVoce({ tipo: "filme", ...sem });
    // 878: 2 (A Origem, Já assisti) + 2 (GoT 10765 → 878, Assistindo) = 4; 18: 2.
    expect(falsos.listarTitulos).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: "filme", generos: [878, 18], streaming: null, nota: null, pagina: 1 }),
    );
    expect(r.map((x) => [x.titulo.id, x.motivo])).toEqual([
      [10, "Porque você assistiu A Origem"],
      [52, "Porque você gosta de Drama"],
    ]);
  });

  it("sem sementes do tipo, tudo vem da reserva, com o gênero do perfil que o título tem", async () => {
    falsos.listarTodasMarcacoes.mockResolvedValue([marca("serie", 1399, "assistindo", "Game of Thrones")]);
    falsos.detalharSerie.mockResolvedValue({ generoIds: [10765, 18] });
    falsos.nomesDosGeneros.mockResolvedValue(
      new Map([
        [878, "Ficção científica"],
        [18, "Drama"],
      ]),
    );
    falsos.listarTitulos.mockResolvedValue({
      filmes: [resumo(50, "filme", ["Drama"]), resumo(51, "filme", ["Ficção científica", "Drama"]), resumo(53, "filme", [])],
      pagina: 1,
      totalPaginas: 1,
    });
    const r = await montarParaVoce({ tipo: "filme", ...sem });
    expect(falsos.recomendacoesDe).not.toHaveBeenCalled();
    expect(r.map((x) => [x.titulo.id, x.motivo])).toEqual([
      [50, "Porque você gosta de Drama"],
      [51, "Porque você gosta de Ficção científica"],
      [53, "Porque você gosta de Ficção científica"],
    ]);
  });

  it("se a reserva falha, os cartões das sementes continuam", async () => {
    const erro = vi.spyOn(console, "error").mockImplementation(() => {});
    falsos.listarTodasMarcacoes.mockResolvedValue([marca("filme", 27205, "ja_assisti", "A Origem")]);
    falsos.recomendacoesDe.mockResolvedValue([c(10)]);
    falsos.detalharFilme.mockResolvedValue({ generoIds: [878] });
    falsos.listarTitulos.mockRejectedValue(new Error("TMDB fora do ar"));
    const r = await montarParaVoce({ tipo: "filme", ...sem });
    expect(r.map((x) => x.titulo.id)).toEqual([10]);
    expect(erro).toHaveBeenCalledWith("[para você] reserva:", "TMDB fora do ar");
    erro.mockRestore();
  });

  it("perfil sem gênero convertível: sem reserva", async () => {
    falsos.listarTodasMarcacoes.mockResolvedValue([marca("filme", 1, "ja_assisti")]);
    falsos.detalharFilme.mockResolvedValue({ generoIds: [27] }); // Terror não existe em série
    expect(await montarParaVoce({ tipo: "serie", ...sem })).toEqual([]);
    expect(falsos.listarTitulos).not.toHaveBeenCalled();
  });

  it("nunca passa de 20", async () => {
    falsos.listarTodasMarcacoes.mockResolvedValue([marca("serie", 1399, "assistindo")]);
    falsos.recomendacoesDe.mockResolvedValue(Array.from({ length: 25 }, (_, i) => c(500 + i, "serie")));
    expect(await montarParaVoce({ tipo: "serie", ...sem })).toHaveLength(20);
    expect(falsos.listarTitulos).not.toHaveBeenCalled();
  });

  it("a reserva respeita os filtros: streaming e nota vão ao TMDB, e o logo é o do filtro", async () => {
    falsos.listarTodasMarcacoes.mockResolvedValue([marca("serie", 1399, "assistindo")]);
    falsos.detalharSerie.mockResolvedValue({ generoIds: [18] });
    falsos.nomesDosGeneros.mockResolvedValue(new Map([[18, "Drama"]]));
    falsos.listarTitulos.mockResolvedValue({
      filmes: [resumo(60, "filme", ["Drama"]), resumo(61, "filme", ["Drama"])],
      pagina: 1,
      totalPaginas: 1,
    });
    falsos.streamingsDoTitulo.mockImplementation(async (_tipo: Tipo, id: number) =>
      id === 60 ? [NETFLIX, GLOBOPLAY] : [NETFLIX],
    );
    const r = await montarParaVoce({ tipo: "filme", streaming: 307, nota: 7 });
    expect(falsos.listarTitulos).toHaveBeenCalledWith(expect.objectContaining({ streaming: 307, nota: 7 }));
    expect(r.map((x) => [x.titulo.id, x.streaming.id])).toEqual([[60, 307]]);
  });

  it("sementes e reserva somadas nunca passam de 20, e as sementes vêm primeiro", async () => {
    falsos.listarTodasMarcacoes.mockResolvedValue([marca("filme", 27205, "ja_assisti", "A Origem")]);
    // 7 cartões das sementes: um a menos que o mínimo, então a reserva completa.
    falsos.recomendacoesDe.mockResolvedValue(Array.from({ length: 7 }, (_, i) => c(10 + i)));
    falsos.detalharFilme.mockResolvedValue({ generoIds: [878] });
    falsos.nomesDosGeneros.mockResolvedValue(new Map([[878, "Ficção científica"]]));
    falsos.listarTitulos.mockResolvedValue({
      filmes: Array.from({ length: 30 }, (_, i) => resumo(100 + i, "filme", ["Ficção científica"])),
      pagina: 1,
      totalPaginas: 2,
    });
    const r = await montarParaVoce({ tipo: "filme", ...sem });
    expect(r).toHaveLength(20);
    expect(r.slice(0, 7).every((x) => x.motivo === "Porque você assistiu A Origem")).toBe(true);
    expect(r.slice(7).every((x) => x.motivo === "Porque você gosta de Ficção científica")).toBe(true);
  });

  it("o filtro de nota vale para as recomendações das sementes", async () => {
    const comNota = (id: number, nota: number): Candidato => ({ titulo: { ...resumo(id, "serie"), nota }, votos: 800 });
    falsos.listarTodasMarcacoes.mockResolvedValue([marca("serie", 1399, "assistindo")]);
    falsos.recomendacoesDe.mockResolvedValue([comNota(10, 6.4), comNota(11, 8.6)]);
    const r = await montarParaVoce({ tipo: "serie", streaming: null, nota: 8 });
    expect(r.map((x) => x.titulo.id)).toEqual([11]);
  });

  it("uma marcação antiga, além das 20 mais recentes, nunca é recomendada", async () => {
    const marcas = Array.from({ length: 25 }, (_, i) => marca("serie", 101 + i, "ja_assisti"));
    falsos.listarTodasMarcacoes.mockResolvedValue(marcas);
    falsos.recomendacoesDe.mockResolvedValue([c(125, "serie"), c(200, "serie")]);
    const r = await montarParaVoce({ tipo: "serie", ...sem });
    expect(r.map((x) => x.titulo.id)).toEqual([200]);
  });
});

describe("fileiraPodeAparecer (decide se o Catálogo reserva o lugar da fileira)", () => {
  const contagem = (quero = 0, assistindo = 0, ja = 0) => ({
    quero_assistir: quero,
    assistindo,
    ja_assisti: ja,
  });
  const logado = { id: "u1", email: "", nome: null };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sem login: não, e nem consulta as marcações", async () => {
    falsos.usuarioAtual.mockResolvedValue(null);
    expect(await fileiraPodeAparecer()).toBe(false);
    expect(falsos.contarMarcacoes).not.toHaveBeenCalled();
  });

  it("logado sem nenhuma marcação: não", async () => {
    falsos.usuarioAtual.mockResolvedValue(logado);
    falsos.contarMarcacoes.mockResolvedValue(contagem());
    expect(await fileiraPodeAparecer()).toBe(false);
  });

  it("logado com uma marcação em qualquer lista: sim", async () => {
    falsos.usuarioAtual.mockResolvedValue(logado);
    falsos.contarMarcacoes.mockResolvedValue(contagem(0, 1, 0));
    expect(await fileiraPodeAparecer()).toBe(true);
  });

  it("Supabase com erro: não, sem derrubar o Catálogo", async () => {
    falsos.usuarioAtual.mockResolvedValue(logado);
    falsos.contarMarcacoes.mockRejectedValue(new Error("Supabase fora do ar"));
    expect(await fileiraPodeAparecer()).toBe(false);
  });
});
