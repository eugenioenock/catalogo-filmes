import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// A fileira é um extra: com o TMDB ou o Supabase fora do ar, ela some e o Catálogo segue.
// vi.hoisted: o vi.mock sobe para o topo do arquivo, então o falso precisa existir antes dele.
const { montarParaVoce } = vi.hoisted(() => ({ montarParaVoce: vi.fn() }));
vi.mock("@/lib/paraVoce", () => ({ montarParaVoce }));

import { FileiraParaVoce } from "./ParaVoce";

// As classes de erro reais vivem em módulos server-only; aqui só importa que são erros.
class MarcacoesIndisponiveisError extends Error {}
class TmdbIndisponivelError extends Error {}

const props = { tipo: "serie" as const, streaming: null, nota: null };

describe("FileiraParaVoce quando algo cai", () => {
  let erroNoConsole: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    montarParaVoce.mockReset();
    erroNoConsole = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    erroNoConsole.mockRestore();
  });

  it("Supabase fora do ar: a fileira some e o erro fica registrado no servidor", async () => {
    montarParaVoce.mockRejectedValue(new MarcacoesIndisponiveisError("fetch failed"));
    expect(await FileiraParaVoce(props)).toBeNull();
    expect(erroNoConsole).toHaveBeenCalledWith("[para você]", "fetch failed");
  });

  it("TMDB fora do ar: a fileira some e o erro fica registrado no servidor", async () => {
    montarParaVoce.mockRejectedValue(new TmdbIndisponivelError("Não foi possível falar com o TMDB."));
    expect(await FileiraParaVoce(props)).toBeNull();
    expect(erroNoConsole).toHaveBeenCalledWith("[para você]", "Não foi possível falar com o TMDB.");
  });

  it("nenhuma recomendação: a fileira some, sem erro", async () => {
    montarParaVoce.mockResolvedValue([]);
    expect(await FileiraParaVoce(props)).toBeNull();
    expect(erroNoConsole).not.toHaveBeenCalled();
  });

  it("com recomendações: a fileira aparece", async () => {
    montarParaVoce.mockResolvedValue([
      {
        titulo: { tipo: "serie", id: 10, titulo: "T10", ano: "2020", posterUrl: null, backdropUrl: null, sinopse: "", nota: 8, generos: [] },
        streaming: { id: 8, nome: "Netflix", logoUrl: null },
        motivo: "Porque você está assistindo Game of Thrones",
      },
    ]);
    expect(await FileiraParaVoce(props)).not.toBeNull();
    expect(montarParaVoce).toHaveBeenCalledWith(props);
  });
});
