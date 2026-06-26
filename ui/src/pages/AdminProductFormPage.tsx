import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useParams } from "react-router-dom";

/**
 * Admin create/edit product form (stub).
 *
 * One component handles both routes:
 *   - /admin/products/new        -> create
 *   - /admin/products/:id/edit   -> update
 * The id presence in the URL switches the mode.
 */
export function AdminProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const mode = id ? "edit" : "new";

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        {mode === "edit" ? "Edit product" : "New product"}
      </Typography>
      <Typography color="text.secondary">
        Form (fields, image upload, category picker/creator) lands in a later
        step.
      </Typography>
      {id && (
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Editing id: <code>{id}</code>
        </Typography>
      )}
    </Paper>
  );
}
