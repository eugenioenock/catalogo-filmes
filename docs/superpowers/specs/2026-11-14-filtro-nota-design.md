# Filtro por nota na página inicial — design

Data: 2026-11-14 · Tamanho: mudança pequena

## Intenção

Na página inicial, a pessoa pode ver só os filmes bem avaliados, por exemplo "8 ou mais".
A nota usada é a do TMDB (`vote_average`), a mesma que o catálogo já mostra. A nota do IMDb
foi descartada porque exigiria outro serviço (OMDb) e uma consulta por filme.

## Objetivos

- Filtro com degraus fixos: **Qualquer · 6+ · 7+ · 8+ · 9+**.
- "8+" significa nota **maior ou igual a 8**.
- Funciona junto com o filtro de streaming, a busca e a paginação.
- O estado fica na URL (`?nota=8`), como o streaming.

## Fora do escopo

- Nota do IMDb.
- Valores livres (7,5) ou controle deslizante.
- Ordenar por nota (a ordem continua sendo por popularidade).

## Abordagens consideradas

- **A) Botões no estilo do filtro de streaming (escolhida).** É uma segunda fileira de botões,
  e cada botão é um link comum. Não precisa de JavaScript no navegador, reaproveita
  `montarHref` e combina com o visual atual. A limitação são os degraus fixos.
- B) Caixa de seleção (dropdown). Ocupa menos espaço, mas foge do padrão visual e precisa de
  um componente no navegador.
- C) Controle deslizante. Permite escolher com precisão, mas é a mais trabalhosa e ruim de
  usar no celular.

## Como fica

```
[Todos] [Netflix] [Prime Video] [Disney+] …
Nota:  [Qualquer]  [6+]  [7+]  [8+ ★]  [9+]
```

- `lib/parametros.ts`: `FiltrosCatalogo` ganha `nota: number | null`. `lerFiltros` aceita
  apenas 6, 7, 8 ou 9; qualquer outro valor vira `null`. `montarHref` escreve `nota` na URL e,
  quando a nota muda, volta para a página 1 (como já acontece com streaming e busca).
- `lib/tmdb.ts`:
  - `listarFilmes` com nota: envia `vote_average.gte=<nota>` e `vote_count.gte=200` ao
    `/discover/movie`. A paginação do TMDB continua valendo.
  - `buscarFilmes` com nota: o `/search/movie` não aceita esse filtro, então os resultados
    da página são filtrados depois (`vote_average >= nota` e `vote_count >= 200`), junto
    com o filtro de streaming que já existe. Algumas páginas podem vir com menos filmes.
- Componente novo `FiltroNota` (link por degrau, `aria-current` no ativo), logo abaixo de
  `FiltroStreamings` em `app/page.tsx`.
- `CampoBusca`/`Cabecalho`: o formulário de busca leva `nota` num campo oculto, para a
  busca não perder o filtro.
- O destaque (banner) e o Top 10 continuam aparecendo na página 1 sem busca, agora a partir
  da lista já filtrada.

## Decisões minhas (para conferir)

- Mínimo de **200 votos** quando o filtro está ativo, para evitar filmes obscuros com
  nota alta dada por poucas pessoas.
- O destaque e o Top 10 continuam aparecendo com o filtro ativo.
- Se o filtro não tiver resultados, a grade mostra uma mensagem de "nenhum filme". A
  mensagem atual de `GradeFilmes` fala "com esse nome", o que não faz sentido sem busca.
  Então ela será ajustada para o caso sem busca (por exemplo, "Nenhum filme com essa nota
  neste streaming.").

## Fica a critério de quem implementa

- O texto exato dos botões e o ícone de estrela.
- Testes: `lerFiltros`/`montarHref` com `nota` e os parâmetros enviados ao TMDB, seguindo
  os testes que já existem em `lib/`.
