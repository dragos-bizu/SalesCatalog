// Tests for ensureFreshTokenStandalone (the API-client-facing version of the
// silent refresh). Covers cache hits, refresh, refresh-failure, dedupe of
// concurrent calls, and the no-session case.

jest.mock("../services/cognito", () => ({
  buildAuthorizeUrl: jest.fn(),
  buildLogoutUrl: jest.fn(),
  exchangeCodeForTokens: jest.fn(),
  refreshTokens: jest.fn(),
}));
jest.mock("../store/store", () => {
  const { configureStore } = jest.requireActual("@reduxjs/toolkit");
  const authReducer = jest.requireActual("../store/authSlice").default;
  return {
    store: configureStore({ reducer: { auth: authReducer } }),
  };
});

import { ensureFreshTokenStandalone } from "./AuthManager";
import * as cognito from "../services/cognito";
import { store as moduleStore } from "../store/store";
import { tokensSet } from "../store/authSlice";

const mockCognito = cognito as jest.Mocked<typeof cognito>;
const FAKE_ID_TOKEN = "h." + btoa('{"email":"a@b.com"}') + ".s";

describe("ensureFreshTokenStandalone", () => {
  beforeEach(() => {
    moduleStore.dispatch({ type: "auth/signedOut" });
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("returns null when there is no session", async () => {
    expect(await ensureFreshTokenStandalone()).toBeNull();
    expect(mockCognito.refreshTokens).not.toHaveBeenCalled();
  });

  it("returns the cached token when not near expiry", async () => {
    moduleStore.dispatch(
      tokensSet({
        idToken: FAKE_ID_TOKEN,
        accessToken: "ac",
        refreshToken: "re",
        expiresAt: Date.now() + 5 * 60_000,
      }),
    );
    expect(await ensureFreshTokenStandalone()).toBe(FAKE_ID_TOKEN);
    expect(mockCognito.refreshTokens).not.toHaveBeenCalled();
  });

  it("refreshes silently when token is near expiry", async () => {
    moduleStore.dispatch(
      tokensSet({
        idToken: FAKE_ID_TOKEN,
        accessToken: "ac",
        refreshToken: "re",
        expiresAt: Date.now() + 10_000,
      }),
    );
    mockCognito.refreshTokens.mockResolvedValue({
      id_token: FAKE_ID_TOKEN + "2",
      access_token: "ac2",
      expires_in: 3600,
      token_type: "Bearer",
    });
    expect(await ensureFreshTokenStandalone()).toBe(FAKE_ID_TOKEN + "2");
    expect(mockCognito.refreshTokens).toHaveBeenCalledWith("re");
  });

  it("signs out on refresh failure and returns null", async () => {
    moduleStore.dispatch(
      tokensSet({
        idToken: FAKE_ID_TOKEN,
        accessToken: "ac",
        refreshToken: "re",
        expiresAt: Date.now() + 10_000,
      }),
    );
    mockCognito.refreshTokens.mockRejectedValue(new Error("bad"));
    expect(await ensureFreshTokenStandalone()).toBeNull();
    expect(moduleStore.getState().auth.idToken).toBeNull();
  });

  it("dedupes concurrent refreshes into a single round-trip", async () => {
    moduleStore.dispatch(
      tokensSet({
        idToken: FAKE_ID_TOKEN,
        accessToken: "ac",
        refreshToken: "re",
        expiresAt: Date.now() + 10_000,
      }),
    );
    let resolveRefresh!: (v: cognito.TokenResponse) => void;
    mockCognito.refreshTokens.mockReturnValue(
      new Promise((res) => {
        resolveRefresh = res;
      }),
    );

    const a = ensureFreshTokenStandalone();
    const b = ensureFreshTokenStandalone();
    const c = ensureFreshTokenStandalone();

    resolveRefresh({
      id_token: FAKE_ID_TOKEN + "X",
      access_token: "ac",
      expires_in: 3600,
      token_type: "Bearer",
    });

    const [ra, rb, rc] = await Promise.all([a, b, c]);
    expect(ra).toBe(FAKE_ID_TOKEN + "X");
    expect(rb).toBe(FAKE_ID_TOKEN + "X");
    expect(rc).toBe(FAKE_ID_TOKEN + "X");
    expect(mockCognito.refreshTokens).toHaveBeenCalledTimes(1);
  });

  it("signs out when there is a token but no refresh token", async () => {
    moduleStore.dispatch(
      tokensSet({
        idToken: FAKE_ID_TOKEN,
        accessToken: "ac",
        refreshToken: null,
        expiresAt: Date.now() + 10_000,
      }),
    );
    expect(await ensureFreshTokenStandalone()).toBeNull();
    expect(moduleStore.getState().auth.idToken).toBeNull();
  });
});
