import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SaveIcon from "@mui/icons-material/Save";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import type { Category } from "../domain/types";
import { useCategoryManager } from "../managers/CategoryManager";
import { ApiError } from "../services/api";

/**
 * Admin categories management page.
 *
 * Supports create, rename, and delete. Delete can fail with 409 when products
 * still reference a category; the error is shown in the snackbar.
 */
export function AdminCategoriesPage() {
  const categoryManager = useCategoryManager();
  const {
    items,
    loading,
    error: managerError,
    ensureLoaded,
    create,
    update,
    remove,
  } = categoryManager;

  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void ensureLoaded().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (managerError) setError(managerError);
  }, [managerError]);

  const sorted = useMemo(
    () => [...items].sort((a, b) => a.name.localeCompare(b.name)),
    [items],
  );

  async function onCreateCategory() {
    const name = newName.trim();
    if (!name || creating) return;

    setCreating(true);
    setError(null);
    try {
      await create({ name });
      setNewName("");
      setSuccess(`Category '${name}' created`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create category");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(category: Category) {
    setEditingId(category.id);
    setEditingName(category.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName("");
  }

  async function saveEdit() {
    if (!editingId || !editingName.trim() || savingEdit) return;

    setSavingEdit(true);
    setError(null);
    try {
      await update(editingId, { name: editingName.trim() });
      setSuccess("Category updated");
      cancelEdit();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update category");
    } finally {
      setSavingEdit(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;

    setDeleting(true);
    setError(null);
    try {
      await remove(deleteTarget.id);
      setSuccess("Category deleted");
      setDeleteTarget(null);
    } catch (e: unknown) {
      if (e instanceof ApiError && e.status === 409) {
        setError("Cannot delete category: it still has products.");
      } else {
        setError(e instanceof Error ? e.message : "Failed to delete category");
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4">Categories (admin)</Typography>
          <Button component={RouterLink} to="/admin" startIcon={<ArrowBackIcon />}>
            Back
          </Button>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <TextField
            fullWidth
            label="New category"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void onCreateCategory();
              }
            }}
          />
          <Button
            variant="contained"
            onClick={() => void onCreateCategory()}
            disabled={creating || !newName.trim()}
          >
            Add category
          </Button>
        </Stack>

        {loading && items.length === 0 && (
          <Typography color="text.secondary">Loading categories...</Typography>
        )}

        {!loading && sorted.length === 0 && (
          <Typography color="text.secondary">No categories yet.</Typography>
        )}

        <Stack spacing={1}>
          {sorted.map((c) => {
            const isEditing = editingId === c.id;
            return (
              <Paper key={c.id} variant="outlined" sx={{ p: 1.5 }}>
                {isEditing ? (
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <TextField
                      fullWidth
                      size="small"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void saveEdit();
                        }
                      }}
                    />
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={() => void saveEdit()}
                        disabled={savingEdit || !editingName.trim()}
                      >
                        Save
                      </Button>
                      <Button size="small" onClick={cancelEdit} disabled={savingEdit}>
                        Cancel
                      </Button>
                    </Stack>
                  </Stack>
                ) : (
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography>{c.name}</Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        startIcon={<EditOutlinedIcon fontSize="small" />}
                        onClick={() => startEdit(c)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteOutlineIcon fontSize="small" />}
                        onClick={() => setDeleteTarget(c)}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </Stack>
                )}
              </Paper>
            );
          })}
        </Stack>
      </Stack>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete category</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{" "}
            <strong>{deleteTarget?.name ?? "this category"}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button color="error" onClick={() => void confirmDelete()} disabled={deleting}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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
