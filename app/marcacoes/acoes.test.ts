import { beforeEach, describe, expect, it, vi } from "vitest";

// A ação é um endpoint público: o navegador pode mandar qualquer argumento.
// vi.hoisted: o vi.mock sobe para o topo do arquivo, então os falsos precisam existir antes dele.
const { detalharFilme, detalharSerie, gravarSituacao, refresh, situacaoDoTitulo } = vi.hoisted(() => ({
  detalharFilme: vi.fn(),
  detalharSerie: vi.fn(),
  gravarSituacao: vi.fn(),
  refresh: vi.fn(),
  situacaoDoTitulo: vi.fn(),
}));
vi.mock("next/cache", () => ({ refresh }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/usuario", () => ({ usuarioAtual: async () => ({ id: "u1", email: "", nome: null }) }));
vi.mock("@/lib/tmdb", () => ({ detalharFilme, detalharSerie }));
vi.mock("@/lib/marcacoes", () => ({ gravarSituacao, situacaoDoTitulo }));

import { alternarMarcacao } from "./acoes";

const ERRO = { erro: "Não foi possível salvar agora. Tente de novo." };

describe("alternarMarcacao valida os argumentos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    situacaoDoTitulo.mockResolvedValue(null);
    detalharSerie.mockResolvedValue({ tipo: "serie", id: 1399 });
    detalharFilme.mockResolvedValue({ tipo: "filme", id: 27205 });
  });

  it.each([
    ["tipo inválido", "documentario", 1399, "assistindo"],
    ["id zero", "serie", 0, "assistindo"],
    ["id negativo", "serie", -5, "assistindo"],
    ["id fracionário", "serie", 1.5, "assistindo"],
    ["id em texto", "serie", "1399", "assistindo"],
    ["situação inválida", "serie", 1399, "favorito"],
  ])("%s não chega ao banco nem ao TMDB", async (_nome, tipo, id, clicada) => {
    // @ts-expect-error: simula o que um navegador malicioso poderia mandar.
    expect(await alternarMarcacao(tipo, id, clicada)).toEqual(ERRO);
    expect(situacaoDoTitulo).not.toHaveBeenCalled();
    expect(detalharSerie).not.toHaveBeenCalled();
    expect(detalharFilme).not.toHaveBeenCalled();
    expect(gravarSituacao).not.toHaveBeenCalled();
  });

  it("argumentos válidos de série gravam com os dados da série", async () => {
    expect(await alternarMarcacao("serie", 1399, "assistindo")).toEqual({ erro: null });
    expect(detalharSerie).toHaveBeenCalledWith(1399);
    expect(gravarSituacao).toHaveBeenCalledWith({ tipo: "serie", id: 1399 }, "assistindo");
  });
});

// O refresh() faz o Next descartar as páginas guardadas: sem ele, ao voltar para o Catálogo
// o título recém-marcado continuaria na fileira "Para você" e nas contagens das abas.
describe("alternarMarcacao atualiza as telas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    situacaoDoTitulo.mockResolvedValue(null);
    detalharSerie.mockResolvedValue({ tipo: "serie", id: 1399 });
  });

  it("depois de salvar, pede ao Next para refazer as páginas", async () => {
    expect(await alternarMarcacao("serie", 1399, "quero_assistir")).toEqual({ erro: null });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("se salvar falha, não refaz nada", async () => {
    gravarSituacao.mockRejectedValueOnce(new Error("Supabase fora do ar"));
    expect(await alternarMarcacao("serie", 1399, "quero_assistir")).toEqual(ERRO);
    expect(refresh).not.toHaveBeenCalled();
  });
});
