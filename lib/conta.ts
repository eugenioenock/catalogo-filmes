export type ModoConta = "entrar" | "criar";

export type EstadoConta = { erro: string | null; nome: string; email: string };

export type EstadoNome = { erro: string | null; nome: string };

const TELA_CADASTRO = "/completar-cadastro";

const SENHA_MINIMA = 6;
export const NOME_MAXIMO = 40;

const ERRO_GENERICO = "Não foi possível falar com o servidor agora. Tente de novo.";
const ERRO_EMAIL = "Digite um e-mail válido.";
const ERRO_SENHA_CURTA = `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`;
const ERRO_JA_CADASTRADO = "Este e-mail já está cadastrado. Entre com sua senha.";

/**
 * Para onde voltar depois de entrar. Só aceita caminhos deste site
 * ("/algo"), nunca "//outro-site" ou "https://…", que levariam para fora.
 * O endereço passa pelo mesmo leitor de URL do navegador: ele apaga tabs e quebras
 * de linha e troca "\" por "/", então "/\t/outro-site" também vira "//outro-site".
 */
export function lerVolta(valor: unknown): string {
  if (typeof valor !== "string" || !valor.startsWith("/")) return "/";
  const base = "http://cinecatalogo.invalid";
  try {
    const url = new URL(valor, base);
    return url.origin === base ? url.pathname + url.search + url.hash : "/";
  } catch {
    return "/";
  }
}

/** Confere o formulário antes de chamar o Supabase. Devolve a mensagem de erro ou null. */
export function validarCredenciais(email: string, senha: string, modo: ModoConta): string | null {
  if (!email.trim().includes("@")) return ERRO_EMAIL;
  if (senha === "") return "Digite sua senha.";
  if (modo === "criar" && senha.length < SENHA_MINIMA) return ERRO_SENHA_CURTA;
  return null;
}

/** Confere o nome do cadastro (já sem espaços nas pontas). Devolve a mensagem de erro ou null. */
export function validarNome(nome: string): string | null {
  if (nome === "") return "Digite como quer ser chamado.";
  // Array.from conta caracteres de verdade: um emoji vale 1, não 2.
  if (Array.from(nome).length > NOME_MAXIMO) return `Use até ${NOME_MAXIMO} caracteres.`;
  return null;
}

/**
 * O nome guardado na conta, se houver um de verdade. Os metadados podem ter
 * qualquer coisa (ou nada): só texto com algo além de espaços conta como nome.
 */
export function nomeValido(nome: unknown): string | null {
  if (typeof nome !== "string") return null;
  return nome.trim() || null;
}

/**
 * Link para a tela Completar cadastro que lembra a página atual, para voltar a ela depois.
 * Na própria tela (ou na inicial), não repete o volta.
 */
export function linkCadastro(atual: string): string {
  if (atual === "/" || atual.startsWith(TELA_CADASTRO)) return TELA_CADASTRO;
  return `${TELA_CADASTRO}?volta=${encodeURIComponent(atual)}`;
}

/** Para onde ir depois de entrar: quem ainda não tem nome passa antes pela tela Completar cadastro. */
export function destinoAposLogin(nome: unknown, volta: string): string {
  return nomeValido(nome) ? volta : linkCadastro(volta);
}

const MENSAGENS_AUTH: Record<string, string> = {
  invalid_credentials: "E-mail ou senha incorretos.",
  user_already_exists: ERRO_JA_CADASTRADO,
  email_exists: ERRO_JA_CADASTRADO,
  weak_password: ERRO_SENHA_CURTA,
  email_address_invalid: ERRO_EMAIL,
};

/** Traduz o código de erro do Supabase Auth para uma mensagem em português. */
export function traduzirErroAuth(codigo: string | undefined): string {
  return codigo && Object.hasOwn(MENSAGENS_AUTH, codigo) ? MENSAGENS_AUTH[codigo] : ERRO_GENERICO;
}
