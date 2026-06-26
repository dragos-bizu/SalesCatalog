// Domain models shared across the app. These mirror the API contract.

/** A product category. */
export interface Category {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/** A product in the catalog. */
export interface Product {
  id: string;
  ean: string;
  categoryId: string;
  name: string;
  description: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

/** A paginated list response from the products endpoint. */
export interface ProductPage {
  items: Product[];
  nextCursor: string | null;
}

/** Query options for listing products. */
export interface ListProductsQuery {
  limit?: number;
  cursor?: string | null;
  categoryId?: string | null;
  q?: string | null;
}

/** Payload to create a product (server generates id/timestamps). */
export interface CreateProductInput {
  name: string;
  categoryId: string;
  ean?: string;
  description?: string;
  images?: string[];
}

/** Payload to update a product (all fields optional / partial update). */
export type UpdateProductInput = Partial<CreateProductInput>;

/** Payload to create or rename a category. */
export interface CategoryInput {
  name: string;
}

/** A single presigned image upload slot returned by the API. */
export interface ImageUpload {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  contentType: string;
}
