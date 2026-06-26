import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

/**
 * Login page (stub).
 *
 * Will redirect to the Cognito Hosted UI in the auth step. For now it just
 * shows a disabled button so the route is visible.
 */
export function LoginPage() {
  return (
    <Paper sx={{ p: 4, maxWidth: 420, mx: "auto" }}>
      <Stack spacing={2}>
        <Typography variant="h5">Admin sign in</Typography>
        <Typography color="text.secondary">
          Admin sign-in via Cognito is wired in a later step.
        </Typography>
        <Button variant="contained" disabled>
          Sign in with Cognito
        </Button>
      </Stack>
    </Paper>
  );
}
