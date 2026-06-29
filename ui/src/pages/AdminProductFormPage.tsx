import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { uploadImages } from "../managers/ImageManager";
import { useCategoryManager } from "../managers/CategoryManager";
import { useProductManager } from "../managers/ProductManager";

interface FormState {
  name: string;
  categoryId: string;
  ean: string;
  description: string;
  images: string[]; // backend expects keys (or URLs if already absolute)
}

const EMPTY_FORM: FormState = {
  name: "",
  categoryId: "",
  ean: "",
  description: "",
  images: [],
};

/**
 * Admin create/edit product form.
 *
 * - /admin/products/new      -> create mode
 * - /admin/products/:id/edit -> edit mode
 *
 * Supports:
 * - selecting an existing category
 * - creating a new category inline and selecting it immediately
 * - uploading product images (presigned URL flow)
 */
export function AdminProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const mode = id ? "edit" : "new";
  const navigate = useNavigate();

  const productManager = useProductManager();
  const categoryManager = useCategoryManager();

  const {
    create: createProduct,
    update: updateProduct,
    fetchOne,
  } = productManager;
  const {
    items: categories,
    ensureLoaded: ensureCategoriesLoaded,
    create: createCategory,
  } = categoryManager;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    void ensureCategoriesLoaded().catch((e: unknown) => {
      setError(e instanceof Error ? e.message : "Failed to load categories");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchOne(id)
      .then((p) => {
        if (cancelled) return;
        setForm({
          name: p.name,
          categoryId: p.categoryId,
          ean: p.ean,
          description: p.description,
          images: [...p.images],
        });
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load product");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, fetchOne]);

  const canSubmit = useMemo(
    () => form.name.trim().length > 0 && form.categoryId.trim().length > 0,
    [form.name, form.categoryId],
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit() {
    if (!canSubmit || saving) return;
    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: form.name.trim(),
        categoryId: form.categoryId,
        ean: form.ean.trim(),
        description: form.description.trim(),
        images: form.images,
      };

      if (mode === "new") {
        await createProduct(payload);
        setSuccess("Product created");
      } else if (id) {
        await updateProduct(id, payload);
        setSuccess("Product updated");
      }

      // Navigate back to the admin list after a short visual confirmation.
      setTimeout(() => navigate("/admin"), 250);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  async function onCreateCategory() {
    const name = newCategoryName.trim();
    if (!name || creatingCategory) return;

    setCreatingCategory(true);
    setError(null);
    try {
      const created = await createCategory({ name });
      setNewCategoryName("");
      update("categoryId", created.id);
      setSuccess(`Category '${created.name}' created`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create category");
    } finally {
      setCreatingCategory(false);
    }
  }

  function onSelectFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setSelectedFiles(files);
  }

  async function onUploadFiles() {
    if (selectedFiles.length === 0 || uploading) return;

    // Backend accepts max 5 per request, so upload in chunks.
    const chunks: File[][] = [];
    for (let i = 0; i < selectedFiles.length; i += 5) {
      chunks.push(selectedFiles.slice(i, i + 5));
    }

    setUploading(true);
    setError(null);
    try {
      const uploadedKeys: string[] = [];
      for (const chunk of chunks) {
        const uploaded = await uploadImages(chunk);
        uploadedKeys.push(...uploaded.map((u) => u.key));
      }
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedKeys],
      }));
      setSelectedFiles([]);
      setSuccess("Images uploaded");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to upload images");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <Paper sx={{ p: 3, textAlign: "center" }}>
        <CircularProgress size={24} />
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Loading product…
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4">
            {mode === "new" ? "New product" : "Edit product"}
          </Typography>
          <Button component={RouterLink} to="/admin" startIcon={<ArrowBackIcon />}>
            Back
          </Button>
        </Stack>

        <Stack spacing={2}>
          <TextField
            label="Name"
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
          />

          <FormControl fullWidth required>
            <InputLabel id="category-label">Category</InputLabel>
            <Select
              labelId="category-label"
              label="Category"
              value={form.categoryId}
              onChange={(e) => update("categoryId", e.target.value)}
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
              onChange={(e) => setNewCategoryName(e.target.value)}
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
            onChange={(e) => update("ean", e.target.value)}
          />

          <TextField
            label="Description"
            multiline
            minRows={3}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />

          <Divider />

          <Stack spacing={1}>
            <Typography variant="subtitle1">Images</Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
              <Button component="label" variant="outlined" startIcon={<AddPhotoAlternateIcon />}>
                Select files
                <input hidden multiple type="file" accept="image/*" onChange={onSelectFiles} />
              </Button>
              <Button
                variant="contained"
                onClick={onUploadFiles}
                disabled={uploading || selectedFiles.length === 0}
              >
                {uploading ? "Uploading…" : `Upload selected (${selectedFiles.length})`}
              </Button>
            </Stack>

            {form.images.length > 0 ? (
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {form.images.map((key) => (
                  <Chip
                    key={key}
                    label={key}
                    onDelete={() =>
                      setForm((prev) => ({
                        ...prev,
                        images: prev.images.filter((k) => k !== key),
                      }))
                    }
                  />
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary">No images uploaded yet.</Typography>
            )}
          </Stack>
        </Stack>

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
      </Stack>

      <Snackbar
        open={Boolean(error)}
        autoHideDuration={5000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={Boolean(success)}
        autoHideDuration={2500}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Paper>
  );
}
