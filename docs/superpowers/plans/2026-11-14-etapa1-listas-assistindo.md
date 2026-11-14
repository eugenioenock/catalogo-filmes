# Etapa 1: lista "Assistindo" e tipo filme/série — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar a terceira lista pessoal, "Assistindo", e preparar o banco e o código para guardar filmes e séries sem confusão de id. O site publicado não sai do ar em nenhum momento.

**Architecture:**
- **Banco:** a tabela `marcacoes` ganha a coluna `tipo` e uma chave nova, numa migração em duas vezes. A expansão vem antes dos testes, e a contração vem depois do deploy em produção. Assim o código antigo, que já está publicado, continua funcionando.
- **Código:** a lógica pura (situações, listas, links, chaves) fica em `lib/listas.ts` e `lib/parametros.ts`, com testes. A camada do banco (`lib/marcacoes.ts`) passa a filtrar por tipo. A interface ganha o terceiro botão, a quarta aba e a etiqueta "Série" nos cartões. Ainda não existe série no site; elas chegam na Etapa 2.

**Tech Stack:** Next.js 16.4 (App Router, Server Components, Server Actions, `cacheComponents`), TypeScript, Tailwind 4, Vitest, `@supabase/ssr`, MCP do Supabase (`execute_sql`).

**Spec:** `docs/superpowers/specs/2026-11-14-series-recomendacoes-design.md` (seções "Etapa 1" e "Migração em duas vezes")

## Global Constraints

- **Um passo de cada vez:** o usuário acompanha um curso. No fim de cada tarefa, explique o que foi feito e por quê, e **espere o usuário** antes da próxima. Os passos marcados **PARE** pedem o OK dele. Não siga adiante sem esse OK.
- **Um só banco** atende o site local, as prévias e o site publicado na Vercel. Qualquer SQL afeta a produção na hora. Nunca aplique SQL sem o OK do usuário naquele momento.
- **O código publicado** grava com `onConflict: "user_id,filme_id"` e lê por `filme_id`. Até a contração (Task 5), o banco precisa aceitar esse código.
- **Valores:**
  - Tipos no banco: `'filme'`, `'serie'`.
  - Situações: `'quero_assistir'`, `'assistindo'`, `'ja_assisti'`.
  - Na URL: `?lista=quero-assistir`, `?lista=assistindo`, `?lista=ja-assisti`.
  - Nomes na tela: "Quero assistir", "Assistindo", "Já assisti", nessa ordem em todo lugar.
- **A coluna `filme_id` não muda de nome.**
- **Idioma:** textos da interface e nomes no código em português (pt-BR), seguindo o projeto.
- **Comandos:**
  - Testes a partir de `C:\` maiúsculo: `Set-Location "C:\projetos\catalogo-filmes"; npx vitest run`.
  - Lint: `npm run lint`. Build: `npm run build`.
- **Git:**
  - Branch `feat/listas-assistindo`.
  - Commits com a linha `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
  - Commit sempre com caminhos (`git add <arquivos>` e depois `git commit -m … -- <arquivos>`; arquivo novo precisa do `git add` antes), porque o `next.config.ts` está no índice e não pode entrar. Os blocos de commit abaixo mostram só o `git commit`.
- **Navegador:**
  - Contas de teste: `teste.cinecatalogo.…@example.com`. A conta `teste.cinecatalogo.17946974386452@example.com` (senha `123456`) não tem nome e cai em Completar cadastro ao entrar.
  - Use locators `:visible`, porque o Next mantém páginas anteriores escondidas no DOM.
  - O `playwright-core` já instalado está em `C:/Users/eugen/AppData/Local/Temp/claude/7a5c340af02a0257/872b2a23-881e-4b92-a347-73fc22431fd6/scratchpad/node_modules`.
  - Chrome do sistema: `C:/Program Files/Google/Chrome/Application/chrome.exe`.

## Review Focus

- **Código antigo depois da expansão.** O código publicado faz `insert … on conflict (user_id, filme_id) do update` e precisa continuar funcionando → verificação por SQL na Task 1.
- **As marcações que já existem.** Mesmo total de linhas, todas com `tipo = 'filme'`, mesma situação → contagem antes e depois na Task 1.
- **Desmarcar um filme não pode apagar a série de mesmo id** (e ler a situação do filme não pode pegar a da série) → filtro por `tipo` na Task 3 e verificação depois da contração na Task 5.
- **Filme e série com o mesmo id numa lista.**
  - Cada um precisa de uma `key` React própria e de um link próprio (`/filme/1399` × `/serie/1399`) → testes de `chaveDoTitulo` e `hrefDoTitulo` na Task 2.
  - Também precisa aparecer na grade → verificação na Task 5.
- **Clicar em "Assistindo" num filme que está em "Quero assistir"** move o filme, sem deixá-lo nas duas → teste de `proximaSituacao` na Task 2.
- **Os links antigos `?lista=quero-assistir` e `?lista=ja-assisti` continuam valendo.** `?lista=Assistindo` (maiúsculo) vira Catálogo → testes de `lerFiltros` na Task 2.
- **Quatro abas no celular (375px):** deslizam para o lado sem criar rolagem horizontal na página → verificação na Task 4.

---

### Task 1: Banco — expansão (e o SQL da contração, ainda sem aplicar)

**Files:**
- Create: `supabase/migracoes/2026-11-14-1-expandir.sql`
- Create: `supabase/migracoes/2026-11-14-2-contrair.sql`
- Modify: `supabase/esquema.sql` (estado final, para quem cria o banco do zero)

**Interfaces:**
- Produces, na tabela `public.marcacoes`:
  - coluna `tipo text not null default 'filme'`, com `check (tipo in ('filme','serie'))`;
  - `check` de `situacao` com as três situações;
  - chave primária `(user_id, tipo, filme_id)`;
  - índice único temporário `marcacoes_filme_unico` em `(user_id, filme_id)`.

- [ ] **Step 1: Ler os nomes reais das restrições.** Use o MCP: `select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.marcacoes'::regclass;`. Anote o nome do `check` de `situacao` (esperado: `marcacoes_situacao_check`) e da chave (esperado: `marcacoes_pkey`) e use esses nomes no SQL.

- [ ] **Step 2: Escrever `2026-11-14-1-expandir.sql`.** Um bloco `begin; … commit;`, que pode rodar de novo sem erro, nesta ordem:
  1. `add column if not exists tipo`;
  2. troca do `check` de tipo e do `check` de situação (`drop constraint if exists` + `add constraint`);
  3. `create unique index if not exists marcacoes_filme_unico on public.marcacoes (user_id, filme_id)`, **antes** de mexer na chave;
  4. `drop constraint if exists marcacoes_pkey` + `add constraint marcacoes_pkey primary key (user_id, tipo, filme_id)`.

  Comentários em português explicam cada passo, inclusive que o índice único é temporário e existe só para o código publicado. Também explicam que `filme_id` guarda o id do TMDB de filme ou de série.

- [ ] **Step 3: Escrever `2026-11-14-2-contrair.sql`.** Só `drop index if exists public.marcacoes_filme_unico;`, com um comentário: "rodar só depois que a Etapa 1 estiver publicada em produção".

- [ ] **Step 4: Atualizar `supabase/esquema.sql`.** Ele passa a descrever o estado final: a coluna `tipo`, as três situações, a chave `(user_id, tipo, filme_id)` e nenhum índice `marcacoes_filme_unico`. As políticas e o índice da lista não mudam.

- [ ] **Step 5: Contar antes.** Pelo MCP: `select situacao, count(*) from public.marcacoes group by situacao;`. Guarde o resultado no registro da tarefa.

- [ ] **Step 6: PARE. Mostrar o SQL da expansão ao usuário.** Explique o que cada parte faz e por que o site publicado continua funcionando. Espere o OK para aplicar.

- [ ] **Step 7: Aplicar a expansão** pelo MCP (`execute_sql` com o conteúdo do arquivo).

- [ ] **Step 8: Conferir.** Pelo MCP:
  - `select tipo, situacao, count(*) … group by tipo, situacao` → os mesmos totais do Step 5, todos com `tipo = 'filme'`.
  - `pg_constraint` → a chave é `(user_id, tipo, filme_id)` e o `check` de situação aceita `assistindo`. `pg_indexes` → `marcacoes_filme_unico` existe.
  - Código antigo: para uma conta de teste (pegue o `id` em `auth.users` por e-mail), rode `insert into public.marcacoes (user_id, filme_id, situacao, titulo) values (…, 27205, 'quero_assistir', 'teste') on conflict (user_id, filme_id) do update set situacao = 'ja_assisti';` duas vezes. Esperado: sem erro, e uma linha só, com `ja_assisti`. Depois apague essa linha.
  - Abrir https://catalogo-filmes-chi-navy.vercel.app/filme/27205 com uma conta de teste e marcar/desmarcar → funciona como antes.

- [ ] **Step 9: Commit**

```bash
git commit -m "feat(banco): expansão da tabela marcacoes para tipo e Assistindo" -- supabase/migracoes supabase/esquema.sql
```

---

### Task 2: Regras puras — situações, tipo, links e chaves

**Files:**
- Modify: `lib/listas.ts`, `lib/listas.test.ts`
- Modify: `lib/parametros.ts`, `lib/parametros.test.ts`
- Modify: `lib/tmdb.ts` (só `FilmeResumo` e `resumir`), `lib/tmdb.test.ts` (os `toEqual` das linhas ~172, ~225 e ~307 ganham `tipo: "filme"`)
- Modify: `lib/marcacoes.ts` (só a contagem: `Record<Situacao, number>` com `assistindo: 0`)

**Interfaces:**
- Produces (`lib/listas.ts`):
  - `type Tipo = "filme" | "serie"`
  - `type Situacao = "quero_assistir" | "assistindo" | "ja_assisti"`
  - `type ListaUrl = "quero-assistir" | "assistindo" | "ja-assisti"`
  - `LISTAS: readonly ListaUrl[] = ["quero-assistir", "assistindo", "ja-assisti"]`
  - `SITUACOES: readonly Situacao[] = ["quero_assistir", "assistindo", "ja_assisti"]`, a ordem dos botões
  - `NOME_DA_SITUACAO.assistindo = "Assistindo"`
  - `LinhaMarcacao` ganha `tipo: Tipo`; `linhaParaFilme` copia o `tipo`
  - `mensagemListaVazia(lista)`: "Você ainda não marcou nenhum título como {nome}. Abra um filme no catálogo para marcar."
  - `hrefDoTitulo(t: { tipo: Tipo; id: number }): string` → `/filme/{id}` ou `/serie/{id}`
  - `chaveDoTitulo(t: { tipo: Tipo; id: number }): string` → `filme-{id}` ou `serie-{id}`
- Produces (`lib/tmdb.ts`): `FilmeResumo` ganha `tipo: Tipo`; `resumir` devolve `tipo: "filme"`.

- [ ] **Step 1: Escrever os testes que falham**, acrescentando ao que já existe:

```ts
// lib/listas.test.ts
it("proximaSituacao: Assistindo tira de Quero assistir", () =>
  expect(proximaSituacao("quero_assistir", "assistindo")).toBe("assistindo"));
it("proximaSituacao: clicar em Assistindo aceso desmarca", () =>
  expect(proximaSituacao("assistindo", "assistindo")).toBeNull());
it("cada lista da URL corresponde a uma situação, na ordem da tela", () =>
  expect(LISTAS.map((l) => SITUACAO_DA_LISTA[l])).toEqual(["quero_assistir", "assistindo", "ja_assisti"]));
it("SITUACOES segue a mesma ordem", () => expect(SITUACOES).toEqual(["quero_assistir", "assistindo", "ja_assisti"]));
it("nome da lista Assistindo", () => expect(NOME_DA_SITUACAO.assistindo).toBe("Assistindo"));
it("mensagem vazia fala em título", () =>
  expect(mensagemListaVazia("assistindo")).toBe(
    "Você ainda não marcou nenhum título como assistindo. Abra um filme no catálogo para marcar."));
it("linhaParaFilme mantém o tipo", () => expect(linhaParaFilme({ ...linha, tipo: "serie" }).tipo).toBe("serie"));
it("hrefDoTitulo", () => {
  expect(hrefDoTitulo({ tipo: "filme", id: 1399 })).toBe("/filme/1399");
  expect(hrefDoTitulo({ tipo: "serie", id: 1399 })).toBe("/serie/1399");
});
it("chaveDoTitulo separa filme e série de mesmo id", () =>
  expect(new Set([chaveDoTitulo({ tipo: "filme", id: 1399 }), chaveDoTitulo({ tipo: "serie", id: 1399 })]).size).toBe(2));

// lib/parametros.test.ts
it.each(["quero-assistir", "assistindo", "ja-assisti"])("lê lista %s", …);          // amplia o it.each atual
it.each(["Assistindo", "assistindo ", "estou-assistindo"])("lista inválida %s vira null", …);
it("hrefDaLista assistindo", () => expect(hrefDaLista("assistindo")).toBe("/?lista=assistindo"));
```

  Os testes existentes de `linhaParaFilme` (a `linha` ganha `tipo: "filme"`, e o `toEqual` completo também) e das mensagens são atualizados para o formato e o texto novos. Nos `toEqual` de `lib/tmdb.test.ts`, os filmes vindos do TMDB ganham `tipo: "filme"`.

- [ ] **Step 2: Rodar e ver falhar.** `npx vitest run lib/listas.test.ts lib/parametros.test.ts` → FAIL (`SITUACOES`, `hrefDoTitulo` e `chaveDoTitulo` não existem; textos diferentes).

- [ ] **Step 3: Implementar as interfaces acima.**
  - `listaDoFiltro` em `parametros.ts` já usa `LISTAS`, então só os tipos mudam.
  - Em `marcacoes.ts`, só a contagem inicial ganha `assistindo: 0`.

- [ ] **Step 4: Rodar tudo.** `npx vitest run` → PASS. `npx tsc --noEmit` → sem erros. `npm run lint` → sem erros.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: regras da lista Assistindo e do tipo filme/série" -- lib/listas.ts lib/listas.test.ts lib/parametros.ts lib/parametros.test.ts lib/tmdb.ts lib/tmdb.test.ts lib/marcacoes.ts
```

---

### Task 3: Marcações por tipo e os três botões

**Files:**
- Modify: `lib/marcacoes.ts`
- Modify: `app/filme/[id]/acoes.ts`
- Modify: `components/BotoesMarcar.tsx`, `components/FormularioMarcar.tsx`

**Interfaces:**
- Consumes: `Tipo`, `Situacao`, `SITUACOES` (Task 2).
- Produces (`lib/marcacoes.ts`):
  - `situacaoDoTitulo(tipo: Tipo, id: number): Promise<Situacao | null>`, no lugar de `situacaoDoFilme`. Filtra `eq("tipo", tipo).eq("filme_id", id)`.
  - `gravarSituacao(titulo: FilmeResumo, situacao: Situacao | null): Promise<void>`. Grava `tipo: titulo.tipo`, usa `onConflict: "user_id,tipo,filme_id"`, e o `delete` filtra por `tipo` **e** `filme_id`.
  - `listarMarcacoes(situacao)`: inclui `tipo` no `select`.
- `alternarMarcacao(filmeId: number, clicada: Situacao)` mantém a assinatura, porque nesta etapa só filmes têm página. Ela chama `situacaoDoTitulo("filme", filmeId)`. A Etapa 2 acrescenta o tipo.

- [ ] **Step 1: Trocar as funções de `lib/marcacoes.ts`** como no Interfaces e atualizar quem chama `situacaoDoFilme` (o Grep mostra: `acoes.ts`, `BotoesMarcar.tsx`).

- [ ] **Step 2: Os botões usam `SITUACOES`.** `BotoesMarcar` e `FormularioMarcar` apagam a constante local `SITUACOES` e importam a de `lib/listas.ts`. Assim aparecem três botões, na ordem da tela, com ou sem login.

- [ ] **Step 3: Verificar.** `npx vitest run`, `npx tsc --noEmit` e `npm run lint` → sem erros.

- [ ] **Step 4: Verificar no navegador** (http://localhost:3000, 375px e 1440px), com uma conta de teste em `/filme/27205`:
  - três botões, na ordem "Quero assistir", "Assistindo", "Já assisti";
  - Quero assistir → Assistindo → Já assisti → clicar no aceso desmarca;
  - depois de cada clique, uma linha só no banco (MCP: `select tipo, situacao from public.marcacoes where filme_id = 27205 and user_id = …`), com `tipo = 'filme'`;
  - sem login, os três levam para `/entrar?volta=…`.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: marcações por tipo e o botão Assistindo" -- lib/marcacoes.ts "app/filme/[id]/acoes.ts" components/BotoesMarcar.tsx components/FormularioMarcar.tsx
```

---

### Task 4: Aba Assistindo, cartões com tipo e etiqueta "Série"

**Files:**
- Modify: `components/CartaoFilme.tsx`, `components/GradeFilmes.tsx`, `components/EmAlta.tsx`, `components/Banner.tsx`
- Modify: `components/AbasListas.tsx` (só se precisar de ajuste visual; as abas já vêm de `LISTAS`)
- Modify: `components/ListaPessoal.tsx` (comentário "Quero assistir ou Já assisti" → as três listas)

**Interfaces:**
- Consumes: `hrefDoTitulo`, `chaveDoTitulo` (Task 2); `listarMarcacoes` com `tipo` (Task 3).

- [ ] **Step 1: Links e chaves.**
  - Todo link para a página de um título usa `hrefDoTitulo`: `CartaoFilme`, `EmAlta` e `Banner` (inclusive o `#onde-assistir`).
  - Toda lista de cartões usa `key={chaveDoTitulo(filme)}`.

- [ ] **Step 2: Etiqueta "Série".**
  - Quando `filme.tipo === "serie"`, o cartão mostra uma etiqueta pequena "Série" sobre o canto superior esquerdo do pôster, no estilo "sala escura" (tokens de `app/globals.css`).
  - O texto fica visível e legível para leitores de tela.
  - Filmes não ganham etiqueta.

- [ ] **Step 3: Verificar.** `npx vitest run`, `npx tsc --noEmit`, `npm run lint` e `npm run build` → sem erros.

- [ ] **Step 4: Verificar no navegador** (375px e 1440px):
  - o cabeçalho mostra "Catálogo | Quero assistir (n) | Assistindo (n) | Já assisti (n)";
  - em 375px, as abas deslizam e a página não tem rolagem horizontal (`document.documentElement.scrollWidth === 375`);
  - `/?lista=assistindo` mostra o filme marcado na Task 3, e o cartão leva para `/filme/27205`;
  - lista vazia mostra a mensagem nova;
  - sem login, a aba pede para entrar;
  - o Catálogo, o Top 10 e o banner continuam iguais.
  - Para ver a etiqueta "Série" antes da Etapa 2: inserir pelo MCP uma linha `tipo = 'serie'` (por exemplo `filme_id = 1399`, título "Game of Thrones") para a conta de teste. Conferir o cartão com a etiqueta e o link `/serie/1399`, que dá "não encontrado" até a Etapa 2. Depois apagar a linha. *Não use um id que a conta já tenha como filme: até a contração, o índice único não deixa.*
  - Tirar capturas em 375px e 1440px para mostrar ao usuário.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: aba Assistindo, links por tipo e etiqueta Série" -- components/CartaoFilme.tsx components/GradeFilmes.tsx components/EmAlta.tsx components/Banner.tsx components/AbasListas.tsx components/ListaPessoal.tsx
```

---

### Task 5: Entrega e contração do banco (só com o OK do usuário)

- [ ] **Step 1: Revisão do branch inteiro** (`main..feat/listas-assistindo`) por um revisor novo. Corrija os itens críticos e importantes antes de seguir.

- [ ] **Step 2: PARE. Conferência do usuário.** Mostre as capturas e peça que ele confira no próprio navegador e no celular. Espere o OK.

- [ ] **Step 3: Entregar.**
  - Merge de `feat/listas-assistindo` em `main` (fast-forward), `git push origin main` e apagar o branch.
  - Esperar a Vercel publicar. Conferir em https://catalogo-filmes-chi-navy.vercel.app que `/filme/27205` mostra três botões.

- [ ] **Step 4: PARE. Pedir o OK para a contração.** Mostre o `2026-11-14-2-contrair.sql` e explique: daqui em diante, filme e série com o mesmo id podem conviver. Espere o OK.

- [ ] **Step 5: Aplicar a contração** pelo MCP e conferir em `pg_indexes` que `marcacoes_filme_unico` não existe mais.

- [ ] **Step 6: Conferir a chave nova e o filtro por tipo.** Com uma conta de teste:
  1. Marque `/filme/1399` como "Quero assistir" no navegador. Se esse id não tiver filme no TMDB, use outro id de filme que também exista como série, e anote qual.
  2. Insira pelo MCP uma linha `tipo = 'serie'` com o mesmo `filme_id`, como "Assistindo".
  3. As abas mostram os dois, cada um na sua lista, com links diferentes.
  4. Desmarque o filme no navegador → a linha da série continua no banco.
  5. Apague a linha da série.

- [ ] **Step 7: Atualizar a memória do projeto** e avisar o usuário que a Etapa 2 (Séries) é a próxima, com o plano dela.
