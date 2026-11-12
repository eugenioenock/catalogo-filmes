import { describe, expect, it } from "vitest";
import { anoDe, formatarDuracao, formatarNota } from "./formatar";

describe("formatarDuracao", () => {
  it("135 vira 2h 15min", () => expect(formatarDuracao(135)).toBe("2h 15min"));
  it("45 vira 45min", () => expect(formatarDuracao(45)).toBe("45min"));
  it("120 vira 2h", () => expect(formatarDuracao(120)).toBe("2h"));
  it("null e 0 viram null", () => {
    expect(formatarDuracao(null)).toBeNull();
    expect(formatarDuracao(0)).toBeNull();
  });
});

describe("formatarNota", () => {
  it("7.83 vira 7,8", () => expect(formatarNota(7.83)).toBe("7,8"));
  it("8 vira 8,0", () => expect(formatarNota(8)).toBe("8,0"));
});

describe("anoDe", () => {
  it("extrai o ano", () => expect(anoDe("2024-03-01")).toBe("2024"));
  it("vazio, null e undefined viram null", () => {
    expect(anoDe("")).toBeNull();
    expect(anoDe(null)).toBeNull();
    expect(anoDe(undefined)).toBeNull();
  });
});
