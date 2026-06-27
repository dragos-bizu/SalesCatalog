// AuthManager
//
// Orchestrates the Cognito Hosted UI authorization-code + PKCE flow and the
// silent-refresh dance. Components use the exposed hook to read auth state
// and trigger sign-in / sign-out.
//
//   useAuthManager()
//       -> { isAuthenticated, email, signIn(), signOut(),
//             handleCallback(code, state), ensureFreshToken() }

import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import {
  selectEmail,
  selectIsAuthenticated,
  signedOut,
  tokensSet,
} from "../store/authSlice";
import {
  buildAuthorizeUrl,
  buildLogoutUrl,
  exchangeCodeForTokens,
  refreshTokens,
  type TokenResponse,
} from "../services/cognito";
import { createChallenge, createVerifier } from "../services/pkce";
import { store } from "../store/store";

const PKCE_STATE_KEY = "salescatalog.auth.pkce";
// Refresh proactively when less than 60 seconds remain on the id token.
const REFRESH_EARLY_MS = 60_000;

interface PkceState {
  verifier: string;
  state: string;
  /** Path inside our app to navigate to after the callback completes. */
  returnTo: string;
}

function savePkceState(s: PkceState): void {
  sessionStorage.setItem(PKCE_STATE_KEY, JSON.stringify(s));
}

function loadPkceState(): PkceState | null {
  const raw = sessionStorage.getItem(PKCE_STATE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PkceState;
  } catch {
    return null;
  }
}

function clearPkceState(): void {
  sessionStorage.removeItem(PKCE_STATE_KEY);
}

function toTokensPayload(res: TokenResponse) {
  return {
    idToken: res.id_token,
    accessToken: res.access_token,
    refreshToken: res.refresh_token ?? null,
    expiresAt: Date.now() + res.expires_in * 1000,
  };
}

export interface UseAuthManager {
  isAuthenticated: boolean;
  email: string | null;
  /** Start the sign-in flow: redirects to the Cognito Hosted UI. */
  signIn(returnTo?: string): Promise<void>;
  /** Handle the /auth/callback page: exchange ?code= for tokens. */
  handleCallback(code: string, state: string): Promise<{ returnTo: string }>;
  /** Local + Cognito sign-out (redirects to the Hosted UI logout). */
  signOut(): void;
  /**
   * Ensure the cached id token will still be valid for the next request.
   * Triggers a silent refresh when it's near expiry. Returns the current id
   * token (or null when signed out / refresh failed).
   */
  ensureFreshToken(): Promise<string | null>;
}

export function useAuthManager(): UseAuthManager {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const email = useAppSelector(selectEmail);

  const signIn = useCallback(async (returnTo: string = "/admin") => {
    const verifier = createVerifier();
    const challenge = await createChallenge(verifier);
    const state = createVerifier(); // reused random string as CSRF state
    savePkceState({ verifier, state, returnTo });
    window.location.assign(
      buildAuthorizeUrl({ state, codeChallenge: challenge }),
    );
  }, []);

  const handleCallback = useCallback(
    async (code: string, state: string) => {
      const pkce = loadPkceState();
      if (!pkce) throw new Error("Missing PKCE state; please sign in again");
      if (pkce.state !== state) {
        throw new Error("OAuth state mismatch; possible CSRF, aborting");
      }
      const tokens = await exchangeCodeForTokens({
        code,
        codeVerifier: pkce.verifier,
      });
      dispatch(tokensSet(toTokensPayload(tokens)));
      clearPkceState();
      return { returnTo: pkce.returnTo };
    },
    [dispatch],
  );

  const signOut = useCallback(() => {
    dispatch(signedOut());
    clearPkceState();
    window.location.assign(buildLogoutUrl());
  }, [dispatch]);

  const ensureFreshToken = useCallback(async () => {
    // Read fresh state from the store directly to avoid stale closures.
    const state = store.getState().auth;
    const { idToken, expiresAt, refreshToken } = state;
    if (!idToken || !expiresAt) return null;
    if (expiresAt - Date.now() > REFRESH_EARLY_MS) return idToken;
    if (!refreshToken) {
      dispatch(signedOut());
      return null;
    }
    try {
      const tokens = await refreshTokens(refreshToken);
      const payload = toTokensPayload(tokens);
      dispatch(tokensSet(payload));
      return payload.idToken;
    } catch {
      dispatch(signedOut());
      return null;
    }
  }, [dispatch]);

  return {
    isAuthenticated,
    email,
    signIn,
    handleCallback,
    signOut,
    ensureFreshToken,
  };
}
