# Versão e histórico de mudanças — design

## Intenção

O usuário quer **ver no site qual versão está no ar** e **um histórico do que mudou em cada
versão**, para acompanhar as atualizações do CineCatálogo.

Hoje o `package.json` está em `0.1.0` desde o início, não há tags no Git nem histórico de
mudanças, e o site não mostra versão. As mensagens dos commits já seguem um padrão
(`feat:`, `fix:`, `perf:`, `test:`, `docs:`, `refactor:`, `chore:`).

## Objetivos

- O rodapé de todas as páginas mostra a versão (`v1.1.0`) e um link "Novidades".
- A página `/novidades` lista as versões, da mais nova para a mais antiga, com a data e o que
  mudou, em português.
- Lançar uma versão é um comando só (`npm run versao`), que decide o número a partir dos commits.

## Fora do escopo

- Versão automática a cada publicação da Vercel.
- Avisar quem está usando o site que há uma versão nova.
- Reconstruir versões antigas: o histórico começa na v1.0.0.

## Abordagens (o usuário escolheu A)

- **A. Comando de lançamento (escolhida).** `npm run versao` lê os commits desde a última tag,
  decide o número, grava o histórico e marca a tag. Sem bibliotecas novas. Custa um passo a mais
  ao publicar, que o Claude faz.
- **B. Versão automática por publicação** (data + commit). Descartada: na Vercel o histórico do
  Git chega cortado na publicação, e o número diz pouco sobre o que mudou.
- **C. Ferramenta pronta** (release-please, changesets). Descartada: dependências, automação no
  GitHub e textos em inglês.

## Como funciona

### O número (versão semântica)

- Algum `feat:` desde a última versão → sobe o do meio: 1.**1**.0.
- Senão, algum `fix:` ou `perf:` → sobe o último: 1.1.**1**.
- Só `test:`, `docs:`, `refactor:` ou `chore:` → **não há versão nova** (o comando avisa e para).
- Versão "maior" (2.0.0) só se pedida: `npm run versao -- --maior`.

### O histórico

- Fica em `lib/versoes.json`, uma lista de `{ versao, data, novidades[], correcoes[] }`.
  É a fonte da página e entra no build (import), sem leitura de arquivo em produção.
- `feat:` vira "Novidades"; `fix:` e `perf:` viram "Correções e melhorias". Os outros tipos
  são bastidores e não aparecem.
- O texto é o assunto do commit sem o prefixo, com a primeira letra maiúscula.
  *(Chamada do Claude: dá para revisar o texto no JSON antes do commit da versão.)*

### O comando `npm run versao`

1. Acha a última tag `v*` (sem tag: trata como a primeira versão).
2. Lê os commits desde ela, separa por tipo e decide o número.
3. Atualiza `package.json` e `lib/versoes.json`.
4. Faz o commit `chore: versão X.Y.Z` e cria a tag `vX.Y.Z`.
5. Não faz push: o push (com `--follow-tags`) continua pedindo o OK do usuário.

As regras (separar commits, decidir o número, montar a entrada) ficam em funções puras, com
testes. O script em si só lê o Git e grava os arquivos.

### No site

- **Rodapé** (`components/Rodape.tsx`): `v1.1.0 · Novidades`, lendo a versão do `package.json`.
- **Página `/novidades`**: título "Novidades", cada versão com a data em formato brasileiro
  (14/11/2026) e as duas listas. Mesmo visual do resto do site. Estática.

### A v1.0.0

Criada à mão hoje (2026-11-14), resumindo o que o site já tem: catálogo de filmes e séries com
filtros de streaming e nota, busca, páginas de detalhe com onde assistir, conta com nome, listas
"Quero assistir", "Assistindo" e "Já assisti", e a fileira "Para você". A tag `v1.0.0` marca o
commit dessa versão.

## Fluxo daqui em diante

Depois do merge de uma mudança em `main`, o Claude roda `npm run versao`, mostra a versão e o
texto, e faz o push com as tags quando o usuário der o OK. A checklist (`docs/CHECKLIST.md`) e o
`CLAUDE.md` passam a citar esse passo.

## O que fica para quem constrói

- O layout exato da página `/novidades` e do rodapé, seguindo o visual atual.
- Como o script chama o Git (`execFileSync`) e trata erros (por exemplo, árvore com mudanças não
  commitadas: o comando recusa).
