import "server-only";

import { chaveDoTitulo, type Tipo } from "./listas";
import { listarTodasMarcacoes } from "./marcacoes";
import {
  CANDIDATOS_CHECADOS,
  MARCAS_DO_PERFIL,
  MAX_CARTOES,
  MINIMO_ANTES_DA_RESERVA,
  escolherSementes,
  perfilDeGeneros,
  pesoDaSituacao,
  pontuarCandidatos,
  textoDoMotivo,
  type Marca,
} from "./recomendacoes";
import {
  detalharFilme,
  detalharSerie,
  listarTitulos,
  nomesDosGeneros,
  recomendacoesDe,
  streamingsDoTitulo,
  type FilmeResumo,
  type Streaming,
} from "./tmdb";

export type Recomendacao = { titulo: FilmeResumo; streaming: Streaming; motivo: string };

type Filtros = { tipo: Tipo; streaming: number | null; nota: number | null };

/**
 * O streaming que o cartão mostra, ou null se o título não serve:
 * com filtro ativo, só quem está naquele streaming (e o logo é o dele); sem filtro, o primeiro.
 */
async function streamingParaMostrar(titulo: FilmeResumo, filtro: number | null): Promise<Streaming | null> {
  const lista = await streamingsDoTitulo(titulo.tipo, titulo.id);
  return filtro === null ? (lista[0] ?? null) : (lista.find((s) => s.id === filtro) ?? null);
}

/** Checa o streaming de cada título em paralelo; quem falha ou não está em streaming sai. */
async function comStreaming<T extends { titulo: FilmeResumo }>(
  itens: T[],
  filtro: number | null,
): Promise<(T & { streaming: Streaming })[]> {
  const onde = await Promise.allSettled(itens.map((i) => streamingParaMostrar(i.titulo, filtro)));
  return itens.flatMap((item, i) => {
    const r = onde[i];
    return r.status === "fulfilled" && r.value ? [{ ...item, streaming: r.value }] : [];
  });
}

/** Reserva: os títulos populares dos gêneros mais fortes das marcações, convertidos para o tipo da aba. */
async function reservaPorGenero(
  o: Filtros,
  marcas: Marca[],
  jaUsados: Set<string>,
  vagas: number,
): Promise<Recomendacao[]> {
  const recentes = marcas.slice(0, MARCAS_DO_PERFIL);
  const detalhes = await Promise.allSettled(
    recentes.map((m) => (m.tipo === "filme" ? detalharFilme(m.id) : detalharSerie(m.id))),
  );
  const itens = recentes.flatMap((m, i) => {
    const d = detalhes[i];
    return d.status === "fulfilled" ? [{ tipo: m.tipo, generoIds: d.value.generoIds, peso: pesoDaSituacao(m.situacao) }] : [];
  });
  const perfil = perfilDeGeneros(itens, o.tipo);
  if (perfil.length === 0) return [];

  const [nomes, pagina] = await Promise.all([
    nomesDosGeneros(o.tipo),
    listarTitulos({ tipo: o.tipo, generos: perfil, streaming: o.streaming, nota: o.nota, pagina: 1 }),
  ]);
  const novos = pagina.filmes.filter((t) => !jaUsados.has(chaveDoTitulo(t))).map((titulo) => ({ titulo }));
  const disponiveis = await comStreaming(novos, o.streaming);

  return disponiveis.slice(0, vagas).map(({ titulo, streaming }) => {
    // O gênero do perfil que o título tem; se o TMDB não trouxe nenhum, o mais forte do perfil.
    const nomeDoPerfil = perfil.map((id) => nomes.get(id)).filter((n): n is string => Boolean(n));
    const nome = nomeDoPerfil.find((n) => titulo.generos.includes(n)) ?? nomeDoPerfil[0];
    return { titulo, streaming, motivo: textoDoMotivo({ tipo: "genero", nome: nome ?? "títulos parecidos" }) };
  });
}

/**
 * A fileira "Para você" de quem está logado: recomendações do TMDB a partir das marcações
 * recentes do tipo da aba e, se sobrarem poucas, a reserva por gênero. Lista vazia = sem fileira.
 */
export async function montarParaVoce(o: Filtros): Promise<Recomendacao[]> {
  const marcas = await listarTodasMarcacoes();
  if (marcas.length === 0) return [];
  // Todas as marcações (não só as recentes) ficam fora da fileira.
  const marcadas = new Set(marcas.map(chaveDoTitulo));

  const sementes = escolherSementes(marcas, o.tipo);
  const respostas = await Promise.allSettled(sementes.map((s) => recomendacoesDe(s.tipo, s.id)));
  const porSemente = sementes.map((semente, i) => {
    const r = respostas[i];
    return { semente, candidatos: r.status === "fulfilled" ? r.value : [] };
  });
  const pontuados = pontuarCandidatos({ porSemente, marcadas, nota: o.nota }).slice(0, CANDIDATOS_CHECADOS);
  const fileira: Recomendacao[] = (await comStreaming(pontuados, o.streaming))
    .slice(0, MAX_CARTOES)
    .map(({ titulo, streaming, semente }) => ({
      titulo,
      streaming,
      motivo: textoDoMotivo({ tipo: "semente", situacao: semente.situacao, titulo: semente.titulo }),
    }));

  if (fileira.length >= MINIMO_ANTES_DA_RESERVA) return fileira;

  const jaUsados = new Set([...marcadas, ...fileira.map((r) => chaveDoTitulo(r.titulo))]);
  // Os cartões das sementes já são bons: perdê-los porque o plano B falhou seria pior para quem usa.
  try {
    const reserva = await reservaPorGenero(o, marcas, jaUsados, MAX_CARTOES - fileira.length);
    return [...fileira, ...reserva];
  } catch (erro) {
    console.error("[para você] reserva:", erro instanceof Error ? erro.message : String(erro));
    return fileira;
  }
}
