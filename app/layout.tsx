import type { Metadata } from "next";
import Rodape from "@/components/Rodape";
import "./globals.css";

export const metadata: Metadata = {
  title: "CineCatálogo",
  description: "Catálogo de filmes com onde assistir por streaming no Brasil.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100">
        <div className="flex-1">{children}</div>
        <Rodape />
      </body>
    </html>
  );
}
