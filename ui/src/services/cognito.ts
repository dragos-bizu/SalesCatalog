// Thin client for the Cognito Hosted UI / OAuth2 endpoints.
//
// We only talk to two endpoints:
//   - GET <domain>/login    (redirect target for the authorization request)
//   - POST <domain>/oauth2/token  (code->token exchange + refresh)

import { config } from "../app/config";

export interface TokenResponse {
  id_token: string;
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

/** Build the URL of the Cognito Hosted UI login page. */
export function buildAuthorizeUrl(params: {
  state: string;
  codeChallenge: string;
}): string {
  const url = new URL(`${config.cognitoDomain}/login`);
  url.searchParams.set("client_id", config.cognitoClientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("redirect_uri", config.cognitoRedirectUri);
  url.searchParams.set("state", params.state);
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

/** Build the URL of the Cognito Hosted UI logout endpoint. */
export function buildLogoutUrl(): string {
  const url = new URL(`${config.cognitoDomain}/logout`);
  url.searchParams.set("client_id", config.cognitoClientId);
  url.searchParams.set("logout_uri", config.cognitoLogoutUri);
  return url.toString();
}

/** Exchange an authorization code (+ PKCE verifier) for tokens. */
export async function exchangeCodeForTokens(args: {
  code: string;
  codeVerifier: string;
}): Promise<TokenResponse> {
  return postToken({
    grant_type: "authorization_code",
    client_id: config.cognitoClientId,
    code: args.code,
    redirect_uri: config.cognitoRedirectUri,
    code_verifier: args.codeVerifier,
  });
}

/** Refresh access/ID tokens using the long-lived refresh token. */
export async function refreshTokens(refreshToken: string): Promise<TokenResponse> {
  return postToken({
    grant_type: "refresh_token",
    client_id: config.cognitoClientId,
    refresh_token: refreshToken,
  });
}

async function postToken(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(`${config.cognitoDomain}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Cognito token endpoint failed (${res.status}): ${text}`);
  }
  return JSON.parse(text) as TokenResponse;
}
