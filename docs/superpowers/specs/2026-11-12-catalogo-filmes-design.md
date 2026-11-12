# CineCatálogo: especificação de design

**Data:** 2026-11-12
**Status:** aprovada (2026-11-12)
**Nome:** CineCatálogo (provisório)

## 1. Objetivo

Um site público que mostra os filmes disponíveis agora nos serviços de streaming **por assinatura no Brasil**. O visitante pode navegar pela lista, filtrar por streaming, buscar pelo nome e ver os detalhes de cada filme. Os dados vêm da API do TMDB.

É um exercício do curso de Claude Code. A aula define as funcionalidades. Tecnologia, país e visual foram decididos neste brainstorming.

### Critérios de sucesso

- O site está publicado na internet com um link público (Vercel).
- As quatro funcionalidades da aula funcionam: lista de filmes, busca por nome, filtro por streaming e página de detalhes.
- A chave do TMDB nunca aparece no navegador nem no GitHub.
- O site funciona bem no celular e no computador.

### Fora desta versão

Login, favoritos, séries, trailers, filtro por gênero, escolha de país, fileiras por streaming (layout D) e streamings grátis, de aluguel ou de compra.

## 2. Decisões

| Tema | Decisão |
|---|---|
| País | Só Brasil (`watch_region=BR`) |
| Idioma | Português (`language=pt-BR`) |
| O que conta como "no streaming" | Só assinatura (`flatrate`) |
| Tecnologia | Next.js (App Router) + TypeScript + Tailwind |
| Publicação | GitHub + Vercel |
| Layout | "E": visual escuro de streaming, banner em destaque e grade com filtros |
| Pasta do código | `C:\projetos\catalogo-filmes` (fora do Google Drive, onde o `npm` falha) |

## 3. Telas

### 3.1 Catálogo (`/`)

De cima para baixo:

1. **Barra superior:** nome do site (link para `/`) e campo de busca.
2. **Banner em destaque:** imagem de fundo larga (backdrop), título, ano, gêneros, nota, sinopse curta (até 2 linhas) e botão "Ver detalhes". Mostra o **primeiro filme da lista atual**. Aparece só na página 1 e quando não há busca ativa.
3. **Botões de streaming:** "Todos" e mais os **10 principais serviços** do Brasil. O botão do filtro ativo fica destacado. No celular, a fileira de botões rola para o lado.
4. **Grade de filmes:** cartões com pôster, título e ano, 20 por página. O cartão leva a `/filme/[id]`. A grade tem 2 colunas no celular e até 6 no computador.
5. **Paginação:** botões "← Anterior", "Página N" e "Próxima →". "Anterior" some na página 1 e "Próxima" some na última.
6. **Rodapé:** créditos obrigatórios (ver seção 3.3).

**Estado no endereço da página.** Todos os filtros ficam na URL:

| Parâmetro | Significado | Padrão |
|---|---|---|
| `streaming` | ID do serviço no TMDB (ex.: `8` = Netflix) | nenhum (todos) |
| `busca` | texto buscado | nenhum |
| `pagina` | número da página | `1` |

Regras:
- Ao trocar de streaming, `pagina` volta para 1 e `busca` é mantida.
- A busca é enviada com Enter ou com o botão (formulário). Ela não roda a cada letra digitada.
- Ao fazer uma nova busca, `pagina` volta para 1 e `streaming` é mantido.
- Um `pagina` inválido (texto, zero ou negativo) vira 1. Um `pagina` acima da última página vira a última página.

### 3.2 Detalhes (`/filme/[id]`)

- Imagem de fundo larga (backdrop) e pôster.
- Título, ano, duração (ex.: "2h 15min"), gêneros e nota (uma casa decimal, ex.: "7,8").
- Sinopse em português. Se não houver: "Sinopse não disponível em português."
- **"Onde assistir":** os logos e nomes dos streamings por assinatura no Brasil. Se não houver nenhum: "No momento, este filme não está em nenhum streaming por assinatura no Brasil."
- Link "← Voltar ao catálogo".

### 3.3 Créditos (rodapé de todas as páginas)

- "Dados de streaming fornecidos pelo JustWatch." O TMDB exige esse crédito para usar os dados de watch providers.
- Logo do TMDB e o aviso "Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB." O TMDB também exige esse aviso.

### 3.4 Visual

- Fundo escuro, texto claro e uma cor de destaque própria (âmbar). O site não usa a marca, o logo nem as cores da Netflix.
- Os botões de streaming têm o formato de pílula. O ativo fica preenchido com a cor de destaque.
- O banner tem um degradê escuro por cima da imagem, para o texto ficar legível.

## 4. Arquitetura

```
Navegador  →  Servidor Next.js (Vercel)  →  API do TMDB
              guarda TMDB_TOKEN
           ←  página HTML já montada     ←  JSON
```

- Todas as chamadas ao TMDB rodam no **servidor** (Server Components). O navegador nunca recebe a chave.
- A chave fica na variável de ambiente `TMDB_TOKEN`: no arquivo `.env.local` durante o desenvolvimento (fora do Git) e no painel da Vercel em produção.
- As respostas do TMDB ficam em cache por **1 hora** (`next: { revalidate: 3600 }`).

### 4.1 Peças

| Peça | Responsabilidade | Depende de |
|---|---|---|
| `lib/tmdb.ts` | **Único** módulo que fala com o TMDB. Monta as URLs, envia a chave, converte as respostas para tipos simples do app e trata erros. | `TMDB_TOKEN`, `fetch` |
| `app/page.tsx` | Lê `streaming`, `busca` e `pagina` da URL, chama `lib/tmdb.ts` e monta a tela do catálogo | `lib/tmdb.ts`, componentes |
| `app/filme/[id]/page.tsx` | Busca os detalhes e monta a tela do filme | `lib/tmdb.ts`, componentes |
| `app/error.tsx` | Tela de erro amigável com botão "Tentar de novo" | — |
| `app/not-found.tsx` | Tela "Filme não encontrado" | — |
| `components/` | `Cabecalho`, `CampoBusca`, `Banner`, `FiltroStreamings`, `GradeFilmes`, `CartaoFilme`, `Paginacao`, `Rodape`. Cada um num arquivo, recebendo dados prontos por props. | — |

### 4.2 Funções de `lib/tmdb.ts`

| Função | Endpoint do TMDB | Observações |
|---|---|---|
| `listarStreamings()` | `GET /3/watch/providers/movie?watch_region=BR&language=pt-BR` | Ordena por `display_priorities.BR` e devolve os 10 primeiros (id, nome, logo) |
| `listarFilmes({ streaming?, pagina })` | `GET /3/discover/movie?watch_region=BR&with_watch_monetization_types=flatrate&language=pt-BR&sort_by=popularity.desc&page=N` mais `with_watch_providers=ID` quando houver filtro | Limita `totalPaginas` a 500 |
| `buscarFilmes({ texto, streaming?, pagina })` | `GET /3/search/movie?query=…&language=pt-BR&page=N`, depois `GET /3/movie/{id}/watch/providers` para cada resultado (em paralelo) | Mantém só os filmes com `results.BR.flatrate` não vazio e, se houver filtro, os que incluem aquele streaming. Uma página pode ter menos de 20 filmes. |
| `detalharFilme(id)` | `GET /3/movie/{id}?language=pt-BR&append_to_response=watch/providers` | Os streamings vêm de `["watch/providers"].results.BR.flatrate`. Um 404 do TMDB vira "não encontrado". |

- Autenticação: cabeçalho `Authorization: Bearer ${TMDB_TOKEN}`.
- Imagens vêm de `https://image.tmdb.org/t/p/`: pôster `w342`, backdrop `w1280` e logo `w92`. O domínio entra em `images.remotePatterns` no `next.config`.

## 5. Erros

| Situação | Comportamento |
|---|---|
| `TMDB_TOKEN` ausente | Erro com mensagem clara para o desenvolvedor: "Defina TMDB_TOKEN no .env.local (local) ou nas variáveis de ambiente da Vercel." |
| TMDB fora do ar, lento ou com resposta de erro | `app/error.tsx`: "Não conseguimos carregar os filmes agora." e botão "Tentar de novo" |
| Busca sem resultados no streaming | Na grade: "Nenhum filme com esse nome está no streaming agora." |
| Filme sem pôster ou sem backdrop | Imagem padrão com o título escrito |
| `/filme/[id]` com id inexistente ou inválido | `not-found.tsx` com link para o catálogo |
| `pagina` inválida ou acima da última | Corrigida conforme as regras da seção 3.1 |

## 6. Testes

- **Automáticos (Vitest)** para `lib/tmdb.ts`, com `fetch` simulado (sem internet e sem gastar a chave):
  - as URLs levam `watch_region=BR`, `flatrate`, `pt-BR` e o streaming escolhido;
  - `listarStreamings` devolve 10 serviços, ordenados pela prioridade do Brasil;
  - `buscarFilmes` descarta os filmes que não estão em streaming por assinatura e respeita o filtro de streaming;
  - `totalPaginas` é limitado a 500;
  - um 404 vira "não encontrado", outros erros viram falha;
  - falta de `TMDB_TOKEN` gera a mensagem clara.
- **Roteiro manual** antes de publicar: abrir o catálogo, trocar de streaming, navegar pelas páginas, buscar um nome, abrir um filme, abrir um id inexistente e repetir tudo com a tela do tamanho de um celular.

## 7. Publicação e pré-requisitos

1. Conta no TMDB e o **API Read Access Token** (vai em `TMDB_TOKEN`).
2. Conta no GitHub. O código vai para um repositório e `.env.local` fica no `.gitignore`.
3. Conta na Vercel (login com o GitHub). Importar o repositório e cadastrar `TMDB_TOKEN` nas variáveis de ambiente.
4. Node.js (já instalado em `C:\Program Files\nodejs`).
