import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { ReactNode } from "react";
import { tokensSet } from "../store/authSlice";

// Mocks must be set up before importing AuthManager (which imports them).
jest.mock("../services/cognito", () => ({
  buildAuthorizeUrl: jest.fn(() => "http://cognito/authorize"),
  buildLogoutUrl: jest.fn(() => "http://cognito/logout"),
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

import { useAuthManager } from "./AuthManager";
import * as cognito from "../services/cognito";
import { store as moduleStore } from "../store/store";

const mockCognito = cognito as jest.Mocked<typeof cognito>;

// Header.payload.signature with payload = {"email":"a@b.com"}.
const FAKE_ID_TOKEN = "h." + btoa('{"email":"a@b.com"}') + ".s";

function wrapper() {
  return ({ children }: { children: ReactNode }) => (
    <Provider store={moduleStore}>{children}</Provider>
  );
}

describe("useAuthManager", () => {
  let assignMock: jest.Mock;
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    // Reset the shared store between tests.
    moduleStore.dispatch({ type: "auth/signedOut" });
    assignMock = jest.fn();
    Object.defineProperty(window, "location", {
      writable: true,
      value: { ...window.location, assign: assignMock },
    });
  });
  afterEach(() => jest.clearAllMocks());

  it("signIn stores PKCE state and redirects to Cognito", async () => {
    const { result } = renderHook(() => useAuthManager(), { wrapper: wrapper() });
    await act(async () => {
      await result.current.signIn("/admin/products/new");
    });
    expect(assignMock).toHaveBeenCalledWith("http://cognito/authorize");
    const pkce = JSON.parse(sessionStorage.getItem("salescatalog.auth.pkce")!);
    expect(pkce.verifier).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(pkce.state).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(pkce.returnTo).toBe("/admin/products/new");
  });

  it("handleCallback validates state, exchanges code and stores tokens", async () => {
    sessionStorage.setItem(
      "salescatalog.auth.pkce",
      JSON.stringify({ verifier: "v", state: "s1", returnTo: "/admin" }),
    );
    mockCognito.exchangeCodeForTokens.mockResolvedValue({
      id_token: FAKE_ID_TOKEN,
      access_token: "ac",
      refresh_token: "re",
      expires_in: 3600,
      token_type: "Bearer",
    });

    const { result } = renderHook(() => useAuthManager(), { wrapper: wrapper() });
    let returned: { returnTo: string } | undefined;
    await act(async () => {
      returned = await result.current.handleCallback("the-code", "s1");
    });

    expect(mockCognito.exchangeCodeForTokens).toHaveBeenCalledWith({
      code: "the-code",
      codeVerifier: "v",
    });
    expect(returned!.returnTo).toBe("/admin");
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.email).toBe("a@b.com");
    // PKCE state cleared.
    expect(sessionStorage.getItem("salescatalog.auth.pkce")).toBeNull();
  });

  it("handleCallback rejects mismatched state", async () => {
    sessionStorage.setItem(
      "salescatalog.auth.pkce",
      JSON.stringify({ verifier: "v", state: "expected", returnTo: "/admin" }),
    );
    const { result } = renderHook(() => useAuthManager(), { wrapper: wrapper() });
    await expect(
      result.current.handleCallback("code", "actually-different"),
    ).rejects.toThrow(/state mismatch/i);
    expect(mockCognito.exchangeCodeForTokens).not.toHaveBeenCalled();
  });

  it("signOut clears state and redirects to Cognito logout", () => {
    moduleStore.dispatch(
      tokensSet({
        idToken: FAKE_ID_TOKEN,
        accessToken: "ac",
        refreshToken: "re",
        expiresAt: Date.now() + 60_000,
      }),
    );
    const { result } = renderHook(() => useAuthManager(), { wrapper: wrapper() });
    act(() => result.current.signOut());
    expect(assignMock).toHaveBeenCalledWith("http://cognito/logout");
    expect(result.current.isAuthenticated).toBe(false);
  });

  describe("ensureFreshToken", () => {
    it("returns the cached token when not near expiry", async () => {
      moduleStore.dispatch(
        tokensSet({
          idToken: FAKE_ID_TOKEN,
          accessToken: "ac",
          refreshToken: "re",
          expiresAt: Date.now() + 5 * 60_000,
        }),
      );
      const { result } = renderHook(() => useAuthManager(), { wrapper: wrapper() });
      const token = await result.current.ensureFreshToken();
      expect(token).toBe(FAKE_ID_TOKEN);
      expect(mockCognito.refreshTokens).not.toHaveBeenCalled();
    });

    it("silently refreshes when the token is near expiry", async () => {
      moduleStore.dispatch(
        tokensSet({
          idToken: FAKE_ID_TOKEN,
          accessToken: "ac",
          refreshToken: "re",
          expiresAt: Date.now() + 10_000, // <60s -> refresh
        }),
      );
      mockCognito.refreshTokens.mockResolvedValue({
        id_token: FAKE_ID_TOKEN + "2",
        access_token: "ac2",
        expires_in: 3600,
        token_type: "Bearer",
      });
      const { result } = renderHook(() => useAuthManager(), { wrapper: wrapper() });
      let token: string | null = null;
      await act(async () => {
        token = await result.current.ensureFreshToken();
      });
      expect(mockCognito.refreshTokens).toHaveBeenCalledWith("re");
      expect(token).toBe(FAKE_ID_TOKEN + "2");
    });

    it("signs out when refresh fails", async () => {
      moduleStore.dispatch(
        tokensSet({
          idToken: FAKE_ID_TOKEN,
          accessToken: "ac",
          refreshToken: "re",
          expiresAt: Date.now() + 10_000,
        }),
      );
      mockCognito.refreshTokens.mockRejectedValue(new Error("nope"));
      const { result } = renderHook(() => useAuthManager(), { wrapper: wrapper() });
      let token: string | null = "x";
      await act(async () => {
        token = await result.current.ensureFreshToken();
      });
      expect(token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it("returns null when not signed in", async () => {
      const { result } = renderHook(() => useAuthManager(), { wrapper: wrapper() });
      const token = await result.current.ensureFreshToken();
      expect(token).toBeNull();
    });
  });
});
