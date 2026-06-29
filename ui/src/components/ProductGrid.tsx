import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import type { Product } from "../domain/types";
import { ProductCard } from "./ProductCard";

export interface ProductGridProps {
  products: Product[];
  loading: boolean;
}

/**
 * Product grid with built-in loading skeletons and empty-state message.
 * Error handling is intentionally outside (snackbar in HomePage).
 */
export function ProductGrid({ products, loading }: ProductGridProps) {
  const { t } = useTranslation();

  if (loading && products.length === 0) {
    return (
      <Grid container spacing={2}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
            <Paper sx={{ p: 1 }}>
              <Skeleton variant="rectangular" height={180} />
              <Skeleton sx={{ mt: 1 }} />
              <Skeleton width="70%" />
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (!loading && products.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: "center" }}>
        <Typography color="text.secondary">{t("products.noProducts")}</Typography>
      </Paper>
    );
  }

  return (
    <Grid container spacing={2}>
      {products.map((p) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={p.id}>
          <ProductCard product={p} />
        </Grid>
      ))}
    </Grid>
  );
}
