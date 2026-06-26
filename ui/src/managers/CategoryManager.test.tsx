import { configureStore } from "@reduxjs/toolkit";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { ReactNode } from "react";
import categoriesReducer from "../store/categoriesSlice";
import { useCategoryManager } from "./CategoryManager";
import { api } from "../services/api";

jest.mock("../services/api");
const mockApi = api as jest.Mocked<typeof api>;

function makeStore() {
  return configureStore({ reducer: { categories: categoriesReducer } });
}

function wrapper(store: ReturnType<typeof makeStore>) {
  return ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
}

const cat = (id: string, name: string) => ({
  id,
  name,
  createdAt: "2024",
  updatedAt: "2024",
});

describe("useCategoryManager", () => {
  afterEach(() => jest.resetAllMocks());

  it("ensureLoaded fetches on first call and skips on second", async () => {
    mockApi.listCategories.mockResolvedValue({ items: [cat("c1", "Fruit")] });
    const store = makeStore();
    const { result } = renderHook(() => useCategoryManager(), {
      wrapper: wrapper(store),
    });

    await act(async () => {
      await result.current.ensureLoaded();
    });
    expect(mockApi.listCategories).toHaveBeenCalledTimes(1);
    expect(result.current.items).toHaveLength(1);

    // Cached: should not call again.
    await act(async () => {
      await result.current.ensureLoaded();
    });
    expect(mockApi.listCategories).toHaveBeenCalledTimes(1);
  });

  it("ensureLoaded({ force: true }) bypasses cache", async () => {
    mockApi.listCategories.mockResolvedValue({ items: [] });
    const store = makeStore();
    const { result } = renderHook(() => useCategoryManager(), {
      wrapper: wrapper(store),
    });

    await act(async () => {
      await result.current.ensureLoaded();
    });
    await act(async () => {
      await result.current.ensureLoaded({ force: true });
    });
    expect(mockApi.listCategories).toHaveBeenCalledTimes(2);
  });

  it("create dispatches upsert into the cache", async () => {
    const store = makeStore();
    const created = cat("c1", "Fruit");
    mockApi.createCategory.mockResolvedValue(created);

    const { result } = renderHook(() => useCategoryManager(), {
      wrapper: wrapper(store),
    });

    await act(async () => {
      await result.current.create({ name: "Fruit" });
    });

    await waitFor(() => {
      expect(result.current.items).toEqual([created]);
    });
  });

  it("remove dispatches the removal", async () => {
    const store = makeStore();
    mockApi.createCategory.mockResolvedValue(cat("c1", "Fruit"));
    mockApi.deleteCategory.mockResolvedValue(undefined);

    const { result } = renderHook(() => useCategoryManager(), {
      wrapper: wrapper(store),
    });

    await act(async () => {
      await result.current.create({ name: "Fruit" });
    });
    expect(result.current.items).toHaveLength(1);

    await act(async () => {
      await result.current.remove("c1");
    });
    expect(result.current.items).toHaveLength(0);
  });
});
