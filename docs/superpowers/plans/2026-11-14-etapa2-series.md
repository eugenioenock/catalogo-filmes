# Etapa 2: Séries — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O Catálogo ganha o seletor Filmes | Séries. A busca traz filmes e séries juntos. A página `/serie/[id]` passa a existir, com os três botões das listas.

**Architecture:**
- **TMDB:** `lib/tmdb.ts` passa a falar com os dois lados (`movie` e `tv`) por um parâmetro `tipo`. A conversão do formato do TMDB para o resumo fica num lugar só.
- **Regras puras:** URL (`?tipo=series`), textos e "3 temporadas · 2019–2023" ficam em `lib/parametros.ts` e `lib/formatar.ts`, com testes.
- **Página do título:** o conteúdo da página do filme vira um componente compartilhado (`DetalheTitulo`), usado pela página do filme e pela da série.
- **Ação de marcar:** sai da pasta do filme e passa a receber o tipo.

**Tech Stack:** Next.js 16.4 (App Router, Server Components, Server Actions, `cacheComponents`), TypeScript, Tailwind 4, Vitest, TMDB API v3.

**Spec:** `docs/superpowers/specs/2026-11-14-series-recomendacoes-design.md` (seção "Etapa 2 — Séries"). A Etapa 1 já está em `main`: os tipos `Tipo`, `hrefDoTitulo`, `chaveDoTitulo` e `SITUACOES` em `lib/listas.ts`, a coluna `tipo` no banco e a etiqueta "Série" no cartão.

## Global Constraints

- **Um passo de cada vez:** o usuário acompanha um curso. No fim de cada tarefa, explique o que foi feito e por quê, e **espere o usuário** antes da próxima. Os passos marcados **PARE** pedem o OK dele.
- **Sem mudança no banco nesta etapa.** Nenhum SQL que altere ou apague dados sem o OK do usuário. O MCP recusa comandos `drop`/`delete`; quando for preciso, dê ao usuário o SQL e o link https://supabase.com/dashboard/project/zummaraiblnzmgnuqlaj/sql/new.
- **TMDB:**
  - Filmes usam `movie`, séries usam `tv`, sempre com `language=pt-BR`.
  - Os filtros do catálogo são `watch_region=BR`, `with_watch_monetization_types=flatrate` e `sort_by=popularity.desc`.
  - O filtro de nota envia `vote_average.gte=<nota>` e `vote_count.gte=200`.
- **URL:**
  - `?tipo=series` mostra séries. Sem o parâmetro (ou com qualquer outro valor), mostra filmes.
  - Os links atuais (`/`, `/?streaming=…`, `/?nota=…`, `/?lista=…`, `/filme/[id]`) continuam iguais.
- **A lista de streamings do filtro continua vindo de `/watch/providers/movie`,** igual para os dois tipos.
- **Idioma:** textos da interface e nomes no código em português (pt-BR), seguindo o projeto.
- **Comandos:**
  - Testes a partir de `C:\` maiúsculo, pelo PowerShell: `Set-Location "C:\projetos\catalogo-filmes"; npx vitest run`.
  - Lint: `npm run lint`. Build: `npm run build`. Tipos: `npx tsc --noEmit`.
  - Os scripts `task-done` rodam pelo PowerShell chamando o Git Bash, nunca pelo Bash com `c:` minúsculo.
- **Git:**
  - Branch `feat/series`.
  - Commits com `git add <arquivos>` e depois `git commit -m … -- <arquivos>`, porque o `next.config.ts` está no índice e não pode entrar.
  - Todo commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Navegador:**
  - Conta de teste `teste.cinecatalogo.17946974386452@example.com` (senha `123456`). Ela tem as séries de teste 1399 (Game of Thrones, Assistindo) e 27205 ("Série de teste", Quero assistir).
  - Use locators `:visible`.
  - `playwright-core` em `C:/Users/eugen/AppData/Local/Temp/claude/7a5c340af02a0257/872b2a23-881e-4b92-a347-73fc22431fd6/scratchpad/node_modules`. Chrome em `C:/Program Files/Google/Chrome/Application/chrome.exe`.
  - Scripts de teste ficam na pasta de rascunho da sessão, não no projeto.

## Review Focus

- **Série sem data, sem nome em pt-BR ou sem pôster.** O cartão e a página não quebram: o ano vira `null` e o título usa o `name` que vier → teste de `listarTitulos` com série na Task 1.
- **A busca mistura filmes, séries e pessoas, inclusive um filme e uma série com o mesmo id.**
  - Pessoas somem.
  - Cada título checa o streaming no caminho do seu tipo (`/movie/5/…` × `/tv/5/…`).
  - Os dois aparecem.
  
  → teste de `buscarTitulos` na Task 1.
- **`?tipo=SERIES`, `?tipo=serie`, `?tipo=filmes`, `?tipo=` ou `tipo` repetido.** Só `series` exato vale; o resto mostra filmes. Repetido usa o primeiro → testes de `lerFiltros` na Task 2.
- **Trocar de tipo na página 3 com Netflix e nota 8 escolhidos.** Volta para a página 1 e mantém Netflix e nota 8 → teste de `montarHref` na Task 2.
- **Desmarcar a série 1399 não pode apagar o filme 1399, nem o contrário.** Ler a situação de um não pode pegar a do outro → teste com cliente falso em `lib/marcacoes.test.ts` na Task 4.
- **Série no ar, de uma temporada, ou com temporadas desconhecidas.** Fica "1 temporada · 2024–", ou só os anos, sem "0 temporadas" e sem "undefined" → testes de `textoTemporadas` na Task 2.

---

### Task 1: TMDB para filmes e séries

**Files:**
- Modify: `lib/tmdb.ts`, `lib/tmdb.test.ts`
- Modify: `app/page.tsx` (só trocar as chamadas para os nomes novos, com `tipo: "filme"`, para o build continuar passando)

**Interfaces:**
- Consumes: `Tipo` de `lib/listas.ts`.
- Produces (`lib/tmdb.ts`):
  - `listarTitulos(o: { tipo: Tipo; streaming: number | null; nota: number | null; pagina: number }): Promise<PaginaDeFilmes>`. Substitui `listarFilmes`. Usa `/discover/movie` ou `/discover/tv`, e os gêneros de `/genre/movie/list` ou `/genre/tv/list`.
  - `buscarTitulos(o: { texto: string; streaming: number | null; nota: number | null; pagina: number }): Promise<PaginaDeFilmes>`. Substitui `buscarFilmes`.
    - Usa `/search/multi` e fica só com `media_type` `movie` e `tv`, na ordem do TMDB.
    - Cada resultado tem `tipo` certo e gêneros do seu tipo (busca as duas listas de gêneros).
    - A disponibilidade vem de `/movie/{id}/watch/providers` ou `/tv/{id}/watch/providers`.
    - Nota e streaming filtram como a busca atual.
  - `detalharSerie(id: number): Promise<SerieDetalhe>` (com `cache` do React, como `detalharFilme`). Chama `/tv/{id}` com `append_to_response=watch/providers`.
  - `type SerieDetalhe = FilmeResumo & { temporadas: number | null; anoFim: string | null; terminou: boolean; streamings: Streaming[] }`.
    - `terminou` é `status === "Ended" || status === "Canceled"`.
    - `anoFim` vem de `anoDe(last_air_date)`.
  - **Conversão de série:** `name` → `titulo`, `first_air_date` → `ano`, `tipo: "serie"`.
  - **O 404 do TMDB** continua virando `FilmeNaoEncontradoError` (nome mantido), e a página usa para dar "não encontrado".

- [ ] **Step 1: Escrever os testes que falham** em `lib/tmdb.test.ts`:
  - Os testes atuais de `listarFilmes` e `buscarFilmes` passam a chamar `listarTitulos({ tipo: "filme", … })` e `buscarTitulos`.
  - **Helpers:**
    - `serie(id, extra)` com `name`, `first_air_date`, `genre_ids`, `vote_average`, `vote_count` etc.;
    - `generosTv = { genres: [{ id: 10765, name: "Ficção científica e Fantasia" }] }`;
    - um resultado de busca é `{ ...filme(1), media_type: "movie" }` ou `{ ...serie(1), media_type: "tv" }`.

```ts
it("listarTitulos de séries chama /discover/tv com os mesmos filtros e gêneros de tv", async () => {
  rotear({ "/genre/tv/list": generosTv, "/discover/tv": { page: 1, total_pages: 1, results: [serie(1399, { genre_ids: [10765] })] } });
  const r = await listarTitulos({ tipo: "serie", streaming: 8, nota: 8, pagina: 2 });
  const url = new URL(urlChamada("/discover/tv"));
  expect(Object.fromEntries(url.searchParams)).toMatchObject({
    watch_region: "BR", with_watch_monetization_types: "flatrate", language: "pt-BR",
    sort_by: "popularity.desc", page: "2", with_watch_providers: "8", "vote_average.gte": "8", "vote_count.gte": "200",
  });
  expect(r.filmes[0]).toMatchObject({ tipo: "serie", id: 1399, titulo: "Série 1399", ano: "2011", generos: ["Ficção científica e Fantasia"] });
});
it("série sem data e sem pôster vira ano null e pôster null", …);           // first_air_date: "", poster_path: null
it("buscarTitulos usa /search/multi, descarta pessoas e checa cada tipo no seu caminho", async () => {
  // results: filme 5 (movie), série 5 (tv), pessoa 7 (person)
  // rotas: "/movie/5/watch/providers" e "/tv/5/watch/providers" com flatrate
  const r = await buscarTitulos({ texto: "x", streaming: null, nota: null, pagina: 1 });
  expect(r.filmes.map((t) => `${t.tipo}-${t.id}`)).toEqual(["filme-5", "serie-5"]);
  expect(fetchMock.mock.calls.some(([u]) => String(u).includes("/person/"))).toBe(false);
});
it("buscarTitulos com streaming mantém só quem está naquele serviço, de qualquer tipo", …);
it("detalharSerie pede /tv/{id} com watch/providers e monta temporadas, anoFim e terminou", async () => {
  // /tv/1399 → name, first_air_date "2011-04-17", last_air_date "2019-05-19", number_of_seasons 8, status "Ended",
  //            genres [{id:10765,…}], "watch/providers" BR flatrate [provider(1899,"Max")]
  expect(await detalharSerie(1399)).toMatchObject({
    tipo: "serie", id: 1399, ano: "2011", anoFim: "2019", temporadas: 8, terminou: true,
    streamings: [{ id: 1899, nome: "Max" }],
  });
});
it("detalharSerie no ar: Returning Series vira terminou false", …);
it("detalharSerie repassa 404 como FilmeNaoEncontradoError", …);
```

- [ ] **Step 2: Rodar e ver falhar.** `npx vitest run lib/tmdb.test.ts` → FAIL (`listarTitulos`, `buscarTitulos` e `detalharSerie` não existem).

- [ ] **Step 3: Implementar.**
  - Um mapa `Tipo → "movie" | "tv"` decide os caminhos.
  - `resumir` passa a receber o tipo e aceita os dois formatos (`title`/`release_date` ou `name`/`first_air_date`).
  - `montarPagina` recebe os gêneros já resolvidos por tipo.
  - Em `app/page.tsx`, troque as chamadas para `listarTitulos({ tipo: "filme", … })` e `buscarTitulos(…)`. O resto da página fica para a Task 3.

- [ ] **Step 4: Verificar.** `npx vitest run` → PASS; `npx tsc --noEmit` e `npm run lint` → sem erros.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(tmdb): listar, buscar e detalhar séries" -- lib/tmdb.ts lib/tmdb.test.ts app/page.tsx
```

---

### Task 2: Regras de URL e textos para dois tipos

**Files:**
- Modify: `lib/parametros.ts`, `lib/parametros.test.ts`
- Modify: `lib/formatar.ts`, `lib/formatar.test.ts`

**Interfaces:**
- Produces (`lib/parametros.ts`):
  - `FiltrosCatalogo` ganha `tipo: Tipo`. `lerFiltros` devolve `"serie"` só para `tipo=series` exato (o primeiro valor, se repetido); senão, `"filme"`.
  - `montarHref` escreve `tipo=series` **primeiro** na query quando `tipo === "serie"` e o omite para filme. Mudar `tipo` volta para a página 1 e mantém streaming, busca e nota.
  - `hrefDoCatalogo(tipo: Tipo): string` → `"/"` ou `"/?tipo=series"`.
- Produces (`lib/formatar.ts`):
  - `mensagemSemFilmes(filtros: { tipo: Tipo; busca: boolean; nota: boolean; streaming: boolean }): string`, com os textos exatos do Step 1.
  - `textoTemporadas(s: { temporadas: number | null; ano: string | null; anoFim: string | null; terminou: boolean }): string | null`.
  - `titulosDoCatalogo(tipo: Tipo, o: { busca: string | null; vitrine: boolean }): { grade: string; emAlta: string }`.

- [ ] **Step 1: Escrever os testes que falham.** Os objetos de `FiltrosCatalogo` nos testes atuais ganham `tipo: "filme"`, e o `toEqual` de `lerFiltros({})` também.

```ts
// lib/parametros.test.ts
it("tipo=series lê série", () => expect(lerFiltros({ tipo: "series" }).tipo).toBe("serie"));
it.each(["SERIES", "serie", "filmes", "", "tv"])("tipo %s vira filme", (t) => expect(lerFiltros({ tipo: t }).tipo).toBe("filme"));
it("tipo repetido usa o primeiro", () => expect(lerFiltros({ tipo: ["series", "x"] }).tipo).toBe("serie"));
it("trocar para séries volta à página 1 e mantém streaming e nota", () =>
  expect(montarHref({ tipo: "filme", streaming: 8, busca: null, nota: 8, pagina: 3, lista: null }, { tipo: "serie" }))
    .toBe("/?tipo=series&streaming=8&nota=8"));
it("filme não aparece na URL", () =>
  expect(montarHref({ tipo: "serie", streaming: null, busca: null, nota: null, pagina: 2, lista: null }, { tipo: "filme" })).toBe("/"));
it("página seguinte em séries mantém o tipo", () =>
  expect(montarHref({ tipo: "serie", streaming: null, busca: null, nota: null, pagina: 1, lista: null }, { pagina: 2 }))
    .toBe("/?tipo=series&pagina=2"));
it("hrefDoCatalogo", () => { expect(hrefDoCatalogo("filme")).toBe("/"); expect(hrefDoCatalogo("serie")).toBe("/?tipo=series"); });

// lib/formatar.test.ts — mensagemSemFilmes (os testes atuais ganham tipo: "filme" e os textos novos)
// busca+nota → "Nenhum título com esse nome e essa nota está no streaming agora." (qualquer tipo)
// busca      → "Nenhum título com esse nome está no streaming agora."
// nota+streaming → filme "Nenhum filme com essa nota neste streaming." / série "Nenhuma série com essa nota neste streaming."
// nota       → filme "Nenhum filme com essa nota nos streamings." / série "Nenhuma série com essa nota nos streamings."
// nenhum     → filme "Nenhum filme encontrado." / série "Nenhuma série encontrada."

// textoTemporadas
expect(textoTemporadas({ temporadas: 3, ano: "2019", anoFim: "2023", terminou: true })).toBe("3 temporadas · 2019–2023");
expect(textoTemporadas({ temporadas: 1, ano: "2024", anoFim: "2024", terminou: false })).toBe("1 temporada · 2024–");
expect(textoTemporadas({ temporadas: 1, ano: "2020", anoFim: "2020", terminou: true })).toBe("1 temporada · 2020");   // mesmo ano: sem traço
expect(textoTemporadas({ temporadas: null, ano: "2019", anoFim: "2021", terminou: true })).toBe("2019–2021");
expect(textoTemporadas({ temporadas: 0, ano: null, anoFim: null, terminou: false })).toBeNull();
expect(textoTemporadas({ temporadas: 2, ano: null, anoFim: null, terminou: false })).toBe("2 temporadas");

// titulosDoCatalogo
expect(titulosDoCatalogo("filme", { busca: null, vitrine: true })).toEqual({ grade: "Mais filmes nos streamings", emAlta: "Em alta agora" });
expect(titulosDoCatalogo("serie", { busca: null, vitrine: true })).toEqual({ grade: "Mais séries nos streamings", emAlta: "Séries em alta agora" });
expect(titulosDoCatalogo("serie", { busca: null, vitrine: false }).grade).toBe("Séries nos streamings");
expect(titulosDoCatalogo("filme", { busca: null, vitrine: false }).grade).toBe("Filmes nos streamings");
expect(titulosDoCatalogo("serie", { busca: "dark", vitrine: false }).grade).toBe("Resultados para “dark”");
```

- [ ] **Step 2: Rodar e ver falhar.** `npx vitest run lib/parametros.test.ts lib/formatar.test.ts` → FAIL.

- [ ] **Step 3: Implementar as interfaces.** A regra de "mesmo ano" do `textoTemporadas`: série terminada com `anoFim === ano` mostra um ano só. Atualize o chamador de `mensagemSemFilmes` em `app/page.tsx` com `tipo: filtros.tipo`.

- [ ] **Step 4: Verificar.** `npx vitest run`, `npx tsc --noEmit` e `npm run lint` → sem erros.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: URL e textos do catálogo para filmes e séries" -- lib/parametros.ts lib/parametros.test.ts lib/formatar.ts lib/formatar.test.ts app/page.tsx
```

---

### Task 3: Catálogo com o seletor Filmes | Séries

**Files:**
- Create: `components/SeletorTipo.tsx`
- Modify: `app/page.tsx`, `components/EmAlta.tsx` (título por prop), `components/CampoBusca.tsx`

**Interfaces:**
- Consumes: `listarTitulos`, `buscarTitulos` (Task 1); `FiltrosCatalogo.tipo`, `montarHref`, `titulosDoCatalogo`, `mensagemSemFilmes` (Task 2).
- Produces:
  - `SeletorTipo({ filtros }: { filtros: FiltrosCatalogo })`: dois links, "Filmes" e "Séries", com `href={montarHref(filtros, { tipo })}`, `aria-current="page"` no ativo e `classeFiltro`, dentro de `<nav aria-label="Filmes ou séries">`.
  - `EmAlta({ filmes, titulo }: { filmes: FilmeResumo[]; titulo: string })`.

- [ ] **Step 1: A página usa o tipo.**
  - `listarTitulos({ tipo: filtros.tipo, … })`.
  - Os títulos da grade e do Top 10 vêm de `titulosDoCatalogo`.
  - O seletor fica acima de `FiltroStreamings` e **não aparece durante a busca**.
  - A busca ignora o tipo (o `CampoBusca` não envia `tipo`).

- [ ] **Step 2: Busca.** O placeholder e o `aria-label` do `CampoBusca` passam para "Buscar filmes e séries" *(texto definido por este plano)*.

- [ ] **Step 3: Verificar.** `npx vitest run`, `npx tsc --noEmit`, `npm run lint` e `npm run build` → sem erros.

- [ ] **Step 4: Verificar no navegador** (http://localhost:3000, 375px e 1440px):
  - **Sem `?tipo`:** igual a antes, com "Filmes" aceso.
  - **Clicar em "Séries":**
    - a URL fica `/?tipo=series`;
    - banner, Top 10 ("Séries em alta agora") e grade ("Mais séries nos streamings") mostram séries com a etiqueta "Série" e links `/serie/…`.
  - **Com Netflix e nota 8 escolhidos, trocar de tipo:** os dois continuam escolhidos, e a página volta para a 1.
  - **"Próxima" em Séries** mantém `tipo=series`.
  - **Buscar "dark":**
    - aparecem filmes e séries misturados;
    - não aparece o seletor;
    - as séries têm a etiqueta.
  - **Página sem rolagem lateral** em 375px.
  - **Os links `/serie/…`** ainda dão "não encontrado"; a página chega na Task 4.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: seletor Filmes | Séries no catálogo e busca com os dois tipos" -- components/SeletorTipo.tsx app/page.tsx components/EmAlta.tsx components/CampoBusca.tsx
```

---

### Task 4: Página da série e marcar séries

**Files:**
- Create: `components/DetalheTitulo.tsx` (o conteúdo que hoje está em `Detalhes` de `app/filme/[id]/page.tsx`)
- Create: `app/serie/[id]/page.tsx`
- Create: `app/marcacoes/acoes.ts` (a ação de marcar; apague `app/filme/[id]/acoes.ts`)
- Create: `lib/marcacoes.test.ts`
- Modify: `app/filme/[id]/page.tsx`, `components/BotoesMarcar.tsx`, `components/FormularioMarcar.tsx`, `app/not-found.tsx`, `app/error.tsx`

**Interfaces:**
- Consumes: `detalharSerie`, `SerieDetalhe` (Task 1); `textoTemporadas`, `hrefDoCatalogo` (Task 2); `hrefDoTitulo`, `situacaoDoTitulo`, `gravarSituacao` (Etapa 1).
- Produces:
  - `DetalheTitulo({ titulo, itens }: { titulo: FilmeResumo & { streamings: Streaming[] }; itens: (string | null)[] })`.
    - É o mesmo visual de hoje, mais:
      - os botões são `<BotoesMarcar tipo={titulo.tipo} id={titulo.id} />`;
      - "Voltar ao catálogo" leva para `hrefDoCatalogo(titulo.tipo)`;
      - sem streaming, o texto diz "No momento, este filme não está…" ou "No momento, esta série não está…".
    - Página do filme: `itens = [ano, formatarDuracao(duracaoMin), ...generos]`.
    - Página da série: `itens = [textoTemporadas(serie), ...generos]`.
  - `alternarMarcacao(tipo: Tipo, id: number, clicada: Situacao): Promise<EstadoMarcar>` em `app/marcacoes/acoes.ts`.
    - Sem login: `redirect(`/entrar?volta=${encodeURIComponent(hrefDoTitulo({ tipo, id }))}`)`.
    - Os dados vêm de `detalharFilme` ou `detalharSerie`, conforme o tipo.
  - `BotoesMarcar({ tipo, id }: { tipo: Tipo; id: number })` e `FormularioMarcar({ tipo, id, situacao })`. O `volta` dos links sem login usa `hrefDoTitulo`.

- [ ] **Step 1: Escrever o teste que falha, `lib/marcacoes.test.ts`.**
  - `vi.mock("server-only", …)`.
  - `vi.mock("./usuario", () => ({ usuarioAtual: async () => ({ id: "u1" }) }))`.
  - `vi.mock("./supabase/servidor", …)` devolve um cliente falso: um objeto encadeável cujos `from`, `select`, `eq`, `delete`, `upsert`, `order` e `maybeSingle` registram `[metodo, ...args]` num array. Ele precisa ser "await-ável", devolvendo `{ data: null, error: null }`.
  - Os testes:

```ts
const got: FilmeResumo = { tipo: "serie", id: 1399, titulo: "GoT", ano: null, posterUrl: null, backdropUrl: null, sinopse: "", nota: 0, generos: [] };
it("desmarcar uma série filtra por tipo e id", async () => {
  await gravarSituacao(got, null);
  expect(chamadas).toContainEqual(["eq", "tipo", "serie"]);
  expect(chamadas).toContainEqual(["eq", "filme_id", 1399]);
});
it("marcar grava o tipo e usa a chave com tipo", async () => {
  await gravarSituacao({ ...got, tipo: "filme" }, "assistindo");
  const upsert = chamadas.find(([m]) => m === "upsert")!;
  expect(upsert[1]).toMatchObject({ tipo: "filme", filme_id: 1399, situacao: "assistindo" });
  expect(upsert[2]).toEqual({ onConflict: "user_id,tipo,filme_id" });
});
it("ler a situação filtra por tipo", async () => {
  await situacaoDoTitulo("serie", 1399);
  expect(chamadas).toContainEqual(["eq", "tipo", "serie"]);
});
```

- [ ] **Step 2: Rodar e ver.** `npx vitest run lib/marcacoes.test.ts`.
  - Estes testes protegem o comportamento da Etapa 1, então podem passar de primeira.
  - Para provar que eles pegam o erro, **apague por um instante** o `.eq("tipo", …)` do `delete` em `lib/marcacoes.ts`. O primeiro teste tem de falhar. Depois devolva o filtro.
  - Registre isso no registro de progresso.

- [ ] **Step 3: Extrair `DetalheTitulo`, criar a página da série e mover a ação.**
  - `app/serie/[id]/page.tsx` segue a página do filme: `generateMetadata` com "{título} | CineCatálogo", `lerIdFilme`, `FilmeNaoEncontradoError` → `notFound()`, `Suspense` com "Apagando as luzes…".
  - `app/not-found.tsx` passa para "Título não encontrado" e "O endereço pode estar errado ou o título saiu do TMDB. Volte ao catálogo para buscar outro."
  - `app/error.tsx` passa para "Não conseguimos carregar o catálogo do TMDB agora. Tente de novo em alguns segundos."

- [ ] **Step 4: Verificar.** `npx vitest run`, `npx tsc --noEmit`, `npm run lint` e `npm run build` → sem erros.

- [ ] **Step 5: Verificar no navegador** (375px e 1440px):
  - **`/serie/1399`:** Game of Thrones, com "8 temporadas · 2011–2019", gêneros, sinopse, "Onde assistir" e três botões com **Assistindo aceso** (a linha de teste).
  - **Clicar em "Já assisti":** o banco (MCP, só leitura) mostra `serie/1399/ja_assisti`, e a conta não ganha linha de filme 1399.
  - **"Voltar ao catálogo"** leva para `/?tipo=series`.
  - **Uma série no ar** (escolha uma do Top 10 de séries) mostra "N temporadas · AAAA–".
  - **Sem login,** os três botões levam para `/entrar?volta=%2Fserie%2F1399`. Depois de entrar, voltam para a série.
  - **`/filme/27205`** continua igual, com os três botões funcionando.
  - **`/serie/999999999` e `/serie/abc`** mostram "Título não encontrado".
  - Tirar capturas em 375px e 1440px para o usuário.

- [ ] **Step 6: Commit**

```bash
git commit -m "feat: página da série e marcar séries" -- components/DetalheTitulo.tsx "app/serie/[id]/page.tsx" app/marcacoes/acoes.ts "app/filme/[id]/acoes.ts" "app/filme/[id]/page.tsx" lib/marcacoes.test.ts components/BotoesMarcar.tsx components/FormularioMarcar.tsx app/not-found.tsx app/error.tsx
```

---

### Task 5: Entrega (só com o OK do usuário)

- [ ] **Step 1: Revisão do branch inteiro** (`main..feat/series`) por um revisor novo, no modelo mais capaz, com este plano, a spec e o Review Focus. Corrija os itens críticos e importantes com teste. Os menores vão para o usuário decidir.
- [ ] **Step 2: PARE. Conferência do usuário.** Mostre as capturas e peça que ele confira no navegador e no celular. Espere o OK.
- [ ] **Step 3: Entregar.**
  - Merge de `feat/series` em `main` (fast-forward), `git push origin main` e apagar o branch.
  - Esperar a Vercel publicar e conferir em https://catalogo-filmes-chi-navy.vercel.app/?tipo=series e `/serie/1399` com a conta de teste.
- [ ] **Step 4: PARE. Perguntar sobre os dados de teste.** Pergunte se o usuário quer apagar as séries de teste (1399 e 27205) da conta de teste. Se sim, dê o SQL e o link do SQL Editor (o MCP recusa `delete`). Atualize a memória do projeto e avise que a próxima é a Etapa 3 ("Para você").
