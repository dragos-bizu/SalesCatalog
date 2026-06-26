// ImageManager
//
// Orchestrates the two-step image upload flow:
//   1. POST /admin/images/upload-url -> get presigned PUT URLs (one per file).
//   2. PUT each file directly to S3 with the matching Content-Type header.
// Returns the public CDN URLs (and S3 keys) for the uploaded files so the
// caller can store them on a product.

import { api } from "../services/api";
import type { ImageUpload } from "../domain/types";

export interface UploadedImage {
  /** S3 object key, e.g. "products/<uuid>.jpg". */
  key: string;
  /** Public CDN URL, e.g. "https://images.<domain>/products/<uuid>.jpg". */
  publicUrl: string;
}

/** Upload one or more image files via presigned PUT URLs. */
export async function uploadImages(files: File[]): Promise<UploadedImage[]> {
  if (files.length === 0) return [];

  // 1. Request presigned URLs.
  const contentTypes = files.map((f) => f.type);
  const { uploads } = await api.createImageUploadUrls(contentTypes);

  if (uploads.length !== files.length) {
    throw new Error("Mismatched number of upload URLs returned");
  }

  // 2. PUT each file directly to S3 (in parallel).
  await Promise.all(
    files.map((file, i) => putToS3(file, uploads[i])),
  );

  return uploads.map((u) => ({ key: u.key, publicUrl: u.publicUrl }));
}

async function putToS3(file: File, upload: ImageUpload): Promise<void> {
  const res = await fetch(upload.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": upload.contentType },
    body: file,
  });
  if (!res.ok) {
    throw new Error(`S3 upload failed (${res.status})`);
  }
}
