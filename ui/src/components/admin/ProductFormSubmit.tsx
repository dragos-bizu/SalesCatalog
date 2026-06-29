import SaveIcon from "@mui/icons-material/Save";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

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
  return (
    <Box>
      <Button
        variant="contained"
        startIcon={<SaveIcon />}
        onClick={onSubmit}
        disabled={!canSubmit || saving || uploading}
      >
        {saving ? "Saving…" : mode === "new" ? "Create product" : "Save changes"}
      </Button>
    </Box>
  );
}
