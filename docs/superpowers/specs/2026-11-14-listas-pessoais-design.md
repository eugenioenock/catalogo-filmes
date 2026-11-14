# Listas pessoais com login (Supabase) — design

Data: 2026-11-14 · Tamanho: projeto

## Intenção

Exercício da próxima aula do curso de Claude Code: aprender login e banco de dados com o
Supabase num site que já funciona. Cada pessoa cria uma conta com e-mail e senha e marca
filmes em duas listas pessoais, **"Quero assistir"** e **"Já assisti"**. Ela navega por essas
listas em abas na página inicial.

**Critério de sucesso:** a pessoa cria uma conta, marca alguns filmes, sai, entra de novo
(até em outro navegador) e as listas dela continuam lá.

## Objetivos

- Contas com e-mail e senha: criar conta, entrar e sair.
- Na página de detalhes do filme, dois botões: **Quero assistir** e **Já assisti**.
- Cada filme fica em **uma situação só** por pessoa: "quero assistir", "já assisti" ou
  nenhuma. Marcar "Já assisti" num filme que estava em "Quero assistir" tira o filme dessa
  lista. Clicar no botão que já está aceso desmarca o filme.
- Na página inicial, três abas: **Catálogo · Quero assistir (n) · Já assisti (n)**. O número
  é a quantidade de filmes na lista.
- Cada pessoa só enxerga e altera as próprias marcações. Quem garante isso é o banco
  (Row Level Security do Supabase), e não só o código do site.
- O catálogo continua aberto a qualquer visitante, sem login, e funciona como hoje.

## Fora do escopo

- "Esqueci minha senha", confirmação por e-mail, login com Google ou outros provedores.
- Editar o perfil, trocar o e-mail ou a senha, excluir a conta.
- Botões de marcar no cartão do filme (fica para depois, se o usuário quiser).
- Nota pessoal, resenha, data em que assistiu, "rever".
- Compartilhar listas com outras pessoas.
- Filtros (streaming, nota), busca e paginação dentro das abas pessoais.

## O que seria um fracasso mesmo funcionando

- Uma pessoa ver ou alterar as marcações de outra.
- O catálogo ficar mais lento, ou deixar de funcionar para quem não está logado, ou quando
  o Supabase estiver fora do ar.
- Uma chave secreta do Supabase (service role / secret key) ir para o navegador ou para o
  repositório. O site usa só a chave pública e depende das regras do banco.

## Restrições

- Next.js 16.4 com `cacheComponents: true` e `partialPrefetching: true`. Ler cookies é uma
  leitura da requisição, então tudo o que depende de quem está logado tem de ficar atrás de
  um `<Suspense>`. Guias: `node_modules/next/dist/docs/01-app/02-guides/authentication.md` e
  `authentication-with-cache-components.md`. O `AGENTS.md` pede para ler esses guias antes de
  escrever código.
- No Next 16 o antigo middleware se chama **proxy** (`proxy.ts` na raiz do projeto).
- O token do TMDB fica só no servidor (`server-only`). Não pode ir para o navegador.
- Testes com Vitest em ambiente `node`. O Vitest falha quando roda de um diretório com `c:\`
  minúsculo; rode a partir de `C:\`.
- O usuário acompanha um curso e quer ir **um passo de cada vez**: explicar cada etapa e
  esperar por ele antes da próxima. As etapas manuais no painel do Supabase são feitas por
  ele.
- O texto do site é todo em português do Brasil, assim como os nomes no código (`lerFiltros`,
  `CartaoFilme`…).

## Abordagens consideradas

- **1) Login no servidor com `@supabase/ssr` (escolhida pelo usuário).** A sessão fica em
  cookie. Entrar, criar conta, sair e marcar são Server Actions. O `proxy.ts` renova a
  sessão a cada requisição. Segue a receita oficial do Supabase para Next, combina com o site
  (que já faz tudo no servidor) e mantém as chaves longe do navegador. Custo: mais peças para
  entender (cookies, proxy, Suspense), que também são o conteúdo da aula.
- 2) Login só no navegador com `@supabase/supabase-js`. Menos arquivos, mas vai na contramão
  do site. O cabeçalho e as abas piscam "deslogado" antes de carregar, e as abas não poderiam
  consultar o TMDB.
- Descartada: outra biblioteca de login (Auth.js) usando o Supabase só como banco. O usuário
  escolheu o Supabase justamente para o login.

## Como fica

### Banco (Supabase)

Uma tabela, `marcacoes`, com uma linha por pessoa e filme:

| coluna       | tipo          | observação                                                      |
|--------------|---------------|-----------------------------------------------------------------|
| `user_id`    | `uuid`        | referência a `auth.users(id)`, `on delete cascade`              |
| `filme_id`   | `integer`     | id do filme no TMDB                                             |
| `situacao`   | `text`        | `check (situacao in ('quero_assistir', 'ja_assisti'))`          |
| `titulo`     | `text`        | cópia tirada no momento da marcação                             |
| `poster_url` | `text` null   | cópia                                                           |
| `ano`        | `text` null   | cópia                                                           |
| `nota`       | `numeric` null| cópia (nota do TMDB)                                            |
| `marcado_em` | `timestamptz` | `default now()`; atualizada quando a situação muda              |

- Chave primária `(user_id, filme_id)`. É isso que garante "uma situação só".
- Desmarcar é **apagar** a linha.
- RLS ligado, com políticas de `select`, `insert`, `update` e `delete`, todas com
  `auth.uid() = user_id`.
- A cópia de título, pôster, ano e nota serve para cada aba abrir com **uma** consulta ao
  Supabase, sem chamar o TMDB para cada filme. Ela pode ficar desatualizada (por exemplo,
  a nota do TMDB mudar), e para este exercício isso não importa.
- O SQL fica num arquivo do repositório, `supabase/esquema.sql`. O usuário cola esse SQL no
  SQL Editor do painel. Não vamos usar a CLI do Supabase.

### Login

- Páginas `/entrar` e `/criar-conta`, no visual do site. Cada uma tem um formulário com
  e-mail e senha e um link para a outra.
- Depois de entrar ou criar a conta, a pessoa volta para onde estava, pelo parâmetro
  `?volta=/caminho`. Só são aceitos caminhos internos: começam com `/` e não com `//`. Sem
  `volta`, ela vai para `/`.
- A confirmação por e-mail fica **desligada** no painel do Supabase. Criar a conta já deixa
  a pessoa logada. Isso se liga depois, quando o site estiver no ar.
- Mensagens de erro em português: e-mail ou senha incorretos; e-mail já cadastrado; senha
  curta (o mínimo do Supabase é 6 caracteres); serviço indisponível, tente de novo.
- Cabeçalho ([Cabecalho.tsx](../../../components/Cabecalho.tsx)): sem login, mostra um link
  **Entrar**. Logado, mostra o e-mail e um botão **Sair**. Essa parte carrega atrás de um
  `<Suspense>` e não atrasa o resto do cabeçalho.

```
CineCatálogo                    [buscar…]   ana@email.com  Sair
```

### Abas na página inicial

```
 Catálogo   Quero assistir (12)   Já assisti (30)
 ────────
```

As abas só aparecem na página inicial. A página de detalhes continua com o cabeçalho de hoje
(com Entrar/Sair).

- **Lugar (decidido pelo usuário):** as abas ficam **dentro do cabeçalho**, numa linha logo
  abaixo do nome e da busca, nas três abas. Na aba Catálogo elas ficam por cima do destaque
  (o cabeçalho continua `sobreposto`), então aparecem já na primeira tela, inclusive em
  375px. O espaçamento do destaque (`Banner` e as margens negativas em `app/page.tsx`) é
  ajustado para o cabeçalho mais alto não cobrir o título do filme. Descartado: abas abaixo
  do destaque, porque no celular só apareceriam depois de rolar a foto e mudariam de lugar
  entre as abas.

```
┌────────────────────────────────────────┐
│ CineCatálogo        [buscar…]   Entrar │
│ Catálogo · Quero assistir · Já assisti │
│        (foto do filme em destaque)     │
│   TÍTULO DO FILME                      │
└────────────────────────────────────────┘
```

- O estado fica na URL, como os outros filtros: `/` é o Catálogo,
  `/?lista=quero-assistir` e `/?lista=ja-assisti` são as abas pessoais. `lerFiltros` e
  `montarHref` em [lib/parametros.ts](../../../lib/parametros.ts) passam a conhecer `lista`.
- **Catálogo** é exatamente a página de hoje: destaque, Top 10, filtros, grade e paginação.
- **Abas pessoais:** sem destaque, sem Top 10 e sem filtros. Só um título ("Quero assistir")
  e a grade de cartões ([GradeFilmes](../../../components/GradeFilmes.tsx) /
  [CartaoFilme](../../../components/CartaoFilme.tsx)), com todos os filmes da lista, do
  marcado mais recente para o mais antigo, sem paginação. Com `lista` presente, os
  parâmetros `streaming`, `nota`, `busca` e `pagina` são ignorados.
- Lista vazia: "Você ainda não marcou nenhum filme como quero assistir. Abra um filme no
  catálogo para marcar."
- Sem login, as três abas continuam visíveis, mas sem os números. Clicar numa aba pessoal
  mostra "Entre para ver sua lista", com um botão que leva a `/entrar?volta=/?lista=…`.
- Os números das abas e as listas dependem do login, por isso ficam atrás de `<Suspense>`.
  A aba Catálogo não pode ficar mais lenta por causa delas.

### Botões na página de detalhes

```
[ + Quero assistir ]  [ ✓ Já assisti ]      ← o aceso mostra em que lista o filme está
```

- Ficam logo abaixo de `InfoFilme`, no bloco do título
  ([app/filme/[id]/page.tsx](../../../app/filme/[id]/page.tsx)), atrás do próprio
  `<Suspense>`.
- Cada botão é um `<form>` com Server Action, então funciona até sem JavaScript. Clicar no
  botão apagado põe o filme naquela situação (insert ou update). Clicar no aceso desmarca
  (delete).
- O botão aceso usa `aria-pressed="true"`.
- Sem login, os botões aparecem. Clicar leva a `/entrar?volta=/filme/<id>`.
- Depois de marcar, a página mostra a nova situação, e as abas e os números da página
  inicial também ficam atualizados.

### Peças novas

- Dependência `@supabase/ssr` (e `@supabase/supabase-js`, que ela usa).
- Variáveis de ambiente `NEXT_PUBLIC_SUPABASE_URL` e a chave pública do projeto (o painel
  atual chama de *publishable key*; projetos antigos chamam de *anon key*). As duas vão para
  `.env.local` e `.env.example`, e mais tarde para a Vercel. O `README` explica onde pegar.
- `lib/supabase/` com a criação do cliente para o servidor (cookies) e para o proxy.
- `proxy.ts` na raiz, renovando a sessão, com um `matcher` que ignora arquivos estáticos e
  imagens.
- Um módulo de acesso a dados (por exemplo `lib/marcacoes.ts`) com as funções: ler o
  usuário atual, ler a situação de um filme, listar uma lista, contar as listas, marcar e
  desmarcar.

## Erros

- **Supabase fora do ar ou chaves faltando:** o catálogo e a página de detalhes continuam
  funcionando. O cabeçalho mostra "Entrar". As abas pessoais e os botões mostram uma
  mensagem curta ("Não foi possível carregar suas listas agora"). Nada derruba a página
  inteira.
- **Falha ao marcar:** a página mostra uma mensagem perto dos botões, e a situação anterior
  continua.
- **Sessão expirada:** é tratada como "sem login".

## Testes

- Testes de unidade (Vitest) para as partes puras: `lerFiltros` e `montarHref` com `lista`;
  a validação de `volta`; a validação do formulário (e-mail e senha); a tradução dos erros
  do Supabase para mensagens em português; e a conversão de uma linha de `marcacoes` para o
  formato que o cartão usa.
- O acesso ao Supabase não é testado contra o serviço real. Fica para a checagem manual:
  criar conta, marcar, trocar de situação, desmarcar, sair, entrar em outro navegador, e
  confirmar que uma segunda conta não vê as marcações da primeira.
- Lint, testes e build passando, e uma conferência visual em 375px e em 1440px.

## Etapas do usuário (no painel do Supabase)

1. Criar um projeto no Supabase (o plano gratuito basta).
2. Rodar `supabase/esquema.sql` no SQL Editor.
3. Desligar a confirmação por e-mail (Authentication → provedor Email → *Confirm email*).
4. Copiar a URL do projeto e a chave pública para o `.env.local`.

O plano deve parar e esperar o usuário em cada uma dessas etapas.

## Decisões minhas (para conferir)

- Uma tabela só, com chave `(user_id, filme_id)` e desmarcar = apagar.
- Guardar uma cópia de título, pôster, ano e nota na marcação.
- Abas por `?lista=` na própria `/`, e não em rotas separadas.
- Abas pessoais sem paginação nem filtros, do mais recente para o mais antigo.
- Sem login, as abas pessoais aparecem e pedem para entrar.
- Botões só na página de detalhes.
- Confirmação por e-mail desligada durante o exercício.
- SQL num arquivo do repositório, colado à mão no painel.

## Fica a critério de quem implementa

- Nomes exatos de arquivos, funções e componentes, seguindo o padrão em português do projeto.
- O ponto exato de cada `<Suspense>` e como atualizar a tela depois de uma Server Action
  (`refresh`, `revalidatePath` ou o que os guias do Next 16 indicarem).
- O formato do botão e das mensagens, dentro do visual atual (`app/globals.css`).
- Se o cartão recebe um tipo novo e menor ou continua com `FilmeResumo`, preenchendo os
  campos que faltam.
