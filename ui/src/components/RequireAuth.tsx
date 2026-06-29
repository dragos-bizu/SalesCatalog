import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "../hooks/redux";
import { selectIsAdmin } from "../store/authSlice";

/**
 * Route guard for admin pages.
 *
 * Reads the auth slice; if the user is not in the configured admin group,
 * redirects to /login while preserving the requested URL in location state.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isAdmin = useAppSelector(selectIsAdmin);

  if (!isAdmin) {
    const returnTo = location.pathname + location.search;
    return <Navigate to="/login" replace state={{ from: returnTo }} />;
  }
  return <>{children}</>;
}
