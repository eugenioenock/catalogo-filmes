import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { configSupabase } from "./config";

/**
 * Cliente do Supabase para Server Components e Server Actions.
 * A sessão de quem está logado vem do cookie da requisição.
 * Devolve null quando o Supabase não está configurado.
 */
export async function criarClienteServidor(): Promise<SupabaseClient | null> {
  const config = configSupabase();
  if (!config) return null;

  const loja = await cookies();
  return createServerClient(config.url, config.chave, {
    cookies: {
      getAll() {
        return loja.getAll();
      },
      setAll(cookiesParaGravar) {
        try {
          cookiesParaGravar.forEach(({ name, value, options }) => loja.set(name, value, options));
        } catch {
          // Server Components não podem gravar cookies. Tudo bem: quem renova
          // a sessão é o proxy.ts, a cada requisição.
        }
      },
    },
  });
}
