# Séries, lista "Assistindo" e recomendações "Para você" — design

Data: 2026-11-14 · Tamanho: projeto, construído em 3 etapas

## Intenção

Deixar o CineCatálogo mais interessante para quem usa. Hoje ele só mostra **filmes** dos
streamings por assinatura no Brasil. A pessoa quer também:

1. As **séries** dos mesmos streamings (Netflix, Prime Video, Globoplay e os outros do filtro).
2. Uma terceira lista pessoal, **"Assistindo"**. Ela faz sentido sobretudo para séries, que
   levam semanas para terminar.
3. **Recomendações** de filmes e séries novos dentro do perfil da pessoa, a partir do que ela
   está assistindo, já assistiu ou quer assistir.

**Critério de sucesso:** uma pessoa logada marca alguns filmes e séries nas listas. Ao abrir o
Catálogo, ela vê uma fileira "Para você" com títulos que ainda não marcou, que estão em algum
streaming no Brasil e que fazem sentido para o gosto dela. Cada título vem com o motivo
("Porque você assistiu Dark").

## Objetivos

- **Séries no Catálogo.** Um seletor **Filmes | Séries** com os mesmos filtros (streaming, nota),
  Top 10, banner e paginação.
- **Página da série** (`/serie/[id]`), no mesmo visual da página do filme.
- **Busca por texto com os dois tipos**, filmes e séries juntos.
- **Três listas para filmes e séries:** Quero assistir · Assistindo · Já assisti.
- **Fileira "Para você"** no Catálogo, para quem está logado e já marcou algo.

## Fora do escopo (agora)

- **Cadastrar os streamings que a pessoa assina** e recomendar só deles. Fica para depois. Por
  enquanto, as recomendações vêm de todos os streamings, e cada cartão mostra onde o título
  está.
- **Marcar episódio ou temporada assistida.** "Assistindo" vale para a série inteira.
- **IA paga (API do Claude) para recomendar.** Foi considerada e descartada (ver Abordagens).
- **Avaliar a recomendação** ("não me interessa", 👍/👎) e esconder sugestões.
- **Recomendações dentro das abas pessoais** ou numa página própria.
- **Filtros, busca ou separação por tipo dentro das abas pessoais.**
- **Recomendar série a partir de filme** pela lista do TMDB, e vice-versa. Isso só acontece
  pela reserva por gênero (ver Etapa 3).

## O que seria um fracasso mesmo funcionando

- **O Catálogo ficar mais lento ou quebrar** para quem não está logado, ou quando o TMDB ou o
  Supabase falharem na parte das recomendações. A fileira carrega à parte e, se der erro,
  simplesmente não aparece.
- **Perder ou misturar as marcações que já existem.** Todas viram "filme". Um filme e uma série
  com o mesmo id do TMDB nunca podem se confundir.
- **Recomendar o que a pessoa já marcou,** ou título que não está em nenhum streaming por
  assinatura no Brasil.
- **Uma pessoa ver as marcações de outra.** A RLS continua igual.
- **Links que já existem pararem de funcionar:** `/`, `/?streaming=…`, `/?lista=…`,
  `/filme/[id]`.

## Restrições

- **Next.js 16.4** com `cacheComponents: true` e `partialPrefetching: true`. O que depende de quem
  está logado fica atrás de `<Suspense>`. O `AGENTS.md` pede para ler os guias em
  `node_modules/next/dist/docs/` antes de escrever código.
- **O token do TMDB só no servidor** (`server-only`). O cache de 1 hora do `tmdbGet` continua.
- **Um só projeto Supabase** atende o site local, as prévias e o site publicado na Vercel. Mudar
  o banco afeta a produção na hora (ver Etapa 1, Migração em duas vezes).
- **Testes:** Vitest em ambiente `node`, rodando a partir de `C:\` maiúsculo.
- **Ritmo do curso:** o usuário quer ir um passo de cada vez. Cada etapa tem o seu branch,
  plano, conferência e entrega. As tarefas também param entre si para ele acompanhar.
- **Idioma:** textos do site e nomes no código em português do Brasil.

## Abordagens consideradas

### Como as séries aparecem no Catálogo (escolha do usuário: A)

- **A) Seletor Filmes | Séries (escolhida).** O TMDB entrega filmes e séries em listas
  separadas (`/discover/movie` e `/discover/tv`), com os mesmos filtros de streaming e nota.
  Assim, paginação, Top 10 e banner continuam simples.
- B) Tudo misturado. Exigiria buscar as duas listas, intercalar por popularidade e inventar a
  paginação, e isso fica estranho nas páginas seguintes.

### Como montar as recomendações (escolha do usuário: A, com B de reserva)

- **A) Recomendações do TMDB combinadas com as listas da pessoa (escolhida).** Para cada título
  marcado recentemente, o TMDB dá "quem gostou disto gostou de…" (`/movie/{id}/recommendations`,
  `/tv/{id}/recommendations`). Somamos pontos por candidato e filtramos.
  - Ganhos: é de graça, acerta bem e cada sugestão tem um motivo.
  - Custo: cerca de 10 chamadas mais a checagem de streaming dos candidatos, divididas entre as
    pessoas pelo cache de 1 hora.
- **B) Perfil por gênero, como reserva (escolhida).** Os gêneros mais frequentes nos títulos
  marcados viram uma busca `/discover` nos streamings. Sozinha é genérica demais, mas como
  reserva garante que a fileira não fique quase vazia.
- C) IA (API do Claude). Descartada:
  - cobra por uso e precisa de chave;
  - cada sugestão teria de ser achada de novo no TMDB;
  - pode inventar títulos e é a mais lenta.

### Streamings das recomendações (escolha do usuário: 1)

- **1) Todos os streamings (escolhida).** Cada cartão mostra onde o título está.
- 2) Só os que a pessoa assina, com um cadastro desses streamings. Fica para depois.

## Etapa 1 — Lista "Assistindo" e tipo filme/série no banco

### Banco

Mudanças na tabela `marcacoes`:

| mudança | detalhe |
|---|---|
| nova coluna `tipo` | `text not null default 'filme'`, `check (tipo in ('filme', 'serie'))`. As linhas existentes viram `'filme'`. |
| `filme_id` | **Continua com esse nome**, mas passa a guardar o id do TMDB de filme ou de série (comentar isso no SQL). Não renomear: o código publicado lê essa coluna (ver Migração em duas vezes). |
| chave primária | De `(user_id, filme_id)` para `(user_id, tipo, filme_id)`. |
| `situacao` | O `check` passa a aceitar `'quero_assistir'`, `'assistindo'` e `'ja_assisti'`. |
| RLS e índice | As políticas não mudam. O índice `(user_id, situacao, marcado_em desc)` continua servindo. |

#### Migração em duas vezes (sem tirar o site do ar)

O site local, as prévias da Vercel e o site publicado usam **o mesmo banco**. O código publicado
lê por `filme_id` (`situacaoDoFilme`, `listarMarcacoes`) e grava com
`onConflict: "user_id,filme_id"`, que exige um índice único exatamente em `(user_id, filme_id)`.
Por isso a mudança no banco é feita em duas vezes:

1. **Expandir, na 1ª tarefa da Etapa 1, antes de qualquer teste.** Esta parte só acrescenta, e o
   código publicado continua funcionando igual:
   - criar a coluna `tipo` (as linhas existentes viram `'filme'`);
   - aceitar `'assistindo'`;
   - trocar a chave primária para `(user_id, tipo, filme_id)`;
   - **manter um índice único em `(user_id, filme_id)`** (`marcacoes_filme_unico`), que atende o
     `onConflict` antigo.
   
   Arquivo: `supabase/migracoes/2026-11-14-1-expandir.sql`.
2. **Contrair, depois que a Etapa 1 estiver em `main` e publicada na Vercel.** Apagar o índice
   `marcacoes_filme_unico`. A partir daí, um filme e uma série com o mesmo id podem conviver.
   Arquivo: `supabase/migracoes/2026-11-14-2-contrair.sql`.

- **Até a contração,** não dá para marcar um filme e uma série com o mesmo id na mesma conta.
  Isso não atrapalha a Etapa 1, porque ainda não há séries no site. O teste "filme e série com o
  mesmo id" do banco é feito **depois da contração**.
- **Durante os testes,** as contas de teste podem gravar `'assistindo'` (Etapa 1) ou séries
  (Etapa 2) antes de o site publicado ter o código novo. No site publicado, essas linhas aparecem
  estranhas só para as próprias contas de teste. Isso é aceitável.
- **Os dois arquivos podem rodar mais de uma vez sem erro** ("if exists"/"if not exists" onde
  der). O `supabase/esquema.sql` é atualizado para o estado final (sem o índice antigo), para quem
  criar o banco do zero.
- **Quem aplica:** *Chamada minha:* aplicar pelo MCP do Supabase, que a aula já configurou, com o
  OK do usuário na hora, cada vez. A alternativa é ele colar o SQL no SQL Editor do painel, como
  na primeira vez.
- **Antes de expandir:** contar as linhas de `marcacoes`. Depois, conferir que o total é o mesmo e
  que todas ficaram com `tipo = 'filme'`.

### Listas

- `Situacao` ganha `"assistindo"` e `ListaUrl` ganha `"assistindo"` (`/?lista=assistindo`). Os
  nomes que aparecem na tela são "Quero assistir", "Assistindo" e "Já assisti".
- Ordem das abas no cabeçalho: **Catálogo | Quero assistir (n) | Assistindo (n) | Já assisti (n)**.
  O número soma filmes e séries. No celular as abas já deslizam para o lado; conferir em 375px.
- Na página do título, **três botões**, na mesma ordem. A regra continua: clicar no aceso
  desmarca, clicar em outro troca de lista.
- As listas mostram filmes e séries juntos, do marcado mais recente para o mais antigo. O cartão
  de série tem uma etiqueta **"Série"**, e cada cartão leva para `/filme/[id]` ou `/serie/[id]`
  conforme o tipo.
- A mensagem de lista vazia passa a dizer "título" em vez de "filme".

### No código

- O resumo de um título (hoje `FilmeResumo`) ganha `tipo: "filme" | "serie"`. Renomear tipos e
  componentes (`FilmeResumo`, `CartaoFilme`, `GradeFilmes`…) fica a critério de quem constrói.
  Pode renomear ou só acrescentar o campo.
- `gravarSituacao`, `situacaoDoFilme` e `alternarMarcacao` passam a receber o tipo. A ação
  continua buscando título, pôster e nota no TMDB, sem confiar no formulário.
- Ao terminar a Etapa 1, ainda não existe série no site. Mas a estrutura e os botões já
  funcionam para os dois tipos, e os filmes ganham a lista "Assistindo".

## Etapa 2 — Séries

### Catálogo

- **Seletor Filmes | Séries** acima dos filtros de streaming, no mesmo estilo dos botões de
  filtro. Na URL: `?tipo=series`. Sem o parâmetro, mostra filmes (os links atuais continuam
  iguais).
- Trocar de tipo **mantém o streaming e a nota** e volta para a página 1. *(Chamada minha.)*
- Em Séries:
  - `/discover/tv` com `watch_region=BR`, `with_watch_monetization_types=flatrate`,
    `sort_by=popularity.desc` e os mesmos filtros de nota (com no mínimo 200 votos).
  - Os gêneros vêm de `/genre/tv/list`.
- A lista de streamings do filtro continua vindo de `/watch/providers/movie`, igual para os
  dois tipos. *(Chamada minha: assim o filtro não muda de lugar ao trocar de tipo. Os provedores
  principais no Brasil são os mesmos para filmes e séries.)*
- Os textos mudam com o tipo: "Mais séries nos streamings", "Séries nos streamings", Top 10 de
  séries, e as mensagens de "nenhum resultado" com "série".
- O banner e o Top 10 levam para `/serie/[id]` quando são séries.
- **Os títulos do TMDB diferem entre filmes e séries.** Filme tem `title`/`release_date`; série
  tem `name`/`first_air_date`. A conversão fica num lugar só.

### Busca por texto

- A busca usa `/search/multi` e mantém só `media_type` `movie` e `tv` (descarta pessoas).
- Os resultados misturam filmes e séries, na ordem do TMDB. Os cartões de série levam a
  etiqueta "Série".
- Os filtros de streaming e nota continuam valendo, como hoje. A checagem de streaming usa
  `/movie/{id}/watch/providers` ou `/tv/{id}/watch/providers` conforme o tipo.
- Durante a busca, o seletor Filmes | Séries fica escondido, porque a busca já traz os dois.
  *(Chamada minha.)*

### Página da série `/serie/[id]`

- Mesmo visual da página do filme: fundo, pôster, título, nota, gêneros, sinopse, "Onde
  assistir", os três botões e "Voltar ao catálogo".
- No lugar da duração, a linha de informações mostra as temporadas e os anos:
  - "3 temporadas · 2019–2023" quando a série terminou ou foi cancelada (`status` `Ended` ou
    `Canceled`);
  - "1 temporada · 2024–" quando ainda está no ar.
  - Vem de `/tv/{id}` com `append_to_response=watch/providers` (`number_of_seasons`,
    `first_air_date`, `last_air_date`, `status`).
- "Voltar ao catálogo" leva para `/?tipo=series`.
- Sem streaming no Brasil, o texto diz "esta série", não "este filme".
- Id inválido ou inexistente → página "não encontrado", como no filme.

## Etapa 3 — Fileira "Para você"

### Onde e quando aparece

- **Onde:** no Catálogo, logo abaixo dos filtros e acima do Top 10, em Filmes e em Séries (cada
  uma com o seu tipo). Mesmo visual da fileira que já existe (`Fileira`), com título "Para você".
- **Quando:** só na página 1, sem busca, para quem está logado **e** tem ao menos 1 título
  marcado. Senão, nada aparece.
- **Filtros:** ela respeita os filtros de streaming e de nota ativos. Com "Netflix" escolhido,
  só recomenda o que está na Netflix. *(Chamada minha: o dado de streaming já é buscado para
  cada candidato, então filtrar custa pouco.)*
- **Carregamento:** fica dentro do seu próprio `<Suspense>`. O resto do Catálogo não espera por
  ela. Qualquer erro (TMDB, Supabase) → a fileira some, sem mensagem.

### Como escolhe (A: recomendações do TMDB)

1. **Sementes.** São até **10 títulos marcados mais recentes do mesmo tipo** da aba aberta
   (filmes na aba Filmes, séries na aba Séries), de qualquer lista.
2. **Peso de cada semente:** `Assistindo` e `Já assisti` valem **2**; `Quero assistir` vale **1**.
3. **Candidatos.** Para cada semente, a página 1 de `/{movie|tv}/{id}/recommendations`
   (`language=pt-BR`), que tem cerca de 20 títulos.
4. **Pontuação.** Cada candidato soma o peso de cada semente que o recomendou. Assim, quem
   aparece em várias sementes sobe. Empate: maior `vote_average`, desde que tenha pelo menos
   200 votos, e depois mais votos.
5. **O que sai:**
   - qualquer título que a pessoa já marcou (de qualquer lista, mesmo tipo);
   - título com menos de 50 votos, para evitar recomendação obscura demais *(chamada minha)*;
   - o que não passa no filtro de nota ativo.
6. **Streaming.** Para os ~30 melhores candidatos, checar onde estão
   (`/{movie|tv}/{id}/watch/providers`, BR, `flatrate`). Fica só quem está em algum streaming
   (ou no streaming do filtro ativo).
7. **Tamanho:** até **20** cartões.

### Reserva (B: perfil por gênero)

- **Quando entra:** se sobrarem **menos de 8** cartões, completamos até 20 com a reserva.
  Também vale para quem não tem nenhuma semente do tipo da aba, por exemplo quem marcou só
  filmes e abriu Séries. Nesse caso, a fileira é toda da reserva.
- **Perfil:**
  - Contar os gêneros de **todos os títulos marcados recentemente** (até 20, de qualquer tipo,
    com o mesmo peso 2/1).
  - Os gêneros vêm do detalhe de cada título no TMDB, que já tem cache de 1 hora.
  - Os 2 gêneros mais fortes viram `with_genres` com OU (`id1|id2`) em `/discover/{movie|tv}`,
    com `watch_region=BR`, `flatrate`, `sort_by=popularity.desc`, `vote_count.gte=200` e os
    filtros ativos.
  - Tirar os já marcados e os que já estão na fileira.
- **Gêneros de filme e série têm ids diferentes em alguns casos.** Para usar gêneros de filmes
  na aba Séries (e vice-versa), usar esta tabela:

  | filme | série |
  |---|---|
  | 28 Ação, 12 Aventura | 10759 Ação e Aventura |
  | 878 Ficção científica, 14 Fantasia | 10765 Ficção científica e Fantasia |
  | 10752 Guerra | 10768 Guerra e Política |
  | 16, 35, 80, 99, 18, 10751, 9648, 37 | mesmo id |
  | 27 Terror, 53 Thriller, 10749 Romance, 36 História, 10402 Música, 10770 Cinema TV | sem equivalente: ignorar |

  Na volta (série → filme), 10759 vira 28, 10765 vira 878 e 10768 vira 10752. Os gêneros só de
  série (10762 Kids, 10763 News, 10764 Reality, 10766 Soap, 10767 Talk) são ignorados na aba
  Filmes.

### O cartão da fileira

- O mesmo cartão do catálogo (pôster, título, nota, ano, etiqueta "Série"). Ele ganha:
  - **o logo do primeiro streaming** onde o título está, pequeno, sobre o canto do pôster, com o
    nome no `alt`;
  - **uma linha de motivo** abaixo do ano:
    - "Porque você assistiu {título}" (semente em Já assisti);
    - "Porque você está assistindo {título}" (Assistindo);
    - "Porque você quer assistir {título}" (Quero assistir);
    - "Porque você gosta de {gênero}" (reserva).
- **De onde vem o motivo:** a semente de maior peso que recomendou o candidato. No empate, a
  marcada mais recentemente.
- Na reserva, o logo do streaming vem da mesma checagem do passo 6. O `/discover` já garante que
  o título está em algum streaming, mas não diz qual.

### Custo de chamadas

Por carregamento de página, para quem está logado:

- 1 leitura no Supabase das marcações;
- até 10 chamadas de recomendações;
- até ~30 checagens de streaming;
- na reserva, até 20 detalhes e 1 `/discover`.

Todas passam pelo cache de 1 hora do `tmdbGet`. Se ficar lento na prática, quem constrói pode
reduzir os números (sementes, candidatos checados) e deve dizer ao usuário.

## Testes

- **Funções puras com testes (TDD), no estilo de `lib/*.test.ts`:**
  - leitura de `?tipo=` e `?lista=assistindo`;
  - montagem dos links (`montarHref`, link do cartão por tipo);
  - conversão filme/série do TMDB para o resumo;
  - texto de temporadas e anos;
  - pontuação, exclusão e corte dos candidatos;
  - escolha do motivo;
  - perfil de gêneros e a tabela de gêneros filme ↔ série.
- **Banco:** conferir pelo MCP a contagem antes e depois da expansão. Depois da contração,
  conferir a chave nova inserindo um filme e uma série com o mesmo id para uma conta de teste.
- **Navegador:** com as contas de teste `teste.cinecatalogo.…@example.com`, em 375px e 1440px:
  - marcar nas três listas;
  - trocar de tipo;
  - abrir uma série;
  - buscar um texto que traga os dois tipos;
  - ver a fileira "Para você" com motivo e logo;
  - conferir que, sem login, nada muda.
  - Usar locators `:visible`, porque o Next mantém páginas anteriores escondidas no DOM.

## O que fica para quem constrói

- Nomes de funções, arquivos e componentes. Renomear `Filme*` para algo neutro ou não.
- A divisão de cada etapa em tarefas no plano.
- O visual exato do seletor, da etiqueta "Série", do logo e da linha de motivo, dentro do estilo
  "sala escura" que já existe em `app/globals.css`.
- Ajustar os números (10 sementes, 30 checagens, 8 e 20 cartões, 50 votos) se o resultado real
  pedir. Dizer ao usuário o que mudou.
