"use server";

import { redirect } from "next/navigation";
import {
  destinoAposLogin,
  lerVolta,
  traduzirErroAuth,
  validarCredenciais,
  validarNome,
  type EstadoConta,
  type EstadoNome,
  type ModoConta,
} from "@/lib/conta";
import { criarClienteServidor } from "@/lib/supabase/servidor";

function lerFormulario(dados: FormData) {
  return {
    nome: String(dados.get("nome") ?? "").trim(),
    email: String(dados.get("email") ?? "").trim(),
    senha: String(dados.get("senha") ?? ""),
    volta: lerVolta(dados.get("volta")),
  };
}

/** Entrar e criar conta só mudam a chamada ao Supabase; o resto é igual. */
async function autenticar(modo: ModoConta, dados: FormData): Promise<EstadoConta> {
  const lido = lerFormulario(dados);
  const { email, senha, volta } = lido;
  // O nome só existe no cadastro; ao entrar, o campo nem aparece.
  const nome = modo === "criar" ? lido.nome : "";

  const invalido =
    (modo === "criar" ? validarNome(nome) : null) ?? validarCredenciais(email, senha, modo);
  if (invalido) return { erro: invalido, nome, email };

  let destino = volta;
  try {
    const supabase = await criarClienteServidor();
    if (!supabase) return { erro: traduzirErroAuth(undefined), nome, email };

    const { data, error } =
      modo === "entrar"
        ? await supabase.auth.signInWithPassword({ email, password: senha })
        : await supabase.auth.signUp({ email, password: senha, options: { data: { nome } } });
    if (error) return { erro: traduzirErroAuth(error.code), nome, email };
    // Contas antigas não têm nome: ao entrar, passam antes pela tela Completar cadastro.
    if (modo === "entrar") destino = destinoAposLogin(data.user?.user_metadata?.nome, volta);
  } catch {
    return { erro: traduzirErroAuth(undefined), nome, email };
  }

  // Fora do try: o redirect funciona lançando um erro especial do Next.
  redirect(destino);
}

export async function entrar(_estado: EstadoConta, dados: FormData): Promise<EstadoConta> {
  return autenticar("entrar", dados);
}

export async function criarConta(_estado: EstadoConta, dados: FormData): Promise<EstadoConta> {
  return autenticar("criar", dados);
}

/** Tela Completar cadastro: grava (ou muda) o nome de quem está logado. */
export async function salvarNome(_estado: EstadoNome, dados: FormData): Promise<EstadoNome> {
  const nome = String(dados.get("nome") ?? "").trim();
  const volta = lerVolta(dados.get("volta"));

  const invalido = validarNome(nome);
  if (invalido) return { erro: invalido, nome };

  try {
    const supabase = await criarClienteServidor();
    if (!supabase) return { erro: traduzirErroAuth(undefined), nome };

    const { error } = await supabase.auth.updateUser({ data: { nome } });
    if (error) return { erro: traduzirErroAuth(undefined), nome };
    // O token da sessão ainda tem os metadados antigos. Renovar já grava um token
    // com o nome novo no cookie, e o cabeçalho mostra o nome sem precisar entrar de novo.
    const renovada = await supabase.auth.refreshSession();
    if (renovada.error) return { erro: traduzirErroAuth(undefined), nome };
  } catch {
    return { erro: traduzirErroAuth(undefined), nome };
  }

  // Fora do try: o redirect funciona lançando um erro especial do Next.
  redirect(volta);
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
