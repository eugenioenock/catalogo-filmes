# Saudação para quem está logado — design

Data: 2026-11-14 · Tamanho: mudança pequena

## Por quê

No celular, quem está logado vê só o botão **Sair**: o e-mail fica escondido em telas pequenas. A pessoa não tem como confirmar com qual conta entrou, e o site não a reconhece. Uma saudação com o nome resolve as duas coisas.

## Objetivo

- O cabeçalho mostra **"Olá, {nome}"** para quem está logado, no celular e no computador, no lugar do e-mail.
- O cadastro pede o nome.

## Fora do escopo

- Página para editar o nome ou o perfil.
- Pedir o nome no "Entrar".

## Abordagens consideradas

1. **Pedir o nome no cadastro** (escolhida pelo usuário). Fica pessoal de verdade. Contas antigas não têm nome e precisam de um plano B.
2. **Usar a parte do e-mail antes do @.** Não muda o cadastro, mas soa robótico ("Olá, eugenioenock").

Onde guardar o nome (decisão minha): nos **metadados da conta no Supabase** (`user_metadata.nome`, enviado no `signUp`). Eles já vêm dentro do token de login que `usuarioAtual()` lê com `getClaims()`, então não precisa de tabela nova, migração, RLS nem consulta extra. A alternativa, uma tabela `perfis`, só compensaria se houvesse mais dados de perfil para guardar, e isso está fora do escopo.

## Como fica

**Cadastro** (`/criar-conta`): campo novo **"Como quer ser chamado?"**, acima do e-mail.
- Obrigatório, sem espaços nas pontas, até 40 caracteres.
- Mensagens: "Digite como quer ser chamado." e "Use até 40 caracteres."
- Se o cadastro der erro, o nome digitado continua no campo, como já acontece com o e-mail.
- O "Entrar" não muda.

**Cabeçalho** (`AreaConta`):

```
celular:     CINECATÁLOGO            Olá, Eugênio  [Sair]
             [ busca .................................. ]
computador:  CINECATÁLOGO      [ busca ]   Olá, Eugênio  [Sair]
```

- Nomes longos são cortados com "…". O e-mail aparece ao passar o mouse.
- **Plano B:** sem nome nos metadados (contas antigas), usa a parte do e-mail antes do @.

**Sua conta atual:** depois do deploy, eu gravo o seu nome direto nos metadados pelo Supabase. O nome passa a aparecer no próximo login (ou em até 1 hora, quando o token é renovado).

## Testes

- Funções puras em `lib/conta.ts` com testes: validação do nome, e o nome da saudação (vindo dos metadados, ou do e-mail como plano B).
- Verificação no navegador em 375px e 1440px: cadastro com nome, saudação, nome longo e conta sem nome.

## Decisões deixadas para quem implementar

- Texto exato da dica abaixo do campo, se houver.
- A largura máxima da saudação no celular, desde que "CineCatálogo", a saudação e "Sair" caibam numa linha em 375px.
