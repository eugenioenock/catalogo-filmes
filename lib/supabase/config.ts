/**
 * URL e chave pública do Supabase, lidas do ambiente (.env.local ou Vercel).
 * Devolve null se faltar alguma: o site continua funcionando, só sem login e listas.
 * As variáveis são lidas pelo nome literal para o Next conseguir embuti-las no build.
 */
export function configSupabase(): { url: string; chave: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !chave) return null;
  return { url, chave };
}
