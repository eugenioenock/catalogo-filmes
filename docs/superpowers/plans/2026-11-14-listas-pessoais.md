# Listas pessoais com login — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Contas com e-mail e senha no Supabase, e duas listas pessoais ("Quero assistir" e "Já assisti"). A pessoa marca os filmes na página de detalhes e navega pelas listas em abas no cabeçalho da página inicial.

**Architecture:** O `@supabase/ssr` guarda a sessão em cookie. O `proxy.ts` renova a sessão a cada requisição. Entrar, criar conta, sair e marcar são Server Actions. Tudo o que depende de quem está logado (área da conta, números das abas, listas, botões) é um Server Component assíncrono atrás de `<Suspense>`, por causa do `cacheComponents`. As marcações ficam numa tabela `marcacoes` com RLS. A lógica pura (URL, validação, tradução de erros, regras das listas) fica em módulos separados, testados com Vitest.

**Tech Stack:** Next.js 16.4 (App Router, Server Components, Server Actions, `cacheComponents`), TypeScript, Tailwind 4, Vitest, `@supabase/ssr` 0.12 + `@supabase/supabase-js` 2.

**Spec:** `docs/superpowers/specs/2026-11-14-listas-pessoais-design.md`

## Global Constraints

- **Um passo de cada vez:** o usuário acompanha um curso. No fim de cada tarefa, explique o que foi feito e por quê, e **espere o usuário** antes da próxima. Os passos marcados **PARE** são do usuário, no painel do Supabase ou no `.env.local`. Não os faça e não siga adiante sem ele.
- Antes de escrever código, leia `AGENTS.md` e os guias `node_modules/next/dist/docs/01-app/02-guides/authentication.md`, `authentication-with-cache-components.md` e `01-getting-started/16-proxy.md`. Neste Next o middleware se chama **proxy** (`proxy.ts`, função `proxy`).
- Tudo o que lê o usuário (cookies) fica atrás de `<Suspense>`. A aba Catálogo não pode esperar pelo Supabase.
- Sem chaves do Supabase, ou com o Supabase fora do ar: o catálogo e os detalhes funcionam, o cabeçalho mostra "Entrar" e nada derruba a página.
- Só a chave **pública** (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). A chave secreta (service role / secret) nunca entra no projeto.
- Variáveis: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Situações no banco: `quero_assistir`, `ja_assisti`. Na URL: `?lista=quero-assistir`, `?lista=ja-assisti`.
- Senha com no mínimo **6** caracteres. Sem confirmação por e-mail.
- Textos da interface e nomes no código em português (pt-BR), seguindo o projeto.
- Testes a partir de `C:\` maiúsculo: `Set-Location "C:\projetos\catalogo-filmes"; npx vitest run` (com `c:\` minúsculo eles falham). Lint: `npm run lint`. Build: `npm run build`.
- Branch: `feat/listas-pessoais`. Commits com a linha `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- `?volta=//site.com`, `?volta=https://site.com`, `?volta=/\site.com` ou `volta` vazio: depois de entrar, a pessoa cai em `/`, nunca fora do site → teste de `lerVolta` na Tarefa 2.
- Clicar no botão que já está aceso desmarca o filme. Clicar no outro troca de lista, sem deixar o filme nas duas → teste de `proximaSituacao` na Tarefa 3 e a chave primária na Tarefa 1.
- `.env.local` sem as chaves do Supabase: o site abre, o cabeçalho mostra "Entrar" e as abas pessoais pedem para entrar → teste de `configSupabase` na Tarefa 1 e verificação manual na Tarefa 4.
- `?lista=abc`, `?lista=` vazio ou `lista` repetido: inválido vira Catálogo, repetido usa o primeiro → teste de `lerFiltros` na Tarefa 4.
- Uma segunda conta não vê nem altera as marcações da primeira → políticas RLS na Tarefa 1 e verificação manual com duas contas na Tarefa 4.

---

### Task 1: Supabase ligado ao projeto (tabela, chaves, clientes e proxy)

**Files:**
- Create: `supabase/esquema.sql`
- Create: `lib/supabase/config.ts`, `lib/supabase/config.test.ts`
- Create: `lib/supabase/servidor.ts`
- Create: `proxy.ts`
- Modify: `.env.example`, `README.md`, `package.json` (dependências)

**Interfaces:**
- Produces:
  - `configSupabase(): { url: string; chave: string } | null` (`lib/supabase/config.ts`, puro). Devolve `null` se alguma variável estiver ausente ou vazia.
  - `criarClienteServidor(): Promise<SupabaseClient | null>` (`lib/supabase/servidor.ts`, `server-only`). Usa `createServerClient` com `cookies()` de `next/headers` (`getAll` / `setAll`). O `setAll` fica num `try/catch`, porque Server Components não podem gravar cookies (quem renova é o proxy). Devolve `null` sem configuração.
  - Tabela `public.marcacoes`, exatamente como na spec.

- [ ] **Step 1: Escrever `supabase/esquema.sql`**

A tabela `marcacoes` da spec: as colunas, `primary key (user_id, filme_id)`, `user_id uuid not null references auth.users(id) on delete cascade`, `situacao` com `check (situacao in ('quero_assistir','ja_assisti'))`, `marcado_em timestamptz not null default now()`, `alter table ... enable row level security` e quatro políticas (`select`, `insert`, `update`, `delete`) `to authenticated`, com `using` / `with check` `((select auth.uid()) = user_id)`. Comentários em português explicam cada bloco, porque o usuário vai ler o arquivo na aula.

- [ ] **Step 2: PARE. O usuário prepara o Supabase**

Explique e espere o usuário fazer:
1. Criar um projeto em supabase.com (plano gratuito).
2. Abrir o SQL Editor, colar `supabase/esquema.sql` e rodar.
3. Authentication → Sign In / Providers → Email: desligar **Confirm email**.
4. Project Settings → API Keys: copiar a URL do projeto e a *publishable key* (`sb_publishable_…`; em projetos antigos, a *anon key*) para o `.env.local`, com os nomes das variáveis acima.

Confira só que as duas variáveis existem no `.env.local`, sem mostrar os valores.

- [ ] **Step 3: Instalar as dependências**

Run: `npm install @supabase/ssr @supabase/supabase-js`
Expected: as duas aparecem em `dependencies`.

- [ ] **Step 4: Escrever o teste de `configSupabase`**

```ts
// lib/supabase/config.test.ts — use vi.stubEnv e vi.unstubAllEnvs no afterEach
it("devolve url e chave quando as duas existem", () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_x");
  expect(configSupabase()).toEqual({ url: "https://abc.supabase.co", chave: "sb_publishable_x" });
});
it("devolve null sem a url", () => { /* só a chave definida */ expect(configSupabase()).toBeNull(); });
it("devolve null sem a chave", () => { /* só a url definida */ expect(configSupabase()).toBeNull(); });
it("devolve null com valores vazios", () => { /* as duas "" */ expect(configSupabase()).toBeNull(); });
```

- [ ] **Step 5: Rodar e ver falhar**

Run: `Set-Location "C:\projetos\catalogo-filmes"; npx vitest run lib/supabase/config.test.ts`
Expected: FAIL, módulo `./config` não encontrado.

- [ ] **Step 6: Implementar `configSupabase` e `criarClienteServidor`**

- [ ] **Step 7: Implementar `proxy.ts`**

`export async function proxy(request: NextRequest)`: sem `configSupabase()`, devolve `NextResponse.next()`. Com configuração, cria o cliente com `request.cookies.getAll()` e um `setAll` que grava os cookies no request e numa nova `NextResponse.next({ request })`, e chama `await supabase.auth.getClaims()` para renovar a sessão. Esse é o padrão do guia de SSR do Supabase para Next. Um erro do Supabase não pode virar erro 500: capture e siga com `NextResponse.next()`.
`export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"] }`

- [ ] **Step 8: Atualizar `.env.example` e `README.md`**

Em `.env.example`, as duas variáveis com valores de exemplo (`cole_aqui_…`). No `README.md`, uma seção "Supabase" com os 4 passos do Step 2.

- [ ] **Step 9: Verificar**

Run: `Set-Location "C:\projetos\catalogo-filmes"; npx vitest run; npm run lint; npm run build`
Expected: todos os testes passam (82 + 4), lint sem erros, build ok.
Depois, com `npm run dev`: `/` e `/filme/27205` abrem como antes e o terminal não mostra erros do proxy.

- [ ] **Step 10: Commit**

```bash
git add supabase/esquema.sql lib/supabase proxy.ts .env.example README.md package.json package-lock.json
git commit -m "feat: ligar o Supabase (tabela marcacoes, clientes e proxy)"
```

- [ ] **Step 11: PARE. Explique ao usuário o que cada arquivo faz e espere antes da Tarefa 2**

---

### Task 2: Entrar, criar conta e sair

**Files:**
- Create: `lib/conta.ts`, `lib/conta.test.ts` (puro)
- Create: `lib/usuario.ts` (`server-only`)
- Create: `app/conta/acoes.ts` (`"use server"`)
- Create: `components/FormularioConta.tsx` (`"use client"`)
- Create: `app/entrar/page.tsx`, `app/criar-conta/page.tsx`
- Create: `components/AreaConta.tsx`, `components/LinkEntrar.tsx`
- Modify: `components/Cabecalho.tsx`

**Interfaces:**
- Consumes: `criarClienteServidor()` (Tarefa 1).
- Produces:
  - `lerVolta(valor: unknown): string` (`lib/conta.ts`): devolve o valor só se ele for uma string que começa com `/` e não começa com `//` nem com `/\`. Nos outros casos, `"/"`.
  - `validarCredenciais(email: string, senha: string, modo: "entrar" | "criar"): string | null`: a mensagem de erro, ou `null` se estiver tudo certo.
  - `traduzirErroAuth(codigo: string | undefined): string`: recebe o `error.code` do Supabase Auth.
  - `type EstadoConta = { erro: string | null; email: string }`
  - `usuarioAtual(): Promise<{ id: string; email: string } | null>` (`lib/usuario.ts`): envolvido em `cache` do React. Usa `supabase.auth.getClaims()` (`sub` e `email`). Sem configuração, sem sessão ou com qualquer erro, devolve `null`.
  - Server Actions (`app/conta/acoes.ts`): `entrar(estado: EstadoConta, dados: FormData): Promise<EstadoConta>`, `criarConta(estado: EstadoConta, dados: FormData): Promise<EstadoConta>` e `sair(): Promise<void>`. Os campos do formulário são `email`, `senha` e `volta`. Em caso de sucesso, `redirect(lerVolta(dados.get("volta")))`. O `sair` faz `signOut()` e `redirect("/")`.
  - `<AreaConta />`: Server Component assíncrono. Sem login, mostra `<LinkEntrar />`. Logado, mostra o e-mail (truncado, `max-w`) e um `<form action={sair}>` com o botão **Sair**.
  - `<LinkEntrar />` (`components/LinkEntrar.tsx`, `"use client"`): um link **Entrar** para `/entrar?volta=<caminho atual>`. O caminho atual é `usePathname()` mais `useSearchParams()`, passado por `encodeURIComponent`. Com ele, a pessoa volta para onde estava, como pede a spec.

Textos fixos:
- E-mail sem `@` ou vazio: `"Digite um e-mail válido."`
- Senha vazia (entrar): `"Digite sua senha."`
- Senha com menos de 6 (criar): `"A senha precisa ter pelo menos 6 caracteres."`
- `invalid_credentials` → `"E-mail ou senha incorretos."`
- `user_already_exists` ou `email_exists` → `"Este e-mail já está cadastrado. Entre com sua senha."`
- `weak_password` → `"A senha precisa ter pelo menos 6 caracteres."`
- `email_address_invalid` → `"Digite um e-mail válido."`
- qualquer outro código, ou `undefined` → `"Não foi possível falar com o servidor agora. Tente de novo."`

- [ ] **Step 1: Escrever os testes de `lib/conta.ts`**

```ts
describe("lerVolta", () => {
  it.each(["/", "/filme/27205", "/?lista=ja-assisti"])("aceita %s", (v) => expect(lerVolta(v)).toBe(v));
  it.each(["//site.com", "https://site.com", "/\\site.com", "", "filme/1", null, undefined, 42])(
    "troca %s por /", (v) => expect(lerVolta(v)).toBe("/"));
});
describe("validarCredenciais", () => {
  it("aceita e-mail e senha válidos", () => expect(validarCredenciais("a@b.com", "123456", "criar")).toBeNull());
  it("e-mail sem @", () => expect(validarCredenciais("ab.com", "123456", "entrar")).toBe("Digite um e-mail válido."));
  it("e-mail só com espaços", () => expect(validarCredenciais("   ", "123456", "entrar")).toBe("Digite um e-mail válido."));
  it("senha vazia ao entrar", () => expect(validarCredenciais("a@b.com", "", "entrar")).toBe("Digite sua senha."));
  it("senha curta ao criar", () =>
    expect(validarCredenciais("a@b.com", "12345", "criar")).toBe("A senha precisa ter pelo menos 6 caracteres."));
  it("senha curta ao entrar não é barrada aqui", () => expect(validarCredenciais("a@b.com", "12345", "entrar")).toBeNull());
});
describe("traduzirErroAuth", () => {
  it.each([
    ["invalid_credentials", "E-mail ou senha incorretos."],
    ["user_already_exists", "Este e-mail já está cadastrado. Entre com sua senha."],
    ["email_exists", "Este e-mail já está cadastrado. Entre com sua senha."],
    ["weak_password", "A senha precisa ter pelo menos 6 caracteres."],
    ["email_address_invalid", "Digite um e-mail válido."],
    ["over_request_rate_limit", "Não foi possível falar com o servidor agora. Tente de novo."],
    [undefined, "Não foi possível falar com o servidor agora. Tente de novo."],
  ])("%s", (codigo, msg) => expect(traduzirErroAuth(codigo)).toBe(msg));
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `Set-Location "C:\projetos\catalogo-filmes"; npx vitest run lib/conta.test.ts`
Expected: FAIL, módulo `./conta` não encontrado.

- [ ] **Step 3: Implementar `lib/conta.ts`**

O e-mail é validado depois de `trim()`, e a action usa esse e-mail já sem espaços.

- [ ] **Step 4: Rodar os testes**

Run: `Set-Location "C:\projetos\catalogo-filmes"; npx vitest run lib/conta.test.ts`
Expected: PASS.

- [ ] **Step 5: Implementar `lib/usuario.ts` e `app/conta/acoes.ts`**

As actions validam com `validarCredenciais` antes de chamar o Supabase (`signInWithPassword` / `signUp`) e traduzem o `error.code` com `traduzirErroAuth`. Um erro devolve `{ erro, email }`, para o formulário não perder o e-mail digitado. Sem configuração do Supabase, devolvem o erro genérico. O `redirect` fica **fora** de qualquer `try/catch`.

- [ ] **Step 6: Implementar `FormularioConta` e as páginas**

`FormularioConta({ modo, volta }: { modo: "entrar" | "criar"; volta: string })` usa `useActionState` com `entrar` ou `criarConta`. Os campos `email` (`type="email"`, `autoComplete="email"`) e `senha` (`type="password"`, `autoComplete` `current-password` ou `new-password`) têm `<label>`. A `volta` vai num campo oculto. O erro aparece com `role="alert"`, e o botão fica desativado durante o envio. Abaixo, um link para a outra página, mantendo `?volta=`.
`/entrar` (título "Entrar", botão "Entrar", link "Ainda não tem conta? Criar conta") e `/criar-conta` (título "Criar conta", botão "Criar conta", link "Já tem conta? Entrar") leem `searchParams.volta` com `lerVolta` dentro de `<Suspense>`, e cada uma tem o `Cabecalho` de sempre. O visual segue o site: `bg-poltrona`, `ring-tela/10`, botão `bg-projetor text-sala`, coluna estreita centralizada.

- [ ] **Step 7: `AreaConta` no `Cabecalho`**

O `Cabecalho` mostra `<Suspense fallback={null}><AreaConta /></Suspense>` à direita da busca. Em 375px, a busca continua com a largura toda, e a área da conta fica na linha do nome do site, à direita.

- [ ] **Step 8: Verificar**

Run: `Set-Location "C:\projetos\catalogo-filmes"; npx vitest run; npm run lint; npm run build`
Expected: tudo passa.
Manual (`npm run dev`): criar uma conta → volta para `/` logado, com o e-mail no cabeçalho. Sair → aparece "Entrar". Entrar com a senha errada → "E-mail ou senha incorretos." Criar uma conta com o mesmo e-mail → a mensagem de já cadastrado. `/entrar?volta=//google.com` → depois de entrar, cai em `/`. Clicar em "Entrar" na página de um filme → depois de entrar, volta para o filme.

- [ ] **Step 9: Commit**

```bash
git add lib/conta.ts lib/conta.test.ts lib/usuario.ts app/conta app/entrar app/criar-conta components/FormularioConta.tsx components/AreaConta.tsx components/LinkEntrar.tsx components/Cabecalho.tsx
git commit -m "feat: entrar, criar conta e sair com o Supabase"
```

- [ ] **Step 10: PARE. Mostre ao usuário: a conta criada aparece em Authentication → Users no painel. Espere antes da Tarefa 3**

---

### Task 3: Marcar filmes na página de detalhes

**Files:**
- Create: `lib/listas.ts`, `lib/listas.test.ts` (puro)
- Create: `lib/marcacoes.ts` (`server-only`)
- Create: `app/filme/[id]/acoes.ts` (`"use server"`)
- Create: `components/BotoesMarcar.tsx` (servidor) e `components/FormularioMarcar.tsx` (`"use client"`)
- Modify: `app/filme/[id]/page.tsx`

**Interfaces:**
- Consumes: `criarClienteServidor()` (Tarefa 1), `usuarioAtual()` (Tarefa 2), `detalharFilme(id)` e `FilmeResumo` de `lib/tmdb.ts`.
- Produces (`lib/listas.ts`):
  - `type Situacao = "quero_assistir" | "ja_assisti"`
  - `type ListaUrl = "quero-assistir" | "ja-assisti"`
  - `const LISTAS: readonly ListaUrl[] = ["quero-assistir", "ja-assisti"]`
  - `const SITUACAO_DA_LISTA: Record<ListaUrl, Situacao>`
  - `const NOME_DA_SITUACAO: Record<Situacao, string>` = `{ quero_assistir: "Quero assistir", ja_assisti: "Já assisti" }`
  - `proximaSituacao(atual: Situacao | null, clicada: Situacao): Situacao | null`: se `clicada === atual`, devolve `null`; senão, `clicada`.
  - `type LinhaMarcacao = { filme_id: number; titulo: string; poster_url: string | null; ano: string | null; nota: number | string | null }`. O Supabase pode devolver um `numeric` como string.
  - `linhaParaFilme(linha: LinhaMarcacao): FilmeResumo`: `backdropUrl: null`, `sinopse: ""`, `generos: []`, `nota: Number(linha.nota ?? 0)`.
  - `mensagemListaVazia(lista: ListaUrl): string`:
    `"Você ainda não marcou nenhum filme como quero assistir. Abra um filme no catálogo para marcar."` /
    `"Você ainda não marcou nenhum filme como já assisti. Abra um filme no catálogo para marcar."`
- Produces (`lib/marcacoes.ts`):
  - `class MarcacoesIndisponiveisError extends Error`, lançada quando falta configuração ou o Supabase devolve erro.
  - `situacaoDoFilme(filmeId: number): Promise<Situacao | null>`: sem usuário, `null`.
  - `listarMarcacoes(situacao: Situacao): Promise<FilmeResumo[]>`, ordenada por `marcado_em desc`.
  - `contarMarcacoes(): Promise<Record<Situacao, number>>`, envolvida em `cache`.
  - `gravarSituacao(filme: FilmeResumo, situacao: Situacao | null): Promise<void>`. Com `null`, faz `delete` por `filme_id`. Com uma situação, faz `upsert` com `onConflict: "user_id,filme_id"`, `user_id` do `usuarioAtual()`, a cópia de título, pôster, ano e nota, e `marcado_em: new Date().toISOString()`.
- Produces (`app/filme/[id]/acoes.ts`):
  - `type EstadoMarcar = { erro: string | null }`
  - `alternarMarcacao(filmeId: number, clicada: Situacao, estado: EstadoMarcar, dados: FormData): Promise<EstadoMarcar>`, usada com `.bind(null, filmeId, clicada)`. Sem usuário, faz `redirect(\`/entrar?volta=/filme/${filmeId}\`)`. Com usuário: lê a situação atual, calcula `proximaSituacao`, busca o filme com `detalharFilme(filmeId)` (o servidor não confia em título ou pôster vindos do formulário), chama `gravarSituacao` e depois `refresh()` de `next/cache`. Se der erro, devolve `{ erro: "Não foi possível salvar agora. Tente de novo." }` e a situação continua como estava.

- [ ] **Step 1: Escrever os testes de `lib/listas.ts`**

```ts
describe("proximaSituacao", () => {
  it("sem marcação, marca a clicada", () => expect(proximaSituacao(null, "quero_assistir")).toBe("quero_assistir"));
  it("clicar na mesma desmarca", () => expect(proximaSituacao("ja_assisti", "ja_assisti")).toBeNull());
  it("clicar na outra troca de lista", () => expect(proximaSituacao("quero_assistir", "ja_assisti")).toBe("ja_assisti"));
});
describe("linhaParaFilme", () => {
  const linha = { filme_id: 27205, titulo: "A Origem", poster_url: "https://image.tmdb.org/t/p/w342/x.jpg", ano: "2010", nota: "8.4" };
  it("converte a linha para o formato do cartão", () =>
    expect(linhaParaFilme(linha)).toEqual({ id: 27205, titulo: "A Origem", ano: "2010",
      posterUrl: "https://image.tmdb.org/t/p/w342/x.jpg", backdropUrl: null, sinopse: "", nota: 8.4, generos: [] }));
  it("aceita filme sem pôster, ano e nota", () => {
    const f = linhaParaFilme({ ...linha, poster_url: null, ano: null, nota: null });
    expect([f.posterUrl, f.ano, f.nota]).toEqual([null, null, 0]);
  });
});
describe("mensagemListaVazia", () => {
  it("quero assistir", () => expect(mensagemListaVazia("quero-assistir")).toContain("como quero assistir"));
  it("já assisti", () => expect(mensagemListaVazia("ja-assisti")).toContain("como já assisti"));
});
it("cada lista da URL corresponde a uma situação", () =>
  expect(LISTAS.map((l) => SITUACAO_DA_LISTA[l])).toEqual(["quero_assistir", "ja_assisti"]));
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `Set-Location "C:\projetos\catalogo-filmes"; npx vitest run lib/listas.test.ts`
Expected: FAIL, módulo `./listas` não encontrado.

- [ ] **Step 3: Implementar `lib/listas.ts`**

- [ ] **Step 4: Rodar os testes**

Run: `Set-Location "C:\projetos\catalogo-filmes"; npx vitest run lib/listas.test.ts`
Expected: PASS.

- [ ] **Step 5: Implementar `lib/marcacoes.ts` e `app/filme/[id]/acoes.ts`**

O `redirect` fica fora do `try/catch`.

- [ ] **Step 6: Implementar os botões**

`<BotoesMarcar filmeId={id} />`, assíncrono: lê `usuarioAtual()` e `situacaoDoFilme(id)`.
- Sem login: dois links com o visual de botão para `/entrar?volta=/filme/<id>`.
- Logado: `<FormularioMarcar filmeId situacao />`, com dois `<form>`, um por situação, cada um com `useActionState(alternarMarcacao.bind(null, filmeId, s), { erro: null })`. O botão aceso usa `aria-pressed="true"` e `classeFiltro(true, false)`. O apagado usa `classeFiltro(false, false)`. Rótulos: `"+ Quero assistir"` / `"✓ Quero assistir"` e `"+ Já assisti"` / `"✓ Já assisti"`, conforme o estado. O erro aparece abaixo, com `role="alert"`.
- Se `situacaoDoFilme` lançar `MarcacoesIndisponiveisError`: `"Não foi possível carregar suas listas agora."`, no lugar dos botões.

Na página de detalhes, coloque `<Suspense fallback={null}><BotoesMarcar filmeId={filme.id} /></Suspense>` logo abaixo de `InfoFilme`, com `mt-6`.

- [ ] **Step 7: Verificar**

Run: `Set-Location "C:\projetos\catalogo-filmes"; npx vitest run; npm run lint; npm run build`
Expected: tudo passa.
Manual (`npm run dev`), logado: marcar "Quero assistir" → o botão acende. Marcar "Já assisti" → este acende e o outro apaga. Clicar no aceso → os dois apagam. Recarregar a página → o estado se mantém. No painel (Table Editor → `marcacoes`), as linhas acompanham. Deslogado, clicar num botão → vai para `/entrar?volta=/filme/<id>` e, depois de entrar, volta para o filme.

- [ ] **Step 8: Commit**

```bash
git add lib/listas.ts lib/listas.test.ts lib/marcacoes.ts "app/filme/[id]" components/BotoesMarcar.tsx components/FormularioMarcar.tsx
git commit -m "feat: marcar filmes como quero assistir ou já assisti"
```

- [ ] **Step 9: PARE. Mostre ao usuário a tabela `marcacoes` no painel e espere antes da Tarefa 4**

---

### Task 4: Abas na página inicial

**Files:**
- Modify: `lib/parametros.ts`, `lib/parametros.test.ts`
- Create: `components/AbasListas.tsx`, `components/ListaPessoal.tsx`
- Modify: `components/Cabecalho.tsx`, `components/Banner.tsx`, `app/page.tsx`

**Interfaces:**
- Consumes: `ListaUrl`, `LISTAS`, `SITUACAO_DA_LISTA`, `NOME_DA_SITUACAO`, `linhaParaFilme`, `mensagemListaVazia` (Tarefa 3); `listarMarcacoes`, `contarMarcacoes`, `MarcacoesIndisponiveisError` (Tarefa 3); `usuarioAtual` (Tarefa 2); `GradeFilmes`.
- Produces:
  - `FiltrosCatalogo` ganha `lista: ListaUrl | null`. `lerFiltros` aceita só os valores de `LISTAS` e usa o primeiro, se o parâmetro se repetir.
  - `hrefDaLista(lista: ListaUrl | null): string`: `null` → `"/"`; senão, `` `/?lista=${lista}` ``.
  - `montarHref` não muda: os links do Catálogo nunca levam `lista`.
  - `Cabecalho` ganha a prop `listaAtiva?: ListaUrl | null`. Quando ela vem (inclusive `null`), mostra `<AbasListas ativa={listaAtiva} />` numa linha abaixo do nome e da busca. Quando não vem (página de detalhes e de login), não mostra abas.
  - `<AbasListas ativa />`: um `<nav aria-label="Listas">` com três links (Catálogo, Quero assistir, Já assisti) e `aria-current="page"` na aba ativa. O número de cada aba pessoal vem num `<Suspense fallback={null}>` com um componente assíncrono que só aparece logado: `contarMarcacoes()` → ` (12)`, e esconde o número se der erro.
  - `<ListaPessoal lista />`, assíncrono. Sem usuário: o título "Entre para ver sua lista" e um link "Entrar" para `` `/entrar?volta=${encodeURIComponent(hrefDaLista(lista))}` ``. Com `MarcacoesIndisponiveisError`: `"Não foi possível carregar suas listas agora."`. Senão: um `<h2>` com `NOME_DA_SITUACAO[...]` e `<GradeFilmes filmes haMaisPaginas={false} mensagemVazia={mensagemListaVazia(lista)} />`.

- [ ] **Step 1: Atualizar os testes de `lib/parametros.test.ts`**

O `toEqual` de "usa padrões" ganha `lista: null`, e os objetos `atual` de `montarHref` também. Testes novos:

```ts
it.each(["quero-assistir", "ja-assisti"])("lê lista %s", (l) => expect(lerFiltros({ lista: l }).lista).toBe(l));
it.each(["abc", "", "quero_assistir", "QUERO-ASSISTIR"])("lista inválida %s vira null", (l) =>
  expect(lerFiltros({ lista: l }).lista).toBeNull());
it("lista repetida usa o primeiro valor", () =>
  expect(lerFiltros({ lista: ["ja-assisti", "quero-assistir"] }).lista).toBe("ja-assisti"));
describe("hrefDaLista", () => {
  it("Catálogo é a raiz", () => expect(hrefDaLista(null)).toBe("/"));
  it("lista pessoal vai na URL", () => expect(hrefDaLista("ja-assisti")).toBe("/?lista=ja-assisti"));
});
it("montarHref nunca leva a lista", () =>
  expect(montarHref({ ...atual, lista: "ja-assisti" }, { pagina: 2 })).toBe("/?streaming=8&busca=duna&pagina=2"));
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `Set-Location "C:\projetos\catalogo-filmes"; npx vitest run lib/parametros.test.ts`
Expected: FAIL nos testes novos.

- [ ] **Step 3: Implementar em `lib/parametros.ts`**

- [ ] **Step 4: Rodar os testes**

Run: `Set-Location "C:\projetos\catalogo-filmes"; npx vitest run lib/parametros.test.ts`
Expected: PASS.

- [ ] **Step 5: Abas no cabeçalho e lista pessoal na página inicial**

Em `app/page.tsx`, quando `filtros.lista !== null`, o `Catalogo` não chama o TMDB. Ele mostra `Cabecalho` (não sobreposto, `listaAtiva={filtros.lista}`, busca `null`) e `<ListaPessoal lista={filtros.lista} />` dentro de `main` (`mx-auto max-w-7xl px-4 pt-6 sm:px-8`). No Catálogo, passe `listaAtiva={null}`. O visual das abas segue o padrão do site: links em texto, com a ativa em `text-projetor` e um sublinhado. No `Banner`, aumente o `pt-36` (e o `sm:` correspondente) para o cabeçalho mais alto não cobrir "O mais popular nos streamings agora".

- [ ] **Step 6: Verificar**

Run: `Set-Location "C:\projetos\catalogo-filmes"; npx vitest run; npm run lint; npm run build`
Expected: tudo passa.
Manual (`npm run dev`):
1. Deslogado: as três abas aparecem, sem números. "Quero assistir" mostra "Entre para ver sua lista", e "Entrar" volta para a aba depois do login.
2. Logado: os números batem com as marcações. Cada aba mostra os filmes, do marcado mais recente para o mais antigo. Uma lista vazia mostra a mensagem certa. Clicar num cartão abre o filme.
3. Marcar um filme e voltar para `/` → o número e a lista já estão atualizados.
4. Criar uma **segunda conta** em outra janela anônima → as listas dela estão vazias, e as da primeira continuam intactas.
5. Apagar temporariamente as variáveis do Supabase do `.env.local` e reiniciar o dev → o catálogo e os detalhes abrem, o cabeçalho mostra "Entrar", e nada quebra. Depois, devolva as variáveis.
6. Capturas em 375px e 1440px da aba Catálogo (as abas aparecem na primeira tela, sem cobrir o destaque) e de uma aba pessoal.

- [ ] **Step 7: Commit**

```bash
git add lib/parametros.ts lib/parametros.test.ts components/AbasListas.tsx components/ListaPessoal.tsx components/Cabecalho.tsx components/Banner.tsx app/page.tsx
git commit -m "feat: abas Quero assistir e Já assisti na página inicial"
```

- [ ] **Step 8: PARE. Mostre as capturas ao usuário e peça a conferência dele em 375px. O merge, o push e o deploy só acontecem quando ele pedir. Na Vercel, as duas variáveis novas precisam ser cadastradas junto com `TMDB_TOKEN`**
