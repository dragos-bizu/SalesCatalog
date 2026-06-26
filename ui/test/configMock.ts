// Jest stand-in for src/app/config.ts (which relies on Vite's import.meta.env).
export const config = {
  apiBaseUrl: "http://api.test",
  imagesBaseUrl: "http://images.test",
  cognitoDomain: "http://cognito.test",
  cognitoClientId: "test-client-id",
  cognitoRedirectUri: "http://localhost/auth/callback",
  cognitoLogoutUri: "http://localhost/",
};
