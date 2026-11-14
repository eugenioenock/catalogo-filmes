-- CineCatálogo: listas pessoais ("Quero assistir" e "Já assisti").
-- Cole este arquivo inteiro no SQL Editor do painel do Supabase e clique em "Run".

-- 1) A tabela: uma linha por pessoa e filme.
--    A chave primária (user_id, filme_id) garante que cada filme fica em UMA lista só
--    por pessoa. Trocar de lista é atualizar a linha; desmarcar é apagar a linha.
create table if not exists public.marcacoes (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  filme_id   integer     not null,                -- id do filme no TMDB
  situacao   text        not null check (situacao in ('quero_assistir', 'ja_assisti')),
  -- Cópia dos dados do filme no momento da marcação, para a lista abrir
  -- com uma consulta só, sem chamar o TMDB para cada filme.
  titulo     text        not null,
  poster_url text,
  ano        text,
  nota       numeric,
  marcado_em timestamptz not null default now(),  -- ordena a lista (mais recente primeiro)
  primary key (user_id, filme_id)
);

-- 2) Row Level Security: o banco só deixa cada pessoa ver e mexer nas PRÓPRIAS linhas.
--    Mesmo que o código do site tivesse um erro, uma conta não enxergaria a outra.
alter table public.marcacoes enable row level security;

-- auth.uid() é o id de quem está logado na requisição.
-- O "drop policy if exists" deixa o arquivo rodar de novo sem erro de "already exists".
drop policy if exists "ver as próprias marcações" on public.marcacoes;
create policy "ver as próprias marcações"
  on public.marcacoes for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "criar as próprias marcações" on public.marcacoes;
create policy "criar as próprias marcações"
  on public.marcacoes for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "alterar as próprias marcações" on public.marcacoes;
create policy "alterar as próprias marcações"
  on public.marcacoes for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "apagar as próprias marcações" on public.marcacoes;
create policy "apagar as próprias marcações"
  on public.marcacoes for delete to authenticated
  using ((select auth.uid()) = user_id);

-- 3) Índice para listar "as minhas marcações de uma situação, da mais recente para a mais antiga".
create index if not exists marcacoes_lista_idx
  on public.marcacoes (user_id, situacao, marcado_em desc);
