import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import CampoBusca from "./CampoBusca";

// A busca traz filmes e séries juntos, mas quem buscou a partir de Séries tem de
// voltar para Séries ao apagar a busca, paginar ou mudar um filtro.
describe("CampoBusca", () => {
  const sem = { busca: null, streaming: null, nota: null };

  it("na aba Séries, envia tipo=series junto com a busca", () => {
    const html = renderToStaticMarkup(<CampoBusca {...sem} tipo="serie" />);
    expect(html).toContain('<input type="hidden" name="tipo" value="series"/>');
  });

  it("na aba Filmes, não envia o tipo (filmes é o padrão da URL)", () => {
    const html = renderToStaticMarkup(<CampoBusca {...sem} tipo="filme" />);
    expect(html).not.toContain('name="tipo"');
  });

  it("continua enviando o streaming e a nota", () => {
    const html = renderToStaticMarkup(<CampoBusca busca="dark" streaming={8} nota={7} tipo="serie" />);
    expect(html).toContain('name="streaming" value="8"');
    expect(html).toContain('name="nota" value="7"');
  });
});
