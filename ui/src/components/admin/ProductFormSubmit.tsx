import SaveIcon from "@mui/icons-material/Save";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useTranslation } from "react-i18next";

export interface ProductFormSubmitProps {
  mode: "new" | "edit";
  saving: boolean;
  uploading: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
}

/** Submit action row for create/edit product. */
export function ProductFormSubmit({
  mode,
  saving,
  uploading,
  canSubmit,
  onSubmit,
}: ProductFormSubmitProps) {
  const { t } = useTranslation();

  return (
    <Box>
      <Button
        variant="contained"
        startIcon={<SaveIcon />}
        onClick={onSubmit}
        disabled={!canSubmit || saving || uploading}
      >
        {saving
          ? t("products.form.saving", "Saving…")
          : mode === "new"
            ? t("products.createProduct")
            : t("products.saveChanges")}
      </Button>
    </Box>
  );
}
