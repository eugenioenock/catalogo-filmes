import Link from "next/link";
import { NOME_DA_SITUACAO, SITUACOES, type Situacao } from "@/lib/listas";
import { MarcacoesIndisponiveisError, situacaoDoTitulo } from "@/lib/marcacoes";
import { usuarioAtual } from "@/lib/usuario";
import { classeFiltro } from "./classeFiltro";
import FormularioMarcar from "./FormularioMarcar";

/** "Quero assistir", "Assistindo" e "Já assisti" na página do filme. Sem login, os botões levam para entrar. */
export default async function BotoesMarcar({ filmeId }: { filmeId: number }) {
  const usuario = await usuarioAtual();

  if (!usuario) {
    const href = `/entrar?volta=${encodeURIComponent(`/filme/${filmeId}`)}`;
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
    situacao = await situacaoDoTitulo("filme", filmeId);
  } catch (erro) {
    if (erro instanceof MarcacoesIndisponiveisError) {
      return <p className="text-sm text-nevoa">Não foi possível carregar suas listas agora.</p>;
    }
    throw erro;
  }

  return <FormularioMarcar filmeId={filmeId} situacao={situacao} />;
}
