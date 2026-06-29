import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { config } from "../../app/config";

export interface ProductImagesSectionProps {
  images: string[];
  selectedFiles: File[];
  uploading: boolean;
  onSelectFiles: (e: ChangeEvent<HTMLInputElement>) => void;
  onUploadFiles: () => void;
  onRemoveImage: (key: string) => void;
}

/** Image upload + uploaded-key chips section of the admin product form. */
function toImageUrl(image: string): string | null {
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  const base = config.imagesBaseUrl?.trim();
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/${image.replace(/^\//, "")}`;
}

export function ProductImagesSection({
  images,
  selectedFiles,
  uploading,
  onSelectFiles,
  onUploadFiles,
  onRemoveImage,
}: ProductImagesSectionProps) {
  const { t } = useTranslation();

  return (
    <>
      <Divider />

      <Stack spacing={1}>
        <Typography variant="subtitle1">{t("products.form.images")}</Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
          <Button component="label" variant="outlined" startIcon={<AddPhotoAlternateIcon />}>
            {t("products.form.selectFiles")}
            <input hidden multiple type="file" accept="image/*" onChange={onSelectFiles} />
          </Button>
          <Button
            variant="contained"
            onClick={onUploadFiles}
            disabled={uploading || selectedFiles.length === 0}
          >
            {uploading
              ? t("products.form.uploading")
              : t("products.form.uploadSelected", { count: selectedFiles.length })}
          </Button>
        </Stack>

        {images.length > 0 ? (
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {images.map((key, index) => {
              const src = toImageUrl(key);
              return (
                <Box
                  key={key}
                  sx={{
                    position: "relative",
                    width: 84,
                    height: 84,
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1,
                    overflow: "hidden",
                    bgcolor: "common.white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {src ? (
                    <Box
                      component="img"
                      src={src}
                      alt={t("products.imageAlt", { name: t("products.newProduct"), index: index + 1 })}
                      sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      {t("products.form.preview", "Preview")}
                    </Typography>
                  )}

                  <IconButton
                    aria-label={t("products.form.removeImageAria", "Remove image {{index}}", { index: index + 1 })}
                    size="small"
                    onClick={() => onRemoveImage(key)}
                    sx={{
                      position: "absolute",
                      top: 2,
                      right: 2,
                      bgcolor: "rgba(0,0,0,0.55)",
                      color: "common.white",
                      "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              );
            })}
          </Stack>
        ) : (
          <Typography color="text.secondary">{t("products.form.noImages")}</Typography>
        )}
      </Stack>
    </>
  );
}
