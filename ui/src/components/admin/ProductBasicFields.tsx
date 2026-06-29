import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
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
}: ProductBasicFieldsProps) {
  return (
    <Stack spacing={2}>
      <TextField
        label="Name"
        required
        value={form.name}
        onChange={(e) => onFormChange("name", e.target.value)}
      />

      <FormControl fullWidth required>
        <InputLabel id="category-label">Category</InputLabel>
        <Select
          labelId="category-label"
          label="Category"
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
          label="Create new category"
          value={newCategoryName}
          onChange={(e) => onNewCategoryNameChange(e.target.value)}
        />
        <Button
          variant="outlined"
          onClick={onCreateCategory}
          disabled={creatingCategory || !newCategoryName.trim()}
        >
          Add category
        </Button>
      </Stack>

      <TextField
        label="EAN"
        value={form.ean}
        onChange={(e) => onFormChange("ean", e.target.value)}
      />

      <TextField
        label="Description"
        multiline
        minRows={3}
        value={form.description}
        onChange={(e) => onFormChange("description", e.target.value)}
      />
    </Stack>
  );
}
