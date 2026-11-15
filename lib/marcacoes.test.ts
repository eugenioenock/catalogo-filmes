import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FilmeResumo } from "./tmdb";

vi.mock("server-only", () => ({}));
vi.mock("./usuario", () => ({ usuarioAtual: async () => ({ id: "u1", email: "", nome: null }) }));

// Cliente falso do Supabase: cada método encadeável registra [método, ...argumentos].
// Não prova o SQL (isso é o banco), mas pega um refactor que esqueça o filtro por tipo.
const chamadas: unknown[][] = [];
// Quando preenchido, a próxima consulta devolve este erro do Supabase.
let erroDoBanco: { message: string } | null = null;
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
  q.then = (resolver: (r: { data: null; error: { message: string } | null }) => unknown) =>
    resolver({ data: null, error: erroDoBanco });
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

import { gravarSituacao, MarcacoesIndisponiveisError, situacaoDoTitulo } from "./marcacoes";

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
