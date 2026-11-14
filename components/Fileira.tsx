"use client";

import { useEffect, useRef, useState } from "react";

type Props = { id: string; titulo: string; children: React.ReactNode };

function Seta({ direcao }: { direcao: "esquerda" | "direita" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden>
      <path d={direcao === "esquerda" ? "m14.5 6-6 6 6 6" : "m9.5 6 6 6-6 6"} />
    </svg>
  );
}

// Fileira com rolagem lateral. No toque, arrasta-se com o dedo; com mouse,
// as setas avançam quase uma tela por clique.
export default function Fileira({ id, titulo, children }: Props) {
  const trilho = useRef<HTMLDivElement>(null);
  const [noInicio, setNoInicio] = useState(true);
  const [noFim, setNoFim] = useState(false);

  function atualizar() {
    const el = trilho.current;
    if (!el) return;
    setNoInicio(el.scrollLeft < 8);
    setNoFim(el.scrollLeft + el.clientWidth > el.scrollWidth - 8);
  }

  useEffect(() => {
    atualizar();
    window.addEventListener("resize", atualizar);
    return () => window.removeEventListener("resize", atualizar);
  }, []);

  function rolar(sentido: 1 | -1) {
    const el = trilho.current;
    if (!el) return;
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: sentido * el.clientWidth * 0.8, behavior: reduzir ? "auto" : "smooth" });
  }

  const botao =
    "grid size-10 place-items-center rounded-full bg-poltrona/80 text-tela ring-1 ring-tela/15 backdrop-blur transition-colors hover:bg-projetor hover:text-sala disabled:pointer-events-none disabled:opacity-30";

  return (
    <section aria-labelledby={id}>
      <div className="mx-auto flex max-w-7xl items-end justify-between gap-4 px-4 sm:px-8">
        <h2 id={id} className="font-display text-3xl leading-none font-extrabold uppercase sm:text-4xl">
          {titulo}
        </h2>
        <div className="hidden gap-2 sm:flex">
          <button type="button" className={botao} onClick={() => rolar(-1)} disabled={noInicio} aria-label="Voltar a fileira">
            <Seta direcao="esquerda" />
          </button>
          <button type="button" className={botao} onClick={() => rolar(1)} disabled={noFim} aria-label="Avançar a fileira">
            <Seta direcao="direita" />
          </button>
        </div>
      </div>
      <div
        ref={trilho}
        onScroll={atualizar}
        className="sem-barra-rolagem snap-x snap-mandatory overflow-x-auto [--margem:max(1rem,calc((100%_-_80rem)/2_+_1rem))] [scroll-padding-inline:var(--margem)] sm:[--margem:max(2rem,calc((100%_-_80rem)/2_+_2rem))]"
      >
        {children}
      </div>
    </section>
  );
}
