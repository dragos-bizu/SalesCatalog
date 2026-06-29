import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useTranslation } from "react-i18next";
import type { Category } from "../../domain/types";

export interface ProductFormState {
  name: string;
  categoryId: string;
  ean: string;
  description: string;
  images: string[];
}

export interface ProductBasicFieldsProps {
  form: ProductFormState;
  categories: Category[];
  newCategoryName: string;
  creatingCategory: boolean;
  onFormChange: <K extends keyof ProductFormState>(
    key: K,
    value: ProductFormState[K],
  ) => void;
  onNewCategoryNameChange: (value: string) => void;
  onCreateCategory: () => void;
  onImproveDescription: () => void;
  improvingDescription: boolean;
}

/** Name/category/EAN/description section of the admin product form. */
export function ProductBasicFields({
  form,
  categories,
  newCategoryName,
  creatingCategory,
  onFormChange,
  onNewCategoryNameChange,
  onCreateCategory,
  onImproveDescription,
  improvingDescription,
}: ProductBasicFieldsProps) {
  const { t } = useTranslation();

  return (
    <Stack spacing={2}>
      <TextField
        label={t("products.form.name")}
        required
        value={form.name}
        onChange={(e) => onFormChange("name", e.target.value)}
      />

      <FormControl fullWidth required>
        <InputLabel id="category-label">{t("products.form.category")}</InputLabel>
        <Select
          labelId="category-label"
          label={t("products.form.category")}
          value={form.categoryId}
          onChange={(e) => onFormChange("categoryId", e.target.value)}
        >
          {categories.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <TextField
          fullWidth
          label={t("categories.createNewCategory")}
          value={newCategoryName}
          onChange={(e) => onNewCategoryNameChange(e.target.value)}
        />
        <Button
          variant="outlined"
          onClick={onCreateCategory}
          disabled={creatingCategory || !newCategoryName.trim()}
        >
          {t("categories.addCategory")}
        </Button>
      </Stack>

      <TextField
        label={t("products.form.ean")}
        value={form.ean}
        onChange={(e) => onFormChange("ean", e.target.value)}
      />

      <TextField
        label={t("products.form.description")}
        multiline
        minRows={3}
        value={form.description}
        onChange={(e) => onFormChange("description", e.target.value)}
      />

      <Stack direction="row" justifyContent="flex-end">
        <Button
          variant="outlined"
          onClick={onImproveDescription}
          disabled={improvingDescription || form.description.trim().length === 0}
        >
          {improvingDescription
            ? t("products.form.improvingDescription")
            : t("products.form.improveDescription")}
        </Button>
      </Stack>
    </Stack>
  );
}
