import { chaveDoTitulo, type Tipo } from "@/lib/listas";
import { montarParaVoce, type Recomendacao } from "@/lib/paraVoce";
import { usuarioAtual } from "@/lib/usuario";
import CartaoFilme from "./CartaoFilme";
import Fileira from "./Fileira";

export default async function ParaVoce({
  tipo,
  streaming,
  nota,
}: {
  tipo: Tipo;
  streaming: number | null;
  nota: number | null;
}) {
  if (!(await usuarioAtual())) return null;

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
          <li key={chaveDoTitulo(titulo)} className="relative w-36 shrink-0 snap-start sm:w-44">
            <CartaoFilme filme={titulo} streaming={onde} motivo={motivo} />
          </li>
        ))}
      </ul>
    </Fileira>
  );
}
