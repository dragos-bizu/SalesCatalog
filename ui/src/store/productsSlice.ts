// Redux slice caching products. Supports paginated listing with filters and
// keeps the cache consistent after create/update/delete mutations.

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { api } from "../services/api";
import type { ListProductsQuery, Product } from "../domain/types";

export interface ProductsState {
  items: Product[];
  nextCursor: string | null;
  loaded: boolean;
  loading: boolean;
  error: string | null;
  // The filters the cached items currently represent.
  activeCategoryId: string | null;
  activeQuery: string | null;
}

const initialState: ProductsState = {
  items: [],
  nextCursor: null,
  loaded: false,
  loading: false,
  error: null,
  activeCategoryId: null,
  activeQuery: null,
};

interface FetchArgs extends ListProductsQuery {
  /** When true, append to the current list (pagination); otherwise replace. */
  append?: boolean;
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
    productUpserted(state, action: PayloadAction<Product>) {
      const idx = state.items.findIndex((p) => p.id === action.payload.id);
      if (idx >= 0) state.items[idx] = action.payload;
      else state.items.unshift(action.payload);
    },
    productRemoved(state, action: PayloadAction<string>) {
      state.items = state.items.filter((p) => p.id !== action.payload);
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
        if (args.append) {
          state.items = [...state.items, ...page.items];
        } else {
          state.items = page.items;
        }
        state.nextCursor = page.nextCursor;
        state.activeCategoryId = args.categoryId ?? null;
        state.activeQuery = args.q ?? null;
        state.loaded = true;
        state.loading = false;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to load products";
      });
  },
});

export const { productUpserted, productRemoved } = productsSlice.actions;
export default productsSlice.reducer;
