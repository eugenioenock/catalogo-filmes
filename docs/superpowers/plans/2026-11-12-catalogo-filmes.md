# CineCatálogo: plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para implementar este plano tarefa por tarefa. Os passos usam checkbox (`- [ ]`) para acompanhamento.

**Objetivo:** construir e publicar um catálogo público dos filmes disponíveis por assinatura nos streamings do Brasil, usando a API do TMDB.

**Arquitetura:** Next.js (App Router) com Server Components. Toda chamada ao TMDB passa por `lib/tmdb.ts`, que roda só no servidor e é o único arquivo que lê `TMDB_TOKEN`. O estado da tela (streaming, busca e página) fica na URL. As páginas leem a URL, validam os dados com `lib/parametros.ts` e entregam dados prontos a componentes simples.

**Tecnologias:** Next.js (versão atual do `create-next-app`), React, TypeScript, Tailwind CSS, Vitest e Vercel.

**Spec:** `docs/superpowers/specs/2026-11-12-catalogo-filmes-design.md`

## Restrições globais

- Pasta do projeto: `C:\projetos\catalogo-filmes` (no Bash: `/c/projetos/catalogo-filmes`). Nunca rode `npm` dentro de `G:\Meu Drive`.
- Antes de qualquer comando `npm`, `npx` ou `node` no Bash: `export PATH="/c/Program Files/nodejs:$PATH"`.
- Região `BR`, idioma `pt-BR`, tipo de disponibilidade `flatrate` (só assinatura).
- Cache das respostas do TMDB: `next: { revalidate: 3600 }`.
- Filmes por página: 20, vindos do TMDB. `totalPaginas` nunca passa de `500`.
- Botões de streaming: os 10 primeiros por `display_priorities.BR`.
- Imagens: `https://image.tmdb.org/t/p/` com `w342` (pôster), `w1280` (backdrop) e `w92` (logo).
- Textos da interface em português e exatamente como na spec (as frases entre aspas abaixo copiam a spec).
- Visual: fundo escuro, texto claro, destaque âmbar (`amber-500` do Tailwind). Nada da marca, logo ou cores da Netflix.
- `TMDB_TOKEN` nunca vai para o Git (`.env.local` no `.gitignore`) e nunca é importado por um Client Component.

## Foco da revisão

1. **`pagina` inválida na URL** (`abc`, `0`, `-3`, `2.5`, `9999`) deve virar uma página válida, sem erro. Teste em `lib/parametros.test.ts` (Tarefa 2) e redirecionamento para a última página na Tarefa 5.
2. **Busca com espaços, acentos ou símbolos** (`"  "`, `"O Poderoso Chefão"`, `"Tom & Jerry"`): busca só com espaços conta como "sem busca", e o texto vai codificado na URL do TMDB. Testes nas Tarefas 2 e 4.
3. **`streaming` inválido** (`netflix`, `-1`, `8abc`) deve ser ignorado e o app mostra "Todos". Teste na Tarefa 2.
4. **Filme sem pôster, backdrop, sinopse, duração ou dados do Brasil** deve aparecer com as alternativas da spec, sem quebrar. Testes nas Tarefas 3 e 4.
5. **`/filme/abc` ou `/filme/0`** deve mostrar "Filme não encontrado" sem chamar o TMDB. Teste em `lerIdFilme` (Tarefa 2).

---

### Tarefa 1: Criar o projeto e configurar os testes

**Arquivos:**
- Criar: `C:\projetos\catalogo-filmes\` (via `create-next-app`)
- Criar: `vitest.config.ts`, `lib/smoke.test.ts` (apagado no fim da tarefa), `.env.example`
- Modificar: `package.json` (script `test`), `.gitignore` (confirmar `.env*.local`)
- Copiar: `G:\Meu Drive\Curso Claude Code\docs\` → `C:\projetos\catalogo-filmes\docs\`

**Interfaces:**
- Produz: o comando `npm test` (Vitest, ambiente `node`, alias `@/` → raiz do projeto) e a estrutura `app/` sem `src/`.

- [ ] **Passo 1: Conferir o Node**

Rode: `export PATH="/c/Program Files/nodejs:$PATH"; node -v; npm -v`
Esperado: versões impressas (Node v26.x).

- [ ] **Passo 2: Criar o projeto**

Rode:
```bash
mkdir -p /c/projetos && cd /c/projetos
npx create-next-app@latest catalogo-filmes --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --yes
```
Esperado: a pasta `/c/projetos/catalogo-filmes` existe e o `create-next-app` termina com "Success".

- [ ] **Passo 3: Instalar o Vitest**

Rode: `cd /c/projetos/catalogo-filmes && npm install -D vitest`
Crie `vitest.config.ts` com `test.environment = "node"` e `resolve.alias` `{"@": <raiz do projeto>}`. Adicione `"test": "vitest run"` em `package.json`.

- [ ] **Passo 4: Teste de fumaça**

`lib/smoke.test.ts`: `expect(1 + 1).toBe(2)`.
Rode: `npm test`
Esperado: 1 teste passando. Depois apague `lib/smoke.test.ts`.

- [ ] **Passo 5: Variáveis de ambiente e docs**

- `.env.example` com uma linha: `TMDB_TOKEN=cole_aqui_o_API_Read_Access_Token`
- Confirme que o `.gitignore` contém `.env*.local` (ou `.env*`) **e não** ignora `.env.example`.
- Copie a pasta `docs/` do curso para o projeto: `cp -r "/g/Meu Drive/Curso Claude Code/docs" /c/projetos/catalogo-filmes/`

- [ ] **Passo 6: Commit**

```bash
git add -A
git commit -m "chore: configura Vitest, .env.example e docs do projeto"
```

---

### Tarefa 2: Ler e validar a URL (`lib/parametros.ts`)

**Arquivos:**
- Criar: `lib/parametros.ts`
- Teste: `lib/parametros.test.ts`

**Interfaces:**
- Produz:
  ```ts
  export type FiltrosCatalogo = { streaming: number | null; busca: string | null; pagina: number };
  export function lerFiltros(params: Record<string, string | string[] | undefined>): FiltrosCatalogo;
  export function lerIdFilme(valor: string): number | null;
  export function montarHref(atual: FiltrosCatalogo, mudancas: Partial<FiltrosCatalogo>): string;
  ```

- [ ] **Passo 1: Escrever os testes que falham**

```ts
describe("lerFiltros", () => {
  it("usa padrões quando a URL está vazia", () =>
    expect(lerFiltros({})).toEqual({ streaming: null, busca: null, pagina: 1 }));
  it.each(["abc", "0", "-3", "2.5", ""])("pagina inválida %s vira 1", (p) =>
    expect(lerFiltros({ pagina: p }).pagina).toBe(1));
  it("pagina acima de 500 vira 500", () => expect(lerFiltros({ pagina: "9999" }).pagina).toBe(500));
  it("lê streaming numérico", () => expect(lerFiltros({ streaming: "8" }).streaming).toBe(8));
  it.each(["netflix", "-1", "8abc", "0"])("streaming inválido %s vira null", (s) =>
    expect(lerFiltros({ streaming: s }).streaming).toBeNull());
  it("tira espaços da busca", () => expect(lerFiltros({ busca: "  Duna " }).busca).toBe("Duna"));
  it("busca só com espaços vira null", () => expect(lerFiltros({ busca: "   " }).busca).toBeNull());
  it("usa o primeiro valor quando o parâmetro se repete", () =>
    expect(lerFiltros({ pagina: ["3", "7"] }).pagina).toBe(3));
});

describe("lerIdFilme", () => {
  it("aceita inteiro positivo", () => expect(lerIdFilme("27205")).toBe(27205));
  it.each(["abc", "0", "-5", "1.5", ""])("rejeita %s", (v) => expect(lerIdFilme(v)).toBeNull());
});

describe("montarHref", () => {
  const atual = { streaming: 8, busca: "duna", pagina: 3 };
  it("trocar de streaming volta para a página 1 e mantém a busca", () =>
    expect(montarHref(atual, { streaming: 337 })).toBe("/?streaming=337&busca=duna"));
  it("nova busca volta para a página 1 e mantém o streaming", () =>
    expect(montarHref(atual, { busca: "batman" })).toBe("/?streaming=8&busca=batman"));
  it("mudar a página mantém o resto", () =>
    expect(montarHref(atual, { pagina: 4 })).toBe("/?streaming=8&busca=duna&pagina=4"));
  it("'Todos' remove o streaming e volta para a página 1", () =>
    expect(montarHref(atual, { streaming: null })).toBe("/?busca=duna"));
  it("omite os valores padrão", () =>
    expect(montarHref({ streaming: null, busca: null, pagina: 1 }, {})).toBe("/"));
  it("codifica a busca", () =>
    expect(montarHref({ streaming: null, busca: null, pagina: 1 }, { busca: "Tom & Jerry" }))
      .toBe("/?busca=Tom+%26+Jerry"));
});
```

- [ ] **Passo 2: Rodar e ver falhar**

Rode: `npm test -- lib/parametros.test.ts`
Esperado: FALHA (o módulo ainda não existe).

- [ ] **Passo 3: Implementar `lib/parametros.ts`**

Inteiros só por regex `^\d+$`. A ordem dos parâmetros em `montarHref` é `streaming`, `busca`, `pagina`, montados com `URLSearchParams`. Quando `mudancas` traz a chave `streaming` ou `busca` (e não traz `pagina`), a página vira 1. Use `"streaming" in mudancas`, porque a pílula "Todos" passa `{ streaming: null }`. `pagina=1` e valores `null` não entram na URL.

- [ ] **Passo 4: Rodar e ver passar**

Rode: `npm test -- lib/parametros.test.ts`
Esperado: todos passando.

- [ ] **Passo 5: Commit**

```bash
git add lib/parametros.ts lib/parametros.test.ts
git commit -m "feat: lê e valida filtros e id da URL"
```

---

### Tarefa 3: Base do cliente TMDB, streamings e formatação

**Arquivos:**
- Criar: `lib/tmdb.ts`, `lib/formatar.ts`
- Teste: `lib/tmdb.test.ts`, `lib/formatar.test.ts`

**Interfaces:**
- Produz (em `lib/tmdb.ts`; a primeira linha do arquivo é `import "server-only";` e o pacote `server-only` deve ser instalado):
  ```ts
  export type Streaming = { id: number; nome: string; logoUrl: string };
  export class FilmeNaoEncontradoError extends Error {}
  export class TmdbIndisponivelError extends Error {}
  export function imagemUrl(caminho: string | null, tamanho: "w92" | "w342" | "w1280"): string | null;
  export async function listarStreamings(): Promise<Streaming[]>;
  // interno, mas exportado para as Tarefas 4 e 6:
  export async function tmdbGet<T>(caminho: string, params?: Record<string, string>): Promise<T>;
  ```
- Produz (em `lib/formatar.ts`):
  ```ts
  export function formatarDuracao(minutos: number | null): string | null; // 135 → "2h 15min", 45 → "45min", 120 → "2h", null/0 → null
  export function formatarNota(nota: number): string;                     // 7.83 → "7,8", 8 → "8,0"
  export function anoDe(data: string | null | undefined): string | null;  // "2024-03-01" → "2024", "" → null
  ```

- [ ] **Passo 1: Escrever os testes que falham**

Em `lib/tmdb.test.ts`, use `vi.mock("server-only", () => ({}))`, `vi.stubEnv("TMDB_TOKEN", "tok")` e `vi.stubGlobal("fetch", vi.fn())`. Uma função auxiliar `responder(json, status = 200)` devolve `new Response(JSON.stringify(json), { status })`.

```ts
it("sem TMDB_TOKEN dá a mensagem para o desenvolvedor", async () => {
  vi.stubEnv("TMDB_TOKEN", "");
  await expect(tmdbGet("/x")).rejects.toThrow(
    "Defina TMDB_TOKEN no .env.local (local) ou nas variáveis de ambiente da Vercel.");
});
it("manda o token, usa https://api.themoviedb.org/3 e cache de 1 hora", async () => {
  fetchMock.mockResolvedValue(responder({}));
  await tmdbGet("/movie/1", { language: "pt-BR" });
  const [url, init] = fetchMock.mock.calls[0];
  expect(String(url)).toBe("https://api.themoviedb.org/3/movie/1?language=pt-BR");
  expect(init.headers.Authorization).toBe("Bearer tok");
  expect(init.next).toEqual({ revalidate: 3600 });
});
it("404 vira FilmeNaoEncontradoError", async () => {
  fetchMock.mockResolvedValue(responder({}, 404));
  await expect(tmdbGet("/movie/1")).rejects.toBeInstanceOf(FilmeNaoEncontradoError);
});
it.each([500, 401, 429])("status %i vira TmdbIndisponivelError", async (s) => {
  fetchMock.mockResolvedValue(responder({}, s));
  await expect(tmdbGet("/x")).rejects.toBeInstanceOf(TmdbIndisponivelError);
});
it("falha de rede vira TmdbIndisponivelError", async () => {
  fetchMock.mockRejectedValue(new TypeError("fetch failed"));
  await expect(tmdbGet("/x")).rejects.toBeInstanceOf(TmdbIndisponivelError);
});
it("imagemUrl monta a URL e aceita caminho nulo", () => {
  expect(imagemUrl("/a.jpg", "w342")).toBe("https://image.tmdb.org/t/p/w342/a.jpg");
  expect(imagemUrl(null, "w342")).toBeNull();
});
it("listarStreamings pede BR/pt-BR e devolve os 10 primeiros por display_priorities.BR", async () => {
  const results = Array.from({ length: 15 }, (_, i) => ({
    provider_id: i + 1, provider_name: `S${i + 1}`, logo_path: `/l${i + 1}.png`,
    display_priorities: { BR: 15 - i },
  }));
  fetchMock.mockResolvedValue(responder({ results }));
  const lista = await listarStreamings();
  expect(String(fetchMock.mock.calls[0][0])).toContain("/watch/providers/movie?watch_region=BR&language=pt-BR");
  expect(lista).toHaveLength(10);
  expect(lista[0]).toEqual({ id: 15, nome: "S15", logoUrl: "https://image.tmdb.org/t/p/w92/l15.png" });
});
it("listarStreamings ignora serviços sem prioridade para o Brasil", async () => {
  fetchMock.mockResolvedValue(responder({ results: [
    { provider_id: 1, provider_name: "A", logo_path: "/a.png", display_priorities: { US: 1 } },
    { provider_id: 2, provider_name: "B", logo_path: "/b.png", display_priorities: { BR: 3 } },
  ] }));
  expect((await listarStreamings()).map((s) => s.id)).toEqual([2]);
});
```

Em `lib/formatar.test.ts`, um `it` para cada exemplo dos comentários da interface acima.

- [ ] **Passo 2: Rodar e ver falhar**

Rode: `npm test -- lib/tmdb.test.ts lib/formatar.test.ts`
Esperado: FALHA (os módulos ainda não existem).

- [ ] **Passo 3: Implementar**

Instale: `npm install server-only`. Implemente `lib/formatar.ts` e a base de `lib/tmdb.ts` conforme as interfaces. O token é lido em cada chamada a `tmdbGet`, não no carregamento do módulo, para o teste com `vi.stubEnv` funcionar. Os tipos das respostas do TMDB (`TmdbProvider` etc.) são internos ao arquivo.

- [ ] **Passo 4: Rodar e ver passar**

Rode: `npm test`
Esperado: todos passando.

- [ ] **Passo 5: Commit**

```bash
git add -A
git commit -m "feat: cliente TMDB com token, cache, erros e lista de streamings"
```

---

### Tarefa 4: Listar, buscar e detalhar filmes

**Arquivos:**
- Modificar: `lib/tmdb.ts`
- Teste: `lib/tmdb.test.ts`

**Interfaces:**
- Consome: `tmdbGet`, `imagemUrl`, `Streaming`, `FilmeNaoEncontradoError` (Tarefa 3) e `anoDe` (Tarefa 3).
- Produz:
  ```ts
  export type FilmeResumo = {
    id: number; titulo: string; ano: string | null;
    posterUrl: string | null;   // w342
    backdropUrl: string | null; // w1280
    sinopse: string;            // "" quando o TMDB não tem
    nota: number; generos: string[];
  };
  export type PaginaDeFilmes = { filmes: FilmeResumo[]; pagina: number; totalPaginas: number };
  export type FilmeDetalhe = FilmeResumo & { duracaoMin: number | null; streamings: Streaming[] };
  export async function listarFilmes(o: { streaming: number | null; pagina: number }): Promise<PaginaDeFilmes>;
  export async function buscarFilmes(o: { texto: string; streaming: number | null; pagina: number }): Promise<PaginaDeFilmes>;
  export async function detalharFilme(id: number): Promise<FilmeDetalhe>;
  ```
- Os nomes dos gêneros vêm de `GET /genre/movie/list?language=pt-BR` (com o mesmo cache de 1 hora), convertendo `genre_ids` em nomes. Ids desconhecidos são descartados.

- [ ] **Passo 1: Escrever os testes que falham**

Configure o `fetchMock` para responder de acordo com a URL: `/genre/movie/list` → `{ genres: [{ id: 28, name: "Ação" }] }`. Use `filme(id, extra)` para criar um resultado do TMDB com `title`, `release_date: "2024-05-01"`, `poster_path`, `backdrop_path`, `overview`, `vote_average`, `genre_ids: [28]`.

```ts
it("listarFilmes chama discover com BR, flatrate, pt-BR, popularidade e página", async () => {
  // discover → { page: 2, total_pages: 3, results: [filme(1)] }
  const r = await listarFilmes({ streaming: null, pagina: 2 });
  const url = new URL(urlChamada("/discover/movie"));
  expect(Object.fromEntries(url.searchParams)).toMatchObject({
    watch_region: "BR", with_watch_monetization_types: "flatrate",
    language: "pt-BR", sort_by: "popularity.desc", page: "2" });
  expect(url.searchParams.has("with_watch_providers")).toBe(false);
  expect(r).toMatchObject({ pagina: 2, totalPaginas: 3 });
  expect(r.filmes[0]).toMatchObject({ id: 1, ano: "2024", generos: ["Ação"] });
});
it("listarFilmes com streaming envia with_watch_providers", async () => {
  await listarFilmes({ streaming: 8, pagina: 1 });
  expect(new URL(urlChamada("/discover/movie")).searchParams.get("with_watch_providers")).toBe("8");
});
it("totalPaginas é limitado a 500", async () => {
  // discover → total_pages: 38000
  expect((await listarFilmes({ streaming: null, pagina: 1 })).totalPaginas).toBe(500);
});
it("filme sem pôster, backdrop, sinopse e data vira null/vazio", async () => {
  // discover → results: [filme(1, { poster_path: null, backdrop_path: null, overview: "", release_date: "" })]
  expect((await listarFilmes({ streaming: null, pagina: 1 })).filmes[0])
    .toMatchObject({ posterUrl: null, backdropUrl: null, sinopse: "", ano: null });
});
it("buscarFilmes codifica o texto e mantém só quem tem flatrate no BR", async () => {
  // search → results: [filme(1), filme(2), filme(3)], total_pages: 1
  // /movie/1/watch/providers → { results: { BR: { flatrate: [{ provider_id: 8, ... }] } } }
  // /movie/2/watch/providers → { results: { BR: { rent: [{ provider_id: 2, ... }] } } }
  // /movie/3/watch/providers → { results: {} }
  const r = await buscarFilmes({ texto: "Tom & Jerry", streaming: null, pagina: 1 });
  expect(new URL(urlChamada("/search/movie")).searchParams.get("query")).toBe("Tom & Jerry");
  expect(r.filmes.map((f) => f.id)).toEqual([1]);
});
it("buscarFilmes com streaming mantém só quem está naquele serviço", async () => {
  // mesmos mocks, com /movie/2 tendo flatrate [{ provider_id: 337 }]
  const r = await buscarFilmes({ texto: "x", streaming: 337, pagina: 1 });
  expect(r.filmes.map((f) => f.id)).toEqual([2]);
});
it("detalharFilme pede append_to_response=watch/providers e monta o detalhe", async () => {
  // /movie/10 → { id: 10, title: "T", runtime: 135, genres: [{ id: 28, name: "Ação" }], ...,
  //   "watch/providers": { results: { BR: { flatrate: [{ provider_id: 8, provider_name: "Netflix", logo_path: "/n.png" }] } } } }
  const d = await detalharFilme(10);
  expect(new URL(urlChamada("/movie/10")).searchParams.get("append_to_response")).toBe("watch/providers");
  expect(d).toMatchObject({ duracaoMin: 135, generos: ["Ação"],
    streamings: [{ id: 8, nome: "Netflix", logoUrl: "https://image.tmdb.org/t/p/w92/n.png" }] });
});
it("detalharFilme sem dados do BR devolve streamings vazio e duração null", async () => {
  // /movie/11 → { ..., runtime: 0, "watch/providers": { results: { US: { flatrate: [...] } } } }
  expect(await detalharFilme(11)).toMatchObject({ streamings: [], duracaoMin: null });
});
it("detalharFilme repassa 404 como FilmeNaoEncontradoError", async () => {
  // /movie/999 → status 404
  await expect(detalharFilme(999)).rejects.toBeInstanceOf(FilmeNaoEncontradoError);
});
```

`urlChamada(trecho)` devolve a primeira URL chamada no `fetchMock` que contém `trecho`.

- [ ] **Passo 2: Rodar e ver falhar**

Rode: `npm test -- lib/tmdb.test.ts`
Esperado: os testes novos falham e os da Tarefa 3 continuam passando.

- [ ] **Passo 3: Implementar as três funções em `lib/tmdb.ts`**

Em `buscarFilmes`, as consultas de providers de cada resultado rodam em paralelo com `Promise.all`. Em `detalharFilme`, os gêneros vêm de `genres` (já com nome), sem chamar a lista de gêneros.

- [ ] **Passo 4: Rodar e ver passar**

Rode: `npm test`
Esperado: todos passando.

- [ ] **Passo 5: Commit**

```bash
git add lib/tmdb.ts lib/tmdb.test.ts
git commit -m "feat: listar, buscar e detalhar filmes no TMDB"
```

---

### Tarefa 5: Visual base, rodapé e telas de erro

**Arquivos:**
- Modificar: `app/layout.tsx`, `app/globals.css`, `next.config.ts`
- Criar: `components/Cabecalho.tsx`, `components/CampoBusca.tsx`, `components/Rodape.tsx`, `app/error.tsx`, `app/not-found.tsx`, `public/tmdb-logo.svg`

**Interfaces:**
- Produz:
  - `<Cabecalho busca={string | null} streaming={number | null} />`: nome "CineCatálogo" com link para `/`, mais o `CampoBusca`.
  - `<CampoBusca busca={string | null} streaming={number | null} />`: um `<form method="get" action="/">` com `<input name="busca">`, um `<input type="hidden" name="streaming">` quando houver streaming e um botão "Buscar". Não usa JavaScript no navegador.
  - `<Rodape />`

- [ ] **Passo 1: Configurar imagens e visual**

- `next.config.ts`: `images.remotePatterns = [{ protocol: "https", hostname: "image.tmdb.org", pathname: "/t/p/**" }]`.
- `app/layout.tsx`: `lang="pt-BR"`, título "CineCatálogo", corpo com fundo escuro (`bg-neutral-950 text-neutral-100`). Renderiza `{children}` e `<Rodape />`. O `Cabecalho` fica nas páginas, porque depende da URL.
- Remova o conteúdo de exemplo do `create-next-app` em `app/page.tsx` e `app/globals.css`. Mantenha só o import do Tailwind e o fundo escuro.

- [ ] **Passo 2: Rodapé com os créditos exatos**

`Rodape` mostra:
- "Dados de streaming fornecidos pelo JustWatch."
- O logo do TMDB (`public/tmdb-logo.svg`, baixado da página oficial de logos do TMDB: https://www.themoviedb.org/about/logos-attribution) e "Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB."

- [ ] **Passo 3: Telas de erro**

- `app/error.tsx` (Client Component, como o Next exige): "Não conseguimos carregar os filmes agora." e um botão "Tentar de novo" que chama `reset()`.
- `app/not-found.tsx`: "Filme não encontrado" e o link "← Voltar ao catálogo" para `/`.

- [ ] **Passo 4: Verificar**

Rode: `npm run build` e depois `npm run lint`
Esperado: os dois terminam sem erros.
Rode: `npm run dev` e abra `http://localhost:3000/rota-que-nao-existe`
Esperado: fundo escuro, "Filme não encontrado", link de volta e rodapé com os dois créditos.

- [ ] **Passo 5: Commit**

```bash
git add -A
git commit -m "feat: visual escuro, cabeçalho com busca, rodapé com créditos e telas de erro"
```

---

### Tarefa 6: Tela do catálogo (`/`)

**Arquivos:**
- Modificar: `app/page.tsx`
- Criar: `components/Banner.tsx`, `components/FiltroStreamings.tsx`, `components/GradeFilmes.tsx`, `components/CartaoFilme.tsx`, `components/Paginacao.tsx`
- Criar: `.env.local` (só na máquina, com o token real; **não** vai para o commit)

**Interfaces:**
- Consome: `lerFiltros`, `montarHref`, `FiltrosCatalogo` (Tarefa 2); `listarStreamings`, `listarFilmes`, `buscarFilmes`, `FilmeResumo`, `Streaming` (Tarefas 3 e 4); `formatarNota` (Tarefa 3); `Cabecalho` (Tarefa 5).
- Componentes (todos Server Components, recebendo dados prontos):
  - `<Banner filme={FilmeResumo} />`: backdrop com degradê escuro por cima; título, ano, gêneros, nota e sinopse com no máximo 2 linhas (`line-clamp-2`); botão "Ver detalhes" para `/filme/{id}`. Sem backdrop, usa só um degradê.
  - `<FiltroStreamings streamings={Streaming[]} filtros={FiltrosCatalogo} />`: pílula "Todos" e uma pílula por streaming, cada uma um `<Link href={montarHref(filtros, { streaming })}>`. A ativa fica preenchida de âmbar. No celular, a fileira rola para o lado (`overflow-x-auto`).
  - `<GradeFilmes filmes={FilmeResumo[]} />`: 2 colunas no celular, até 6 no computador. Com a lista vazia, mostra "Nenhum filme com esse nome está no streaming agora."
  - `<CartaoFilme filme={FilmeResumo} />`: link para `/filme/{id}` com pôster (`next/image`), título e ano. Sem pôster, mostra um bloco escuro com o título escrito.
  - `<Paginacao filtros={FiltrosCatalogo} totalPaginas={number} />`: "← Anterior" (some na página 1), "Página N" e "Próxima →" (some na última).

- [ ] **Passo 1: Token local**

Peça ao usuário o **API Read Access Token** do TMDB (com o passo a passo para criar a conta, se preciso) e grave `TMDB_TOKEN=...` em `.env.local`. Confirme com `git status` que `.env.local` **não** aparece como arquivo novo.

- [ ] **Passo 2: Componentes**

Crie os cinco componentes conforme as interfaces acima.

- [ ] **Passo 3: `app/page.tsx`**

Recebe `searchParams: Promise<Record<string, string | string[] | undefined>>`. Faz `await` e passa para `lerFiltros`.
- Com `busca`: chama `buscarFilmes({ texto: busca, streaming, pagina })`. Sem `busca`: chama `listarFilmes({ streaming, pagina })`. `listarStreamings()` roda em paralelo.
- Se `pagina > totalPaginas` e `totalPaginas > 0`: `redirect(montarHref(filtros, { pagina: totalPaginas }))`.
- Monta, nesta ordem: `Cabecalho`, `Banner` (só quando `pagina === 1`, não há busca e há pelo menos 1 filme; mostra `filmes[0]`), `FiltroStreamings`, `GradeFilmes` e `Paginacao`.

- [ ] **Passo 4: Verificar**

Rode: `npm test && npm run build && npm run lint`
Esperado: tudo passando, sem erros.
Rode: `npm run dev` e confira no navegador:
- `/`: banner, 10 pílulas, 20 cartões e "Próxima →"
- clicar numa pílula: a URL ganha `?streaming=ID`, a pílula fica âmbar e o banner mostra outro filme
- `/?pagina=2`: sem banner, com "← Anterior"
- `/?pagina=abc` mostra a página 1, e `/?pagina=9999` redireciona para a última
- buscar "Duna": aparecem os cartões, sem banner. Buscar "xyzxyzxyz": aparece a mensagem de lista vazia
- pelas ferramentas do navegador, confirme que a página e o JavaScript não contêm o token

- [ ] **Passo 5: Commit**

```bash
git add -A
git commit -m "feat: tela do catálogo com banner, filtro, busca, grade e paginação"
```

---

### Tarefa 7: Página de detalhes (`/filme/[id]`)

**Arquivos:**
- Criar: `app/filme/[id]/page.tsx`

**Interfaces:**
- Consome: `lerIdFilme` (Tarefa 2), `detalharFilme`, `FilmeNaoEncontradoError` (Tarefas 3 e 4), `formatarDuracao`, `formatarNota` (Tarefa 3) e `Cabecalho` (Tarefa 5).

- [ ] **Passo 1: Implementar a página**

Recebe `params: Promise<{ id: string }>`.
- `lerIdFilme(id)` igual a `null` → `notFound()` antes de chamar o TMDB.
- `FilmeNaoEncontradoError` vindo de `detalharFilme` → `notFound()`. Outros erros sobem para `app/error.tsx`.
- Monta: `Cabecalho` (sem busca nem streaming), backdrop com degradê, pôster (com a mesma alternativa do `CartaoFilme` quando falta), título, ano, `formatarDuracao` (omitida se `null`), gêneros, `formatarNota`, sinopse ou "Sinopse não disponível em português.", seção "Onde assistir" com logo e nome de cada streaming ou "No momento, este filme não está em nenhum streaming por assinatura no Brasil.", e o link "← Voltar ao catálogo".
- `generateMetadata` define o título da aba como `"{titulo} · CineCatálogo"`.

- [ ] **Passo 2: Verificar**

Rode: `npm test && npm run build && npm run lint`
Esperado: tudo passando.
Rode: `npm run dev` e confira:
- clicar num cartão do catálogo abre os detalhes com o bloco "Onde assistir" preenchido
- `/filme/abc`, `/filme/0` e `/filme/999999999` mostram "Filme não encontrado"
- um filme fora do streaming (ex.: abra pela URL um id de um filme antigo qualquer) mostra a frase de "não está em nenhum streaming"

- [ ] **Passo 3: Commit**

```bash
git add -A
git commit -m "feat: página de detalhes do filme com onde assistir"
```

---

### Tarefa 8: Conferência final e publicação

**Arquivos:**
- Nenhum arquivo de código. Só configuração no GitHub e na Vercel.

- [ ] **Passo 1: Roteiro manual (spec, seção 6)**

Com `npm run dev`, refaça as verificações das Tarefas 6 e 7. Depois repita tudo com o navegador no tamanho de celular (ferramentas do navegador → modo dispositivo, 375 px de largura). Esperado: 2 colunas na grade, pílulas rolando para o lado e nada cortado.

- [ ] **Passo 2: GitHub**

Guie o usuário para criar a conta e um repositório vazio chamado `catalogo-filmes`. Depois:
```bash
git remote add origin https://github.com/<usuario>/catalogo-filmes.git
git push -u origin main
```
Esperado: o código aparece no GitHub **sem** `.env.local`.

- [ ] **Passo 3: Vercel**

Guie o usuário: entrar na Vercel com o GitHub → "Add New Project" → importar `catalogo-filmes` → em "Environment Variables", adicionar `TMDB_TOKEN` → "Deploy".
Esperado: um link `https://catalogo-filmes-….vercel.app` que abre o catálogo funcionando.

- [ ] **Passo 4: Conferir o site publicado**

Repita o roteiro do Passo 1 no link público, inclusive no celular de verdade.
