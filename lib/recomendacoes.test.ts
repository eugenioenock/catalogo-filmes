import { describe, expect, it } from "vitest";
import type { Situacao, Tipo } from "./listas";
import {
  escolherSementes,
  generoNoTipo,
  perfilDeGeneros,
  pesoDaSituacao,
  pontuarCandidatos,
  textoDoMotivo,
  type Candidato,
  type Marca,
  type Semente,
} from "./recomendacoes";

function cand(id: number, { nota = 7, votos = 500, tipo = "filme" as Tipo } = {}): Candidato {
  return {
    titulo: { tipo, id, titulo: `T${id}`, ano: null, posterUrl: null, backdropUrl: null, sinopse: "", nota, generos: [] },
    votos,
  };
}
const marca = (tipo: Tipo, id: number, situacao: Situacao): Marca => ({ tipo, id, situacao, titulo: `M${id}` });
const semente = (id: number, situacao: Situacao): Semente => ({ ...marca("filme", id, situacao), peso: pesoDaSituacao(situacao) });
const ids = (r: { titulo: { id: number } }[]) => r.map((p) => p.titulo.id);

describe("sementes", () => {
  it("pesoDaSituacao", () =>
    expect((["quero_assistir", "assistindo", "ja_assisti"] as Situacao[]).map(pesoDaSituacao)).toEqual([1, 2, 2]));
  it("escolherSementes pega até 10 do tipo, na ordem, com peso", () => {
    const marcas = [
      marca("serie", 1, "assistindo"),
      marca("filme", 2, "quero_assistir"),
      ...Array.from({ length: 12 }, (_, i) => marca("filme", 100 + i, "ja_assisti")),
    ];
    const s = escolherSementes(marcas, "filme");
    expect(s).toHaveLength(10);
    expect(s[0]).toMatchObject({ id: 2, peso: 1 });
    expect(s[1]).toMatchObject({ id: 100, peso: 2 });
    expect(s.every((x) => x.tipo === "filme")).toBe(true);
  });
});

describe("pontuarCandidatos", () => {
  const vazio = new Set<string>();

  it("título recomendado por duas sementes soma os pesos e aparece uma vez", () => {
    const quero = semente(1, "quero_assistir");
    const assistindo = semente(2, "assistindo");
    const r = pontuarCandidatos({
      porSemente: [
        { semente: quero, candidatos: [cand(9)] },
        { semente: assistindo, candidatos: [cand(9), cand(8)] },
      ],
      marcadas: vazio,
      nota: null,
    });
    expect(r.map((p) => [p.titulo.id, p.pontos])).toEqual([
      [9, 3],
      [8, 2],
    ]);
    expect(r[0].semente.id).toBe(2);
  });
  it("no empate de peso, o motivo é a semente mais recente (a primeira)", () => {
    const r = pontuarCandidatos({
      porSemente: [
        { semente: semente(1, "ja_assisti"), candidatos: [cand(9)] },
        { semente: semente(2, "assistindo"), candidatos: [cand(9)] },
      ],
      marcadas: vazio,
      nota: null,
    });
    expect(r[0].semente.id).toBe(1);
  });
  it("tira os já marcados, quem tem menos de 50 votos e quem não passa na nota", () => {
    const r = pontuarCandidatos({
      porSemente: [
        {
          semente: semente(1, "ja_assisti"),
          candidatos: [
            cand(5),
            cand(6, { votos: 49 }),
            cand(7, { nota: 7.9, votos: 900 }),
            cand(8, { nota: 8.5, votos: 150 }),
            cand(10, { nota: 8.1, votos: 300 }),
          ],
        },
      ],
      marcadas: new Set(["filme-5"]),
      nota: 8,
    });
    expect(ids(r)).toEqual([10]);
  });
  it("sem nota ativa, 50 votos bastam", () => {
    const r = pontuarCandidatos({
      porSemente: [{ semente: semente(1, "ja_assisti"), candidatos: [cand(6, { votos: 50 }), cand(7, { votos: 49 })] }],
      marcadas: vazio,
      nota: null,
    });
    expect(ids(r)).toEqual([6]);
  });
  it("série marcada com o mesmo id não tira o filme candidato", () => {
    const r = pontuarCandidatos({
      porSemente: [{ semente: semente(1, "ja_assisti"), candidatos: [cand(5)] }],
      marcadas: new Set(["serie-5"]),
      nota: null,
    });
    expect(ids(r)).toEqual([5]);
  });
  it("desempate: nota (só com 200+ votos), depois votos", () => {
    const r = pontuarCandidatos({
      porSemente: [
        {
          semente: semente(1, "ja_assisti"),
          candidatos: [
            cand(1, { nota: 9, votos: 100 }),
            cand(2, { nota: 7, votos: 300 }),
            cand(3, { nota: 8, votos: 250 }),
            cand(4, { nota: 7, votos: 900 }),
          ],
        },
      ],
      marcadas: vazio,
      nota: null,
    });
    expect(ids(r)).toEqual([3, 4, 2, 1]);
  });
});

describe("textoDoMotivo", () => {
  it("as quatro frases", () => {
    expect(textoDoMotivo({ tipo: "semente", situacao: "ja_assisti", titulo: "Dark" })).toBe("Porque você assistiu Dark");
    expect(textoDoMotivo({ tipo: "semente", situacao: "assistindo", titulo: "Dark" })).toBe(
      "Porque você está assistindo Dark",
    );
    expect(textoDoMotivo({ tipo: "semente", situacao: "quero_assistir", titulo: "Dark" })).toBe(
      "Porque você quer assistir Dark",
    );
    expect(textoDoMotivo({ tipo: "genero", nome: "Drama" })).toBe("Porque você gosta de Drama");
  });
});

describe("gêneros", () => {
  it("generoNoTipo segue a tabela da spec", () => {
    expect([28, 12, 878, 14, 10752, 18, 27].map((g) => generoNoTipo(g, "filme", "serie"))).toEqual([
      10759, 10759, 10765, 10765, 10768, 18, null,
    ]);
    expect([10759, 10765, 10768, 80, 10762].map((g) => generoNoTipo(g, "serie", "filme"))).toEqual([
      28, 878, 10752, 80, null,
    ]);
    expect(generoNoTipo(27, "filme", "filme")).toBe(27);
    expect(generoNoTipo(10762, "serie", "serie")).toBe(10762);
  });
  it("perfilDeGeneros soma pesos já convertidos e devolve os 2 mais fortes", () => {
    const itens = [
      { tipo: "serie" as Tipo, generoIds: [10765, 18], peso: 2 },
      { tipo: "filme" as Tipo, generoIds: [878, 27], peso: 1 },
      { tipo: "filme" as Tipo, generoIds: [35], peso: 1 },
    ];
    expect(perfilDeGeneros(itens, "filme")).toEqual([878, 18]);
  });
  it("no empate, ganha o gênero que apareceu primeiro", () => {
    expect(perfilDeGeneros([{ tipo: "filme", generoIds: [35, 18, 80], peso: 1 }], "filme")).toEqual([35, 18]);
  });
  it("sem gênero convertível devolve []", () => {
    expect(perfilDeGeneros([{ tipo: "filme", generoIds: [27, 53], peso: 2 }], "serie")).toEqual([]);
  });
});
