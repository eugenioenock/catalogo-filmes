import { formatarNota } from "@/lib/formatar";

type Props = {
  nota: number;
  itens: (string | null)[];
  className?: string;
  style?: React.CSSProperties;
};

export function Estrela({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path d="M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.6 7.7l5.8-.8z" />
    </svg>
  );
}

// Nota em destaque, seguida de ano, duração e gêneros separados por espaço.
export default function InfoFilme({ nota, itens, className = "", style }: Props) {
  return (
    <ul
      className={`flex flex-wrap items-center gap-x-5 gap-y-1.5 ${className}`}
      style={style}
    >
      <li className="flex items-center gap-1.5 font-semibold text-projetor">
        <Estrela />
        {formatarNota(nota)}
        <span className="sr-only">de 10</span>
      </li>
      {itens.filter(Boolean).map((item) => (
        <li key={item} className="text-tela/80">
          {item}
        </li>
      ))}
    </ul>
  );
}
