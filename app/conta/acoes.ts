"use server";

import { redirect } from "next/navigation";
import {
  lerVolta,
  traduzirErroAuth,
  validarCredenciais,
  type EstadoConta,
  type ModoConta,
} from "@/lib/conta";
import { criarClienteServidor } from "@/lib/supabase/servidor";

function lerFormulario(dados: FormData) {
  return {
    email: String(dados.get("email") ?? "").trim(),
    senha: String(dados.get("senha") ?? ""),
    volta: lerVolta(dados.get("volta")),
  };
}

/** Entrar e criar conta só mudam a chamada ao Supabase; o resto é igual. */
async function autenticar(modo: ModoConta, dados: FormData): Promise<EstadoConta> {
  const { email, senha, volta } = lerFormulario(dados);

  const invalido = validarCredenciais(email, senha, modo);
  if (invalido) return { erro: invalido, email };

  try {
    const supabase = await criarClienteServidor();
    if (!supabase) return { erro: traduzirErroAuth(undefined), email };

    const { error } =
      modo === "entrar"
        ? await supabase.auth.signInWithPassword({ email, password: senha })
        : await supabase.auth.signUp({ email, password: senha });
    if (error) return { erro: traduzirErroAuth(error.code), email };
  } catch {
    return { erro: traduzirErroAuth(undefined), email };
  }

  // Fora do try: o redirect funciona lançando um erro especial do Next.
  redirect(volta);
}

export async function entrar(_estado: EstadoConta, dados: FormData): Promise<EstadoConta> {
  return autenticar("entrar", dados);
}

export async function criarConta(_estado: EstadoConta, dados: FormData): Promise<EstadoConta> {
  return autenticar("criar", dados);
}

export async function sair(): Promise<void> {
  try {
    const supabase = await criarClienteServidor();
    await supabase?.auth.signOut();
  } catch {
    // Mesmo se o Supabase falhar, a pessoa volta para o início.
  }
  redirect("/");
}
