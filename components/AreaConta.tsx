import { sair } from "@/app/conta/acoes";
import { nomeValido } from "@/lib/conta";
import { usuarioAtual } from "@/lib/usuario";
import { classeBotaoConta } from "./classeBotaoConta";
import LinkCadastro from "./LinkCadastro";
import LinkEntrar from "./LinkEntrar";

/**
 * Canto da conta no cabeçalho: "Entrar", ou "Olá, {nome}" (ou "Completar", sem nome) + "Sair".
 * Lê a sessão, então fica atrás de Suspense.
 */
export default async function AreaConta() {
  const usuario = await usuarioAtual();
  if (!usuario) return <LinkEntrar />;

  return (
    <div className="flex min-w-0 items-center gap-3">
      <LinkCadastro nome={nomeValido(usuario.nome)} email={usuario.email} />
      <form action={sair}>
        <button type="submit" className={classeBotaoConta}>
          Sair
        </button>
      </form>
    </div>
  );
}
