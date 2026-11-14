"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { linkCadastro } from "@/lib/conta";

/**
 * No cabeçalho, para quem está logado: "Olá, {nome}" ou, sem nome, o convite para completar o cadastro.
 * Os dois levam à tela Completar cadastro lembrando a página atual, como o "Entrar" faz.
 */
export default function LinkCadastro({ nome, email }: { nome: string | null; email: string }) {
  const caminho = usePathname();
  const busca = useSearchParams().toString();
  const href = linkCadastro(busca ? `${caminho}?${busca}` : caminho);

  if (!nome) {
    return (
      <Link href={href} className="shrink-0 text-sm font-semibold text-projetor hover:underline">
        <span className="sm:hidden">Completar</span>
        <span className="hidden sm:inline">Complete seu cadastro</span>
      </Link>
    );
  }

  // max-w-24 é o que sobra ao lado do nome do site e do "Sair" em 375px.
  // Nomes longos são cortados com "…"; o e-mail completo fica no title.
  return (
    <Link
      href={href}
      title={email}
      className="max-w-24 truncate text-sm text-tela/85 transition-colors hover:text-tela sm:max-w-56"
    >
      Olá, {nome}
    </Link>
  );
}
