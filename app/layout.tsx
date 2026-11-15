import type { Metadata } from "next";
import { Big_Shoulders, Instrument_Sans } from "next/font/google";
import { preconnect } from "react-dom";
import Rodape from "@/components/Rodape";
import "./globals.css";

const display = Big_Shoulders({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-big-shoulders",
});

const texto = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
});

export const metadata: Metadata = {
  title: "CineCatálogo",
  description: "Catálogo de filmes com onde assistir por streaming no Brasil.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  // Pôsteres, fundos e logos vêm direto do servidor de imagens do TMDB (sem a otimização da
  // Vercel, que no plano gratuito tem cota mensal). Abrir a conexão logo no <head> adianta a
  // primeira imagem de cada página, o que ajuda em redes lentas até esse servidor.
  preconnect("https://image.tmdb.org");

  return (
    <html
      lang="pt-BR"
      className={`${display.variable} ${texto.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-sala font-sans text-tela">
        <div className="flex-1">{children}</div>
        <Rodape />
      </body>
    </html>
  );
}
