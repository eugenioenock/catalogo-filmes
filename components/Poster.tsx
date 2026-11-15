"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";

type Props = {
  src: string | null;
  alt: string;
  sizes: string;
  className?: string;
  /** O que fica no lugar quando não há pôster ou ele não carrega (em geral, o nome do título). */
  semImagem: ReactNode;
};

/**
 * O pôster de um título, preenchendo a moldura de quem o usa. Sem pôster, ou se a imagem
 * não carregar (rede lenta até o servidor de imagens do TMDB), mostra `semImagem` no lugar
 * de uma imagem quebrada.
 */
export default function Poster({ src, alt, sizes, className, semImagem }: Props) {
  // Guarda QUAL endereço falhou: se o mesmo componente receber outro título, ele tenta de novo.
  const [falhouEm, setFalhouEm] = useState<string | null>(null);

  if (!src || falhouEm === src) {
    return (
      <div data-poster-falhou={src ? "" : undefined} className="contents">
        {semImagem}
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      onError={() => setFalhouEm(src)}
      // A imagem pode falhar antes de o React assumir a página, e aí o onError não dispara:
      // ao ligar o elemento, uma imagem já "completa" sem largura é uma imagem que falhou.
      ref={(img) => {
        if (img?.complete && img.naturalWidth === 0) setFalhouEm(src);
      }}
    />
  );
}
