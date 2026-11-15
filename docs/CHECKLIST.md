# CineCatálogo — checklist

O que falta fazer no app, em ordem de prioridade. Quando um item fica pronto, ele é marcado
com `[x]`, o commit e a data. Itens novos entram na seção certa.

Site: https://catalogo-filmes-chi-navy.vercel.app

## 1. Conferências suas no site publicado

- (nada pendente)

## 2. Limpeza (só com o seu OK)

- [ ] Apagar as 10 contas de teste `teste.cinecatalogo.*@example.com` e as marcações delas,
      entre elas as 2 séries de teste (você autorizou em 2026-11-14). Falta rodar o SQL no
      painel do Supabase, porque a ferramenta do Claude recusa comandos que apagam dados.

## 3. Detalhes pequenos

- (nada pendente)

## 4. Próximas etapas (ideias das specs; cada uma começa com um brainstorming)

Recomendações
- [ ] Cadastrar os streamings que você assina e recomendar só deles.
- [ ] Avaliar as recomendações (👍/👎, "não me interessa") e esconder sugestões.
- [ ] Recomendações numa página própria ou dentro das abas pessoais.

Listas pessoais
- [ ] Botões de marcar direto no cartão, sem abrir a página do título.
- [ ] Filtros, busca, paginação e separação filmes/séries dentro das abas.
- [ ] Marcar episódio ou temporada assistida.
- [ ] Nota pessoal, resenha, data em que assistiu, "rever".
- [ ] Compartilhar listas com outras pessoas.

Conta
- [ ] "Esqueci minha senha" e confirmação por e-mail.
- [ ] Login com Google.
- [ ] Editar perfil, trocar e-mail ou senha, excluir a conta.

Catálogo
- [ ] Ordenar por nota (hoje a ordem é por popularidade).

## Concluído

- [x] Etapa 1: lista "Assistindo" e tipo filme/série no banco.
- [x] Etapa 2: séries no catálogo, na busca e na página `/serie/[id]`.
- [x] Etapa 3: fileira "Para você" (`f9b88da`, 2026-11-14).
- [x] Logo de streaming vazio não quebra a página de detalhe (`2bce0c9`, 2026-11-14).
- [x] Fileira "Para você" reserva o lugar e o Top 10 não pula (`8180dd7`, 2026-11-14).
- [x] Testes da reserva com filtros e do limite de 20 (`37dd6f7`, 2026-11-14).
- [x] Testes da fileira com o TMDB ou o Supabase fora do ar (`de6acab`, 2026-11-14).
- [x] Nomes do perfil calculados uma vez (`11d0d2b`, 2026-11-14).
- [x] Rodapé não pula enquanto a página carrega (`108b8ed`, 2026-11-14).
- [x] Sinopse não pula quando os botões de marcar chegam (`4a7d440`, 2026-11-14).
- [x] Título vazio do TMDB cai para o nome original (`b4123c9`, 2026-11-14).
- [x] Busca feita em Séries volta para Séries (`129003c`, 2026-11-14).
- [x] Teste que garante que marcar um título atualiza a fileira (`0462c98`, 2026-11-14).
- [x] Pôster que não carrega mostra o nome do título (`d2b36a7`, 2026-11-14).
- [x] Filtro de nota diz "Nota 8 ou mais" para leitores de tela (`6317041`, 2026-11-14).
- [x] Você salvou o seu nome no site publicado (conferido por você, 2026-11-14).
- [x] Você marcou um filme e uma série no site publicado e viu as abas e o "Para você" (conferido por você, 2026-11-14).
- [x] Páginas de filme e de série usam um componente só, `PaginaDeTitulo` (`63ca2df`, 2026-11-14).
- [x] Você testou no celular, no Wi-Fi de casa: pôster que não carrega mostra o nome (conferido por você, 2026-11-14).
- [x] Imagens: conexão com o TMDB aberta mais cedo (`5a70aa2`, 2026-11-14). A otimização da Vercel
      ficou desligada de propósito: a cota gratuita (5.000/mês) acabando bloquearia todas as imagens.
