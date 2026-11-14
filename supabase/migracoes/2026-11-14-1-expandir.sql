-- CineCatálogo, Etapa 1 (1ª de 2 vezes): EXPANDIR a tabela marcacoes.
-- Prepara o banco para séries e para a lista "Assistindo", sem quebrar o site publicado.
--
-- Por que em duas vezes? O site local, as prévias e o site publicado na Vercel usam
-- o MESMO banco. O código publicado ainda grava com on conflict (user_id, filme_id)
-- e lê por filme_id. Esta parte só ACRESCENTA, e esse código continua funcionando.
-- A 2ª vez (2026-11-14-2-contrair.sql) roda só depois que a Etapa 1 estiver publicada.
--
-- Pode rodar de novo sem erro: cada passo usa "if exists" / "if not exists".

begin;

-- 1) O tipo do título. As marcações que já existem são todas de filmes.
--    A coluna filme_id continua com esse nome, mas passa a guardar o id do TMDB
--    de um filme OU de uma série (o tipo diz qual dos dois).
alter table public.marcacoes
  add column if not exists tipo text not null default 'filme';

alter table public.marcacoes drop constraint if exists marcacoes_tipo_check;
alter table public.marcacoes
  add constraint marcacoes_tipo_check check (tipo in ('filme', 'serie'));

-- 2) A terceira lista: "Assistindo".
alter table public.marcacoes drop constraint if exists marcacoes_situacao_check;
alter table public.marcacoes
  add constraint marcacoes_situacao_check
  check (situacao in ('quero_assistir', 'assistindo', 'ja_assisti'));

-- 3) Índice único TEMPORÁRIO em (user_id, filme_id). Ele existe só para o código
--    publicado, cujo "on conflict (user_id, filme_id)" precisa de um índice único
--    exatamente nessas colunas. Criado ANTES de trocar a chave, para não haver
--    nenhum instante sem ele. Sai na 2ª vez (contrair).
create unique index if not exists marcacoes_filme_unico
  on public.marcacoes (user_id, filme_id);

-- 4) A chave nova inclui o tipo: o filme 1399 e a série 1399 são títulos diferentes.
--    (Enquanto o índice do passo 3 existir, a mesma conta ainda não consegue
--    marcar os dois; isso só passa a valer depois da contração.)
alter table public.marcacoes drop constraint if exists marcacoes_pkey;
alter table public.marcacoes
  add constraint marcacoes_pkey primary key (user_id, tipo, filme_id);

commit;
