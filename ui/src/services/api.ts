// Thin HTTP client for the SalesCatalog API. No business logic here — just
// request building, auth header injection, and JSON/error handling.

import { config } from "../app/config";
import type {
  Category,
  CategoryInput,
  CreateProductInput,
  ImageUpload,
  ListProductsQuery,
  Product,
  ProductPage,
  SuggestDescriptionInput,
  SuggestDescriptionOutput,
  UpdateProductInput,
} from "../domain/types";

/** Error thrown for non-2xx API responses. */
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Auth token provider, injected by the auth layer. May return a token
// synchronously *or* asynchronously: the auth layer uses an async provider
// so it can transparently refresh near-expired tokens before each admin
// request. Returns null when no admin session exists.
export type TokenProvider = () =>
  | string
  | null
  | Promise<string | null>;

let tokenProvider: TokenProvider = () => null;

export function setTokenProvider(provider: TokenProvider): void {
  tokenProvider = provider;
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const { method = "GET", body, auth = false } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = await tokenProvider();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${config.apiBaseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    const message = data?.message ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }
  return data as T;
}

function buildQuery(params: Record<string, string | number | null | undefined>): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "") {
      usp.append(key, String(value));
    }
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

// --- Products -------------------------------------------------------------

export const api = {
  listProducts(query: ListProductsQuery = {}): Promise<ProductPage> {
    const qs = buildQuery({
      limit: query.limit,
      cursor: query.cursor,
      categoryId: query.categoryId,
      q: query.q,
    });
    return request<ProductPage>(`/products${qs}`);
  },

  getProduct(id: string): Promise<Product> {
    return request<Product>(`/products/${encodeURIComponent(id)}`);
  },

  createProduct(input: CreateProductInput): Promise<Product> {
    return request<Product>("/products", { method: "POST", body: input, auth: true });
  },

  updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
    return request<Product>(`/products/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: input,
      auth: true,
    });
  },

  deleteProduct(id: string): Promise<void> {
    return request<void>(`/products/${encodeURIComponent(id)}`, {
      method: "DELETE",
      auth: true,
    });
  },

  // --- Categories ---------------------------------------------------------

  listCategories(): Promise<{ items: Category[] }> {
    return request<{ items: Category[] }>("/categories");
  },

  createCategory(input: CategoryInput): Promise<Category> {
    return request<Category>("/categories", { method: "POST", body: input, auth: true });
  },

  updateCategory(id: string, input: CategoryInput): Promise<Category> {
    return request<Category>(`/categories/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: input,
      auth: true,
    });
  },

  deleteCategory(id: string): Promise<void> {
    return request<void>(`/categories/${encodeURIComponent(id)}`, {
      method: "DELETE",
      auth: true,
    });
  },

  // --- Images -------------------------------------------------------------

  createImageUploadUrls(
    contentTypes: string[],
  ): Promise<{ uploads: ImageUpload[] }> {
    return request<{ uploads: ImageUpload[] }>("/admin/images/upload-url", {
      method: "POST",
      body: { files: contentTypes.map((contentType) => ({ contentType })) },
      auth: true,
    });
  },

  suggestProductDescription(
    input: SuggestDescriptionInput,
  ): Promise<SuggestDescriptionOutput> {
    return request<SuggestDescriptionOutput>("/admin/products/description-suggest", {
      method: "POST",
      body: input,
      auth: true,
    });
  },
};
