import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

/**
 * Admin categories management page (stub).
 *
 * Will list categories with rename/delete actions, plus a "New category"
 * form. Delete is blocked server-side when products still reference the
 * category (409); the UI surfaces that error.
 */
export function AdminCategoriesPage() {
  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Categories (admin)
      </Typography>
      <Typography color="text.secondary">
        Category management UI will appear here.
      </Typography>
    </Paper>
  );
}
