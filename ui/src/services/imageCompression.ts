// Client-side image compression.
//
// Phones produce very large photos (often 3–8 MB). Compressing in the browser
// before upload drastically reduces upload time/bandwidth and storage cost.
// Compression is best-effort: if the required browser APIs are unavailable
// (e.g. jsdom in tests, very old browsers) or anything fails, the original
// file is returned unchanged.

export interface CompressOptions {
  /** Longest edge (px) the image is scaled down to. */
  maxDimension: number;
  /** JPEG/WebP quality, 0..1. */
  quality: number;
  /** Output mime type. */
  outputType: "image/jpeg" | "image/webp";
  /** Skip compression for files smaller than this many bytes. */
  minBytes: number;
}

const DEFAULTS: CompressOptions = {
  maxDimension: 1600,
  quality: 0.8,
  outputType: "image/webp",
  minBytes: 200 * 1024, // 200 KB
};

function isBrowserCompressionSupported(): boolean {
  return (
    typeof document !== "undefined" &&
    typeof HTMLCanvasElement !== "undefined" &&
    typeof createImageBitmap === "function"
  );
}

function targetSize(
  width: number,
  height: number,
  maxDimension: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxDimension) return { width, height };
  const scale = maxDimension / longest;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

function renamedFile(original: File, blob: Blob, outputType: string): File {
  const ext = outputType === "image/webp" ? "webp" : "jpg";
  const baseName = original.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${baseName}.${ext}`, {
    type: outputType,
    lastModified: Date.now(),
  });
}

/**
 * Compress a single image file. Returns the original file unchanged when
 * compression is not possible or would not reduce size.
 */
export async function compressImage(
  file: File,
  options: Partial<CompressOptions> = {},
): Promise<File> {
  const opts = { ...DEFAULTS, ...options };

  // Only compress raster images; never touch non-images.
  if (!file.type.startsWith("image/")) return file;
  // Animated GIFs would lose animation if drawn to canvas; leave them alone.
  if (file.type === "image/gif") return file;
  if (file.size < opts.minBytes) return file;
  if (!isBrowserCompressionSupported()) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = targetSize(
      bitmap.width,
      bitmap.height,
      opts.maxDimension,
    );

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close?.();
      return file;
    }

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await canvasToBlob(canvas, opts.outputType, opts.quality);
    if (!blob) return file;

    // Keep the original if compression didn't actually help.
    if (blob.size >= file.size) return file;

    return renamedFile(file, blob, opts.outputType);
  } catch {
    return file;
  }
}

/** Compress multiple files in parallel (best-effort per file). */
export async function compressImages(
  files: File[],
  options: Partial<CompressOptions> = {},
): Promise<File[]> {
  return Promise.all(files.map((f) => compressImage(f, options)));
}
