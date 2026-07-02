// Runtime configuration sourced from Vite environment variables (VITE_*).
// Values are injected at build time from the SAM stack outputs.

export interface AppConfig {
  apiBaseUrl: string;
  imagesBaseUrl: string;
  cognitoDomain: string;
  cognitoClientId: string;
  cognitoRedirectUri: string;
  cognitoLogoutUri: string;
  adminGroup: string;
  phoneNumber: string | null;
}

export const config: AppConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  imagesBaseUrl: import.meta.env.VITE_IMAGES_BASE_URL ?? '',
  cognitoDomain: import.meta.env.VITE_COGNITO_DOMAIN ?? '',
  cognitoClientId: import.meta.env.VITE_COGNITO_CLIENT_ID ?? '',
  cognitoRedirectUri: import.meta.env.VITE_COGNITO_REDIRECT_URI ?? '',
  cognitoLogoutUri: import.meta.env.VITE_COGNITO_LOGOUT_URI ?? '',
  adminGroup: import.meta.env.VITE_ADMIN_GROUP ?? 'admins',
  phoneNumber: import.meta.env.VITE_PHONE_NUMBER ?? null,
};
