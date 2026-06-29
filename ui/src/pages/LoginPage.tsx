import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthManager } from "../managers/AuthManager";

interface LocationState {
  from?: string;
}

/**
 * Admin sign-in entry point.
 *
 * If the user is already authenticated, sends them to the originally
 * requested admin URL (or /admin). Otherwise renders a "Sign in" button
 * that starts the Cognito Hosted UI flow.
 */
export function LoginPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const { isAuthenticated, signIn } = useAuthManager();
  const returnTo = (location.state as LocationState | null)?.from ?? "/admin";

  // Optional: auto-start the flow. Disabled by default to leave the user a
  // chance to click and see the redirect, which avoids surprise pop-ups.
  useEffect(() => {
    /* no auto-redirect */
  }, []);

  if (isAuthenticated) {
    return <Navigate to={returnTo} replace />;
  }

  return (
    <Paper sx={{ p: 4, maxWidth: 420, mx: "auto" }}>
      <Stack spacing={2} alignItems="stretch">
        <Typography variant="h5">{t("auth.adminSignIn")}</Typography>
        <Typography color="text.secondary">{t("auth.signInHint")}</Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => signIn(returnTo)}
        >
          {t("nav.signIn")}
        </Button>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ display: "none" }}
          aria-hidden
        >
          <CircularProgress size={16} />
        </Stack>
      </Stack>
    </Paper>
  );
}
