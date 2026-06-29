// Redux slice caching products. Supports paginated listing with filters and
// keeps the cache consistent after create/update/delete mutations.

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { api } from "../services/api";
import type { ListProductsQuery, Product } from "../domain/types";

interface CachedProductsPage {
  items: Product[];
  nextCursor: string | null;
  loaded: boolean;
  categoryId: string | null;
  q: string | null;
}

export interface ProductsState {
  items: Product[];
  nextCursor: string | null;
  loaded: boolean;
  loading: boolean;
  error: string | null;
  // The filters currently shown in `items`.
  activeCategoryId: string | null;
  activeQuery: string | null;
  // Multi-query cache (category + search) to avoid refetching when users
  // revisit already loaded filters.
  cacheByQuery: Record<string, CachedProductsPage>;
}

const initialState: ProductsState = {
  items: [],
  nextCursor: null,
  loaded: false,
  loading: false,
  error: null,
  activeCategoryId: null,
  activeQuery: null,
  cacheByQuery: {},
};

interface FetchArgs extends ListProductsQuery {
  /** When true, append to the current list (pagination); otherwise replace. */
  append?: boolean;
}

function normalized(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function toProductsQueryKey(query: ListProductsQuery = {}): string {
  const categoryId = normalized(query.categoryId ?? null) ?? "";
  const q = normalized(query.q ?? null) ?? "";
  return `cat:${categoryId}|q:${q}`;
}

function getFilters(query: ListProductsQuery = {}) {
  return {
    categoryId: normalized(query.categoryId ?? null),
    q: normalized(query.q ?? null),
  };
}

/** Fetch a page of products. */
export const fetchProducts = createAsyncThunk(
  "products/fetch",
  async (args: FetchArgs = {}) => {
    const page = await api.listProducts(args);
    return { page, args };
  },
);

const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    productsCacheActivated(state, action: PayloadAction<ListProductsQuery | undefined>) {
      const filters = getFilters(action.payload ?? {});
      const key = toProductsQueryKey(filters);
      const cached = state.cacheByQuery[key];
      if (!cached?.loaded) return;

      state.items = cached.items;
      state.nextCursor = cached.nextCursor;
      state.activeCategoryId = cached.categoryId;
      state.activeQuery = cached.q;
      state.loaded = true;
      state.error = null;
    },

    productUpserted(state, action: PayloadAction<Product>) {
      const product = action.payload;

      // Keep current visible list consistent.
      const idx = state.items.findIndex((p) => p.id === product.id);
      if (idx >= 0) state.items[idx] = product;
      else state.items.unshift(product);

      const activeKey = toProductsQueryKey({
        categoryId: state.activeCategoryId,
        q: state.activeQuery,
      });

      // Keep cached queries consistent without polluting unrelated filters.
      for (const [key, cached] of Object.entries(state.cacheByQuery)) {
        const cachedIdx = cached.items.findIndex((p) => p.id === product.id);
        if (cachedIdx >= 0) {
          cached.items[cachedIdx] = product;
          continue;
        }

        if (key === activeKey) {
          cached.items = [product, ...cached.items];
        }
      }
    },

    productRemoved(state, action: PayloadAction<string>) {
      const productId = action.payload;
      state.items = state.items.filter((p) => p.id !== productId);

      for (const cached of Object.values(state.cacheByQuery)) {
        cached.items = cached.items.filter((p) => p.id !== productId);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        const { page, args } = action.payload;
        const filters = getFilters(args);
        const key = toProductsQueryKey(filters);
        const previous = state.cacheByQuery[key];

        const items = args.append
          ? [...(previous?.items ?? []), ...page.items]
          : page.items;

        const cached: CachedProductsPage = {
          items,
          nextCursor: page.nextCursor,
          loaded: true,
          categoryId: filters.categoryId,
          q: filters.q,
        };

        state.cacheByQuery[key] = cached;

        state.items = cached.items;
        state.nextCursor = cached.nextCursor;
        state.activeCategoryId = cached.categoryId;
        state.activeQuery = cached.q;
        state.loaded = true;
        state.loading = false;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to load products";
      });
  },
});

export const { productsCacheActivated, productUpserted, productRemoved } =
  productsSlice.actions;
export default productsSlice.reducer;
