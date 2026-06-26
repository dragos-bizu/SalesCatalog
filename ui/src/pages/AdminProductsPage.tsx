import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import { Link as RouterLink } from "react-router-dom";

/**
 * Admin products list (stub).
 *
 * Will become a table with edit/delete actions and a "New product" button.
 */
export function AdminProductsPage() {
  return (
    <Paper sx={{ p: 4 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h4">Products (admin)</Typography>
        <Button
          component={RouterLink}
          to="/admin/products/new"
          variant="contained"
          startIcon={<AddIcon />}
        >
          New product
        </Button>
      </Stack>
      <Typography color="text.secondary">
        Table view with edit/delete actions will appear here.
      </Typography>
      <Button component={RouterLink} to="/admin/categories" sx={{ mt: 2 }}>
        Manage categories
      </Button>
    </Paper>
  );
}
