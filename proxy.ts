import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { configSupabase } from "@/lib/supabase/config";

/**
 * Roda antes de cada página: renova a sessão do Supabase (o token de login expira)
 * e devolve os cookies atualizados ao navegador. Não bloqueia nenhuma página:
 * quem decide o que mostrar para quem está logado são as próprias páginas.
 */
export async function proxy(request: NextRequest) {
  const config = configSupabase();
  if (!config) return NextResponse.next();

  let resposta = NextResponse.next({ request });

  try {
    const supabase = createServerClient(config.url, config.chave, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesParaGravar, cabecalhos) {
          // Grava no request (para as páginas lerem já o cookie novo)…
          cookiesParaGravar.forEach(({ name, value }) => request.cookies.set(name, value));
          resposta = NextResponse.next({ request });
          // …e na resposta (para o navegador guardar).
          cookiesParaGravar.forEach(({ name, value, options }) =>
            resposta.cookies.set(name, value, options),
          );
          Object.entries(cabecalhos).forEach(([nome, valor]) => resposta.headers.set(nome, valor));
        },
      },
    });

    // Valida o token e, se estiver vencendo, troca por um novo (chama o setAll acima).
    await supabase.auth.getClaims();
  } catch {
    // Supabase fora do ar não pode derrubar o site: segue sem renovar a sessão.
    return NextResponse.next();
  }

  return resposta;
}

export const config = {
  // Não roda para arquivos estáticos e imagens.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
