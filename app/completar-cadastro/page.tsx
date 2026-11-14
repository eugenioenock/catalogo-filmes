import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Cabecalho from "@/components/Cabecalho";
import CartaoConta from "@/components/CartaoConta";
import FormularioNome from "@/components/FormularioNome";
import { lerVolta, linkCadastro, nomeValido } from "@/lib/conta";
import { usuarioAtual } from "@/lib/usuario";

export const metadata: Metadata = { title: "Completar cadastro | CineCatálogo" };

/** Lê a sessão e a URL, por isso fica atrás de Suspense (o projeto usa cacheComponents). */
async function Conteudo({ searchParams }: { searchParams: PageProps<"/completar-cadastro">["searchParams"] }) {
  const bruto = (await searchParams).volta;
  const volta = lerVolta(Array.isArray(bruto) ? bruto[0] : bruto);

  const usuario = await usuarioAtual();
  if (!usuario) redirect(`/entrar?volta=${encodeURIComponent(linkCadastro(volta))}`);

  const nome = nomeValido(usuario.nome);
  // A key recria o formulário quando o nome salvo muda: sem ela, o botão Voltar
  // mostraria o estado guardado da visita anterior (campo vazio).
  return nome ? (
    <CartaoConta titulo="Seu cadastro" subtitulo="Mude como quer ser chamado.">
      <FormularioNome key={nome} nomeAtual={nome} volta={volta} />
    </CartaoConta>
  ) : (
    <CartaoConta titulo="Completar cadastro" subtitulo="Falta pouco! Como quer ser chamado?">
      <FormularioNome key="sem-nome" nomeAtual={null} volta={volta} />
    </CartaoConta>
  );
}

export default function PaginaCompletarCadastro({ searchParams }: PageProps<"/completar-cadastro">) {
  return (
    <>
      <Cabecalho busca={null} streaming={null} />
      <main className="mx-auto w-full max-w-md px-4 pt-10 pb-24 sm:pt-16">
        <Suspense fallback={<div className="h-96" />}>
          <Conteudo searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}
