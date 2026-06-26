import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

/**
 * Public home page (stub).
 *
 * Will host the search bar, category tabs (incl. "All products"), and the
 * product grid in a later step.
 */
export function HomePage() {
  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        SalesCatalog
      </Typography>
      <Typography color="text.secondary">
        Public catalog will appear here: search bar, category tabs (with an
        "All products" tab), and the product grid.
      </Typography>
    </Paper>
  );
}
