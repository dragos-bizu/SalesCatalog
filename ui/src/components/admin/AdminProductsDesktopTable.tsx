import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import type { Product } from "../../domain/types";

export interface AdminProductsDesktopTableProps {
  products: Product[];
  loading: boolean;
  categoryMap: Map<string, string>;
  onDelete: (product: Product) => void;
}

/** Desktop/tablet management table for products. */
export function AdminProductsDesktopTable({
  products,
  loading,
  categoryMap,
  onDelete,
}: AdminProductsDesktopTableProps) {
  const { t } = useTranslation();

  return (
    <TableContainer>
      <Table size="small" aria-label="admin products table" sx={{ minWidth: 680 }}>
        <TableHead>
          <TableRow>
            <TableCell>{t("products.form.name")}</TableCell>
            <TableCell>{t("products.form.category")}</TableCell>
            <TableCell>{t("products.form.ean")}</TableCell>
            <TableCell align="right">{t("common.actions", "Actions")}</TableCell>
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
                    {t("common.edit")}
                  </Button>
                  <Button
                    color="error"
                    size="small"
                    startIcon={<DeleteOutlineIcon fontSize="small" />}
                    onClick={() => onDelete(p)}
                  >
                    {t("common.delete")}
                  </Button>
                </Stack>
              </TableCell>
            </TableRow>
          ))}

          {!loading && products.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} align="center">
                <Typography color="text.secondary">{t("products.noProducts")}</Typography>
              </TableCell>
            </TableRow>
          )}

          {loading && (
            <TableRow>
              <TableCell colSpan={4} align="center">
                <Typography color="text.secondary">{t("common.loading")}</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
