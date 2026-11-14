import type { Metadata } from "next";
import { Big_Shoulders, Instrument_Sans } from "next/font/google";
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
