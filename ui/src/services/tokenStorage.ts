// Persistence layer for Cognito tokens. Uses localStorage so the admin
// session survives full browser restarts; cleared on signOut().

const STORAGE_KEY = "salescatalog.auth";

export interface PersistedAuth {
  idToken: string;
  accessToken: string;
  refreshToken: string | null;
  /** Epoch milliseconds at which the id/access tokens expire. */
  expiresAt: number;
}

function safeLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    // Privacy mode, SSR, or tests without window.
    return null;
  }
}

export function loadAuth(): PersistedAuth | null {
  const storage = safeLocalStorage();
  if (!storage) return null;
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PersistedAuth;
  } catch {
    storage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveAuth(auth: PersistedAuth): void {
  const storage = safeLocalStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

export function clearAuth(): void {
  const storage = safeLocalStorage();
  if (!storage) return;
  storage.removeItem(STORAGE_KEY);
}
