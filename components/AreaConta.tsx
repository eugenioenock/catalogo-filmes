import { sair } from "@/app/conta/acoes";
import { usuarioAtual } from "@/lib/usuario";
import { classeBotaoConta } from "./classeBotaoConta";
import LinkEntrar from "./LinkEntrar";

/** Canto da conta no cabeçalho: "Entrar" ou o e-mail + "Sair". Lê a sessão, então fica atrás de Suspense. */
export default async function AreaConta() {
  const usuario = await usuarioAtual();
  if (!usuario) return <LinkEntrar />;

  return (
    <div className="flex min-w-0 items-center gap-3">
      {/* No celular só cabe o "Sair" ao lado do nome do site; o e-mail aparece a partir de sm. */}
      <span className="hidden max-w-56 truncate text-sm text-tela/85 sm:inline" title={usuario.email}>
        {usuario.email}
      </span>
      <form action={sair}>
        <button type="submit" className={classeBotaoConta}>
          Sair
        </button>
      </form>
    </div>
  );
}
