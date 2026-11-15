"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { hrefDoTitulo, proximaSituacao, type Situacao, type Tipo } from "@/lib/listas";
import { gravarSituacao, situacaoDoTitulo } from "@/lib/marcacoes";
import { detalharFilme, detalharSerie } from "@/lib/tmdb";
import { usuarioAtual } from "@/lib/usuario";

export type EstadoMarcar = { erro: string | null };

/**
 * Clique num botão de marcar, na página de um filme ou de uma série. Usada com
 * .bind(null, tipo, id, clicada) no useActionState (o estado anterior e o FormData
 * que ele passa não são usados). Clicar no aceso desmarca; clicar no outro troca de lista.
 */
export async function alternarMarcacao(tipo: Tipo, id: number, clicada: Situacao): Promise<EstadoMarcar> {
  // Fora do try: o redirect funciona lançando um erro especial do Next.
  if (!(await usuarioAtual())) redirect(`/entrar?volta=${encodeURIComponent(hrefDoTitulo({ tipo, id }))}`);

  try {
    const atual = await situacaoDoTitulo(tipo, id);
    // Título, pôster e nota vêm do TMDB, não do formulário: o servidor não confia no navegador.
    const titulo = tipo === "filme" ? await detalharFilme(id) : await detalharSerie(id);
    await gravarSituacao(titulo, proximaSituacao(atual, clicada));
  } catch {
    return { erro: "Não foi possível salvar agora. Tente de novo." };
  }

  refresh();
  return { erro: null };
}
