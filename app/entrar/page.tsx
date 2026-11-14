import type { Metadata } from "next";
import PaginaConta from "@/components/PaginaConta";

export const metadata: Metadata = { title: "Entrar | CineCatálogo" };

export default function PaginaEntrar({ searchParams }: PageProps<"/entrar">) {
  return <PaginaConta modo="entrar" searchParams={searchParams} />;
}
