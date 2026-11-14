import "server-only";

import { cache } from "react";
import { criarClienteServidor } from "./supabase/servidor";

/** `nome` vem dos metadados da conta sem tratar: quem decide se é válido é `saudacao`. */
export type Usuario = { id: string; email: string; nome: unknown };

/**
 * Quem está logado nesta requisição, ou null.
 * Sem Supabase configurado, sem sessão, sessão vencida ou erro: null ("sem login").
 * O cache do React faz a leitura acontecer uma vez só por requisição.
 */
export const usuarioAtual = cache(async (): Promise<Usuario | null> => {
  try {
    const supabase = await criarClienteServidor();
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims.sub) return null;
    return {
      id: data.claims.sub,
      email: String(data.claims.email ?? ""),
      nome: data.claims.user_metadata?.nome,
    };
  } catch {
    return null;
  }
});
