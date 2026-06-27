import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthManager } from "../managers/AuthManager";

/**
 * Handles the redirect back from the Cognito Hosted UI:
 *   1. Reads ?code= and ?state= from the URL.
 *   2. Exchanges the code (with the PKCE verifier) for tokens.
 *   3. Navigates to the originally requested admin URL (or /admin).
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { handleCallback } = useAuthManager();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = params.get("code");
    const state = params.get("state");
    const oauthError = params.get("error");

    if (oauthError) {
      setError(params.get("error_description") || oauthError);
      return;
    }
    if (!code || !state) {
      setError("Missing 'code' or 'state' query parameter");
      return;
    }

    handleCallback(code, state)
      .then(({ returnTo }) => navigate(returnTo, { replace: true }))
      .catch((e: Error) => setError(e.message));
  }, [params, handleCallback, navigate]);

  return (
    <Paper sx={{ p: 4 }}>
      {error ? (
        <Stack spacing={2}>
          <Alert severity="error">Sign-in failed: {error}</Alert>
          <Box>
            <a href="/login">Try again</a>
          </Box>
        </Stack>
      ) : (
        <Stack direction="row" alignItems="center" spacing={2}>
          <CircularProgress size={20} />
          <Typography>Completing sign-in…</Typography>
        </Stack>
      )}
    </Paper>
  );
}
