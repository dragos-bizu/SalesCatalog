// Redux slice for admin authentication state.
//
// Holds Cognito tokens + a derived "isAuthenticated" flag. Hydrates from
// localStorage on app start (see store.ts) so a page reload doesn't sign
// the admin out.

import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  clearAuth,
  loadAuth,
  saveAuth,
  type PersistedAuth,
} from "../services/tokenStorage";

export interface AuthState {
  idToken: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  /** Epoch ms expiry of the id/access tokens. */
  expiresAt: number | null;
  /** Email/name derived from the ID token claims, if available. */
  email: string | null;
}

function initialFromStorage(): AuthState {
  const persisted = loadAuth();
  if (!persisted) {
    return {
      idToken: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      email: null,
    };
  }
  return {
    idToken: persisted.idToken,
    accessToken: persisted.accessToken,
    refreshToken: persisted.refreshToken,
    expiresAt: persisted.expiresAt,
    email: extractEmail(persisted.idToken),
  };
}

/** Decode the email claim from a JWT ID token without verifying the signature. */
function extractEmail(idToken: string): string | null {
  try {
    const payload = idToken.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const claims = JSON.parse(json) as { email?: string };
    return claims.email ?? null;
  } catch {
    return null;
  }
}

export interface TokensPayload {
  idToken: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
}

const slice = createSlice({
  name: "auth",
  initialState: initialFromStorage(),
  reducers: {
    tokensSet(state, action: PayloadAction<TokensPayload>) {
      state.idToken = action.payload.idToken;
      state.accessToken = action.payload.accessToken;
      // Refresh token is only returned on the initial code exchange; keep
      // the previous one across silent refreshes.
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
      }
      state.expiresAt = action.payload.expiresAt;
      state.email = extractEmail(action.payload.idToken);

      const persisted: PersistedAuth = {
        idToken: state.idToken,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
      };
      saveAuth(persisted);
    },
    signedOut(state) {
      state.idToken = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.expiresAt = null;
      state.email = null;
      clearAuth();
    },
  },
});

export const { tokensSet, signedOut } = slice.actions;
export default slice.reducer;

// Selectors --------------------------------------------------------------

import type { RootState } from "./store";

export const selectIdToken = (s: RootState): string | null => s.auth.idToken;

export const selectIsAuthenticated = (s: RootState): boolean => {
  const { idToken, expiresAt } = s.auth;
  if (!idToken || !expiresAt) return false;
  return expiresAt > Date.now();
};

export const selectEmail = (s: RootState): string | null => s.auth.email;

export const selectRefreshToken = (s: RootState): string | null =>
  s.auth.refreshToken;
