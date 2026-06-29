import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router-dom";
import { config } from "../app/config";
import type { Product } from "../domain/types";

const PLACEHOLDER =
  "https://via.placeholder.com/640x360?text=No+image";

function toImageUrl(image: string): string {
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  return `${config.imagesBaseUrl.replace(/\/$/, "")}/${image.replace(/^\//, "")}`;
}

export interface ProductCardProps {
  product: Product;
}

/**
 * Single-responsibility product card used in product grids.
 */
export function ProductCard({ product }: ProductCardProps) {
  const image = product.images[0] ? toImageUrl(product.images[0]) : PLACEHOLDER;
  return (
    <Card>
      <CardActionArea component={RouterLink} to={`/products/${product.id}`}>
        <CardMedia component="img" height="180" image={image} alt={product.name} />
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
