# Etapa 3: fileira "Para você" — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pessoas logadas que já marcaram algum título passam a ver, no Catálogo, uma fileira "Para você". Ela mostra até 20 filmes ou séries que a pessoa ainda não marcou, que estão em algum streaming no Brasil, cada um com o motivo da sugestão e o logo do streaming.

**Architecture:**
- **Regras puras** em `lib/recomendacoes.ts`, todas com testes:
  - sementes e pesos;
  - pontuação, exclusões e desempate;
  - motivo;
  - perfil de gêneros e a tabela filme ↔ série.
- **Acesso a dados** em `lib/tmdb.ts` e `lib/marcacoes.ts`: as recomendações de um título, onde ele está, o discover por gêneros, os ids de gênero dos detalhes e todas as marcações.
- **Montagem** em `lib/paraVoce.ts`: junta as duas partes, com a reserva por gênero quando sobram poucos cartões, e é testada com dados falsos.
- **Tela:** a fileira é um Server Component atrás do seu próprio `<Suspense>`. Qualquer erro faz a fileira sumir, sem atrasar nem derrubar o Catálogo.

**Tech Stack:** Next.js 16.4 (App Router, Server Components, `cacheComponents`), TypeScript, Tailwind 4, Vitest, TMDB API v3, Supabase (`@supabase/ssr`).

**Spec:** `docs/superpowers/specs/2026-11-14-series-recomendacoes-design.md` (seção "Etapa 3 — Fileira 'Para você'"). As Etapas 1 e 2 já estão em `main`:
- `Tipo`, `Situacao`, `SITUACOES`, `hrefDoTitulo` e `chaveDoTitulo` em `lib/listas.ts`;
- `listarTitulos`, `detalharFilme`, `detalharSerie`, `CAMINHO` e `streamingsDe` em `lib/tmdb.ts`;
- `FiltrosCatalogo.tipo` em `lib/parametros.ts`;
- `CartaoFilme` com a etiqueta "Série";
- `Fileira` (o trilho com rolagem e setas).

## Global Constraints

- **Um passo de cada vez:** o usuário acompanha um curso. No fim de cada tarefa, explique o que foi feito e por quê, e **espere o usuário** antes da próxima. Os passos marcados **PARE** pedem o OK dele.
- **Sem mudança no banco nesta etapa.** Nenhum SQL que altere ou apague dados sem o OK do usuário. O MCP recusa `drop`/`delete`; para esses, dê ao usuário o SQL e o link https://supabase.com/dashboard/project/zummaraiblnzmgnuqlaj/sql/new.
- **Números da spec** (constantes nomeadas em `lib/recomendacoes.ts`):

  | o quê | valor |
  |---|---|
  | máximo de sementes | 10 |
  | peso de Assistindo e Já assisti | 2 |
  | peso de Quero assistir | 1 |
  | mínimo de votos de um candidato | 50 |
  | mínimo de votos para valer a nota no desempate e no filtro de nota | 200 |
  | candidatos checados no streaming | 30 |
  | máximo de cartões | 20 |
  | abaixo disso entra a reserva | 8 |
  | marcações usadas no perfil de gêneros | 20 |
  | gêneros do perfil | 2 |

  Se o resultado real pedir números menores, quem constrói pode reduzi-los, e tem de dizer ao usuário.
- **Textos exatos:**
  - título da fileira: "Para você";
  - motivos: "Porque você assistiu {título}", "Porque você está assistindo {título}", "Porque você quer assistir {título}" e "Porque você gosta de {gênero}".
- **Onde aparece:** só no Catálogo, na página 1, sem busca, para quem está logado e tem ao menos 1 marcação. Fica abaixo dos filtros e acima do Top 10, em Filmes e em Séries, e respeita os filtros de streaming e de nota ativos.
- **Idioma:** textos e nomes no código em português (pt-BR).
- **Comandos:**
  - Testes a partir de `C:\` maiúsculo, pelo PowerShell: `Set-Location "C:\projetos\catalogo-filmes"; npx vitest run`.
  - Lint: `npm run lint`. Build: `npm run build`. Tipos: `npx tsc --noEmit`.
  - O `task-done` roda pelo PowerShell chamando o Git Bash.
- **Git:**
  - Branch `feat/para-voce`.
  - Commits com `git add <arquivos>` e `git commit -m … -- <arquivos>`, porque o `next.config.ts` está no índice e não pode entrar.
  - Todo commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Navegador:**
  - Conta de teste `teste.cinecatalogo.17946974386452@example.com` (senha `123456`). Ela tem as séries de teste 1399 (Game of Thrones, Assistindo) e 27205 ("Série de teste", Quero assistir), e o usuário pediu para mantê-las.
  - Use locators `:visible`.
  - Rode os scripts com `MSYS_NO_PATHCONV=1` quando passar caminhos como `/serie/1399`.
  - `playwright-core` em `C:/Users/eugen/AppData/Local/Temp/claude/7a5c340af02a0257/872b2a23-881e-4b92-a347-73fc22431fd6/scratchpad/node_modules`. Chrome em `C:/Program Files/Google/Chrome/Application/chrome.exe`.

## Review Focus

- **Uma semente cujo título sumiu do TMDB.** A "Série de teste" 27205 pode não existir como série. A recomendação ou o detalhe dela falha, e a fileira sai com as outras sementes, sem quebrar → teste "uma semente que falha não derruba" na Task 3.
- **Quem marcou só séries e abre a aba Filmes.** Não há semente de filme. A fileira é toda da reserva, com os gêneros das séries convertidos pela tabela para gêneros de filme → teste de `generoNoTipo` (Task 1) e teste "sem sementes do tipo, tudo vem da reserva" (Task 3).
- **O mesmo título recomendado por várias sementes.** Ele aparece uma vez só, soma os pesos, e o motivo vem da semente mais pesada (a mais recente, no empate) → testes de `pontuarCandidatos` na Task 1.
- **Filtro de streaming ativo, como a Netflix.** Só entram títulos que estão nesse streaming, e o logo mostrado é o dele → teste na Task 3.
- **Um título já marcado** (de qualquer lista, mesmo tipo) nunca aparece, nem pelas recomendações nem pela reserva → testes na Task 1 e na Task 3.
- **TMDB ou Supabase fora do ar.** A fileira some, e o resto do Catálogo carrega normal → `ParaVoce` com `try/catch` e `console.error`; verificação na Task 4.

---

### Task 1: Regras puras das recomendações

**Files:**
- Create: `lib/recomendacoes.ts`, `lib/recomendacoes.test.ts`

**Interfaces:**
- Consumes: `Tipo`, `Situacao` (`lib/listas.ts`); `FilmeResumo` (`lib/tmdb.ts`, só o tipo); `chaveDoTitulo`.
- Produces (`lib/recomendacoes.ts`, sem `server-only`):
  - **Tipos:**
    - `type Marca = { tipo: Tipo; id: number; situacao: Situacao; titulo: string }` (lista já ordenada da mais recente para a mais antiga).
    - `type Semente = Marca & { peso: number }`.
    - `type Candidato = { titulo: FilmeResumo; votos: number }`.
    - `type Pontuado = Candidato & { pontos: number; semente: Semente }`.
  - **Constantes:** as da tabela em Global Constraints, por exemplo `MAX_SEMENTES`, `PESO`, `VOTOS_MINIMOS_CANDIDATO`, `VOTOS_PARA_NOTA`, `CANDIDATOS_CHECADOS`, `MAX_CARTOES`, `MINIMO_ANTES_DA_RESERVA`, `MARCAS_DO_PERFIL` e `GENEROS_DO_PERFIL`.
  - **Funções:**
    - `pesoDaSituacao(s: Situacao): number` → 2 para `assistindo` e `ja_assisti`, 1 para `quero_assistir`.
    - `escolherSementes(marcas: Marca[], tipo: Tipo): Semente[]` → as primeiras `MAX_SEMENTES` do tipo, na ordem recebida, com peso.
    - `pontuarCandidatos(o: { porSemente: { semente: Semente; candidatos: Candidato[] }[]; marcadas: Set<string>; nota: number | null }): Pontuado[]`.
      - A chave de `marcadas` é a de `chaveDoTitulo`.
      - O que sai: os marcados, quem tem menos de 50 votos e, com nota ativa, quem tem `nota < nota` ou menos de 200 votos.
      - A pontuação é a soma dos pesos das sementes que recomendaram o título. Um título repetido entra uma vez só.
      - A `semente` é a de maior peso; no empate, a que vem primeiro em `porSemente`, que é a mais recente.
      - A ordem do resultado: pontos ↓; depois a nota ↓, contando só quem tem ≥ 200 votos (os demais ficam atrás); depois votos ↓.
    - `textoDoMotivo(m: { tipo: "semente"; situacao: Situacao; titulo: string } | { tipo: "genero"; nome: string }): string` → os quatro textos de Global Constraints.
    - `generoNoTipo(id: number, de: Tipo, para: Tipo): number | null` → a tabela da spec, nos dois sentidos. Com `de === para`, devolve o próprio id.
    - `perfilDeGeneros(itens: { tipo: Tipo; generoIds: number[]; peso: number }[], para: Tipo): number[]`.
      - Converte cada gênero para o tipo `para` (os que não têm equivalente saem) e soma os pesos.
      - Devolve os `GENEROS_DO_PERFIL` (2) ids mais fortes.
      - No empate, ganha o gênero que apareceu primeiro.

- [ ] **Step 1: Escrever os testes que falham** (`lib/recomendacoes.test.ts`). Use um helper `cand(id, { nota = 7, votos = 500, tipo = "filme" } = {})` que monta um `Candidato` com um `FilmeResumo` mínimo.

```ts
it("pesoDaSituacao", () => expect(["quero_assistir", "assistindo", "ja_assisti"].map(pesoDaSituacao)).toEqual([1, 2, 2]));
it("escolherSementes pega até 10 do tipo, na ordem, com peso", () => {
  const marcas = [serieMarca(1, "assistindo"), filmeMarca(2, "quero_assistir"), ...Array.from({ length: 12 }, (_, i) => filmeMarca(100 + i, "ja_assisti"))];
  const s = escolherSementes(marcas, "filme");
  expect(s).toHaveLength(10);
  expect(s[0]).toMatchObject({ id: 2, peso: 1 });
  expect(s.every((x) => x.tipo === "filme")).toBe(true);
});
it("título recomendado por duas sementes soma os pesos e aparece uma vez", () => {
  const r = pontuarCandidatos({ porSemente: [{ semente: s1q /* peso 1 */, candidatos: [cand(9)] }, { semente: s2a /* peso 2 */, candidatos: [cand(9), cand(8)] }], marcadas: new Set(), nota: null });
  expect(r.map((p) => [p.titulo.id, p.pontos])).toEqual([[9, 3], [8, 2]]);
  expect(r[0].semente.id).toBe(s2a.id);               // motivo: a semente mais pesada
});
it("no empate de peso, o motivo é a semente mais recente (a primeira)", …);
it("tira os já marcados (mesmo tipo), quem tem menos de 50 votos e quem não passa na nota", () => {
  // marcadas = new Set(["filme-5"]); cand(5); cand(6, { votos: 49 }); cand(7, { nota: 7.9, votos: 900 }); cand(8, { nota: 8.5, votos: 150 }); cand(10, { nota: 8.1, votos: 300 })
  // nota: 8  →  só o 10
});
it("série marcada com o mesmo id de um filme candidato não tira o filme", …); // marcadas = Set(["serie-5"]), cand(5) filme fica
it("desempate: nota (só com 200+ votos), depois votos", () => {
  // mesmos pontos: cand(1, { nota: 9, votos: 100 }), cand(2, { nota: 7, votos: 300 }), cand(3, { nota: 8, votos: 250 }), cand(4, { nota: 7, votos: 900 })
  // ordem esperada: 3, 4, 2, 1
});
it("textoDoMotivo", () => {
  expect(textoDoMotivo({ tipo: "semente", situacao: "ja_assisti", titulo: "Dark" })).toBe("Porque você assistiu Dark");
  expect(textoDoMotivo({ tipo: "semente", situacao: "assistindo", titulo: "Dark" })).toBe("Porque você está assistindo Dark");
  expect(textoDoMotivo({ tipo: "semente", situacao: "quero_assistir", titulo: "Dark" })).toBe("Porque você quer assistir Dark");
  expect(textoDoMotivo({ tipo: "genero", nome: "Drama" })).toBe("Porque você gosta de Drama");
});
it("generoNoTipo segue a tabela da spec", () => {
  expect([28, 12, 878, 14, 10752, 18, 27].map((g) => generoNoTipo(g, "filme", "serie"))).toEqual([10759, 10759, 10765, 10765, 10768, 18, null]);
  expect([10759, 10765, 10768, 80, 10762].map((g) => generoNoTipo(g, "serie", "filme"))).toEqual([28, 878, 10752, 80, null]);
  expect(generoNoTipo(27, "filme", "filme")).toBe(27);
});
it("perfilDeGeneros soma pesos já convertidos e devolve os 2 mais fortes", () => {
  // série peso 2 com [10765, 18]; filme peso 1 com [878, 27]; filme peso 1 com [35]
  expect(perfilDeGeneros(itens, "filme")).toEqual([878, 18]);   // 878: 2+1=3; 18: 2; 35: 1; 27: 1
});
it("perfilDeGeneros sem nenhum gênero convertível devolve []", …);
```

- [ ] **Step 2: Rodar e ver falhar.** `npx vitest run lib/recomendacoes.test.ts` → FAIL (o módulo não existe).

- [ ] **Step 3: Implementar `lib/recomendacoes.ts`** com as interfaces acima. A tabela de gêneros é a da spec. O mapa série → filme é o inverso (10759 → 28, 10765 → 878, 10768 → 10752). Os ids "mesmo id" passam direto; os demais viram `null`.

- [ ] **Step 4: Verificar.** `npx vitest run`, `npx tsc --noEmit` e `npm run lint` → sem erros.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: regras das recomendações Para você" -- lib/recomendacoes.ts lib/recomendacoes.test.ts
```

---

### Task 2: Dados para as recomendações (TMDB e marcações)

**Files:**
- Modify: `lib/tmdb.ts`, `lib/tmdb.test.ts`
- Modify: `lib/marcacoes.ts`, `lib/marcacoes.test.ts`

**Interfaces:**
- Consumes: `Candidato` (Task 1); `Marca` (Task 1).
- Produces (`lib/tmdb.ts`):
  - `recomendacoesDe(tipo: Tipo, id: number): Promise<Candidato[]>`.
    - Chama `/{movie|tv}/{id}/recommendations` com `language=pt-BR` e `page=1`.
    - Cada resultado vira `{ titulo: resumir(tipo, …, nomes dos gêneros do tipo), votos: vote_count }`.
  - `streamingsDoTitulo(tipo: Tipo, id: number): Promise<Streaming[]>` → `/{movie|tv}/{id}/watch/providers`, só `BR.flatrate` (reusa `streamingsDe`).
  - `listarTitulos` ganha a opção `generos?: number[]`. Quando vier com pelo menos 1 id, envia `with_genres=<ids unidos por "|">` e `vote_count.gte=200`, mesmo sem nota.
  - `FilmeDetalhe` e `SerieDetalhe` ganham `generoIds: number[]` (de `genres[].id`).
  - `nomesDosGeneros(tipo: Tipo): Promise<Map<number, string>>` → exporta o `generosDe` atual, que já traduz os gêneros de série.
- Produces (`lib/marcacoes.ts`):
  - `listarTodasMarcacoes(): Promise<Marca[]>`, com **todas** as marcações de quem está logado (são poucas).
    - `select("tipo, filme_id, situacao, titulo")`, `order("marcado_em", { ascending: false })`, sem limite: todas entram na exclusão, e só o perfil de gêneros usa as 20 mais recentes.
    - Converte `filme_id` em `id`.
    - O erro passa por `erroDoSupabase("listarTodasMarcacoes", …)`.

- [ ] **Step 1: Escrever os testes que falham.**
  - **Em `lib/tmdb.test.ts`:**
    - `recomendacoesDe("serie", 1399)` chama `/tv/1399/recommendations` com pt-BR e página 1. Devolve `[{ titulo: { tipo: "serie", id: 1, titulo: "Série 1" }, votos: 900 }]`, com gêneros de tv.
    - `recomendacoesDe("filme", 27205)` chama `/movie/27205/recommendations`.
    - `streamingsDoTitulo("serie", 5)` com BR flatrate `[provider(8, "Netflix")]` devolve `[{ id: 8, nome: "Netflix" }]`. Sem BR, devolve `[]`.
    - `listarTitulos({ tipo: "filme", generos: [878, 18], streaming: null, nota: null, pagina: 1 })` envia `with_genres=878|18` e `vote_count.gte=200`.
    - Os testes de `detalharFilme` e `detalharSerie` passam a esperar `generoIds` (`[28]` e `[10765]`).
  - **Em `lib/marcacoes.test.ts`** (o cliente falso ganha o método `limit`):
    - `listarTodasMarcacoes()` chama `order("marcado_em", { ascending: false })`.
    - O retorno converte `filme_id` em `id`. Para isso, o falso precisa de uma variável `dadosDoBanco` que o `then` devolve.

- [ ] **Step 2: Rodar e ver falhar.** `npx vitest run lib/tmdb.test.ts lib/marcacoes.test.ts` → FAIL.

- [ ] **Step 3: Implementar.** Mantenha o comportamento atual de `listarTitulos` sem `generos` (os testes existentes provam).

- [ ] **Step 4: Verificar.** `npx vitest run`, `npx tsc --noEmit` e `npm run lint` → sem erros.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: dados do TMDB e das marcações para o Para você" -- lib/tmdb.ts lib/tmdb.test.ts lib/marcacoes.ts lib/marcacoes.test.ts
```

---

### Task 3: Montagem da fileira (`montarParaVoce`)

**Files:**
- Create: `lib/paraVoce.ts`, `lib/paraVoce.test.ts`

**Interfaces:**
- Consumes: tudo da Task 1; `recomendacoesDe`, `streamingsDoTitulo`, `listarTitulos` com `generos`, `detalharFilme`, `detalharSerie` (`generoIds`) e `nomesDosGeneros` (Task 2); `listarTodasMarcacoes` (Task 2).
- Produces (`lib/paraVoce.ts`, `server-only`):
  - `type Recomendacao = { titulo: FilmeResumo; streaming: Streaming; motivo: string }`.
  - `montarParaVoce(o: { tipo: Tipo; streaming: number | null; nota: number | null }): Promise<Recomendacao[]>`. O algoritmo:

```
marcas = listarTodasMarcacoes()                          // todas; se vazio → []
marcadas = Set(chaveDoTitulo(m) de todas as marcas)
sementes = escolherSementes(marcas, tipo)
porSemente = para cada semente, recomendacoesDe(tipo, id) com Promise.allSettled (falha → semente sem candidatos)
pontuados = pontuarCandidatos({ porSemente, marcadas, nota }).slice(0, CANDIDATOS_CHECADOS)
onde = streamingsDoTitulo para cada pontuado (allSettled; falha → descarta)
fica quem tem streaming (com filtro ativo: quem tem aquele streaming, e o logo é o dele; senão, o primeiro)
fileira = até MAX_CARTOES, motivo = textoDoMotivo({ tipo: "semente", situacao: semente.situacao, titulo: semente.titulo })
se fileira.length < MINIMO_ANTES_DA_RESERVA:
  detalhes = detalharFilme/detalharSerie das primeiras MARCAS_DO_PERFIL marcas (allSettled; falha → ignora)
  perfil = perfilDeGeneros(detalhes com peso da situação, tipo)
  se perfil não vazio:
    nomes = nomesDosGeneros(tipo)
    descobertos = listarTitulos({ tipo, generos: perfil, streaming, nota, pagina: 1 }).filmes
    tirar marcadas e quem já está na fileira; checar streamingsDoTitulo (mesma regra) até completar MAX_CARTOES
    motivo = "Porque você gosta de {nome}" — o 1º gênero do perfil cujo nome está em titulo.generos; se nenhum, o 1º do perfil
```

- [ ] **Step 1: Escrever os testes que falham** (`lib/paraVoce.test.ts`).
  - Mocke `server-only`, `./marcacoes` (`listarTodasMarcacoes`) e `./tmdb` (as cinco funções), com `vi.hoisted`, como em `app/marcacoes/acoes.test.ts`.
  - Os testes:
    - **"sem marcações, devolve vazio e não chama o TMDB".**
    - **"uma marcação antiga, além das 20 mais recentes, nunca é recomendada".** São 25 marcas, e a 25ª, a mais antiga, aparece entre os candidatos: ela não entra.
    - **"recomenda a partir das sementes, com motivo e logo".** Uma marca série 1399 Assistindo, recomendações `[c(10), c(11)]`, os dois na Netflix → `[{ titulo.id: 10, motivo: "Porque você está assistindo Game of Thrones", streaming.id: 8 }, …]`.
    - **"tira quem não está em streaming".**
    - **"com filtro de streaming, só quem está nele, e o logo é o dele".** O candidato está em `[8, 337]`, o filtro é 337 → o logo é 337. O candidato em `[8]` sai.
    - **"uma semente que falha não derruba".** `recomendacoesDe` rejeita para uma semente e resolve para a outra.
    - **"poucos cartões chamam a reserva por gênero".**
      - A semente rende 1 cartão.
      - O detalhe da marca tem `generoIds: [10765, 18]`, e o tipo é filme.
      - `listarTitulos` é chamado com `generos: [878, 18]`.
      - A reserva completa sem repetir o cartão das sementes nem os marcados.
      - O motivo é "Porque você gosta de Ficção científica" (o nome vem de `nomesDosGeneros`).
    - **"sem sementes do tipo, tudo vem da reserva".** Só há marcas de série e a aba é filme: `recomendacoesDe` não é chamada.
    - **"nunca passa de 20".**

- [ ] **Step 2: Rodar e ver falhar.** `npx vitest run lib/paraVoce.test.ts` → FAIL.

- [ ] **Step 3: Implementar `lib/paraVoce.ts`.**

- [ ] **Step 4: Verificar.** `npx vitest run`, `npx tsc --noEmit` e `npm run lint` → sem erros.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: montagem da fileira Para você" -- lib/paraVoce.ts lib/paraVoce.test.ts
```

---

### Task 4: A fileira no Catálogo

**Files:**
- Create: `components/ParaVoce.tsx`
- Modify: `components/CartaoFilme.tsx`, `app/page.tsx`

**Interfaces:**
- Consumes: `montarParaVoce`, `Recomendacao` (Task 3); `usuarioAtual`; `Fileira`.
- Produces:
  - `ParaVoce({ tipo, streaming, nota }: { tipo: Tipo; streaming: number | null; nota: number | null })` é um Server Component assíncrono.
    - Sem login, devolve `null`.
    - Chama `montarParaVoce` dentro de `try/catch`. No erro, faz `console.error("[para você]", mensagem)` e devolve `null`.
    - Com lista vazia, devolve `null`.
    - Com títulos, monta `<Fileira id="para-voce" titulo="Para você">` com uma `<ul>` no mesmo padrão do trilho do `EmAlta` (`flex w-max gap-… px-(--margem)`). Cada item é um `<li className="w-36 shrink-0 snap-start sm:w-44">` com o `CartaoFilme`.
  - `CartaoFilme({ filme, streaming?, motivo? })`:
    - **`streaming`:** um logo redondo de 28px no canto inferior direito do pôster, com `alt={streaming.nome}`.
    - **`motivo`:** uma linha a mais, abaixo do ano, `text-xs text-nevoa line-clamp-2`.
    - Sem esses dois, o cartão fica igual a hoje.

- [ ] **Step 1: Ligar na página.** Em `app/page.tsx`, quando `pagina === 1 && !busca`, renderize `<Suspense fallback={null}><ParaVoce tipo={tipo} streaming={streaming} nota={nota} /></Suspense>` entre os filtros e o `EmAlta`.

- [ ] **Step 2: Verificar.** `npx vitest run`, `npx tsc --noEmit`, `npm run lint` e `npm run build` → sem erros.

- [ ] **Step 3: Verificar no navegador** (localhost, 375px e 1440px). Com a conta de teste (só séries marcadas):
  - **`/?tipo=series`:**
    - a fileira "Para você" aparece acima do Top 10, com séries parecidas com Game of Thrones;
    - cada cartão tem o motivo "Porque você está assistindo Game of Thrones" e o logo do streaming;
    - nenhuma série marcada aparece.
  - **`/`, aba Filmes:** a fileira vem toda da reserva, com motivos "Porque você gosta de …".
  - **Com Netflix escolhido:** todos os logos são da Netflix.
  - **Na página 2 e na busca:** sem fileira.
  - **Sem login:** sem fileira, e o Catálogo igual a antes.
  - **Tempo:** meça o tempo da primeira e da segunda abertura de `/?tipo=series` logado. A segunda usa o cache. Anote os números no registro. Se a fileira demorar mais de ~5 s com o cache, reduza os números e avise o usuário.
  - Sem rolagem lateral. Tire capturas em 375px e 1440px.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: fileira Para você no catálogo" -- components/ParaVoce.tsx components/CartaoFilme.tsx app/page.tsx
```

---

### Task 5: Entrega (só com o OK do usuário)

- [ ] **Step 1: Revisão do branch inteiro** (`main..feat/para-voce`) por um revisor novo, no modelo mais capaz, com este plano, a spec e o Review Focus. Corrija os itens críticos e importantes com teste. Os menores vão para o usuário decidir.
- [ ] **Step 2: PARE. Conferência do usuário.** Mostre as capturas e peça que ele confira no navegador e no celular, com a própria conta também. Espere o OK.
- [ ] **Step 3: Entregar.**
  - Merge de `feat/para-voce` em `main` (fast-forward), `git push origin main` e apagar o branch.
  - Esperar a Vercel publicar e conferir a fileira em https://catalogo-filmes-chi-navy.vercel.app/?tipo=series com a conta de teste.
- [ ] **Step 4: Atualizar a memória do projeto.** Lembre o usuário dos itens que ficaram para depois:
  - cadastrar os streamings que a pessoa assina;
  - avaliar as recomendações;
  - os detalhes menores das etapas anteriores.
