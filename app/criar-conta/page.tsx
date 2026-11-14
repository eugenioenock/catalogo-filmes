import type { Metadata } from "next";
import PaginaConta from "@/components/PaginaConta";

export const metadata: Metadata = { title: "Criar conta | CineCatálogo" };

export default function PaginaCriarConta({ searchParams }: PageProps<"/criar-conta">) {
  return <PaginaConta modo="criar" searchParams={searchParams} />;
}
