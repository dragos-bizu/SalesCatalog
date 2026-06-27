// Wires the api service to the auth layer so admin API requests automatically
// include a valid, non-expired Cognito id token. Uses the silent-refresh
// helper from AuthManager so near-expired tokens are refreshed transparently.

import { ensureFreshTokenStandalone } from "../managers/AuthManager";
import { setTokenProvider } from "../services/api";

export function installTokenProvider(): void {
  setTokenProvider(() => ensureFreshTokenStandalone());
}
