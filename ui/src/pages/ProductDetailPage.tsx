import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import MobileStepper from "@mui/material/MobileStepper";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { type TouchEvent, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { config } from "../app/config";
import type { Product } from "../domain/types";
import { useCategoryManager } from "../managers/CategoryManager";
import { useProductManager } from "../managers/ProductManager";
import { ApiError } from "../services/api";

function toImageUrl(image: string): string | null {
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  const base = config.imagesBaseUrl?.trim();
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/${image.replace(/^\//, "")}`;
}

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
  const { id } = useParams<{ id: string }>();
  const productManager = useProductManager();
  const categoryManager = useCategoryManager();
  const { fetchOne } = productManager;
  const { items: categories, ensureLoaded: ensureCategoriesLoaded } = categoryManager;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Touch-swipe state for mobile carousel gestures.
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!id) {
      setError("Missing product id");
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
        setActiveImageIndex(0);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 404) {
          setError("Product not found");
        } else {
          setError(e instanceof Error ? e.message : "Failed to load product");
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, fetchOne, ensureCategoriesLoaded]);

  const categoryName = useMemo(() => {
    if (!product) return null;
    return (
      categories.find((c) => c.id === product.categoryId)?.name ?? product.categoryId
    );
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
        <Alert severity="warning">No product data available.</Alert>
      </Paper>
    );
  }

  const imageUrls = product.images
    .map((img) => toImageUrl(img))
    .filter((u): u is string => Boolean(u));
  const hasImages = imageUrls.length > 0;
  const activeImage = hasImages ? imageUrls[activeImageIndex] : null;

  const canGoPrev = activeImageIndex > 0;
  const canGoNext = activeImageIndex < imageUrls.length - 1;

  const SWIPE_THRESHOLD_PX = 40;

  function onTouchStart(x: number) {
    touchStartX.current = x;
    touchEndX.current = null;
  }

  function onTouchMove(x: number) {
    touchEndX.current = x;
  }

  function onTouchEnd() {
    const start = touchStartX.current;
    const end = touchEndX.current;
    if (start == null || end == null || imageUrls.length <= 1) return;

    const delta = end - start;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;

    // Swipe left -> next image; swipe right -> previous image.
    if (delta < 0 && canGoNext) {
      setActiveImageIndex((i) => i + 1);
    } else if (delta > 0 && canGoPrev) {
      setActiveImageIndex((i) => i - 1);
    }
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h4">{product.name}</Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", rowGap: 1 }}>
            <Chip size="small" label={`Category: ${categoryName ?? "-"}`} />
            {product.ean && <Chip size="small" label={`EAN: ${product.ean}`} />}
          </Stack>
        </Box>

        {activeImage ? (
          <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, overflow: "hidden" }}>
            <Box
              component="img"
              src={activeImage}
              alt={`${product.name} image ${activeImageIndex + 1}`}
              onTouchStart={(e: TouchEvent<HTMLImageElement>) =>
                onTouchStart(e.changedTouches[0].clientX)
              }
              onTouchMove={(e: TouchEvent<HTMLImageElement>) =>
                onTouchMove(e.changedTouches[0].clientX)
              }
              onTouchEnd={onTouchEnd}
              sx={{
                width: "100%",
                maxHeight: 420,
                objectFit: "cover",
                display: "block",
                touchAction: "pan-y",
                userSelect: "none",
              }}
            />

            {imageUrls.length > 1 && (
              <MobileStepper
                variant="dots"
                steps={imageUrls.length}
                position="static"
                activeStep={activeImageIndex}
                nextButton={
                  <Button
                    size="small"
                    onClick={() => setActiveImageIndex((i) => i + 1)}
                    disabled={!canGoNext}
                    aria-label="Next image"
                  >
                    Next
                    <KeyboardArrowRightIcon />
                  </Button>
                }
                backButton={
                  <Button
                    size="small"
                    onClick={() => setActiveImageIndex((i) => i - 1)}
                    disabled={!canGoPrev}
                    aria-label="Previous image"
                  >
                    <KeyboardArrowLeftIcon />
                    Back
                  </Button>
                }
              />
            )}
          </Box>
        ) : (
          <Box
            sx={{
              height: 320,
              bgcolor: "common.white",
              color: "text.secondary",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
            }}
          >
            <Typography>No image</Typography>
          </Box>
        )}

        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Description
          </Typography>
          <Typography color="text.secondary">
            {product.description || "No description"}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}
