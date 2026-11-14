import { Suspense } from "react";
import { lerVolta, type ModoConta } from "@/lib/conta";
import Cabecalho from "./Cabecalho";
import FormularioConta from "./FormularioConta";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const TITULOS: Record<ModoConta, { titulo: string; subtitulo: string }> = {
  entrar: {
    titulo: "Entrar",
    subtitulo: "Entre para ver e marcar seus filmes em Quero assistir e Já assisti.",
  },
  criar: {
    titulo: "Criar conta",
    subtitulo: "Crie sua conta para guardar os filmes que quer ver e os que já viu.",
  },
};

async function Formulario({ modo, searchParams }: { modo: ModoConta; searchParams: SearchParams }) {
  const volta = (await searchParams).volta;
  return <FormularioConta modo={modo} volta={lerVolta(Array.isArray(volta) ? volta[0] : volta)} />;
}

/** Tela comum de /entrar e /criar-conta. */
export default function PaginaConta({
  modo,
  searchParams,
}: {
  modo: ModoConta;
  searchParams: SearchParams;
}) {
  const { titulo, subtitulo } = TITULOS[modo];
  return (
    <>
      <Cabecalho busca={null} streaming={null} />
      <main className="mx-auto w-full max-w-md px-4 pt-10 pb-24 sm:pt-16">
        <div className="rounded-3xl bg-poltrona/70 p-6 ring-1 ring-tela/10 backdrop-blur-md sm:p-8">
          <h1 className="font-display text-5xl leading-[0.85] font-black uppercase">{titulo}</h1>
          <p className="mt-3 mb-7 text-nevoa">{subtitulo}</p>
          <Suspense fallback={<div className="h-72" />}>
            <Formulario modo={modo} searchParams={searchParams} />
          </Suspense>
        </div>
      </main>
    </>
  );
}
