// A foto do filme, borrada e saturada, vaza pela página como a luz de uma
// tela grande numa sala escura. Usa a mesma URL do destaque, então o
// navegador reaproveita a imagem já baixada.
export default function LuzAmbiente({ imagem }: { imagem: string | null }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[170vh] overflow-hidden [mask-image:linear-gradient(to_bottom,black_35%,transparent)]"
    >
      {imagem ? (
        <div
          className="absolute -inset-[15%] scale-110 bg-cover bg-top opacity-70 blur-[90px] saturate-[1.9]"
          style={{ backgroundImage: `url(${imagem})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_0%,color-mix(in_oklab,var(--color-projetor)_22%,transparent),transparent)]" />
      )}
    </div>
  );
}
