"use client";

import { useActionState } from "react";
import { salvarNome } from "@/app/conta/acoes";
import { NOME_MAXIMO } from "@/lib/conta";

const classeCampo =
  "w-full rounded-xl border border-tela/15 bg-sala/60 px-4 py-3 text-tela placeholder:text-nevoa transition-colors focus:border-projetor/70 focus:outline-none";

/** Formulário da tela Completar cadastro: só o nome. */
export default function FormularioNome({ nomeAtual, volta }: { nomeAtual: string | null; volta: string }) {
  const [estado, acao, enviando] = useActionState(salvarNome, { erro: null, nome: nomeAtual ?? "" });

  return (
    <form action={acao} className="grid gap-5" noValidate>
      <input type="hidden" name="volta" value={volta} />

      <div className="grid gap-2">
        <label htmlFor="nome" className="text-sm font-medium text-tela/90">
          Como quer ser chamado?
        </label>
        <input
          id="nome"
          name="nome"
          type="text"
          autoComplete="given-name"
          required
          maxLength={NOME_MAXIMO}
          defaultValue={estado.nome}
          className={classeCampo}
        />
      </div>

      {estado.erro && (
        <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200 ring-1 ring-red-400/30">
          {estado.erro}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="rounded-full bg-projetor px-7 py-3 font-semibold text-sala shadow-[0_8px_32px_-8px] shadow-projetor/60 transition-colors hover:bg-projetor-forte disabled:cursor-wait disabled:opacity-70"
      >
        {enviando ? "Salvando…" : nomeAtual ? "Salvar" : "Salvar e continuar"}
      </button>
    </form>
  );
}
