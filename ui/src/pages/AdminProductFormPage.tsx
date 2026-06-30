import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import {
  ProductBasicFields,
  type ProductFormState,
} from "../components/admin/ProductBasicFields";
import { ProductFormHeader } from "../components/admin/ProductFormHeader";
import { ProductFormSubmit } from "../components/admin/ProductFormSubmit";
import { ProductImagesSection } from "../components/admin/ProductImagesSection";
import { useCategoryManager } from "../managers/CategoryManager";
import { type UploadPhase, uploadImages } from "../managers/ImageManager";
import { useProductManager } from "../managers/ProductManager";

const EMPTY_FORM: ProductFormState = {
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
  const { t } = useTranslation();
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

  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    void ensureCategoriesLoaded().catch((e: unknown) => {
      setError(e instanceof Error ? e.message : t("errors.loadCategories"));
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
        setError(e instanceof Error ? e.message : t("errors.loadProduct"));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, fetchOne, t]);

  const canSubmit = useMemo(
    () => form.name.trim().length > 0 && form.categoryId.trim().length > 0,
    [form.name, form.categoryId],
  );

  function update<K extends keyof ProductFormState>(
    key: K,
    value: ProductFormState[K],
  ) {
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
        setSuccess(t("products.created"));
      } else if (id) {
        await updateProduct(id, payload);
        setSuccess(t("products.updated"));
      }

      // Navigate back to the admin list after a short visual confirmation.
      setTimeout(() => navigate("/admin"), 250);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("errors.saveProduct"));
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
      setSuccess(t("categories.created", { name: created.name }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("errors.createCategory"));
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
    setUploadPhase("compressing");
    setError(null);
    try {
      const uploadedKeys: string[] = [];
      for (const chunk of chunks) {
        const uploaded = await uploadImages(chunk, {
          onPhase: setUploadPhase,
        });
        uploadedKeys.push(...uploaded.map((u) => u.key));
      }
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedKeys],
      }));
      setSelectedFiles([]);
      setSuccess(t("products.form.imagesUploaded"));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("errors.uploadImages"));
    } finally {
      setUploading(false);
      setUploadPhase(null);
    }
  }

  if (loading) {
    return (
      <Paper sx={{ p: 3, textAlign: "center" }}>
        <CircularProgress size={24} />
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          {t("products.loadingProduct")}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={3}>
        <ProductFormHeader mode={mode} />

        <ProductBasicFields
          form={form}
          categories={categories}
          newCategoryName={newCategoryName}
          creatingCategory={creatingCategory}
          onFormChange={update}
          onNewCategoryNameChange={setNewCategoryName}
          onCreateCategory={onCreateCategory}
        />

        <ProductImagesSection
          images={form.images}
          selectedFiles={selectedFiles}
          uploading={uploading}
          uploadPhase={uploadPhase}
          onSelectFiles={onSelectFiles}
          onUploadFiles={onUploadFiles}
          onRemoveImage={(key) =>
            setForm((prev) => ({
              ...prev,
              images: prev.images.filter((k) => k !== key),
            }))
          }
        />

        <ProductFormSubmit
          mode={mode}
          saving={saving}
          uploading={uploading}
          canSubmit={canSubmit}
          onSubmit={onSubmit}
        />
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
