import Link from "next/link";
import { hrefDoTitulo, NOME_DA_SITUACAO, SITUACOES, type Situacao, type Tipo } from "@/lib/listas";
import { MarcacoesIndisponiveisError, situacaoDoTitulo } from "@/lib/marcacoes";
import { usuarioAtual } from "@/lib/usuario";
import { classeFiltro } from "./classeFiltro";
import FormularioMarcar from "./FormularioMarcar";

/**
 * Enquanto se descobre quem está logado: os mesmos três botões, apagados e sem ação.
 * Mesmo texto e mesmo estilo = mesma largura e mesma quebra de linha; assim, no celular
 * (onde eles ficam em duas linhas), a sinopse não desce quando os botões de verdade chegam.
 */
export function BotoesMarcarCarregando() {
  return (
    <div aria-hidden className="flex flex-wrap items-center gap-3 opacity-50">
      {SITUACOES.map((s) => (
        <span key={s} className={`${classeFiltro(false, false)} motion-safe:animate-pulse`}>
          + {NOME_DA_SITUACAO[s]}
        </span>
      ))}
    </div>
  );
}

/** "Quero assistir", "Assistindo" e "Já assisti" na página do filme ou da série. Sem login, os botões levam para entrar. */
export default async function BotoesMarcar({ tipo, id }: { tipo: Tipo; id: number }) {
  const usuario = await usuarioAtual();

  if (!usuario) {
    const href = `/entrar?volta=${encodeURIComponent(hrefDoTitulo({ tipo, id }))}`;
    return (
      <div className="flex flex-wrap items-center gap-3">
        {SITUACOES.map((s) => (
          <Link key={s} href={href} className={classeFiltro(false, false)}>
            + {NOME_DA_SITUACAO[s]}
          </Link>
        ))}
      </div>
    );
  }

  let situacao: Situacao | null;
  try {
    situacao = await situacaoDoTitulo(tipo, id);
  } catch (erro) {
    if (erro instanceof MarcacoesIndisponiveisError) {
      return <p className="text-sm text-nevoa">Não foi possível carregar suas listas agora.</p>;
    }
    throw erro;
  }

  return <FormularioMarcar tipo={tipo} id={id} situacao={situacao} />;
}
