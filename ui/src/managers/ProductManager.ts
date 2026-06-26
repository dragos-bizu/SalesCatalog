// ProductManager
//
// Cache-aware orchestrator for products. Handles paginated listing with
// filters (categoryId, q) and post-mutation cache updates.
//
// Caching rule: a refetch is triggered when the requested filters differ
// from what is currently cached, or when the cache is empty, or when the
// caller explicitly forces a refresh. Otherwise the cached page is reused.

import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import { api } from "../services/api";
import {
  fetchProducts,
  productRemoved,
  productUpserted,
} from "../store/productsSlice";
import type {
  CreateProductInput,
  ListProductsQuery,
  Product,
  UpdateProductInput,
} from "../domain/types";

export interface UseProductManager {
  items: Product[];
  nextCursor: string | null;
  loaded: boolean;
  loading: boolean;
  error: string | null;
  /** Load a page, reusing cache when filters match (unless forced). */
  ensureLoaded(
    query?: ListProductsQuery,
    options?: { force?: boolean },
  ): Promise<void>;
  /** Append the next page, if any. No-op when there is no nextCursor. */
  loadMore(query?: ListProductsQuery): Promise<void>;
  getById(id: string): Product | undefined;
  /** Fetch a single product, falling back to the cache first. */
  fetchOne(id: string): Promise<Product>;
  create(input: CreateProductInput): Promise<Product>;
  update(id: string, input: UpdateProductInput): Promise<Product>;
  remove(id: string): Promise<void>;
}

function filtersMatch(
  state: { activeCategoryId: string | null; activeQuery: string | null },
  query: ListProductsQuery,
): boolean {
  const wantedCat = query.categoryId ?? null;
  const wantedQ = query.q ?? null;
  return state.activeCategoryId === wantedCat && state.activeQuery === wantedQ;
}

export function useProductManager(): UseProductManager {
  const dispatch = useAppDispatch();
  const state = useAppSelector((s) => s.products);

  const ensureLoaded = useCallback(
    async (
      query: ListProductsQuery = {},
      { force = false }: { force?: boolean } = {},
    ) => {
      if (state.loading) return;
      const matches = filtersMatch(state, query);
      if (state.loaded && matches && !force) return;
      await dispatch(fetchProducts(query)).unwrap();
    },
    [dispatch, state],
  );

  const loadMore = useCallback(
    async (query: ListProductsQuery = {}) => {
      if (state.loading || !state.nextCursor) return;
      await dispatch(
        fetchProducts({ ...query, cursor: state.nextCursor, append: true }),
      ).unwrap();
    },
    [dispatch, state.loading, state.nextCursor],
  );

  const getById = useCallback(
    (id: string) => state.items.find((p) => p.id === id),
    [state.items],
  );

  const fetchOne = useCallback(
    async (id: string) => {
      const cached = state.items.find((p) => p.id === id);
      if (cached) return cached;
      const fetched = await api.getProduct(id);
      dispatch(productUpserted(fetched));
      return fetched;
    },
    [dispatch, state.items],
  );

  const create = useCallback(
    async (input: CreateProductInput) => {
      const created = await api.createProduct(input);
      dispatch(productUpserted(created));
      return created;
    },
    [dispatch],
  );

  const update = useCallback(
    async (id: string, input: UpdateProductInput) => {
      const updated = await api.updateProduct(id, input);
      dispatch(productUpserted(updated));
      return updated;
    },
    [dispatch],
  );

  const remove = useCallback(
    async (id: string) => {
      await api.deleteProduct(id);
      dispatch(productRemoved(id));
    },
    [dispatch],
  );

  return {
    items: state.items,
    nextCursor: state.nextCursor,
    loaded: state.loaded,
    loading: state.loading,
    error: state.error,
    ensureLoaded,
    loadMore,
    getById,
    fetchOne,
    create,
    update,
    remove,
  };
}
