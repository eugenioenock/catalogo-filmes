"use client";

import { useActionState } from "react";
import { alternarMarcacao, type EstadoMarcar } from "@/app/marcacoes/acoes";
import { NOME_DA_SITUACAO, SITUACOES, type Situacao, type Tipo } from "@/lib/listas";
import { classeFiltro } from "./classeFiltro";

const INICIAL: EstadoMarcar = { erro: null };

function BotaoMarcar({ tipo, id, situacao, acesa }: { tipo: Tipo; id: number; situacao: Situacao; acesa: boolean }) {
  const [estado, acao, enviando] = useActionState(alternarMarcacao.bind(null, tipo, id, situacao), INICIAL);
  return (
    <form action={acao} className="contents">
      <button
        type="submit"
        aria-pressed={acesa}
        disabled={enviando}
        className={`${classeFiltro(acesa, false)} disabled:cursor-wait disabled:opacity-70`}
      >
        {acesa ? "✓" : "+"} {NOME_DA_SITUACAO[situacao]}
      </button>
      {estado.erro && (
        <p role="alert" className="basis-full text-sm text-red-200">
          {estado.erro}
        </p>
      )}
    </form>
  );
}

export default function FormularioMarcar({ tipo, id, situacao }: { tipo: Tipo; id: number; situacao: Situacao | null }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {SITUACOES.map((s) => (
        <BotaoMarcar key={s} tipo={tipo} id={id} situacao={s} acesa={situacao === s} />
      ))}
    </div>
  );
}
