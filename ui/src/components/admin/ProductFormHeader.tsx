import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router-dom";

export interface ProductFormHeaderProps {
  mode: "new" | "edit";
}

/** Header row for the admin product form. */
export function ProductFormHeader({ mode }: ProductFormHeaderProps) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="h4">
        {mode === "new" ? "New product" : "Edit product"}
      </Typography>
      <Button component={RouterLink} to="/admin" startIcon={<ArrowBackIcon />}>
        Back
      </Button>
    </Stack>
  );
}
