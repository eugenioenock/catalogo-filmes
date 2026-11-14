import { sair } from "@/app/conta/acoes";
import { saudacao } from "@/lib/conta";
import { usuarioAtual } from "@/lib/usuario";
import { classeBotaoConta } from "./classeBotaoConta";
import LinkEntrar from "./LinkEntrar";

/**
 * Canto da conta no cabeçalho: "Entrar", ou "Olá, {nome}" + "Sair".
 * Lê a sessão, então fica atrás de Suspense.
 */
export default async function AreaConta() {
  const usuario = await usuarioAtual();
  if (!usuario) return <LinkEntrar />;

  return (
    <div className="flex min-w-0 items-center gap-3">
      {/* Aparece também no celular: max-w-24 é o que sobra ao lado do nome do site e do "Sair" em 375px.
          Nomes longos são cortados com "…"; o e-mail completo fica no title. */}
      <span className="max-w-24 truncate text-sm text-tela/85 sm:max-w-56" title={usuario.email}>
        {saudacao(usuario.nome, usuario.email)}
      </span>
      <form action={sair}>
        <button type="submit" className={classeBotaoConta}>
          Sair
        </button>
      </form>
    </div>
  );
}
