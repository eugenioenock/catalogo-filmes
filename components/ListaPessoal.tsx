import Link from "next/link";
import { mensagemListaVazia, NOME_DA_SITUACAO, SITUACAO_DA_LISTA, type ListaUrl } from "@/lib/listas";
import { listarMarcacoes, MarcacoesIndisponiveisError } from "@/lib/marcacoes";
import { hrefDaLista } from "@/lib/parametros";
import type { FilmeResumo } from "@/lib/tmdb";
import { usuarioAtual } from "@/lib/usuario";
import GradeFilmes from "./GradeFilmes";

const classeTitulo = "font-display mb-6 text-3xl leading-none font-extrabold break-words uppercase sm:text-4xl";

/** Uma aba pessoal ("Quero assistir", "Assistindo" ou "Já assisti"): os títulos que a pessoa marcou. */
export default async function ListaPessoal({ lista }: { lista: ListaUrl }) {
  const usuario = await usuarioAtual();

  if (!usuario) {
    return (
      <section className="py-16 text-center">
        <h2 className={classeTitulo}>Entre para ver sua lista</h2>
        <Link
          href={`/entrar?volta=${encodeURIComponent(hrefDaLista(lista))}`}
          className="inline-block rounded-full bg-projetor px-7 py-3 font-semibold text-sala transition-colors hover:bg-projetor-forte"
        >
          Entrar
        </Link>
      </section>
    );
  }

  const situacao = SITUACAO_DA_LISTA[lista];
  let filmes: FilmeResumo[];
  try {
    filmes = await listarMarcacoes(situacao);
  } catch (erro) {
    if (erro instanceof MarcacoesIndisponiveisError) {
      return <p className="py-16 text-center text-nevoa">Não foi possível carregar suas listas agora.</p>;
    }
    throw erro;
  }

  return (
    <section aria-labelledby="lista">
      <h2 id="lista" className={classeTitulo}>
        {NOME_DA_SITUACAO[situacao]}
      </h2>
      <GradeFilmes filmes={filmes} haMaisPaginas={false} mensagemVazia={mensagemListaVazia(lista)} />
    </section>
  );
}
