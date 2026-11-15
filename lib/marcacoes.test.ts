import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FilmeResumo } from "./tmdb";

vi.mock("server-only", () => ({}));
vi.mock("./usuario", () => ({ usuarioAtual: async () => ({ id: "u1", email: "", nome: null }) }));

// Cliente falso do Supabase: cada método encadeável registra [método, ...argumentos].
// Não prova o SQL (isso é o banco), mas pega um refactor que esqueça o filtro por tipo.
const chamadas: unknown[][] = [];
// Quando preenchido, a próxima consulta devolve este erro do Supabase.
let erroDoBanco: { message: string } | null = null;
// O que a próxima consulta devolve em data (null por padrão).
let dadosDoBanco: unknown = null;
function consulta(): Record<string, unknown> {
  const q: Record<string, unknown> = {};
  for (const metodo of ["from", "select", "eq", "delete", "upsert", "order"]) {
    q[metodo] = (...args: unknown[]) => {
      chamadas.push([metodo, ...args]);
      return q;
    };
  }
  q.maybeSingle = async () => {
    chamadas.push(["maybeSingle"]);
    return { data: null, error: erroDoBanco };
  };
  // "await" na consulta devolve o resultado, como o cliente de verdade.
  q.then = (resolver: (r: { data: unknown; error: { message: string } | null }) => unknown) =>
    resolver({ data: dadosDoBanco, error: erroDoBanco });
  return q;
}
// O cliente em si não pode ser "await-ável" (o await de criarClienteServidor o desembrulharia):
// só o from() devolve a consulta encadeável.
vi.mock("./supabase/servidor", () => ({
  criarClienteServidor: async () => ({
    from: (...args: unknown[]) => {
      chamadas.push(["from", ...args]);
      return consulta();
    },
  }),
}));

import { gravarSituacao, listarTodasMarcacoes, MarcacoesIndisponiveisError, situacaoDoTitulo } from "./marcacoes";

const got: FilmeResumo = {
  tipo: "serie",
  id: 1399,
  titulo: "GoT",
  ano: null,
  posterUrl: null,
  backdropUrl: null,
  sinopse: "",
  nota: 0,
  generos: [],
};

describe("marcações filtram pelo tipo", () => {
  beforeEach(() => {
    chamadas.length = 0;
    erroDoBanco = null;
  });

  it("desmarcar uma série filtra por tipo e id", async () => {
    await gravarSituacao(got, null);
    expect(chamadas).toContainEqual(["delete"]);
    expect(chamadas).toContainEqual(["eq", "tipo", "serie"]);
    expect(chamadas).toContainEqual(["eq", "filme_id", 1399]);
  });
  it("marcar grava o tipo e usa a chave com tipo", async () => {
    await gravarSituacao({ ...got, tipo: "filme" }, "assistindo");
    const upsert = chamadas.find(([m]) => m === "upsert")!;
    expect(upsert[1]).toMatchObject({ user_id: "u1", tipo: "filme", filme_id: 1399, situacao: "assistindo" });
    expect(upsert[2]).toEqual({ onConflict: "user_id,tipo,filme_id" });
  });
  it("ler a situação filtra por tipo", async () => {
    await situacaoDoTitulo("serie", 1399);
    expect(chamadas).toContainEqual(["eq", "tipo", "serie"]);
    expect(chamadas).toContainEqual(["eq", "filme_id", 1399]);
  });
});

describe("erro do Supabase", () => {
  beforeEach(() => {
    chamadas.length = 0;
    erroDoBanco = { message: "TypeError: fetch failed" };
  });
  afterEach(() => {
    erroDoBanco = null;
    vi.restoreAllMocks();
  });

  it("ler a situação registra a mensagem no servidor e lança MarcacoesIndisponiveisError", async () => {
    const registro = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(situacaoDoTitulo("serie", 1399)).rejects.toBeInstanceOf(MarcacoesIndisponiveisError);
    expect(registro).toHaveBeenCalledWith(expect.stringContaining("TypeError: fetch failed"));
  });
  it("gravar também registra a mensagem", async () => {
    const registro = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(gravarSituacao(got, "assistindo")).rejects.toBeInstanceOf(MarcacoesIndisponiveisError);
    expect(registro).toHaveBeenCalledWith(expect.stringContaining("TypeError: fetch failed"));
  });
});

describe("listarTodasMarcacoes", () => {
  beforeEach(() => {
    chamadas.length = 0;
    erroDoBanco = null;
  });
  afterEach(() => {
    dadosDoBanco = null;
  });

  it("lê todas, da mais recente para a mais antiga, e troca filme_id por id", async () => {
    dadosDoBanco = [
      { tipo: "serie", filme_id: 1399, situacao: "assistindo", titulo: "Game of Thrones" },
      { tipo: "filme", filme_id: 27205, situacao: "ja_assisti", titulo: "A Origem" },
    ];
    expect(await listarTodasMarcacoes()).toEqual([
      { tipo: "serie", id: 1399, situacao: "assistindo", titulo: "Game of Thrones" },
      { tipo: "filme", id: 27205, situacao: "ja_assisti", titulo: "A Origem" },
    ]);
    expect(chamadas).toContainEqual(["select", "tipo, filme_id, situacao, titulo"]);
    expect(chamadas).toContainEqual(["order", "marcado_em", { ascending: false }]);
    expect(chamadas.some(([m]) => m === "limit")).toBe(false);
  });
  it("erro do Supabase é registrado e vira MarcacoesIndisponiveisError", async () => {
    erroDoBanco = { message: "falhou" };
    const registro = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(listarTodasMarcacoes()).rejects.toBeInstanceOf(MarcacoesIndisponiveisError);
    expect(registro).toHaveBeenCalledWith(expect.stringContaining("listarTodasMarcacoes"));
    registro.mockRestore();
    erroDoBanco = null;
  });
});
