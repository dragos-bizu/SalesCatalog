import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ChangeEvent } from "react";

export interface ProductImagesSectionProps {
  images: string[];
  selectedFiles: File[];
  uploading: boolean;
  onSelectFiles: (e: ChangeEvent<HTMLInputElement>) => void;
  onUploadFiles: () => void;
  onRemoveImage: (key: string) => void;
}

/** Image upload + uploaded-key chips section of the admin product form. */
export function ProductImagesSection({
  images,
  selectedFiles,
  uploading,
  onSelectFiles,
  onUploadFiles,
  onRemoveImage,
}: ProductImagesSectionProps) {
  return (
    <>
      <Divider />

      <Stack spacing={1}>
        <Typography variant="subtitle1">Images</Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
          <Button component="label" variant="outlined" startIcon={<AddPhotoAlternateIcon />}>
            Select files
            <input hidden multiple type="file" accept="image/*" onChange={onSelectFiles} />
          </Button>
          <Button
            variant="contained"
            onClick={onUploadFiles}
            disabled={uploading || selectedFiles.length === 0}
          >
            {uploading ? "Uploading…" : `Upload selected (${selectedFiles.length})`}
          </Button>
        </Stack>

        {images.length > 0 ? (
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {images.map((key) => (
              <Chip key={key} label={key} onDelete={() => onRemoveImage(key)} />
            ))}
          </Stack>
        ) : (
          <Typography color="text.secondary">No images uploaded yet.</Typography>
        )}
      </Stack>
    </>
  );
}
