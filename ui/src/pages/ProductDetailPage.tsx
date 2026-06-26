import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useParams } from "react-router-dom";

/**
 * Public product detail page (stub).
 *
 * Reads :id from the URL. Will display name, images, description, EAN,
 * and category once wired to the ProductManager.
 */
export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Product detail
      </Typography>
      <Typography color="text.secondary">
        Product id: <code>{id}</code>
      </Typography>
    </Paper>
  );
}
