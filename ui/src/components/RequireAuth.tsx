import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

/**
 * Route guard for admin pages.
 *
 * Stub for now: always treats the user as "not authenticated" and redirects
 * to /login. Wired to real Cognito state in the auth step. The `from`
 * location is preserved so we can come back after sign-in.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isAuthenticated = false; // TODO: replace with selector from auth slice

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
}
