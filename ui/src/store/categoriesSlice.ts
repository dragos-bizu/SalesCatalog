// Redux slice caching the list of categories so navigation doesn't re-fetch.

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { api } from "../services/api";
import type { Category } from "../domain/types";

export interface CategoriesState {
  items: Category[];
  loaded: boolean; // true once a successful fetch has populated the cache
  loading: boolean;
  error: string | null;
}

const initialState: CategoriesState = {
  items: [],
  loaded: false,
  loading: false,
  error: null,
};

/** Fetch all categories from the API. */
export const fetchCategories = createAsyncThunk("categories/fetch", async () => {
  const res = await api.listCategories();
  return res.items;
});

const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    // Local cache updates after mutations (avoid a full refetch).
    categoryUpserted(state, action: PayloadAction<Category>) {
      const idx = state.items.findIndex((c) => c.id === action.payload.id);
      if (idx >= 0) state.items[idx] = action.payload;
      else state.items.push(action.payload);
    },
    categoryRemoved(state, action: PayloadAction<string>) {
      state.items = state.items.filter((c) => c.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loaded = true;
        state.loading = false;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to load categories";
      });
  },
});

export const { categoryUpserted, categoryRemoved } = categoriesSlice.actions;
export default categoriesSlice.reducer;
