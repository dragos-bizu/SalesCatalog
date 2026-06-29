import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { CategoryTabs } from "../components/CategoryTabs";
import { SearchBar } from "../components/SearchBar";
import { useCategoryManager } from "../managers/CategoryManager";
import { useProductManager } from "../managers/ProductManager";
import type { Product } from "../domain/types";

/**
 * Admin products page.
 *
 * Table-style management view with search + category filter, edit/delete
 * actions, and cursor-based pagination.
 */
export function AdminProductsPage() {
  const categoryManager = useCategoryManager();
  const productManager = useProductManager();

  const {
    items: categories,
    error: categoriesError,
    ensureLoaded: ensureCategoriesLoaded,
  } = categoryManager;

  const {
    items: products,
    nextCursor,
    loading: productsLoading,
    error: productsError,
    ensureLoaded: ensureProductsLoaded,
    loadMore,
    remove,
  } = productManager;

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [appliedQuery, setAppliedQuery] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const query = useMemo(
    () => ({ categoryId: selectedCategoryId, q: appliedQuery }),
    [selectedCategoryId, appliedQuery],
  );

  useEffect(() => {
    void ensureCategoriesLoaded().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void ensureProductsLoaded(query).catch(() => undefined);
  }, [ensureProductsLoaded, query]);

  useEffect(() => {
    if (productsError || categoriesError) setSnackbarOpen(true);
  }, [productsError, categoriesError]);

  const activeError = productsError || categoriesError;

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) map.set(c.id, c.name);
    return map;
  }, [categories]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await remove(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      setSnackbarOpen(true);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h4">Products (admin)</Typography>
        <Stack direction="row" spacing={1}>
          <Button component={RouterLink} to="/admin/categories">
            Manage categories
          </Button>
          <Button
            component={RouterLink}
            to="/admin/products/new"
            variant="contained"
            startIcon={<AddIcon />}
          >
            New product
          </Button>
        </Stack>
      </Stack>

      <SearchBar
        value={searchInput}
        onChange={setSearchInput}
        onSearch={() => setAppliedQuery(searchInput.trim() || null)}
        disabled={productsLoading}
      />

      <CategoryTabs
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onChange={setSelectedCategoryId}
      />

      <Table size="small" aria-label="admin products table">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>EAN</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map((p) => (
            <TableRow key={p.id} hover>
              <TableCell>{p.name}</TableCell>
              <TableCell>{categoryMap.get(p.categoryId) ?? p.categoryId}</TableCell>
              <TableCell>{p.ean || "-"}</TableCell>
              <TableCell align="right">
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button
                    component={RouterLink}
                    to={`/admin/products/${p.id}/edit`}
                    size="small"
                    startIcon={<EditOutlinedIcon fontSize="small" />}
                  >
                    Edit
                  </Button>
                  <Button
                    color="error"
                    size="small"
                    startIcon={<DeleteOutlineIcon fontSize="small" />}
                    onClick={() => setDeleteTarget(p)}
                  >
                    Delete
                  </Button>
                </Stack>
              </TableCell>
            </TableRow>
          ))}

          {!productsLoading && products.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} align="center">
                <Typography color="text.secondary">No products found.</Typography>
              </TableCell>
            </TableRow>
          )}

          {productsLoading && (
            <TableRow>
              <TableCell colSpan={4} align="center">
                <Typography color="text.secondary">Loading...</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {nextCursor && (
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Button
            variant="outlined"
            onClick={() => loadMore(query)}
            disabled={productsLoading}
          >
            Load more
          </Button>
        </Box>
      )}

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete product</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{" "}
            <strong>{deleteTarget?.name ?? "this product"}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button color="error" onClick={confirmDelete} disabled={deleting}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen && Boolean(activeError)}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setSnackbarOpen(false)}>
          {activeError}
        </Alert>
      </Snackbar>
    </Paper>
  );
}
