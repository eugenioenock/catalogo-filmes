-- CineCatálogo, Etapa 1 (2ª de 2 vezes): CONTRAIR a tabela marcacoes.
--
-- ATENÇÃO: rodar só depois que a Etapa 1 estiver publicada em produção (Vercel).
-- O código antigo grava com "on conflict (user_id, filme_id)" e precisa deste índice;
-- o código novo grava com "on conflict (user_id, tipo, filme_id)", que usa a chave primária.
--
-- Depois disto, a mesma pessoa pode ter o filme 1399 e a série 1399 nas listas.
-- Pode rodar de novo sem erro.
--
-- Voltar atrás: depois da contração, voltar a Vercel para um código anterior à Etapa 1
-- (Instant Rollback ou uma prévia antiga) quebra a marcação, porque aquele código precisa
-- do índice. Antes de voltar, recrie-o com
--   create unique index marcacoes_filme_unico on public.marcacoes (user_id, filme_id);
-- o que só funciona enquanto nenhuma conta tiver um filme e uma série com o mesmo id.

drop index if exists public.marcacoes_filme_unico;
