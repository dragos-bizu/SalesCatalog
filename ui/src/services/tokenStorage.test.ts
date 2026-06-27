import { clearAuth, loadAuth, saveAuth } from "./tokenStorage";

describe("tokenStorage", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips a saved record", () => {
    const record = {
      idToken: "id",
      accessToken: "ac",
      refreshToken: "re",
      expiresAt: 12345,
    };
    saveAuth(record);
    expect(loadAuth()).toEqual(record);
  });

  it("loadAuth returns null when nothing is stored", () => {
    expect(loadAuth()).toBeNull();
  });

  it("clearAuth removes the record", () => {
    saveAuth({
      idToken: "id",
      accessToken: "ac",
      refreshToken: null,
      expiresAt: 0,
    });
    clearAuth();
    expect(loadAuth()).toBeNull();
  });

  it("loadAuth recovers from corrupt JSON by clearing it", () => {
    localStorage.setItem("salescatalog.auth", "{not json");
    expect(loadAuth()).toBeNull();
    expect(localStorage.getItem("salescatalog.auth")).toBeNull();
  });
});
