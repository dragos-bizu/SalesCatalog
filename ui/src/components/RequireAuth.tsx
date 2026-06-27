import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "../hooks/redux";
import { selectIsAuthenticated } from "../store/authSlice";

/**
 * Route guard for admin pages.
 *
 * Reads the auth slice; if no valid session, redirects to /login while
 * preserving the requested URL in location state so we can return after a
 * successful sign-in.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  if (!isAuthenticated) {
    const returnTo = location.pathname + location.search;
    return <Navigate to="/login" replace state={{ from: returnTo }} />;
  }
  return <>{children}</>;
}
