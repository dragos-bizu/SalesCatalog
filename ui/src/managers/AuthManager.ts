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
  selectIsAdmin,
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

// Single in-flight refresh promise so concurrent admin requests share one
// refresh round-trip instead of triggering N parallel ones.
let inFlightRefresh: Promise<string | null> | null = null;

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

/**
 * Module-level (non-hook) version of ensureFreshToken used by the API client.
 *
 * Returns the current id token, transparently refreshing it when it's near
 * expiry. Concurrent calls share a single in-flight refresh. Returns null
 * when no session exists or refresh fails (caller falls back to unauth).
 */
export async function ensureFreshTokenStandalone(): Promise<string | null> {
  const { idToken, expiresAt, refreshToken } = store.getState().auth;
  if (!idToken || !expiresAt) return null;
  if (expiresAt - Date.now() > REFRESH_EARLY_MS) return idToken;
  if (!refreshToken) {
    store.dispatch(signedOut());
    return null;
  }
  if (inFlightRefresh) return inFlightRefresh;
  inFlightRefresh = (async () => {
    try {
      const tokens = await refreshTokens(refreshToken);
      const payload = toTokensPayload(tokens);
      store.dispatch(tokensSet(payload));
      return payload.idToken;
    } catch {
      store.dispatch(signedOut());
      return null;
    } finally {
      inFlightRefresh = null;
    }
  })();
  return inFlightRefresh;
}

export interface UseAuthManager {
  isAuthenticated: boolean;
  isAdmin: boolean;
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
  const isAdmin = useAppSelector(selectIsAdmin);
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

  // The hook simply delegates to the standalone function so the same logic
  // (including in-flight refresh deduping) is shared with the API client.
  const ensureFreshToken = useCallback(
    () => ensureFreshTokenStandalone(),
    [],
  );

  return {
    isAuthenticated,
    isAdmin,
    email,
    signIn,
    handleCallback,
    signOut,
    ensureFreshToken,
  };
}
