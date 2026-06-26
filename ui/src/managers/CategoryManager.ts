// CategoryManager
//
// Cache-aware orchestrator between components and the categories API/store.
// Components call these methods; the manager:
//   - serves data from the Redux cache when available,
//   - fetches only on cache miss or explicit refresh,
//   - keeps the cache consistent after mutations (no full refetch needed).

import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import { api } from "../services/api";
import {
  categoryRemoved,
  categoryUpserted,
  fetchCategories,
} from "../store/categoriesSlice";
import type { Category, CategoryInput } from "../domain/types";

export interface UseCategoryManager {
  items: Category[];
  loaded: boolean;
  loading: boolean;
  error: string | null;
  /** Fetch categories only if the cache is empty (or when forced). */
  ensureLoaded(options?: { force?: boolean }): Promise<void>;
  create(input: CategoryInput): Promise<Category>;
  update(id: string, input: CategoryInput): Promise<Category>;
  remove(id: string): Promise<void>;
}

export function useCategoryManager(): UseCategoryManager {
  const dispatch = useAppDispatch();
  const state = useAppSelector((s) => s.categories);

  const ensureLoaded = useCallback(
    async ({ force = false }: { force?: boolean } = {}) => {
      if (state.loading) return;
      if (state.loaded && !force) return;
      await dispatch(fetchCategories()).unwrap();
    },
    [dispatch, state.loaded, state.loading],
  );

  const create = useCallback(
    async (input: CategoryInput) => {
      const created = await api.createCategory(input);
      dispatch(categoryUpserted(created));
      return created;
    },
    [dispatch],
  );

  const update = useCallback(
    async (id: string, input: CategoryInput) => {
      const updated = await api.updateCategory(id, input);
      dispatch(categoryUpserted(updated));
      return updated;
    },
    [dispatch],
  );

  const remove = useCallback(
    async (id: string) => {
      await api.deleteCategory(id);
      dispatch(categoryRemoved(id));
    },
    [dispatch],
  );

  return {
    items: state.items,
    loaded: state.loaded,
    loading: state.loading,
    error: state.error,
    ensureLoaded,
    create,
    update,
    remove,
  };
}
