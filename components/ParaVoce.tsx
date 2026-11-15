import { Suspense } from "react";
import { chaveDoTitulo, type Tipo } from "@/lib/listas";
import { montarParaVoce, type Recomendacao } from "@/lib/paraVoce";
import CartaoFilme from "./CartaoFilme";
import Fileira from "./Fileira";

type Props = { tipo: Tipo; streaming: number | null; nota: number | null };

/** Cartões do esqueleto: o bastante para encher a fileira numa tela larga. */
const CARTOES_DO_ESQUELETO = 8;

/** Mesma largura dos cartões da fileira e o mesmo `relative` (ver a nota em FileiraParaVoce). */
const CLASSE_ITEM = "relative w-36 shrink-0 snap-start sm:w-44";

/**
 * A fileira "Para você". Quem a renderiza já sabe, por fileiraPodeAparecer (lib/paraVoce.ts),
 * que a pessoa está logada e tem marcações: por isso o esqueleto entra já no primeiro desenho
 * do Catálogo, do tamanho da fileira, e o Top 10 não desce quando as recomendações chegam.
 */
export default function ParaVoce(props: Props) {
  return (
    <Suspense fallback={<EsqueletoParaVoce />}>
      <FileiraParaVoce {...props} />
    </Suspense>
  );
}

async function FileiraParaVoce({ tipo, streaming, nota }: Props) {
  let recomendacoes: Recomendacao[];
  try {
    recomendacoes = await montarParaVoce({ tipo, streaming, nota });
  } catch (erro) {
    // Qualquer falha some com a fileira: ela é um extra e não pode derrubar o catálogo.
    console.error("[para você]", erro instanceof Error ? erro.message : String(erro));
    return null;
  }
  if (recomendacoes.length === 0) return null;

  return (
    <Fileira id="para-voce" titulo="Para você">
      <ul className="flex w-max gap-3 px-(--margem) pt-5 pb-6 sm:gap-5">
        {recomendacoes.map(({ titulo, streaming: onde, motivo }) => (
          // "relative" prende o texto sr-only (absoluto) do cartão ao trilho; sem isso ele alarga a página.
          <li key={chaveDoTitulo(titulo)} className={CLASSE_ITEM}>
            <CartaoFilme filme={titulo} streaming={onde} motivo={motivo} />
          </li>
        ))}
      </ul>
    </Fileira>
  );
}

/**
 * Ocupa o lugar da fileira com as mesmas medidas do CartaoFilme: pôster 2:3, título (text-sm),
 * nota e ano (text-xs) e as duas linhas do motivo (text-xs).
 */
function EsqueletoParaVoce() {
  return (
    <Fileira id="para-voce" titulo="Para você">
      <ul aria-hidden className="flex w-max gap-3 px-(--margem) pt-5 pb-6 sm:gap-5">
        {Array.from({ length: CARTOES_DO_ESQUELETO }, (_, i) => (
          <li key={i} className={CLASSE_ITEM}>
            <div className="aspect-[2/3] rounded-lg bg-poltrona ring-1 ring-tela/10 motion-safe:animate-pulse" />
            <div className="mt-3 flex h-5 items-center">
              <div className="h-3 w-3/4 rounded bg-poltrona motion-safe:animate-pulse" />
            </div>
            <div className="mt-1 flex h-4 items-center">
              <div className="h-2.5 w-1/3 rounded bg-poltrona motion-safe:animate-pulse" />
            </div>
            <div className="mt-1 h-8" />
          </li>
        ))}
      </ul>
    </Fileira>
  );
}
