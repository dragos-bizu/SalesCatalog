import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router-dom";
import { config } from "../app/config";
import type { Product } from "../domain/types";

function toImageUrl(image: string): string | null {
  // Already absolute URL (e.g. when backend stored publicUrl directly).
  if (image.startsWith("http://") || image.startsWith("https://")) return image;

  // Relative key (e.g. products/<uuid>.jpg) needs the CDN base URL.
  const base = config.imagesBaseUrl?.trim();
  if (!base) return null;

  return `${base.replace(/\/$/, "")}/${image.replace(/^\//, "")}`;
}

export interface ProductCardProps {
  product: Product;
}

/**
 * Single-responsibility product card used in product grids.
 */
export function ProductCard({ product }: ProductCardProps) {
  const image = product.images[0] ? toImageUrl(product.images[0]) : null;
  return (
    <Card>
      <CardActionArea component={RouterLink} to={`/products/${product.id}`}>
        {image ? (
          <CardMedia component="img" height="180" image={image} alt={product.name} />
        ) : (
          <Box
            sx={{
              height: 180,
              bgcolor: "common.white",
              color: "text.secondary",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <Typography variant="body2">No image</Typography>
          </Box>
        )}
        <CardContent>
          <Typography variant="h6" noWrap title={product.name}>
            {product.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {product.description || "No description"}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
