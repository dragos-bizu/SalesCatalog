// PKCE (Proof Key for Code Exchange) helpers for the OAuth 2.0 Authorization
// Code flow. Required by Cognito for public SPA clients (no client secret).
//
// Flow:
//   1. createVerifier() -> a random high-entropy string (the secret).
//   2. createChallenge(verifier) -> SHA-256 + base64url-encoded (the public
//      counterpart sent in the /authorize redirect).
//   3. After the redirect callback, the verifier is sent to /oauth2/token
//      and Cognito checks it matches the challenge it received earlier.

// 32 random bytes -> ~43 base64url chars (well within Cognito's 43-128 range).
const VERIFIER_BYTES = 32;

/** URL-safe base64 encoding without padding. */
function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Generate a fresh PKCE verifier (high-entropy random string). */
export function createVerifier(): string {
  const bytes = new Uint8Array(VERIFIER_BYTES);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

/** Derive the PKCE challenge from a verifier (SHA-256, base64url). */
export async function createChallenge(verifier: string): Promise<string> {
  const encoded = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return base64UrlEncode(new Uint8Array(digest));
}
