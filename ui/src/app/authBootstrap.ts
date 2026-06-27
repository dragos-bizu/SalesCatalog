// Wires the api service to the Redux auth slice so admin API requests
// automatically include the current Cognito id token. Called once at app
// startup from main.tsx.

import { setTokenProvider } from "../services/api";
import { selectIdToken } from "../store/authSlice";
import { store } from "../store/store";

export function installTokenProvider(): void {
  setTokenProvider(() => selectIdToken(store.getState()));
}
