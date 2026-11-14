/** Visual dos botões de filtro (streaming e nota). */
export function classeFiltro(ativa: boolean, comLogo: boolean): string {
  return `flex shrink-0 items-center gap-2.5 rounded-full py-1.5 text-sm font-medium whitespace-nowrap ring-1 backdrop-blur-md transition-colors ${
    comLogo ? "pr-4 pl-1.5" : "px-5"
  } ${
    ativa
      ? "bg-projetor text-sala ring-projetor"
      : "bg-poltrona/70 text-tela/90 ring-tela/10 hover:bg-poltrona-clara hover:ring-tela/30"
  }`;
}
