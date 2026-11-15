import { formatarDataBR } from "@/lib/formatar";
import type { Versao } from "@/lib/versao";

function Lista({ titulo, itens }: { titulo: string; itens: string[] }) {
  if (itens.length === 0) return null;
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold tracking-wider text-projetor uppercase">{titulo}</h3>
      <ul className="list-disc space-y-2 pl-5 text-tela/90 marker:text-projetor/70">
        {itens.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

/** O histórico de versões, na ordem em que vem de lib/versoes.json (a mais nova primeiro). */
export default function ListaDeVersoes({ versoes }: { versoes: Versao[] }) {
  return (
    <div className="space-y-12">
      {versoes.map((v) => (
        <section key={v.versao} aria-labelledby={`versao-${v.versao}`} className="space-y-5 border-t border-tela/10 pt-8">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 id={`versao-${v.versao}`} className="text-3xl leading-none font-bold tracking-tight sm:text-4xl">
              v{v.versao}
            </h2>
            <p className="text-sm text-nevoa">{formatarDataBR(v.data)}</p>
          </div>
          <Lista titulo="Novidades" itens={v.novidades} />
          <Lista titulo="Correções e melhorias" itens={v.correcoes} />
        </section>
      ))}
    </div>
  );
}
