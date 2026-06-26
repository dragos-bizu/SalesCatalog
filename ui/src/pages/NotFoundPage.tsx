import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router-dom";

/** 404 fallback for unmatched routes. */
export function NotFoundPage() {
  return (
    <Paper sx={{ p: 4, textAlign: "center" }}>
      <Stack spacing={2} alignItems="center">
        <Typography variant="h4">Page not found</Typography>
        <Typography color="text.secondary">
          The page you're looking for doesn't exist.
        </Typography>
        <Button component={RouterLink} to="/" variant="contained">
          Back to home
        </Button>
      </Stack>
    </Paper>
  );
}
