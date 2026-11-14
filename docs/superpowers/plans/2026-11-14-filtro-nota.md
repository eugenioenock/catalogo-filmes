# Filtro por nota — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Na página inicial, uma fileira de botões (Qualquer · 6+ · 7+ · 8+ · 9+) que mostra só os filmes com nota do TMDB maior ou igual à escolhida.

**Architecture:** A nota entra em `FiltrosCatalogo` e na URL (`?nota=8`), como o streaming. Na lista por popularidade, o próprio `/discover/movie` filtra (`vote_average.gte` + `vote_count.gte`). Na busca, cada página de resultados é filtrada no servidor antes da consulta de disponibilidade. A interface é um componente de servidor só com links, igual a `FiltroStreamings`.

**Tech Stack:** Next.js 16 (App Router, Server Components), TypeScript, Tailwind 4, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-14-filtro-nota-design.md`

## Global Constraints

- Degraus aceitos: **6, 7, 8, 9**. Qualquer outro valor de `nota` na URL vira `null` (sem filtro).
- "8+" significa `vote_average >= 8` (maior ou igual).
- Com o filtro ativo, mínimo de **200 votos** (`vote_count >= 200`). Sem filtro, nada muda.
- Parâmetro na URL: `nota`. Mudar a nota volta para a página 1.
- Nota do TMDB, nunca do IMDb. Sem dependências novas.
- Testes rodam a partir de `C:\` com letra maiúscula: `Set-Location "C:\projetos\catalogo-filmes"; npx vitest run` (com `c:\` minúsculo eles falham).
- Textos da interface em português (pt-BR).

## Review Focus

- `?nota=8.5`, `?nota=10`, `?nota=5`, `?nota=abc` ou `nota` repetido: viram `null` ou usam o primeiro valor, sem erro → teste na Tarefa 1.
- Trocar a nota estando na página 7: volta para a página 1, sem cair num redirect para uma página que não existe → teste na Tarefa 1.
- Filme com nota exatamente 8,0 aparece no "8+", e filme 9,5 com 12 votos não aparece → teste na Tarefa 2 (busca).
- Busca com nota: filmes abaixo da nota não geram a consulta `/movie/{id}/watch/providers`, que é a parte cara → teste na Tarefa 2.
- Buscar um texto com a nota ativa: o formulário do cabeçalho mantém a `nota` → verificação manual na Tarefa 3 (o projeto não tem testes de componentes).

---

### Tarefa 1: `nota` nos filtros da URL

**Files:**
- Modify: `lib/parametros.ts`
- Test: `lib/parametros.test.ts`

**Interfaces:**
- Produces:
  - `export const NOTAS_FILTRO = [6, 7, 8, 9] as const;`
  - `export type FiltrosCatalogo = { streaming: number | null; busca: string | null; nota: number | null; pagina: number }`
  - `lerFiltros(params)` passa a devolver `nota`
  - `montarHref(atual, mudancas)` escreve `nota` e volta para a página 1 quando `nota` muda. Ordem na query: `streaming`, `busca`, `nota`, `pagina`.

- [ ] **Step 1: Atualizar os testes que já existem e escrever os novos**

Os testes atuais precisam de `nota: null`: no `toEqual` de "usa padrões" e nos objetos `atual` de `montarHref`. Testes novos:

```ts
// em describe("lerFiltros")
it.each(["6", "7", "8", "9"])("lê nota %s", (n) =>
  expect(lerFiltros({ nota: n }).nota).toBe(Number(n)));
it.each(["5", "10", "8.5", "abc", "", "-8"])("nota inválida %s vira null", (n) =>
  expect(lerFiltros({ nota: n }).nota).toBeNull());
it("nota repetida usa o primeiro valor", () =>
  expect(lerFiltros({ nota: ["7", "9"] }).nota).toBe(7));

// em describe("montarHref"), com atual = { streaming: 8, busca: "duna", nota: null, pagina: 3 }
it("escolher uma nota volta para a página 1 e mantém o resto", () =>
  expect(montarHref(atual, { nota: 8 })).toBe("/?streaming=8&busca=duna&nota=8"));
it("'Qualquer' remove a nota", () =>
  expect(montarHref({ ...atual, nota: 8 }, { nota: null })).toBe("/?streaming=8&busca=duna"));
it("mudar a página mantém a nota", () =>
  expect(montarHref({ ...atual, nota: 7 }, { pagina: 4 })).toBe("/?streaming=8&busca=duna&nota=7&pagina=4"));
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `Set-Location "C:\projetos\catalogo-filmes"; npx vitest run lib/parametros.test.ts`
Expected: FAIL nos testes de `nota`.

- [ ] **Step 3: Implementar em `lib/parametros.ts`**

`nota` vale `Number(valor)` só se `valor` for exatamente `"6"`, `"7"`, `"8"` ou `"9"` (use `NOTAS_FILTRO`). Em `montarHref`, inclua `"nota" in mudancas` na regra que volta para a página 1.

- [ ] **Step 4: Rodar e ver passar**

Run: `Set-Location "C:\projetos\catalogo-filmes"; npx vitest run lib/parametros.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/parametros.ts lib/parametros.test.ts
git commit -m "feat: filtro de nota nos parâmetros da URL"
```

---

### Tarefa 2: nota nas consultas ao TMDB

**Files:**
- Modify: `lib/tmdb.ts`
- Test: `lib/tmdb.test.ts`

**Interfaces:**
- Consumes: nada da Tarefa 1 (recebe `nota: number | null` já validada).
- Produces:
  - `listarFilmes(o: { streaming: number | null; nota: number | null; pagina: number }): Promise<PaginaDeFilmes>`
  - `buscarFilmes(o: { texto: string; streaming: number | null; nota: number | null; pagina: number }): Promise<PaginaDeFilmes>`
  - Constante interna `VOTOS_MINIMOS = 200`. O tipo `TmdbFilme` ganha `vote_count: number`.

- [ ] **Step 1: Atualizar os testes que já existem e escrever os novos**

Adicione `vote_count: 500` ao objeto padrão do helper `filme()`. Adicione `nota: null` às chamadas existentes de `listarFilmes` e `buscarFilmes`. Testes novos:

```ts
it("listarFilmes sem nota não envia vote_average.gte nem vote_count.gte", async () => {
  rotear({ "/genre/movie/list": generos, "/discover/movie": { page: 1, total_pages: 1, results: [] } });
  await listarFilmes({ streaming: null, nota: null, pagina: 1 });
  const p = new URL(urlChamada("/discover/movie")).searchParams;
  expect(p.has("vote_average.gte")).toBe(false);
  expect(p.has("vote_count.gte")).toBe(false);
});
it("listarFilmes com nota 8 envia vote_average.gte=8 e vote_count.gte=200", async () => {
  rotear({ "/genre/movie/list": generos, "/discover/movie": { page: 1, total_pages: 1, results: [] } });
  await listarFilmes({ streaming: 8, nota: 8, pagina: 1 });
  const p = new URL(urlChamada("/discover/movie")).searchParams;
  expect(p.get("vote_average.gte")).toBe("8");
  expect(p.get("vote_count.gte")).toBe("200");
  expect(p.get("with_watch_providers")).toBe("8");
});

// em describe("buscarFilmes")
it("com nota mantém nota >= 8 com pelo menos 200 votos e não consulta os demais", async () => {
  rotear({
    "/genre/movie/list": generos,
    "/search/movie": {
      page: 1, total_pages: 1,
      results: [
        filme(1, { vote_average: 8.0, vote_count: 200 }),
        filme(2, { vote_average: 7.9, vote_count: 5000 }),
        filme(3, { vote_average: 9.5, vote_count: 12 }),
      ],
    },
    "/watch/providers": { results: { BR: { flatrate: [provider(8)] } } },
  });
  const r = await buscarFilmes({ texto: "x", streaming: null, nota: 8, pagina: 1 });
  expect(r.filmes.map((f) => f.id)).toEqual([1]);
  const consultados = fetchMock.mock.calls.map(([u]) => String(u)).filter((u) => u.includes("/watch/providers"));
  expect(consultados).toHaveLength(1);
  expect(consultados[0]).toContain("/movie/1/watch/providers");
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `Set-Location "C:\projetos\catalogo-filmes"; npx vitest run lib/tmdb.test.ts`
Expected: FAIL nos três testes novos.

- [ ] **Step 3: Implementar em `lib/tmdb.ts`**

`listarFilmes`: quando `nota !== null`, adiciona `"vote_average.gte": String(nota)` e `"vote_count.gte": String(VOTOS_MINIMOS)` aos parâmetros. `buscarFilmes`: filtra `dados.results` por nota e votos **antes** do `Promise.allSettled` de disponibilidade. Use a lista filtrada tanto nas consultas quanto no filtro de streaming.

- [ ] **Step 4: Rodar a suíte toda**

Run: `Set-Location "C:\projetos\catalogo-filmes"; npx vitest run`
Expected: PASS em tudo.

- [ ] **Step 5: Commit**

```bash
git add lib/tmdb.ts lib/tmdb.test.ts
git commit -m "feat: filtrar filmes por nota mínima no TMDB"
```

---

### Tarefa 3: fileira de botões de nota na página inicial

**Files:**
- Create: `components/FiltroNota.tsx`
- Create: `components/classeFiltro.ts`
- Modify: `components/FiltroStreamings.tsx` (passa a importar `classeFiltro`)
- Modify: `app/page.tsx`
- Modify: `components/Cabecalho.tsx`, `components/CampoBusca.tsx`
- Modify: `components/GradeFilmes.tsx`

**Interfaces:**
- Consumes: `NOTAS_FILTRO`, `FiltrosCatalogo`, `montarHref` (Tarefa 1); `listarFilmes`/`buscarFilmes` com `nota` (Tarefa 2).
- Produces:
  - `classeFiltro(ativa: boolean, comLogo: boolean): string`: é a função `classe` que hoje está em `FiltroStreamings.tsx`, movida sem mudanças.
  - `FiltroNota({ filtros }: { filtros: FiltrosCatalogo })`
  - `Cabecalho` ganha a prop opcional `nota?: number | null` (padrão `null`), repassada a `CampoBusca({ busca, streaming, nota })`.
  - `GradeFilmes` ganha a prop `comBusca: boolean`.

- [ ] **Step 1: Mover a classe dos botões**

Mova `classe` de `FiltroStreamings.tsx` para `components/classeFiltro.ts` como `classeFiltro`, e importe em `FiltroStreamings`. O visual não muda.

- [ ] **Step 2: Criar `FiltroNota`**

Um `<nav aria-label="Filtrar por nota">` com o mesmo layout de `FiltroStreamings` (rolagem horizontal no celular, quebra de linha no desktop). Ele tem o rótulo visível "Nota" e os links "Qualquer" (`nota: null`), "6+", "7+", "8+", "9+" (a partir de `NOTAS_FILTRO`). Cada link usa `montarHref(filtros, { nota })`, `aria-current="page"` quando está ativo e `classeFiltro(ativa, false)`. O ícone de estrela fica a critério de quem implementa (SVG com `aria-hidden`).

- [ ] **Step 3: Ligar na página**

Em `app/page.tsx`: passe `nota` para `listarFilmes`/`buscarFilmes`. Renderize `<FiltroNota filtros={filtros} />` logo abaixo de `FiltroStreamings`, no mesmo contêiner, com `space-y-3` entre as duas fileiras. Passe `nota` para `Cabecalho` e `comBusca={busca !== null}` para `GradeFilmes`.

- [ ] **Step 4: Busca mantém a nota e a mensagem de vazio**

`CampoBusca`: adicione `<input type="hidden" name="nota" value={nota} />` quando `nota !== null`, como já é feito com o streaming. `GradeFilmes`, sem resultados e sem mais páginas: com `comBusca` mantém "Nenhum filme com esse nome está no streaming agora."; sem busca mostra "Nenhum filme com essa nota neste streaming."

- [ ] **Step 5: Verificar**

Run: `Set-Location "C:\projetos\catalogo-filmes"; npx vitest run; npm run lint; npm run build`
Expected: os testes passam, o lint não mostra erros e o build termina.

Depois, com `npm run dev`, confira:
- `/?nota=8`: só filmes com nota ≥ 8 nos cartões, e o botão "8+" marcado.
- Escolher "8+" e depois um streaming mantém os dois filtros. Ir para a página 2 mantém a nota.
- Com "8+" ativo, buscar "batman": a URL tem `nota=8` e os resultados respeitam a nota.
- "Qualquer" remove `nota` da URL.
- A 375px de largura, as duas fileiras rolam na horizontal sem criar rolagem horizontal na página.

- [ ] **Step 6: Commit**

```bash
git add components app
git commit -m "feat: botões de filtro por nota na página inicial"
```
