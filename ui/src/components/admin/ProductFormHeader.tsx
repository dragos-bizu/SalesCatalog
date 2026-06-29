import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";

export interface ProductFormHeaderProps {
  mode: "new" | "edit";
}

/** Header row for the admin product form. */
export function ProductFormHeader({ mode }: ProductFormHeaderProps) {
  const { t } = useTranslation();
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="h4">
        {mode === "new" ? t("products.form.newTitle") : t("products.form.editTitle")}
      </Typography>
      <Button component={RouterLink} to="/admin" startIcon={<ArrowBackIcon />}>
        {t("nav.back")}
      </Button>
    </Stack>
  );
}
