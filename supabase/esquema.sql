-- CineCatálogo: listas pessoais ("Quero assistir", "Assistindo" e "Já assisti"),
-- para filmes e séries.
-- Este arquivo cria o banco DO ZERO, já no estado final. Cole-o inteiro no SQL Editor
-- do painel do Supabase e clique em "Run".
-- Um banco criado antes das séries é atualizado pelos arquivos de supabase/migracoes/.

-- 1) A tabela: uma linha por pessoa e título (filme ou série).
--    A chave primária (user_id, tipo, filme_id) garante que cada título fica em UMA
--    lista só por pessoa. Trocar de lista é atualizar a linha; desmarcar é apagar a linha.
create table if not exists public.marcacoes (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  tipo       text        not null default 'filme'
             constraint marcacoes_tipo_check check (tipo in ('filme', 'serie')),
  -- id do título no TMDB. O nome ficou de quando só havia filmes: guarda o id
  -- de um filme OU de uma série (a coluna tipo diz qual).
  filme_id   integer     not null,
  situacao   text        not null
             constraint marcacoes_situacao_check
             check (situacao in ('quero_assistir', 'assistindo', 'ja_assisti')),
  -- Cópia dos dados do filme no momento da marcação, para a lista abrir
  -- com uma consulta só, sem chamar o TMDB para cada filme.
  titulo     text        not null,
  poster_url text,
  ano        text,
  nota       numeric,
  marcado_em timestamptz not null default now(),  -- ordena a lista (mais recente primeiro)
  constraint marcacoes_pkey primary key (user_id, tipo, filme_id)
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
