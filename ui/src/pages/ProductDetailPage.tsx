import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { ProductImageCarousel } from "../components/ProductImageCarousel";
import type { Product } from "../domain/types";
import { useCategoryManager } from "../managers/CategoryManager";
import { useProductManager } from "../managers/ProductManager";
import { ApiError } from "../services/api";

function DetailSkeleton() {
  return (
    <Paper sx={{ p: 3 }}>
      <Skeleton variant="text" width="50%" height={48} />
      <Skeleton variant="text" width="25%" />
      <Skeleton variant="rectangular" height={320} sx={{ mt: 2 }} />
      <Skeleton variant="text" sx={{ mt: 2 }} />
      <Skeleton variant="text" width="80%" />
      <Skeleton variant="text" width="60%" />
    </Paper>
  );
}

/** Public product detail page. */
export function ProductDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const productManager = useProductManager();
  const categoryManager = useCategoryManager();
  const { fetchOne } = productManager;
  const { items: categories, ensureLoaded: ensureCategoriesLoaded } = categoryManager;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!id) {
      setError(t("products.detailMissingId", "Missing product id"));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Non-blocking: category name lookup enrichment.
    void ensureCategoriesLoaded().catch(() => undefined);

    fetchOne(id)
      .then((p) => {
        if (cancelled) return;
        setProduct(p);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 404) {
          setError(t("products.detailNotFound"));
        } else {
          setError(e instanceof Error ? e.message : t("errors.loadProduct"));
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, fetchOne, ensureCategoriesLoaded, t]);

  const categoryName = useMemo(() => {
    if (!product) return null;
    return categories.find((c) => c.id === product.categoryId)?.name ?? product.categoryId;
  }, [product, categories]);

  if (loading) return <DetailSkeleton />;

  if (error) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }

  if (!product) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="warning">{t("products.noData")}</Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h4">{product.name}</Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", rowGap: 1 }}>
            <Chip size="small" label={t("products.categoryChip", { name: categoryName ?? "-" })} />
            {product.ean && <Chip size="small" label={t("products.eanChip", { ean: product.ean })} />}
          </Stack>
        </Box>

        <ProductImageCarousel productName={product.name} images={product.images} />

        <Box>
          <Typography variant="subtitle1" gutterBottom>
            {t("products.description")}
          </Typography>
          <Typography color="text.secondary">
            {product.description || t("common.noDescription")}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}
