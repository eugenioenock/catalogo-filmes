import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ListaDeVersoes from "./ListaDeVersoes";

describe("ListaDeVersoes", () => {
  const html = renderToStaticMarkup(
    <ListaDeVersoes
      versoes={[
        { versao: "1.1.0", data: "2026-11-20", novidades: ["A"], correcoes: [] },
        { versao: "1.0.0", data: "2026-11-14", novidades: [], correcoes: ["B"] },
      ]}
    />,
  );

  it("mostra as versões na ordem recebida, da mais nova para a mais antiga", () => {
    expect(html.indexOf("v1.1.0")).toBeGreaterThan(-1);
    expect(html.indexOf("v1.1.0")).toBeLessThan(html.indexOf("v1.0.0"));
  });

  it("mostra a data em formato brasileiro", () => {
    expect(html).toContain("20/11/2026");
  });

  it("dá título às listas e esconde o título de uma lista vazia", () => {
    expect(html.match(/Novidades/g)).toHaveLength(1); // só a 1.1.0 tem novidades
    expect(html.match(/Correções e melhorias/g)).toHaveLength(1); // só a 1.0.0 tem correções
  });
});
