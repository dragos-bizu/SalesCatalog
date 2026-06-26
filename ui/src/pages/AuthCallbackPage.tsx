import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

/**
 * OAuth callback landing page (stub).
 *
 * In the auth step this page will exchange the authorization code in the URL
 * for tokens, store them in the auth slice, and navigate to the originally
 * requested admin URL (or /admin by default).
 */
export function AuthCallbackPage() {
  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Completing sign-in…
      </Typography>
      <Typography color="text.secondary">
        Token exchange is wired in the auth step.
      </Typography>
    </Paper>
  );
}
