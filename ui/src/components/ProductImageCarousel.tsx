import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Fade from "@mui/material/Fade";
import MobileStepper from "@mui/material/MobileStepper";
import Typography from "@mui/material/Typography";
import { type TouchEvent, useMemo, useRef, useState } from "react";
import { config } from "../app/config";

export interface ProductImageCarouselProps {
  productName: string;
  images: string[];
}

function toImageUrl(image: string): string | null {
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  const base = config.imagesBaseUrl?.trim();
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/${image.replace(/^\//, "")}`;
}

/**
 * Product image carousel used on the public product detail page.
 *
 * Features:
 * - Back/Next controls (when multiple images)
 * - Dots indicator via MUI MobileStepper
 * - Mobile swipe left/right support
 * - "No image" placeholder when no valid image URLs are available
 */
export function ProductImageCarousel({ productName, images }: ProductImageCarouselProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const imageUrls = useMemo(
    () => images.map((img) => toImageUrl(img)).filter((u): u is string => Boolean(u)),
    [images],
  );

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

    if (delta < 0 && canGoNext) {
      setActiveImageIndex((i) => i + 1);
    } else if (delta > 0 && canGoPrev) {
      setActiveImageIndex((i) => i - 1);
    }
  }

  if (!activeImage) {
    return (
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
    );
  }

  return (
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, overflow: "hidden" }}>
      <Fade in key={activeImage} timeout={220}>
        <Box
          component="img"
          src={activeImage}
          alt={`${productName} image ${activeImageIndex + 1}`}
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
            willChange: "opacity, transform",
          }}
        />
      </Fade>

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
  );
}
