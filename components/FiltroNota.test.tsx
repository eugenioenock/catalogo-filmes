import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { lerFiltros } from "@/lib/parametros";
import FiltroNota from "./FiltroNota";

// O botão mostra "★ 8+", mas o leitor de tela precisa ouvir que é uma nota.
describe("FiltroNota para leitores de tela", () => {
  const html = renderToStaticMarkup(<FiltroNota filtros={lerFiltros({ nota: "8" })} />);

  it("cada nota diz o que é: 'Nota 8 ou mais'", () => {
    for (const nota of [6, 7, 8, 9]) expect(html).toContain(`aria-label="Nota ${nota} ou mais"`);
  });

  it("o botão sem filtro diz 'Qualquer nota'", () => {
    expect(html).toContain('aria-label="Qualquer nota"');
  });

  it("o texto visível continua o mesmo", () => {
    expect(html).toContain("8+");
    expect(html).toContain("Qualquer");
  });
});
