import { Suspense } from "react";
import { lerVolta, type ModoConta } from "@/lib/conta";
import Cabecalho from "./Cabecalho";
import CartaoConta from "./CartaoConta";
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
        <CartaoConta titulo={titulo} subtitulo={subtitulo}>
          <Suspense fallback={<div className="h-72" />}>
            <Formulario modo={modo} searchParams={searchParams} />
          </Suspense>
        </CartaoConta>
      </main>
    </>
  );
}
