# Saudação para quem está logado — design

Data: 2026-11-14 · Tamanho: mudança pequena

## Por quê

No celular, quem está logado vê só o botão **Sair**: o e-mail fica escondido em telas pequenas. A pessoa não tem como confirmar com qual conta entrou, e o site não a reconhece. Uma saudação com o nome resolve as duas coisas.

## Objetivo

- O cabeçalho mostra **"Olá, {nome}"** para quem está logado, no celular e no computador, no lugar do e-mail.
- O cadastro pede o nome.

## Fora do escopo

- Outros dados de perfil além do nome.
- Bloquear todas as páginas para quem não tem nome (via `proxy.ts`).

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
- A saudação é um link para `/completar-cadastro`, onde a pessoa pode mudar o nome.
- **Sem nome** (contas criadas antes desta mudança): no lugar da saudação, um link em destaque (dourado) para `/completar-cadastro`. O texto é **"Complete seu cadastro"** a partir de `sm`, e **"Completar"** no celular, para caber na linha em 375px. Isso substitui o plano B anterior (a parte do e-mail antes do @).

## Completar cadastro (adendo de 2026-11-14)

Contas antigas não têm nome, e o usuário quer que essas pessoas **tenham** que cadastrá-lo. Hoje só existe 1 conta real nessa situação (a dele), mas a tela também passa a servir para qualquer pessoa mudar o nome.

**Abordagens consideradas** (o usuário escolheu a 1):
1. **Ao entrar, mais o link no cabeçalho.** Se a conta não tem nome, o login leva para a tela. Quem já estava logado vê o link "Complete seu cadastro". Simples, e reaproveita o `volta` do login.
2. **Bloqueio no `proxy.ts`, em todas as páginas.** Mais rígido, mas contraria o desenho do `proxy` ("não bloqueia nenhuma página") e corre risco de loop e de quebrar as ações de marcar. É exagero para uma conta.
3. **Só o link.** Não obriga ninguém, o que contraria o "tem que cadastrar".

**Tela `/completar-cadastro`** (mesmo visual de `/entrar`):

```
┌ COMPLETAR CADASTRO ──────────────────┐
│ Falta pouco! Como quer ser chamado?  │
│ [                                 ]  │
│ [ Salvar e continuar ]               │
└──────────────────────────────────────┘
```

- **Sem nome:** título "Completar cadastro", texto "Falta pouco! Como quer ser chamado?" e botão "Salvar e continuar".
- **Com nome:** título "Seu cadastro", texto "Mude como quer ser chamado." e botão "Salvar". O campo já vem preenchido.
- Mesmo campo e mesmas regras do cadastro (`validarNome`: obrigatório, sem espaços nas pontas, até 40 caracteres).
- **Sem login:** vai para `/entrar?volta=/completar-cadastro`.
- **Ao salvar:**
  1. grava com `auth.updateUser({ data: { nome } })`;
  2. renova a sessão (`refreshSession`), para o cabeçalho mostrar o nome novo na hora;
  3. volta para o `volta` (validado por `lerVolta`), ou para `/`.
- **Erro do servidor:** mensagem genérica, e o nome digitado continua no campo.

**Login (`entrar`):** se a conta não tem nome válido (vazio, só espaços ou não é texto), vai para `/completar-cadastro?volta=<volta>` em vez de ir direto para o `volta`. O cadastro (`criar`) não muda, porque já exige o nome.

**Links do cabeçalho** ("Olá, {nome}" e "Completar"): levam a `/completar-cadastro?volta=<página atual>`, como o "Entrar" já faz. Na própria `/completar-cadastro`, não repetem a página atual no `volta`.

**Sua conta atual:** você mesmo completa o cadastro no próximo login. Isso serve também de teste real.

**Testes:** uma função pura, `nomeValido(nome: unknown): string | null`, decide se o nome existe e é válido. Ela tem testes e é usada pela saudação, pelo login e pelo cabeçalho. A tela, o login e o cabeçalho são verificados no navegador em 375px e 1440px.

## Testes

- Funções puras em `lib/conta.ts` com testes: validação do nome, e o nome da saudação (vindo dos metadados, ou do e-mail como plano B).
- Verificação no navegador em 375px e 1440px: cadastro com nome, saudação, nome longo e conta sem nome.

## Decisões deixadas para quem implementar

- Texto exato da dica abaixo do campo, se houver.
- A largura máxima da saudação no celular, desde que "CineCatálogo", a saudação e "Sair" caibam numa linha em 375px.
