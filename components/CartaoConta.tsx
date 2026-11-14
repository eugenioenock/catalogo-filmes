import type { ReactNode } from "react";

/** Cartão das telas de conta (entrar, criar conta, completar cadastro): título, subtítulo e formulário. */
export default function CartaoConta({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-poltrona/70 p-6 ring-1 ring-tela/10 backdrop-blur-md sm:p-8">
      <h1 className="font-display text-5xl leading-[0.85] font-black uppercase">{titulo}</h1>
      <p className="mt-3 mb-7 text-nevoa">{subtitulo}</p>
      {children}
    </div>
  );
}
