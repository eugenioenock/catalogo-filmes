import "server-only";

import { cache } from "react";
import { linhaParaFilme, type LinhaMarcacao, type Situacao } from "./listas";
import { criarClienteServidor } from "./supabase/servidor";
import type { FilmeResumo } from "./tmdb";
import { usuarioAtual } from "./usuario";

/** Falta configuração do Supabase ou ele devolveu erro. */
export class MarcacoesIndisponiveisError extends Error {}

async function cliente() {
  const supabase = await criarClienteServidor();
  if (!supabase) throw new MarcacoesIndisponiveisError("Supabase não configurado.");
  return supabase;
}

/**
 * Em que lista este filme está para quem está logado (ou null).
 * O filtro por pessoa vem da RLS: o banco só devolve as linhas de quem está logado.
 */
export async function situacaoDoFilme(filmeId: number): Promise<Situacao | null> {
  if (!(await usuarioAtual())) return null;
  const { data, error } = await (await cliente())
    .from("marcacoes")
    .select("situacao")
    .eq("filme_id", filmeId)
    .maybeSingle();
  if (error) throw new MarcacoesIndisponiveisError(error.message);
  return (data?.situacao as Situacao | undefined) ?? null;
}

/** Os filmes de uma lista, do marcado mais recente para o mais antigo. */
export async function listarMarcacoes(situacao: Situacao): Promise<FilmeResumo[]> {
  const { data, error } = await (await cliente())
    .from("marcacoes")
    .select("filme_id, titulo, poster_url, ano, nota")
    .eq("situacao", situacao)
    .order("marcado_em", { ascending: false });
  if (error) throw new MarcacoesIndisponiveisError(error.message);
  return (data as LinhaMarcacao[]).map(linhaParaFilme);
}

/** Quantos filmes há em cada lista (para os números das abas). Uma leitura por requisição. */
export const contarMarcacoes = cache(async (): Promise<Record<Situacao, number>> => {
  const { data, error } = await (await cliente()).from("marcacoes").select("situacao");
  if (error) throw new MarcacoesIndisponiveisError(error.message);
  const contagem: Record<Situacao, number> = { quero_assistir: 0, assistindo: 0, ja_assisti: 0 };
  for (const { situacao } of data as { situacao: Situacao }[]) contagem[situacao]++;
  return contagem;
});

/**
 * Grava a situação do filme para quem está logado.
 * null apaga a marcação; uma situação cria a linha ou troca a lista dela.
 */
export async function gravarSituacao(filme: FilmeResumo, situacao: Situacao | null): Promise<void> {
  const usuario = await usuarioAtual();
  if (!usuario) throw new MarcacoesIndisponiveisError("Ninguém logado.");
  const supabase = await cliente();

  const { error } =
    situacao === null
      ? await supabase.from("marcacoes").delete().eq("filme_id", filme.id)
      : await supabase.from("marcacoes").upsert(
          {
            user_id: usuario.id,
            filme_id: filme.id,
            situacao,
            titulo: filme.titulo,
            poster_url: filme.posterUrl,
            ano: filme.ano,
            nota: filme.nota,
            marcado_em: new Date().toISOString(),
          },
          { onConflict: "user_id,filme_id" },
        );
  if (error) throw new MarcacoesIndisponiveisError(error.message);
}
