import AddIcon from "@mui/icons-material/Add";
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
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { CategoryTabs } from "../components/CategoryTabs";
import { SearchBar } from "../components/SearchBar";
import { AdminProductsDesktopTable } from "../components/admin/AdminProductsDesktopTable";
import { AdminProductsMobileList } from "../components/admin/AdminProductsMobileList";
import type { Product } from "../domain/types";
import { useCategoryManager } from "../managers/CategoryManager";
import { useProductManager } from "../managers/ProductManager";

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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Typography variant="h4">Products (admin)</Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button component={RouterLink} to="/admin/categories" size={isMobile ? "small" : "medium"}>
            Manage categories
          </Button>
          <Button
            component={RouterLink}
            to="/admin/products/new"
            variant="contained"
            startIcon={<AddIcon />}
            size={isMobile ? "small" : "medium"}
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

      {isMobile ? (
        <AdminProductsMobileList
          products={products}
          loading={productsLoading}
          categoryMap={categoryMap}
          onDelete={setDeleteTarget}
        />
      ) : (
        <AdminProductsDesktopTable
          products={products}
          loading={productsLoading}
          categoryMap={categoryMap}
          onDelete={setDeleteTarget}
        />
      )}

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
