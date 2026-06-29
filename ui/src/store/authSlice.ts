// Redux slice for admin authentication state.
//
// Holds Cognito tokens + derived identity/authorization fields. Hydrates from
// localStorage on app start (see store.ts) so a page reload doesn't sign
// the admin out.

import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { config } from "../app/config";
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
  /** Cognito groups from the token (e.g. ["admins"]). */
  groups: string[];
}

function decodeClaims(idToken: string): Record<string, unknown> {
  const payload = idToken.split(".")[1];
  const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(json) as Record<string, unknown>;
}

/** Decode the email claim from a JWT ID token without verifying the signature. */
function extractEmail(idToken: string): string | null {
  try {
    const claims = decodeClaims(idToken) as { email?: string };
    return claims.email ?? null;
  } catch {
    return null;
  }
}

function extractGroups(idToken: string): string[] {
  try {
    const claims = decodeClaims(idToken);
    const raw = claims["cognito:groups"];

    if (Array.isArray(raw)) {
      return raw.map((x) => String(x).trim()).filter(Boolean);
    }
    if (typeof raw === "string") {
      const text = raw.trim().replace(/^\[/, "").replace(/\]$/, "");
      if (!text) return [];
      return text
        .split(",")
        .map((x) => x.trim().replace(/^['"]|['"]$/g, ""))
        .filter(Boolean);
    }

    return [];
  } catch {
    return [];
  }
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
      groups: [],
    };
  }
  return {
    idToken: persisted.idToken,
    accessToken: persisted.accessToken,
    refreshToken: persisted.refreshToken,
    expiresAt: persisted.expiresAt,
    email: extractEmail(persisted.idToken),
    groups: extractGroups(persisted.idToken),
  };
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
      state.groups = extractGroups(action.payload.idToken);

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
      state.groups = [];
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

export const selectIsAdmin = (s: RootState): boolean => {
  if (!selectIsAuthenticated(s)) return false;
  const required = config.adminGroup?.trim() || "admins";
  return s.auth.groups.includes(required);
};
