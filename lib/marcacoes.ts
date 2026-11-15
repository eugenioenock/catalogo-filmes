import "server-only";

import { cache } from "react";
import { linhaParaFilme, type LinhaMarcacao, type Situacao, type Tipo } from "./listas";
import { criarClienteServidor } from "./supabase/servidor";
import type { FilmeResumo } from "./tmdb";
import { usuarioAtual } from "./usuario";

/** Falta configuração do Supabase ou ele devolveu erro. */
export class MarcacoesIndisponiveisError extends Error {}

/**
 * O Supabase devolveu erro: registra a mensagem no servidor (a tela só mostra um aviso
 * genérico) e devolve o erro que as páginas tratam.
 */
function erroDoSupabase(onde: string, mensagem: string): MarcacoesIndisponiveisError {
  console.error(`[marcacoes] ${onde}: ${mensagem}`);
  return new MarcacoesIndisponiveisError(mensagem);
}

async function cliente() {
  const supabase = await criarClienteServidor();
  if (!supabase) throw new MarcacoesIndisponiveisError("Supabase não configurado.");
  return supabase;
}

/**
 * Em que lista este título está para quem está logado (ou null).
 * O filtro por pessoa vem da RLS: o banco só devolve as linhas de quem está logado.
 * O tipo entra no filtro porque o filme 1399 e a série 1399 são títulos diferentes.
 */
export async function situacaoDoTitulo(tipo: Tipo, id: number): Promise<Situacao | null> {
  if (!(await usuarioAtual())) return null;
  const { data, error } = await (await cliente())
    .from("marcacoes")
    .select("situacao")
    .eq("tipo", tipo)
    .eq("filme_id", id)
    .maybeSingle();
  if (error) throw erroDoSupabase("situacaoDoTitulo", error.message);
  return (data?.situacao as Situacao | undefined) ?? null;
}

/** Os títulos (filmes e séries) de uma lista, do marcado mais recente para o mais antigo. */
export async function listarMarcacoes(situacao: Situacao): Promise<FilmeResumo[]> {
  const { data, error } = await (await cliente())
    .from("marcacoes")
    .select("tipo, filme_id, titulo, poster_url, ano, nota")
    .eq("situacao", situacao)
    .order("marcado_em", { ascending: false });
  if (error) throw erroDoSupabase("listarMarcacoes", error.message);
  return (data as LinhaMarcacao[]).map(linhaParaFilme);
}

/** Quantos filmes há em cada lista (para os números das abas). Uma leitura por requisição. */
export const contarMarcacoes = cache(async (): Promise<Record<Situacao, number>> => {
  const { data, error } = await (await cliente()).from("marcacoes").select("situacao");
  if (error) throw erroDoSupabase("contarMarcacoes", error.message);
  const contagem: Record<Situacao, number> = { quero_assistir: 0, assistindo: 0, ja_assisti: 0 };
  for (const { situacao } of data as { situacao: Situacao }[]) contagem[situacao]++;
  return contagem;
});

/**
 * Grava a situação do título para quem está logado.
 * null apaga a marcação; uma situação cria a linha ou troca a lista dela.
 * Apagar filtra pelo tipo também: desmarcar o filme 1399 não apaga a série 1399.
 */
export async function gravarSituacao(filme: FilmeResumo, situacao: Situacao | null): Promise<void> {
  const usuario = await usuarioAtual();
  if (!usuario) throw new MarcacoesIndisponiveisError("Ninguém logado.");
  const supabase = await cliente();

  const { error } =
    situacao === null
      ? await supabase.from("marcacoes").delete().eq("tipo", filme.tipo).eq("filme_id", filme.id)
      : await supabase.from("marcacoes").upsert(
          {
            user_id: usuario.id,
            tipo: filme.tipo,
            filme_id: filme.id,
            situacao,
            titulo: filme.titulo,
            poster_url: filme.posterUrl,
            ano: filme.ano,
            nota: filme.nota,
            marcado_em: new Date().toISOString(),
          },
          { onConflict: "user_id,tipo,filme_id" },
        );
  if (error) throw erroDoSupabase("gravarSituacao", error.message);
}
