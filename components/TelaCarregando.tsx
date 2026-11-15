/**
 * O que aparece enquanto uma página carrega. Ocupa ao menos a altura da tela (svh: a altura
 * com as barras do navegador do celular à mostra): assim o rodapé já começa fora da vista e
 * não dá um pulo para baixo quando o conteúdo chega.
 */
export default function TelaCarregando() {
  return (
    <p className="font-display min-h-svh p-16 text-center text-2xl font-bold text-nevoa uppercase motion-safe:animate-pulse">
      Apagando as luzes…
    </p>
  );
}
