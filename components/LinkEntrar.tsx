"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { classeBotaoConta } from "./classeBotaoConta";

const PAGINAS_DE_CONTA = ["/entrar", "/criar-conta"];

/** "Entrar" que lembra a página atual, para voltar a ela depois do login. */
export default function LinkEntrar() {
  const caminho = usePathname();
  const busca = useSearchParams().toString();
  if (PAGINAS_DE_CONTA.includes(caminho)) return null;

  const atual = busca ? `${caminho}?${busca}` : caminho;
  const href = atual === "/" ? "/entrar" : `/entrar?volta=${encodeURIComponent(atual)}`;
  return (
    <Link href={href} className={classeBotaoConta}>
      Entrar
    </Link>
  );
}
