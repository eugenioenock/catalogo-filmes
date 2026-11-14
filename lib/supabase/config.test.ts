import { afterEach, describe, expect, it, vi } from "vitest";
import { configSupabase } from "./config";

const URL = "NEXT_PUBLIC_SUPABASE_URL";
const CHAVE = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";

afterEach(() => vi.unstubAllEnvs());

describe("configSupabase", () => {
  it("devolve url e chave quando as duas existem", () => {
    vi.stubEnv(URL, "https://abc.supabase.co");
    vi.stubEnv(CHAVE, "sb_publishable_x");
    expect(configSupabase()).toEqual({ url: "https://abc.supabase.co", chave: "sb_publishable_x" });
  });

  it("devolve null sem a url", () => {
    vi.stubEnv(URL, undefined);
    vi.stubEnv(CHAVE, "sb_publishable_x");
    expect(configSupabase()).toBeNull();
  });

  it("devolve null sem a chave", () => {
    vi.stubEnv(URL, "https://abc.supabase.co");
    vi.stubEnv(CHAVE, undefined);
    expect(configSupabase()).toBeNull();
  });

  it("devolve null com valores vazios", () => {
    vi.stubEnv(URL, "");
    vi.stubEnv(CHAVE, "");
    expect(configSupabase()).toBeNull();
  });
});
