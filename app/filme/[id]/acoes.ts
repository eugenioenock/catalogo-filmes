"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { proximaSituacao, type Situacao } from "@/lib/listas";
import { gravarSituacao, situacaoDoFilme } from "@/lib/marcacoes";
import { detalharFilme } from "@/lib/tmdb";
import { usuarioAtual } from "@/lib/usuario";

export type EstadoMarcar = { erro: string | null };

/**
 * Clique num botão de marcar. Usada com .bind(null, filmeId, clicada) no useActionState
 * (o estado anterior e o FormData que ele passa não são usados).
 * Clicar no aceso desmarca; clicar no outro troca de lista.
 */
export async function alternarMarcacao(filmeId: number, clicada: Situacao): Promise<EstadoMarcar> {
  // Fora do try: o redirect funciona lançando um erro especial do Next.
  if (!(await usuarioAtual())) redirect(`/entrar?volta=/filme/${filmeId}`);

  try {
    const atual = await situacaoDoFilme(filmeId);
    // Título, pôster e nota vêm do TMDB, não do formulário: o servidor não confia no navegador.
    const filme = await detalharFilme(filmeId);
    await gravarSituacao(filme, proximaSituacao(atual, clicada));
  } catch {
    return { erro: "Não foi possível salvar agora. Tente de novo." };
  }

  refresh();
  return { erro: null };
}
