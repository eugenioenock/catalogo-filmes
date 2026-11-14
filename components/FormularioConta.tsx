"use client";

import Link from "next/link";
import { useActionState } from "react";
import { criarConta, entrar } from "@/app/conta/acoes";
import type { EstadoConta, ModoConta } from "@/lib/conta";

const TEXTOS = {
  entrar: {
    botao: "Entrar",
    enviando: "Entrando…",
    pergunta: "Ainda não tem conta?",
    outraPagina: "/criar-conta",
    outroLink: "Criar conta",
    autoCompleteSenha: "current-password",
  },
  criar: {
    botao: "Criar conta",
    enviando: "Criando conta…",
    pergunta: "Já tem conta?",
    outraPagina: "/entrar",
    outroLink: "Entrar",
    autoCompleteSenha: "new-password",
  },
} as const;

const INICIAL: EstadoConta = { erro: null, email: "" };

const classeCampo =
  "w-full rounded-xl border border-tela/15 bg-sala/60 px-4 py-3 text-tela placeholder:text-nevoa transition-colors focus:border-projetor/70 focus:outline-none";

export default function FormularioConta({ modo, volta }: { modo: ModoConta; volta: string }) {
  const [estado, acao, enviando] = useActionState(modo === "entrar" ? entrar : criarConta, INICIAL);
  const t = TEXTOS[modo];
  const outraHref = volta === "/" ? t.outraPagina : `${t.outraPagina}?volta=${encodeURIComponent(volta)}`;

  return (
    <form action={acao} className="grid gap-5" noValidate>
      <input type="hidden" name="volta" value={volta} />

      <div className="grid gap-2">
        <label htmlFor="email" className="text-sm font-medium text-tela/90">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={estado.email}
          className={classeCampo}
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="senha" className="text-sm font-medium text-tela/90">
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          autoComplete={t.autoCompleteSenha}
          required
          minLength={modo === "criar" ? 6 : undefined}
          className={classeCampo}
        />
        {modo === "criar" && <p className="text-xs text-nevoa">Pelo menos 6 caracteres.</p>}
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
        {enviando ? t.enviando : t.botao}
      </button>

      <p className="text-center text-sm text-nevoa">
        {t.pergunta}{" "}
        <Link href={outraHref} className="font-semibold text-projetor hover:underline">
          {t.outroLink}
        </Link>
      </p>
    </form>
  );
}
