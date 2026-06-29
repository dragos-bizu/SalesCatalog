import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import type { Product } from "../../domain/types";

export interface AdminProductsMobileListProps {
  products: Product[];
  loading: boolean;
  categoryMap: Map<string, string>;
  onDelete: (product: Product) => void;
}

/**
 * Mobile-friendly product management list using cards instead of a wide table.
 */
export function AdminProductsMobileList({
  products,
  loading,
  categoryMap,
  onDelete,
}: AdminProductsMobileListProps) {
  const { t } = useTranslation();

  return (
    <Stack spacing={1.25}>
      {products.map((p) => (
        <Card key={p.id} variant="outlined">
          <CardContent sx={{ pb: 1 }}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              {p.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("products.categoryChip", { name: categoryMap.get(p.categoryId) ?? p.categoryId })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("products.eanChip", { ean: p.ean || "-" })}
            </Typography>
          </CardContent>
          <CardActions sx={{ px: 2, pb: 1.5, pt: 0, gap: 1 }}>
            <Button
              component={RouterLink}
              to={`/admin/products/${p.id}/edit`}
              size="small"
              variant="outlined"
              startIcon={<EditOutlinedIcon fontSize="small" />}
              sx={{ flex: 1 }}
            >
              {t("common.edit")}
            </Button>
            <Button
              color="error"
              size="small"
              variant="outlined"
              startIcon={<DeleteOutlineIcon fontSize="small" />}
              onClick={() => onDelete(p)}
              sx={{ flex: 1 }}
            >
              {t("common.delete")}
            </Button>
          </CardActions>
        </Card>
      ))}

      {!loading && products.length === 0 && (
        <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
          <Typography color="text.secondary">{t("products.noProducts")}</Typography>
        </Paper>
      )}

      {loading && (
        <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
          <Typography color="text.secondary">{t("common.loading")}</Typography>
        </Paper>
      )}
    </Stack>
  );
}
