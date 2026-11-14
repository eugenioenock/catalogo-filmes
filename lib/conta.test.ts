import { describe, expect, it } from "vitest";
import {
  destinoAposLogin,
  lerVolta,
  linkCadastro,
  nomeValido,
  traduzirErroAuth,
  validarCredenciais,
  validarNome,
} from "./conta";

describe("lerVolta", () => {
  it.each(["/", "/filme/27205", "/?lista=ja-assisti"])("aceita %s", (v) =>
    expect(lerVolta(v)).toBe(v));
  it.each([
    "//site.com",
    "https://site.com",
    "/\\site.com",
    "/\t/site.com",
    "/\n/site.com",
    "/\r\n/site.com",
    "/\t\\site.com",
    "",
    "filme/1",
    null,
    undefined,
    42,
  ])(
    "troca %s por /",
    (v) => expect(lerVolta(v)).toBe("/"),
  );
});

describe("validarCredenciais", () => {
  it("aceita e-mail e senha válidos", () =>
    expect(validarCredenciais("a@b.com", "123456", "criar")).toBeNull());
  it("e-mail sem @", () =>
    expect(validarCredenciais("ab.com", "123456", "entrar")).toBe("Digite um e-mail válido."));
  it("e-mail só com espaços", () =>
    expect(validarCredenciais("   ", "123456", "entrar")).toBe("Digite um e-mail válido."));
  it("senha vazia ao entrar", () =>
    expect(validarCredenciais("a@b.com", "", "entrar")).toBe("Digite sua senha."));
  it("senha curta ao criar", () =>
    expect(validarCredenciais("a@b.com", "12345", "criar")).toBe(
      "A senha precisa ter pelo menos 6 caracteres.",
    ));
  it("senha curta ao entrar não é barrada aqui", () =>
    expect(validarCredenciais("a@b.com", "12345", "entrar")).toBeNull());
});

describe("traduzirErroAuth", () => {
  it.each([
    ["invalid_credentials", "E-mail ou senha incorretos."],
    ["user_already_exists", "Este e-mail já está cadastrado. Entre com sua senha."],
    ["email_exists", "Este e-mail já está cadastrado. Entre com sua senha."],
    ["weak_password", "A senha precisa ter pelo menos 6 caracteres."],
    ["email_address_invalid", "Digite um e-mail válido."],
    ["over_request_rate_limit", "Não foi possível falar com o servidor agora. Tente de novo."],
    [undefined, "Não foi possível falar com o servidor agora. Tente de novo."],
  ])("%s", (codigo, msg) => expect(traduzirErroAuth(codigo)).toBe(msg));
});

describe("validarNome", () => {
  it("aceita um nome", () => expect(validarNome("Eugênio")).toBeNull());
  it("vazio", () => expect(validarNome("")).toBe("Digite como quer ser chamado."));
  it("aceita 40 caracteres acentuados", () => expect(validarNome("é".repeat(40))).toBeNull());
  it("recusa 41 caracteres", () =>
    expect(validarNome("a".repeat(41))).toBe("Use até 40 caracteres."));
  it("conta emoji como 1 caractere", () => expect(validarNome("🎬".repeat(40))).toBeNull());
});

describe("nomeValido", () => {
  it("devolve o nome sem espaços nas pontas", () => expect(nomeValido("  Ana ")).toBe("Ana"));
  it.each([undefined, null, "", "   ", 42, { a: 1 }])("sem nome válido (%s)", (n) =>
    expect(nomeValido(n)).toBeNull());
});

describe("linkCadastro", () => {
  it("da página inicial, sem volta", () => expect(linkCadastro("/")).toBe("/completar-cadastro"));
  it("guarda a página atual", () =>
    expect(linkCadastro("/filme/27205?x=1")).toBe(
      "/completar-cadastro?volta=%2Ffilme%2F27205%3Fx%3D1",
    ));
  it("na própria tela, não aninha", () =>
    expect(linkCadastro("/completar-cadastro?volta=%2Ffilme%2F1")).toBe("/completar-cadastro"));
});

describe("destinoAposLogin", () => {
  it("com nome, vai para o volta", () =>
    expect(destinoAposLogin("Ana", "/filme/1")).toBe("/filme/1"));
  it("sem nome, passa pela tela e guarda o volta", () =>
    expect(destinoAposLogin(undefined, "/filme/1")).toBe("/completar-cadastro?volta=%2Ffilme%2F1"));
  it("sem nome, vindo do início", () =>
    expect(destinoAposLogin("  ", "/")).toBe("/completar-cadastro"));
});
