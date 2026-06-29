import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CategoryTabs } from "../components/CategoryTabs";
import { ProductGrid } from "../components/ProductGrid";
import { SearchBar } from "../components/SearchBar";
import { useCategoryManager } from "../managers/CategoryManager";
import { useProductManager } from "../managers/ProductManager";

/**
 * Public home page.
 *
 * - Category tabs (including "All products")
 * - Explicit search input + button (no auto-search while typing)
 * - Product grid with MUI skeleton loading state
 * - Cursor-based pagination via "Load more"
 * - Error notifications in a top snackbar
 */
export function HomePage() {
  const { t } = useTranslation();
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
  } = productManager;

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [appliedQuery, setAppliedQuery] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const query = useMemo(
    () => ({ categoryId: selectedCategoryId, q: appliedQuery }),
    [selectedCategoryId, appliedQuery],
  );

  // Load categories once (cached thereafter).
  useEffect(() => {
    // Errors are surfaced through categoriesError and shown by the snackbar
    // effect below; no local catch-setState needed.
    void ensureCategoriesLoaded().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load products whenever the applied filters change.
  useEffect(() => {
    // Errors are surfaced through productsError.
    void ensureProductsLoaded(query).catch(() => undefined);
  }, [ensureProductsLoaded, query]);

  // Open snackbar whenever an error appears.
  useEffect(() => {
    if (productsError || categoriesError) {
      setSnackbarOpen(true);
    }
  }, [productsError, categoriesError]);

  const activeError = productsError || categoriesError;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>
        {t("products.title")}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        {t("products.browseHelp")}
      </Typography>

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

      <ProductGrid products={products} loading={productsLoading} />

      {nextCursor && (
        <Stack sx={{ mt: 2 }} direction="row" justifyContent="center">
          <Button
            variant="outlined"
            onClick={() => loadMore(query)}
            disabled={productsLoading}
          >
            {t("common.loadMore")}
          </Button>
        </Stack>
      )}

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
    </Box>
  );
}
